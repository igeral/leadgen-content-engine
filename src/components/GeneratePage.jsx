import { useState, useRef } from 'react';
import { callOpenRouter, fetchTrendingTopics, buildSystemPrompt, buildUserPrompt } from '../utils/openrouter';
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
    if (line.trim() === '') { elements.push(<div key={i} className="h-2" />); continue; }
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
    elements.push(<p key={i} className="py-0.5">{renderInline(line)}</p>);
  }
  return <>{elements}</>;
}

function renderInline(text) {
  if (!text) return text;
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
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

// ─── ENGAGEMENT BADGE ───
function EngagementBadge({ level }) {
  const colors = { viral: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${colors[level] || 'bg-gray-500'}`}>
      {level === 'viral' ? '\uD83D\uDD25 Viral' : level === 'high' ? '\u26A1 High' : '\uD83D\uDCC8 Medium'}
    </span>
  );
}

// ═══════════ POST → CARD CONTENT EXTRACTION ═══════════
// Parse the actual generated post into facets (topic, hook, bullets, numbers,
// closing) so the branded cards reflect THIS post — not a hardcoded set.
const HASHTAG_RX = /#\w+/g;
const NUM_RX = /(\$?\d[\d,]*(?:\.\d+)?[KMB]?%?\+?)/g;
const BULLET_RX = /^\s*([\u2192\u2022\u25BA\u25CF\-\*])\s+(.*)/;
const NUMBERED_RX = /^\s*(\d+[\.\)])\s+(.*)/;

// Strip markdown markers that LLMs leak into post text so they don't end up
// rendered literally on the canvas (e.g. **bold**, *italic*, __underline__,
// `code`, and "Label:" leading boldified labels).
function stripMarkdown(s) {
  if (!s) return '';
  let out = String(s);
  // Triple backticks / fenced code
  out = out.replace(/```[\s\S]*?```/g, ' ');
  // Inline code
  out = out.replace(/`([^`]+)`/g, '$1');
  // Bold/italic asterisks and underscores (greedy strip)
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/\*([^*]+)\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');
  out = out.replace(/_([^_]+)_/g, '$1');
  // Stray asterisks/underscores
  out = out.replace(/[*_]+/g, '');
  // Markdown links [text](url) \u2192 text
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // Headings/quote markers at line start
  out = out.replace(/^[#>]+\s*/gm, '');
  // Collapse whitespace
  out = out.replace(/[ \t]+/g, ' ').trim();
  return out;
}

function shortenWords(s, max) {
  if (!s) return '';
  const cleaned = stripMarkdown(String(s)).trim();
  const w = cleaned.split(/\s+/);
  if (w.length <= max) return w.join(' ');
  return w.slice(0, max).join(' ') + '\u2026';
}

function parseStatLine(line) {
  const s = String(line || '').trim();
  const m = s.match(/^([\$\d,\.%\+]+[KMB]?%?)\s*(.*)/);
  if (m && m[1]) return { stat: m[1], label: (m[2] || '').trim() || s };
  return { stat: shortenWords(s, 1) || 'Insight', label: shortenWords(s, 14) };
}

function extractPostFacets(postText, trending, topicHint) {
  const fallbackTopic = (trending && trending.topic) || topicHint || 'Insight';
  if (!postText) {
    return {
      topic: fallbackTopic,
      topicLabel: String(fallbackTopic).toUpperCase(),
      hook: '',
      paragraphs: [],
      bullets: [],
      sentences: [],
      numericFacts: [],
      closing: '',
    };
  }
  // Strip markdown FIRST so headlines/bullets don't render literal ** or _
  const raw = stripMarkdown(String(postText)).trim();
  const linesAll = raw.split('\n').map((l) => l.replace(HASHTAG_RX, '').trim());
  const lines = linesAll.filter((l) => l.length > 0);

  const bullets = [];
  const paragraphs = [];
  for (const l of lines) {
    const bm = l.match(BULLET_RX);
    const nm = l.match(NUMBERED_RX);
    if (bm) bullets.push(bm[2].trim());
    else if (nm) bullets.push(nm[2].trim());
    else paragraphs.push(l);
  }

  const hook = paragraphs[0] || bullets[0] || lines[0] || '';
  const closing = paragraphs[paragraphs.length - 1] || bullets[bullets.length - 1] || hook;

  const sentences = [];
  for (const p of paragraphs) {
    const parts = p.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 4);
    for (const s of parts) sentences.push(s);
  }

  const numericFacts = [];
  const seen = new Set();
  for (const l of lines) {
    const nums = l.match(NUM_RX) || [];
    for (const n of nums) {
      if (n.length < 2 && !/[KMB%$]/.test(n)) continue;
      if (seen.has(n)) continue;
      seen.add(n);
      const label = l.replace(n, '').replace(/\s+/g, ' ').trim();
      numericFacts.push({ stat: n, label: shortenWords(label, 14) || hook || fallbackTopic });
      if (numericFacts.length >= 8) break;
    }
    if (numericFacts.length >= 8) break;
  }

  let topic = fallbackTopic;
  if (!trending && !topicHint) topic = shortenWords(hook, 6) || fallbackTopic;
  const topicLabel = String(topic).toUpperCase();

  return { topic, topicLabel, hook, paragraphs, bullets, sentences, numericFacts, closing };
}

function buildQuoteSlides(facets) {
  const { hook, bullets, sentences, closing, topicLabel } = facets;
  // Pool of distinct, punchy candidates (≤22 words each)
  const pool = [hook, ...sentences, ...bullets, closing]
    .map((s) => String(s || '').trim())
    .filter((s) => s.length >= 8 && s.split(/\s+/).length <= 22)
    .filter((s, i, a) => a.indexOf(s) === i);

  // Build 5 picks with no consecutive duplicates. If pool < 5, cycle through it.
  const picks = [];
  for (let i = 0; i < 5; i++) {
    if (pool.length > 0) picks.push(pool[i % pool.length]);
    else picks.push(hook || topicLabel || 'Insight');
  }

  // Each slide gets a DIFFERENT supporting line so cards don't repeat.
  const support = [...bullets, ...sentences]
    .map((s) => String(s || '').trim())
    .filter((s) => s.length >= 8 && s.split(/\s+/).length <= 22)
    .filter((s, i, a) => a.indexOf(s) === i);

  return picks.map((q, i) => {
    // Find a supporting line that isn't the same as the quote
    let supporting = '';
    for (let k = 0; k < support.length; k++) {
      const cand = support[(i + k) % support.length];
      if (cand && cand !== q) { supporting = cand; break; }
    }
    return {
      quote: shortenWords(q, 12),
      context: shortenWords(supporting, 16),
      closing: shortenWords(closing || hook || '', 8),
    };
  });
}

function buildMultiSlides(facets, count) {
  const { topicLabel, hook, paragraphs, bullets, sentences, numericFacts, closing } = facets;
  // Pool of unique short content lines we can pull from across slides.
  // Bullets first (they're already punchy), then sentences, then paragraphs.
  const pool = [...bullets, ...sentences, ...paragraphs]
    .map((s) => stripPlainText(s))
    .filter((s) => s && s.length >= 8)
    .filter((s, i, a) => a.indexOf(s) === i);
  const pickFrom = (i) => pool.length ? pool[i % pool.length] : (hook || closing || 'Insight');

  // Slide 1 \u2014 Hook / topic header
  const s1 = {
    topic: topicLabel || 'INSIGHT',
    title: shortenWords(hook || pickFrom(0), 8),
    sub: shortenWords(pickFrom(1), 14),
    subSub: '',
  };

  // Slide 2 \u2014 A stat (if any) OR a different framing
  let s2;
  if (numericFacts.length > 0) {
    const nf = numericFacts[0];
    s2 = {
      topic: 'BY THE NUMBERS',
      title: nf.stat,
      sub: shortenWords(nf.label, 14),
      subSub: numericFacts[1] ? shortenWords(numericFacts[1].stat + ' \u2014 ' + numericFacts[1].label, 12) : '',
    };
  } else {
    s2 = {
      topic: 'WHY IT MATTERS',
      title: shortenWords(pickFrom(2), 8),
      sub: shortenWords(pickFrom(3), 14),
      subSub: '',
    };
  }

  // Slide 3 & 4 \u2014 bullets if available, otherwise different content cuts
  let s3, s4;
  if (bullets.length >= 2) {
    const half = Math.ceil(bullets.length / 2);
    s3 = { topic: 'KEY POINTS', title: 'What matters:', points: bullets.slice(0, half).map((b) => shortenWords(b, 12)) };
    s4 = { topic: 'AND THEN', title: 'And then:', points: bullets.slice(half).map((b) => shortenWords(b, 12)) };
  } else if (bullets.length === 1) {
    s3 = { topic: 'KEY POINT', title: shortenWords(bullets[0], 10), sub: shortenWords(pickFrom(4), 14), subSub: '' };
    s4 = { topic: 'CONTEXT', title: shortenWords(pickFrom(5), 10), sub: shortenWords(pickFrom(6), 14), subSub: '' };
  } else {
    s3 = { topic: 'CONTEXT', title: shortenWords(pickFrom(2), 10), sub: shortenWords(pickFrom(3), 14), subSub: '' };
    s4 = { topic: 'INSIGHT', title: shortenWords(pickFrom(4), 10), sub: shortenWords(pickFrom(5), 14), subSub: '' };
  }

  // Slide 5 \u2014 Closing CTA
  const s5 = {
    topic: 'THE TAKEAWAY',
    title: shortenWords(closing || hook || pickFrom(7), 10),
    sub: '',
    subSub: '',
  };

  const slides = [s1, s2, s3, s4, s5];

  // Final pass: if any slide ended up identical to a previous one, vary it.
  const seenTitles = new Set();
  for (let i = 0; i < slides.length; i++) {
    const sl = slides[i];
    const key = (sl.title || '') + '|' + (sl.points || []).join('|');
    if (seenTitles.has(key)) {
      // Replace title with a different pool entry
      sl.title = shortenWords(pickFrom(7 + i), 10);
    }
    seenTitles.add(key);
  }

  while (slides.length < count) slides.push(slides[slides.length - 1]);
  return slides.slice(0, count);
}

// Helper used only inside buildMultiSlides \u2014 strip leading bullet markers if any.
function stripPlainText(s) {
  if (!s) return '';
  return String(s).replace(/^[\s\u2192\u2022\u25ba\u25cf\-\*]+\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
}

export default function GeneratePage({ brand, manualKey, selModel, selImgModel, live, showToast, savedPosts, setSavedPosts }) {
  // ─── CORE STATE ───
  const [platform, setPlatform] = useState('LinkedIn');
  const [pillarIdx, setPillarIdx] = useState(0);
  const [audience, setAudience] = useState('');
  const [topic, setTopic] = useState('');

  // ─── TRENDING TOPICS ───
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [selectedTrending, setSelectedTrending] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [autoTrending, setAutoTrending] = useState(true);

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

  // ─── OUTPUT STATE ───
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgProgress, setImgProgress] = useState('');
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(0);
  const [genPhase, setGenPhase] = useState('');
  const cvRef = useRef(null);

  const pillar = brand.pillars[pillarIdx] || brand.pillars[0];
  const parseList = (str) => str.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);

  // ─── FETCH TRENDING TOPICS ───
  const loadTrending = async () => {
    if (!live) { showToast('API key required for trending topics'); return; }
    setTrendingLoading(true);
    setTrendingTopics([]);
    setSelectedTrending(null);
    try {
      const topics = await fetchTrendingTopics(manualKey, selModel, brand, pillar, platform, 5);
      setTrendingTopics(topics);
      showToast(`${topics.length} trending topics found!`);
    } catch (e) {
      console.error('[LeadGen] Trending topics failed:', e);
      showToast('Could not fetch trending topics: ' + e.message);
    }
    setTrendingLoading(false);
  };

  // ─── BRANDED CARD GENERATORS ───
  // Always alternate variants so a 5-card set is roughly half dark, half cream.
  // Card content is derived from the actual generated post text so each card
  // reflects what the post says, not a hardcoded placeholder set.
  const makeBrandedImages = (postText, ctx) => {
    const cv = cvRef.current;
    if (!cv) return [];
    const results = [];
    const variantFor = (i) => (i % 2 === 0 ? 'dark' : 'light');
    const facets = extractPostFacets(postText, ctx && ctx.trending, ctx && ctx.topicHint);
    const dp = brand.dataPoints || [];

    if (imageStyle === 'stat') {
      // Prefer numeric facts pulled from the post; fall back to brand data points.
      let statSlides = facets.numericFacts.length
        ? facets.numericFacts
        : (dp.length
            ? dp.map((d) => parseStatLine(d))
            : [{ stat: 'Insight', label: facets.hook || (pillar.name + ' insights') }]);
      const slides = [];
      for (let i = 0; i < IMAGE_COUNT; i++) slides.push(statSlides[i % statSlides.length]);
      for (let i = 0; i < IMAGE_COUNT; i++) {
        const sl = slides[i];
        generateStatCard(cv, {
          stat: sl.stat,
          label: sl.label,
          subtitle: facets.topicLabel ? facets.topicLabel.toLowerCase() : (pillar.name + ' · ' + (brand.tagline || '')).trim(),
          brandName: brand.name,
          orientation: 'portrait',
          variant: variantFor(i),
        });
        results.push({ url: cv.toDataURL('image/png'), prompt: 'Stat card: ' + (sl.stat + ' ' + sl.label).slice(0, 60), error: null });
      }
    } else if (imageStyle === 'quote') {
      // Quote cards: each pulls a different short impactful line from the post.
      const quotes = buildQuoteSlides(facets);
      for (let i = 0; i < IMAGE_COUNT; i++) {
        const q = quotes[i % quotes.length];
        generateQuoteCard(cv, {
          quote: q.quote,
          context: q.context,
          closingLine: q.closing,
          brandName: brand.name,
          orientation: 'portrait',
          variant: variantFor(i),
        });
        results.push({ url: cv.toDataURL('image/png'), prompt: 'Quote card: ' + q.quote.slice(0, 60), error: null });
      }
    } else {
      // Multi-image carousel: 5 slides built from the post's actual content.
      const slides = buildMultiSlides(facets, IMAGE_COUNT);
      for (let i = 0; i < IMAGE_COUNT; i++) {
        const c = slides[i];
        generateMultiCard(cv, {
          cardNumber: String(i + 1),
          totalCards: String(IMAGE_COUNT),
          topicLabel: c.topic,
          title: c.title,
          subtitle: c.sub,
          subSubtitle: c.subSub,
          points: c.points,
          closingLine: c.closing,
          brandName: brand.name,
          orientation: 'portrait',
          variant: variantFor(i),
        });
        results.push({ url: cv.toDataURL('image/png'), prompt: 'Multi card ' + (i + 1) + ': ' + c.topic, error: null });
      }
    }
    setImages(results);
    setSelectedImg(0);
    return results;
  };

  // ─── AUTO-SAVE TO ARCHIVE (weekday-balanced) ───
  // Picks the weekday with the fewest existing posts; ties resolve to the
  // earliest weekday (Monday wins if all are empty). This produces a natural
  // Mon\u2192Fri spread: 1st post lands on Monday, 2nd on Tuesday, etc., looping
  // back to the lightest day after Friday.
  const autoSaveToArchive = (txt, imgs, ctx) => {
    if (!txt) return;
    const successImgs = (imgs || []).filter((i) => i && i.url);
    const now = new Date();
    const WD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    setSavedPosts((current) => {
      const counts = WD.map((d) => current.filter((p) => p.weekday === d).length);
      const minCount = Math.min(...counts);
      const weekday = WD[counts.indexOf(minCount)];
      const entry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        text: txt,
        platform: ctx.platform,
        pillar: ctx.pillar.name,
        audience: ctx.pillar.audience,
        tone: ctx.tone,
        ctaType: ctx.ctaType,
        trendingTopic: ctx.trendingTopic || null,
        imageStyle: ctx.imageStyle,
        imageMode: 'branded',
        imageData: successImgs[0]?.url || null,
        allImages: successImgs.map((i) => i.url),
        createdAt: now.toLocaleString(),
        weekday,
        autoSaved: true,
      };
      return [...current, entry];
    });
    showToast('Auto-saved to Archive');
  };

  // ─── CORE SINGLE-POST GENERATION (shared by single + batch modes) ───
  // forcedTrending: when provided, uses this trending topic instead of selectedTrending
  //                 and skips the auto-trending fetch step.
  const runSingleGeneration = async ({ forcedTrending = null } = {}) => {
    setPost('');
    setImages([]);
    setSelectedImg(0);

    const advancedOpts = { tone, ctaType, useEmoji, formatting };
    const contentOpts = {
      keywords: parseList(keywords),
      keyPhrases: parseList(keyPhrases),
      avoidTopics: parseList(avoidTopics),
      trendingTopic: null,
    };

    let txt;
    let activeTrending = forcedTrending || selectedTrending;

    if (live) {
      if (!forcedTrending && autoTrending && !selectedTrending && !topic) {
        setGenPhase('Discovering trending topics...');
        try {
          const topics = await fetchTrendingTopics(manualKey, selModel, brand, pillar, platform, 5);
          setTrendingTopics(topics);
          activeTrending = topics.find((t) => t.engagementPotential === 'viral') || topics.find((t) => t.engagementPotential === 'high') || topics[0];
          setSelectedTrending(activeTrending);
        } catch (e) {
          console.warn('[LeadGen] Auto-trending failed, generating without:', e.message);
        }
      }
      contentOpts.trendingTopic = activeTrending;
      setGenPhase(activeTrending ? `Writing about: ${activeTrending.topic.substring(0, 50)}...` : 'Generating fresh content...');
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
    setGenPhase('');

    const imgResults = makeBrandedImages(txt, { trending: activeTrending, topicHint: topic }) || [];

    autoSaveToArchive(txt, imgResults, {
      platform,
      pillar,
      tone,
      ctaType,
      trendingTopic: activeTrending?.topic || null,
      imageStyle,
    });

    return { txt, imgResults };
  };

  // ─── MAIN GENERATE (single post) ───
  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      await runSingleGeneration();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
    setGenPhase('');
  };

  // ─── BATCH GENERATE (one post per trending topic) ───
  const generateAllTrending = async () => {
    if (!trendingTopics || trendingTopics.length === 0) {
      showToast('No trending topics \u2014 click "Find Now" first');
      return;
    }
    if (!live) {
      showToast('Live API mode required for batch generation');
      return;
    }
    setLoading(true);
    setError('');
    let count = 0;
    const total = trendingTopics.length;
    for (let i = 0; i < total; i++) {
      setGenPhase(`Batch ${i + 1}/${total}: ${trendingTopics[i].topic.substring(0, 40)}\u2026`);
      try {
        await runSingleGeneration({ forcedTrending: trendingTopics[i] });
        count++;
      } catch (e) {
        console.error('[LeadGen] Batch item failed:', trendingTopics[i].topic, e);
      }
    }
    setLoading(false);
    setGenPhase('');
    showToast(`Batch complete: ${count}/${total} posts auto-saved to Archive`);
  };

  const savePost = () => {
    if (!post) return;
    const currentImg = images[selectedImg]?.url || null;
    const now = new Date();
    const weekdayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const WD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekday = WD.includes(weekdayName) ? weekdayName : 'Monday';
    setSavedPosts((p) => [
      ...p,
      {
        id: Date.now(),
        text: post,
        platform,
        pillar: pillar.name,
        audience: pillar.audience,
        tone,
        ctaType,
        trendingTopic: selectedTrending?.topic || null,
        imageStyle,
        imageMode: 'branded',
        imageData: currentImg,
        allImages: images.filter((i) => i.url).map((i) => i.url),
        createdAt: now.toLocaleString(),
        weekday,
      },
    ]);
    showToast('Post saved to Archive!');
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
              <option key={i} value={i}>{`${p.name} — ${p.audience}`}</option>
            ))}
          </select>

          {/* Audience */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience <span className="text-gray-500">(optional)</span></label>
          <input className="input-field mb-3" placeholder={pillar.audience} value={audience} onChange={(e) => setAudience(e.target.value)} />

          {/* ─── TRENDING TOPICS SECTION ─── */}
          <div className="mb-4 p-4 rounded-lg border border-indigo-800 bg-indigo-900 bg-opacity-20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-indigo-300">{'\uD83D\uDD25'} Trending Topics</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <span>Auto-discover</span>
                  <button
                    className={`relative w-9 h-5 rounded-full transition-all ${autoTrending ? 'bg-indigo-600' : 'bg-gray-700'}`}
                    onClick={() => setAutoTrending(!autoTrending)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoTrending ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </label>
                <button
                  className="btn-ghost text-xs py-1 px-2"
                  onClick={loadTrending}
                  disabled={trendingLoading || !live}
                >
                  {trendingLoading ? 'Searching...' : '\uD83D\uDD0D Find Now'}
                </button>
              </div>
            </div>

            {!live && <p className="text-xs text-gray-500">Add API key to enable trending topic discovery</p>}

            {autoTrending && live && trendingTopics.length === 0 && !trendingLoading && (
              <p className="text-xs text-indigo-400">Trending topics will be auto-discovered when you generate</p>
            )}

            {trendingLoading && (
              <div className="flex items-center gap-2 py-2">
                <span className="spinner" style={{ width: 16, height: 16 }} />
                <span className="text-xs text-indigo-300">Searching for trending topics in your niche...</span>
              </div>
            )}

            {trendingTopics.length > 0 && (
              <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                {trendingTopics.map((t, i) => (
                  <button
                    key={i}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedTrending === t
                        ? 'bg-indigo-700 border border-indigo-500'
                        : 'bg-gray-800 bg-opacity-60 border border-gray-700 hover:border-indigo-500'
                    }`}
                    onClick={() => setSelectedTrending(selectedTrending === t ? null : t)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white leading-tight">{t.topic}</div>
                        <div className="text-xs text-gray-400 mt-1">{t.angle}</div>
                      </div>
                      <EngagementBadge level={t.engagementPotential} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1.5">{t.whyTrending}</div>
                    {selectedTrending === t && t.suggestedHook && (
                      <div className="text-xs text-indigo-300 mt-2 pt-2 border-t border-indigo-700">
                        {'\uD83C\uDFA3'} Hook: "{t.suggestedHook}"
                      </div>
                    )}
                  </button>
                ))}
                <button
                  className="w-full py-2 px-3 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={generateAllTrending}
                  disabled={loading || imgLoading || !live}
                  title="Generate one full post + 5 images for every trending topic, auto-saved across the week"
                >
                  {'\u26A1\u26A1'} Generate all {trendingTopics.length} as posts (auto-spread Mon\u2192Fri)
                </button>
                <button
                  className="text-xs text-indigo-400 hover:text-indigo-300 w-full text-center py-1"
                  onClick={() => { setSelectedTrending(null); setTrendingTopics([]); }}
                >
                  Clear trending topics (use manual topic instead)
                </button>
              </div>
            )}
          </div>

          {/* Topic (manual - shown when no trending selected) */}
          {!selectedTrending && (
            <>
              <label className="block text-sm font-medium text-gray-300 mb-1">Topic / Angle <span className="text-gray-500">{'(optional — or use trending above)'}</span></label>
              <textarea className="input-field mb-3" placeholder="e.g., The hidden cost of reactive physician staffing..." value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} />
            </>
          )}

          {/* Advanced toggle */}
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
                    <button key={t.id} className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${tone === t.id ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`} onClick={() => setTone(t.id)}>
                      <div className="font-semibold">{t.label}</div>
                      <div className="opacity-70 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* CTA */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Call-to-Action Style</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CTA_TYPES.map((c) => (
                    <button key={c.id} className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${ctaType === c.id ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`} onClick={() => setCtaType(c.id)}>
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
                    <button key={f.id} className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${formatting === f.id ? 'bg-blue-600 text-white border border-blue-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`} onClick={() => setFormatting(f.id)}>
                      <div className="font-semibold">{f.label}</div>
                      <div className="opacity-70 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Emoji */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Use Emojis</label>
                <button className={`relative w-11 h-6 rounded-full transition-all ${useEmoji ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => setUseEmoji(!useEmoji)}>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Key Phrases to Include</label>
                <textarea className="input-field" placeholder="e.g., proactive beats reactive&#10;coverage risk calendar" value={keyPhrases} onChange={(e) => setKeyPhrases(e.target.value)} rows={3} />
              </div>
              {/* Avoid */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topics to Avoid</label>
                <input className="input-field" placeholder="e.g., politics, specific competitors" value={avoidTopics} onChange={(e) => setAvoidTopics(e.target.value)} />
              </div>
            </div>
          )}

          {/* Image options */}
          <label className="block text-sm font-medium text-gray-300 mb-1">Image Style</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {IMAGE_STYLES.map((s) => (
              <button key={s.id} className={`p-2.5 rounded-lg text-center transition-all ${imageStyle === s.id ? 'bg-blue-600 border-blue-500 border' : 'bg-gray-800 border border-gray-600 hover:border-gray-500'}`} onClick={() => setImageStyle(s.id)}>
                <div className="text-sm font-semibold">{s.l}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.d}</div>
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-300 mb-1">Image Generation ({IMAGE_COUNT} branded cards per post)</label>
          <div className="mb-4 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 text-sm">
            <span className="font-semibold">{'\uD83C\uDFA8'} Branded Cards</span>
            <span className="text-xs opacity-70 ml-2">Canvas-based, instant, on-brand</span>
          </div>

          {/* Generate button */}
          <button className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2" onClick={generate} disabled={loading || imgLoading}>
            {loading ? (
              <><span className="spinner" /> {genPhase || 'Generating...'}</>
            ) : imgLoading ? (
              <><span className="spinner" /> {imgProgress || 'Generating images...'}</>
            ) : (
              <>{'\u26A1'} {autoTrending && live ? 'Find Trend + Generate' : `Generate Post + ${IMAGE_COUNT} Images`}</>
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

          {/* Trending topic badge */}
          {post && selectedTrending && (
            <div className="mb-3 p-2.5 rounded-lg bg-indigo-900 bg-opacity-30 border border-indigo-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-indigo-400 font-semibold">{'\uD83D\uDD25'} Based on trending:</span>
                <span className="text-indigo-300">{selectedTrending.topic}</span>
              </div>
            </div>
          )}

          {post ? (
            <div className="bg-white rounded-lg p-5 text-gray-800 text-sm leading-relaxed" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: brand.colors.primary }}>
                  {(brand.name || 'B')[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{brand.name || 'Your Brand'}</div>
                  <div className="text-xs text-gray-500">{brand.tagline || ''}</div>
                </div>
              </div>
              <FormattedPost text={post} />
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{tone}</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">CTA: {ctaType}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{formatting}</span>
                {selectedTrending && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{'\uD83D\uDD25'} Trending</span>}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">{'\u270D\uFE0F'}</div>
              <p>Your generated post will appear here</p>
              <p className="text-sm mt-1">{live ? (autoTrending ? 'AI will find trending topics + generate content' : 'Live AI mode active') : 'Demo mode \u2014 add API key for live AI'}</p>
            </div>
          )}
        </div>

        {/* Image gallery */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {'\uD83D\uDDBC'} Images
              {successfulImages.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">({successfulImages.length}/{IMAGE_COUNT})</span>}
            </h2>
            {successfulImages.length > 0 && (
              <div className="flex gap-2">
                <button className="btn-secondary text-sm" onClick={downloadAll}>{'\u2B07\uFE0F'} All</button>
              </div>
            )}
          </div>

          <canvas ref={cvRef} style={{ display: 'none' }} />

          {imgLoading ? (
            <div className="text-center py-14 text-gray-500">
              <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
              <p className="font-medium text-gray-300">{imgProgress || 'Generating images...'}</p>
              <p className="text-sm mt-1">Creating {IMAGE_COUNT} branded cards</p>
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
              <div className="relative mb-3">
                <img src={images[selectedImg]?.url} className="w-full rounded-lg shadow-lg" alt={`Generated image ${selectedImg + 1}`} onError={() => { showToast('Image load error'); const updated = [...images]; updated[selectedImg] = { ...updated[selectedImg], url: null, error: 'Load failed' }; setImages(updated); }} />
                <div className="absolute top-2 left-2 badge bg-black bg-opacity-60 text-white text-xs px-2 py-1">{selectedImg + 1} / {successfulImages.length}</div>
                <button className="absolute top-2 right-2 btn-secondary text-xs" onClick={() => downloadImage(images[selectedImg].url, selectedImg)}>{'\u2B07\uFE0F'}</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button key={i} className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-video ${selectedImg === i ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-600 hover:border-gray-400'} ${!img.url ? 'opacity-40' : ''}`} onClick={() => img.url && setSelectedImg(i)} disabled={!img.url}>
                    {img.url ? (
                      <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${i + 1}`} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-red-400">{'\u2717'}</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">{i + 1}</div>
                  </button>
                ))}
              </div>
              {images[selectedImg]?.prompt && (
                <div className="mt-3 p-2 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 truncate" title={images[selectedImg].prompt}>{'\uD83C\uDFA8'} {images[selectedImg].prompt}</p>
                  {images[selectedImg]?.model && <p className="text-xs text-gray-500 mt-0.5">Model: {images[selectedImg].model}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">{'\uD83D\uDDBC'}</div>
              <p>{IMAGE_COUNT} unique images will be generated with your post</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
