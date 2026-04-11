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

// ─── IMAGE MODELS (verified live on OpenRouter) ───
export const IMAGE_MODELS = [
  { id: 'openai/gpt-5-image', name: 'GPT-5 Image (Best quality)', modalities: ['image', 'text'] },
  { id: 'openai/gpt-5-image-mini', name: 'GPT-5 Image Mini (Fast)', modalities: ['image', 'text'] },
  { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (Cheapest)', modalities: ['image', 'text'] },
  { id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (High quality)', modalities: ['image', 'text'] },
  { id: 'google/gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image (Newest)', modalities: ['image', 'text'] },
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

// ─── RANDOMIZATION HELPERS ───
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const HOOK_STYLES = [
  'Open with a shocking statistic or number.',
  'Open with a bold, contrarian claim that challenges conventional wisdom.',
  'Open with a short story or real scenario (1-2 sentences max).',
  'Open with a provocative question that stops the scroll.',
  'Open with a "hot take" or unpopular opinion.',
  'Open with a "what if" scenario.',
  'Open with "Here\'s what nobody is telling you about..."',
  'Open with a painful truth the audience recognizes immediately.',
  'Open with a comparison (before vs after, old way vs new way).',
  'Open with a timestamp ("Last week, I..." or "6 months ago...").',
];

const ANGLE_MODIFIERS = [
  'Frame this from a contrarian perspective — challenge what people assume.',
  'Use a specific, concrete example or case study to make the point.',
  'Frame this as a "mistake most people make" and the fix.',
  'Use a metaphor or analogy from outside healthcare to explain the concept.',
  'Frame this as a prediction or trend that\'s emerging.',
  'Present this as a "framework" or "mental model" the reader can use today.',
  'Frame this as lessons learned from a specific failure or near-miss.',
  'Use a "myth vs reality" structure to bust a common misconception.',
  'Frame this as "the question you should be asking but aren\'t".',
  'Tell this through the lens of one specific person\'s experience.',
];

const IMAGE_STYLE_SEEDS = [
  'photorealistic editorial photograph',
  'clean minimalist vector illustration',
  'moody cinematic lighting with depth of field',
  'abstract geometric data visualization',
  'isometric 3D illustration',
  'watercolor and ink editorial style',
  'bold flat design with strong geometry',
  'dramatic aerial/bird\'s eye perspective',
  'split-screen comparison composition',
  'conceptual metaphor illustration',
  'blueprint/schematic technical drawing style',
  'warm documentary photography style',
];

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
      temperature: 0.95,
      max_tokens: 2000,
    }),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `API error: ${resp.status}`);
  }
  return (await resp.json()).choices[0].message.content;
}

// ═══════════ TRENDING TOPIC DISCOVERY ═══════════
export async function fetchTrendingTopics(manualKey, model, brand, pillar, platform, count = 5) {
  const key = getApiKey(manualKey);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: `You are a social media trend analyst specializing in ${platform} content strategy for the ${brand.category || 'B2B'} industry.

TODAY'S DATE: ${today}
BRAND: ${brand.name || 'B2B Company'}
NICHE: ${brand.category || 'B2B professional services'}
CONTENT PILLAR: ${pillar.name} (targeting ${pillar.audience})
PILLARS CONTEXT: ${brand.pillars.map(p => `${p.name}: ${p.description}`).join('; ')}

Your task: Research and identify the ${count} MOST ENGAGING trending topics right now on ${platform} that are relevant to this brand's niche. Think about:

1. What topics in this industry are getting the MOST engagement (comments, shares, reactions) on ${platform} RIGHT NOW?
2. What breaking news, policy changes, new studies, or industry shifts happened THIS WEEK or THIS MONTH?
3. What controversial or polarizing discussions are happening in this space?
4. What pain points are professionals in this audience currently venting about?
5. What viral posts or formats are performing well in this niche?

For each topic, provide:
- topic: A specific, timely topic title (not generic — reference real events, data, or trends)
- angle: The specific hook or angle that makes this engaging right now
- whyTrending: Why this is hot right now (1 sentence)
- engagementPotential: "viral" | "high" | "medium"
- suggestedHook: A 1-line opening hook for a post on this topic

CRITICAL RULES:
- Be SPECIFIC and TIMELY. Not "physician burnout" but "Why 3 major health systems just announced 4-day work weeks for physicians — and what it means for staffing"
- Reference REAL industry trends, reports, legislation, events happening NOW in 2026
- Each topic must be DIFFERENT from the others — different angles, different emotions, different formats
- Think about what would actually go VIRAL on ${platform}, not just what's "relevant"

Return ONLY valid JSON array. No markdown, no code blocks.
[{"topic":"...","angle":"...","whyTrending":"...","engagementPotential":"...","suggestedHook":"..."}]`
      }],
      temperature: 1.0,
      max_tokens: 2000,
    }),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Failed to fetch trending topics');
  }

  const data = await resp.json();
  let raw = data.choices?.[0]?.message?.content || '';
  raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const topics = JSON.parse(raw);
    if (Array.isArray(topics) && topics.length >= 1) return topics.slice(0, count);
  } catch {
    // Try to extract JSON array from the response
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const topics = JSON.parse(match[0]);
        if (Array.isArray(topics) && topics.length >= 1) return topics.slice(0, count);
      } catch {}
    }
  }
  throw new Error('Could not parse trending topics');
}

// ─── EXTRACT IMAGE URL FROM RESPONSE ───
function extractImageUrl(data) {
  const msg = data.choices?.[0]?.message;
  const content = msg?.content;

  // 1. Check message.images array (Gemini & GPT-5 Image format)
  if (msg?.images?.length > 0) {
    const img = msg.images[0];
    if (typeof img === 'string') return img;
    if (img?.image_url?.url) return img.image_url.url;
    if (img?.url) return img.url;
  }

  // 2. Check native_images
  if (data.choices?.[0]?.native_images?.length > 0) {
    return data.choices[0].native_images[0];
  }

  // 3. Handle structured content arrays
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && (part.image_url?.url || part.url)) {
        return part.image_url?.url || part.url;
      }
      if (part.type === 'image') {
        if (part.source?.data) return `data:${part.source.media_type || 'image/png'};base64,${part.source.data}`;
        if (part.image_url?.url) return part.image_url.url;
        if (part.url) return part.url;
      }
    }
  }

  // 4. Handle string responses
  if (typeof content === 'string') {
    const b64 = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (b64) return b64[0];
    const md = content.match(/!\[.*?\]\((.*?)\)/);
    if (md) return md[1];
    const extUrl = content.match(/(https?:\/\/[^\s"'\)]+\.(png|jpg|jpeg|webp|gif)[^\s"'\)]*)/i);
    if (extUrl) return extUrl[1];
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

  console.error('[LeadGen] Unrecognized image response:', JSON.stringify(data).substring(0, 800));
  throw new Error('No image in response. Try a different model.');
}

// ─── GENERATE CONTENT-MATCHED IMAGE PROMPTS (with variety) ───
export async function generateImagePrompts(manualKey, textModel, postText, brand, count = 5) {
  const key = getApiKey(manualKey);
  // Pick random style seeds for variety
  const styles = shuffle(IMAGE_STYLE_SEEDS).slice(0, count);

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      model: textModel,
      messages: [{
        role: 'user',
        content: `You are a social media visual strategist creating UNIQUE, VARIED images. Based on the post below, generate exactly ${count} COMPLETELY DIFFERENT image descriptions for AI image generation.

POST:
${postText}

BRAND: ${brand.name || 'B2B Company'}
BRAND COLORS: navy (#1a365d), steel blue (#2c5282), accent blue (#3182ce)

MANDATORY STYLE ASSIGNMENTS (each image MUST use its assigned style):
${styles.map((s, i) => `Image ${i + 1}: ${s}`).join('\n')}

RULES:
- Each image MUST look completely different from the others — different composition, different subject, different mood
- Each description must be specific and detailed (2-3 sentences)
- Each image covers a DIFFERENT angle or message from the post
- Professional, modern — suitable for LinkedIn/Facebook
- Include specific composition details, lighting, camera angle, mood, and color palette
- 16:9 landscape format
- ABSOLUTELY NO text, words, letters, numbers, or typography in the images
- NO stock photo cliches (no handshakes, no pointing at screens, no smiling at camera)
- Make each image VISUALLY DISTINCT — if one is dark/moody, make another bright/clean, etc.

Return ONLY a JSON array of ${count} strings. No markdown, no code blocks.
["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]`
      }],
      temperature: 1.0,
      max_tokens: 1500,
    }),
  });

  if (!resp.ok) throw new Error('Failed to generate image prompts');

  const data = await resp.json();
  let raw = data.choices?.[0]?.message?.content || '';
  raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const prompts = JSON.parse(raw);
    if (Array.isArray(prompts) && prompts.length >= 1) return prompts.slice(0, count);
  } catch {
    const matches = raw.match(/"([^"]{20,})"/g);
    if (matches?.length >= 1) return matches.slice(0, count).map((s) => s.replace(/^"|"$/g, ''));
  }
  throw new Error('Could not parse image prompts');
}

// ─── BATCH IMAGE GENERATION WITH FALLBACK ───
export async function generateMultipleImages(manualKey, imageModel, prompts, onProgress) {
  const results = [];
  const fallbackModels = IMAGE_MODELS.filter((m) => m.id !== imageModel).map((m) => m.id);

  for (let i = 0; i < prompts.length; i++) {
    if (onProgress) onProgress(i, prompts.length);
    let success = false;

    const modelsToTry = [imageModel, ...fallbackModels.slice(0, 2)];
    for (const model of modelsToTry) {
      try {
        const url = await callImageAPI(manualKey, model, prompts[i]);
        results.push({ url, prompt: prompts[i], error: null, model });
        success = true;
        break;
      } catch (e) {
        console.warn(`[LeadGen] Image ${i + 1} failed on ${model}:`, e.message);
      }
    }
    if (!success) {
      results.push({ url: null, prompt: prompts[i], error: 'All models failed' });
    }
  }
  return results;
}

// ─── PROMPT BUILDERS (with variety injection) ───
export function buildSystemPrompt(brand, platform, { tone, ctaType, useEmoji, formatting } = {}) {
  const toneMap = {
    authoritative: 'Direct, authoritative, data-driven voice. You are the expert.',
    conversational: 'Warm, conversational, relatable voice. Like talking to a smart colleague.',
    provocative: 'Bold, contrarian, thought-provoking voice. Challenge conventional thinking.',
    storytelling: 'Narrative-driven voice. Open with a scene or moment. Pull the reader in.',
    educational: 'Clear, instructive voice. Teach something valuable. Be specific.',
  };
  const ctaMap = {
    question: 'End with a thought-provoking question that invites comments.',
    dm: 'End with a DM-based CTA (e.g., DM me "GUIDE" to get...).',
    link: 'End with a CTA pointing to a link or resource.',
    engage: 'End by asking readers to share their experience or opinion.',
    none: 'No explicit CTA. Let the content speak for itself.',
  };

  return `You are an expert social media content strategist for B2B lead generation on ${platform}.

BRAND: ${brand.name || 'the client'}
Tagline: ${brand.tagline || 'N/A'}
Category: ${brand.category || 'N/A'}
Pillars: ${brand.pillars.map((p) => p.name).join(', ')}

VOICE & TONE:
${toneMap[tone] || toneMap.authoritative}

FORMATTING RULES:
- Hook in first 2 lines \u2014 this determines if anyone reads the rest
- Short paragraphs (1-3 sentences max), generous line breaks
- ${formatting === 'heavy' ? 'Use bullet points with \u2192 arrows, numbered lists, and bold structural markers (**bold** for key phrases)' : formatting === 'minimal' ? 'Minimal formatting. Flowing prose. No lists unless absolutely necessary.' : 'Mix of short paragraphs and \u2192 arrow lists where they add clarity. Use **bold** for 1-2 key phrases.'}
- ${platform === 'LinkedIn' ? 'Professional but human. Use \u2192 arrow symbols for lists.' : 'Warmer tone, more shareable. Occasional emojis OK.'}
- ${useEmoji ? 'Use 2-3 relevant emojis to break up text and add visual interest.' : 'No emojis. Let the words do the work.'}
- 3-5 relevant hashtags at end
- 200-350 words
- Every sentence earns its place. No filler.

VARIETY RULES:
- NEVER write a generic post. Every post must have a specific, fresh angle.
- ${pick(HOOK_STYLES)}
- ${pick(ANGLE_MODIFIERS)}
- Do NOT repeat common phrases like "here's the thing" or "let that sink in" or "read that again"
- Use a FRESH hook every time. Surprise the reader.

CTA STYLE:
${ctaMap[ctaType] || ctaMap.question}`;
}

export function buildUserPrompt(pillar, audience, topic, dataPoints, imageStyle, { keywords, keyPhrases, avoidTopics, trendingTopic } = {}) {
  let p = `Write a ${pillar.name} post targeting ${audience || pillar.audience}.`;

  // Trending topic takes priority as the main angle
  if (trendingTopic) {
    p += `\n\nTRENDING TOPIC TO WRITE ABOUT:\nTitle: ${trendingTopic.topic}\nAngle: ${trendingTopic.angle}\nWhy it's trending: ${trendingTopic.whyTrending}`;
    if (trendingTopic.suggestedHook) p += `\nSuggested hook: ${trendingTopic.suggestedHook}`;
    p += `\n\nWrite the post specifically about this trending topic. Make it timely and relevant to what's happening NOW.`;
  }

  if (topic && !trendingTopic) p += `\n\nTopic/Angle: ${topic}`;
  if (keywords?.length) p += `\n\nKeywords to weave in naturally (don't force them): ${keywords.join(', ')}`;
  if (keyPhrases?.length) p += `\n\nKey phrases to include or riff on:\n${keyPhrases.map((k) => `- "${k}"`).join('\n')}`;
  if (avoidTopics?.length) p += `\n\nAvoid these topics/angles: ${avoidTopics.join(', ')}`;
  if (dataPoints?.length) {
    // Randomly select 2-3 data points instead of passing all
    const selected = shuffle(dataPoints).slice(0, Math.min(3, dataPoints.length));
    p += `\n\nData points (use 1-2 max, weave naturally):\n${selected.map((d) => `- ${d}`).join('\n')}`;
  }

  if (imageStyle === 'stat') p += '\n\nThis post is paired with a bold stat-card image. Reference a striking number early.';
  if (imageStyle === 'multi') p += '\n\nThis post is paired with a multi-image carousel (problem\u2192context\u2192solution). Structure the post to match.';
  if (imageStyle === 'quote') p += '\n\nThis post is paired with a quote card. Lead with a strong, quotable opinion.';

  // Random uniqueness seed to prevent identical outputs
  p += `\n\nUNIQUENESS SEED: ${Math.random().toString(36).substring(2, 8)} \u2014 Use this to ensure this post is completely different from any previous generation. Write something FRESH and ORIGINAL.`;
  p += '\n\nReturn ONLY the raw post text. No labels, titles, or commentary. Use **bold** for key phrases.';
  return p;
}

export function buildImagePrompt(brand, pillar, style) {
  const base = `Professional social media image for ${brand.name || 'a B2B company'}. Colors: navy (#1a365d), steel blue (#2c5282), accent (#3182ce). Clean, modern, corporate. No text or words in image. 16:9 landscape.`;
  if (style === 'stat') {
    return base + ` Bold data visualization or infographic feel. Dark navy gradient background. Abstract charts, graphs, or data-flow elements. Topic: ${pillar.name}.`;
  }
  if (style === 'quote') {
    return base + ' Thought leadership feel. Steel blue gradient. Abstract geometric shapes suggesting insight and clarity. Authoritative mood.';
  }
  return base + ' Clean, structured layout suggesting a multi-part story. Light background with navy accents. Sequential/progression visual.';
}
