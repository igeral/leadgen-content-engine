// ─── API KEY MANAGEMENT ───
const ENV_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export function getApiKey(manualKey) {
  return (manualKey || '').trim() || ENV_KEY.trim();
}

export function isLiveMode(manualKey) {
  return getApiKey(manualKey).length > 0;
}

export function isUsingEnvKey(manualKey) {
  return !(manualKey || '').trim() && ENV_KEY.trim().length > 0;
}

// ─── TEXT MODELS ───
export const TEXT_MODELS = [
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (Best for content)', tier: 'premium' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (Great all-rounder)', tier: 'premium' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro (Strong writer)', tier: 'premium' },
  { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4 (Fast & cheap)', tier: 'budget' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Budget-friendly)', tier: 'budget' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick (Open source)', tier: 'budget' },
];

// ─── IMAGE MODELS ───
export const IMAGE_MODELS = [
  { id: 'openai/gpt-image-1', name: 'GPT Image 1 (Best quality)', modalities: ['image', 'text'] },
  { id: 'google/gemini-2.5-flash-preview:image-generation', name: 'Gemini Flash Image (Fast + cheap)', modalities: ['image', 'text'] },
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro (Photorealistic)', modalities: ['image'] },
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell (Fastest)', modalities: ['image'] },
  { id: 'stability/stable-diffusion-3.5-large', name: 'Stable Diffusion 3.5 Large', modalities: ['image'] },
];

// ─── SHARED HEADERS ───
function apiHeaders(key) {
  return {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.href,
    'X-Title': 'LeadGen Content Engine',
  };
}

// ─── TEXT GENERATION ───
export async function callOpenRouter(manualKey, model, sysPrompt, userPrompt) {
  const key = getApiKey(manualKey);
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `API error: ${resp.status}`);
  }
  return (await resp.json()).choices[0].message.content;
}

// ─── EXTRACT IMAGE URL FROM RESPONSE ───
function extractImageUrl(data) {
  const msg = data.choices?.[0]?.message;
  const content = msg?.content;

  // 1. Check native_images first (most reliable)
  if (data.choices?.[0]?.native_images?.length > 0) {
    return data.choices[0].native_images[0];
  }

  // 2. Check message-level images array
  if (msg?.images?.length > 0) {
    return msg.images[0];
  }

  // 3. Handle structured content arrays
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && (part.image_url?.url || part.url)) {
        return part.image_url?.url || part.url;
      }
      if (part.type === 'image') {
        if (part.source?.data) {
          return `data:${part.source.media_type || 'image/png'};base64,${part.source.data}`;
        }
        if (part.image_url?.url) return part.image_url.url;
        if (part.url) return part.url;
      }
    }
  }

  // 4. Handle string responses
  if (typeof content === 'string') {
    // Markdown image
    const md = content.match(/!\[.*?\]\((.*?)\)/);
    if (md) return md[1];
    // Base64 data URI
    const b64 = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (b64) return b64[0];
    // Any URL with image extension
    const extUrl = content.match(/(https?:\/\/[^\s"'\)]+\.(png|jpg|jpeg|webp|gif)[^\s"'\)]*)/i);
    if (extUrl) return extUrl[1];
    // OpenRouter/OpenAI generation URLs (no extension but valid image)
    const genUrl = content.match(/(https?:\/\/[^\s"'\)]+\/(generation|image|img)[^\s"'\)]*)/i);
    if (genUrl) return genUrl[1];
    // Any https URL on its own line (likely an image URL)
    const lineUrl = content.trim().match(/^(https?:\/\/[^\s]+)$/m);
    if (lineUrl) return lineUrl[1];
  }

  return null;
}

// ─── SINGLE IMAGE GENERATION ───
export async function callImageAPI(manualKey, model, prompt) {
  const key = getApiKey(manualKey);
  const mc = IMAGE_MODELS.find((m) => m.id === model) || IMAGE_MODELS[0];

  const body = {
    model: mc.id,
    messages: [{ role: 'user', content: prompt }],
    modalities: mc.modalities,
  };
  // Only add image_config for models that support it
  if (mc.modalities.includes('text')) {
    body.image_config = { aspect_ratio: '16:9' };
  }

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `Image API error: ${resp.status}`);
  }

  const data = await resp.json();
  const url = extractImageUrl(data);
  if (url) return url;

  // Debug: log what we got back so user can report
  console.error('[LeadGen] Image response format unrecognized:', JSON.stringify(data).substring(0, 500));
  throw new Error('No image in response. Try a different model.');
}

// ─── GENERATE MULTIPLE CONTENT-MATCHED IMAGE PROMPTS ───
export async function generateImagePrompts(manualKey, textModel, postText, brand, count = 5) {
  const key = getApiKey(manualKey);
  const prompt = `You are a social media visual strategist. Based on the post below, generate exactly ${count} different image descriptions for AI image generation. Each image must directly illustrate a different aspect of the post content.

POST:
${postText}

BRAND: ${brand.name || 'B2B Company'}
BRAND COLORS: navy (#1a365d), steel blue (#2c5282), accent blue (#3182ce)

RULES:
- Each description must be a specific, detailed image generation prompt (2-3 sentences)
- Images must be professional, modern, corporate — suitable for LinkedIn/Facebook
- Each image should cover a DIFFERENT angle/message from the post
- Include composition, mood, color palette, and style details
- Format: 16:9 landscape, clean and modern
- No text overlay in images — purely visual
- No stock photo cliches (no handshakes, no pointing at screens)
- Types to mix: data visualizations, professional scenes, conceptual illustrations, environmental shots, abstract representations

Return ONLY a JSON array of ${count} strings. No commentary, no markdown, no code blocks. Example:
["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]`;

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      model: textModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 1500,
    }),
  });

  if (!resp.ok) {
    throw new Error('Failed to generate image prompts');
  }

  const data = await resp.json();
  let raw = data.choices?.[0]?.message?.content || '';

  // Strip markdown code blocks if present
  raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const prompts = JSON.parse(raw);
    if (Array.isArray(prompts) && prompts.length >= 1) {
      return prompts.slice(0, count);
    }
  } catch {
    // Fallback: try to extract quoted strings
    const matches = raw.match(/"([^"]{20,})"/g);
    if (matches && matches.length >= 1) {
      return matches.slice(0, count).map((s) => s.replace(/^"|"$/g, ''));
    }
  }

  throw new Error('Could not parse image prompts from AI response');
}

// ─── BATCH IMAGE GENERATION ───
export async function generateMultipleImages(manualKey, imageModel, prompts, onProgress) {
  const results = [];
  for (let i = 0; i < prompts.length; i++) {
    if (onProgress) onProgress(i, prompts.length);
    try {
      const url = await callImageAPI(manualKey, imageModel, prompts[i]);
      results.push({ url, prompt: prompts[i], error: null });
    } catch (e) {
      results.push({ url: null, prompt: prompts[i], error: e.message });
    }
  }
  return results;
}

// ─── PROMPT BUILDERS ───
export function buildSystemPrompt(brand, platform) {
  return `You are an expert social media content strategist for B2B lead generation on ${platform}.

BRAND: ${brand.name || 'the client'}
Tagline: ${brand.tagline || 'N/A'}
Category: ${brand.category || 'N/A'}
Pillars: ${brand.pillars.map((p) => p.name).join(', ')}

RULES:
- Direct, authoritative voice
- Short paragraphs, line breaks for readability
- Hook in first 2 lines
- CTA or question at end
- ${platform === 'LinkedIn' ? 'Use arrow symbols for lists. Professional but human.' : 'Warmer tone, occasional emojis. Shareable.'}
- 3-5 hashtags at end
- 150-300 words
- No filler. Every sentence earns its place.`;
}

export function buildUserPrompt(pillar, audience, topic, dataPoints, imageStyle) {
  let p = `Write a ${pillar.name} post targeting ${audience || pillar.audience}.`;
  if (topic) p += `\n\nTopic: ${topic}`;
  if (dataPoints?.length) {
    p += `\n\nData points (use 1-2 max):\n${dataPoints.map((d) => `- ${d}`).join('\n')}`;
  }
  if (imageStyle === 'stat') p += '\n\nPaired with a single-stat image card. Reference a key number.';
  if (imageStyle === 'multi') p += '\n\nPaired with a 3-image set (problem→context→solution).';
  if (imageStyle === 'quote') p += '\n\nPaired with a quote card. Lead with a strong opinion.';
  p += '\n\nReturn ONLY the raw post text. No labels or commentary.';
  return p;
}

export function buildImagePrompt(brand, pillar, style) {
  const base = `Professional social media image for ${brand.name || 'a B2B company'}. Colors: navy (#1a365d), steel blue (#2c5282), accent (#3182ce). Clean, modern, corporate. No stock cliches. 16:9 landscape.`;
  if (style === 'stat') {
    return base + ` Bold single-statistic infographic. One large striking number. Dark navy gradient. Minimal text. Data-driven feel. Topic: ${pillar.name}.`;
  }
  if (style === 'quote') {
    return base + ' Thought leadership quote card. Steel blue gradient. Large quotation mark. Main quote left, context panel right. Authoritative.';
  }
  return base + ' First card of a 3-part carousel. Light bg, dark navy sidebar showing "1 of 3". Topic label, large title, bullet points.';
}
