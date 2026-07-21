import { useState } from 'react';
import Icon from './Icon';

const MENU_GROUPS = [
  {
    title: 'IDEATION',
    items: [
      { id: 'radar', label: 'Build Radar', icon: 'radar' },
      { id: 'calendar', label: 'Sprint Calendar', icon: 'calendar' },
    ]
  },
  {
    title: 'THE BUILD',
    items: [
      { id: 'boilerplate', label: 'Code Boilerplate', icon: 'code' },
      { id: 'images', label: 'Architecture Visuals', icon: 'image' },
    ]
  },
  {
    title: 'THE CONTENT',
    items: [
      { id: 'youtube', label: 'YouTube Studio', icon: 'video' },
      { id: 'generate', label: 'LinkedIn Posts', icon: 'zap' },
    ]
  },
  {
    title: 'DISTRIBUTION',
    items: [
      { id: 'engagement', label: 'Repo Distribution', icon: 'message' },
      { id: 'archive', label: 'Knowledge Base', icon: 'archive' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: 'sliders' },
    ]
  }
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="w-64 border-r border-[var(--card-border)] bg-[var(--surface-2)] flex flex-col h-full overflow-y-auto custom-scrollbar flex-shrink-0">
      <div className="p-4 flex-1">
        {MENU_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="mb-6">
            <h3 className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2 px-3">
              {group.title}
            </h3>
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
        AI Data Product Architect
      </div>
    </aside>
  );
}
