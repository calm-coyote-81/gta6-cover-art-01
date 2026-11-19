// Vice City Cover Maker — wires the editor: photos, caption, layout, grade,
// size, per-panel crop, PNG export, and the ?shot= scenes for screenshots.
import { SIZES, GRADES, LAYOUTS, coverPanels, panelAt, drawCoverArt, exportCoverPNG } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panInput = document.getElementById('pan');
const panelLabel = document.getElementById('panelLabel');

const state = {
  photos: [null, null, null],
  useOnePhoto: true,
  panelPhoto: [0, 1, 2],
  zoom: [1, 1, 1],
  pan: [0, 0, 0],
  title: 'Sunset Heist',
  subtitle: 'Vice City Nights',
  layout: 'poster',
  grade: 'sunset',
  size: '1920x1080',
  selected: 0,
};

function redraw() {
  drawCoverArt(canvas, state);
  syncCropControls();
}

function syncCropControls() {
  const panels = coverPanels(canvas.width, canvas.height, state.layout);
  panelLabel.textContent = `Panel ${state.selected + 1} of ${panels.length}`;
  zoomInput.value = String(Math.round((state.zoom[state.selected] ?? 1) * 100));
  panInput.value = String(state.pan[state.selected] ?? 0);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Puts an image into the first empty photo slot (or slot 0). */
function addPhoto(img) {
  const slot = state.photos.findIndex((p) => p === null);
  state.photos[slot === -1 ? 0 : slot] = img;
  redraw();
}

document.getElementById('photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try { addPhoto(await loadImage(URL.createObjectURL(file))); } catch { /* skip unreadable files */ }
  }
  e.target.value = '';
});

document.getElementById('samples').addEventListener('click', async (e) => {
  const sample = e.target.closest('[data-sample]');
  if (!sample) return;
  try { addPhoto(await loadImage(`samples/${sample.dataset.sample}.jpg`)); } catch { /* ignore */ }
});

document.getElementById('onePhoto').addEventListener('change', (e) => {
  state.useOnePhoto = e.target.checked;
  redraw();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

function bindGroup(id, key, values) {
  document.getElementById(id).addEventListener('click', (e) => {
    const button = e.target.closest('[data-' + key + ']');
    if (!button || !values.includes(button.dataset[key])) return;
    state[key] = button.dataset[key];
    e.currentTarget.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === button));
    if (key === 'layout') state.selected = 0;
    redraw();
  });
}
bindGroup('layouts', 'layout', LAYOUTS);
bindGroup('grades', 'grade', GRADES);
bindGroup('sizes', 'size', Object.keys(SIZES));

zoomInput.addEventListener('input', () => {
  state.zoom[state.selected] = zoomInput.value / 100;
  redraw();
});
panInput.addEventListener('input', () => {
  state.pan[state.selected] = Number(panInput.value);
  redraw();
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(canvas.width, canvas.height, state.layout, x, y);
  if (hit >= 0) { state.selected = hit; syncCropControls(); }
});

document.getElementById('export').addEventListener('click', async () => {
  status.textContent = 'Exporting…';
  try {
    const blob = await exportCoverPNG(state);
    const size = SIZES[state.size];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-city-cover-${size.w}x${size.h}.png`;
  } catch {
    status.textContent = 'Export failed — try another photo.';
  }
});

/** Applies a shot scene (?shot=…) or starts with a sample photo. */
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    loadImage,
    apply: (patch) => {
      Object.assign(state, patch);
      titleInput.value = state.title;
      subtitleInput.value = state.subtitle;
      document.getElementById('onePhoto').checked = state.useOnePhoto;
      document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
      document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
      document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
      redraw();
    },
    exportCoverPNG: () => exportCoverPNG(state),
  });
} else {
  loadImage('samples/pier.jpg').then((img) => addPhoto(img)).catch(() => redraw());
  redraw();
}
