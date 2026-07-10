export const STEADFAST_PRESET = {
  presetId: 'steadfast',
  name: 'Steadfast Physician Partners',
  tagline: 'The physician’s guide to locum tenens. Pay, licensing, and the 1099 life.',
  category: 'The company that helps physicians build profitable locum tenens careers, and helps hospital leaders see coverage gaps before they become crises. Physician-first: the audience we grow and serve is physicians; hospital-facing authority content keeps the brand credible to the buyers those physicians eventually work for.',
  colors: {
    primary: '#1a365d',
    secondary: '#2c5282',
    accent: '#3182ce',
    light: '#bee3f8',
    bg: '#1a365d',
    text: '#ffffff',
  },
  pillars: [
    { name: 'Workforce Insights', audience: 'Hospital Leaders', description: 'Data-driven content about physician shortages and capacity gaps. Default framework PASS, hooks Bold Stat or Reframe.' },
    { name: 'Physician Lifestyle', audience: 'Physicians', description: 'Content for physicians considering locum work and career flexibility. Default framework SLAY, hooks Direct Question, Story Opener, Bold Stat.' },
    { name: 'Staffing Strategy', audience: 'Hospital Leaders', description: 'Proactive staffing frameworks, cost analysis, and locum strategy. Default framework PASS or SLAY, hooks Contrarian Claim or POV Scenario.' },
    { name: 'Industry Commentary', audience: 'Both', description: 'Hot takes on healthcare policy, Match results, market shifts. Default framework SLAY adapted, hook Reframe.' },
    { name: 'Lead Magnet', audience: 'Physicians', description: 'Soft introduction to the physician lead magnet (1099 Starter Kit). Thursday 5:15 PM slot. Hooks Story Opener or Direct Question. CTA is a comment trigger ("comment TAX and I will DM it") serviced by the Engagement Studio. Never external links.' },
  ],
  // Master weekly schedule (Steadfast Pillar Post Schedule v2.0 — heartbeat).
  // 6 slots: one post per weekday, two on Friday (the attention engine).
  // Cut from 13 (2026-07-09): company-page reach (~1.6% of followers) makes
  // extra volume worthless; distribution now comes from the monthly invite
  // ritual + commenting as the page, not post count. Mix is physician-first
  // (3 physician, 1 hospital, 2 both) because physicians are the side the
  // affiliate model monetizes (see strategy/ unified doc).
  schedule: [
    { day: 'Monday',    time: '12:00 PM', pillar: 'Physician Lifestyle', audience: 'Physicians',       hookFormula: 'story_opener',    imageStyle: 'quote', variant: 'light' },
    { day: 'Tuesday',   time: '12:00 PM', pillar: 'Workforce Insights',  audience: 'Hospital Leaders', hookFormula: 'bold_stat',       imageStyle: 'stat',  variant: 'dark'  },
    { day: 'Wednesday', time: '12:00 PM', pillar: 'Physician Lifestyle', audience: 'Physicians',       hookFormula: 'direct_question', imageStyle: 'multi', variant: 'light' },
    { day: 'Thursday',  time: '5:15 PM',  pillar: 'Lead Magnet',         audience: 'Physicians',       hookFormula: 'story_opener',    imageStyle: 'quote', variant: 'light' },
    // FRIDAY = attention engine. Two posts, text-only by default (image optional
    // per the doc). Post type chosen at runtime from FRIDAY_POST_TYPES so each
    // Friday rotates through different angles (Newsjack, Hot Take, etc.).
    { day: 'Friday',    time: '10:00 AM', pillar: 'Friday Newsjack',     audience: 'Both',             friday: true, imageStyle: null, variant: null },
    { day: 'Friday',    time: '12:00 PM', pillar: 'Friday Newsjack',     audience: 'Both',             friday: true, imageStyle: null, variant: null },
  ],
  leadMagnet: {
    name: 'The Locum Physician 1099 Starter Kit',
    audience: 'Physicians curious about or already doing locum tenens work',
    description: 'A practical starter kit for the business side of locum work: 1099 vs W-2 basics, deduction checklist, quarterly tax calendar, IMLC multi-state licensing overview, and the questions to ask any agency before signing. Cites real sources (IRS publications, IMLC.gov). Not tax or legal advice.',
    cta: 'Comment "TAX" and I will DM you the kit. No email required.',
  },
  dataPoints: [
    '86,000 projected physician shortage by 2036',
    '65% of hospitals have run below capacity due to staffing shortages',
    'Rural hospitals face 60% projected physician shortage vs 10% urban',
    '$1M+ lost annually per unfilled physician position',
    'Average permanent physician search takes 6-12 months',
    '40% of hospital leaders already use locum tenens to address demand spikes',
    '2026 Match: largest in history with 41,482 positions filled',
    'Resident Physician Shortage Reduction Act would add 14,000 residency slots over 7 years',
  ],
};
