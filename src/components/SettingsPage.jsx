import { useState, useEffect } from 'react';
import { TEXT_MODELS, IMAGE_MODELS, isUsingEnvKey } from '../utils/openrouter';
import { STEADFAST_PRESET } from '../presets/steadfast';
import { DATABRICKS_PRESET } from '../presets/databricks';
import { BLANK_PRESET } from '../presets/blank';

export default function SettingsPage({ brand, setBrand, manualKey, setManualKey, selModel, setSelModel, selImgModel, setSelImgModel, live }) {
  const [preset, setPreset] = useState(brand?.presetId || 'steadfast');
  const [eb, setEb] = useState({ ...brand });
  const [np, setNp] = useState({ name: '', audience: '', description: '' });
  const [ndp, setNdp] = useState('');
  const usingEnv = isUsingEnvKey(manualKey);

  const load = (p) => {
    const d = p === 'steadfast' ? STEADFAST_PRESET : p === 'databricks' ? DATABRICKS_PRESET : BLANK_PRESET;
    setBrand(d);
    setEb(d);
    setPreset(p);
  };

  // Keep the edit buffer in sync when the brand changes elsewhere (e.g. the
  // header lane switcher) — pages stay mounted, so local state would go stale.
  useEffect(() => {
    setEb({ ...brand });
    if (brand?.presetId) setPreset(brand.presetId);
  }, [brand]);

  const upd = (field, value) => {
    const u = { ...eb, [field]: value };
    setEb(u);
    setBrand(u);
  };

  const updColor = (key, value) => {
    const colors = { ...eb.colors, [key]: value };
    const u = { ...eb, colors };
    setEb(u);
    setBrand(u);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* API Configuration */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-4">{'\uD83D\uDD11'} AI Configuration</h2>
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
        <p className="text-xs text-gray-500 mb-4">Get your key at openrouter.ai/keys</p>

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

      {/* Presets */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-4">{'\uD83D\uDCE6'} Brand Presets</h2>
        <div className="flex gap-3">
          <button
            className={`flex-1 p-4 rounded-lg border text-left transition-all ${preset === 'steadfast' ? 'border-blue-500 bg-blue-900 bg-opacity-20' : 'border-gray-600 hover:border-gray-500'}`}
            onClick={() => load('steadfast')}
          >
            <div className="font-bold text-white">{'\uD83C\uDFE5'} Steadfast Physician Partners</div>
            <div className="text-xs text-gray-400 mt-1">4321 framework, 4 pillars, schedule, data points</div>
          </button>
          <button
            className={`flex-1 p-4 rounded-lg border text-left transition-all ${preset === 'databricks' ? 'border-blue-500 bg-blue-900 bg-opacity-20' : 'border-gray-600 hover:border-gray-500'}`}
            onClick={() => load('databricks')}
          >
            <div className="font-bold text-white">{'\ud83e\uddf1'} Victor \u2014 Databricks (Personal)</div>
            <div className="text-xs text-gray-400 mt-1">Personal LinkedIn, 2 posts/week, public knowledge only</div>
          </button>
          <button
            className={`flex-1 p-4 rounded-lg border text-left transition-all ${preset === 'blank' ? 'border-blue-500 bg-blue-900 bg-opacity-20' : 'border-gray-600 hover:border-gray-500'}`}
            onClick={() => load('blank')}
          >
            <div className="font-bold text-white">{'\u2728'} Blank Template</div>
            <div className="text-xs text-gray-400 mt-1">Start fresh</div>
          </button>
        </div>
      </div>

      {/* Brand Identity */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-4">{'\uD83C\uDFE2'} Brand Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
            <input className="input-field" value={eb.name} onChange={(e) => upd('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tagline</label>
            <input className="input-field" value={eb.tagline} onChange={(e) => upd('tagline', e.target.value)} />
          </div>
        </div>
        <label className="block text-sm font-medium text-gray-300 mb-1 mt-3">Category Positioning</label>
        <textarea className="input-field" value={eb.category} onChange={(e) => upd('category', e.target.value)} rows={2} />
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Brand Colors</label>
          <div className="flex gap-4 flex-wrap">
            {['primary', 'secondary', 'accent'].map((k) => (
              <div key={k} className="flex items-center gap-2">
                <input type="color" value={eb.colors[k] || '#1a365d'} onChange={(e) => updColor(k, e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400 capitalize">{k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Pillars */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-4">{'\uD83D\uDCCC'} Content Pillars</h2>
        <div className="space-y-2 mb-4">
          {eb.pillars.map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg">
              <div className="flex-1">
                <span className="font-semibold text-white">{p.name}</span>
                <span className="text-gray-400 text-sm ml-2">{'\u2192'} {p.audience}</span>
                {p.description && <div className="text-xs text-gray-500 mt-1">{p.description}</div>}
              </div>
              <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => upd('pillars', eb.pillars.filter((_, j) => j !== i))}>
                {'\u2715'}
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className="input-field" placeholder="Pillar name" value={np.name} onChange={(e) => setNp((p) => ({ ...p, name: e.target.value }))} />
          <input className="input-field" placeholder="Audience" value={np.audience} onChange={(e) => setNp((p) => ({ ...p, audience: e.target.value }))} />
          <button
            className="btn-secondary"
            onClick={() => {
              if (!np.name) return;
              upd('pillars', [...eb.pillars, { ...np }]);
              setNp({ name: '', audience: '', description: '' });
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Data Points */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-4">{'\uD83D\uDCCA'} Data Points</h2>
        <div className="space-y-1 mb-3">
          {(eb.dataPoints || []).map((dp, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-blue-400">{'\u2192'}</span>
              <span className="text-gray-300 flex-1">{dp}</span>
              <button className="text-red-400 hover:text-red-300 text-xs" onClick={() => upd('dataPoints', eb.dataPoints.filter((_, j) => j !== i))}>
                {'\u2715'}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="e.g., 86,000 projected physician shortage by 2036"
            value={ndp}
            onChange={(e) => setNdp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ndp) {
                upd('dataPoints', [...(eb.dataPoints || []), ndp]);
                setNdp('');
              }
            }}
          />
          <button
            className="btn-secondary"
            onClick={() => {
              if (!ndp) return;
              upd('dataPoints', [...(eb.dataPoints || []), ndp]);
              setNdp('');
            }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
