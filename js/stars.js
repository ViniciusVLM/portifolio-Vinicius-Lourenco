// campo de estrelas fixo, com leve paralaxe na rolagem
export function initStars(canvas, { reduced }) {
  const ctx = canvas.getContext('2d');
  let w, h, dpr, stars = [];

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 5200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() ** 2,           // profundidade: perto = maior e mais rápido
      tw: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 1.6
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const sy = scrollY;
    for (const s of stars) {
      const size = 0.6 + s.z * 1.9;
      let y = (s.y - sy * (0.02 + s.z * 0.12)) % h;
      if (y < 0) y += h;
      const a = reduced ? 0.5 : 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.tw)) * (0.4 + s.z);
      ctx.fillStyle = `rgba(220,226,255,${a.toFixed(3)})`;
      ctx.fillRect(s.x, y, size, size);
    }
    if (!reduced) requestAnimationFrame(draw);
  }

  resize();
  addEventListener('resize', resize);
  if (reduced) { draw(0); addEventListener('scroll', () => draw(0), { passive: true }); }
  else requestAnimationFrame(draw);
}
