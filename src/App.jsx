import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import localforage from 'localforage';
import { isLiveMode, isUsingEnvKey, TEXT_MODELS, IMAGE_MODELS } from './utils/openrouter';
import { DATABRICKS_PRESET } from './presets/databricks';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

const GeneratePage = lazy(() => import('./components/GeneratePage'));
const CalendarPage = lazy(() => import('./components/CalendarPage'));
const ArchivePage = lazy(() => import('./components/ArchivePage'));
const ImageStudioPage = lazy(() => import('./components/ImageStudioPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const EngagementPage = lazy(() => import('./components/EngagementPage'));
const BuildRadarPage = lazy(() => import('./components/BuildRadarPage'));
const YouTubeStudioPage = lazy(() => import('./components/YouTubeStudioPage'));
const BoilerplateGeneratorPage = lazy(() => import('./components/BoilerplateGeneratorPage'));

// ─── PERSISTENCE HELPERS ───
const STORAGE_KEY = 'leadgen.savedPosts.v1';
const KEY_STORAGE_KEY = 'leadgen.manualKey.v1';
const BRAND_STORAGE_KEY = 'leadgen.brand.v2';
const MODEL_STORAGE_KEY = 'leadgen.models.v1';

// We now use localforage for savedPosts to avoid localStorage quotas
async function loadSavedPosts() {
  try {
    const raw = await localforage.getItem(STORAGE_KEY);
    if (raw) return Array.isArray(raw) ? raw : [];
    // Fallback to localStorage migration
    const old = localStorage.getItem(STORAGE_KEY);
    if (old) {
      const parsed = JSON.parse(old);
      await localforage.setItem(STORAGE_KEY, parsed);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (e) {
    console.warn('[LeadGen] Could not load saved posts:', e);
    return [];
  }
}

async function persistSavedPosts(posts) {
  try {
    await localforage.setItem(STORAGE_KEY, posts);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
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

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-[var(--surface-2)] rounded w-1/4"></div>
      <div className="h-4 bg-[var(--surface-2)] rounded w-2/4 mb-8"></div>
      <div className="h-64 bg-[var(--surface-2)] rounded-xl w-full"></div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.slice(1);
    const validPages = ['radar', 'generate', 'calendar', 'archive', 'images', 'engagement', 'youtube', 'boilerplate', 'settings'];
    return validPages.includes(hash) ? hash : 'radar';
  });

  const [brand, setBrand] = useState(() => {
    const stored = loadJSON(BRAND_STORAGE_KEY, null);
    if (!stored) return DATABRICKS_PRESET;
    if (stored.presetId) {
      const extraDp = (stored.dataPoints || []).filter((d) => !DATABRICKS_PRESET.dataPoints.includes(d));
      return { ...DATABRICKS_PRESET, dataPoints: [...DATABRICKS_PRESET.dataPoints, ...extraDp] };
    }
    return stored;
  });

  const [manualKey, setManualKey] = useState(() => loadString(KEY_STORAGE_KEY));
  const [models, setModels] = useState(() => loadJSON(MODEL_STORAGE_KEY, { text: TEXT_MODELS[0].id, image: IMAGE_MODELS[0].id }));
  
  // Toast Queue
  const [toasts, setToasts] = useState([]);
  
  const [savedPosts, setSavedPosts] = useState([]);
  const [isPostsLoaded, setIsPostsLoaded] = useState(false);
  const firstRenderRef = useRef(true);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadSavedPosts().then(posts => {
      setSavedPosts(posts);
      setIsPostsLoaded(true);
    });
  }, []);

  const selModel = models.text;
  const selImgModel = models.image;
  const setSelModel = (id) => setModels((m) => ({ ...m, text: id }));
  const setSelImgModel = (id) => setModels((m) => ({ ...m, image: id }));

  const live = isLiveMode(manualKey);
  const showToast = (msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (firstRenderRef.current || !isPostsLoaded) {
      if (isPostsLoaded) firstRenderRef.current = false;
      return;
    }
    persistSavedPosts(savedPosts).then(result => {
      if (!result.ok) showToast('Storage full — could not save Archive.');
    });
  }, [savedPosts, isPostsLoaded]);

  useEffect(() => {
    try { localStorage.setItem(KEY_STORAGE_KEY, manualKey || ''); } catch (e) {}
  }, [manualKey]);
  useEffect(() => {
    try { localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand)); } catch (e) {}
  }, [brand]);
  useEffect(() => {
    try { localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(models)); } catch (e) {}
  }, [models]);

  const [theme, setTheme] = useState(() => loadString(THEME_STORAGE_KEY) || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) {}
  }, [theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          window.location.hash = '#/generate';
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          window.location.hash = '#/radar';
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          window.location.hash = '#/settings';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const accent = brand?.colors?.accent || '#3b82f6';
    const accent2 = brand?.colors?.accent2 || '#ff7a45';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-2', accent2);
  }, [brand]);

  // URL Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validPages = ['radar', 'generate', 'calendar', 'archive', 'images', 'engagement', 'youtube', 'boilerplate', 'settings'];
      if (validPages.includes(hash)) {
        setPage(hash);
        setIsMobileMenuOpen(false); // Close menu on navigation
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (window.location.hash.slice(1) !== page) {
      window.location.hash = page;
    }
  }, [page]);

  const [radarDraft, setRadarDraft] = useState(null);
  const useRadarIdea = (draft) => {
    setRadarDraft(draft);
    setPage('generate');
  };

  return (
    <div className="h-screen flex flex-col gradient-bg overflow-hidden relative">
      <Header 
        brand={brand} 
        manualKey={manualKey} 
        setManualKey={setManualKey} 
        live={live} 
        theme={theme} 
        setTheme={setTheme} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar page={page} setPage={setPage} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-0 w-full">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageSkeleton />}>
              {page === 'radar' && <BuildRadarPage manualKey={manualKey} selModel={selModel} live={live} showToast={showToast} onUseIdea={useRadarIdea} />}
              {page === 'generate' && <GeneratePage brand={brand} manualKey={manualKey} selModel={selModel} selImgModel={selImgModel} live={live} showToast={showToast} savedPosts={savedPosts} setSavedPosts={setSavedPosts} radarDraft={radarDraft} setRadarDraft={setRadarDraft} />}
              {page === 'calendar' && <CalendarPage brand={brand} />}
              {page === 'archive' && <ArchivePage savedPosts={savedPosts} setSavedPosts={setSavedPosts} showToast={showToast} />}
              {page === 'images' && <ImageStudioPage brand={brand} manualKey={manualKey} selImgModel={selImgModel} live={live} showToast={showToast} />}
              {page === 'engagement' && <EngagementPage showToast={showToast} />}
              {page === 'youtube' && <YouTubeStudioPage manualKey={manualKey} selModel={selModel} live={live} showToast={showToast} radarDraft={radarDraft} />}
              {page === 'boilerplate' && <BoilerplateGeneratorPage manualKey={manualKey} selModel={selModel} live={live} showToast={showToast} radarDraft={radarDraft} />}
              {page === 'settings' && <SettingsPage brand={brand} setBrand={setBrand} manualKey={manualKey} setManualKey={setManualKey} selModel={selModel} setSelModel={setSelModel} selImgModel={selImgModel} setSelImgModel={setSelImgModel} live={live} />}
            </Suspense>
          </div>
        </main>
      </div>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast message={t.message} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

