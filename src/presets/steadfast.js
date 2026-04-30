export const STEADFAST_PRESET = {
  name: 'Steadfast Physician Partners',
  tagline: 'Reliable Physician Coverage. Deployed Fast.',
  category: 'The company that helps hospitals eliminate physician coverage gaps before they become crises.',
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
    { name: 'Lead Magnet', audience: 'Hospital Leaders', description: 'Soft introduction to the offer. Thursday 5:15 PM slot. Hooks Story Opener or Direct Question. Link in comments, never in caption.' },
  ],
  // Master weekly schedule (Steadfast Pillar Post Schedule v1.0).
  // 11 fixed slots Mon-Thu. Each slot dictates pillar, audience, hook formula,
  // image system, and variant. Image variants chosen to obey the
  // "no two consecutive dark images same day" rule (multi-set variants
  // assigned Light on Tue/Wed noon to break up the Dark Stat Card runs).
  schedule: [
    { day: 'Monday',    time: '7:30 AM',  pillar: 'Physician Lifestyle', audience: 'Physicians',       hookFormula: 'direct_question', imageStyle: 'quote', variant: 'light' },
    { day: 'Monday',    time: '12:00 PM', pillar: 'Workforce Insights',  audience: 'Hospital Leaders', hookFormula: 'bold_stat',       imageStyle: 'stat',  variant: 'dark'  },
    { day: 'Tuesday',   time: '7:30 AM',  pillar: 'Industry Commentary', audience: 'Both',             hookFormula: 'reframe',         imageStyle: 'quote', variant: 'light' },
    { day: 'Tuesday',   time: '12:00 PM', pillar: 'Workforce Insights',  audience: 'Hospital Leaders', hookFormula: 'bold_stat',       imageStyle: 'multi', variant: 'light' },
    { day: 'Tuesday',   time: '2:30 PM',  pillar: 'Physician Lifestyle', audience: 'Physicians',       hookFormula: 'story_opener',    imageStyle: 'stat',  variant: 'dark'  },
    { day: 'Tuesday',   time: '5:15 PM',  pillar: 'Staffing Strategy',   audience: 'Hospital Leaders', hookFormula: 'pov_scenario',    imageStyle: 'quote', variant: 'light' },
    { day: 'Wednesday', time: '7:30 AM',  pillar: 'Physician Lifestyle', audience: 'Physicians',       hookFormula: 'bold_stat',       imageStyle: 'quote', variant: 'light' },
    { day: 'Wednesday', time: '12:00 PM', pillar: 'Workforce Insights',  audience: 'Hospital Leaders', hookFormula: 'contrarian',      imageStyle: 'multi', variant: 'light' },
    { day: 'Wednesday', time: '5:15 PM',  pillar: 'Industry Commentary', audience: 'Both',             hookFormula: 'bold_stat',       imageStyle: 'stat',  variant: 'dark'  },
    { day: 'Thursday',  time: '12:00 PM', pillar: 'Staffing Strategy',   audience: 'Hospital Leaders', hookFormula: 'contrarian',      imageStyle: 'multi', variant: 'dark'  },
    { day: 'Thursday',  time: '5:15 PM',  pillar: 'Lead Magnet',         audience: 'Hospital Leaders', hookFormula: 'story_opener',    imageStyle: 'quote', variant: 'light' },
  ],
  leadMagnet: {
    name: 'Proactive Coverage Playbook',
    audience: 'Hospital CMOs and operations leaders',
    description: 'A practical framework for eliminating physician coverage gaps before they become crises. Five-step proactive staffing model, specialty risk matrix, credentialing timeline templates.',
    cta: 'The link to download is in the first comment.',
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
