import { useState, useRef, useEffect } from 'react';
import { callImageAPI, IMAGE_MODELS } from '../utils/openrouter';
import { generateStatCard, generateQuoteCard, generateMultiCard } from '../utils/imageGenerator';

export default function ImageStudioPage({ brand, manualKey, selImgModel, live, showToast }) {
  const [tab, setTab] = useState('branded');
  const [style, setStyle] = useState('stat');
  const [stat, setStat] = useState('86,000');
  const [label, setLabel] = useState('Projected U.S. physician shortage by 2036.');
  const [subtitle, setSubtitle] = useState('The gap is real. The time to plan is now.');
  const [category, setCategory] = useState('PHYSICIAN WORKFORCE INSIGHT');
  const [quote, setQuote] = useState("A strong locum tenens strategy is not a backup plan. It's a competitive advantage.");
  const [context, setContext] = useState('Reactive staffing model:\nHigher rates. More admin load.\n\nProactive staffing model:\nLower cost. Better integration.');
  const [closingLine, setClosingLine] = useState('Pay less. Every time.');
  const [multiTitle, setMultiTitle] = useState('$1M+');
  const [multiSub, setMultiSub] = useState('Lost annually per unfilled physician position.');
  const [multiTopic, setMultiTopic] = useState('THE COST OF DOING NOTHING');
  const [multiTag, setMultiTag] = useState('WORKFORCE DATA');
  const [cardNum, setCardNum] = useState('1');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModel, setAiModel] = useState(selImgModel || IMAGE_MODELS[0].id);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [imgData, setImgData] = useState(null);
  const cvRef = useRef(null);

  const makeBranded = () => {
    const cv = cvRef.current;
    if (!cv) return;
    if (style === 'stat') {
      generateStatCard(cv, { stat, label, subtitle, category, brandName: brand.name, tagline: brand.tagline, colors: brand.colors });
    } else if (style === 'quote') {
      generateQuoteCard(cv, { quote, context, closingLine, brandName: brand.name, role: brand.tagline, tagline: brand.tagline, colors: brand.colors });
    } else {
      generateMultiCard(cv, { cardNumber: cardNum, totalCards: '3', topicLabel: multiTopic, title: multiTitle, subtitle: multiSub, tagLabel: multiTag, brandName: brand.name, colors: brand.colors });
    }
    setImgData(cv.toDataURL('image/png'));
  };

  const makeAI = async () => {
    if (!live) { showToast('API key required'); return; }
    if (!aiPrompt.trim()) { showToast('Enter a prompt'); return; }
    setAiLoading(true);
    setAiError('');
    setImgData(null);
    try {
      const url = await callImageAPI(manualKey, aiModel, aiPrompt);
      setImgData(url);
      showToast('AI image generated!');
    } catch (e) {
      setAiError(e.message);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (tab === 'branded') makeBranded();
  }, [style, tab]);

  const QUICK_PROMPTS = [
    { l: 'Stat Card', p: `Professional dark navy infographic card for ${brand.name || 'a healthcare company'}. One large bold stat "86,000". Clean, modern. "Projected U.S. physician shortage by 2036" below. 16:9.` },
    { l: 'Quote Card', p: 'Thought leadership social media card. Steel blue gradient. Large quotation mark. "A strong locum tenens strategy is not a backup plan." Split layout. 16:9.' },
    { l: 'Hospital Scene', p: 'Modern hospital corridor, physician in white coat walking confidently. Warm, hopeful. Natural candid composition. Landscape 16:9.' },
    { l: 'Data Viz', p: 'Clean data visualization on dark background. Upward trend line. Blue/teal palette. "Physician Demand Forecast 2024-2036". Elegant, LinkedIn-ready. 16:9.' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Controls */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-white mb-4">{'\uD83D\uDDBC'} Image Studio</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'branded' ? 'purple-active' : 'tab-inactive'}`} onClick={() => setTab('branded')}>
            {'\uD83C\uDFA8'} Branded Cards
          </button>
          <button className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'ai' ? 'purple-active' : 'tab-inactive'}`} onClick={() => setTab('ai')}>
            {'\uD83E\uDD16'} AI Image Gen {!live && <span className="text-xs opacity-60 ml-1">(key needed)</span>}
          </button>
        </div>

        {/* Branded controls */}
        {tab === 'branded' && (
          <div>
            <div className="flex gap-2 mb-4">
              {[{ id: 'stat', l: '\uD83D\uDCCA Stat' }, { id: 'quote', l: '\uD83D\uDCAC Quote' }, { id: 'multi', l: '\uD83D\uDCD1 Multi' }].map((s) => (
                <button key={s.id} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${style === s.id ? 'tab-active' : 'tab-inactive'}`} onClick={() => setStyle(s.id)}>
                  {s.l}
                </button>
              ))}
            </div>

            {style === 'stat' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Category</label>
                <input className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} />
                <label className="block text-sm font-medium text-gray-300">Main Stat</label>
                <input className="input-field" value={stat} onChange={(e) => setStat(e.target.value)} />
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <input className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} />
                <label className="block text-sm font-medium text-gray-300">Subtitle</label>
                <input className="input-field" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
            )}
            {style === 'quote' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Main Quote</label>
                <textarea className="input-field" value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} />
                <label className="block text-sm font-medium text-gray-300">Context</label>
                <textarea className="input-field" value={context} onChange={(e) => setContext(e.target.value)} rows={4} />
                <label className="block text-sm font-medium text-gray-300">Closing Line</label>
                <input className="input-field" value={closingLine} onChange={(e) => setClosingLine(e.target.value)} />
              </div>
            )}
            {style === 'multi' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Card #</label>
                <div className="flex gap-2">
                  {['1', '2', '3'].map((n) => (
                    <button key={n} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${cardNum === n ? 'tab-active' : 'tab-inactive'}`} onClick={() => setCardNum(n)}>
                      Card {n}
                    </button>
                  ))}
                </div>
                <label className="block text-sm font-medium text-gray-300">Topic</label>
                <input className="input-field" value={multiTopic} onChange={(e) => setMultiTopic(e.target.value)} />
                <label className="block text-sm font-medium text-gray-300">Title</label>
                <input className="input-field" value={multiTitle} onChange={(e) => setMultiTitle(e.target.value)} />
                <label className="block text-sm font-medium text-gray-300">Subtitle</label>
                <input className="input-field" value={multiSub} onChange={(e) => setMultiSub(e.target.value)} />
                <label className="block text-sm font-medium text-gray-300">Tag</label>
                <input className="input-field" value={multiTag} onChange={(e) => setMultiTag(e.target.value)} />
              </div>
            )}
            <button className="btn-primary w-full mt-4" onClick={makeBranded}>{'\uD83C\uDFA8'} Generate Branded Card</button>
          </div>
        )}

        {/* AI controls */}
        {tab === 'ai' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Image Model</label>
            <select className="input-field" value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
              {IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Templates</label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((q, i) => (
                <button key={i} className="btn-ghost text-xs text-left py-2" onClick={() => setAiPrompt(q.p)}>{q.l}</button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-1">Image Prompt</label>
            <textarea className="input-field" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={6} placeholder="Describe the image you want..." />
            {aiError && <p className="text-red-400 text-sm">Error: {aiError}</p>}
            <button className="btn-primary w-full py-3" onClick={makeAI} disabled={aiLoading || !live}>
              {aiLoading ? 'Generating AI Image...' : !live ? 'API Key Required' : '\uD83E\uDD16 Generate AI Image'}
            </button>
            {!live && <p className="text-xs text-gray-500 text-center">Set your OpenRouter API key in .env or paste in the header bar.</p>}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Preview</h2>
          {imgData && (
            <button
              className="btn-secondary text-sm"
              onClick={() => {
                const a = document.createElement('a');
                a.download = `image-${Date.now()}.png`;
                a.href = imgData;
                a.click();
                showToast('Downloaded!');
              }}
            >
              {'\u2B07\uFE0F'} Download PNG
            </button>
          )}
        </div>
        <canvas ref={cvRef} style={{ display: 'none' }} />
        {aiLoading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="spinner mx-auto mb-4" style={{ width: 48, height: 48 }} />
            <p className="font-medium text-gray-300">AI is generating your image...</p>
            <p className="text-sm mt-1">10-30 seconds typically</p>
          </div>
        ) : imgData ? (
          <img src={imgData} className="w-full rounded-lg shadow-lg" alt="Preview" onError={() => { showToast('Load error'); setImgData(null); }} />
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-3">{tab === 'ai' ? '\uD83E\uDD16' : '\uD83C\uDFA8'}</div>
            <p>Click Generate to create your image</p>
          </div>
        )}
      </div>
    </div>
  );
}
