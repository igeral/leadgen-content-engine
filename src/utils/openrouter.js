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

// ─── MULTI-POST VARIATIONS ───
// Generate N posts within the same pillar but on DIFFERENT TOPICS.
// Each post covers its own news event / stat / angle (NOT three angles on
// one topic) and uses its own hook formula from the six.
export async function callOpenRouterMultiPost(manualKey, model, sysPrompt, userPromptCore, count, opts = {}) {
  const key = getApiKey(manualKey);
  const pillarName = opts.pillarName || '';
  const cfg = getPillarConfig(pillarName);
  const allHookKeys = ['bold_stat', 'contrarian', 'direct_question', 'pov_scenario', 'story_opener', 'reframe'];
  const preferred = cfg ? cfg.bestHooks : [];
  const ordered = [...preferred, ...allHookKeys.filter((h) => !preferred.includes(h))];
  const chosenKeys = ordered.slice(0, count);
  const hookBriefs = chosenKeys.map((k, i) => {
    const hf = HOOK_FORMULAS[k];
    return `${i + 1}. ${hf.name} \u2014 ${hf.brief}`;
  }).join('\n');

  const trendingClause = opts.hasTrendingTopic
    ? `\n\nTRENDING TOPIC HANDLING:\n- Post 1 covers the trending topic specified above.\n- Posts 2-${count} MUST cover OTHER topics within the ${pillarName || 'pillar'}. Do NOT discuss the trending topic in posts 2-${count}. Pick recent issues, stats, or angles that are completely different.`
    : '';

  const wrapper = `

GENERATE EXACTLY ${count} POSTS, EACH ON A COMPLETELY DIFFERENT TOPIC within the ${pillarName || 'selected'} pillar.

CRITICAL TOPIC DIVERSITY RULE:
Each of the ${count} posts must address a DIFFERENT release, feature, pattern, dataset, or scenario. NO TWO POSTS may cover the same underlying subject. Three angles on the same Unity Catalog release is NOT acceptable. Three genuinely different subjects is what is required.

Examples of distinct topics within a single pillar:
- Architecture Patterns: medallion layer boundaries; serverless vs classic compute cost; Unity Catalog lineage for audits; incremental ingestion with schema drift; BI semantic layers on the lakehouse.
- Each item above is its OWN topic, not the same topic from a different angle.

Each post uses a DIFFERENT hook formula from this list (no repeats):
${hookBriefs}${trendingClause}

For each post:
- The first line is the hook and MUST follow the assigned formula.
- The first line MUST be 15 words or fewer.
- The post MUST be on a topic that is DISTINCT from all the other posts in this batch.
- Follow the pillar's 7-beat sequence (defined above) for the body.
- ZERO em dashes. Use commas, periods, colons, or line breaks instead.
- Reader is the main character. Frame from THEIR perspective.
- 150-300 words per post.
- End with a soft CTA (no engagement bait) and 3-5 hashtags.

Return ONLY a JSON array of exactly ${count} strings \u2014 each string is one full post in the order above (post 1 uses hook formula 1 + topic 1, post 2 uses hook formula 2 + a DIFFERENT topic, etc.).
NO code fences. NO commentary. NO labels. Just the raw JSON array.

Example shape:
[\"Post one full text on topic A...\", \"Post two full text on completely different topic B...\", ...]`;

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPromptCore + wrapper },
      ],
      temperature: 0.95,
      max_tokens: 4000,
    }),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `API error: ${resp.status}`);
  }
  const raw = (await resp.json()).choices[0].message.content;
  let posts = parseJsonStringArray(raw);
  if (!posts || posts.length === 0) {
    throw new Error('Could not parse post variations from AI response');
  }
  // Defense in depth: strip any em/en dashes the model emits despite the prompt
  posts = posts.map((p) => stripEmDashes(p));
  while (posts.length < count) posts.push(posts[posts.length - 1]);
  return posts.slice(0, count);
}

// Strip em/en dashes the model may emit despite the prompt forbidding them.
// Replaces with a period + space to preserve the rhythm break.
function stripEmDashes(text) {
  if (!text) return text;
  let out = String(text)
    .replace(/\s*[\u2014\u2013]\s*/g, '. ')
    .replace(/\s+--\s+/g, '. ');
  // Collapse double periods, recapitalize sentence starts
  out = out.replace(/\.\s*\./g, '.')
           .replace(/\.\s+([a-z])/g, (_m, c) => '. ' + c.toUpperCase());
  return out.trim();
}

function parseJsonStringArray(raw) {
  if (!raw) return null;
  let cleaned = String(raw).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  // Find first [ ... ] (greedy across newlines)
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return null;
    return arr
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0);
  } catch (e) {
    // Fallback: try splitting on numbered list markers if model returned non-JSON
    const fallback = String(raw).split(/\n\s*\d+\.\s+/).map((x) => x.trim()).filter((x) => x.length > 40);
    if (fallback.length >= 2) return fallback;
    return null;
  }
}

// ═══════════ TRENDING TOPIC DISCOVERY ═══════════
// Tries the ":online" web-search model variant first so "trending" means THIS
// week, not the model's training cutoff (stale years-old "news" presented as
// current is a credibility killer). Falls back to the base model on error.
export async function fetchTrendingTopics(manualKey, model, brand, pillar, platform, count = 5) {
  const key = getApiKey(manualKey);
  try {
    return await fetchTrendingTopicsWithModel(key, `${model}:online`, brand, pillar, platform, count);
  } catch (e) {
    return await fetchTrendingTopicsWithModel(key, model, brand, pillar, platform, count);
  }
}

async function fetchTrendingTopicsWithModel(key, model, brand, pillar, platform, count) {
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
- Be SPECIFIC and TIMELY. Not "data governance" but "Why the Unity Catalog change shipped this month breaks the lineage assumption most teams built on"
- Reference REAL industry trends, reports, legislation, events happening NOW in 2026
- RECENCY IS NON-NEGOTIABLE: if you have web search results, use ONLY events verifiable in them. If you cannot verify an event happened within the last 30 days, DO NOT include it. Never present an event from a previous year as if it is current — a single stale "news" post destroys the brand's credibility.
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

// ═══════════ BUILD RADAR (Databricks personal-brand lane) ═══════════
// Finds trending, data-attachable topics and pairs each with a REAL public
// dataset + a weekend-scale Databricks Free Edition build idea. Tries the
// OpenRouter ":online" web-search variant first (adds ~cents/scan, gives
// live results); falls back to the base model's knowledge if unavailable.
export async function fetchBuildIdeas(manualKey, model, count = 5) {
  const key = getApiKey(manualKey);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `You are a hybrid trend analyst + senior data engineer. Today is ${today}.

You advise a data analytics engineer who builds small public projects on Databricks Free Edition every weekend and posts about them on his personal LinkedIn. His audience is data leaders, analytics managers, and hiring managers. His goal: attach real data analysis to topics people are ALREADY talking about, so the posts ride an existing wave.

TASK: Identify the ${count} best "build opportunities" RIGHT NOW. Each pairs (a) a topic currently generating heavy discussion on LinkedIn / tech media with (b) a real, freely accessible public dataset, and (c) a 2-3 hour Databricks build.

TOPIC POOL TO DRAW FROM (not exhaustive — add better ones if they are hotter right now): AI data-center buildout and electricity demand, energy grids and renewables, the AI capex race, chip supply, data breaches and security incidents, CEO/company performance comparisons, tech layoffs and hiring data, robotics adoption, housing/cost-of-living data, sports analytics moments.

DATASET RULES (critical):
- Only name datasets that REALLY exist and are freely downloadable or API-accessible today. Examples of the caliber expected: EIA Open Data API (US energy), Our World in Data energy/CO2 GitHub CSVs, SEC EDGAR filings, HHS breach portal CSV, NYC TLC trip data, Cloudflare Radar, BLS/FRED APIs, Kaggle datasets (name the exact dataset), GitHub Archive on BigQuery-equivalent public buckets.
- If unsure a dataset exists, either drop the idea or clearly set "verified": false.
- No datasets that require paid licenses, scraping against ToS, or employer credentials.

For each opportunity return:
- topic: specific and timely (reference the actual live discussion, not a generic theme)
- whyHot: 1 sentence on why this is being discussed right now
- dataset: {name, source, access: exact URL or API name, verified: true|false}
- buildIdea: what to build in 2-3 hours on Databricks Free Edition (medallion layers, a DBSQL dashboard, a Genie space, a Lakeflow pipeline — pick what fits), phrased as concrete steps
- postAngle: the one-line hook the resulting LinkedIn post would open with
- audienceMatch: "data-leaders" if data/analytics professionals specifically discuss this, "general" if it is broad-public viral
- effortHours: realistic estimate (2-6)

Rank by (audienceMatch === "data-leaders") first, then heat. Return ONLY a valid JSON array, no markdown fences.
[{"topic":"...","whyHot":"...","dataset":{"name":"...","source":"...","access":"...","verified":true},"buildIdea":"...","postAngle":"...","audienceMatch":"...","effortHours":3}]`;

  const callModel = async (modelId) => {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: apiHeaders(key),
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(e.error?.message || 'Build radar request failed');
    }
    const data = await resp.json();
    let raw = data.choices?.[0]?.message?.content || '';
    raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    const ideas = JSON.parse(match ? match[0] : raw);
    if (!Array.isArray(ideas) || ideas.length < 1) throw new Error('No ideas returned');
    return ideas.slice(0, count);
  };

  // ":online" adds OpenRouter's web-search plugin so results reflect THIS week,
  // not the model's training cutoff. Fall back to the base model if the online
  // variant errors (not all models/accounts support it).
  try {
    return { ideas: await callModel(`${model}:online`), live: true };
  } catch (e) {
    const ideas = await callModel(model);
    return { ideas, live: false };
  }
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

// ─── STORYTELLING FRAMEWORK ───
// Six hook formulas. Each must work in 15 words or fewer
// because that is what shows above the LinkedIn see-more cutoff.
export const HOOK_FORMULAS = {
  bold_stat:        { name: 'Bold Stat',         brief: 'Lead with one credible specific number that creates urgency or shock.' },
  contrarian:       { name: 'Contrarian Claim',  brief: 'State something that challenges what the audience already believes.' },
  direct_question:  { name: 'Direct Question',   brief: 'Ask something the reader already thinks about but has never seen stated cleanly.' },
  pov_scenario:     { name: 'POV Scenario',      brief: 'Put the reader directly inside a situation they have lived or fear. Open with "POV:".' },
  story_opener:     { name: 'Story Opener',      brief: 'Start with a moment that pulls the reader in before any argument is made.' },
  reframe:          { name: 'Reframe',           brief: 'Take a widely known headline or belief and flip it to reveal what people miss.' },
};

// Two storytelling frameworks (Part 1.5)
export const FRAMEWORKS = {
  PASS: 'PASS — Problem (name it directly in the hook), Agitate (make the reader feel the weight with specific examples), Solution (give them the path through, not the sales pitch — the framework), Soft CTA (question or invitation, never engagement bait).',
  SLAY: 'SLAY — Story (two lines that open with a real moment, scenario, or stat), Lesson (the single insight at the heart of the post), Actionable advice (what the reader can do with the lesson), Your engagement (a genuine question that invites the reader in without being bait).',
};

// Pillar-specific outlines. Keys match brand.pillars[].name (case-insensitive).
export const PILLAR_MAP = {
  'build log': {
    framework: 'SLAY',
    bestHooks: ['story_opener', 'pov_scenario'],
    arc: 'Drop the reader inside the build → what broke → what the numbers actually said → what you would do differently → invite better approaches.',
    feeling: 'This person actually builds. I want to see the repo.',
    beats: [
      'Open mid-action, inside the build. A moment, a decision, or the thing that broke. Never open with a feature announcement.',
      'State what you set out to make and which real dataset you pointed at it. One or two lines.',
      'The friction: what failed, what surprised you, what the docs did not say. This is the part only someone who built it can write.',
      'The numbers: rows processed, runtime, cost, rows dropped. Specific figures from the notes, never invented.',
      'The lesson a senior practitioner would nod at. One idea, stated plainly.',
      'Mention the repo or notebook is linked in the comments. Never a link in the caption.',
      'Close with ONE expertise invite: if you would have built this differently, say how.',
    ],
  },
  'platform deep dives': {
    framework: 'SLAY',
    bestHooks: ['direct_question', 'reframe'],
    arc: 'A question practitioners actually ask → what the docs say → what it means in practice → the caveat → invite counter-experience.',
    feeling: 'Clearer than the documentation. Bookmarkable.',
    beats: [
      'Open with the question or misconception the feature actually resolves.',
      'Name the feature and what it replaces or changes. Public sources only: docs, release notes, blogs.',
      'Show the mechanics concretely: the shape of the config, the flow of the data, the order of operations.',
      'Where it helps most, stated as a scenario the reader recognizes.',
      'The honest caveat or limit. Credibility lives here.',
      'Close by inviting readers who have run it in production to add what you missed.',
    ],
  },
  'architecture patterns': {
    framework: 'PASS',
    bestHooks: ['contrarian', 'bold_stat'],
    arc: 'Name the architectural pain → make the cost concrete → give the pattern → the trade-off → invite other stacks.',
    feeling: 'This person thinks at the altitude we hire for.',
    beats: [
      'Name the pain in the hook: the pipeline, cost, or governance failure a data leader recognizes immediately.',
      'Make the cost concrete: rework, compute spend, stale dashboards, the audit that failed.',
      'Give the pattern as structure, not slogans: layers, boundaries, where governance sits, what runs where.',
      'The trade-off you accept when you choose it. Never present a pattern as free.',
      'Where it stops working, and what you would reach for instead at that scale.',
      'Close by asking what their stack does instead. Peer to peer, genuinely curious.',
    ],
  },
  'ecosystem news': {
    framework: 'SLAY',
    bestHooks: ['reframe', 'contrarian'],
    arc: 'The news in one line → what everyone will say → what it actually changes → your defensible position → invite disagreement.',
    feeling: 'A sharper read than the announcement post everyone else wrote.',
    beats: [
      'State the news in one line. Assume they saw the headline. Do not summarize the press release.',
      'Name the obvious take everyone is posting.',
      'The reframe: what it actually changes for people who run this in production.',
      'Take a position that is defensible if challenged. Provocative, never inflammatory.',
      'Say plainly what you are unsure about. Certainty about the unknowable reads as noise.',
      'Close by inviting practitioners who read it differently to make their case.',
    ],
  },
  'use case breakdowns': {
    framework: 'PASS',
    bestHooks: ['bold_stat', 'pov_scenario'],
    arc: 'The industry problem → the published result → the architecture behind it → what transfers → invite the next request.',
    feeling: 'I can apply this pattern to my own industry tomorrow.',
    beats: [
      'Open with the operational problem the industry faced, framed so any data person feels it.',
      'The published outcome, with the real source named. Cite it, never fabricate it.',
      'Reverse-engineer the architecture: ingestion, layers, governance, serving.',
      'The part that transfers to a completely different industry. This is the value.',
      'The part that does not transfer, and why.',
      'Close by asking which industry or dataset they want broken down next.',
    ],
  },
  'career & craft': {
    framework: 'SLAY',
    bestHooks: ['story_opener', 'direct_question'],
    arc: 'A real moment from the work → what it cost → the lesson → how it changed the approach → invite their version.',
    feeling: 'Honest. Someone a few steps ahead telling the truth about the work.',
    beats: [
      'Open with a specific moment from the work. A scene, not a thesis.',
      'What it cost: the rework, the week lost, the wrong assumption held too long.',
      'The lesson in one line. The line worth quoting.',
      'How it changed the way you build now, concretely.',
      'Acknowledge how fast the tooling moves and that everyone is learning it in real time. Owning that IS the credibility.',
      'Close by inviting their version of the same lesson.',
    ],
  },
};

// Look up the pillar config by name (case-insensitive).
export function getPillarConfig(pillarName) {
  if (!pillarName) return null;
  const key = String(pillarName).toLowerCase().trim();
  if (PILLAR_MAP[key]) return PILLAR_MAP[key];
  // Fuzzy fall-throughs for renamed pillars
  if (key.includes('build')) return PILLAR_MAP['build log'];
  if (key.includes('deep dive') || key.includes('platform')) return PILLAR_MAP['platform deep dives'];
  if (key.includes('architecture') || key.includes('pattern')) return PILLAR_MAP['architecture patterns'];
  if (key.includes('ecosystem') || key.includes('news')) return PILLAR_MAP['ecosystem news'];
  if (key.includes('use case') || key.includes('breakdown')) return PILLAR_MAP['use case breakdowns'];
  if (key.includes('career') || key.includes('craft')) return PILLAR_MAP['career & craft'];
  return null;
}

function pillarBrief(cfg) {
  if (!cfg) return '';
  const beatList = cfg.beats.map((b, i) => `${i + 1}. ${b}`).join('\n');
  return `\n\nPILLAR FRAMEWORK:
- Default framework: ${cfg.framework}
- Best hook formulas for this pillar: ${cfg.bestHooks.map((h) => HOOK_FORMULAS[h].name).join(', ')}
- Narrative arc: ${cfg.arc}
- Reader should feel: ${cfg.feeling}

7-BEAT STORY SEQUENCE (follow in order):
${beatList}`;
}

// ─── PROMPT BUILDERS ───
export function buildSystemPrompt(brand, platform, { tone, ctaType, useEmoji, formatting } = {}) {
  const toneMap = {
    authoritative: 'Direct, authoritative, data-driven voice. You are the expert.',
    conversational: 'Warm, conversational, relatable voice. Like talking to a smart colleague.',
    provocative: 'Bold, contrarian, thought-provoking voice. Challenge conventional thinking.',
    storytelling: 'Narrative-driven voice. Open with a scene or moment. Pull the reader in.',
    educational: 'Clear, instructive voice. Teach something valuable. Be specific.',
  };
  const ctaMap = {
    question: 'Soft question CTA. Genuine, not engagement bait. Invite reflection without pushing toward a sale.',
    dm: 'Soft DM-based CTA (e.g., DM me "GUIDE" to get the resource). Earned, not pushy.',
    link: 'Direct the reader to the link in the comments. Never put external links in the caption.',
    engage: 'Soft invitation. If this resonates, share your read. Genuinely curious.',
    none: 'No explicit CTA. Let the content speak for itself.',
  };

  const bn = brand.name || 'the client';
  const brandRef = bn;
  // Storytelling ingredients come from the brand preset (voiceExamples,
  // vocabulary), with neutral fallbacks for a blank/custom brand.
  const ve = brand.voiceExamples || {};
  const readerWorld = ve.readerWorld || 'THEIR life, THEIR work, THEIR career, THEIR decisions';
  const badExample = ve.bad || `${bn} shares insights about the industry.`;
  const goodExample = ve.good || "POV: the reader's exact problem, named in one line.";
  const registerLine = 'That is me. That is my world. That is my problem.';
  const vocabRules = Array.isArray(brand.vocabulary) && brand.vocabulary.length
    ? brand.vocabulary.map((v) => `- ${v}`).join('\n')
    : '- Plain, precise language. No filler jargon.';
  const timelessExample = '';
  const emDashWrong = 'The dashboard looked fine — the numbers behind it were three days stale.';
  const emDashRight1 = 'The dashboard looked fine.';
  const emDashRight2 = 'The numbers behind it were three days stale.';
  // Optional brand-level blocks.
  const positioningBlock = brand.positioning ? `
STRATEGIC INTENT (the reason every post exists — never state it in the post, SHOW it)
${brand.positioning}
` : '';
  const engagementBlock = brand.engagementStrategy ? `
ENGAGEMENT STRATEGY (when this conflicts with the CTA style above, this wins)
${brand.engagementStrategy}
` : '';

  return `You are an expert social media content strategist writing on ${platform} for ${bn}.

BRAND
- Name: ${bn}
- Tagline: ${brand.tagline || 'N/A'}
- Category: ${brand.category || 'N/A'}
- Pillars: ${brand.pillars.map((p) => p.name).join(', ')}
${positioningBlock}
VOICE & TONE
${toneMap[tone] || toneMap.authoritative}

═══════════════════════════════════════════════════════════════════
${bn.toUpperCase()} STORYTELLING PRINCIPLES (apply to EVERY post)
═══════════════════════════════════════════════════════════════════

1.1 THE READER IS THE MAIN CHARACTER
Every post must make the reader feel the story is about ${readerWorld}. Not about ${brandRef}. Not about the team. Not about the company.
- Bad opening: "${badExample}"
- Good opening: "${goodExample}"
When the reader sees the hook, their brain should immediately register: "${registerLine}"

1.2 NO EM DASHES. EVER.
Em dashes (—, –, --) are BANNED across all content. This is non-negotiable.
- Do NOT use em dashes anywhere in the post.
- Do NOT use en dashes in place of em dashes.
- Do NOT use double hyphens (--) as a substitute.
When tempted to use one, use instead: a comma, a period and a new sentence, a colon, a line break, or rewrite the sentence.
- Wrong: "${emDashWrong}"
- Right: "${emDashRight1}"
- Right: "${emDashRight2}"
Em dashes signal AI-generated content and feel performative. ${brandRef}'s voice is direct.

1.3 RHYTHM IS THE ENTERTAINMENT PILLAR
Posts flow like a song, not a report. Use:
- Short lines.
- Frequent line breaks.
- Vary sentence length deliberately.
- One sentence on its own line carries more weight than the same sentence buried in a paragraph.
- The first word of every line matters because that is what scanners read in the F-shaped pattern. Make the first word count.

1.4 HOOK MUST WORK IN \u226415 WORDS
The hook is the FIRST line of the post. It must work in 15 words or fewer because that is what shows above LinkedIn's see-more cutoff. If your hook needs the second line to make sense, rewrite it.

1.6 RECIPROCITY PRINCIPLE
Every post gives inspiration, validation, or one practical insight. The only thing the reader is asked to do is finish reading and engage if they want to. Soft CTAs always. Genuine questions over manufactured ones. The conversion happens later, in the email funnel and in real conversations. The post itself just builds trust.

═══════════════════════════════════════════════════════════════════
FORMATTING (LinkedIn specifics)
═══════════════════════════════════════════════════════════════════
- Hook in first 2 lines. The first line determines if anyone reads the rest.
- Short paragraphs (1-3 sentences max), generous line breaks.
- ${formatting === 'heavy' ? 'Use \u2192 arrows for bullet lists. Use **bold** for 1-2 key phrases. Numbered lists when the order matters.' : formatting === 'minimal' ? 'Minimal formatting. Flowing prose. No lists unless absolutely necessary.' : 'Mix of short paragraphs and \u2192 arrow lists where they add clarity. Use **bold** for 1-2 key phrases.'}
- ${platform === 'LinkedIn' ? 'Professional but human. Use \u2192 arrow symbols for lists, not bullets or hyphens.' : 'Warmer tone, more shareable.'}
- ${useEmoji ? 'Use 2-3 relevant emojis to break up text.' : 'No emojis. Let the words do the work.'}
- 3-5 relevant hashtags at end (LinkedIn). No hashtags inline in the body.
- 150-300 words total.
- Every sentence earns its place. No filler.

CTA STYLE
${ctaMap[ctaType] || ctaMap.question}
${engagementBlock}
VARIETY RULES
- Do NOT repeat common AI phrases like "here's the thing", "let that sink in", "read that again", "the harsh truth", "let me explain".
- Use a FRESH hook every time. Surprise the reader.
- The pillar framework and 7-beat sequence (in the user message) is the structure. Follow it.

═══════════════════════════════════════════════════════════════════
VOCABULARY RULES (apply to ALL ${brandRef} content, every post, every line)
═══════════════════════════════════════════════════════════════════
${vocabRules}
- NEVER use em dashes (—, –, --). Use a comma, a period, a colon, or rewrite the sentence.

═══════════════════════════════════════════════════════════════════
RHYTHM RULES (apply to ALL ${brandRef} content)
═══════════════════════════════════════════════════════════════════
- Short lines. Frequent line breaks. Vary sentence length deliberately.
- One sentence on its own line has more weight than the same sentence buried in a paragraph.
- The first word of every line matters — that is what scanners read in the F-shaped pattern.
- Maximum two sentences per paragraph. One is often stronger.
- Posts feel punchy, direct, and fast. Not polished. Not produced. Real.

DATE ACCURACY
The current year is 2026. Only reference events, news, data, and stories from the current week or the past 30 days. The only exception is verified timeless statistics that are still accurate today${timelessExample}. If you cannot verify a story is current, do not use it.`;
}

export function buildUserPrompt(pillar, audience, topic, dataPoints, imageStyle, { keywords, keyPhrases, avoidTopics, trendingTopic, hookFormula, brandName, sourceNotes } = {}) {

  let p = `Write a ${pillar.name} post targeting ${audience || pillar.audience}.`;

  // Inject the pillar framework
  const cfg = getPillarConfig(pillar.name);
  if (cfg) p += pillarBrief(cfg);

  // Hook formula directive (when caller specifies one — used by multi-post variations)
  if (hookFormula && HOOK_FORMULAS[hookFormula]) {
    const hf = HOOK_FORMULAS[hookFormula];
    p += `\n\nHOOK FORMULA FOR THIS POST: ${hf.name}\n${hf.brief}\nThe first line of the post MUST follow this formula and be \u226415 words.`;
  } else if (cfg && cfg.bestHooks.length) {
    const allowed = cfg.bestHooks.map((h) => HOOK_FORMULAS[h].name).join(' or ');
    p += `\n\nHOOK FORMULA FOR THIS POST: choose ONE of: ${allowed}. The first line MUST be \u226415 words.`;
  }

  // SOURCE NOTES — the honesty guardrail for personal/practitioner brands.
  // When the author supplies notes from real work, they are the ONLY permitted
  // source of experiential claims. Without notes, first-person build stories
  // are forbidden (a fabricated "I built this" is credibility suicide the
  // first time a reader asks a follow-up question).
  const isBuildLog = /build\s*log/i.test(pillar.name || '');
  if (sourceNotes && sourceNotes.trim()) {
    p += `\n\nSOURCE NOTES (the author's real notes — the ONLY source of experiential claims):\n"""\n${sourceNotes.trim()}\n"""\nRULES FOR USING THE NOTES:\n- Every first-person claim (what was built, what broke, what it cost, what the numbers were) MUST come from these notes.\n- Do NOT invent tools, error messages, metrics, timelines, or outcomes that are not in the notes.\n- You may polish wording, structure, and add public general knowledge for context, but the experience itself is only what the notes say.\n- If the notes are thin on some detail, write around it. Never fill the gap with fiction.`;
  } else if (isBuildLog) {
    p += `\n\nNO SOURCE NOTES PROVIDED. This is a Build Log pillar, so you MUST NOT write a first-person "I built this" story — there is no real build to report. Instead, frame the post as forward-looking or analytical: what the author is planning to build next and why, or a breakdown of how one WOULD approach it, clearly framed as a plan, not a completed project. Zero fabricated experiences.`;
  }

  // Trending topic takes priority as the main angle
  if (trendingTopic) {
    p += `\n\nTRENDING TOPIC TO WRITE ABOUT:\nTitle: ${trendingTopic.topic}\nAngle: ${trendingTopic.angle}\nWhy it's trending: ${trendingTopic.whyTrending}`;
    if (trendingTopic.suggestedHook) p += `\nSuggested hook: ${trendingTopic.suggestedHook}`;
    p += `\n\nWrite the post specifically about this trending topic. Make it timely and relevant to what's happening NOW.`;
  }

  if (topic && !trendingTopic) p += `\n\nTopic/Angle: ${topic}`;
  if (keywords?.length) p += `\n\nKeywords to weave in naturally (don't force them): ${keywords.join(', ')}`;
  if (keyPhrases?.length) p += `\n\nKey phrases to include or riff on:\n${keyPhrases.map((k) => `- "${k}"`).join('\n')}`;
  if (avoidTopics?.length) {
    const list = avoidTopics.map((t, i) => `${i + 1}. ${t}`).join('\n');
    p += `\n\nTOPICS ALREADY COVERED — DO NOT REPEAT OR REPHRASE ANY OF THESE:\n${list}\n\nThe topic of THIS post MUST be a DIFFERENT news event, statistic, regulation, trend, or scenario from every item above. Do not write a different angle on any topic in the list. Pick a brand-new subject within the pillar.`;
  }
  if (dataPoints?.length) {
    const selected = shuffle(dataPoints).slice(0, Math.min(3, dataPoints.length));
    p += `\n\nData points (use 1-2 max, weave naturally):\n${selected.map((d) => `- ${d}`).join('\n')}`;
  }

  if (imageStyle === 'stat') p += '\n\nThis post is paired with a bold stat-card image. Reference a striking number early.';
  if (imageStyle === 'multi') p += '\n\nThis post is paired with a multi-image carousel (problem\u2192context\u2192solution). Structure the post to mirror that arc.';
  if (imageStyle === 'quote') p += '\n\nThis post is paired with a quote card. Lead with a strong, quotable opinion.';

  // Hard guardrails (repeated here because LLMs sometimes ignore the system prompt)
  p += '\n\nHARD CONSTRAINTS:\n- ZERO em dashes (\u2014, \u2013, --). Use commas, periods, colons, or line breaks instead.\n- Reader is the main character. Frame everything from THEIR perspective, never ' + (brandName || 'the brand') + '\u2019s.\n- Hook \u226415 words. Must work above the see-more cutoff.\n- Soft CTA only. No engagement bait.';
  if (avoidTopics?.length) {
    p += `\n- Topic distinctness: this post must NOT reuse any subject from the "topics already covered" list above. Different topic, not a different angle on the same topic.`;
  }

  // Random uniqueness seed
  p += `\n\nUNIQUENESS SEED: ${Math.random().toString(36).substring(2, 8)}. Write something FRESH and ORIGINAL — different from any previous generation.`;
  p += '\n\nReturn ONLY the raw post text. No labels, titles, or commentary. Use **bold** for 1-2 key phrases. End with 3-5 hashtags.';
  return p;
}



export function buildImagePrompt(brand, pillar, style) {
  const c = brand.colors || {};
  const primary = c.primary || '#1a365d';
  const secondary = c.secondary || '#2c5282';
  const accent = c.accent || '#3182ce';
  const base = `Professional social media image for ${brand.name || 'a B2B company'}. Colors: primary (${primary}), secondary (${secondary}), accent (${accent}). Clean, modern, corporate. No text or words in image. 16:9 landscape.`;
  if (style === 'stat') {
    return base + ` Bold data visualization or infographic feel. Dark primary-color gradient background. Abstract charts, graphs, or data-flow elements. Topic: ${pillar.name}.`;
  }
  if (style === 'quote') {
    return base + ' Thought leadership feel. Secondary-color gradient. Abstract geometric shapes suggesting insight and clarity. Authoritative mood.';
  }
  return base + ' Clean, structured layout suggesting a multi-part story. Light background with primary-color accents. Sequential/progression visual.';
}
