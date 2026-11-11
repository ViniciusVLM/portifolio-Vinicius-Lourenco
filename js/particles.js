// Nuvem de partículas que forma o monograma VL atrás do e-mail.
// O mouse espalha as partículas; elas voltam sozinhas.
export function initParticles(canvas, { reduced }) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let ps = [];
  let visible = false, running = false;
  const mouse = { x: -9999, y: -9999 };

  function targets() {
    // desenha o monograma num canvas pequeno e sorteia pontos dentro do traço
    const S = 220;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.strokeStyle = '#fff'; g.lineWidth = 26; g.lineCap = 'square'; g.lineJoin = 'miter';
    g.beginPath();
    g.moveTo(22, 40); g.lineTo(70, 172); g.lineTo(118, 40);
    g.moveTo(148, 40); g.lineTo(148, 172); g.lineTo(204, 172);
    g.stroke();
    const d = g.getImageData(0, 0, S, S).data;
    const out = [];
    for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (d[(y * S + x) * 4 + 3] > 128) out.push([x / S - 0.5, y / S - 0.5]);
    return out;
  }
  const shape = targets();

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const size = Math.min(w * 0.55, 520);
    const cx = w < 640 ? w * 0.5 : w * 0.56, cy = w < 640 ? h * 0.3 : Math.min(h * 0.38, 420);
    const n = Math.min(2600, Math.round(shape.length * 0.9));
    ps = Array.from({ length: n }, () => {
      const [tx, ty] = shape[(Math.random() * shape.length) | 0];
      const jx = (Math.random() - 0.5) * 0.05, jy = (Math.random() - 0.5) * 0.05;
      const x = cx + (tx + jx) * size, y = cy + (ty + jy) * size;
      return { hx: x, hy: y, x: x + (Math.random() - 0.5) * 200, y: y + (Math.random() - 0.5) * 200, vx: 0, vy: 0, a: 0.15 + Math.random() * 0.5, ph: Math.random() * 6 };
    });
    if (reduced) { ps.forEach((p) => { p.x = p.hx; p.y = p.hy; }); draw(0); }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      if (!reduced) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16000) {
          const f = (1 - d2 / 16000) * 2.2;
          const d = Math.sqrt(d2) || 1;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        const drift = Math.sin(t * 0.001 + p.ph) * 0.25;
        p.vx += (p.hx + drift * 6 - p.x) * 0.012;
        p.vy += (p.hy + Math.cos(t * 0.0012 + p.ph) * 4 - p.y) * 0.012;
        p.vx *= 0.9; p.vy *= 0.9;
        p.x += p.vx; p.y += p.vy;
      }
      ctx.fillStyle = `rgba(225,230,245,${p.a})`;
      ctx.fillRect(p.x, p.y, 1.4, 1.4);
    }
  }

  function loop(t) {
    if (!visible) { running = false; return; }
    running = true;
    draw(t);
    requestAnimationFrame(loop);
  }

  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running && !reduced) requestAnimationFrame(loop);
  }).observe(canvas);
  addEventListener('resize', resize);
  resize();
}
