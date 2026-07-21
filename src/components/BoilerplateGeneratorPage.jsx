import React, { useState } from 'react';

export default function BoilerplateGeneratorPage() {
  const [appName, setAppName] = useState('');
  const [code, setCode] = useState(null);

  const generateBoilerplate = () => {
    setCode(`// Run: npx create-vite@latest ${appName || 'my-data-app'} --template react
// Install: npm install tailwindcss postcss autoprefixer react-chartjs-2 chart.js
// --- App.jsx Boilerplate ---

import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold">${appName || 'Data Product Showcase'}</h1>
        <p className="text-gray-400">Powered by Databricks Lakehouse architecture.</p>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Core Telemetry / Insights</h2>
          <div className="h-64 bg-gray-900 rounded border border-gray-700 flex items-center justify-center">
            <span className="text-gray-500">[Chart Component Here]</span>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
          <div>
            <h3 className="text-sm uppercase text-gray-400 font-bold tracking-wider mb-2">Key Metric 1</h3>
            <p className="text-4xl font-light text-green-400">$2.4M</p>
          </div>
          <div>
            <h3 className="text-sm uppercase text-gray-400 font-bold tracking-wider mb-2">Key Metric 2</h3>
            <p className="text-4xl font-light text-blue-400">14,200</p>
          </div>
          <div>
            <button className="w-full bg-accent hover:bg-red-600 text-white font-bold py-3 rounded">
              Generate Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-100">
      <h1 className="text-3xl font-bold mb-2">The "Last Mile" Boilerplate Generator</h1>
      <p className="text-gray-400 mb-8">Generate instant React + Tailwind starter code for your Week 1 frontend builds to save setup time.</p>
      
      <div className="flex space-x-4 mb-8">
        <input 
          type="text" 
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="App Name (e.g., Visa Telemetry Dashboard)"
          className="flex-1 bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-accent"
        />
        <button 
          onClick={generateBoilerplate}
          className="bg-accent hover:bg-red-600 text-white font-bold py-3 px-6 rounded transition-colors"
        >
          Generate Code
        </button>
      </div>

      {code && (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 relative">
          <button 
            onClick={() => navigator.clipboard.writeText(code)}
            className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-gray-300"
          >
            Copy Code
          </button>
          <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap font-mono">
            {code}
          </pre>
        </div>
      )}
    </div>
  );
}
