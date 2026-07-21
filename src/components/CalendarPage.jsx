import Icon from './Icon';

const SPRINT_SCHEDULE = [
  {
    phase: 'Phase 1: The Build',
    day: 'Weekend',
    focus: 'Databricks Free Edition',
    description: 'Pick an enterprise problem from Build Radar. Build a 2-3 hour solution. Jot rough notes, what broke, and performance metrics.',
    type: 'Code & Architecture'
  },
  {
    phase: 'Phase 2: The Breakdown',
    day: 'Tuesday',
    focus: 'YouTube Teardown',
    description: 'Use YouTube Studio to script a 5-10 minute whiteboard teardown or screen-share of the weekend build.',
    type: 'Long-form Video'
  },
  {
    phase: 'Phase 3: The Assets',
    day: 'Thursday',
    focus: 'LinkedIn Carousel',
    description: 'Generate an architecture diagram or benchmark chart in Image Studio. Pair with a LinkedIn post explaining the ROI of the build.',
    type: 'Visual & Text'
  },
  {
    phase: 'Phase 4: The Takeaway',
    day: 'Saturday',
    focus: 'Text & Boilerplate',
    description: 'Post the Boilerplate generator code or a high-level text post discussing the strategy behind the architecture.',
    type: 'Text Only'
  }
];

export default function CalendarPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Icon name="calendar" size={22} strokeWidth={2.2} /> Bi-Weekly Sprint View
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          AI Data Product Architect operating rhythm. One build fuels the entire week's content.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Sprint Rhythm</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPRINT_SCHEDULE.map((s, i) => (
            <div key={i} className="bg-[var(--surface-2)] rounded-xl p-5 border border-[var(--card-border)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)] opacity-80" />
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs font-bold text-[var(--accent)] tracking-wider uppercase mb-1">{s.phase}</div>
                  <h4 className="text-lg font-bold text-[var(--text-1)]">{s.day}</h4>
                </div>
                <span className="badge bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-2)] text-xs">
                  {s.type}
                </span>
              </div>
              <div className="text-sm font-semibold text-[var(--text-1)] mb-2">{s.focus}</div>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-2">Distribution Rules</h3>
        <ul className="space-y-3">
          <li className="flex gap-3 text-sm">
            <Icon name="zap" size={18} className="text-yellow-500 shrink-0" />
            <span className="text-[var(--text-2)]"><strong>Before posting:</strong> Spend 10 minutes leaving 2 genuinely expert comments on big data-engineering posts. Peers notice peers.</span>
          </li>
          <li className="flex gap-3 text-sm">
            <Icon name="message" size={18} className="text-blue-500 shrink-0" />
            <span className="text-[var(--text-2)]"><strong>First hour:</strong> Reply to every comment, ask a follow-up back. WHO comments matters more than how many.</span>
          </li>
          <li className="flex gap-3 text-sm">
            <Icon name="code" size={18} className="text-purple-500 shrink-0" />
            <span className="text-[var(--text-2)]"><strong>Every post:</strong> End with ONE expertise invite ("built this differently? tell me how"). Never generic engagement bait.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
