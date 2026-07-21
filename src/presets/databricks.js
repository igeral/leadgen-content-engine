// Victor's personal-LinkedIn brand preset. This is the career lane: the goal
// is to make his Databricks skill publicly verifiable.
// Hard rules: PUBLIC knowledge only, meaning docs, release notes, blogs,
// conference talks, and published case studies. NEVER employer internals,
// client names, colleagues, or anything learned on the job that is not
// already public. The day job must never be put at risk.
// Cadence is deliberately light (3 slots/week) and build-first: Build Log
// posts require Victor's real notes from a weekend build.
export const DATABRICKS_PRESET = {
  presetId: 'databricks',
  name: 'Victor Anirah',
  tagline: 'Data & AI engineering, from the trenches',
  category: 'Personal LinkedIn brand of a data analytics engineer. Practical Databricks, lakehouse, and Power BI content that makes real skill publicly visible. Built on public sources only, never employer internals.',
  colors: {
    primary: '#1B3139',
    secondary: '#2D4550',
    accent: '#FF3621',
    light: '#FFE8E4',
    bg: '#1B3139',
    text: '#ffffff',
  },
  // Consumed by buildSystemPrompt.
  positioning: `This is Victor's personal brand, and it exists to do one thing: make him so publicly, verifiably good at the Databricks ecosystem that $200k+ analytics engineering and analytics manager roles come to him, and the Databricks community itself takes notice.
Every post should read like it was written by someone a hiring manager would shortlist on the spot:
- Enterprise-grade thinking: governance (Unity Catalog), medallion data layers, cost control, security, team skill ramp. Speak to the problems enterprises actually hire $200k+ people to solve.
- Hands-on fluency: Lakeflow, Genie spaces, DBSQL, serverless. Written from doing, not from reading.
- Honest practitioner perspective: what worked, what did not, what it cost. The tech moves fast and everyone is learning it in real time; owning that IS the credibility.
Never state any of this ambition in a post. Show it through the quality of the thinking.`,
  engagementStrategy: `Every post is a STORY first: a problem hit, a build, a migration, a cost spike, a lesson learned. Open in the middle of the action. Never open with a feature announcement or a definition.
End every post with ONE specific, genuine comment invitation that treats readers as peers and asks for their EXPERTISE, not their approval. Rotate patterns like:
- "If you would have built this differently, I want to hear how."
- "What data source would you want to see this pattern on? Comment it and I might build it."
- "Anyone found a cleaner way to handle this? Genuinely asking."
- "What did your team hit when you rolled this out?"
Never generic engagement bait ("thoughts?", "comment below if you agree"). WHO comments matters more than how many: one senior practitioner disagreeing thoughtfully in the comments is worth 50 likes.
Share test before finishing: would a data engineer send this to a teammate with the message "this is exactly our problem"? If not, sharpen the specificity.`,
  voiceExamples: {
    readerWorld: 'THEIR pipelines, THEIR dashboards, THEIR stakeholders, THEIR career',
    bad: 'I want to share some thoughts on Databricks Genie.',
    good: 'POV: Your CFO just asked why the Databricks bill doubled this quarter.',
  },
  vocabulary: [
    'Say "lakehouse" only where technically accurate, never as filler jargon.',
    'Opinions are flagged as opinions ("in my experience", "my read"). Facts cite public sources.',
    'Never imply insider or employer knowledge. If it is not public, it does not exist.',
    'Never name or hint at the employer, colleagues, or internal projects.',
    'Say "data teams" not "resources".',
  ],
  pillars: [
    { name: 'Build Log', audience: 'Data Engineers', description: 'First-person stories from REAL weekend builds on Databricks Free Edition (public datasets, GitHub repo linked in comments). Written ONLY from Victor\'s pasted build notes — the engine must never invent a build. What was built, what broke, what it cost, what surprised him. End by inviting better approaches.' },
    { name: 'Platform Deep Dives', audience: 'Data Engineers', description: 'Hands-on stories of learning and using Databricks features (Genie spaces, Lakeflow, Unity Catalog, DBSQL, serverless) from public docs and release notes. Show, do not summarize. End by inviting better approaches: "if you would have done this differently, tell me how."' },
    { name: 'Architecture Patterns', audience: 'Data Leaders', description: 'Databricks + Power BI integration patterns, medallion data layers, governance, cost and performance trade-offs. Speak to enterprise decision criteria: what a team lead or director actually weighs. Invite readers to share what their stack does instead.' },
    { name: 'Ecosystem News', audience: 'Both', description: 'Sharp, fast commentary on Databricks announcements, releases, Summit news, and the broader data/AI market. Take a defensible position; invite practitioners to disagree in the comments.' },
    { name: 'Use Case Breakdowns', audience: 'Data Leaders', description: 'How real industries apply lakehouse + BI, drawn from published case studies. Always cite the public source. End by asking which data source or industry readers want broken down next.' },
    { name: 'Career & Craft', audience: 'Data Engineers', description: 'Lessons from ~8 years in BI and analytics engineering, told as stories. Honest, practical, personal. The "anyone can learn anything now" energy: how fast the tools move and how to keep up. Invite readers\' own lessons. No employer internals, ever.' },
  ],
  // 3 slots/week, never two in one day (LinkedIn spaces same-author posts).
  // The weekend build feeds the week: Tue = the build story (requires real
  // build notes), Thu = the pattern/lesson extracted from it, Sat = ecosystem
  // take. Scale to 4-5/week only when builds outpace posts.
  schedule: [
    { day: 'Tuesday',  time: '8:00 AM',  pillar: 'Build Log',             audience: 'Data Engineers', hookFormula: 'story_opener', imageStyle: 'quote', variant: 'light' },
    { day: 'Thursday', time: '12:00 PM', pillar: 'Architecture Patterns', audience: 'Data Leaders',   hookFormula: 'contrarian',   imageStyle: 'stat',  variant: 'dark'  },
    { day: 'Saturday', time: '10:00 AM', pillar: 'Ecosystem News',        audience: 'Both',           hookFormula: 'reframe',      imageStyle: 'quote', variant: 'light' },
  ],
  leadMagnet: null,
  // All public, well-reported facts. Verify each is still current before it ships in a post.
  dataPoints: [
    'Databricks raised a $10B Series J in late 2024 at a $62B valuation',
    'Databricks acquired MosaicML for $1.3B in 2023',
    'Databricks acquired Tabular, founded by the creators of Apache Iceberg, in 2024',
    'Unity Catalog was open-sourced in June 2024',
    'AI/BI Genie lets business users query governed data in natural language',
  ],
};
