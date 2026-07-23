import React, { useState, useEffect } from 'react';
import { callOpenRouter } from '../utils/openrouter';

export default function YouTubeStudioPage({ manualKey, selModel, live, showToast, radarDraft }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState(null);

  useEffect(() => {
    if (radarDraft && radarDraft.topic) {
      setTopic(`${radarDraft.targetBrand || 'Enterprise'} - ${radarDraft.topic}`);
    }
  }, [radarDraft]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      if (showToast) showToast('Please enter a topic first.');
      return;
    }
    
    setLoading(true);
    setOutline(null);
    try {
      const sysPrompt = `You are a world-class YouTube strategist for technical B2B content (Data Engineering, AI, Cloud). 
You help architects plan "Blueprint" case study videos.
Return ONLY valid JSON. No markdown formatting, no code fences.`;

      const userPrompt = `Create a YouTube video plan for the following topic:
TOPIC: ${topic}

Requirements:
- The video should be a deep-dive tutorial or case study.
- It must appeal to software engineers, data architects, and technical founders.
- Provide 3 highly engaging hooks for the first 30 seconds.
- Provide a 5-6 part outline (Intro, Architecture, Code, etc).
- Provide 2 distinct thumbnail concepts.

Return EXACTLY this JSON shape:
{
  "title": "The YouTube Video Title",
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "outline": ["1. section", "2. section", ...],
  "thumbnails": ["concept 1", "concept 2"]
}`;

      const raw = await callOpenRouter(manualKey, selModel, sysPrompt, userPrompt);
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      
      setOutline(parsed);
      if (showToast) showToast('YouTube plan generated!');
    } catch (err) {
      console.error(err);
      if (showToast) showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--text-1)]">YouTube Studio</h1>
      <p className="text-[var(--text-2)] mb-8 text-sm md:text-base">Generate outlines, hooks, and thumbnail concepts for your Bi-Weekly Sprint videos.</p>
      
      <div className="bg-[var(--surface-2)] p-6 rounded-lg mb-8 border border-[var(--card-border)]">
        <label className="block text-sm font-medium text-[var(--text-2)] mb-2">Target Enterprise Topic / Brand</label>
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Visa telemetry, Tesla supply chain"
          className="w-full bg-[var(--surface)] border border-[var(--card-border)] rounded p-3 text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !live}
          className="mt-4 bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-bold py-2 px-6 rounded transition-all"
        >
          {loading ? 'Generating Strategy...' : !live ? 'Need API Key' : 'Generate YouTube Plan'}
        </button>
      </div>

      {outline && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--card-border)]">
            <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Video Title</h2>
            <p className="text-[var(--text-1)] text-xl">{outline.title}</p>
          </div>

          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--card-border)]">
            <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Suggested Hooks (First 30 Seconds)</h2>
            <ul className="list-disc pl-5 space-y-2">
              {outline.hooks?.map((hook, i) => (
                <li key={i} className="text-[var(--text-2)]">{hook}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--card-border)]">
            <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Video Outline</h2>
            <ul className="space-y-2">
              {outline.outline?.map((item, i) => (
                <li key={i} className="text-[var(--text-2)]">{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--card-border)]">
            <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Thumbnail Concepts</h2>
            <ul className="list-disc pl-5 space-y-2">
              {outline.thumbnails?.map((item, i) => (
                <li key={i} className="text-[var(--text-2)]">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
