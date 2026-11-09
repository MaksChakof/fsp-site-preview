// Scene A frames as image files (built by tools/build-frames.py).
// AVIF where the browser decodes it, WebP otherwise; 1080 px versions on narrow screens (same threshold as MOB).
// The scene waits for window.FRAMES_READY before reading window.FRAMES.
(() => {
  const mobile = window.innerWidth < 900;
  const photos = ['a2', 'a2c', 'fa3', 'a3w', 'a3o', 'a3m', 'a3mr'];
  const maps = ['a2m', 'a2d', 'a3mk', 'a3mo', 'a3md', 'a3ml', 'a3mg', 'a4'];
  const base = '/fsp-site-preview/scene-a/frames/';
  window.FINISH_KEY = '10';   // chosen finish variant (others are archived)
  window.FURN_KEY = '9';      // chosen furniture variant
  window.FURN_RUG = { yf: 0.9398, yb: 0.6655, e0: 0.08, es: 0.15 };   // rug edges and order in the furniture drawing
  window.FRAMES = {};
  const avif = new Promise((done) => {
    const probe = new Image();
    probe.onload = () => done(probe.width > 0);
    probe.onerror = () => done(false);
    probe.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAFwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAH21kYXQSAAoFGAAGBCAyDBgACiiihAAAsBNL2A==';
  });
  window.FRAMES_READY = avif.then((ok) => {
    const ext = ok ? 'avif' : 'webp';
    for (const k of photos) window.FRAMES[k] = base + k + (mobile ? '-m.' : '-d.') + ext;
    for (const k of maps) window.FRAMES[k] = base + k + '.webp';
    return window.FRAMES;
  });
})();
