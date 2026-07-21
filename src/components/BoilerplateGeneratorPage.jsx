import React, { useState } from 'react';
import Icon from './Icon';

export default function BoilerplateGeneratorPage() {
  const [appName, setAppName] = useState('');
  const [complexity, setComplexity] = useState('intermediate');
  const [code, setCode] = useState(null);

  const generateBoilerplate = () => {
    let components = '';
    if (complexity === 'beginner') {
      components = `
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--card-border)] text-center">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-1)]">Basic Chart</h2>
          <p className="text-[var(--text-2)] mb-4">Paste your dataset here to render a basic visualization.</p>
          <div className="h-48 bg-[var(--surface-2)] rounded border border-[var(--input-border)] flex items-center justify-center text-[var(--text-3)]">
            [Simple Chart]
          </div>
        </div>`;
    } else if (complexity === 'intermediate') {
      components = `
        <div className="col-span-2 bg-[var(--surface)] p-6 rounded-xl border border-[var(--card-border)]">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-1)]">Core Telemetry / Insights</h2>
          <div className="h-64 bg-[var(--surface-2)] rounded border border-[var(--input-border)] flex items-center justify-center text-[var(--text-3)]">
            <span className="text-[var(--text-3)]">[Chart Component Here]</span>
          </div>
        </div>
        
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--card-border)] space-y-6">
          <div>
            <h3 className="text-sm uppercase text-[var(--text-3)] font-bold tracking-wider mb-2">Key Metric 1</h3>
            <p className="text-4xl font-light text-green-500">$2.4M</p>
          </div>
          <div>
            <h3 className="text-sm uppercase text-[var(--text-3)] font-bold tracking-wider mb-2">Key Metric 2</h3>
            <p className="text-4xl font-light text-blue-500">14,200</p>
          </div>
          <div>
            <button className="w-full bg-[var(--accent)] hover:opacity-90 text-white font-bold py-3 rounded">
              Generate Report
            </button>
          </div>
        </div>`;
    } else {
      components = `
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
           <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--card-border)]">
             <div className="text-xs text-[var(--text-3)] uppercase font-bold mb-1">Latency</div>
             <div className="text-2xl font-semibold text-[var(--text-1)]">12ms</div>
           </div>
           <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--card-border)]">
             <div className="text-xs text-[var(--text-3)] uppercase font-bold mb-1">Throughput</div>
             <div className="text-2xl font-semibold text-[var(--text-1)]">45k req/s</div>
           </div>
           <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--card-border)]">
             <div className="text-xs text-[var(--text-3)] uppercase font-bold mb-1">Error Rate</div>
             <div className="text-2xl font-semibold text-red-400">0.01%</div>
           </div>
           <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--card-border)]">
             <div className="text-xs text-[var(--text-3)] uppercase font-bold mb-1">Compute Cost</div>
             <div className="text-2xl font-semibold text-green-400">$12.40/hr</div>
           </div>
        </div>
        <div className="col-span-3 bg-[var(--surface)] p-6 rounded-xl border border-[var(--card-border)]">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-1)]">Real-time Architecture Topology</h2>
          <div className="h-80 bg-[var(--surface-2)] rounded border border-[var(--input-border)] flex items-center justify-center text-[var(--text-3)]">
            <span className="text-[var(--text-3)]">[Complex Network/Node Graph Here]</span>
          </div>
        </div>`;
    }

    setCode(`// Run: npx create-vite@latest ${appName.toLowerCase().replace(/\\s+/g, '-') || 'my-data-app'} --template react
// Install: npm install tailwindcss postcss autoprefixer react-chartjs-2 chart.js
// --- App.jsx Boilerplate ---

import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] p-8">
      <header className="mb-8 border-b border-[var(--card-border)] pb-4">
        <h1 className="text-3xl font-bold">${appName || 'Data Product Showcase'}</h1>
        <p className="text-[var(--text-2)] mt-2">Powered by Databricks Lakehouse architecture.</p>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
${components}
      </main>
    </div>
  );
}
`);
  };

  return (
    <div className="animate-fade-in text-[var(--text-1)] max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-1)] flex items-center gap-2.5">
            <Icon name="code" size={22} strokeWidth={2.2} /> Code Boilerplate
          </h2>
          <p className="text-sm text-[var(--text-2)] mt-1 max-w-2xl">
            Generate instant React + Tailwind starter code for your weekend frontend builds to save setup time.
            Control the complexity of the UI to match the scope of your data product.
          </p>
        </div>
      </div>
      
      <div className="card p-6 mb-8">
        <div className="mb-6">
          <label className="block text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Target App Name</label>
          <input 
            type="text" 
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g., Visa Telemetry Dashboard"
            className="input-field w-full"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Architecture Complexity</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'beginner', label: 'Basic', desc: 'Simple chart container' },
              { id: 'intermediate', label: 'Intermediate', desc: 'Charts + KPI sidebar' },
              { id: 'expert', label: 'Advanced', desc: 'Top-line KPIs + Network Topology' }
            ].map(level => (
              <button
                key={level.id}
                onClick={() => setComplexity(level.id)}
                className={`p-4 rounded-xl border text-left transition-all ${complexity === level.id ? 'font-semibold' : 'bg-[var(--surface-2)] border-[var(--card-border)] text-[var(--text-2)] hover:border-[var(--text-3)]'}`}
                style={complexity === level.id ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
              >
                <div className="font-bold text-sm mb-1">{level.label}</div>
                <div className="text-xs opacity-80">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={generateBoilerplate}
          className="btn-primary w-full py-3"
        >
          Generate React Boilerplate
        </button>
      </div>

      {code && (
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-700 relative shadow-2xl">
          <button 
            onClick={() => navigator.clipboard.writeText(code)}
            className="absolute top-4 right-4 btn-secondary text-xs flex items-center gap-2 bg-slate-800 border-slate-600 text-slate-300 hover:text-white"
          >
            <Icon name="copy" size={14} /> Copy Code
          </button>
          <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap font-mono mt-4">
            {code}
          </pre>
        </div>
      )}
    </div>
  );
}
