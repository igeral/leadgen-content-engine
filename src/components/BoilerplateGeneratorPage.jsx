import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Icon from './Icon';
import { callOpenRouter } from '../utils/openrouter';

export default function BoilerplateGeneratorPage({ manualKey, selModel, live, showToast, radarDraft }) {
  const [appName, setAppName] = useState('');
  const [complexity, setComplexity] = useState('intermediate');
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (radarDraft && radarDraft.topic) {
      setAppName(`${radarDraft.industry || 'Enterprise'} ${radarDraft.topic} UI`);
    }
  }, [radarDraft]);

  const generateBoilerplate = async () => {
    if (!appName.trim()) {
      if (showToast) showToast('Please enter an app name.');
      return;
    }
    
    setLoading(true);
    try {
      const sysPrompt = `You are a Senior Frontend Architect. Generate ONLY valid React/Tailwind JSX code for a single-file prototype dashboard.
Do not include markdown fences. Do not include explanations. Do not include import statements unless absolutely necessary.
Just output the raw code for the React component that can be copy-pasted.`;

      const radarContext = radarDraft ? `\nContext: This app serves the ${radarDraft.industry || 'enterprise'} sector. Topic: ${radarDraft.topic}.` : '';

      const userPrompt = `Generate a modern, beautiful React dashboard component named 'App' using Tailwind CSS.
App Name: ${appName}
Complexity Level: ${complexity} (beginner = simple chart, intermediate = KPIs + charts, expert = Network topology + KPIs)${radarContext}

Use a dark mode color palette (slate-900 backgrounds, glowing accents).
Return ONLY the raw JSX code.`;

      const raw = await callOpenRouter(manualKey, selModel, sysPrompt, userPrompt);
      const cleaned = raw.replace(/^```(?:jsx|javascript|tsx)?\s*/i, '').replace(/\s*```$/i, '').trim();
      setCode(cleaned);
      if (showToast) showToast('Boilerplate generated!');
    } catch (err) {
      console.error(err);
      if (showToast) showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadZip = async () => {
    if (!code) return;
    try {
      const zip = new JSZip();
      
      const packageJson = {
        "name": appName.toLowerCase().replace(/\\s+/g, '-') || "prototype-ui",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "lucide-react": "^0.300.0",
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        },
        "devDependencies": {
          "@vitejs/plugin-react": "^4.2.1",
          "autoprefixer": "^10.4.16",
          "postcss": "^8.4.32",
          "tailwindcss": "^3.4.0",
          "vite": "^5.0.8"
        }
      };

      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

      const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f172a;
  color: #f8fafc;
}`;

      const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

      const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

      zip.file("package.json", JSON.stringify(packageJson, null, 2));
      zip.file("tailwind.config.js", tailwindConfig);
      zip.file("postcss.config.js", "export default { plugins: { tailwindcss: {}, autoprefixer: {}, }, }");
      zip.file("index.html", indexHtml);
      zip.folder("src").file("index.css", indexCss);
      zip.folder("src").file("main.jsx", mainJsx);
      zip.folder("src").file("App.jsx", code);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/\\s+/g, '-') || 'boilerplate'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if (showToast) showToast(`ZIP Error: ${e.message}`);
    }
  };

  return (
    <div className="animate-fade-in text-[var(--text-1)] max-w-4xl mx-auto md:p-8 p-4">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-1)] flex items-center gap-2.5">
            <Icon name="code" size={26} strokeWidth={2.2} /> Code Boilerplate
          </h2>
          <p className="text-sm md:text-base text-[var(--text-2)] mt-2 max-w-2xl">
            Generate an AI-powered React + Tailwind starter dashboard for your weekend builds.
          </p>
        </div>
      </div>
      
      <div className="bg-[var(--surface-2)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
        <div className="mb-6">
          <label className="block text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Target App Name / Focus</label>
          <input 
            type="text" 
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g., Visa Telemetry Dashboard"
            className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded p-3 text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
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
          disabled={loading || !live}
          className="bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-bold w-full py-3 rounded transition-all"
        >
          {loading ? 'Writing Code...' : !live ? 'Need API Key' : 'Generate React Boilerplate'}
        </button>
      </div>

      {code && (
        <div className="bg-[var(--surface-2)] p-6 rounded-xl border border-[var(--card-border)] relative shadow-2xl overflow-hidden">
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={() => navigator.clipboard.writeText(code)}
              className="btn-secondary text-xs flex items-center gap-2 bg-[var(--surface-3)] border-slate-600 text-[var(--text-2)] hover:text-white"
            >
              <Icon name="copy" size={14} /> Copy
            </button>
            <button 
              onClick={downloadZip}
              className="btn-primary text-xs flex items-center gap-2 bg-blue-600 hover:bg-blue-500 border-none text-white"
            >
              <Icon name="download" size={14} /> Download ZIP
            </button>
          </div>
          <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap font-mono mt-10">
            {code}
          </pre>
        </div>
      )}
    </div>
  );
}
