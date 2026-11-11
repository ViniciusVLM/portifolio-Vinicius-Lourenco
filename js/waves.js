// fios de luz ondulando atrás do título da formação
export function initWaves(canvas, { reduced }) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, visible = false, running = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const lines = 9;
    for (let i = 0; i < lines; i++) {
      const k = i / (lines - 1);
      ctx.strokeStyle = `rgba(${90 + k * 60},${130 + k * 40},255,${0.08 + (1 - Math.abs(k - 0.5) * 2) * 0.22})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const u = x / w;
        const env = Math.sin(u * Math.PI);
        const y = h / 2
          + Math.sin(u * 6 + t * 0.0004 + i * 0.5) * 34 * env
          + Math.sin(u * 13 - t * 0.0007 + i) * 10 * env
          + (k - 0.5) * 40 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function loop(t) {
    if (!visible) { running = false; return; }
    running = true;
    draw(t);
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running && !reduced) requestAnimationFrame(loop);
  }).observe(canvas);
  addEventListener('resize', resize);
  resize();
}
