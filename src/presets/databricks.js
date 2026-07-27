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
  category: 'Personal LinkedIn brand of a data and lakehouse architect. Case studies showing how to build the "Last Mile" of enterprise data work: a Databricks backend connected to a React or PowerApp frontend people actually use. Built on real public datasets and framed by industry, never by a named company.',
  colors: {
    primary: '#1B3139',
    secondary: '#2D4550',
    accent: '#FF3621',
    light: '#FFE8E4',
    bg: '#1B3139',
    text: '#ffffff',
  },
  // Consumed by buildSystemPrompt.
  positioning: `This is Victor's personal brand, and it exists to do one thing: make him so publicly, verifiably good at lakehouse architecture and the Last Mile that senior data architecture roles at established companies come to him. One buyer: a company hiring a full-time individual contributor. The stretch version of that buyer is a Databricks or Databricks-partner Solutions Architect role.
Every post should read like it was written by someone a hiring manager would shortlist on the spot:
- Architecture-level thinking: layer boundaries, governance placement, cost control, and the trade-off accepted with each choice. Decisions, not tutorials.
- The Last Mile: connecting Databricks pipelines to frontends people actually use. Most data engineers cannot do this half, and most frontend developers do not understand the other half. That intersection is the differentiator.
- Honest practitioner perspective: what worked, what did not, what it cost, and where the design stops working.
Frame problems by INDUSTRY, never by a named company. Claiming to solve a specific brand's problem reads as spec work to senior practitioners, because the real constraints (scale, compliance, legacy, org politics) are invisible from outside.
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
  // `requiresNotes: true` marks pillars that make first-person build claims.
  // The prompt engine refuses to invent experience for these when no real
  // build notes are pasted in. Never remove the flag from a build pillar.
  pillars: [
    { name: 'Architecture Teardown', audience: 'Data Leaders / Architects', requiresNotes: true, description: 'Deep dive into the Databricks backend of the build: medallion layers, the serving path, governance placement, and the trade-offs accepted. Written from real build notes only.' },
    { name: 'UI Showcase', audience: 'Data Leaders / Architects', requiresNotes: true, description: 'The React or PowerApp frontend consuming the Databricks data. Focus on what the user can now do and the hard part of the Last Mile: latency, auth, and payload shaping. Written from real build notes only.' },
    { name: 'Business Value', audience: 'Business Leaders', description: 'The ROI story for the sector, never for a named company. What the cost of not having this architecture looks like, in budget-owner language. No deep code.' },
    { name: 'Ecosystem News', audience: 'Both', description: 'Sharp, fast commentary on Databricks announcements and AI market shifts. Take a defensible position.' },
    { name: 'Career & Craft', audience: 'Data Engineers', description: 'Evergreen lessons from ~8 years in BI and analytics engineering, told as stories. Not tied to a build or to the news, so this is the pillar the statics bank draws from. No employer internals, ever.' },
  ],
  // 3 posts a week, never two in one day. One real build every two weeks
  // feeds the Tue and Thu posts; Sat stands alone so the week never depends
  // on the build landing. Career & Craft is intentionally unscheduled: it is
  // the statics-bank pillar used as the fallback when a build slips.
  // imageStyle must be one of stat | quote | multi, or null for text-only.
  // UI Showcase is null on purpose: that post carries a real screenshot or
  // screen recording of the app, not a generated card.
  schedule: [
    { day: 'Tuesday',  time: '8:00 AM',  pillar: 'Architecture Teardown', audience: 'Data Leaders / Architects', hookFormula: 'story_opener', imageStyle: 'multi', variant: 'dark' },
    { day: 'Thursday', time: '12:00 PM', pillar: 'UI Showcase',           audience: 'Data Leaders / Architects', hookFormula: 'reframe',      imageStyle: null,    variant: null },
    { day: 'Saturday', time: '10:00 AM', pillar: 'Business Value',        audience: 'Business Leaders',          hookFormula: 'contrarian',   imageStyle: 'stat',  variant: 'dark' },
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
