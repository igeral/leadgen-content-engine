import { useState } from 'react';
import Icon from './Icon';

// Groups are numbered because the weekly loop is a sequence, not a menu of
// equal choices: pick the sprint, build it, write the posts, work the comments.
// Labels say what the page does, not what it is branded as.
const MENU_GROUPS = [
  {
    title: '1 · PLAN',
    items: [
      { id: 'radar', label: 'Build Radar', icon: 'radar' },
      { id: 'calendar', label: 'Sprint Calendar', icon: 'calendar' },
    ]
  },
  {
    title: '2 · BUILD',
    items: [
      { id: 'boilerplate', label: 'Frontend Scaffold', icon: 'code' },
      { id: 'images', label: 'Cards & Charts', icon: 'image' },
    ]
  },
  {
    title: '3 · WRITE',
    items: [
      { id: 'generate', label: 'Generate Posts', icon: 'zap' },
    ]
  },
  {
    title: '4 · AFTER POSTING',
    items: [
      { id: 'engagement', label: 'Comments to DMs', icon: 'message' },
      { id: 'archive', label: 'Post Archive', icon: 'archive' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: 'sliders' },
    ]
  },
  {
    // Parked, not deleted. YouTube is a separate audience curve measured in
    // years and reaches learners rather than hirers. See strategy_overview.md.
    title: 'PARKED',
    muted: true,
    items: [
      { id: 'youtube', label: 'YouTube Studio', icon: 'video' },
    ]
  }
];

export default function Sidebar({ page, setPage, isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`
        fixed md:relative w-64 h-[calc(100vh-73px)] md:h-full z-30 
        border-r border-[var(--card-border)] bg-[var(--surface-2)] 
        flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {MENU_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className={`mb-6 ${group.muted ? 'opacity-50' : ''}`}>
            <h3 className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2 px-3">
              {group.title}
            </h3>
            {group.muted && (
              <p className="text-[10px] text-[var(--text-3)] px-3 mb-2 leading-snug">
                Not part of the current plan. Short native clips go on the Thursday post instead.
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = page === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setPage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'font-semibold'
                          : 'text-[var(--text-2)] hover:bg-[var(--surface)] hover:text-[var(--text-1)]'
                      }`}
                      style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' } : undefined}
                    >
                      <Icon name={item.icon} size={16} strokeWidth={isActive ? 2.5 : 2} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[var(--card-border)] text-xs text-[var(--text-3)] text-center">
        Data & Lakehouse Architect
      </div>
    </aside>
    </>
  );
}
