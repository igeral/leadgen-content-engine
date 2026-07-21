import Icon from './Icon';

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STYLE_META = {
  stat: { label: 'Stat Card', color: '#3b82f6' },
  quote: { label: 'Quote Card', color: '#8b5cf6' },
  multi: { label: 'Carousel', color: '#10b981' },
};

const HOOK_LABELS = {
  direct_question: 'Direct Question',
  bold_stat: 'Bold Stat',
  reframe: 'Reframe',
  story_opener: 'Story Opener',
  contrarian: 'Contrarian',
  pov_scenario: 'POV Scenario',
};

// Sort slots within a day by clock time.
function timeMinutes(t) {
  const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

// The operating checklist mirrors the build-to-post process doc, not generic
// social-media advice.
const CHECKLIST = [
  { t: 'Weekend', d: 'One 2-3h build on Databricks Free Edition (pick it in Build Radar). Jot rough notes; paste them into Generate. The build feeds the whole week.' },
  { t: 'Before posting', d: 'Spend 10 min leaving 2 genuinely expert comments on big data-engineering posts. Peers notice peers.' },
  { t: 'First hour', d: 'Reply to every comment, ask a follow-up back. WHO comments matters more than how many.' },
  { t: 'Every post', d: 'End with ONE expertise invite ("built this differently? tell me how"). Never generic engagement bait.' },
];

export default function CalendarPage({ brand }) {
  const sched = Array.isArray(brand.schedule) ? brand.schedule : [];
  const days = WEEK.filter((d) => sched.some((s) => s.day === d));

  if (!sched.length) {
    return (
      <div className="animate-fade-in">
        <div className="card p-12 text-center">
          <h2 className="text-xl font-bold text-white mb-2">No schedule for this brand</h2>
          <p className="text-gray-400 text-sm">This brand has no posting schedule defined. Add one in the preset, or switch lanes in the header.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Icon name="calendar" size={22} strokeWidth={2.2} /> Weekly Content Calendar
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {brand.name} · {sched.length} posts/week · build-first: Tue build story, Thu pattern, Sat ecosystem take
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((d) => {
            const ds = sched.filter((s) => s.day === d).sort((a, b) => timeMinutes(a.time) - timeMinutes(b.time));
            return (
              <div key={d}>
                <h3 className="font-bold text-white mb-3 text-center pb-2 border-b border-gray-600">{d}</h3>
                <div className="space-y-2">
                  {ds.map((s, i) => {
                    const sm = STYLE_META[s.imageStyle];
                    return (
                      <div key={i} className="slot-card bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          <Icon name="clock" size={11} /> {s.time}
                        </div>
                        <div className="text-sm font-semibold text-white mb-1">{s.pillar}</div>
                        <div className="text-xs text-gray-400 mb-2">{'→'} {s.audience}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.hookFormula && HOOK_LABELS[s.hookFormula] && (
                            <span className="badge text-xs" style={{ background: 'rgba(148,163,184,0.15)', color: '#cbd5e1' }}>
                              {HOOK_LABELS[s.hookFormula]}
                            </span>
                          )}
                          <span className="badge text-xs" style={{ background: sm ? sm.color : '#475569', color: '#fff' }}>
                            {sm ? sm.label : 'Text Only'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-1">Operating checklist</h3>
        <p className="text-xs text-gray-500 mb-4">The weekly loop. Full process in strategy/databricks-build-to-post-process.md.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKLIST.map((item, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-blue-400 font-bold text-sm mb-1">{item.t}</div>
              <div className="text-gray-300 text-sm">{item.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
