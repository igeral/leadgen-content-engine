import { useState, useRef } from 'react';
import { callOpenRouter, callImageAPI, generateImagePrompts, generateMultipleImages, buildSystemPrompt, buildUserPrompt } from '../utils/openrouter';
import { generateStatCard, generateQuoteCard, generateMultiCard } from '../utils/imageGenerator';
import { MOCK_POSTS } from '../presets/mockPosts';

const IMAGE_COUNT = 5;

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
  const [imgProgress, setImgProgress] = useState('');
  const [error, setError] = useState('');
  const [images, setImages] = useState([]); // array of {url, prompt, error}
  const [selectedImg, setSelectedImg] = useState(0);
  const cvRef = useRef(null);
  const pillar = brand.pillars[pillarIdx] || brand.pillars[0];

  // ─── BRANDED CARD GENERATORS ───
  const makeBrandedImages = () => {
    const cv = cvRef.current;
    if (!cv) return;
    const results = [];
    const dp = brand.dataPoints || [];

    // Generate 5 different branded cards based on style
    if (imageStyle === 'stat') {
      const usedDp = dp.length > 0 ? dp : [
        '86,000 projected physician shortage by 2036',
        '$1M+ lost annually per unfilled physician position',
        '65% of hospitals below capacity due to staffing',
        '6-12 months average permanent physician search',
        '60% rural physician shortage vs 10% urban',
      ];
      for (let i = 0; i < Math.min(IMAGE_COUNT, usedDp.length); i++) {
        const d = usedDp[i];
        const m = d.match(/^([\$\d,\.%\+]+)\s*(.*)/);
        generateStatCard(cv, {
          stat: m ? m[1] : d.split(' ')[0],
          label: m ? m[2] : d,
          category: pillar.name,
          brandName: brand.name,
          tagline: brand.tagline,
          subtitle: `Source: Industry Data · ${pillar.name}`,
          colors: brand.colors,
        });
        results.push({ url: cv.toDataURL('image/png'), prompt: `Stat card: ${d}`, error: null });
      }
    } else if (imageStyle === 'quote') {
      const quotes = [
        { quote: topic || "A strong locum tenens strategy is not a backup plan. It's a competitive advantage.", context: 'Reactive staffing model:\nHigher rates. More admin load.\n\nProactive staffing model:\nLower cost. Better integration.', closing: 'Pay less. Every time.' },
        { quote: 'The physician shortage isn\'t coming. It\'s here.', context: '86,000 fewer physicians by 2036.\nRural hospitals hit hardest.\nEvery unfilled position costs $1M+.', closing: 'Plan now or pay later.' },
        { quote: 'Proactive beats reactive. Every. Single. Time.', context: 'Coverage risk calendars.\nPre-credentialed physicians.\nPartners who know your facility.', closing: 'That\'s infrastructure.' },
        { quote: 'Your staffing problem is a timing problem.', context: 'Retirements are predictable.\nSeasonal surges are predictable.\nRecruitment timelines are predictable.', closing: 'So why are we still scrambling?' },
        { quote: 'The best time to plan for a coverage gap is before it exists.', context: '5-step proactive framework.\nSpecialty risk matrix.\nCredentialing timeline templates.', closing: 'Start today.' },
      ];
      for (let i = 0; i < IMAGE_COUNT; i++) {
        const q = quotes[i % quotes.length];
        generateQuoteCard(cv, { quote: q.quote, context: q.context, closingLine: q.closing, brandName: brand.name, role: brand.tagline, tagline: brand.tagline, colors: brand.colors });
        results.push({ url: cv.toDataURL('image/png'), prompt: `Quote card: ${q.quote}`, error: null });
      }
    } else {
      const cards = [
        { num: '1', topic: 'THE COST OF DOING NOTHING', title: '$1M+', sub: 'Lost annually per unfilled physician position.', subSub: "That's lost billings, diverted patients, overtime premiums." },
        { num: '2', topic: 'THE SHORTAGE IS HERE', title: '86,000', sub: 'Projected physician shortage by 2036.', subSub: 'Rural hospitals face 60% shortfall vs 10% urban.' },
        { num: '3', topic: 'THE PROACTIVE FIX', title: '5 Steps', sub: 'Build your coverage infrastructure now.', subSub: 'Risk calendars. Pre-credentialing. Locum integration.' },
        { num: '1', topic: 'REACTIVE VS PROACTIVE', title: 'Higher Rates', sub: 'Reactive staffing always costs more.', subSub: 'Urgency = premium pricing. Planning = controlled costs.' },
        { num: '2', topic: 'THE MATCH ISN\'T ENOUGH', title: '41,482', sub: 'Positions filled in 2026 Match.', subSub: 'Still not enough to fix the 86,000 deficit.' },
      ];
      for (let i = 0; i < IMAGE_COUNT; i++) {
        const c = cards[i % cards.length];
        generateMultiCard(cv, { cardNumber: c.num, totalCards: '3', topicLabel: c.topic, title: c.title, subtitle: c.sub, subSubtitle: c.subSub, tagLabel: pillar.name, brandName: brand.name, colors: brand.colors });
        results.push({ url: cv.toDataURL('image/png'), prompt: `Multi card ${c.num}: ${c.topic}`, error: null });
      }
    }
    setImages(results);
    setSelectedImg(0);
  };

  // ─── AI IMAGE GENERATION (content-matched) ───
  const makeAIImages = async (postText) => {
    setImgLoading(true);
    setImgProgress('Analyzing content for image prompts...');
    setImages([]);
    try {
      // Step 1: Use text AI to generate content-matched image prompts
      const prompts = await generateImagePrompts(manualKey, selModel, postText, brand, IMAGE_COUNT);

      // Step 2: Generate images from those prompts
      const results = await generateMultipleImages(manualKey, selImgModel, prompts, (i, total) => {
        setImgProgress(`Generating image ${i + 1} of ${total}...`);
      });

      const successful = results.filter((r) => r.url);
      if (successful.length === 0) {
        showToast('AI images failed — using branded cards');
        makeBrandedImages();
      } else {
        setImages(results);
        setSelectedImg(0);
        showToast(`${successful.length} AI images generated!`);
      }
    } catch (e) {
      console.error('[LeadGen] Multi-image generation failed:', e);
      showToast('AI images failed — using branded cards');
      makeBrandedImages();
    }
    setImgLoading(false);
    setImgProgress('');
  };

  // ─── MAIN GENERATE ───
  const generate = async () => {
    setLoading(true);
    setError('');
    setPost('');
    setImages([]);
    setSelectedImg(0);
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

      if (imageMode === 'ai' && live) {
        await makeAIImages(txt);
      } else {
        makeBrandedImages();
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const savePost = () => {
    if (!post) return;
    const currentImg = images[selectedImg]?.url || null;
    setSavedPosts((p) => [
      ...p,
      {
        id: Date.now(),
        text: post,
        platform,
        pillar: pillar.name,
        imageStyle,
        imageMode,
        imageData: currentImg,
        allImages: images.filter((i) => i.url).map((i) => i.url),
        createdAt: new Date().toLocaleString(),
      },
    ]);
    showToast('Post saved!');
  };

  const downloadImage = (url, idx) => {
    const a = document.createElement('a');
    a.download = `${brand.name || 'post'}-${imageStyle}-${idx + 1}-${Date.now()}.png`;
    a.href = url;
    a.click();
    showToast('Downloaded!');
  };

  const downloadAll = () => {
    images.filter((i) => i.url).forEach((img, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.download = `${brand.name || 'post'}-${imageStyle}-${idx + 1}-${Date.now()}.png`;
        a.href = img.url;
        a.click();
      }, idx * 300);
    });
    showToast(`Downloading ${images.filter((i) => i.url).length} images...`);
  };

  const IMAGE_STYLES = [
    { id: 'stat', l: '\uD83D\uDCCA Stat Card', d: 'Bold number' },
    { id: 'quote', l: '\uD83D\uDCAC Quote Card', d: 'Perspective' },
    { id: 'multi', l: '\uD83D\uDCD1 Multi-Set', d: '3 images' },
  ];

  const successfulImages = images.filter((i) => i.url);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Left: Controls */}
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-lg font-bold text-white mb-4">{'\u26A1'} Generate Content</h2>

          {/* Platform */}
          <div className="flex gap-2 mb-4">
            {['LinkedIn', 'Facebook'].map((p) => (
              <button key={p} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${platform === p ? 'tab-active' : 'tab-inactive'}`} onClick={() => setPlatform(p)}>
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Image Generation ({IMAGE_COUNT} images per post)</label>
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium text-left transition-all ${imageMode === 'branded' ? 'purple-active' : 'bg-gray-800 border border-gray-600 text-gray-300'}`}
              onClick={() => setImageMode('branded')}
            >
              <div className="font-semibold">{'\uD83C\uDFA8'} Branded Cards</div>
              <div className="text-xs opacity-70 mt-0.5">Canvas-based, instant</div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium text-left transition-all ${imageMode === 'ai' ? 'purple-active' : 'bg-gray-800 border border-gray-600 text-gray-300'}`}
              onClick={() => setImageMode('ai')}
            >
              <div className="font-semibold">{'\uD83E\uDD16'} AI Generated</div>
              <div className="text-xs opacity-70 mt-0.5">{live ? 'Content-matched AI images' : 'Requires API key'}</div>
            </button>
          </div>

          {/* Generate button */}
          <button className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2" onClick={generate} disabled={loading || imgLoading}>
            {loading ? (
              <><span className="spinner" /> Generating post...</>
            ) : imgLoading ? (
              <><span className="spinner" /> {imgProgress || 'Generating images...'}</>
            ) : (
              <>{'\u26A1'} Generate Post + {IMAGE_COUNT} Images</>
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
                  <span className="text-blue-400 mt-0.5">{'\u2192'}</span>{dp}
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
                <button className="btn-ghost text-sm" onClick={generate} disabled={loading || imgLoading}>{'\uD83D\uDD04'} Regen</button>
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

        {/* Image gallery */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {imageMode === 'ai' ? '\uD83E\uDD16' : '\uD83D\uDDBC'} Images
              {successfulImages.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">({successfulImages.length}/{IMAGE_COUNT})</span>}
            </h2>
            {successfulImages.length > 0 && (
              <div className="flex gap-2">
                <button className="btn-secondary text-sm" onClick={downloadAll}>{'\u2B07\uFE0F'} Download All</button>
                {imageMode === 'ai' && live && post && (
                  <button className="btn-ghost text-sm" onClick={() => makeAIImages(post)} disabled={imgLoading}>{'\uD83D\uDD04'} Regen All</button>
                )}
              </div>
            )}
          </div>

          <canvas ref={cvRef} style={{ display: 'none' }} />

          {imgLoading ? (
            <div className="text-center py-16 text-gray-500">
              <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
              <p className="font-medium text-gray-300">{imgProgress || 'Generating images...'}</p>
              <p className="text-sm mt-1">AI is creating {IMAGE_COUNT} content-matched images</p>
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: IMAGE_COUNT }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all ${
                    imgProgress.includes(`${i + 1}`) ? 'bg-blue-500 animate-pulse' :
                    imgProgress.includes(`${i + 2}`) || imgProgress.includes('Analyzing') ? 'bg-gray-600' : 'bg-green-500'
                  }`} />
                ))}
              </div>
            </div>
          ) : successfulImages.length > 0 ? (
            <div>
              {/* Main selected image */}
              <div className="relative mb-3">
                <img
                  src={images[selectedImg]?.url}
                  className="w-full rounded-lg shadow-lg"
                  alt={`Generated image ${selectedImg + 1}`}
                  onError={() => {
                    showToast('Image load error');
                    const updated = [...images];
                    updated[selectedImg] = { ...updated[selectedImg], url: null, error: 'Load failed' };
                    setImages(updated);
                  }}
                />
                <div className="absolute top-2 left-2 badge bg-black bg-opacity-60 text-white text-xs px-2 py-1">
                  {selectedImg + 1} / {successfulImages.length}
                </div>
                <button
                  className="absolute top-2 right-2 btn-secondary text-xs"
                  onClick={() => downloadImage(images[selectedImg].url, selectedImg)}
                >
                  {'\u2B07\uFE0F'}
                </button>
              </div>

              {/* Thumbnail strip */}
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-video ${
                      selectedImg === i ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-600 hover:border-gray-400'
                    } ${!img.url ? 'opacity-40' : ''}`}
                    onClick={() => img.url && setSelectedImg(i)}
                    disabled={!img.url}
                  >
                    {img.url ? (
                      <img src={img.url} className="w-full h-full object-cover" alt={`Thumbnail ${i + 1}`} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-red-400">
                        {'\u2717'}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">
                      {i + 1}
                    </div>
                  </button>
                ))}
              </div>

              {/* Prompt info for selected image */}
              {images[selectedImg]?.prompt && (
                <div className="mt-3 p-2 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 truncate" title={images[selectedImg].prompt}>
                    {'\uD83C\uDFA8'} {images[selectedImg].prompt}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">{'\uD83D\uDDBC'}</div>
              <p>{IMAGE_COUNT} images will be generated with your post</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
