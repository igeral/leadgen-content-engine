export default function SavedPage({ savedPosts, setSavedPosts, showToast }) {
  if (!savedPosts.length) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">{'\uD83D\uDCBE'}</div>
        <h2 className="text-xl font-bold text-white mb-2">No saved posts yet</h2>
        <p className="text-gray-400">Generate and save content from the Generate tab</p>
      </div>
    );
  }

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(savedPosts, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'saved-posts.json';
    a.click();
    showToast('Exported!');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{'\uD83D\uDCBE'} Saved Posts ({savedPosts.length})</h2>
        <button className="btn-ghost text-sm" onClick={exportAll}>{'\uD83D\uDCE4'} Export All</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedPosts.slice().reverse().map((p) => (
          <div key={p.id} className="card p-4 card-hover">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: p.platform === 'LinkedIn' ? '#0a66c2' : '#1877f2', color: '#fff' }}>
                  {p.platform}
                </span>
                <span className="badge" style={{ background: '#334155', color: '#94a3b8' }}>{p.pillar}</span>
              </div>
              <span className="text-xs text-gray-500">{p.createdAt}</span>
            </div>
            {p.imageData && <img src={p.imageData} className="w-full rounded-lg mb-3" alt="" />}
            <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3" style={{ maxHeight: 150, overflow: 'hidden' }}>
              {p.text.substring(0, 300)}{p.text.length > 300 ? '...' : ''}
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs flex-1" onClick={() => { navigator.clipboard.writeText(p.text); showToast('Copied!'); }}>
                {'\uD83D\uDCCB'} Copy
              </button>
              <button className="btn-ghost text-xs" onClick={() => setSavedPosts((pr) => pr.filter((x) => x.id !== p.id))}>
                {'\uD83D\uDDD1'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
