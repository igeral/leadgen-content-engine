import { useState, useMemo } from 'react';
import Icon from './Icon';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_ACCENTS = {
  Monday:    { bar: '#3b82f6', chip: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  Tuesday:   { bar: '#8b5cf6', chip: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
  Wednesday: { bar: '#10b981', chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  Thursday:  { bar: '#f59e0b', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  Friday:    { bar: '#ef4444', chip: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  Saturday:  { bar: '#06b6d4', chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  Sunday:    { bar: '#64748b', chip: 'bg-slate-500/20 text-[var(--text-2)] border-slate-500/40' },
};

// Build a human-readable filename from the post text. Strips markdown,
// hashtags, and bullet markers; uses the first 6-8 words; falls back to
// the trending topic, the pillar, or the weekday if the post is empty.
function slugifyForFilename(post) {
  const stripMd = (s) => String(s || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/[*_]+/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^[#>]+\s*/gm, '');
  const stripBullet = (s) => String(s || '').replace(/^[\s→•►●\-\*]+\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
  const text = stripMd(post.text || '').replace(/#\w+/g, '').trim();
  const firstLine = text.split('\n').map((l) => stripBullet(l)).find((l) => l && l.length > 4) || '';
  const candidate = firstLine || post.trendingTopic || post.pillar || post.weekday || 'post';
  // Take first 8 words, lowercase, alphanumerics + dashes only
  const words = candidate.split(/\s+/).slice(0, 8).join(' ');
  let slug = words.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) slug = 'post';
  if (slug.length > 60) slug = slug.substring(0, 60).replace(/-[^-]*$/, '');
  return slug;
}

function deriveWeekday(post) {
  if (post.weekday && WEEKDAYS.includes(post.weekday)) return post.weekday;
  try {
    const d = new Date(post.createdAt || Date.now());
    const name = d.toLocaleDateString('en-US', { weekday: 'long' });
    return WEEKDAYS.includes(name) ? name : 'Monday';
  } catch {
    return 'Monday';
  }
}

export default function ArchivePage({ savedPosts, setSavedPosts, showToast }) {
  const [query, setQuery] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [draggedPostId, setDraggedPostId] = useState(null);

  const normalized = useMemo(
    () => savedPosts.map((p) => ({ ...p, weekday: deriveWeekday(p) })),
    [savedPosts]
  );

  const pillars = useMemo(() => {
    const s = new Set(normalized.map((p) => p.pillar).filter(Boolean));
    return Array.from(s);
  }, [normalized]);

  const platforms = useMemo(() => {
    const s = new Set(normalized.map((p) => p.platform).filter(Boolean));
    return Array.from(s);
  }, [normalized]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter((p) => {
      if (pillarFilter !== 'all' && p.pillar !== pillarFilter) return false;
      if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
      if (dayFilter !== 'all' && p.weekday !== dayFilter) return false;
      if (!q) return true;
      const hay = [p.text, p.pillar, p.platform, p.tone, p.trendingTopic, p.audience]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [normalized, query, pillarFilter, platformFilter, dayFilter]);

  const byDay = useMemo(() => {
    const g = Object.fromEntries(WEEKDAYS.map((d) => [d, []]));
    filtered.forEach((p) => {
      if (g[p.weekday]) g[p.weekday].push(p);
    });
    WEEKDAYS.forEach((d) => {
      g[d].sort((a, b) => (b.id || 0) - (a.id || 0));
    });
    return g;
  }, [filtered]);

  const totalCount = normalized.length;
  const filteredCount = filtered.length;

  const copyPost = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const downloadImage = (post) => {
    // Download every page of the post's card set. Carousels have 3 pages;
    // single cards have 1. Pages are named slug-01.png, slug-02.png, ...
    const pages = (Array.isArray(post.allImages) && post.allImages.length)
      ? post.allImages
      : (post.imageData ? [post.imageData] : []);
    if (!pages.length) {
      showToast('No image attached to this post');
      return;
    }
    const slug = slugifyForFilename(post);
    const multi = pages.length > 1;
    pages.forEach((url, i) => {
      if (!url) return;
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = multi ? `${slug}-${String(i + 1).padStart(2, '0')}.png` : `${slug}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 350);
    });
    showToast(multi ? `Downloading ${pages.length}-page carousel...` : `Downloaded ${slug}.png`);
  };

  const movePost = (id, newDay) => {
    setSavedPosts((prev) => prev.map((p) => (p.id === id ? { ...p, weekday: newDay } : p)));
    showToast(`Moved to ${newDay}`);
  };

  const importArchive = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        if (Array.isArray(json)) {
          setSavedPosts((prev) => [...prev, ...json]);
          showToast(`Imported ${json.length} posts`);
        } else {
          showToast('Invalid format');
        }
      } catch (err) {
        showToast('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const deletePost = (id) => {
    setSavedPosts((prev) => prev.filter((p) => p.id !== id));
    showToast('Deleted');
    if (editingId === id) setEditingId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setEditingText(post.text);
  };

  const saveEdit = () => {
    setSavedPosts((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, text: editingText, editedAt: new Date().toLocaleString() } : p))
    );
    setEditingId(null);
    setEditingText('');
    showToast('Updated');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const exportAll = () => {
    if (!normalized.length) return;
    const text = normalized.map((p, i) => {
      const meta = `Platform: ${p.platform || 'N/A'} | Pillar: ${p.pillar || 'N/A'} | Date: ${p.createdAt || 'N/A'}`;
      return `## Post ${i + 1}\\n**${meta}**\\n\\n${p.text}`;
    }).join('\\n\\n---\\n\\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `archive-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    showToast('Exported as Markdown!');
  };

  const clearAll = () => {
    const count = normalized.length;
    if (!count) return;
    const ok = window.confirm(`Clear all ${count} posts from the Archive?\\n\\nThis cannot be undone. Consider exporting first.`);
    if (!ok) return;
    setSavedPosts([]);
    setEditingId(null);
    setExpandedId(null);
    showToast(`Cleared ${count} posts`);
  };

  const exportDay = (day) => {
    const posts = byDay[day];
    if (!posts.length) return;
    const text = posts.map((p, i) => {
      const meta = `Platform: ${p.platform || 'N/A'} | Pillar: ${p.pillar || 'N/A'} | Date: ${p.createdAt || 'N/A'}`;
      return `## Post ${i + 1} (${day})\\n**${meta}**\\n\\n${p.text}`;
    }).join('\\n\\n---\\n\\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${day.toLowerCase()}-posts.md`;
    a.click();
    showToast(`${day} exported as Markdown`);
  };

  if (!totalCount) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">{'\uD83D\uDDC2'}</div>
          <h2 className="text-xl font-bold text-white mb-2">Archive is empty</h2>
          <p className="text-[var(--text-2)]">Generate and save posts from the Generate tab. They will appear here organized by day of the week.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5"><Icon name="archive" size={22} strokeWidth={2.2} /> Content Archive</h2>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {filteredCount} of {totalCount} posts {dayFilter !== 'all' ? `(${dayFilter})` : 'across the week'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-ghost text-sm flex items-center gap-1.5 cursor-pointer">
            <Icon name="upload" size={14} /> Import
            <input type="file" accept=".json" className="hidden" onChange={importArchive} />
          </label>
          <button className="btn-ghost text-sm flex items-center gap-1.5" onClick={exportAll}><Icon name="download" size={14} /> Export Archive</button>
          <button
            className="btn-ghost text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5"
            onClick={clearAll}
            title="Delete every post in the Archive"
          >
            <Icon name="trash" size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Analytics Banner */}
      <div className="card p-4 mb-6 flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Total Posts</div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
        </div>
        <div className="w-px h-10 bg-[var(--card-border)] hidden sm:block"></div>
        <div>
          <div className="text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Top Pillar</div>
          <div className="text-lg font-medium text-[var(--text-1)]">
            {pillars.length ? [...pillars].sort((a,b) => normalized.filter(p=>p.pillar===b).length - normalized.filter(p=>p.pillar===a).length)[0] : 'None'}
          </div>
        </div>
        <div className="w-px h-10 bg-[var(--card-border)] hidden sm:block"></div>
        <div>
          <div className="text-xs text-[var(--text-2)] uppercase tracking-wider font-semibold">Most Active Day</div>
          <div className="text-lg font-medium text-[var(--text-1)]">
            {WEEKDAYS.sort((a,b) => byDay[b].length - byDay[a].length)[0]}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                className="input-field pr-8"
                placeholder="Search posts, pillars, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-2)] hover:text-white text-lg leading-none"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  {'\u00D7'}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">Day</label>
            <select className="input-field" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
              <option value="all">All days</option>
              {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">Pillar</label>
            <select className="input-field" value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)}>
              <option value="all">All pillars</option>
              {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {platforms.length > 1 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--text-2)]">Platform:</span>
            <button
              className={`badge text-xs ${platformFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--card-border)]'}`}
              onClick={() => setPlatformFilter('all')}
            >
              All
            </button>
            {platforms.map((pl) => (
              <button
                key={pl}
                className={`badge text-xs ${platformFilter === pl ? 'bg-blue-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--card-border)]'}`}
                onClick={() => setPlatformFilter(pl)}
              >
                {pl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Days */}
      <div className="space-y-6">
        {WEEKDAYS.map((day) => {
          if (dayFilter !== 'all' && dayFilter !== day) return null;
          const posts = byDay[day];
          // Weekend sections only appear when they have content (the Databricks
          // schedule posts Saturdays) so empty weekend sections stay hidden.
          if ((day === 'Saturday' || day === 'Sunday') && posts.length === 0 && dayFilter === 'all') return null;
          const accent = DAY_ACCENTS[day];
          return (
            <section 
              key={day} 
              className="card p-5 transition-colors duration-200" 
              style={{ borderLeft: `4px solid ${accent.bar}` }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '';
                if (draggedPostId) movePost(draggedPostId, day);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{day}</h3>
                  <span className={`badge text-xs border ${accent.chip}`}>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                </div>
                {posts.length > 0 && (
                  <button className="btn-ghost text-xs" onClick={() => exportDay(day)}>{'\uD83D\uDCE4'} Export {day}</button>
                )}
              </div>

              {posts.length === 0 ? (
                <div className="text-sm text-[var(--text-3)] italic py-4 px-3 border border-dashed border-[var(--card-border)] rounded-lg text-center">
                  No posts for {day} yet
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {posts.map((p) => {
                    const isEditing = editingId === p.id;
                    const isExpanded = expandedId === p.id;
                    const preview = p.text || '';
                    const firstLine = preview.split('\n').find((l) => l.trim()) || '';
                    return (
                      <article 
                        key={p.id} 
                        className={`bg-[var(--surface)]/60 border ${draggedPostId === p.id ? 'border-blue-500 opacity-50' : 'border-[var(--card-border)]'} rounded-xl p-4 hover:border-blue-500/60 transition-all cursor-move`}
                        draggable
                        onDragStart={() => setDraggedPostId(p.id)}
                        onDragEnd={() => setDraggedPostId(null)}
                      >
                        {/* meta row */}
                        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {p.platform && (
                              <span className="badge text-xs" style={{ background: p.platform === 'LinkedIn' ? '#0a66c2' : '#1877f2', color: '#fff' }}>
                                {p.platform}
                              </span>
                            )}
                            {p.pillar && <span className="badge text-xs" style={{ background: '#334155', color: '#cbd5e1' }}>{p.pillar}</span>}
                            {p.trendingTopic && <span className="badge text-xs" style={{ background: '#7c2d12', color: '#fed7aa' }}>{'\uD83D\uDD25'} Trending</span>}
                          </div>
                          <span className="text-xs text-[var(--text-3)]">{p.createdAt}</span>
                        </div>

                        {/* hook/first line */}
                        {!isEditing && firstLine && (
                          <div className="text-sm font-semibold text-white mb-2 leading-snug">
                            {firstLine.length > 120 ? firstLine.substring(0, 120) + '\u2026' : firstLine}
                          </div>
                        )}

                        {/* image thumb with download overlay */}
                        {!isEditing && p.imageData && (
                          <div className="relative group mb-3">
                            <img src={p.imageData} alt="" className="w-full rounded-lg border border-[var(--card-border)]" />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-md border border-white/20 backdrop-blur-sm transition-all opacity-90 hover:opacity-100"
                              onClick={() => downloadImage(p)}
                              title={`Download as ${slugifyForFilename(p)}.png`}
                            >
                              {'⬇️'} Download
                            </button>
                          </div>
                        )}

                        {/* body */}
                        {isEditing ? (
                          <textarea
                            className="input-field w-full text-sm mb-3"
                            rows={12}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap mb-3" style={{ maxHeight: isExpanded ? 'none' : 180, overflow: 'hidden' }}>
                            {preview}
                          </p>
                        )}

                        {!isEditing && preview.length > 400 && (
                          <button
                            className="text-xs text-blue-400 hover:text-blue-300 mb-3"
                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          >
                            {isExpanded ? 'Show less' : 'Show full post'}
                          </button>
                        )}

                        {/* actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800">
                          {isEditing ? (
                            <>
                              <button className="btn-secondary text-xs" onClick={saveEdit}>{'\uD83D\uDCBE'} Save</button>
                              <button className="btn-ghost text-xs" onClick={cancelEdit}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn-secondary text-xs" onClick={() => copyPost(p.text)}>{'\uD83D\uDCCB'} Copy</button>
                              {p.imageData && (
                                <button className="btn-secondary text-xs" onClick={() => downloadImage(p)} title={`Download as ${slugifyForFilename(p)}.png`}>{'\u2B07\uFE0F'} Download</button>
                              )}
                              <button className="btn-ghost text-xs" onClick={() => startEdit(p)}>{'\u270F\uFE0F'} Tweak</button>
                              <select
                                className="text-xs bg-[var(--surface-2)] border border-[var(--card-border)] text-[var(--text-2)] rounded px-2 py-1"
                                value={p.weekday}
                                onChange={(e) => movePost(p.id, e.target.value)}
                                title="Move to different day"
                              >
                                {WEEKDAYS.map((d) => <option key={d} value={d}>{'\u21C4 '}{d}</option>)}
                              </select>
                              <button
                                className="btn-ghost text-xs ml-auto text-red-400 hover:text-red-300"
                                onClick={() => deletePost(p.id)}
                                title="Delete"
                              >
                                {'\uD83D\uDDD1'}
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {filteredCount === 0 && totalCount > 0 && (
        <div className="text-center py-10 text-[var(--text-2)]">
          No posts match your filters. <button className="text-blue-400 underline" onClick={() => { setQuery(''); setPillarFilter('all'); setPlatformFilter('all'); setDayFilter('all'); }}>Clear filters</button>
        </div>
      )}
    </div>
  );
}
