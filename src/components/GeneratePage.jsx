import { useState, useRef } from 'react';
import { callOpenRouter, callImageAPI, generateImagePrompts, generateMultipleImages, buildSystemPrompt, buildUserPrompt, IMAGE_MODELS } from '../utils/openrouter';
import { generateStatCard, generateQuoteCard, generateMultiCard } from '../utils/imageGenerator';
import { MOCK_POSTS } from '../presets/mockPosts';

const IMAGE_COUNT = 5;

// ─── RENDER FORMATTED POST TEXT ───
function FormattedPost({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Bullet points: lines starting with →, -, •, *, or numbered (1. 2. etc)
    const bulletMatch = line.match(/^\s*([\u2192\u2022\-\*]|\d+[\.\)])\s+(.*)/);
    if (bulletMatch) {
      const marker = bulletMatch[1];
      const content = bulletMatch[2];
      elements.push(
        <div key={i} className="flex items-start gap-2 pl-2 py-0.5">
          <span className="text-blue-500 font-bold shrink-0 mt-0.5">{marker === '-' || marker === '*' ? '\u2192' : marker}</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      continue;
    }

    // Regular line with inline formatting
    elements.push(<p key={i} className="py-0.5">{renderInline(line)}</p>);
  }

  return <>{elements}</>;
}

// Render inline bold (**text**) and italic (*text*)
function renderInline(text) {
  if (!text) return text;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const idx = remaining.indexOf(boldMatch[0]);
      if (idx > 0) parts.push(<span key={key++}>{remaining.substring(0, idx)}</span>);
      parts.push(<strong key={key++} className="font-bold text-gray-900">{boldMatch[1]}</strong>);
      remaining = remaining.substring(idx + boldMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }
  return parts.length === 1 ? parts[0] : parts;
}

export default function GeneratePage({ brand, manualKey, selModel, selImgModel, live, showToast, savedPosts, setSavedPosts }) {
  // ─── CORE STATE ───
  const [platform, setPlatform] = useState('LinkedIn');
  const [pillarIdx, setPillarIdx] = useState(0);
  const [audience, setAudience] = useState('');
  const [topic, setTopic] = useState('');

  // ─── ADVANCED CONTENT CONTROLS ───
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tone, setTone] = useState('authoritative');
  const [ctaType, setCtaType] = useState('question');
  const [formatting, setFormatting] = useState('balanced');
  const [useEmoji, setUseEmoji] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [keyPhrases, setKeyPhrases] = useState('');
  const [avoidTopics, setAvoidTopics] = useState('');

  // ─── IMAGE STATE ───
  const [imageStyle, setImageStyle] = useState('stat');
  const [imageMode, setImageMode] = useState('ai');

  // ─── OUTPUT STATE ───
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgProgress, setImgProgress] = useState('');
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(0);
  const cvRef = useRef(null);

  const pillar = brand.pillars[pillarIdx] || brand.pillars[0];

  // ─── PARSE COMMA/NEWLINE LISTS ───
  const parseList = (str) => str.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);

  // ─── BRANDED CARD GENERATORS ───
  const makeBrandedImages = () => {
    const cv = cvRef.current;
    if (!cv) return;
    const results = [];
    const dp = brand.dataPoints || [];

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
          subtitle: `Source: Industry Data \u00B7 ${pillar.name}`,
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
      const prompts = await generateImagePrompts(manualKey, selModel, postText, brand, IMAGE_COUNT);
      const results = await generateMultipleImages(manualKey, selImgModel, prompts, (i, total) => {
        setImgProgress(`Generating image ${i + 1} of ${total}...`);
      });
      const successful = results.filter((r) => r.url);
      if (successful.length === 0) {
        showToast('AI images failed \u2014 using branded cards');
        makeBrandedImages();
      } else {
        setImages(results);
        setSelectedImg(0);
        showToast(`${successful.length} AI images generated!`);
      }
    } catch (e) {
      console.error('[LeadGen] Multi-image generation failed:', e);
      showToast('AI images failed \u2014 using branded cards');
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

    const advancedOpts = {
      tone,
      ctaType,
      useEmoji,
      formatting,
    };
    const contentOpts = {
      keywords: parseList(keywords),
      keyPhrases: parseList(keyPhrases),
      avoidTopics: parseList(avoidTopics),
    };

    try {
      let txt;
      if (live) {
        txt = await callOpenRouter(
          manualKey,
          selModel,
          buildSystemPrompt(brand, platform, advancedOpts),
          buildUserPrompt(pillar, audience, topic, brand.dataPoints, imageStyle, contentOpts)
        );
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        const pp = MOCK_POSTS[platform.toLowerCase()] || MOCK_POSTS.linkedin;
        const pl = pp[pillar.name] || pp['Educational'] || Object.values(pp)[0];
        txt = pl[Math.floor(Math.random() * pl.length)];
      }
      setPost(txt);
      setLoading(false);

      // Generate images
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
        tone,
        ctaType,
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

  const TONES = [
    { id: 'authoritative', label: 'Authoritative', desc: 'Expert, data-driven' },
    { id: 'conversational', label: 'Conversational', desc: 'Warm, relatable' },
    { id: 'provocative', label: 'Provocative', desc: 'Bold, contrarian' },
    { id: 'storytelling', label: 'Storytelling', desc: 'Narrative-driven' },
    { id: 'educational', label: 'Educational', desc: 'Clear, instructive' },
  ];

  const CTA_TYPES = [
    { id: 'question', label: 'Question', desc: 'Invite comments' },
    { id: 'dm', label: 'DM CTA', desc: 'DM me "GUIDE"' },
    { id: 'link', label: 'Link CTA', desc: 'Point to resource' },
    { id: 'engage', label: 'Engage', desc: 'Share experience' },
    { id: 'none', label: 'None', desc: 'No CTA' },
  ];

  const FORMAT_OPTS = [
    { id: 'minimal', label: 'Minimal', desc: 'Flowing prose' },
    { id: 'balanced', label: 'Balanced', desc: 'Mix of prose & lists' },
    { id: 'heavy', label: 'Structured', desc: 'Bullets & bold' },
  ];

  const IMAGE_STYLES = [
    { id: 'stat', l: '\uD83D\uDCCA Stat Card', d: 'Bold number' },
    { id: 'quote', l: '\uD83D\uDCAC Quote Card', d: 'Perspective' },
    { id: 'multi', l: '\uD83D\uDCD1 Multi-Set', d: '3 images' },
  ];

  const successfulImages = images.filter((i) => i.url);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* ═══════════ LEFT: CONTROLS ═══════════ */}
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-lg font-bold text-white mb-4">{'\u26A1'} Generate Content + Images</h2>

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
              <option key={i} value={i}>{p.name} \u2014 {p.audience}</option>
            ))}
          </select>

          {/* Audience */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience <span className="text-gray-500">(optional)</span></label>
          <input className="input-field mb-3" placeholder={pillar.audience} value={audience} onChange={(e) => setAudience(e.target.value)} />

          {/* Topic */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Topic / Angle <span className="text-gray-500">(optional)</span></label>
          <textarea className="input-field mb-3" placeholder="e.g., The hidden cost of reactive physician staffing..." value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} />

          {/* ─── ADVANCED CONTENT OPTIONS ─── */}
          <button
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg mb-3 text-sm font-medium transition-all bg-gray-800 border border-gray-600 hover:border-gray-500 text-gray-300"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>{'\u2699\uFE0F'} Advanced Content Options</span>
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>{'\u25BC'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 mb-4 p-4 rounded-lg border border-gray-700 bg-gray-800 bg-opacity-50">
              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice & Tone</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${tone === t.id ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                      onClick={() => setTone(t.id)}
                    >
                      <div className="font-semibold">{t.label}</div>
                      <div className="opacity-70 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Call-to-Action Style</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CTA_TYPES.map((c) => (
                    <button
                      key={c.id}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${ctaType === c.id ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                      onClick={() => setCtaType(c.id)}
                    >
                      <div className="font-semibold">{c.label}</div>
                      <div className="opacity-70 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formatting */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Formatting Style</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {FORMAT_OPTS.map((f) => (
                    <button
                      key={f.id}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${formatting === f.id ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                      onClick={() => setFormatting(f.id)}
                    >
                      <div className="font-semibold">{f.label}</div>
                      <div className="opacity-70 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Use Emojis</label>
                <button
                  className={`relative w-11 h-6 rounded-full transition-all ${useEmoji ? 'bg-blue-600' : 'bg-gray-700'}`}
                  onClick={() => setUseEmoji(!useEmoji)}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${useEmoji ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Keywords <span className="text-gray-500">(comma-separated)</span></label>
                <input className="input-field" placeholder="e.g., locum tenens, physician shortage, staffing ROI" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </div>

              {/* Key Phrases */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Key Phrases to Include <span className="text-gray-500">(one per line or comma-separated)</span></label>
                <textarea className="input-field" placeholder="e.g., proactive beats reactive&#10;coverage risk calendar&#10;the shortage is here" value={keyPhrases} onChange={(e) => setKeyPhrases(e.target.value)} rows={3} />
              </div>

              {/* Avoid Topics */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topics to Avoid <span className="text-gray-500">(comma-separated)</span></label>
                <input className="input-field" placeholder="e.g., politics, specific competitors" value={avoidTopics} onChange={(e) => setAvoidTopics(e.target.value)} />
              </div>
            </div>
          )}

          {/* ─── IMAGE OPTIONS ─── */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Image Style</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.id}
                className={`p-2.5 rounded-lg text-center transition-all ${imageStyle === s.id ? 'bg-blue-600 border-blue-500 border' : 'bg-gray-800 border border-gray-600 hover:border-gray-500'}`}
                onClick={() => setImageStyle(s.id)}
              >
                <div className="text-sm font-semibold">{s.l}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.d}</div>
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-300 mb-1">Image Generation ({IMAGE_COUNT} per post)</label>
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium text-left transition-all ${imageMode === 'ai' ? 'purple-active' : 'bg-gray-800 border border-gray-600 text-gray-300'}`}
              onClick={() => setImageMode('ai')}
            >
              <div className="font-semibold">{'\uD83E\uDD16'} AI Generated</div>
              <div className="text-xs opacity-70 mt-0.5">{live ? 'Content-matched AI images' : 'Requires API key'}</div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium text-left transition-all ${imageMode === 'branded' ? 'purple-active' : 'bg-gray-800 border border-gray-600 text-gray-300'}`}
              onClick={() => setImageMode('branded')}
            >
              <div className="font-semibold">{'\uD83C\uDFA8'} Branded Cards</div>
              <div className="text-xs opacity-70 mt-0.5">Canvas-based, instant</div>
            </button>
          </div>

          {/* Generate button */}
          <button className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2" onClick={generate} disabled={loading || imgLoading}>
            {loading ? (
              <><span className="spinner" /> Generating content...</>
            ) : imgLoading ? (
              <><span className="spinner" /> {imgProgress || 'Generating images...'}</>
            ) : (
              <>{'\u26A1'} Generate Post + {IMAGE_COUNT} Images</>
            )}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">Error: {error}</p>}
        </div>

        {/* Data points reference */}
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

      {/* ═══════════ RIGHT: OUTPUT ═══════════ */}
      <div className="space-y-4">
        {/* Post preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{platform} Post Preview</h2>
            {post && (
              <div className="flex gap-2">
                <button className="btn-secondary text-sm" onClick={() => { navigator.clipboard.writeText(post); showToast('Post copied!'); }}>{'\uD83D\uDCCB'} Copy</button>
                <button className="btn-secondary text-sm" onClick={savePost}>{'\uD83D\uDCBE'} Save</button>
                <button className="btn-ghost text-sm" onClick={generate} disabled={loading || imgLoading}>{'\uD83D\uDD04'}</button>
              </div>
            )}
          </div>
          {post ? (
            <div className="bg-white rounded-lg p-5 text-gray-800 text-sm leading-relaxed" style={{ maxHeight: 500, overflowY: 'auto' }}>
              {/* Brand header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: brand.colors.primary }}>
                  {(brand.name || 'B')[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{brand.name || 'Your Brand'}</div>
                  <div className="text-xs text-gray-500">{brand.tagline || ''}</div>
                </div>
              </div>
              {/* Formatted post content */}
              <FormattedPost text={post} />
              {/* Tone/CTA badges */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{tone}</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">CTA: {ctaType}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{formatting}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">{'\u270D\uFE0F'}</div>
              <p>Your generated post will appear here</p>
              <p className="text-sm mt-1">{live ? 'Live AI mode active' : 'Demo mode \u2014 add API key for live AI'}</p>
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
                <button className="btn-secondary text-sm" onClick={downloadAll}>{'\u2B07\uFE0F'} All</button>
                {imageMode === 'ai' && live && post && (
                  <button className="btn-ghost text-sm" onClick={() => makeAIImages(post)} disabled={imgLoading}>{'\uD83D\uDD04'} Regen</button>
                )}
              </div>
            )}
          </div>

          <canvas ref={cvRef} style={{ display: 'none' }} />

          {imgLoading ? (
            <div className="text-center py-14 text-gray-500">
              <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
              <p className="font-medium text-gray-300">{imgProgress || 'Generating images...'}</p>
              <p className="text-sm mt-1">Creating {IMAGE_COUNT} content-matched images</p>
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
              {/* Main image */}
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
                <button className="absolute top-2 right-2 btn-secondary text-xs" onClick={() => downloadImage(images[selectedImg].url, selectedImg)}>
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
                      <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${i + 1}`} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-red-400">{'\u2717'}</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">{i + 1}</div>
                  </button>
                ))}
              </div>

              {/* Prompt info */}
              {images[selectedImg]?.prompt && (
                <div className="mt-3 p-2 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 truncate" title={images[selectedImg].prompt}>
                    {'\uD83C\uDFA8'} {images[selectedImg].prompt}
                  </p>
                  {images[selectedImg]?.model && (
                    <p className="text-xs text-gray-500 mt-0.5">Model: {images[selectedImg].model}</p>
                  )}
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
