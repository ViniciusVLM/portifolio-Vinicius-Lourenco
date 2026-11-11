// Retrato em retícula: cada ponto tem o tamanho do brilho da foto.
// O mouse empurra os pontos de leve.
export function initPortrait(canvas, src, { reduced }) {
  const ctx = canvas.getContext('2d');
  let dpr = 1, w = 0, h = 0, cell = 7;
  let dots = [];
  let source = null;
  let visible = false;
  let running = false;
  const mouse = { x: -9999, y: -9999 };
  let lastMove = 0;

  const img = new Image();
  img.onload = () => { source = img; build(); };
  img.onerror = () => { source = silhouette(); build(); };
  img.src = src;

  function silhouette() {
    // sem foto: um busto genérico para ocupar o lugar
    const c = document.createElement('canvas');
    c.width = 400; c.height = 500;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 400, 500);
    const head = g.createRadialGradient(170, 170, 10, 200, 200, 120);
    head.addColorStop(0, '#e6e6e6'); head.addColorStop(0.7, '#8a8a8a'); head.addColorStop(1, '#222');
    g.fillStyle = head;
    g.beginPath(); g.ellipse(200, 205, 88, 112, 0, 0, Math.PI * 2); g.fill();
    const body = g.createLinearGradient(0, 330, 0, 500);
    body.addColorStop(0, '#9a9a9a'); body.addColorStop(1, '#1a1a1a');
    g.fillStyle = body;
    g.beginPath(); g.moveTo(40, 500); g.quadraticCurveTo(60, 350, 200, 340); g.quadraticCurveTo(340, 350, 360, 500); g.fill();
    return c;
  }

  function build() {
    if (!source) return;
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = w < 700 ? 3.6 : 4.2;

        const mobile = w / h < 0.8;
    const ih = mobile ? h * 0.56 : h * 0.86;
    const iw = ih * (source.width / source.height);
    // no computador o rosto fica à direita do nome
    const ox = mobile ? (w - iw) / 2 : Math.min(w - iw - w * 0.04, w * 0.62 - iw / 2);
    const oy = mobile ? h * 0.2 : h - ih;
    const cols = Math.ceil(iw / cell), rows = Math.ceil(ih / cell);
    const off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.drawImage(source, 0, 0, cols, rows);
    const data = o.getImageData(0, 0, cols, rows).data;
    dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        let l = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        // some com as bordas de baixo e dos lados
        const fx = Math.min(x, cols - x) / (cols * 0.18);
        const fy = (rows - y) / (rows * 0.22);
        l *= Math.min(1, fx) * Math.min(1, fy);
        if (l < 0.06) continue;
        dots.push({ x: ox + x * cell + cell / 2, y: oy + y * cell + cell / 2, r: Math.pow(l, 0.9) * cell * 0.58, dx: 0, dy: 0 });
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (const d of dots) {
      if (!reduced) {
        const vx = d.x - mouse.x, vy = d.y - mouse.y;
        const dist2 = vx * vx + vy * vy;
        const push = dist2 < 14000 ? (1 - dist2 / 14000) * 14 : 0;
        const len = Math.sqrt(dist2) || 1;
        d.dx += ((vx / len) * push - d.dx) * 0.15;
        d.dy += ((vy / len) * push - d.dy) * 0.15;
      }
      ctx.moveTo(d.x + d.dx + d.r, d.y + d.dy);
      ctx.arc(d.x + d.dx, d.y + d.dy, d.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  function loop() {
    if (!visible || reduced) { running = false; return; }
    running = true;
    // só redesenha enquanto o mouse mexe e os pontos voltam ao lugar
    if (performance.now() - lastMove < 1600) draw();
    requestAnimationFrame(loop);
  }

  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    lastMove = performance.now();
  }, { passive: true });
  addEventListener('resize', build);

  return {
    setVisible(v) {
      visible = v;
      if (v && !running) loop();
    }
  };
}
