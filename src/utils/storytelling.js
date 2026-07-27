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
  'architecture teardown': {
    framework: 'SLAY',
    bestHooks: ['story_opener', 'pov_scenario'],
    arc: 'Drop the reader inside the build → the decision that mattered → what broke → what the numbers said → invite better approaches.',
    feeling: 'This person actually builds. I want to see the repo.',
    beats: [
      'Open mid-action, inside the build. A decision, a constraint, or the thing that broke. Never open with a feature announcement.',
      'State what you set out to make and which real public dataset you pointed at it. One or two lines.',
      'Walk the architecture as decisions, not as a diagram description: where the layer boundaries sit, what runs incrementally, where governance lives, and why each choice was made.',
      'The friction: what failed, what surprised you, what the docs did not say. Only someone who built it can write this part.',
      'The numbers: rows processed, runtime, cost, rows dropped. Specific figures from the notes, never invented.',
      'The trade-off you accepted, and where this design stops working at larger scale.',
      'Mention the repo or notebook is linked in the comments. Never a link in the caption.',
      'Close with ONE expertise invite: if you would have built this differently, say how.',
    ],
  },
  'ui showcase': {
    framework: 'SLAY',
    bestHooks: ['reframe', 'pov_scenario'],
    arc: 'The moment the data became usable → what the user can now do → the one hard part of the last mile → what you would change → invite counter-approaches.',
    feeling: 'The pipeline is only half the job, and this person finished the other half.',
    beats: [
      'Open on the gap: a pipeline nobody can use is a cost centre. Put the reader in front of the dashboard nobody opens.',
      'Show what the interface actually does in one concrete user action. Specific, not "improves visibility".',
      'Explain how the frontend consumes the data: the serving layer, the query path, what is cached, what is live.',
      'The hard part of the last mile: latency, auth, shaping the payload, or the query that was fine in SQL and terrible behind a click.',
      'What you would change in v2, stated plainly.',
      'Note the screen recording or repo is in the comments.',
      'Close with ONE expertise invite about their own serving layer choices.',
    ],
  },
  'business value': {
    framework: 'PASS',
    bestHooks: ['contrarian', 'bold_stat'],
    arc: 'Name the cost the business is already paying → make it concrete → what the architecture changes → the honest limit → invite their numbers.',
    feeling: 'This person thinks about money, not just pipelines. I would put them in front of an exec.',
    beats: [
      'Open with the cost the business is already absorbing without seeing it: rework, stale decisions, duplicated spend, an audit that failed.',
      'Make it concrete for the sector, not for one company. Use a real public figure where you have one, and cite it.',
      'State what the architecture actually changes, in the language a budget owner uses.',
      'Show the mechanism briefly so it is credible to a technical reader, without becoming a code post.',
      'The honest limit: when this is not worth the build, and what has to be true for the ROI to hold.',
      'Close with ONE expertise invite asking what this costs at their scale.',
    ],
  },
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
  // Fuzzy fall-throughs so a pillar rename degrades gracefully instead of
  // silently dropping the whole storytelling framework from the prompt.
  if (key.includes('teardown')) return PILLAR_MAP['architecture teardown'];
  if (key.includes('ui') || key.includes('showcase') || key.includes('frontend')) return PILLAR_MAP['ui showcase'];
  if (key.includes('business') || key.includes('value') || key.includes('roi')) return PILLAR_MAP['business value'];
  if (key.includes('build')) return PILLAR_MAP['build log'];
  if (key.includes('deep dive') || key.includes('platform')) return PILLAR_MAP['platform deep dives'];
  if (key.includes('architecture') || key.includes('pattern')) return PILLAR_MAP['architecture patterns'];
  if (key.includes('ecosystem') || key.includes('news')) return PILLAR_MAP['ecosystem news'];
  if (key.includes('use case') || key.includes('breakdown')) return PILLAR_MAP['use case breakdowns'];
  if (key.includes('career') || key.includes('craft')) return PILLAR_MAP['career & craft'];
  return null;
}

export function pillarBrief(cfg) {
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