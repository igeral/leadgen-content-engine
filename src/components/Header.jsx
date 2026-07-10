import { isUsingEnvKey } from '../utils/openrouter';

export default function Header({ brand, manualKey, setManualKey, live, theme, setTheme, switchBrand }) {
  const usingEnv = isUsingEnvKey(manualKey);
  const activeLane = brand?.presetId || 'steadfast';

  return (
    <header className="app-header border-b border-gray-700 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg logo-mark"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          L
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">LeadGen Content Engine</h1>
          <p className="text-xs text-gray-400 flex items-center gap-2">
            {brand.name ? `Loaded: ${brand.name}` : 'No brand loaded'}
            {live ? (
              <span className="badge mode-pill-live">
                {usingEnv ? 'Live (.env)' : 'Live (manual key)'}
              </span>
            ) : (
              <span className="badge mode-pill-demo">Demo Mode</span>
            )}
          </p>
        </div>
      </div>

      {/* Lane switcher — one click between the two identities */}
      <div className="lane-switch flex items-center gap-1 p-1 rounded-xl">
        <button
          className={`lane-pill ${activeLane === 'steadfast' ? 'lane-pill-active' : ''}`}
          onClick={() => switchBrand && switchBrand('steadfast')}
          title="Steadfast Physician Partners (company page)"
        >
          {'🏥'} Steadfast
        </button>
        <button
          className={`lane-pill ${activeLane === 'databricks' ? 'lane-pill-active' : ''}`}
          onClick={() => switchBrand && switchBrand('databricks')}
          title="Victor — Databricks (personal LinkedIn)"
        >
          {'🧱'} Databricks
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="password"
          placeholder={usingEnv ? '.env key active — override here' : 'Paste OpenRouter API key'}
          className="input-field text-sm"
          style={{ width: 260 }}
          value={manualKey}
          onChange={(e) => setManualKey(e.target.value)}
        />
        {usingEnv && !manualKey && (
          <span className="text-xs text-green-400 whitespace-nowrap">via .env</span>
        )}
        <button
          className="theme-toggle"
          onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
