import { useState, useRef, useEffect } from 'react';
import { callImageAPI, generateMultipleImages, IMAGE_MODELS } from '../utils/openrouter';
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
  const [aiProgress, setAiProgress] = useState('');
  const [aiError, setAiError] = useState('');
  const [images, setImages] = useState([]); // array of {url, prompt, error}
  const [selectedImg, setSelectedImg] = useState(0);
  const [imgCount, setImgCount] = useState(5);
  const cvRef = useRef(null);

  const makeBranded = () => {
    const cv = cvRef.current;
    if (!cv) return;
    if (style === 'stat') {
      generateStatCard(cv, { stat, label, subtitle, brandName: brand.name, orientation: 'portrait', variant: 'dark' });
    } else if (style === 'quote') {
      generateQuoteCard(cv, { quote, context, closingLine, brandName: brand.name, orientation: 'portrait', variant: 'light' });
    } else {
      generateMultiCard(cv, { cardNumber: cardNum, totalCards: '3', topicLabel: multiTopic, title: multiTitle, subtitle: multiSub, brandName: brand.name, orientation: 'portrait' });
    }
    setImages([{ url: cv.toDataURL('image/png'), prompt: `Branded ${style} card`, error: null }]);
    setSelectedImg(0);
  };

  const makeAI = async () => {
    if (!live) { showToast('API key required'); return; }
    if (!aiPrompt.trim()) { showToast('Enter a prompt'); return; }
    setAiLoading(true);
    setAiError('');
    setImages([]);
    setSelectedImg(0);

    // Generate variations of the prompt
    const prompts = [];
    prompts.push(aiPrompt);
    const variations = [
      'Close-up detailed view. ',
      'Wide-angle establishing shot. ',
      'Minimalist flat design. ',
      'Cinematic dramatic lighting. ',
      'Isometric 3D illustration style. ',
    ];
    for (let i = 1; i < imgCount; i++) {
      prompts.push(variations[i % variations.length] + aiPrompt);
    }

    const results = await generateMultipleImages(manualKey, aiModel, prompts, (i, total) => {
      setAiProgress(`Generating image ${i + 1} of ${total}...`);
    });

    const successful = results.filter((r) => r.url);
    if (successful.length === 0) {
      setAiError('All images failed. Try a different model or prompt.');
    } else {
      showToast(`${successful.length} images generated!`);
    }
    setImages(results);
    setSelectedImg(0);
    setAiLoading(false);
    setAiProgress('');
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

  const successfulImages = images.filter((i) => i.url);

  const downloadAll = () => {
    successfulImages.forEach((img, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.download = `image-studio-${idx + 1}-${Date.now()}.png`;
        a.href = img.url;
        a.click();
      }, idx * 300);
    });
    showToast(`Downloading ${successfulImages.length} images...`);
  };

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
                    <button key={n} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${cardNum === n ? 'tab-active' : 'tab-inactive'}`} onClick={() => setCardNum(n)}>Card {n}</button>
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
              {IMAGE_MODELS.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>

            <label className="block text-sm font-medium text-gray-300 mb-1">Images to Generate</label>
            <div className="flex gap-2">
              {[1, 3, 5].map((n) => (
                <button key={n} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${imgCount === n ? 'tab-active' : 'tab-inactive'}`} onClick={() => setImgCount(n)}>
                  {n} {n === 1 ? 'image' : 'images'}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Templates</label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((q, i) => (<button key={i} className="btn-ghost text-xs text-left py-2" onClick={() => setAiPrompt(q.p)}>{q.l}</button>))}
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-1">Image Prompt</label>
            <textarea className="input-field" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={6} placeholder="Describe the image you want... variations will be auto-generated for multiple images." />
            {aiError && <p className="text-red-400 text-sm">Error: {aiError}</p>}
            <button className="btn-primary w-full py-3" onClick={makeAI} disabled={aiLoading || !live}>
              {aiLoading ? (aiProgress || 'Generating...') : !live ? 'API Key Required' : `\uD83E\uDD16 Generate ${imgCount} AI Image${imgCount > 1 ? 's' : ''}`}
            </button>
            {!live && <p className="text-xs text-gray-500 text-center">Set your OpenRouter API key in .env or paste in the header bar.</p>}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Preview
            {successfulImages.length > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({successfulImages.length} images)</span>}
          </h2>
          {successfulImages.length > 0 && (
            <div className="flex gap-2">
              {successfulImages.length > 1 && (
                <button className="btn-secondary text-sm" onClick={downloadAll}>{'\u2B07\uFE0F'} All</button>
              )}
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  const img = images[selectedImg];
                  if (!img?.url) return;
                  const a = document.createElement('a');
                  a.download = `image-${selectedImg + 1}-${Date.now()}.png`;
                  a.href = img.url;
                  a.click();
                  showToast('Downloaded!');
                }}
              >
                {'\u2B07\uFE0F'} Download
              </button>
            </div>
          )}
        </div>
        <canvas ref={cvRef} style={{ display: 'none' }} />

        {aiLoading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="spinner mx-auto mb-4" style={{ width: 48, height: 48 }} />
            <p className="font-medium text-gray-300">{aiProgress || 'Generating...'}</p>
            <p className="text-sm mt-1">{imgCount > 1 ? `Creating ${imgCount} image variations` : '10-30 seconds typically'}</p>
          </div>
        ) : successfulImages.length > 0 ? (
          <div>
            {/* Main image */}
            <div className="relative mb-3">
              <img src={images[selectedImg]?.url} className="w-full rounded-lg shadow-lg" alt="Preview" onError={() => { showToast('Load error'); }} />
              {successfulImages.length > 1 && (
                <div className="absolute top-2 left-2 badge bg-black bg-opacity-60 text-white text-xs px-2 py-1">
                  {selectedImg + 1} / {successfulImages.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-video ${
                      selectedImg === i ? 'border-blue-500' : 'border-gray-600 hover:border-gray-400'
                    } ${!img.url ? 'opacity-40' : ''}`}
                    onClick={() => img.url && setSelectedImg(i)}
                    disabled={!img.url}
                  >
                    {img.url ? (
                      <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${i + 1}`} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-red-400">{'\u2717'}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-3">{tab === 'ai' ? '\uD83E\uDD16' : '\uD83C\uDFA8'}</div>
            <p>Click Generate to create your images</p>
          </div>
        )}
      </div>
    </div>
  );
}
