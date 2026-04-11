// ─── CANVAS HELPERS ───
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + ' ';
      y += lh;
      n++;
      if (n > 8) break;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y;
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

// ─── STAT CARD ───
export function generateStatCard(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const W = 1200, H = 628;
  canvas.width = W;
  canvas.height = H;

  // Background gradient
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, opts.colors.primary);
  g.addColorStop(1, opts.colors.secondary || opts.colors.primary);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Category bar
  ctx.fillStyle = opts.colors.accent || '#3b82f6';
  ctx.fillRect(200, 60, 320, 4);
  ctx.fillStyle = opts.colors.light || '#bee3f8';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((opts.category || 'INSIGHT').toUpperCase(), 200, 50);

  // Main stat
  ctx.fillStyle = '#fff';
  ctx.font = '900 120px Inter, sans-serif';
  const stat = opts.stat || '86,000';
  ctx.fillText(stat, 190, 240);

  // Stat underline
  ctx.fillStyle = opts.colors.accent || '#3b82f6';
  ctx.fillRect(190, 260, Math.min(ctx.measureText(stat).width, 500), 4);

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = '700 36px Inter, sans-serif';
  wrapText(ctx, opts.label || 'Key metric.', 190, 320, 700, 44);

  // Subtitle
  if (opts.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '400 20px Inter, sans-serif';
    wrapText(ctx, opts.subtitle, 190, 420, 700, 28);
  }

  // Footer bar
  ctx.fillStyle = opts.colors.accent || '#3b82f6';
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = '#fff';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((opts.brandName || 'YOUR BRAND').toUpperCase(), 30, H - 18);
  ctx.textAlign = 'right';
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillText(opts.tagline || '', W - 30, H - 18);

  // Heartbeat line
  ctx.strokeStyle = 'rgba(255,255,255,.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(190, 490);
  ctx.lineTo(220, 490);
  ctx.lineTo(230, 470);
  ctx.lineTo(240, 510);
  ctx.lineTo(250, 480);
  ctx.lineTo(260, 490);
  ctx.lineTo(350, 490);
  ctx.stroke();
}

// ─── QUOTE CARD ───
export function generateQuoteCard(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const W = 1200, H = 628;
  canvas.width = W;
  canvas.height = H;

  // Background
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2d4a6f');
  g.addColorStop(1, opts.colors.primary || '#1a365d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Big quote mark
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.font = '900 200px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('\u201C', 40, 180);

  // Quote text
  ctx.fillStyle = '#fff';
  ctx.font = '700 32px Inter, sans-serif';
  wrapText(ctx, opts.quote || 'Your perspective here.', 80, 210, 520, 42);

  // Attribution
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.fillText(opts.brandName || 'Your Brand', 80, 480);
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillText(opts.role || '', 80, 505);

  // Context panel
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  roundRect(ctx, 650, 80, 480, 470, 12);
  ctx.fill();

  if (opts.context) {
    ctx.fillStyle = '#fff';
    ctx.font = '600 20px Inter, sans-serif';
    wrapText(ctx, opts.context, 680, 130, 420, 30);
  }
  if (opts.closingLine) {
    ctx.fillStyle = '#fff';
    ctx.font = '800 24px Inter, sans-serif';
    wrapText(ctx, opts.closingLine, 680, 440, 420, 32);
  }

  // Footer
  ctx.fillStyle = opts.colors.accent || '#3b82f6';
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = '#fff';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((opts.brandName || 'YOUR BRAND').toUpperCase(), 30, H - 18);
  ctx.textAlign = 'right';
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillText(opts.tagline || '', W - 30, H - 18);
}

// ─── MULTI CARD ───
export function generateMultiCard(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const W = 1200, H = 628;
  canvas.width = W;
  canvas.height = H;

  // Light background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, W, H);

  // Dark sidebar
  ctx.fillStyle = opts.colors.primary || '#1a365d';
  ctx.fillRect(0, 0, 100, H);
  ctx.fillStyle = '#fff';
  ctx.font = '700 48px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opts.cardNumber || '1', 50, 310);
  ctx.font = '400 20px Inter, sans-serif';
  ctx.fillText('of', 50, 340);
  ctx.fillText(opts.totalCards || '3', 50, 370);

  // Topic label
  ctx.fillStyle = opts.colors.primary || '#1a365d';
  ctx.font = '700 14px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((opts.topicLabel || 'TOPIC').toUpperCase(), 200, 60);
  ctx.fillStyle = opts.colors.accent || '#3b82f6';
  ctx.fillRect(200, 70, 200, 3);

  // Brand badge
  ctx.fillStyle = opts.colors.primary || '#1a365d';
  roundRect(ctx, W - 120, 20, 90, 90, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    opts.brandName ? opts.brandName.split(' ')[0].toUpperCase() : 'BRAND',
    W - 75,
    70
  );
  ctx.textAlign = 'left';

  // Title
  if (opts.title) {
    ctx.fillStyle = opts.colors.primary || '#1a365d';
    ctx.font = '800 42px Inter, sans-serif';
    wrapText(ctx, opts.title, 200, 160, 800, 52);
  }

  // Bullet points
  if (opts.points?.length) {
    let y = opts.title ? 300 : 140;
    opts.points.forEach((point, i) => {
      ctx.fillStyle = opts.colors.accent || '#3b82f6';
      ctx.beginPath();
      ctx.arc(220, y - 6, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1).padStart(2, '0'), 220, y - 1);
      ctx.textAlign = 'left';
      ctx.fillStyle = opts.colors.primary || '#1a365d';
      ctx.font = '600 26px Inter, sans-serif';
      ctx.fillText(point, 250, y);
      y += 60;
    });
  }

  // Subtitle
  if (opts.subtitle) {
    ctx.fillStyle = opts.colors.primary || '#1a365d';
    ctx.font = '800 38px Inter, sans-serif';
    wrapText(ctx, opts.subtitle, 200, 420, 800, 46);
    if (opts.subSubtitle) {
      ctx.fillStyle = '#64748b';
      ctx.font = '400 20px Inter, sans-serif';
      ctx.fillText(opts.subSubtitle, 200, 510);
    }
  }

  // Tag label
  if (opts.tagLabel) {
    ctx.font = '600 13px Inter, sans-serif';
    const tw = ctx.measureText(opts.tagLabel.toUpperCase()).width + 40;
    ctx.fillStyle = opts.colors.primary || '#1a365d';
    roundRect(ctx, W - tw - 30, H - 70, tw, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(opts.tagLabel.toUpperCase(), W - tw / 2 - 30, H - 47);
  }

  // Footer brand
  ctx.fillStyle = opts.colors.primary || '#1a365d';
  ctx.font = '700 14px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((opts.brandName || 'YOUR BRAND').toUpperCase(), 120, H - 20);
}
