import { useState, useRef } from 'react';
import { callOpenRouter, callImageAPI, buildSystemPrompt, buildUserPrompt, buildImagePrompt } from '../utils/openrouter';
import { generateStatCard, generateQuoteCard, generateMultiCard } from '../utils/imageGenerator';
import { MOCK_POSTS } from '../presets/mockPosts';

export default function GeneratePage({ brand, manualKey, selModel, selImgModel, live, showToast, savedPosts, setSavedPosts }) {
  const [platform, setPlatform] = useState('LinkedIn');
  const [pillarIdx, setPillarIdx] = useState(0);
  const [audience, setAudience] = useState('');
  const [topic, setTopic] = useState('');
  const [imageStyle, setImageStyle] = useState('stat');
  const [imageMode, setImageMode] = useState('branded');
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgData, setImgData] = useState(null);
  const cvRef = useRef(null);
  const pillar = brand.pillars[pillarIdx] || brand.pillars[0];

  const makeBrandedImg = (style) => {
    const cv = cvRef.current;
    if (!cv) return;
    if (style === 'stat') {
      const dp = brand.dataPoints?.length
        ? brand.dataPoints[Math.floor(Math.random() * brand.dataPoints.length)]
        : '86,000 projected physician shortage';
      const m = dp.match(/^([\$\d,\.%\+]+)\s*(.*)/);
      generateStatCard(cv, {
        stat: m ? m[1] : dp.split(' ')[0],
        label: m ? m[2] : dp,
        category: pillar.name,
        brandName: brand.name,
        tagline: brand.tagline,
        colors: brand.colors,
      });
    } else if (style === 'quote') {
      generateQuoteCard(cv, {
        quote: topic || "A strong locum tenens strategy is not a backup plan. It's a competitive advantage.",
        context: 'Reactive staffing model:\nHigher rates. More admin load.\n\nProactive staffing model:\nLower cost. Better integration.',
        closingLine: 'Pay less. Every time.',
        brandName: brand.name,
        role: brand.tagline,
        tagline: brand.tagline,
        colors: brand.colors,
      });
    } else {
      generateMultiCard(cv, {
        cardNumber: '1',
        totalCards: '3',
        topicLabel: 'THE COST OF DOING NOTHING',
        title: '$1M+',
        subtitle: 'Lost annually per unfilled physician position.',
        subSubtitle: "That's lost billings, diverted patients, overtime premiums.",
        tagLabel: pillar.name,
        brandName: brand.name,
        colors: brand.colors,
      });
    }
    setImgData(cv.toDataURL('image/png'));
  };

  const makeAIImg = async () => {
    setImgLoading(true);
    try {
      const url = await callImageAPI(manualKey, selImgModel, buildImagePrompt(brand, pillar, imageStyle));
      setImgData(url);
      showToast('AI image generated!');
    } catch {
      showToast('AI image failed — using branded card');
      makeBrandedImg(imageStyle);
    }
    setImgLoading(false);
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    setPost('');
    setImgData(null);
    try {
      let txt;
      if (live) {
        txt = await callOpenRouter(manualKey, selModel, buildSystemPrompt(brand, platform), buildUserPrompt(pillar, audience, topic, brand.dataPoints, imageStyle));
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        const pp = MOCK_POSTS[platform.toLowerCase()] || MOCK_POSTS.linkedin;
        const pl = pp[pillar.name] || pp['Educational'] || Object.values(pp)[0];
        txt = pl[Math.floor(Math.random() * pl.length)];
      }
      setPost(txt);
      setLoading(false);
      if (imageMode === 'ai' && live) await makeAIImg();
      else makeBrandedImg(imageStyle);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const savePost = () => {
    if (!post) return;
    setSavedPosts((p) => [
      ...p,
      {
        id: Date.now(),
        text: post,
        platform,
        pillar: pillar.name,
        imageStyle,
        imageMode,
        imageData: imgData,
        createdAt: new Date().toLocaleString(),
      },
    ]);
    showToast('Post saved!');
  };

  const IMAGE_STYLES = [
    { id: 'stat', l: '\uD83D\uDCCA Stat Card', d: 'Bold number' },
    { id: 'quote', l: '\uD83D\uDCAC Quote Card', d: 'Perspective' },
    { id: 'multi', l: '\uD83D\uDCD1 Multi-Set', d: '3 images' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Left: Controls */}
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-lg font-bold text-white mb-4">{'\u26A1'} Generate Content</h2>

          {/* Platform */}
          <div className="flex gap-2 mb-4">
            {['LinkedIn', 'Facebook'].map((p) => (
              <button
                key={p}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${platform === p ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setPlatform(p)}
              >
                {p === 'LinkedIn' ? '\uD83D\uDCBC' : '\uD83D\uDC65'} {p}
              </button>
            ))}
          </div>

          {/* Pillar */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Content Pillar</label>
          <select className="input-field mb-3" value={pillarIdx} onChange={(e) => setPillarIdx(Number(e.target.value))}>
            {brand.pillars.map((p, i) => (
              <option key={i} value={i}>{p.name} — {p.audience}</option>
            ))}
          </select>

          {/* Audience */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience (optional)</label>
          <input className="input-field mb-3" placeholder={pillar.audience} value={audience} onChange={(e) => setAudience(e.target.value)} />

          {/* Topic */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Topic / Angle (optional)</label>
          <textarea className="input-field mb-3" placeholder="e.g., The hidden cost of reactive physician staffing..." value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} />

          {/* Image style */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Image Style</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.id}
                className={`p-3 rounded-lg text-center transition-all ${imageStyle === s.id ? 'bg-blue-600 border-blue-500 border' : 'bg-gray-800 border border-gray-600 hover:border-gray-500'}`}
                onClick={() => setImageStyle(s.id)}
              >
                <div className="text-sm font-semibold">{s.l}</div>
                <div className="text-xs text-gray-400 mt-1">{s.d}</div>
              </button>
            ))}
          </div>

          {/* Image mode */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Image Generation</label>
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium text-left transition-all ${imageMode === 'branded' ? 'purple-active' : 'bg-gray-800 border border-gray-600 text-gray-300'}`}
              onClick={() => setImageMode('branded')}
            >
              <div className="font-semibold">{'\uD83C\uDFA8'} Branded Card</div>
              <div className="text-xs opacity-70 mt-0.5">Canvas-based, instant</div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium text-left transition-all ${imageMode === 'ai' ? 'purple-active' : 'bg-gray-800 border border-gray-600 text-gray-300'}`}
              onClick={() => setImageMode('ai')}
            >
              <div className="font-semibold">{'\uD83E\uDD16'} AI Generated</div>
              <div className="text-xs opacity-70 mt-0.5">{live ? 'FLUX, Gemini, GPT Image' : 'Requires API key'}</div>
            </button>
          </div>

          {/* Generate button */}
          <button className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2" onClick={generate} disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Generating...</>
            ) : (
              <>{'\u26A1'} Generate Post + Image</>
            )}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">Error: {error}</p>}
        </div>

        {/* Data points */}
        {brand.dataPoints?.length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">{'\uD83D\uDCCB'} Available Data Points</h3>
            <div className="space-y-1">
              {brand.dataPoints.map((dp, i) => (
                <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">{'\u2192'}</span>
                  {dp}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Preview */}
      <div className="space-y-4">
        {/* Post preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{platform} Post Preview</h2>
            {post && (
              <div className="flex gap-2">
                <button className="btn-secondary text-sm" onClick={() => { navigator.clipboard.writeText(post); showToast('Post copied!'); }}>{'\uD83D\uDCCB'} Copy</button>
                <button className="btn-secondary text-sm" onClick={savePost}>{'\uD83D\uDCBE'} Save</button>
                <button className="btn-ghost text-sm" onClick={generate} disabled={loading}>{'\uD83D\uDD04'} Regen</button>
              </div>
            )}
          </div>
          {post ? (
            <div className="bg-white rounded-lg p-5 text-gray-900 text-sm leading-relaxed whitespace-pre-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: brand.colors.primary }}>
                  {(brand.name || 'B')[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{brand.name || 'Your Brand'}</div>
                  <div className="text-xs text-gray-500">{brand.tagline || ''}</div>
                </div>
              </div>
              {post}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">{'\u270D\uFE0F'}</div>
              <p>Your generated post will appear here</p>
              <p className="text-sm">{live ? 'Live AI mode active' : 'Demo mode — add API key for live AI'}</p>
            </div>
          )}
        </div>

        {/* Image preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{imageMode === 'ai' ? '\uD83E\uDD16 AI Image' : '\uD83D\uDDBC Branded Image'}</h2>
            {imgData && (
              <div className="flex gap-2">
                {imageMode === 'ai' && live && post && (
                  <button className="btn-secondary text-sm" onClick={makeAIImg} disabled={imgLoading}>
                    {imgLoading ? '...' : '\uD83D\uDD04 Regen AI'}
                  </button>
                )}
                <button className="btn-secondary text-sm" onClick={() => { makeBrandedImg(imageStyle); showToast('Branded card!'); }}>
                  {'\uD83C\uDFA8'} Branded
                </button>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.download = `${brand.name || 'post'}-${imageStyle}-${Date.now()}.png`;
                    a.href = imgData;
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
          {imgLoading ? (
            <div className="text-center py-16 text-gray-500">
              <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
              <p className="font-medium text-gray-300">Generating AI image...</p>
              <p className="text-sm">This may take 10-30 seconds</p>
            </div>
          ) : imgData ? (
            <img
              src={imgData}
              className="w-full rounded-lg shadow-lg"
              alt="Generated image"
              onError={() => { showToast('Image load error'); makeBrandedImg(imageStyle); }}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">{'\uD83D\uDDBC'}</div>
              <p>Image generates with your post</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
