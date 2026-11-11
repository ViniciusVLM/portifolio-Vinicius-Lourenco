// Globo de pontos em canvas 2D. Arrastar gira; São Paulo pisca em azul.
import land from './land.js';

export function initGlobe(canvas, home, { reduced }) {
  const ctx = canvas.getContext('2d');
  const D2R = Math.PI / 180;
  const pts = [];
  for (let i = 0; i < land.length; i += 2) {
    const la = (land[i] / 10) * D2R, lo = (land[i + 1] / 10) * D2R;
    pts.push([Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]);
  }
  const hla = home.lat * D2R, hlo = home.lon * D2R;
  const homeV = [Math.cos(hla) * Math.sin(hlo), Math.sin(hla), Math.cos(hla) * Math.cos(hlo)];

  // começa com o Brasil virado para a frente
  let yaw = -hlo - 0.35;
  const pitch = -0.3;
  let vel = reduced ? 0 : 0.0016;
  let drag = null;
  let size = 0, dpr = 1, visible = false, running = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = r.width;
    canvas.width = size * dpr; canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function project(v) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    let x = v[0] * cy + v[2] * sy;
    let z = -v[0] * sy + v[2] * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y = v[1] * cp - z * sp;
    z = v[1] * sp + z * cp;
    return [x, y, z];
  }

  function draw(t) {
    const R = size * 0.46, c = size / 2;
    ctx.clearRect(0, 0, size, size);

    const halo = ctx.createRadialGradient(c, c, R * 0.6, c, c, R * 1.08);
    halo.addColorStop(0, 'rgba(77,125,255,0)');
    halo.addColorStop(0.92, 'rgba(77,125,255,0.07)');
    halo.addColorStop(1, 'rgba(77,125,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(160,175,220,0.12)';
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.stroke();

    const s = Math.max(1.2, size / 300);
    for (const p of pts) {
      const [x, y, z] = project(p);
      if (z < -0.05) continue;
      const a = 0.15 + 0.85 * Math.max(0, z);
      ctx.fillStyle = `rgba(235,238,248,${a.toFixed(2)})`;
      ctx.fillRect(c + x * R - s / 2, c - y * R - s / 2, s, s);
    }

    const [hx, hy, hz] = project(homeV);
    if (hz > 0) {
      const px = c + hx * R, py = c - hy * R;
      const k = ((t / 1600) % 1);
      ctx.strokeStyle = `rgba(77,125,255,${(1 - k).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(px, py, 4 + k * 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#4d7dff';
      ctx.shadowColor = '#4d7dff'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop(t) {
    if (!visible) { running = false; return; }
    running = true;
    if (!drag) yaw += vel;
    draw(t);
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, yaw }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (drag) { yaw = drag.yaw + (e.clientX - drag.x) * 0.008; if (reduced) draw(0); } });
  const end = () => (drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running && !reduced) requestAnimationFrame(loop);
  }).observe(canvas);
  addEventListener('resize', resize);
  resize();
}
