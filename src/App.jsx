import { useState } from 'react';
import { isLiveMode, isUsingEnvKey, TEXT_MODELS, IMAGE_MODELS } from './utils/openrouter';
import { STEADFAST_PRESET } from './presets/steadfast';
import Header from './components/Header';
import NavBar from './components/NavBar';
import GeneratePage from './components/GeneratePage';
import CalendarPage from './components/CalendarPage';
import SavedPage from './components/SavedPage';
import ArchivePage from './components/ArchivePage';
import ImageStudioPage from './components/ImageStudioPage';
import SettingsPage from './components/SettingsPage';
import Toast from './components/Toast';

export default function App() {
  const [page, setPage] = useState('generate');
  const [brand, setBrand] = useState(STEADFAST_PRESET);
  const [manualKey, setManualKey] = useState('');
  const [selModel, setSelModel] = useState(TEXT_MODELS[0].id);
  const [selImgModel, setSelImgModel] = useState(IMAGE_MODELS[0].id);
  const [toast, setToast] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);

  const live = isLiveMode(manualKey);
  const showToast = (msg) => setToast(msg);

  return (
    <div className="min-h-screen gradient-bg">
      <Header brand={brand} manualKey={manualKey} setManualKey={setManualKey} live={live} />
      <NavBar page={page} setPage={setPage} />

      <main className="p-6 max-w-7xl mx-auto">
        {/* Always-mounted pages preserve state across navigation. Only the active page is visible. */}
        <div style={{ display: page === 'generate' ? 'block' : 'none' }}>
          <GeneratePage brand={brand} manualKey={manualKey} selModel={selModel} selImgModel={selImgModel} live={live} showToast={showToast} savedPosts={savedPosts} setSavedPosts={setSavedPosts} />
        </div>
        <div style={{ display: page === 'calendar' ? 'block' : 'none' }}>
          <CalendarPage brand={brand} />
        </div>
        <div style={{ display: page === 'archive' ? 'block' : 'none' }}>
          <ArchivePage savedPosts={savedPosts} setSavedPosts={setSavedPosts} showToast={showToast} />
        </div>
        <div style={{ display: page === 'saved' ? 'block' : 'none' }}>
          <SavedPage savedPosts={savedPosts} setSavedPosts={setSavedPosts} showToast={showToast} />
        </div>
        <div style={{ display: page === 'images' ? 'block' : 'none' }}>
          <ImageStudioPage brand={brand} manualKey={manualKey} selImgModel={selImgModel} live={live} showToast={showToast} />
        </div>
        <div style={{ display: page === 'settings' ? 'block' : 'none' }}>
          <SettingsPage brand={brand} setBrand={setBrand} manualKey={manualKey} setManualKey={setManualKey} selModel={selModel} setSelModel={setSelModel} selImgModel={selImgModel} setSelImgModel={setSelImgModel} live={live} />
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
