export default function CalendarPage({ brand }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const sched = brand.schedule.length > 0
    ? brand.schedule
    : [
        { day: 'Monday', time: '9:00 AM', pillar: 'Educational', audience: 'Primary', imageStyle: 'stat' },
        { day: 'Tuesday', time: '12:00 PM', pillar: 'Storytelling', audience: 'Both', imageStyle: 'quote' },
        { day: 'Wednesday', time: '9:00 AM', pillar: 'Industry', audience: 'Primary', imageStyle: 'multi' },
        { day: 'Thursday', time: '12:00 PM', pillar: 'Lead Magnet', audience: 'Primary', imageStyle: 'stat' },
      ];
  const styleColors = { stat: '#3b82f6', quote: '#8b5cf6', multi: '#10b981' };
  const styleLabels = { stat: 'Stat Card', quote: 'Quote Card', multi: 'Multi-Set' };

  const CHECKLIST = [
    { t: 'Before Posting', d: 'Spend 20 min engaging with target audience posts. Thoughtful comments warm the algorithm.' },
    { t: 'First 30 Minutes', d: 'Reply to every comment within 30 min. LinkedIn measures comments/min in the first hour.' },
    { t: 'The 1+3 Rule', d: 'Leave 3 comments: behind-the-scenes context, an educational tip, and a question.' },
    { t: 'End of Day', d: "Return to yesterday's post. Late engagement extends distribution." },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">{'\uD83D\uDCC5'} Weekly Content Calendar</h2>

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          {days.map((d) => {
            const ds = sched.filter((s) => s.day === d);
            return (
              <div key={d}>
                <h3 className="font-bold text-white mb-3 text-center pb-2 border-b border-gray-600">{d}</h3>
                <div className="space-y-2">
                  {ds.length > 0 ? ds.map((s, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-blue-500 transition-all">
                      <div className="text-xs text-gray-400 mb-1">{s.time}</div>
                      <div className="text-sm font-semibold text-white mb-1">{s.pillar}</div>
                      <div className="text-xs text-gray-400 mb-2">{'\u2192'} {s.audience}</div>
                      <span className="badge text-xs" style={{ background: styleColors[s.imageStyle] || '#475569', color: '#fff' }}>
                        {styleLabels[s.imageStyle] || s.imageStyle}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center text-gray-600 text-sm py-4">No posts</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">{'\uD83D\uDD25'} Daily Engagement Checklist</h3>
        <div className="grid grid-cols-2 gap-4">
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
