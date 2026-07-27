import { getPillarConfig, HOOK_FORMULAS } from './storytelling.js';
import { parseJsonStringArray, stripEmDashes, shuffle } from './parsers.js';
import { IMAGE_STYLE_SEEDS } from './prompts.js';

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
    'X-Title': 'Architect OS',
  };
}


// ─── TEXT GENERATION ───
export async function callOpenRouter(manualKey, model, sysPrompt, userPrompt, onChunk = null) {
  const key = getApiKey(manualKey);
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify({
      model,
      stream: !!onChunk,
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
  
  if (onChunk) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop(); // Keep the last incomplete line in buffer
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const text = parsed.choices?.[0]?.delta?.content || '';
            fullText += text;
            onChunk(fullText);
          } catch (e) {}
        }
      }
    }
    return fullText;
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

// ═══════════ TRENDING TOPIC DISCOVERY ═══════════
// Tries the ":online" web-search model variant first so "trending" means THIS
// week, not the model's training cutoff. Falls back to the base model on error.
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
export async function fetchBuildIdeas(manualKey, model, count = 5, excelIdeas = []) {
  const key = getApiKey(manualKey);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Rows come from the workbook's idea banks. The problem and the dataset are
  // what matter; example companies are context for picking, never for framing.
  const ideasContext = excelIdeas.length > 0
    ? `\nPROBLEM BANK (from Databricks Ideas.xlsx, best-fit rows first):\n${excelIdeas.slice(0, 30).map((i) => `- [${i.industry}] ${i.problem}${i.appIdea ? ` | App: ${i.appIdea}` : ''}${i.dataset ? ` | Dataset: ${i.dataset}` : ''}${i.exampleCompanies ? ` | Seen at: ${i.exampleCompanies}` : ''}`).join('\n')}\n`
    : '';

  const prompt = `You are a hybrid trend analyst + senior data and lakehouse architect. Today is ${today}.

You advise an architect who builds full-stack prototypes (Databricks backend plus a React or PowerApp frontend) on weekends and posts the results on LinkedIn. His audience is data leaders, architects, and hiring managers. He pairs a trending industry problem with a REAL public dataset.
${ideasContext}
TASK: Identify the ${count} best build opportunities RIGHT NOW. Each pairs (a) an industry data or AI bottleneck currently being discussed, (b) a REAL public dataset, and (c) a 3-4 hour full-stack build.

FRAMING RULES (important):
- Frame every opportunity by INDUSTRY and PROBLEM, never by a single company. Say "card networks" or "grid operators", not "Visa" or "NextEra".
- The postAngle must NOT name a specific company. Naming a brand you have no access to reads as spec work to senior practitioners and invites questions you cannot answer.
- "Seen at" companies in the bank above are context to help you pick a real problem. Do not put them in the output.

DATASET RULES:
- Only name datasets that REALLY exist and are freely downloadable or API-accessible (EIA, SEC EDGAR, NREL, Our World in Data, Kaggle, data.gov and similar).
- The analysis must run on real data. Synthetic data is acceptable ONLY for cosmetic padding in the UI layer, never for the findings.
- If you are not confident a dataset exists, set verified to false.

For each opportunity return:
- topic: the specific industry bottleneck or question
- industry: the industry or sector (e.g. "Energy & Grid", "Financial Services")
- whyHot: 1 sentence on why this is being discussed right now
- dataset: {name, source, access: exact URL or API name, verified: true|false}
- buildIdea: what to build on the backend (Databricks medallion plus serving layer) AND the frontend
- postAngle: the one-line hook the resulting LinkedIn post would open with, naming no company
- audienceMatch: strict enum, either "data-leaders" or "general viral" based on technical depth
- effortHours: realistic estimate (3-4)

Rank by a combination of heat and audience match, data-leaders first. Return ONLY a valid JSON array, no markdown fences.
[{"topic":"...","industry":"...","whyHot":"...","dataset":{"name":"...","source":"...","access":"...","verified":true},"buildIdea":"...","postAngle":"...","audienceMatch":"...","effortHours":3}]`;

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