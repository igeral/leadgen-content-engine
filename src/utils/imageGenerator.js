// ═══════════════════════════════════════════════════════════════════
//  STEADFAST-STYLE BRANDED CARDS
//  Typography-led. No icons, no clip art, no decorative borders.
//  - System A: Single Stat Card
//  - System B: Editorial / Quote Card
//  - System C: Multi-Image Set (slide counter, headline, body)
//  Two background variants: cream ('light') and near-black ('dark').
// ═══════════════════════════════════════════════════════════════════

const STYLE = {
  light: {
    bg: '#f0ebdf',
    headline: '#1a365d',
    headlineAlt: '#3182ce',
    body: '#4a5568',
    bodySoft: '#6b7280',
    accent: '#3182ce',
    accentSoft: '#4a90a4',
    counter: '#3182ce',
    panelBg: '#ffffff',
    panelText: '#1a365d',
    panelAccent: '#3182ce',
  },
  dark: {
    bg: '#0a0a14',
    headline: '#ffffff',
    headlineAlt: '#8baec7',
    body: '#d9d5cc',
    bodySoft: '#a8a89d',
    accent: '#3182ce',
    accentSoft: '#8baec7',
    counter: '#8baec7',
    panelBg: '#ffffff',
    panelText: '#0a0a14',
    panelAccent: '#1a365d',
  },
};

// ─── CANVAS HELPERS ───
function wrapLine(ctx, text, x, y, maxW, lh, maxLines) {
  if (!text) return y;
  const words = String(text).split(/\s+/);
  let line = '';
  let n = 0;
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = words[i];
      cy += lh;
      n++;
      if (maxLines && n >= maxLines - 1) {
        // last allowed line — emit remaining joined
        const rest = words.slice(i).join(' ');
        // truncate if too long
        let out = rest;
        while (ctx.measureText(out + '\u2026').width > maxW && out.length > 3) {
          out = out.slice(0, -1);
        }
        if (out !== rest) out = out + '\u2026';
        ctx.fillText(out, x, cy);
        return cy;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

function drawParagraphs(ctx, text, x, y, maxW, lh, color) {
  if (!text) return y;
  ctx.fillStyle = color;
  const paras = String(text).split(/\n\n+/);
  let cy = y;
  for (let p = 0; p < paras.length; p++) {
    const lines = paras[p].split('\n');
    for (let i = 0; i < lines.length; i++) {
      cy = wrapLine(ctx, lines[i], x, cy, maxW, lh);
      cy += lh;
    }
    if (p < paras.length - 1) cy += lh * 0.35;
  }
  return cy - lh;
}

// Count how many lines `text` would wrap into at the current ctx.font.
function countWrappedLines(ctx, text, maxW) {
  if (!text) return 0;
  const words = String(text).split(/\s+/);
  let line = '';
  let count = 1;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      count++;
      line = w;
    } else {
      line = test;
    }
  }
  return count;
}

// Find the largest font size at which `text` wraps within `maxLines`.
// fontFn(size) returns the CSS font string for that size.
function fitFontToLines(ctx, text, fontFn, maxW, maxLines, startSize, minSize) {
  let size = startSize;
  ctx.font = fontFn(size);
  while (size > minSize) {
    const lines = countWrappedLines(ctx, text, maxW);
    if (lines <= maxLines) return size;
    size -= 4;
    ctx.font = fontFn(size);
  }
  return minSize;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawAccent(ctx, x, y, width, color, thickness) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, thickness || 5);
}

function drawSlideCounter(ctx, text, x, y, color) {
  if (!text) return;
  ctx.fillStyle = color;
  ctx.font = '700 15px Inter, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawBrandFooter(ctx, W, H, s, brandName) {
  if (!brandName) return;
  ctx.fillStyle = s.bodySoft;
  ctx.font = '700 11px Inter, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  const label = String(brandName).toUpperCase();
  ctx.fillText(label, 80, H - 40);
}

function extractStatAndLabel(raw) {
  if (!raw) return { stat: '86,000', label: 'Key metric.' };
  const s = String(raw).trim();
  const m = s.match(/^([\$\d,\.%\+\-]+[KMB]?%?)\s*(.*)/);
  if (m && m[1]) return { stat: m[1], label: (m[2] || '').trim() || s };
  return { stat: s.split(/\s+/)[0] || s, label: s };
}

function normalizePadding(W) {
  return Math.max(56, Math.round(W * 0.066));
}

// ═══════════ SYSTEM A — SINGLE STAT CARD ═══════════
export function generateStatCard(canvas, opts) {
  const orient = opts.orientation === 'portrait' ? 'portrait' : 'landscape';
  const W = orient === 'portrait' ? 1080 : 1200;
  const H = orient === 'portrait' ? 1350 : 628;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const variant = opts.variant === 'light' ? 'light' : 'dark';
  const s = STYLE[variant];
  const pad = normalizePadding(W);

  // Background
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, W, H);

  // Slide counter (optional)
  if (opts.slideCounter) {
    drawSlideCounter(ctx, opts.slideCounter, pad, pad + 8, s.counter);
  }

  // Parse hero and descriptor
  const parsed = extractStatAndLabel(opts.stat ? `${opts.stat} ${opts.label || ''}` : opts.label);
  const heroText = opts.stat || parsed.stat;
  const descriptor = opts.label || parsed.label;

  // Hero stat (massive, left-aligned)
  const heroY = orient === 'portrait' ? Math.round(H * 0.22) : Math.round(H * 0.38);
  ctx.fillStyle = s.headline;
  const heroSize = orient === 'portrait' ? 200 : 160;
  ctx.font = `900 ${heroSize}px Inter, Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'left';
  // Auto-shrink if too wide
  let fs = heroSize;
  while (ctx.measureText(heroText).width > W - pad * 2 && fs > 80) {
    fs -= 8;
    ctx.font = `900 ${fs}px Inter, Helvetica, Arial, sans-serif`;
  }
  ctx.fillText(heroText, pad, heroY);

  // Accent line
  const accentY = heroY + Math.round(fs * 0.12) + 8;
  drawAccent(ctx, pad, accentY, Math.min(180, Math.round(W * 0.18)), s.accent, 5);

  // Descriptor (bold, navy/white) — auto-fit so long descriptors don't overflow
  ctx.fillStyle = s.headline;
  const descMaxLines = orient === 'portrait' ? 4 : 3;
  const descSize = fitFontToLines(
    ctx, descriptor,
    (n) => `700 ${n}px Inter, Helvetica, Arial, sans-serif`,
    W - pad * 2, descMaxLines,
    orient === 'portrait' ? 44 : 38,
    orient === 'portrait' ? 28 : 24
  );
  ctx.font = `700 ${descSize}px Inter, Helvetica, Arial, sans-serif`;
  const descStartY = accentY + descSize + 16;
  const descEndY = wrapLine(ctx, descriptor, pad, descStartY, W - pad * 2, descSize + 8, descMaxLines);

  // Supporting body text
  if (opts.subtitle) {
    const bodySize = orient === 'portrait' ? 26 : 22;
    ctx.fillStyle = s.body;
    ctx.font = `400 ${bodySize}px Inter, Helvetica, Arial, sans-serif`;
    drawParagraphs(ctx, opts.subtitle, pad, descEndY + bodySize + 20, W - pad * 2, bodySize + 10, s.body);
  }

  // Brand footer
  drawBrandFooter(ctx, W, H, s, opts.brandName);
}

// ═══════════ SYSTEM B — EDITORIAL / QUOTE CARD ═══════════
export function generateQuoteCard(canvas, opts) {
  const orient = opts.orientation === 'portrait' ? 'portrait' : 'landscape';
  const W = orient === 'portrait' ? 1080 : 1200;
  const H = orient === 'portrait' ? 1350 : 628;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const variant = opts.variant === 'dark' ? 'dark' : 'light';
  const s = STYLE[variant];
  const pad = normalizePadding(W);

  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, W, H);

  // Slide counter
  if (opts.slideCounter) {
    drawSlideCounter(ctx, opts.slideCounter, pad, pad + 8, s.counter);
  }

  // Optional POV-style lead label (e.g. "POV:")
  let cursorY = pad + (opts.slideCounter ? 48 : 16);
  if (opts.leadLabel) {
    ctx.fillStyle = s.accent;
    const llSize = orient === 'portrait' ? 56 : 44;
    ctx.font = `800 ${llSize}px Inter, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(opts.leadLabel, pad, cursorY + llSize);
    cursorY += llSize + 12;
  }

  // Headline (big, left-aligned, multi-line) — auto-fit to a 3-line budget
  const headline = opts.quote || opts.headline || 'Your perspective here.';
  const headMaxLines = orient === 'portrait' ? 3 : 2;
  const hSize = fitFontToLines(
    ctx, headline,
    (n) => `800 ${n}px Inter, Helvetica, Arial, sans-serif`,
    W - pad * 2, headMaxLines,
    orient === 'portrait' ? 64 : 54,
    orient === 'portrait' ? 36 : 30
  );
  ctx.fillStyle = s.headline;
  ctx.font = `800 ${hSize}px Inter, Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'left';
  const headStartY = cursorY + hSize + 12;
  const headEndY = wrapLine(ctx, headline, pad, headStartY, W - pad * 2, hSize + 12, headMaxLines);

  // Accent line
  const accentY = headEndY + 24;
  drawAccent(ctx, pad, accentY, Math.min(140, Math.round(W * 0.14)), s.accent, 5);

  // Context / body — hard-bounded to 3 wrapped lines so it can never
  // overflow into the closing-line panel below.
  let bodyY = accentY + 42;
  if (opts.context) {
    const bodySize = orient === 'portrait' ? 28 : 24;
    ctx.fillStyle = s.body;
    ctx.font = `400 ${bodySize}px Inter, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'left';
    // Use single wrapLine with maxLines so long context truncates with ellipsis
    bodyY = wrapLine(ctx, String(opts.context).replace(/\n+/g, ' '), pad, bodyY + bodySize, Math.round((W - pad * 2) * 0.92), bodySize + 10, 3);
  }

  // Callout panel (closing statement)
  if (opts.closingLine) {
    const calloutPad = 28;
    const calloutSize = orient === 'portrait' ? 28 : 24;
    ctx.font = `800 ${calloutSize}px Inter, Helvetica, Arial, sans-serif`;
    const textW = Math.min(W - pad * 2, ctx.measureText(opts.closingLine).width + calloutPad * 2);
    const boxH = calloutSize + calloutPad * 2 - 8;
    const boxY = Math.min(bodyY + 56, H - boxH - pad - 24);
    // panel body
    ctx.fillStyle = s.panelBg;
    roundRect(ctx, pad, boxY, textW, boxH, 4);
    ctx.fill();
    // steel blue left bar
    ctx.fillStyle = s.panelAccent;
    ctx.fillRect(pad, boxY, 6, boxH);
    // text
    ctx.fillStyle = s.panelText;
    ctx.textAlign = 'left';
    ctx.fillText(opts.closingLine, pad + calloutPad, boxY + boxH / 2 + calloutSize / 3);
  }

  drawBrandFooter(ctx, W, H, s, opts.brandName);
}

// ═══════════ SYSTEM C — MULTI-IMAGE SET SLIDE ═══════════
export function generateMultiCard(canvas, opts) {
  const orient = opts.orientation === 'portrait' ? 'portrait' : 'landscape';
  const W = orient === 'portrait' ? 1080 : 1200;
  const H = orient === 'portrait' ? 1350 : 628;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  // Alternate dark / cream by slide number so a 5-card set is mixed (~50/50)
  // instead of dark-heavy. Caller can override with opts.variant.
  const n = parseInt(opts.cardNumber || '1', 10);
  const total = parseInt(opts.totalCards || '3', 10);
  const defaultVariant = n % 2 === 1 ? 'dark' : 'light';
  const variant = opts.variant === 'light' || opts.variant === 'dark' ? opts.variant : defaultVariant;
  const s = STYLE[variant];
  const pad = normalizePadding(W);

  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, W, H);

  // Slide counter "01 / 03"
  const pad2 = (x) => String(x).padStart(2, '0');
  const counter = opts.slideCounter || `${pad2(n)} / ${pad2(total)}`;
  drawSlideCounter(ctx, counter, pad, pad + 16, s.counter);

  // Headline (topic heading, bold at top) — auto-fit so long titles don't overflow
  const title = opts.title || opts.topicLabel || 'Insight';
  const titleMaxLines = orient === 'portrait' ? 3 : 2;
  const tSize = fitFontToLines(
    ctx, title,
    (n) => `800 ${n}px Inter, Helvetica, Arial, sans-serif`,
    W - pad * 2, titleMaxLines,
    orient === 'portrait' ? 68 : 54,
    orient === 'portrait' ? 38 : 30
  );
  ctx.fillStyle = s.headline;
  ctx.font = `800 ${tSize}px Inter, Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'left';
  const titleY = pad + 72 + tSize;
  const titleEndY = wrapLine(ctx, title, pad, titleY, W - pad * 2, tSize + 10, titleMaxLines);

  // Accent line under title
  const accentY = titleEndY + 22;
  drawAccent(ctx, pad, accentY, Math.min(160, Math.round(W * 0.14)), s.accent, 5);

  // Body — supports points[] (bulleted), rows[] (label — value), numbered, or prose
  let bodyY = accentY + 40;
  const bodyX = pad;
  const bodyW = W - pad * 2;

  if (Array.isArray(opts.points) && opts.points.length) {
    const bs = orient === 'portrait' ? 30 : 24;
    ctx.font = `500 ${bs}px Inter, Helvetica, Arial, sans-serif`;
    opts.points.forEach((pt) => {
      // bullet dot
      ctx.fillStyle = s.accent;
      ctx.beginPath();
      ctx.arc(bodyX + 8, bodyY + bs / 2 - 4, 7, 0, Math.PI * 2);
      ctx.fill();
      // text
      ctx.fillStyle = s.body;
      const ey = wrapLine(ctx, pt, bodyX + 30, bodyY + bs - 6, bodyW - 30, bs + 8, 2);
      bodyY = ey + bs + 12;
    });
  } else if (Array.isArray(opts.rows) && opts.rows.length) {
    const bs = orient === 'portrait' ? 30 : 24;
    opts.rows.forEach((row) => {
      const label = row.label || '';
      const value = row.value || '';
      // label bold
      ctx.fillStyle = s.headline;
      ctx.font = `800 ${bs}px Inter, Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(label, bodyX, bodyY);
      const labelW = ctx.measureText(label).width;
      // em-dash
      ctx.fillStyle = s.accentSoft;
      ctx.font = `600 ${bs}px Inter, Helvetica, Arial, sans-serif`;
      ctx.fillText(' \u2014 ', bodyX + labelW, bodyY);
      const dashW = ctx.measureText(' \u2014 ').width;
      // value regular
      ctx.fillStyle = s.body;
      ctx.font = `500 ${bs}px Inter, Helvetica, Arial, sans-serif`;
      wrapLine(ctx, value, bodyX + labelW + dashW, bodyY, bodyW - labelW - dashW, bs + 6, 2);
      bodyY += bs + 18;
    });
  } else if (Array.isArray(opts.numbered) && opts.numbered.length) {
    const bs = orient === 'portrait' ? 30 : 24;
    ctx.font = `500 ${bs}px Inter, Helvetica, Arial, sans-serif`;
    opts.numbered.forEach((pt, i) => {
      ctx.fillStyle = s.body;
      ctx.textAlign = 'left';
      const num = `${i + 1}.`;
      ctx.fillText(num, bodyX, bodyY);
      const numW = ctx.measureText(num + '  ').width;
      const ey = wrapLine(ctx, pt, bodyX + numW, bodyY, bodyW - numW, bs + 8, 2);
      bodyY = ey + bs + 10;
    });
  } else {
    // Prose body: subtitle + subSubtitle + closing
    if (opts.subtitle) {
      const bs = orient === 'portrait' ? 30 : 26;
      ctx.fillStyle = s.body;
      ctx.font = `500 ${bs}px Inter, Helvetica, Arial, sans-serif`;
      bodyY = drawParagraphs(ctx, opts.subtitle, bodyX, bodyY + bs, bodyW, bs + 10, s.body);
    }
    if (opts.subSubtitle) {
      const bs = orient === 'portrait' ? 26 : 22;
      ctx.fillStyle = s.bodySoft;
      ctx.font = `400 ${bs}px Inter, Helvetica, Arial, sans-serif`;
      bodyY = drawParagraphs(ctx, opts.subSubtitle, bodyX, bodyY + bs + 14, bodyW, bs + 8, s.bodySoft);
    }
  }

  // Closing emphasis line (near bottom)
  if (opts.closingLine) {
    const cSize = orient === 'portrait' ? 32 : 26;
    ctx.fillStyle = s.headline;
    ctx.font = `800 ${cSize}px Inter, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'left';
    const cy = Math.min(bodyY + cSize + 28, H - pad - 28);
    wrapLine(ctx, opts.closingLine, bodyX, cy, bodyW, cSize + 10, 2);
  }

  drawBrandFooter(ctx, W, H, s, opts.brandName);
}
