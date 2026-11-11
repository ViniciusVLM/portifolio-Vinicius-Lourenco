// Teia de skills com física: centro -> grupos -> tecnologias.
// Cada fio é uma corrente de pontos (integração de Verlet), presa a fios em espiral
// como numa teia de aranha. O mouse empurra os fios, dá para puxar qualquer nó
// ou fio e, ao soltar, a teia balança até voltar ao lugar.
export function initConstellation(canvas, groups, { reduced }) {
  const ctx = canvas.getContext('2d');
  const ACC = '77,125,255';
  const SEG = 16;           // tamanho de cada pedacinho de fio, em px
  const ITER = 8;           // passadas de restrição por quadro
  let w = 0, h = 0, dpr = 1, narrow = false;

  let pts = [];             // { x, y, px, py, hx, hy, anchor, node }
  let threads = [];         // { ids: [], rest, kind, a, b }
  let nodes = [];           // { p, kind, label, parent }
  let pulses = [];
  let hover = null;
  let grab = null;          // ponto sendo arrastado
  let visible = false, running = false;
  const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false };

  function addPoint(x, y, anchor, node = null) {
    pts.push({ x, y, px: x, py: y, hx: x, hy: y, anchor, node });
    return pts.length - 1;
  }

  // fio entre dois pontos já existentes, subdividido
  function addThread(ia, ib, kind, tension, a = null, b = null) {
    const A = pts[ia], B = pts[ib];
    const dist = Math.hypot(B.x - A.x, B.y - A.y);
    const n = Math.max(3, Math.round(dist / SEG));
    const ids = [ia];
    for (let k = 1; k < n; k++) {
      const t = k / n;
      ids.push(addPoint(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t, 0.004));
    }
    ids.push(ib);
    const th = { ids, rest: (dist / n) * tension, kind, a, b };
    threads.push(th);
    return th;
  }

  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    narrow = w < 640;
    const cx = w / 2, cy = h / 2;
    const R1 = narrow ? Math.min(w * 0.27, h * 0.2) : Math.min(w * 0.24, h * 0.27);
    const R2 = narrow ? Math.min(w * 0.13, h * 0.12) : Math.min(w * 0.12, h * 0.18);
    const sx = narrow ? 0.85 : 1.15;
    const sy = narrow ? 1.75 : 1;

    pts = []; threads = []; nodes = []; pulses = []; grab = null; hover = null;

    const center = { p: addPoint(cx, cy, 0.3), kind: 'center', label: '', parent: null };
    pts[center.p].node = center;
    nodes.push(center);

    const radials = [];
    groups.forEach((g, gi) => {
      const a = -Math.PI / 2 + (gi / groups.length) * Math.PI * 2 + 0.2;
      const gx = cx + Math.cos(a) * R1 * sx, gy = cy + Math.sin(a) * R1 * sy;
      const gn = { p: addPoint(gx, gy, 0.035), kind: 'group', label: g.grupo.toUpperCase(), parent: center, leaves: [] };
      pts[gn.p].node = gn;
      nodes.push(gn);
      radials.push(addThread(center.p, gn.p, 'radial', 0.985, center, gn));

      const n = g.itens.length;
      const spread = narrow ? 0.5 : 0.42;
      g.itens.forEach((it, k) => {
        const aa = a + (k - (n - 1) / 2) * spread;
        const dist = R2 * (k % 2 ? 0.92 : 1.12);
        const lx = gx + Math.cos(aa) * dist * (narrow ? 0.95 : 1.2);
        const ly = gy + Math.sin(aa) * dist * (narrow ? 1.6 : 1);
        const ln = { p: addPoint(lx, ly, 0.022), kind: 'leaf', label: it, parent: gn };
        pts[ln.p].node = ln;
        nodes.push(ln);
        gn.leaves.push(ln);
        addThread(gn.p, ln.p, 'radial', 0.985, gn, ln);
      });
    });

    // espiral: anéis presos nos fios radiais, como numa teia de verdade
    for (const f of [0.32, 0.58, 0.82]) {
      for (let i = 0; i < radials.length; i++) {
        const r1 = radials[i], r2 = radials[(i + 1) % radials.length];
        const pa = r1.ids[Math.round(f * (r1.ids.length - 1))];
        const pb = r2.ids[Math.round(f * (r2.ids.length - 1))];
        addThread(pa, pb, 'ring', 0.99);
      }
    }
    // anel externo entre os grupos e arcos entre as tecnologias de cada grupo
    const gs = nodes.filter((n) => n.kind === 'group');
    gs.forEach((g, i) => addThread(g.p, gs[(i + 1) % gs.length].p, 'ring', 0.99));
    gs.forEach((g) => {
      for (let k = 0; k < g.leaves.length - 1; k++) addThread(g.leaves[k].p, g.leaves[k + 1].p, 'arc', 0.99);
    });

    draw(0);
  }

  // ---------- física ----------
  function simulate(t) {
    const wind = Math.sin(t * 0.00035) * 0.012;
    for (const p of pts) {
      if (p === grab) continue;
      const vx = (p.x - p.px) * 0.965;
      const vy = (p.y - p.py) * 0.965;
      p.px = p.x; p.py = p.y;
      p.x += vx + Math.sin(t * 0.0009 + p.hy * 0.012) * wind;
      p.y += vy + Math.cos(t * 0.0007 + p.hx * 0.01) * wind + 0.004;
      // volta devagar para o lugar
      p.x += (p.hx - p.x) * p.anchor;
      p.y += (p.hy - p.y) * p.anchor;
    }

    // o cursor empurra os fios (não os nós, para o hover continuar fácil)
    if (mouse.inside && !grab) {
      const R = narrow ? 34 : 46;
      for (const p of pts) {
        if (p.node) continue;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (R - d) / d * 0.35;
          p.x += dx * f + mouse.vx * 0.08;
          p.y += dy * f + mouse.vy * 0.08;
        }
      }
    }

    if (grab) {
      // elástico: depois de um certo ponto o fio resiste mais
      const dx = mouse.x - grab.hx, dy = mouse.y - grab.hy;
      const d = Math.hypot(dx, dy), max = narrow ? 120 : 190;
      const k = d > max ? (max + (d - max) * 0.25) / d : 1;
      grab.x = grab.hx + dx * k; grab.y = grab.hy + dy * k;
      grab.px = grab.x - mouse.vx * 0.5; grab.py = grab.y - mouse.vy * 0.5;
    }

    // fios só puxam, nunca empurram (como linha de verdade)
    for (let it = 0; it < ITER; it++) {
      for (const th of threads) {
        const ids = th.ids;
        for (let k = 0; k < ids.length - 1; k++) {
          const a = pts[ids[k]], b = pts[ids[k + 1]];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          if (d <= th.rest) continue;
          const diff = (d - th.rest) / d;
          const wa = a === grab ? 0 : a.node ? (a.node.kind === 'center' ? 0.04 : 0.35) : 1;
          const wb = b === grab ? 0 : b.node ? (b.node.kind === 'center' ? 0.04 : 0.35) : 1;
          const sum = wa + wb;
          if (!sum) continue;
          a.x += dx * diff * (wa / sum); a.y += dy * diff * (wa / sum);
          b.x -= dx * diff * (wb / sum); b.y -= dy * diff * (wb / sum);
        }
      }
    }
    mouse.vx *= 0.6; mouse.vy *= 0.6;
  }

  // ---------- desenho ----------
  function pathOf(n) {
    const set = new Set();
    while (n) { set.add(n); n = n.parent; }
    return set;
  }

  function strokeThread(th) {
    const ids = th.ids;
    ctx.beginPath();
    ctx.moveTo(pts[ids[0]].x, pts[ids[0]].y);
    for (let k = 1; k < ids.length - 1; k++) {
      const p = pts[ids[k]], q = pts[ids[k + 1]];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    const last = pts[ids[ids.length - 1]];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  function stretch(th) {
    // quanto o fio está esticado além do normal (0 = parado)
    let len = 0;
    for (let k = 0; k < th.ids.length - 1; k++) {
      const a = pts[th.ids[k]], b = pts[th.ids[k + 1]];
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return Math.max(0, len / (th.rest * (th.ids.length - 1)) - 1);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const lit = hover ? pathOf(hover) : null;

    // anéis da espiral primeiro, mais apagados
    ctx.lineWidth = 1;
    for (const th of threads) {
      if (th.kind === 'radial') continue;
      const s = Math.min(1, stretch(th) * 6);
      ctx.strokeStyle = `rgba(${s > 0.05 ? ACC : '160,175,220'},${(lit ? 0.05 : 0.11) + s * 0.4})`;
      strokeThread(th);
    }

    for (const th of threads) {
      if (th.kind !== 'radial') continue;
      const on = lit && lit.has(th.a) && lit.has(th.b);
      const s = Math.min(1, stretch(th) * 6);
      if (on) {
        ctx.strokeStyle = `rgba(${ACC},0.95)`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = `rgb(${ACC})`; ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = s > 0.05 ? `rgba(${ACC},${0.25 + s * 0.6})` : `rgba(160,175,220,${lit ? 0.08 : 0.2})`;
        ctx.lineWidth = 1 + s;
        ctx.shadowBlur = 0;
      }
      strokeThread(th);
      ctx.shadowBlur = 0;
    }

    // gotinhas onde a espiral cruza os fios radiais
    ctx.fillStyle = 'rgba(200,210,240,0.28)';
    for (const th of threads) {
      if (th.kind !== 'ring') continue;
      const a = pts[th.ids[0]], b = pts[th.ids[th.ids.length - 1]];
      if (!a.node) ctx.fillRect(a.x - 1, a.y - 1, 2, 2);
      if (!b.node) ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    }

    // pulsos correndo pelos fios radiais
    if (!reduced) {
      if (Math.random() < 0.04) {
        const radial = threads.filter((t) => t.kind === 'radial');
        pulses.push({ th: radial[(Math.random() * radial.length) | 0], k: 0 });
      }
      pulses = pulses.filter((p) => (p.k += 0.012) < 1);
      for (const p of pulses) {
        const ids = p.th.ids;
        const f = p.k * (ids.length - 1);
        const i = Math.min(ids.length - 2, Math.floor(f));
        const a = pts[ids[i]], b = pts[ids[i + 1]], u = f - i;
        ctx.fillStyle = `rgba(${ACC},${(1 - p.k).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // nós e rótulos
    for (const n of nodes) {
      const { x, y } = pts[n.p];
      const on = lit && lit.has(n);
      const dim = lit && !on;
      if (n.kind === 'center') {
        const g = ctx.createRadialGradient(x, y, 4, x, y, 44);
        g.addColorStop(0, `rgba(${ACC},0.45)`); g.addColorStop(1, `rgba(${ACC},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 44, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${ACC},0.7)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.arc(x, y, 21, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(x - 11, y - 7); ctx.lineTo(x - 5.5, y + 7); ctx.lineTo(x, y - 7);
        ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 4, y + 7); ctx.lineTo(x + 11, y + 7);
        ctx.stroke();
        ctx.lineCap = 'butt';
        continue;
      }
      const held = grab && grab.node === n;
      const r = n.kind === 'group' ? 3.6 : 2.4;
      ctx.fillStyle = n.kind === 'group' ? `rgb(${ACC})` : on || held ? '#fff' : `rgba(230,234,245,${dim ? 0.35 : 0.9})`;
      if (on || held || n.kind === 'group') { ctx.shadowColor = `rgb(${ACC})`; ctx.shadowBlur = on || held ? 14 : 6; }
      ctx.beginPath(); ctx.arc(x, y, on || held ? r + 1.4 : r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      if (n.kind === 'group') {
        ctx.font = `500 ${narrow ? 8.5 : 9.5}px "Geist Mono", ui-monospace, monospace`;
        ctx.fillStyle = on ? '#fff' : `rgba(170,178,200,${dim ? 0.3 : 0.85})`;
        ctx.letterSpacing = '1.5px';
      } else {
        ctx.font = `${on ? 600 : 500} ${narrow ? 11 : 13}px Geist, system-ui, sans-serif`;
        ctx.fillStyle = on || held ? '#fff' : `rgba(220,224,236,${dim ? 0.3 : 0.82})`;
        ctx.letterSpacing = '0px';
      }
      ctx.textAlign = 'center';
      const parent = n.parent ? pts[n.parent.p] : null;
      let ly = n.kind === 'group' ? y + 16 : y - 9;
      if (n.kind === 'leaf' && parent && pts[n.p].hy > parent.hy) ly = y + 17;
      const half = ctx.measureText(n.label).width / 2;
      ctx.fillText(n.label, Math.min(w - half - 6, Math.max(half + 6, x)), ly);
    }
    ctx.letterSpacing = '0px';
  }

  // ---------- interação ----------
  function nearest(maxNode, maxThread) {
    let best = null, bd = maxNode * maxNode;
    for (const n of nodes) {
      if (n.kind === 'center') continue;
      const p = pts[n.p];
      const d = (p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    if (best || !maxThread) return best;
    bd = maxThread * maxThread;
    for (const p of pts) {
      if (p.node) continue;
      const d = (p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function setMouse(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (mouse.inside) { mouse.vx = x - mouse.x; mouse.vy = y - mouse.y; }
    mouse.x = x; mouse.y = y;
    mouse.inside = true;
  }

  canvas.addEventListener('pointermove', (e) => {
    setMouse(e);
    if (!grab) {
      const n = nearest(28, 0);
      hover = n ? n.node : null;
      canvas.style.cursor = n || nearest(0, 14) ? 'grab' : '';
    }
    if (reduced) draw();
  });
  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
    if (!grab) hover = null;
    if (reduced) draw();
  });
  canvas.addEventListener('pointerdown', (e) => {
    setMouse(e);
    mouse.vx = mouse.vy = 0;
    const p = nearest(28, 18);
    if (!p) return;
    grab = p;
    hover = p.node || null;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    if (reduced) draw();
  });
  const release = () => {
    if (!grab) return;
    grab = null;
    canvas.style.cursor = '';
    if (!mouse.inside) hover = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  // no celular, segurar um fio não rola a página
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top;
    if (nearest(28, 18)) e.preventDefault();
  }, { passive: false });

  // ---------- loop ----------
  function loop(t) {
    if (!visible) { running = false; return; }
    running = true;
    simulate(t);
    draw();
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running && !reduced) requestAnimationFrame(loop);
  }).observe(canvas);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  document.fonts?.ready.then(layout);
  layout();
}
