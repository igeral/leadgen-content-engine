import { useState, useEffect } from 'react';
import { fetchBuildIdeas } from '../utils/openrouter';
import { parseExcelIdeas } from '../utils/excelParser';
import Icon from './Icon';

// Build Radar — the Databricks personal-brand lane's topic scanner.
// Finds what's being discussed RIGHT NOW that a public dataset can be attached
// to, and proposes a weekend-scale Databricks Free Edition build for each.
// The output feeds the weekly loop: pick one → build it Sat/Sun → paste your
// real notes into Generate's "my notes" field → the week's posts come from it.
const CACHE_KEY = 'leadgen.buildradar.ideas.v1';

export default function BuildRadarPage({ manualKey, selModel, live, showToast, onUseIdea }) {
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

  const scan = async (useExcel = false) => {
    if (!live) {
      showToast('Add an OpenRouter API key first (Settings).');
      return;
    }
    setScanning(true);
    setError('');
    try {
      let excelIdeas = [];
      if (useExcel) {
        try {
          const res = await fetch('/Databricks Ideas.xlsx');
          if (!res.ok) throw new Error('File not found');
          const buffer = await res.arrayBuffer();
          excelIdeas = await parseExcelIdeas(buffer);
          if (excelIdeas.length === 0) throw new Error('No ideas found in Excel');
          showToast(`Loaded ${excelIdeas.length} ideas from Excel.`);
        } catch (e) {
          console.warn('Failed to load excel ideas:', e);
          setError(`Failed to load Excel: ${e.message}`);
          setScanning(false);
          return;
        }
      }

      const { ideas: found, live: usedWeb } = await fetchBuildIdeas(manualKey, selModel, 5, excelIdeas);
      
      // Basic dataset URL validation
      const validatedFound = found.map(idea => {
        let validLink = idea.dataset?.access;
        if (validLink && !/^https?:\/\//i.test(validLink)) {
          if (validLink.includes('.')) {
            validLink = `https://${validLink}`;
            idea.dataset.access = validLink;
          } else {
            idea.dataset.verified = false; // Not a valid URL
          }
        }
        return idea;
      });

      setIdeas(validatedFound);
      setLiveScan(usedWeb);
      const at = new Date().toISOString();
      setScannedAt(at);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ideas: validatedFound, live: usedWeb, at })); } catch (e) {}
      showToast(`Found ${validatedFound.length} build opportunities${usedWeb ? ' (live web scan)' : ''}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };


  const clearIdeas = () => {
    setIdeas([]);
    setScannedAt(null);
    setLiveScan(null);
    try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
    showToast('Radar cleared.');
  };

  const briefAsNotesSeed = (idea) =>
    `Weekend build brief (from Build Radar):\nTopic: ${idea.topic}\nDataset: ${idea.dataset?.name} (${idea.dataset?.access})\nPlanned build: ${idea.buildIdea}\n\n[REPLACE THIS AFTER THE BUILD with your real notes: what you built, what broke, the numbers.]`;

  const copyBrief = (idea) => {
    const brief = `WEEKEND BUILD BRIEF
Topic: ${idea.topic}
Why it's hot: ${idea.whyHot}
Dataset: ${idea.dataset?.name}, ${idea.dataset?.source} (${idea.dataset?.access})${idea.dataset?.verified === false ? ' [UNVERIFIED: confirm it exists before starting]' : ''}
Build (~${idea.effortHours}h on Databricks Free Edition): ${idea.buildIdea}
Post hook: ${idea.postAngle}

After the build, paste your REAL notes (what you built, what broke, the numbers) into Generate → "My notes from real work".`;
    navigator.clipboard.writeText(brief);
    showToast('Build brief copied. Save it for the weekend.');
  };

  return (
    <div className="animate-fade-in text-[var(--text-1)]">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)] flex items-center gap-2.5"><Icon name="radar" size={22} strokeWidth={2.2} /> Build Radar</h2>
          <p className="text-sm text-[var(--text-2)] mt-1 max-w-2xl">
            Scans what data people are talking about right now and pairs each topic with a real public dataset
            and a 2-3 hour Databricks Free Edition build. Pick one per weekend. The post comes from the build,
            never the other way around.
          </p>
        </div>
        <div className="flex gap-2">
          {ideas.length > 0 && (
            <button className="btn-ghost whitespace-nowrap flex items-center gap-1.5" onClick={clearIdeas} disabled={scanning}>
              <Icon name="trash" size={14} /> Clear
            </button>
          )}
          <button className="btn-primary whitespace-nowrap" onClick={scan} disabled={scanning}>
            {scanning ? 'Scanning...' : ideas.length ? 'Re-scan' : 'Scan for build ideas'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-700 bg-red-900 bg-opacity-20 text-sm text-red-300">{error}</div>
      )}

      {scannedAt && (
        <p className="text-xs text-[var(--text-3)] mb-4">
          Last scan: {new Date(scannedAt).toLocaleString()} {liveScan === false && '(from model knowledge, not live web search. Double-check "why it\'s hot" claims before posting.)'}
        </p>
      )}

      {scanning ? (
        <div className="space-y-6 mt-6">
          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--card-border)] animate-pulse flex gap-4 h-20">
             <div className="w-6 h-6 bg-[var(--surface-3)] rounded-full"></div>
             <div className="flex-1 space-y-2 py-1">
               <div className="h-4 bg-[var(--surface-3)] rounded w-1/4"></div>
               <div className="h-3 bg-[var(--surface-3)] rounded w-3/4"></div>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 flex flex-col gap-3 animate-pulse h-64">
                <div className="h-5 bg-[var(--surface-3)] rounded w-3/4"></div>
                <div className="h-4 bg-[var(--surface-3)] rounded w-full mt-2"></div>
                <div className="h-4 bg-[var(--surface-3)] rounded w-5/6"></div>
                <div className="h-20 bg-[var(--surface-3)] rounded-lg mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : ideas.length === 0 ? (
        <div className="card p-10 flex flex-col items-center text-center mt-6">
          <span className="mb-4 text-[var(--text-3)]"><Icon name="radar" size={52} strokeWidth={1.5} /></span>
          <h4 className="text-base font-medium text-[var(--text-2)] mb-1">No scan yet</h4>
          <p className="text-xs text-[var(--text-3)] max-w-md">
            Hit "Scan for build ideas" to find topics trending right now that you can attach a real dataset to.
            Ideas ranked data-leaders-first: reach that impresses hiring managers beats reach that impresses strangers.
          </p>
          <div className="mt-8 flex gap-3">
            <button className="btn-secondary text-xs" onClick={() => scan(false)}>Scan Current Trends</button>
            <button className="btn-secondary text-xs" onClick={() => scan(true)}>Scan Databricks Ideas</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--card-border)] flex gap-4 items-center">
            <Icon name="zap" size={20} className="text-[var(--accent)]" />
            <div>
              <h4 className="text-sm font-bold text-[var(--text-1)]">Trend Summary</h4>
              <p className="text-xs text-[var(--text-2)] mt-0.5">We constrained the discovery to high-ROI data leader topics. Most interest right now revolves around data engineering architectures, cost optimization, and supply chain telemetry.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ideas.map((idea, i) => (
            <div key={i} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-[var(--text-1)] leading-snug">{idea.topic}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap border ${idea.audienceMatch === 'data-leaders' ? 'bg-green-900/40 text-green-500 border-green-700/50' : 'bg-yellow-900/30 text-yellow-500 border-yellow-700/50'}`}>
                  {idea.audienceMatch === 'data-leaders' ? 'data leaders' : idea.audienceMatch === 'general viral' ? 'general viral' : (idea.audienceMatch || 'general viral').toLowerCase()}
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)]">{idea.whyHot}</p>
              <div className="bg-[var(--surface-2)] rounded-lg p-3 border border-[var(--input-border)] text-xs">
                <div className="text-[var(--text-2)]"><span className="font-semibold text-[var(--accent)]">Dataset:</span> {idea.dataset?.name} <span className="text-[var(--text-3)]">({idea.dataset?.source})</span></div>
                {/^https?:\/\//i.test(idea.dataset?.access || '') ? (
                  <a
                    href={idea.dataset.access}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-80 text-white font-semibold transition-all"
                  >
                    Open dataset {'↗'}
                  </a>
                ) : (
                  <div className="text-[var(--text-3)] mt-1 break-all">{idea.dataset?.access}</div>
                )}
                {idea.targetBrand && (
                  <div className="text-[var(--text-2)] mt-2"><span className="font-semibold text-purple-400">Target Brand:</span> {idea.targetBrand}</div>
                )}
                {idea.dataset?.verified === false && (
                  <div className="text-yellow-500 mt-1 font-semibold">{'⚠'} Unverified: confirm this dataset exists before building.</div>
                )}
              </div>
              <div className="text-xs text-[var(--text-2)]">
                <span className="font-semibold text-[var(--accent)]">Build (~{idea.effortHours}h):</span> {idea.buildIdea}
              </div>
              <div className="text-xs text-[var(--text-3)] italic">Hook: "{idea.postAngle}"</div>
              <div className="flex gap-2 mt-auto">
                <button
                  className="btn-primary text-xs flex-1"
                  onClick={() => {
                    onUseIdea && onUseIdea({ topic: idea.topic, notes: briefAsNotesSeed(idea), postAngle: idea.postAngle, targetBrand: idea.targetBrand });
                    showToast('Sent to Generate. Topic and brief pre-filled.');
                  }}
                >
                  <span className="inline-flex items-center gap-1.5 justify-center"><Icon name="zap" size={13} /> Use in Generate</span>
                </button>
                <button className="btn-secondary text-xs" onClick={() => copyBrief(idea)}>
                  Copy brief
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
