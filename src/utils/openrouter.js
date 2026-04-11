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
  { id: 'openai/gpt-image-1', name: 'GPT Image 1 (Best quality)', modalities: ['text', 'image'] },
  { id: 'google/gemini-2.5-flash-preview:image-generation', name: 'Gemini Flash Image (Fast + cheap)', modalities: ['text', 'image'] },
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro (Photorealistic)', modalities: ['image'] },
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell (Fastest)', modalities: ['image'] },
  { id: 'stability/stable-diffusion-3.5-large', name: 'Stable Diffusion 3.5 Large', modalities: ['image'] },
];

// ─── TEXT GENERATION ───
export async function callOpenRouter(manualKey, model, sysPrompt, userPrompt) {
  const key = getApiKey(manualKey);
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'LeadGen Content Engine',
    },
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

// ─── IMAGE GENERATION ───
export async function callImageAPI(manualKey, model, prompt) {
  const key = getApiKey(manualKey);
  const mc = IMAGE_MODELS.find((m) => m.id === model) || IMAGE_MODELS[0];
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'LeadGen Content Engine',
    },
    body: JSON.stringify({
      model: mc.id,
      messages: [{ role: 'user', content: prompt }],
      modalities: mc.modalities,
      image_config: { aspect_ratio: '16:9' },
    }),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `Image API error: ${resp.status}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;

  // Handle string responses (markdown images, bare URLs, base64)
  if (typeof content === 'string') {
    const md = content.match(/!\[.*?\]\((.*?)\)/);
    if (md) return md[1];
    const url = content.match(/(https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp)[^\s"']*)/i);
    if (url) return url[1];
    const b64 = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (b64) return b64[0];
  }

  // Handle structured content arrays
  if (Array.isArray(content)) {
    for (const p of content) {
      if (p.type === 'image_url') return p.image_url?.url || p.url;
      if (p.type === 'image' && p.source?.data) {
        return `data:${p.source.media_type || 'image/png'};base64,${p.source.data}`;
      }
    }
  }

  // Handle native_images
  if (data.choices?.[0]?.native_images?.length > 0) {
    return data.choices[0].native_images[0];
  }

  throw new Error('No image in response. Try a different model.');
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
