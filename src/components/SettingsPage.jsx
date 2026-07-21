import { TEXT_MODELS, IMAGE_MODELS, isUsingEnvKey } from '../utils/openrouter';

export default function SettingsPage({ manualKey, setManualKey, selModel, setSelModel, selImgModel, setSelImgModel, live }) {
  const usingEnv = isUsingEnvKey(manualKey);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <span className="text-xl">⚙️</span> System Settings
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure API keys and model selections for the AI Data Product Architect engine.
        </p>
      </div>

      {/* API Configuration */}
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">🔑 OpenRouter Configuration</h3>
        <div className={`mb-4 p-3 rounded-lg border ${live ? 'border-green-700' : 'border-yellow-700'}`} style={{ background: live ? 'rgba(34,197,94,.1)' : 'rgba(234,179,8,.1)' }}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className={`text-sm font-medium ${live ? 'text-green-300' : 'text-yellow-300'}`}>
              {live ? (usingEnv ? 'Live Mode — using .env key' : 'Live Mode — using manual key') : 'Demo Mode — no API key detected'}
            </span>
          </div>
          {!live && <p className="text-xs text-gray-400 mt-1 ml-5">Add VITE_OPENROUTER_API_KEY to your .env file, or paste a key in the header.</p>}
        </div>

        <label className="block text-sm font-medium text-gray-300 mb-1">Manual API Key Override</label>
        <input type="password" className="input-field mb-1" placeholder={usingEnv ? '.env key active — override here' : 'sk-or-...'} value={manualKey} onChange={(e) => setManualKey(e.target.value)} />
        <p className="text-xs text-gray-500 mb-6">Get your key at openrouter.ai/keys</p>

        <label className="block text-sm font-medium text-gray-300 mb-1">Content Writing Model</label>
        <select className="input-field mb-4" value={selModel} onChange={(e) => setSelModel(e.target.value)}>
          <optgroup label="Premium">
            {TEXT_MODELS.filter((m) => m.tier === 'premium').map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </optgroup>
          <optgroup label="Budget">
            {TEXT_MODELS.filter((m) => m.tier === 'budget').map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </optgroup>
        </select>

        <label className="block text-sm font-medium text-gray-300 mb-1">Image Generation Model</label>
        <select className="input-field" value={selImgModel} onChange={(e) => setSelImgModel(e.target.value)}>
          {IMAGE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-2">Architect Persona Locked</h3>
        <p className="text-sm text-gray-400">
          The brand identity forms have been removed to enforce the strict "AI Data Product Architect" persona across all tools in the suite. This ensures consistent, high-ticket positioning.
        </p>
      </div>
    </div>
  );
}
