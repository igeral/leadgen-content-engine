import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import Icon from './Icon';

// Ordered by the actual weekly workflow: find a build (Radar), write from the
// build notes (Generate), see the week (Calendar), manage drafts (Archive),
// work the comments (Engagement), make cards (Images), configure (Settings).
const NAV_ITEMS = [
  { id: 'radar', label: 'Build Radar', icon: 'radar' },
  { id: 'generate', label: 'Generate', icon: 'zap' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'archive', label: 'Archive', icon: 'archive' },
  { id: 'engagement', label: 'Engagement', icon: 'message' },
  { id: 'images', label: 'Images', icon: 'image' },
  { id: 'settings', label: 'Settings', icon: 'sliders' },
];

// The active pill physically travels between tabs (measured, not faked).
export default function NavBar({ page, setPage }) {
  const btnRefs = useRef({});
  const [pill, setPill] = useState(null);

  const measure = () => {
    const el = btnRefs.current[page];
    if (el) setPill({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    else setPill(null);
  };

  useLayoutEffect(measure, [page]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  return (
    <nav className="nav-bar border-b border-gray-700 px-6 flex gap-1 py-2 relative flex-wrap">
      {pill && (
        <span
          className="nav-pill"
          style={{ transform: `translate(${pill.left}px, ${pill.top}px)`, width: pill.width, height: pill.height }}
        />
      )}
      {NAV_ITEMS.map((n) => (
        <button
          key={n.id}
          ref={(el) => { btnRefs.current[n.id] = el; }}
          className={`nav-tab ${page === n.id ? 'nav-tab-active' : ''}`}
          onClick={() => setPage(n.id)}
        >
          <Icon name={n.icon} size={15} strokeWidth={2.2} /> {n.label}
        </button>
      ))}
    </nav>
  );
}
