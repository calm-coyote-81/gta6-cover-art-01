// Vice City Cover Maker — draws the multi-panel poster cover onto a canvas.
// One photo per panel (or one photo everywhere), a sunset / neon / mono /
// halftone grade, and bold condensed caption lettering, all with system
// fonts and no network: every pixel comes from the user's own photos.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};

export const GRADES = ['sunset', 'neon', 'mono', 'halftone'];
export const LAYOUTS = ['poster', 'strip', 'hero'];

const TITLE_FONT = 'Impact, "Arial Narrow", "Helvetica Neue", sans-serif';
const GUTTER = 10;

/** Panel rectangles for a layout, in canvas pixels. */
export function coverPanels(w, h, layout) {
  if (layout === 'strip') {
    const pw = (w - GUTTER * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (pw + GUTTER), y: 0, w: pw, h }));
  }
  if (layout === 'hero') return [{ x: 0, y: 0, w, h }];
  const heroH = Math.round(h * 0.6);
  const half = (w - GUTTER) / 2;
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + GUTTER, w: half, h: h - heroH - GUTTER },
    { x: half + GUTTER, y: heroH + GUTTER, w: half, h: h - heroH - GUTTER },
  ];
}

/** Which panel (if any) holds canvas point (x, y). */
export function panelAt(w, h, layout, x, y) {
  const panels = coverPanels(w, h, layout);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

/** Draws `img` cover-fit into rect, with zoom and a horizontal slide. */
function drawPanelPhoto(ctx, img, rect, zoom, pan, grade) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const overflowX = Math.max(0, dw - rect.w);
  const dx = rect.x + (rect.w - dw) / 2 + (pan / 100) * overflowX;
  const dy = rect.y + (rect.h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (grade === 'mono') ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.06)';
  else if (grade === 'neon') ctx.filter = 'contrast(1.25) saturate(1.5)';
  else ctx.filter = 'contrast(1.08) saturate(1.25)';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** Sunset wash: warm orange-to-magenta gradient rising from the bottom. */
function sunsetWash(ctx, w, h) {
  const g = ctx.createLinearGradient(0, h * 0.3, 0, h);
  g.addColorStop(0, 'rgba(255, 122, 60, 0)');
  g.addColorStop(0.65, 'rgba(255, 94, 98, 0.16)');
  g.addColorStop(1, 'rgba(190, 30, 120, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Neon wash: magenta and cyan light, blended over the photo. */
function neonWash(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255, 0, 160, 0.55)');
  g.addColorStop(0.5, 'rgba(120, 0, 255, 0.35)');
  g.addColorStop(1, 'rgba(0, 229, 255, 0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Halftone dots: a dark dot screen over the lower half of the cover. */
function halftoneDots(ctx, w, h) {
  const cell = Math.max(10, Math.round(w / 110));
  const dot = document.createElement('canvas');
  dot.width = cell; dot.height = cell;
  const d = dot.getContext('2d');
  d.fillStyle = 'rgba(10, 0, 20, 0.55)';
  d.beginPath(); d.arc(cell / 2, cell / 2, cell * 0.26, 0, Math.PI * 2); d.fill();
  const pattern = ctx.createPattern(dot, 'repeat');
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);
  ctx.restore();
}

/** Darkens the corners so the caption lettering pops. */
function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(10, 0, 25, 0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Bold condensed title with a black outline and a sunset fill, plus subtitle. */
function drawCaption(ctx, w, h, title, subtitle) {
  const bandH = Math.round(h * 0.24);
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(12, 2, 24, 0)');
  band.addColorStop(1, 'rgba(12, 2, 24, 0.82)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, bandH);

  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = Math.round(h * 0.115);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const setFont = (s) => { ctx.font = `900 ${s}px ${TITLE_FONT}`; };
    setFont(size);
    while (ctx.measureText(text).width > w * 0.94 && size > 14) { size -= 2; setFont(size); }
    const ty = h - Math.round(h * 0.05);
    ctx.save();
    // Slant around the baseline itself, so the text stays centred.
    ctx.translate(w / 2, ty);
    ctx.transform(1, 0, -0.06, 1, 0, 0);
    const fill = ctx.createLinearGradient(0, -size, 0, 0);
    fill.addColorStop(0, '#fff7ae');
    fill.addColorStop(0.55, '#ffffff');
    fill.addColorStop(1, '#ffb3d9');
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#16041f';
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = fill;
    ctx.shadowColor = 'rgba(255, 46, 136, 0.75)';
    ctx.shadowBlur = size * 0.22;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    let size = Math.round(h * 0.034);
    ctx.font = `700 ${size}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    try { ctx.letterSpacing = `${Math.round(size * 0.22)}px`; } catch { /* older canvas: no letter spacing */ }
    const sw = ctx.measureText(sub).width;
    const pad = size * 0.9;
    const sy = h - Math.round(h * 0.205);
    ctx.fillStyle = 'rgba(255, 46, 136, 0.92)';
    const bw = Math.min(w * 0.94, sw + pad * 2);
    ctx.fillRect((w - bw) / 2, sy - size * 0.78, bw, size * 1.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, w / 2, sy + size * 0.32);
    try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  }
}

/** Renders the whole cover for `state` onto `canvas` (sized to state.size). */
export function drawCoverArt(canvas, state) {
  const size = SIZES[state.size] ?? SIZES['1920x1080'];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { w, h } = size;
  ctx.fillStyle = '#16041f';
  ctx.fillRect(0, 0, w, h);

  const panels = coverPanels(w, h, state.layout);
  const photos = state.photos;
  const pick = (i) => {
    if (state.useOnePhoto) return photos[0] ?? null;
    const slot = state.panelPhoto[i] ?? i;
    return photos[slot] ?? photos[0] ?? null;
  };
  panels.forEach((rect, i) => {
    const img = pick(i);
    if (img) drawPanelPhoto(ctx, img, rect, state.zoom[i] ?? 1, state.pan[i] ?? 0, state.grade);
    else {
      ctx.fillStyle = i === 0 ? '#3a1445' : '#241031';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  // White gutters between panels, poster style.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(3, Math.round(w / 320));
  panels.forEach((rect) => ctx.strokeRect(rect.x, rect.y, rect.w, rect.h));

  if (state.grade === 'sunset') sunsetWash(ctx, w, h);
  else if (state.grade === 'neon') neonWash(ctx, w, h);
  else if (state.grade === 'mono') { ctx.fillStyle = 'rgba(96, 48, 170, 0.14)'; ctx.fillRect(0, 0, w, h); }
  else if (state.grade === 'halftone') { sunsetWash(ctx, w, h); halftoneDots(ctx, w, h); }
  vignette(ctx, w, h);
  drawCaption(ctx, w, h, state.title, state.subtitle);
  return canvas;
}

/** Renders the cover off-screen at export size and returns a PNG blob. */
export function exportCoverPNG(state) {
  const canvas = document.createElement('canvas');
  drawCoverArt(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}
