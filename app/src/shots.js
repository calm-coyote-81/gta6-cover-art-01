// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the PNG the app itself exported, at full
// size. `photo`/`photo2` pick samples, `caption`/`subtitle` the words,
// `layout`, `grade` and `size` the look. window.__shotReady is set once
// the scene is painted.
export async function runShot(shot, query, helpers) {
  const patch = {
    title: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Vice City Nights',
    layout: query.get('layout') ?? 'poster',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
    useOnePhoto: query.get('one') !== '0',
  };
  const first = await helpers.loadImage(`samples/${query.get('photo') ?? 'pier'}.jpg`);
  const photos = [first, null, null];
  const second = query.get('photo2');
  if (second) photos[1] = await helpers.loadImage(`samples/${second}.jpg`);
  patch.photos = photos;
  helpers.apply(patch);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const blob = await helpers.exportCoverPNG();
    const shown = document.getElementById('exportImg');
    shown.src = URL.createObjectURL(blob);
    await shown.decode();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
