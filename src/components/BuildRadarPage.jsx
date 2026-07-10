import { useState, useEffect } from 'react';
import { fetchBuildIdeas } from '../utils/openrouter';

// Build Radar — the Databricks personal-brand lane's topic scanner.
// Finds what's being discussed RIGHT NOW that a public dataset can be attached
// to, and proposes a weekend-scale Databricks Free Edition build for each.
// The output feeds the weekly loop: pick one → build it Sat/Sun → paste your
// real notes into Generate's "my notes" field → the week's posts come from it.
const CACHE_KEY = 'leadgen.buildradar.ideas.v1';

export default function BuildRadarPage({ manualKey, selModel, live, showToast }) {
  const [ideas, setIdeas] = useState([]);
  const [liveScan, setLiveScan] = useState(null); // true = web-search results, false = model knowledge
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scannedAt, setScannedAt] = useState(null);

  // Restore last scan so ideas survive a page refresh.
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached?.ideas?.length) {
        setIdeas(cached.ideas);
        setLiveScan(cached.live);
        setScannedAt(cached.at);
      }
    } catch (e) { /* ignore corrupt cache */ }
  }, []);

  const scan = async () => {
    if (!live) {
      showToast('Add an OpenRouter API key first (Settings).');
      return;
    }
    setScanning(true);
    setError('');
    try {
      const { ideas: found, live: usedWeb } = await fetchBuildIdeas(manualKey, selModel, 5);
      setIdeas(found);
      setLiveScan(usedWeb);
      const at = new Date().toISOString();
      setScannedAt(at);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ideas: found, live: usedWeb, at })); } catch (e) {}
      showToast(`Found ${found.length} build opportunities${usedWeb ? ' (live web scan)' : ''}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const copyBrief = (idea) => {
    const brief = `WEEKEND BUILD BRIEF
Topic: ${idea.topic}
Why it's hot: ${idea.whyHot}
Dataset: ${idea.dataset?.name} — ${idea.dataset?.source} (${idea.dataset?.access})${idea.dataset?.verified === false ? ' [UNVERIFIED — confirm it exists before starting]' : ''}
Build (~${idea.effortHours}h on Databricks Free Edition): ${idea.buildIdea}
Post hook: ${idea.postAngle}

After the build, paste your REAL notes (what you built, what broke, the numbers) into Generate → "My notes from real work".`;
    navigator.clipboard.writeText(brief);
    showToast('Build brief copied — save it for the weekend.');
  };

  return (
    <div className="animate-fade-in text-gray-200">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">{'📡'} Build Radar</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Scans what data people are talking about right now and pairs each topic with a real public dataset
            and a 2-3 hour Databricks Free Edition build. Pick one per weekend. The post comes from the build,
            never the other way around.
          </p>
        </div>
        <button className="btn-primary whitespace-nowrap" onClick={scan} disabled={scanning}>
          {scanning ? 'Scanning...' : ideas.length ? 'Re-scan' : 'Scan for build ideas'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-700 bg-red-900 bg-opacity-20 text-sm text-red-300">{error}</div>
      )}

      {scannedAt && (
        <p className="text-xs text-gray-500 mb-4">
          Last scan: {new Date(scannedAt).toLocaleString()} {liveScan === false && '— from model knowledge, not live web search. Double-check "why it\'s hot" claims before posting.'}
        </p>
      )}

      {ideas.length === 0 && !scanning ? (
        <div className="card p-10 flex flex-col items-center text-center">
          <span className="text-5xl mb-3 text-slate-500">{'📡'}</span>
          <h4 className="text-base font-medium text-slate-400 mb-1">No scan yet</h4>
          <p className="text-xs text-slate-500 max-w-md">
            Hit "Scan for build ideas" to find topics trending right now that you can attach a real dataset to.
            Ideas ranked data-leaders-first: reach that impresses hiring managers beats reach that impresses strangers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ideas.map((idea, i) => (
            <div key={i} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-white leading-snug">{idea.topic}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap border ${idea.audienceMatch === 'data-leaders' ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-yellow-900/30 text-yellow-300 border-yellow-700'}`}>
                  {idea.audienceMatch === 'data-leaders' ? 'data leaders' : 'general viral'}
                </span>
              </div>
              <p className="text-xs text-gray-400">{idea.whyHot}</p>
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-xs">
                <div className="text-gray-300"><span className="font-semibold text-blue-300">Dataset:</span> {idea.dataset?.name} <span className="text-gray-500">({idea.dataset?.source})</span></div>
                {/^https?:\/\//i.test(idea.dataset?.access || '') ? (
                  <a
                    href={idea.dataset.access}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
                  >
                    Open dataset {'↗'}
                  </a>
                ) : (
                  <div className="text-gray-400 mt-1 break-all">{idea.dataset?.access}</div>
                )}
                {idea.dataset?.verified === false && (
                  <div className="text-yellow-400 mt-1 font-semibold">{'⚠'} Unverified — confirm this dataset exists before building.</div>
                )}
              </div>
              <div className="text-xs text-gray-300">
                <span className="font-semibold text-blue-300">Build (~{idea.effortHours}h):</span> {idea.buildIdea}
              </div>
              <div className="text-xs text-gray-400 italic">Hook: "{idea.postAngle}"</div>
              <button className="btn-secondary text-xs mt-auto" onClick={() => copyBrief(idea)}>
                Copy build brief
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
