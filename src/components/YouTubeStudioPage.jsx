import React, { useState } from 'react';

export default function YouTubeStudioPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate API call to OpenRouter to generate YouTube outline
    setTimeout(() => {
      setOutline({
        title: `How I Built a Data Product for ${topic || 'Enterprise'}`,
        hooks: [
          "If your data team isn't building custom frontends, they're leaving money on the table.",
          "Here is exactly how massive brands solve the 'last mile' of data engineering.",
          "Databricks pipelines are useless if stakeholders can't consume them. Let's fix that."
        ],
        outline: [
          "1. Introduction: The Enterprise Data Bottleneck",
          "2. The 'Inspired By' Architecture: Medallion layers on Databricks",
          "3. Backend Deep Dive: Unity Catalog and Data exposure",
          "4. Frontend Demo: The React 'Last Mile' UI",
          "5. Business Value: Why this matters for the bottom line"
        ],
        thumbnails: [
          "Split screen: Messy pipeline code vs. Beautiful dashboard UI.",
          "Face bubble looking shocked pointing at a Databricks architecture diagram."
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-100">
      <h1 className="text-3xl font-bold mb-2">YouTube Studio</h1>
      <p className="text-gray-400 mb-8">Generate outlines, hooks, and thumbnail concepts for your Bi-Weekly Sprint videos.</p>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">Target Enterprise Topic / Brand</label>
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Visa telemetry, Tesla supply chain"
          className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-accent"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 bg-accent hover:bg-red-600 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          {loading ? 'Generating Strategy...' : 'Generate YouTube Plan'}
        </button>
      </div>

      {outline && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-accent">Suggested Hooks (First 30 Seconds)</h2>
            <ul className="list-disc pl-5 space-y-2">
              {outline.hooks.map((hook, i) => (
                <li key={i} className="text-gray-300">{hook}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-accent">Video Outline</h2>
            <ul className="space-y-2">
              {outline.outline.map((item, i) => (
                <li key={i} className="text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-accent">Thumbnail Concepts</h2>
            <ul className="list-disc pl-5 space-y-2">
              {outline.thumbnails.map((item, i) => (
                <li key={i} className="text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
