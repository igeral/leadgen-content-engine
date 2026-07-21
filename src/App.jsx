import { useState, useEffect, useRef } from 'react';
import { isLiveMode, isUsingEnvKey, TEXT_MODELS, IMAGE_MODELS } from './utils/openrouter';
import { DATABRICKS_PRESET } from './presets/databricks';
import Header from './components/Header';
import NavBar from './components/NavBar';
import GeneratePage from './components/GeneratePage';
import CalendarPage from './components/CalendarPage';
import ArchivePage from './components/ArchivePage';
import ImageStudioPage from './components/ImageStudioPage';
import SettingsPage from './components/SettingsPage';
import EngagementPage from './components/EngagementPage';
import BuildRadarPage from './components/BuildRadarPage';
import Toast from './components/Toast';

// ─── PERSISTENCE HELPERS ───
// localStorage has a hard quota (~5-10 MB). PNG image data URLs add up
// fast, so we degrade gracefully: try full save → drop allImages → drop
// all images → keep text only. The user's text content is never lost.
const STORAGE_KEY = 'leadgen.savedPosts.v1';
const KEY_STORAGE_KEY = 'leadgen.manualKey.v1';
const BRAND_STORAGE_KEY = 'leadgen.brand.v2'; // v2: preset lanes always rehydrate from code
const MODEL_STORAGE_KEY = 'leadgen.models.v1';

function loadSavedPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[LeadGen] Could not load saved posts:', e);
    return [];
  }
}

function persistSavedPosts(posts) {
  const tryWrite = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };
  try {
    tryWrite(posts);
    return { ok: true };
  } catch (e) {
    // First fallback: drop the allImages array, keep just the cover image
    try {
      const trimmed = posts.map((p) => ({ ...p, allImages: p.imageData ? [p.imageData] : [] }));
      tryWrite(trimmed);
      return { ok: true, degraded: 'extra-images-dropped' };
    } catch (e2) {
      // Second fallback: drop all images
      try {
        const minimal = posts.map((p) => ({ ...p, imageData: null, allImages: [] }));
        tryWrite(minimal);
        return { ok: true, degraded: 'all-images-dropped' };
      } catch (e3) {
        return { ok: false, error: e3.message };
      }
    }
  }
}

function loadString(key) {
  try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}

export default function App() {
  const [page, setPage] = useState('radar');
  const [brand, setBrand] = useState(() => {
    const stored = loadJSON(BRAND_STORAGE_KEY, null);
    if (!stored) return DATABRICKS_PRESET;
    if (stored.presetId) {
      // The preset ALWAYS rehydrates from code. Strategy changes ship in the
      // preset file, and a cached copy must never resurrect an old schedule,
      // pillar mix, or tagline. Only user-added data points survive the merge.
      const extraDp = (stored.dataPoints || []).filter((d) => !DATABRICKS_PRESET.dataPoints.includes(d));
      return { ...DATABRICKS_PRESET, dataPoints: [...DATABRICKS_PRESET.dataPoints, ...extraDp] };
    }
    // Custom brand (built from the blank template): the user's own edits win.
    return stored;
  });
  const [manualKey, setManualKey] = useState(() => loadString(KEY_STORAGE_KEY));
  const [models, setModels] = useState(() => loadJSON(MODEL_STORAGE_KEY, { text: TEXT_MODELS[0].id, image: IMAGE_MODELS[0].id }));
  const [toast, setToast] = useState(null);
  const [savedPosts, setSavedPosts] = useState(() => loadSavedPosts());
  const firstRenderRef = useRef(true);

  const selModel = models.text;
  const selImgModel = models.image;
  const setSelModel = (id) => setModels((m) => ({ ...m, text: id }));
  const setSelImgModel = (id) => setModels((m) => ({ ...m, image: id }));

  const live = isLiveMode(manualKey);
  const showToast = (msg) => setToast(msg);

  // Persist savedPosts whenever they change (skip first render to avoid
  // overwriting freshly loaded data with itself).
  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    const result = persistSavedPosts(savedPosts);
    if (!result.ok) {
      setToast('Storage full \u2014 could not save Archive. Delete some posts to free space.');
    } else if (result.degraded === 'extra-images-dropped') {
      console.warn('[LeadGen] Storage near full \u2014 dropping extra images from saved posts.');
    } else if (result.degraded === 'all-images-dropped') {
      setToast('Storage full \u2014 saved text only. Older images may be lost on next load.');
    }
  }, [savedPosts]);

  // Persist API key, brand, model selection
  useEffect(() => {
    try { localStorage.setItem(KEY_STORAGE_KEY, manualKey || ''); } catch (e) {}
  }, [manualKey]);
  useEffect(() => {
    try { localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand)); } catch (e) {}
  }, [brand]);
  useEffect(() => {
    try { localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(models)); } catch (e) {}
  }, [models]);

  // Theme (dark default). Stamped on <html data-theme> so index.css tokens
  // and light-mode overrides apply everywhere.
  const [theme, setTheme] = useState(() => loadString('leadgen.theme.v1') || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('leadgen.theme.v1', theme); } catch (e) {}
  }, [theme]);

  // Theming: the whole UI tints from the active brand's colors.
  useEffect(() => {
    const root = document.documentElement;
    const accent = brand?.colors?.accent || '#3b82f6';
    const accent2 = brand?.colors?.accent2 || '#ff7a45';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-2', accent2);
  }, [brand]);

  // Build Radar -> Generate handoff: carries the picked idea's topic + brief.
  const [radarDraft, setRadarDraft] = useState(null);
  const useRadarIdea = (draft) => {
    setRadarDraft(draft);
    setPage('generate');
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header brand={brand} manualKey={manualKey} setManualKey={setManualKey} live={live} theme={theme} setTheme={setTheme} />
      <NavBar page={page} setPage={setPage} />

      <main className="p-6 max-w-7xl mx-auto">
        {/* Always-mounted pages preserve state across navigation. Only the active page is visible. */}
        <div className="page-panel" style={{ display: page ==='generate' ? 'block' : 'none' }}>
          <GeneratePage brand={brand} manualKey={manualKey} selModel={selModel} selImgModel={selImgModel} live={live} showToast={showToast} savedPosts={savedPosts} setSavedPosts={setSavedPosts} radarDraft={radarDraft} />
        </div>
        <div className="page-panel" style={{ display: page ==='calendar' ? 'block' : 'none' }}>
          <CalendarPage brand={brand} />
        </div>
        <div className="page-panel" style={{ display: page ==='archive' ? 'block' : 'none' }}>
          <ArchivePage savedPosts={savedPosts} setSavedPosts={setSavedPosts} showToast={showToast} />
        </div>
        <div className="page-panel" style={{ display: page ==='images' ? 'block' : 'none' }}>
          <ImageStudioPage brand={brand} manualKey={manualKey} selImgModel={selImgModel} live={live} showToast={showToast} />
        </div>
        <div className="page-panel" style={{ display: page ==='engagement' ? 'block' : 'none' }}>
          <EngagementPage showToast={showToast} />
        </div>
        <div className="page-panel" style={{ display: page ==='radar' ? 'block' : 'none' }}>
          <BuildRadarPage manualKey={manualKey} selModel={selModel} live={live} showToast={showToast} onUseIdea={useRadarIdea} />
        </div>
        <div className="page-panel" style={{ display: page ==='settings' ? 'block' : 'none' }}>
          <SettingsPage brand={brand} setBrand={setBrand} manualKey={manualKey} setManualKey={setManualKey} selModel={selModel} setSelModel={setSelModel} selImgModel={selImgModel} setSelImgModel={setSelImgModel} live={live} />
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
