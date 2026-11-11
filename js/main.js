import { perfil, formacao, carreira, skills, projetos, conquistas } from './data.js';
import { initStars } from './stars.js';
import { initGlobe } from './globe.js';
import { initConstellation } from './constellation.js';
import { initParticles } from './particles.js';
import { initWaves } from './waves.js';
import { initPortrait } from './portrait.js';
import { icons } from './icons.js';

const $ = (s, el = document) => el.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// destaca o que ainda precisa ser preenchido
const fill = (s) => esc(s).replace(/\[[^\]]+\]/g, (m) => `<span class="todo">${m}</span>`);

/* ---------- texto que embaralha ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+';
function scramble(el, to, dur = 600) {
  if (reduced) { el.textContent = to; return; }
  const from = el.textContent;
  const len = Math.max(from.length, to.length);
  const start = performance.now();
  cancelAnimationFrame(el._raf);
  const tick = (now) => {
    const k = Math.min(1, (now - start) / dur);
    let out = '';
    for (let i = 0; i < len; i++) {
      const settle = i / len;
      if (k > settle * 0.7 + 0.3) out += to[i] ?? '';
      else out += to[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (k < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}
document.querySelectorAll('[data-scramble]').forEach((a) => {
  const txt = a.textContent.trim().toUpperCase();
  a.textContent = txt;
  a.addEventListener('mouseenter', () => scramble(a, txt, 450));
});

/* ---------- relógio de São Paulo ---------- */
const clockFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: perfil.fuso, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const clocks = document.querySelectorAll('[data-clock]');
const tickClock = () => { const t = clockFmt.format(new Date()); clocks.forEach((c) => (c.textContent = t)); };
tickClock();
setInterval(tickClock, 1000);

let si = 0;
const statusEl = $('#status');
statusEl.textContent = perfil.status[0];
setInterval(() => {
  si = (si + 1) % perfil.status.length;
  scramble(statusEl, perfil.status[si].toUpperCase(), 700);
}, 4000);

if (perfil.codandoDesde) {
  const s = $('#since');
  s.innerHTML = `<b>${esc(perfil.codandoDesde)}</b>Codando desde`;
  s.hidden = false;
}

/* ---------- cursor ---------- */
if (fine && !reduced) {
  const cur = $('#cursor');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; cur.classList.add('is-on'); }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    cur.classList.toggle('is-big', !!e.target.closest('a, button, .projects__item, .cert'));
  });
  const loop = () => {
    cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
    cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------- estrelas ---------- */
initStars($('#stars'), { reduced });

/* ---------- palco: cubo -> retrato ---------- */
const stage = $('#stage');
const pin = stage.querySelector('.stage__pin');
let cube3d = null;
let stageProgress = 0;

const cubeStatus = $('#cubeStatus');
const phaseLabel = { solving: 'resolvendo', solved: 'resolvido ✓', scrambling: 'embaralhando' };
import('./cube.js')
  .then(({ initCube }) => {
    cube3d = initCube($('#cube'), {
      reduced,
      onToggle: (wire) => { $('#hintClick').textContent = wire ? 'clique de novo' : 'clique no cubo'; },
      onStatus: ({ phase, step, total }) => {
        cubeStatus.textContent = phase === 'solving'
          ? `${phaseLabel.solving} ${String(step).padStart(2, '0')}/${total}`
          : phaseLabel[phase];
        cubeStatus.classList.toggle('is-done', phase === 'solved');
      }
    });
    cube3d.setProgress(stageProgress);
  })
  .catch((err) => {
    console.warn('cubo não carregou', err);
    $('#cubeHint').hidden = true;
  });

const portrait = initPortrait($('#portrait'), perfil.foto, { reduced });

function updateStage() {
  const r = stage.getBoundingClientRect();
  const total = r.height - innerHeight;
  const p = Math.min(1, Math.max(0, -r.top / total));
  stageProgress = p;
  // 0 – 0.18 cubo parado, 0.18 – 0.5 teletransporte, 0.45 – 0.7 retrato aparece
  const p2 = smooth(0.42, 0.68, p);
  const beam = Math.sin(Math.min(1, smooth(0.12, 0.55, p)) * Math.PI);
  pin.style.setProperty('--p2', p2.toFixed(3));
  pin.style.setProperty('--portrait', p2.toFixed(3));
  pin.style.setProperty('--beam', beam.toFixed(3));
  pin.style.setProperty('--beamw', (0.25 + beam * 0.75).toFixed(3));
  cube3d?.setProgress(p);
  portrait.setVisible(p2 > 0.01 && r.bottom > 0);
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
addEventListener('scroll', updateStage, { passive: true });
addEventListener('resize', updateStage);
updateStage();

/* ---------- sobre ---------- */
$('#aboutTitle').innerHTML = perfil.sobre.titulo
  .map((l) => (l.startsWith('#') ? `<em>${esc(l.slice(1))}</em>` : esc(l)))
  .join('<br>');
$('#aboutBody').textContent = perfil.sobre.texto;
const { lat, lon } = perfil.coords;
$('#coords').textContent = `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(4)}° ${lon < 0 ? 'W' : 'E'}`;
initGlobe($('#globe'), perfil.coords, { reduced });

/* ---------- formação ---------- */
$('#eduGrid').innerHTML = formacao
  .map((f, i) => `
    <article class="ecard">
      <span class="ecard__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div class="ecard__when mono">${fill(f.periodo)}</div>
      <h3>${fill(f.curso)}</h3>
      <div class="inst">${fill(f.instituicao)}</div>
      <p>${fill(f.texto)}</p>
    </article>`)
  .join('');
initWaves($('#waves'), { reduced });

/* ---------- carreira ---------- */
const track = $('#careerTrack');
track.insertAdjacentHTML('beforeend', carreira
  .map((c) => `
    <article class="job"${c.cor ? ` style="--brand:${esc(c.cor)}"` : ''}>
      <div class="job__top">
        <div class="job__brand">
          ${c.logo
            ? `<img class="job__logo" src="${esc(c.logo)}" alt="Logo ${esc(c.empresa)}" width="40" height="40" loading="lazy">`
            : `<span class="job__mark" aria-hidden="true">${esc(c.empresa.replace(/[^A-Za-zÀ-ú]/g, '').slice(0, 2) || '··')}</span>`}
          <h3>${fill(c.empresa)}</h3>
        </div>
        <span class="job__when mono">${fill(c.periodo)}</span>
      </div>
      <p class="job__role">${fill(c.cargo)}</p>
      <p class="job__text">${fill(c.texto)}</p>
    </article>`)
  .join(''));

const svgNS = 'http://www.w3.org/2000/svg';
const linesSvg = $('#careerLines');
let careerPaths = [];
function drawCareerLines() {
  const jobs = [...track.querySelectorAll('.job')];
  const tr = track.getBoundingClientRect();
  linesSvg.innerHTML = '';
  careerPaths = [];
  const mobile = innerWidth <= 900;
  for (let i = 0; i < jobs.length - 1; i++) {
    const a = jobs[i].getBoundingClientRect();
    const b = jobs[i + 1].getBoundingClientRect();
    let d;
    if (mobile) {
      const x = a.left - tr.left - 12;
      d = `M ${x} ${a.top - tr.top + 28} V ${b.top - tr.top + 28} H ${x + 12}`;
    } else {
      const leftToRight = a.left < b.left;
      const sx = leftToRight ? a.right - tr.left : a.left - tr.left;
      const sy = a.top - tr.top + a.height / 2;
      const ex = b.left - tr.left + b.width / 2;
      const ey = b.top - tr.top;
      const r = 14;
      const dir = leftToRight ? 1 : -1;
      d = `M ${sx} ${sy} H ${ex - r * dir} Q ${ex} ${sy} ${ex} ${sy + r} V ${ey}`;
    }
    const base = document.createElementNS(svgNS, 'path');
    base.setAttribute('d', d); base.setAttribute('class', 'base');
    const glow = document.createElementNS(svgNS, 'path');
    glow.setAttribute('d', d);
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('r', '3');
    linesSvg.append(base, glow, dot);
    const len = glow.getTotalLength();
    glow.style.strokeDasharray = len;
    glow.style.strokeDashoffset = len;
    careerPaths.push({ glow, dot, len, from: jobs[i], to: jobs[i + 1] });
  }
  updateCareer();
}
function updateCareer() {
  const mid = innerHeight * 0.62;
  careerPaths.forEach(({ glow, dot, len, from, to }) => {
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (mid - (a.top + a.height / 2)) / (b.top - a.top || 1)));
    glow.style.strokeDashoffset = len * (1 - k);
    const pt = glow.getPointAtLength(len * k);
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    dot.style.opacity = k > 0 && k < 1 ? 1 : 0;
    from.classList.toggle('is-lit', a.top + a.height / 2 < mid);
    to.classList.toggle('is-lit', k >= 1);
  });
}
addEventListener('scroll', updateCareer, { passive: true });
addEventListener('resize', drawCareerLines);
document.fonts?.ready.then(drawCareerLines);
drawCareerLines();

/* ---------- skills ---------- */
$('#skillsList').innerHTML = skills.map((g) => `<li>${esc(g.grupo)}: ${g.itens.map(esc).join(', ')}</li>`).join('');
initConstellation($('#constellation'), skills, { reduced });
if (!fine) $('.skills__tip').textContent = 'segure e arraste os fios';

/* ---------- projetos ---------- */
const plist = $('#projectList');
const cardHTML = (p, i) => `
  <div class="pc">
    <div class="pc__img"><img src="${esc(p.imagem)}" alt="Tela do ${esc(p.nome)}" loading="lazy"></div>
    <div class="pc__body">
      <h4 class="pc__title"><span>${String(i + 1).padStart(2, '0')}</span>${esc(p.nome)}</h4>
      <p class="pc__sum">${esc(p.resumo)}</p>
      <p class="pc__text">${esc(p.texto)}</p>
      <div class="pc__foot">
        <p class="pc__tags mono">${p.tags.map(esc).join(' · ')}</p>
        <div class="pc__links">
          ${p.extra ? `<a class="textbtn" href="${esc(p.extra.url)}" target="_blank" rel="noopener">${esc(p.extra.label)} ↗</a>` : ''}
          <a class="iconbtn" href="${esc(p.repo)}" target="_blank" rel="noopener" aria-label="Repositório do ${esc(p.nome)} no GitHub">${icons.github}</a>
        </div>
      </div>
    </div>
  </div>`;

plist.innerHTML = projetos
  .map((p, i) => `
    <li class="projects__item" data-i="${i}">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <h3>${esc(p.nome)}</h3>
      <div class="mcard">${cardHTML(p, i)}</div>
    </li>`)
  .join('');

const pcard = $('#pcard');
const items = [...plist.children];
let active = -1;
let hoverLock = false;
function setActive(i) {
  if (i === active) return;
  active = i;
  items.forEach((el, k) => el.classList.toggle('is-active', k === i));
  pcard.innerHTML = cardHTML(projetos[i], i);
}
setActive(0);
function pickByScroll() {
  if (hoverLock || innerWidth <= 900) return;
  const mid = innerHeight / 2;
  let best = 0, bestD = Infinity;
  items.forEach((el, k) => {
    const r = el.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid);
    if (d < bestD) { bestD = d; best = k; }
  });
  setActive(best);
}
addEventListener('scroll', pickByScroll, { passive: true });
items.forEach((el, k) => {
  el.addEventListener('mouseenter', () => { hoverLock = true; setActive(k); });
  el.addEventListener('mouseleave', () => { hoverLock = false; });
  el.addEventListener('click', () => { if (innerWidth > 900) window.open(projetos[k].repo, '_blank', 'noopener'); });
});

// cone de luz entre o nome ativo e o cartão
const cone = $('#cone');
const conePoly = $('#conePoly');
const coneEdge = $('#coneEdge');
let conePts = null;
function coneLoop() {
  if (innerWidth > 900 && active >= 0) {
    const box = cone.getBoundingClientRect();
    if (box.bottom > 0 && box.top < innerHeight) {
      const h = items[active].querySelector('h3').getBoundingClientRect();
      const c = pcard.getBoundingClientRect();
      const target = [
        h.right - box.left + 24, h.top - box.top + h.height * 0.5,
        c.left - box.left, c.top - box.top + 8,
        c.left - box.left, c.bottom - box.top - 8
      ];
      if (!conePts) conePts = target.slice();
      for (let k = 0; k < 6; k++) conePts[k] += (target[k] - conePts[k]) * (reduced ? 1 : 0.14);
      const s = `${conePts[0]},${conePts[1]} ${conePts[2]},${conePts[3]} ${conePts[4]},${conePts[5]}`;
      conePoly.setAttribute('points', s);
      coneEdge.setAttribute('points', s);
    }
  }
  requestAnimationFrame(coneLoop);
}
coneLoop();

/* ---------- conquistas ---------- */
const rows = $('#winsRows');
const thumb = (src) => src.replace(/\.webp$/, '-p.webp');
const galleries = [];
rows.innerHTML = conquistas
  .filter((g) => g.itens.length)
  .map((g) => `
    <div class="wins__row">
      <p class="wins__label mono">/ ${esc(g.grupo)} <b>${String(g.itens.length).padStart(2, '0')}</b></p>
      <div class="wins__grid">
        ${g.itens.map((c) => {
          const imgs = c.imagens || (c.imagem ? [c.imagem] : []);
          const gi = imgs.length ? galleries.push(imgs) - 1 : -1;
          return `
          <button class="cert ${imgs.length ? 'cert--img' : 'cert--text'}" type="button" ${imgs.length ? `data-gallery="${gi}" aria-label="Ver imagens de ${esc(c.titulo)}"` : 'tabindex="-1"'}>
            ${imgs.length ? `<span class="cert__thumb"><img src="${esc(thumb(imgs[0]))}" alt="" loading="lazy" ${c.posicao ? `style="object-position:${esc(c.posicao)}"` : ''}>${imgs.length > 1 ? `<span class="cert__count mono">${imgs.length} imagens</span>` : ''}</span>` : ''}
            <span class="cert__info">
              <span class="cert__year mono">${fill(c.ano)}</span>
              <h4>${esc(c.titulo)}</h4>
              <span class="org">${esc(c.org)}</span>
              <span class="det mono">${esc(c.detalhe)}</span>
            </span>
          </button>`;
        }).join('')}
        <div class="cert cert--count" aria-hidden="true"><span>${String(g.itens.length).padStart(2, '0')}</span><i></i></div>
      </div>
    </div>`)
  .join('');

rows.querySelectorAll('.cert:not(.cert--count)').forEach((el) => {
  if (fine && !reduced) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(10px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  }
  if (el.dataset.gallery) el.addEventListener('click', () => openLightbox(galleries[+el.dataset.gallery], 0, el));
});

// galeria
const lb = $('#lightbox');
const lbImg = $('#lightboxImg');
const lbPrev = $('#lightboxPrev');
const lbNext = $('#lightboxNext');
const lbCount = $('#lightboxCount');
let lbList = [], lbIndex = 0, lbOpener = null;
function showLb() {
  lbImg.src = lbList[lbIndex];
  const many = lbList.length > 1;
  lbPrev.hidden = lbNext.hidden = lbCount.hidden = !many;
  lbCount.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(lbList.length).padStart(2, '0')}`;
  // já carrega a próxima
  if (many) new Image().src = lbList[(lbIndex + 1) % lbList.length];
}
function openLightbox(list, i, opener) {
  lbList = list; lbIndex = i; lbOpener = opener;
  showLb();
  lb.hidden = false;
  $('#lightboxClose').focus();
}
const stepLb = (d) => { lbIndex = (lbIndex + d + lbList.length) % lbList.length; showLb(); };
const closeLb = () => { if (lb.hidden) return; lb.hidden = true; lbOpener?.focus(); };
$('#lightboxClose').addEventListener('click', closeLb);
lbPrev.addEventListener('click', () => stepLb(-1));
lbNext.addEventListener('click', () => stepLb(1));
lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowRight' && lbList.length > 1) stepLb(1);
  if (e.key === 'ArrowLeft' && lbList.length > 1) stepLb(-1);
});
let touchX = null;
lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => {
  if (touchX === null || lbList.length < 2) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) stepLb(dx < 0 ? 1 : -1);
  touchX = null;
});

/* ---------- contato ---------- */
const [user, domain] = perfil.email.split('@');
const mail = $('#email');
mail.href = `mailto:${perfil.email}`;
mail.innerHTML = `${esc(user)}<b>@</b>${esc(domain)}`;
const copyBtn = $('#copyMail');
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(perfil.email);
    copyBtn.textContent = 'Copiado ✓';
  } catch {
    const sel = getSelection(); const rg = document.createRange();
    rg.selectNodeContents(mail); sel.removeAllRanges(); sel.addRange(rg);
    copyBtn.textContent = 'Selecionado, use Ctrl+C';
  }
  setTimeout(() => (copyBtn.textContent = 'Copiar e-mail'), 2200);
});
const strip = perfil.faixaContato.map((t) => `<span>${esc(t)}</span>`).join('');
$('#marquee').innerHTML = strip + strip;
$('#socials').innerHTML = perfil.redes
  .map((r) => `<li><a href="${esc(r.url)}" ${r.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${icons[r.icone]}${esc(r.nome)}</a></li>`)
  .join('');
$('#copy').textContent = `© ${new Date().getFullYear()} ${perfil.nomeCompleto}`;
initParticles($('#particles'), { reduced, fine });
