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
// one topic) and uses its own hook formula from Steadfast's six.
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
Each of the ${count} posts must address a DIFFERENT news event, statistic, regulation, trend, or scenario. NO TWO POSTS may cover the same underlying subject. Three angles on the same Medicare reimbursement cut is NOT acceptable. Three different topics from within healthcare workforce is what is required.

Examples of distinct topics within a single pillar:
- Workforce Insights: physician shortage projections; rural-vs-urban coverage gaps; residency expansion legislation; hospital closure rates; locum tenens adoption.
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
// Replaces with a period + space to preserve the rhythm break Steadfast wants.
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

// ─── STEADFAST STORYTELLING FRAMEWORK ───
// Source: steadfast_storytelling_outline.docx
// Six hook formulas (Part 1.4) — each must work in 15 words or fewer
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

// ─── FRIDAY NEWSJACKING FRAMEWORK ───
// Source: steadfast_friday_framework.docx
// 5 post types — each Friday picks two DIFFERENT types (no repeats per day).
export const FRIDAY_POST_TYPES = {
  newsjack: {
    name: 'Newsjack',
    brief: 'Take a currently viral news story, trend, or cultural moment and tie it to the physician workforce. Sharp, opinionated, slightly provocative. Like an industry insider reacting in real time.',
    lengthCap: 150,
    needsTag: false,
    rules: 'Source: a viral news story, trending social media moment, public controversy, or cultural event. Bridge the topic to physician workforce / healthcare staffing / hospital operations. The bridge must feel natural — if forced, pick a different topic. Steadfast\'s unique perspective is insight, not just commentary.',
  },
  company_callout: {
    name: 'Company Callout',
    brief: 'Analyze a specific healthcare company\'s expansion / restructuring / acquisition and write their physician staffing strategy for them as helpful unsolicited advice.',
    lengthCap: 250,
    needsTag: true,
    rules: 'Source: a hospital system, health network, or healthcare company expanding, opening new facilities, acquiring, or making workforce news. Frame the post as peer-level strategic advice, not criticism. Tag the relevant CMO/CEO/COO. Position Steadfast as the strategist who sees what most miss.',
  },
  viral_prediction: {
    name: 'Viral Prediction',
    brief: 'Call something the agent believes has viral potential even if it has not gone viral yet. Forward-looking, I-saw-this-first energy.',
    lengthCap: 150,
    needsTag: false,
    rules: 'Source: an emerging trend, quiet policy change, underreported stat, or pattern not yet mainstream. Frame as a prediction or early signal. The prediction must be statable in ONE sentence. Confident but not arrogant.',
  },
  industry_reaction: {
    name: 'Industry Reaction',
    brief: 'Respond to another viral LinkedIn post in the healthcare space with a Steadfast-framed take. Quote the line you\'re reacting to, tag the original poster.',
    lengthCap: 150,
    needsTag: true,
    rules: 'Source: a viral healthcare LinkedIn post from a CMO, physician influencer, or industry publication. Quote a key line (attributed), tag the original poster, then add Steadfast\'s perspective. Respectful disagreement, added nuance, or endorsement with additional insight. Never dismissive. Reaction is tighter than the original.',
  },
  hot_take: {
    name: 'Hot Take',
    brief: 'Sharp opinionated statement about the healthcare workforce designed to spark debate. State the take in 1-2 lines, support with 2-3 sentences, end with an invitation to push back.',
    lengthCap: 100,
    needsTag: false,
    rules: 'No external source — Steadfast\'s own perspective. The take should be defensible if challenged. Provocative but not inflammatory for its own sake. Hot takes generate comments because people strongly agree or strongly disagree, both of which feed the algorithm.',
  },
};

// 7 bridge categories (Part 5.1). Friday post must pass the one-sentence bridge test.
export const FRIDAY_BRIDGES = [
  'Direct connection — viral topic IS healthcare; comment with staffing/workforce angle.',
  'Economic ripple — viral topic affects the economy; bridge to hospitals, physician demand, or patient volume.',
  'Workforce parallel — another industry\'s workforce issue parallels physician workforce.',
  'Leadership lesson — viral leadership decision; bridge to what hospital leaders can learn.',
  'Policy impact — policy change; bridge to physician supply, hospital operations, or healthcare access.',
  'Community impact — viral topic affects a community; bridge to that community\'s healthcare infrastructure.',
  'Metaphor — viral topic unrelated, but the underlying principle applies perfectly to healthcare staffing.',
];

// Pillar-specific outlines (Part 2). Keys match brand.pillars[].name (case-insensitive).
export const STEADFAST_PILLAR_MAP = {
  'workforce insights': {
    framework: 'PASS',
    bestHooks: ['bold_stat', 'reframe'],
    arc: 'Bold number → what it really means → why it is more dangerous than people think → what to do about it.',
    feeling: 'Alert. The problem is bigger than they thought. They need to act.',
    beats: [
      'Open with the stat alone on its own line. Forces a pause. Establishes credibility immediately.',
      'Reframe how leaders should interpret it. Replace their default frame with a sharper one.',
      'State the hard truth in one or two short lines. The line that gets quoted and shared.',
      'Agitate by listing the cascade of consequences. Lost revenue, burnout, quality decline, retention. Make the cost concrete.',
      'Layer in supporting data or a related stat. Shows depth of expertise without becoming a research paper.',
      'State the reframed conclusion as a principle. Not a nice-to-have. A necessity. Make the principle quotable.',
      'Soft question CTA. Invite reflection without pushing toward a sale.',
    ],
  },
  'physician lifestyle': {
    framework: 'SLAY',
    bestHooks: ['direct_question', 'story_opener', 'bold_stat'],
    arc: 'Current reality feels wrong → there is another way → here is what it actually looks like → soft invitation.',
    feeling: 'Seen. Understood. Curious without feeling sold to.',
    beats: [
      'Open with a question or scenario the physician is already thinking about. Creates immediate recognition.',
      'Use rhythm to deepen the emotional pull. Three or four short lines that build to a single word or thought.',
      'Validate with a credible workforce stat or trend. Shows the physician they are not alone in feeling this way.',
      'Reframe the burnout or dissatisfaction conversation. The system is the problem, not the work.',
      'Give specific examples of what locum tenens looks like in practice. Different scenarios, career stages, specialties.',
      'State the simple reframe as a principle. Locum tenens is a career strategy, not just a rescue plan.',
      'Soft invitation CTA. No pressure language. If this resonates, reach out.',
    ],
  },
  'staffing strategy': {
    framework: 'PASS or SLAY',
    bestHooks: ['contrarian', 'pov_scenario'],
    arc: 'Conventional wisdom is wrong → here is the cost of believing it → here is the better model → invitation to reflect.',
    feeling: 'Challenged. Slightly uncomfortable. Curious about the alternative model.',
    beats: [
      'Open with the contrarian claim or POV scenario. Creates mild discomfort or instant recognition. Stops the scroll.',
      'Validate the discomfort with a real-world detail. "And it is not the first time this year." Make the scenario specific.',
      'State the underlying truth most leaders avoid. The system was not built for what is happening right now.',
      'List the costs of the conventional approach. Three to five short concrete lines, each a different dimension.',
      'Introduce the better model. Specific. Practical. Not theoretical.',
      'State the principle that makes the better model worth adopting. The line they take into a leadership meeting next week.',
      'Soft question CTA inviting them to share their approach. Genuinely curious.',
    ],
  },
  'industry commentary': {
    framework: 'SLAY (adapted for current events)',
    bestHooks: ['reframe'],
    arc: 'Headline → what the headline says → what the headline misses → what this means for hospitals or physicians.',
    feeling: 'Informed. Steadfast is plugged in and worth following for context on what is happening.',
    beats: [
      'Open with the news event or stat in one line. Establishes immediacy and credibility.',
      'State the surface-level interpretation. Two short lines that mirror the conventional read.',
      'Pivot with the contrarian or nuanced angle. Here is what they do not say. Here is what most people miss.',
      'Provide the specific data or detail that supports the reframe. Numbers, percentages, timelines. Show the work.',
      'State the both-things-are-true position. It matters. And it is not enough. Avoids partisan framing while being opinionated.',
      'Apply the insight to the reader\'s life or hospital. What this means for the hospitals managing this well in 2026.',
      'Genuine question CTA inviting expertise-based comments. What is your read?',
    ],
  },
  'lead magnet': {
    framework: 'Soft introduction to the offer (no PASS/SLAY)',
    bestHooks: ['story_opener', 'direct_question'],
    arc: 'Validate the reader\'s experience → introduce the resource → list what is inside → soft download CTA.',
    feeling: 'Trusted. Ready to take a small action because the rest of the week has built credibility.',
    beats: [
      'Open with a phrase that validates a feeling the reader has had. They knew most of it. They just had not put it together as a system.',
      'Introduce the guide by name and audience. Be specific about who it was written for so the reader self-selects.',
      'List four to five things inside the guide. Each one a different angle. Together they cover the whole framework.',
      'State who it was written for. Practical. Free. Written for the person who does not have time to figure this out mid-crisis.',
      'Direct the reader to the link in the comments. Never put external links in the caption. LinkedIn deprioritises posts with external links.',
      'Standard soft follow CTA. Consistent with the rest of the week.',
    ],
  },
};

// Look up the Steadfast pillar config by pillar name (case-insensitive).
export function getPillarConfig(pillarName) {
  if (!pillarName) return null;
  const key = String(pillarName).toLowerCase().trim();
  if (STEADFAST_PILLAR_MAP[key]) return STEADFAST_PILLAR_MAP[key];
  // Fuzzy fall-throughs for common renames
  if (key.includes('workforce')) return STEADFAST_PILLAR_MAP['workforce insights'];
  if (key.includes('physician') && key.includes('lifestyle')) return STEADFAST_PILLAR_MAP['physician lifestyle'];
  if (key.includes('staffing') || key.includes('leadership')) return STEADFAST_PILLAR_MAP['staffing strategy'];
  if (key.includes('industry') || key.includes('commentary')) return STEADFAST_PILLAR_MAP['industry commentary'];
  if (key.includes('lead') && key.includes('magnet')) return STEADFAST_PILLAR_MAP['lead magnet'];
  return null;
}

// Build a brief from the pillar config that injects cleanly into the user prompt.
function pillarBrief(cfg) {
  if (!cfg) return '';
  const beatList = cfg.beats.map((b, i) => `${i + 1}. ${b}`).join('\n');
  return `\n\nPILLAR FRAMEWORK (Steadfast Storytelling Outline):
- Default framework: ${cfg.framework}
- Best hook formulas for this pillar: ${cfg.bestHooks.map((h) => HOOK_FORMULAS[h].name).join(', ')}
- Narrative arc: ${cfg.arc}
- Reader should feel: ${cfg.feeling}

7-BEAT STORY SEQUENCE (follow in order):
${beatList}`;
}

// ─── PROMPT BUILDERS (Steadfast framework) ───
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

  return `You are an expert social media content strategist writing on ${platform} for ${brand.name || 'the client'}.

BRAND
- Name: ${brand.name || 'the client'}
- Tagline: ${brand.tagline || 'N/A'}
- Category: ${brand.category || 'N/A'}
- Pillars: ${brand.pillars.map((p) => p.name).join(', ')}

VOICE & TONE
${toneMap[tone] || toneMap.authoritative}

═══════════════════════════════════════════════════════════════════
STEADFAST STORYTELLING PRINCIPLES (Part 1 — apply to EVERY post)
═══════════════════════════════════════════════════════════════════

1.1 THE READER IS THE MAIN CHARACTER
Every post must make the reader feel the story is about THEIR life, THEIR hospital, THEIR career, THEIR decisions. Not about Steadfast. Not about the team. Not about the company.
- Bad opening: "Steadfast helps hospitals close coverage gaps."
- Good opening: "POV: You just lost a hospitalist with two weeks notice."
When the reader sees the hook, their brain should immediately register: "That is me. That is my hospital. That is my problem."

1.2 NO EM DASHES. EVER.
Em dashes (—, –, --) are BANNED across all content. This is non-negotiable.
- Do NOT use em dashes anywhere in the post.
- Do NOT use en dashes in place of em dashes.
- Do NOT use double hyphens (--) as a substitute.
When tempted to use one, use instead: a comma, a period and a new sentence, a colon, a line break, or rewrite the sentence.
- Wrong: "Most physicians still love patient care \u2014 it is the system around it that wore them down."
- Right: "Most physicians still love patient care."
- Right: "It is the system around it that wore them down."
Em dashes signal AI-generated content and feel performative. Steadfast's voice is direct.

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

VARIETY RULES
- Do NOT repeat common AI phrases like "here's the thing", "let that sink in", "read that again", "the harsh truth", "let me explain".
- Use a FRESH hook every time. Surprise the reader.
- The pillar framework and 7-beat sequence (in the user message) is the structure. Follow it.`;
}

export function buildUserPrompt(pillar, audience, topic, dataPoints, imageStyle, { keywords, keyPhrases, avoidTopics, trendingTopic, hookFormula, fridayPostType } = {}) {
  // FRIDAY BRANCH — completely different rules from Mon-Thu.
  if (fridayPostType && FRIDAY_POST_TYPES[fridayPostType]) {
    return buildFridayUserPrompt(audience, topic, { keywords, keyPhrases, avoidTopics, trendingTopic, fridayPostType });
  }

  let p = `Write a ${pillar.name} post targeting ${audience || pillar.audience}.`;

  // Inject Steadfast pillar framework (Part 2 of the storytelling outline)
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
  p += '\n\nHARD CONSTRAINTS:\n- ZERO em dashes (\u2014, \u2013, --). Use commas, periods, colons, or line breaks instead.\n- Reader is the main character. Frame everything from THEIR perspective, never Steadfast\u2019s.\n- Hook \u226415 words. Must work above the see-more cutoff.\n- Soft CTA only. No engagement bait.';
  if (avoidTopics?.length) {
    p += `\n- Topic distinctness: this post must NOT reuse any subject from the "topics already covered" list above. Different topic, not a different angle on the same topic.`;
  }

  // Random uniqueness seed
  p += `\n\nUNIQUENESS SEED: ${Math.random().toString(36).substring(2, 8)}. Write something FRESH and ORIGINAL — different from any previous generation.`;
  p += '\n\nReturn ONLY the raw post text. No labels, titles, or commentary. Use **bold** for 1-2 key phrases. End with 3-5 hashtags.';
  return p;
}


// ─── FRIDAY USER PROMPT BUILDER ───
// Builds the user-message prompt for one Friday attention post. Skips pillar
// brief, SLAY/PASS, 7-beat sequences, hook formulas (none of those apply).
// Instead injects the chosen post type + tie-back framework + brand safety.
function buildFridayUserPrompt(audience, topic, { keywords, keyPhrases, avoidTopics, trendingTopic, fridayPostType }) {
  const ft = FRIDAY_POST_TYPES[fridayPostType];
  let p = `Write a FRIDAY ATTENTION POST — type: ${ft.name}. Audience: ${audience || 'Both (hospital leaders AND physicians)'}.`;

  p += `\n\n═══ FRIDAY = THE ATTENTION ENGINE ═══
Unlike Monday-Thursday authority content (which builds trust over time), Friday posts are designed for SHARES and COMMENTS.
Sharp. Opinionated. Slightly provocative.
Like an industry insider reacting in real time — NOT a strategist explaining a framework.`;

  p += `\n\nPOST TYPE: ${ft.name}
${ft.brief}

How this type works:
${ft.rules}

Length cap: under ${ft.lengthCap} words. Shorter is better — the shorter the post, the more shareable.`;

  if (ft.needsTag) {
    p += `\n\nTAGGING:
This post type relies on tagging a real executive or original poster to extend reach into THEIR audience.
You do NOT know real names. Use clearly-marked placeholders the user will fill in before publishing:
- "@[CMO Name, Health System Name]"
- "@[CEO Name]"
- "@[Original Poster Name]"
Always tag at the start of a sentence, not buried mid-paragraph.`;
  }

  p += `\n\nTIE-BACK FRAMEWORK (mandatory — every Friday post must pass the one-sentence bridge test):
The post MUST connect the topic to the physician workforce, healthcare staffing, or hospital operations. Pick ONE of these 7 bridge categories:
${FRIDAY_BRIDGES.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Bridge test: state the connection in ONE sentence. If you can't, you've picked a forced topic — pick a different one. Forced bridges sound like "this celebrity controversy reminds me that in healthcare, people also face difficult situations" — never write that. A natural bridge sounds like "When a major employer leaves a community, the local hospital loses insured patients within 6 months and physician coverage gaps follow."`;

  p += `\n\nBRAND SAFETY CHECK:
Before finalizing, read the post through the lens of a hospital CMO considering working with Steadfast.
If it would make them hesitate, rewrite. Specifically NEVER:
- Personal attacks on named individuals (criticize STRATEGY and DECISIONS, never the person)
- Partisan political alignment (healthcare policy commentary is allowed, partisan alignment is not)
- Mocking physicians, patients, or healthcare workers
- Engagement bait phrases like "comment if you agree" or "share this if you care"
- Anything that feels manufactured to go viral`;

  // Trending topic / topic seed
  if (trendingTopic) {
    p += `\n\nSEED TOPIC (current viral story):\nTitle: ${trendingTopic.topic}\nAngle: ${trendingTopic.angle}\nWhy it's trending: ${trendingTopic.whyTrending}`;
    if (trendingTopic.suggestedHook) p += `\nSuggested hook: ${trendingTopic.suggestedHook}`;
  } else if (topic) {
    p += `\n\nSEED TOPIC: ${topic}`;
  } else if (fridayPostType !== 'hot_take') {
    p += `\n\nNo seed topic provided. Identify a viral story, trending healthcare moment, recent company news, or pattern you've noticed — whatever fits the assigned post type — and use it.`;
  }

  if (keywords && keywords.length) p += `\n\nKeywords to weave in naturally: ${keywords.join(', ')}`;
  if (keyPhrases && keyPhrases.length) p += `\n\nKey phrases to riff on:\n${keyPhrases.map((k) => `- "${k}"`).join('\n')}`;

  if (avoidTopics && avoidTopics.length) {
    const list = avoidTopics.map((t, i) => `${i + 1}. ${t}`).join('\n');
    p += `\n\nTOPICS ALREADY COVERED THIS WEEK — DO NOT REPEAT:\n${list}\n\nThis Friday post must address a topic DIFFERENT from every item above.`;
  }

  p += `\n\nHARD CONSTRAINTS:
- ZERO em dashes (—, –, --). Use commas, periods, colons, or line breaks instead.
- Under ${ft.lengthCap} words. Counted in actual words, not tokens.
- The bridge to physician workforce must be natural, not forced.
- No engagement bait phrases.
- No partisan political alignment.
- No personal attacks; analyze strategy and decisions, never character.
- Brand-safe by the CMO hesitation test.
- ${ft.needsTag ? 'Include a placeholder tag for the relevant exec or original poster.' : 'No tagging required for this post type.'}`;

  p += `\n\nUNIQUENESS SEED: ${Math.random().toString(36).substring(2, 8)}. Write something FRESH and ORIGINAL.`;
  p += '\n\nReturn ONLY the raw post text. No labels, titles, or commentary. Use **bold** for 1-2 key phrases. Hashtags optional on Friday (text-only is fine).';
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
