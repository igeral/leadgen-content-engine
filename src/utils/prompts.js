import { getPillarConfig, HOOK_FORMULAS, pillarBrief } from './storytelling.js';
import { shuffle } from './parsers.js';

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

export const IMAGE_STYLE_SEEDS = [
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

  return `You are an AI Data Product Architect and expert social media content strategist writing on ${platform} for ${bn}. You target Founding Engineers, Fractional CTOs, and enterprise data leaders. Your goal is to showcase architecture teardowns, UI showcases, and production-ready data product blueprints rather than basic tutorials.

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

export function buildUserPrompt(pillar, audience, topic, dataPoints, imageStyle, { keywords, keyPhrases, avoidTopics, trendingTopic, hookFormula, brandName, sourceNotes, targetBrand } = {}) {

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
  if (targetBrand) p += `\n\nTARGET ENTERPRISE BRAND TO MIMIC:\nThis post should frame the project as "Inspired by ${targetBrand}" or refer to a challenge specifically faced by ${targetBrand}.`;
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