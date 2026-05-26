import { useState, useMemo } from 'react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DAY_ACCENTS = {
  Monday:    { bar: '#3b82f6', chip: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  Tuesday:   { bar: '#8b5cf6', chip: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
  Wednesday: { bar: '#10b981', chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  Thursday:  { bar: '#f59e0b', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  Friday:    { bar: '#ef4444', chip: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
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
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `archive-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Exported!');
  };

  const clearAll = () => {
    const count = normalized.length;
    if (!count) return;
    const ok = window.confirm(`Clear all ${count} posts from the Archive?\n\nThis cannot be undone. Consider exporting first.`);
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
      const sep = '=' .repeat(72);
      const meta = `${p.platform || ''} | ${p.pillar || ''} | ${p.createdAt || ''}`;
      return `${sep}\nPOST ${i + 1} of ${posts.length} \u2014 ${day}\n${meta}\n${sep}\n\n${p.text}\n`;
    }).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${day.toLowerCase()}-posts.txt`;
    a.click();
    showToast(`${day} exported`);
  };

  if (!totalCount) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">{'\uD83D\uDDC2'}</div>
          <h2 className="text-xl font-bold text-white mb-2">Archive is empty</h2>
          <p className="text-gray-400">Generate and save posts from the Generate tab. They will appear here organized by day of the week.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{'\uD83D\uDDC2'} Content Archive</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredCount} of {totalCount} posts {dayFilter !== 'all' ? `\u2014 ${dayFilter}` : 'across the week'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={exportAll}>{'\uD83D\uDCE4'} Export Archive</button>
          <button
            className="btn-ghost text-sm text-red-400 hover:text-red-300"
            onClick={clearAll}
            title="Delete every post in the Archive"
          >
            {'\uD83D\uDDD1'} Clear All
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Search</label>
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  {'\u00D7'}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Day</label>
            <select className="input-field" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
              <option value="all">All days</option>
              {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Pillar</label>
            <select className="input-field" value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)}>
              <option value="all">All pillars</option>
              {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {platforms.length > 1 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400">Platform:</span>
            <button
              className={`badge text-xs ${platformFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
              onClick={() => setPlatformFilter('all')}
            >
              All
            </button>
            {platforms.map((pl) => (
              <button
                key={pl}
                className={`badge text-xs ${platformFilter === pl ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
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
          const accent = DAY_ACCENTS[day];
          return (
            <section key={day} className="card p-5" style={{ borderLeft: `4px solid ${accent.bar}` }}>
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
                <div className="text-sm text-gray-500 italic py-4 px-3 border border-dashed border-gray-700 rounded-lg text-center">
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
                      <article key={p.id} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 hover:border-blue-500/60 transition-all">
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
                          <span className="text-xs text-gray-500">{p.createdAt}</span>
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
                            <img src={p.imageData} alt="" className="w-full rounded-lg border border-gray-700" />
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
                          <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3" style={{ maxHeight: isExpanded ? 'none' : 180, overflow: 'hidden' }}>
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
                                className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1"
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
        <div className="text-center py-10 text-gray-400">
          No posts match your filters. <button className="text-blue-400 underline" onClick={() => { setQuery(''); setPillarFilter('all'); setPlatformFilter('all'); setDayFilter('all'); }}>Clear filters</button>
        </div>
      )}
    </div>
  );
}
