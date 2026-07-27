import { isUsingEnvKey } from '../utils/openrouter';
import Icon from './Icon';

export default function Header({ brand, manualKey, setManualKey, live, theme, setTheme, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const usingEnv = isUsingEnvKey(manualKey);

  return (
    <header className="app-header border-b border-[var(--card-border)] px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap z-20 bg-[var(--header-bg)] backdrop-blur-md sticky top-0">
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden p-2 -ml-2 text-[var(--text-2)] hover:text-[var(--text-1)]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Icon name={isMobileMenuOpen ? 'x' : 'menu'} size={24} />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white logo-mark hidden md:flex"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
        >
          <Icon name="zap" size={20} strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--text-1)] tracking-tight">Architect OS</h1>
          <p className="text-xs text-[var(--text-2)] flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]"
              style={{ boxShadow: `0 0 6px var(--accent)` }}
            />
            Data & Lakehouse Architect
            {live ? (
              <span className="badge mode-pill-live border border-green-500/30 hidden sm:inline-flex">
                {usingEnv ? 'Live (.env)' : 'Live (manual key)'}
              </span>
            ) : (
              <span className="badge mode-pill-demo border border-yellow-500/30 hidden sm:inline-flex">Demo Mode</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="password"
          placeholder={usingEnv ? '.env key active' : 'Paste OpenRouter API key'}
          className="input-field text-sm hidden sm:block"
          style={{ width: 220 }}
          value={manualKey}
          onChange={(e) => setManualKey(e.target.value)}
        />
        {usingEnv && !manualKey && (
          <span className="text-xs text-green-400 whitespace-nowrap hidden lg:inline">via .env</span>
        )}
        <button
          className="theme-toggle"
          onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
      </div>
    </header>
  );
}
