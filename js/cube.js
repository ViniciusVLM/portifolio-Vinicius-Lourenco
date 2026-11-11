// Cubo mágico 3x3 renderizado em retícula (halftone).
// Enquanto está na tela ele se resolve sozinho, comemora e se embaralha de novo.
// Clique alterna para o modo aramado. Rolar a página "teletransporta" o cubo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const HALFTONE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const HALFTONE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tScene;
  uniform vec2 uRes;
  uniform float uCell;
  uniform float uDissolve;
  uniform float uTime;
  uniform float uGlitch;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 px = vUv * uRes;
    // glitch horizontal rápido na troca de modo
    float band = step(0.82, hash(vec2(floor(px.y / 18.0), floor(uTime * 24.0))));
    px.x += band * uGlitch * (hash(vec2(floor(px.y / 18.0), 3.0)) - 0.5) * 60.0;

    // no teletransporte cada célula sobe um pouco e some em ordem aleatória
    vec2 cell0 = floor(px / uCell);
    float rnd = hash(cell0);
    float lift = uDissolve * uDissolve * (0.3 + rnd) * uRes.y * 0.35;
    vec2 p = px - vec2(0.0, lift);
    vec2 cell = floor(p / uCell);
    vec2 center = (cell + 0.5) * uCell;

    vec4 s = texture2D(tScene, center / uRes);
    float lum = clamp(dot(s.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    lum = pow(lum, 0.6);

    float alive = 1.0 - step(rnd, uDissolve * 1.15 - 0.05);
    float r = uCell * 0.62 * lum * alive;
    float d = length(p - center);
    float dotMask = 1.0 - smoothstep(r - 0.9, r + 0.4, d);
    float solid = smoothstep(0.92, 0.99, lum) * alive;
    float m = max(dotMask, solid) * s.a;

    vec3 col = mix(vec3(1.0), vec3(0.75, 0.82, 1.0), clamp(uDissolve * 2.0, 0.0, 1.0));
    gl_FragColor = vec4(col * m, m);
  }
`;

// cada face tem um tom de cinza; na retícula isso vira pontos de tamanhos diferentes
const FACE_TONES = {
  px: 0xdedede, nx: 0x646464,
  py: 0xbababa, ny: 0x444444,
  pz: 0x8e8e8e, nz: 0x2c2c2c
};

const AXES = ['x', 'y', 'z'];

export function initCube(canvas, { reduced = false, onToggle, onStatus } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(6, -2, -3);
  scene.add(rim);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, metalness: 0.2, roughness: 0.6 });
  const stickerMats = {};
  for (const [k, c] of Object.entries(FACE_TONES)) {
    const col = new THREE.Color(c);
    stickerMats[k] = new THREE.MeshStandardMaterial({ color: col, emissive: col.clone().multiplyScalar(0.35), roughness: 0.4 });
  }
  const solidMats = [bodyMat, ...Object.values(stickerMats)];
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, visible: false });

  // adesivo com cantos arredondados
  const sticker = (() => {
    const s = 0.4, r = 0.1, sh = new THREE.Shape();
    sh.moveTo(-s + r, -s);
    sh.lineTo(s - r, -s); sh.quadraticCurveTo(s, -s, s, -s + r);
    sh.lineTo(s, s - r); sh.quadraticCurveTo(s, s, s - r, s);
    sh.lineTo(-s + r, s); sh.quadraticCurveTo(-s, s, -s, s - r);
    sh.lineTo(-s, -s + r); sh.quadraticCurveTo(-s, -s, -s + r, -s);
    return new THREE.ShapeGeometry(sh, 4);
  })();
  const bodyGeo = new RoundedBoxGeometry(0.96, 0.96, 0.96, 3, 0.1);
  const bodyEdges = new THREE.EdgesGeometry(bodyGeo, 30);
  const stickerEdges = new THREE.EdgesGeometry(sticker, 30);

  const root = new THREE.Group();   // posição/rotação geral (mouse, scroll)
  const cube = new THREE.Group();   // onde vivem as 27 peças
  root.add(cube);
  scene.add(root);

  const faces = [
    { key: 'px', n: [1, 0, 0], rot: [0, Math.PI / 2, 0] },
    { key: 'nx', n: [-1, 0, 0], rot: [0, -Math.PI / 2, 0] },
    { key: 'py', n: [0, 1, 0], rot: [-Math.PI / 2, 0, 0] },
    { key: 'ny', n: [0, -1, 0], rot: [Math.PI / 2, 0, 0] },
    { key: 'pz', n: [0, 0, 1], rot: [0, 0, 0] },
    { key: 'nz', n: [0, 0, -1], rot: [0, Math.PI, 0] }
  ];

  const cubies = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const piece = new THREE.Group();
    piece.position.set(x, y, z);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.add(new THREE.LineSegments(bodyEdges, lineMat));
    piece.add(body);
    for (const f of faces) {
      const [nx, ny, nz] = f.n;
      if ((nx && nx !== x) || (ny && ny !== y) || (nz && nz !== z)) continue;
      const st = new THREE.Mesh(sticker, stickerMats[f.key]);
      st.position.set(nx * 0.485, ny * 0.485, nz * 0.485);
      st.rotation.set(...f.rot);
      st.add(new THREE.LineSegments(stickerEdges, lineMat));
      piece.add(st);
    }
    cube.add(piece);
    cubies.push(piece);
  }

  // ---------- movimentos ----------
  const pivot = new THREE.Group();
  cube.add(pivot);
  const snapM = new THREE.Matrix4();

  function layerOf(move) {
    return cubies.filter((c) => Math.round(c.position[move.axis]) === move.layer);
  }
  function attachLayer(move) {
    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld();
    for (const c of layerOf(move)) pivot.attach(c);
  }
  function releaseLayer() {
    pivot.updateMatrixWorld();
    for (const c of [...pivot.children]) {
      cube.attach(c);
      c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
      snapM.makeRotationFromQuaternion(c.quaternion);
      const e = snapM.elements;
      for (let i = 0; i < 16; i++) e[i] = Math.round(e[i]);
      c.quaternion.setFromRotationMatrix(snapM);
    }
    pivot.rotation.set(0, 0, 0);
  }
  function applyInstant(move) {
    attachLayer(move);
    pivot.rotation[move.axis] = move.dir * Math.PI / 2;
    releaseLayer();
  }
  function randomScramble(n) {
    const out = [];
    let last = -1;
    while (out.length < n) {
      const a = (Math.random() * 3) | 0;
      if (a === last) continue;
      last = a;
      out.push({ axis: AXES[a], layer: Math.random() < 0.5 ? -1 : 1, dir: Math.random() < 0.5 ? -1 : 1 });
    }
    return out;
  }
  const inverse = (list) => list.slice().reverse().map((m) => ({ ...m, dir: -m.dir }));

  // ---------- ciclo: resolve -> comemora -> embaralha -> pausa ----------
  const MOVES = 20;
  let queue = [];
  let phase = 'solving';
  let current = null;   // { move, t, dur }
  let wait = 0.9;       // pausa antes do primeiro movimento
  let celebrate = 0;
  let done = 0;

  let scramble = randomScramble(MOVES);
  if (!reduced) {
    scramble.forEach(applyInstant);
    queue = inverse(scramble);
  } else {
    phase = 'solved';
  }
  report();

  function report() {
    onStatus?.({ phase, step: done, total: MOVES });
  }

  function stepCycle(dt) {
    if (wait > 0) { wait -= dt; return; }
    if (current) {
      current.t += dt;
      const k = Math.min(1, current.t / current.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      pivot.rotation[current.move.axis] = current.move.dir * e * Math.PI / 2;
      if (k >= 1) {
        releaseLayer();
        current = null;
        done++;
        report();
        wait = phase === 'solving' ? 0.12 : 0.02;
      }
      return;
    }
    if (queue.length) {
      const move = queue.shift();
      attachLayer(move);
      current = { move, t: 0, dur: phase === 'solving' ? 0.5 : 0.17 };
      return;
    }
    // fila vazia: muda de fase
    if (phase === 'solving') {
      phase = 'solved'; celebrate = 1.6; wait = 2.6; done = MOVES; report();
    } else if (phase === 'solved') {
      phase = 'scrambling'; done = 0;
      scramble = randomScramble(MOVES);
      queue = scramble.slice();
      report();
    } else {
      phase = 'solving'; done = 0;
      queue = inverse(scramble);
      wait = 1.2;
      report();
    }
  }

  // ---------- retícula ----------
  const rt = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true });
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const halftone = new THREE.ShaderMaterial({
    vertexShader: HALFTONE_VERT,
    fragmentShader: HALFTONE_FRAG,
    uniforms: {
      tScene: { value: rt.texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uCell: { value: 5 },
      uDissolve: { value: 0 },
      uTime: { value: 0 },
      uGlitch: { value: 0 }
    },
    transparent: true,
    depthTest: false
  });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), halftone));

  let w = 1, h = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // em tela estreita afasta a câmera; em tela larga empurra o cubo para a direita, longe do nome
    const narrow = w / h < 0.8;
    // no celular calcula a distância para o cubo caber na largura
    const fitZ = 3.3 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.set(narrow ? 0 : -Math.min(1.6, (w / h - 1) * 1.6), narrow ? -0.6 : 0.2, narrow ? Math.max(19, fitZ) : 15);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const sx = new THREE.Vector3(0, 0, 0).project(camera).x;
    canvas.parentElement.style.setProperty('--cube-x', `${((sx + 1) / 2) * 100}%`);
    rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
    halftone.uniforms.uRes.value.set(w * dpr, h * dpr);
    halftone.uniforms.uCell.value = Math.max(4, Math.round((w < 700 ? 4 : 5) * dpr));
  }
  resize();
  addEventListener('resize', resize);

  // ---------- mouse e clique ----------
  const mouse = { x: 0, y: 0 };
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hits = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(cube, true).length > 0;
  };
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
    canvas.style.cursor = hits(e) ? 'pointer' : '';
  }, { passive: true });

  let wire = false;
  let glitch = 0;
  canvas.addEventListener('click', (e) => {
    if (!hits(e)) return;
    wire = !wire;
    solidMats.forEach((m) => (m.visible = !wire));
    lineMat.visible = wire;
    glitch = 1;
    onToggle?.(wire);
  });

  // ---------- loop ----------
  let progress = 0;
  let visible = true;
  let running = false;
  const rot = { x: 0, y: 0 };
  const clock = new THREE.Clock();

  function frame() {
    running = visible && progress < 0.62;
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!reduced) stepCycle(dt);

    const ease = reduced ? 1 : 1 - Math.pow(0.003, dt);
    rot.y += (mouse.x * 0.5 - rot.y) * ease;
    rot.x += (mouse.y * 0.3 - rot.x) * ease;

    // giro de comemoração quando resolve
    let spin = 0;
    if (celebrate > 0) {
      celebrate = Math.max(0, celebrate - dt);
      const k = 1 - celebrate / 1.6;
      spin = (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) * Math.PI * 2;
      if (celebrate === 0) spin = 0;
    }

    root.rotation.set(0.5 + rot.x, -0.72 + rot.y + spin + (reduced ? 0 : Math.sin(t * 0.35) * 0.12), 0);

    const dissolve = smooth(0.15, 0.52, progress);
    root.position.y = 0.6 + (reduced ? 0 : Math.sin(t * 1.4) * 0.08) + dissolve * 0.8;

    glitch *= Math.pow(0.02, dt);
    halftone.uniforms.uTime.value = t;
    halftone.uniforms.uGlitch.value = glitch;
    halftone.uniforms.uDissolve.value = dissolve;

    if (wire) {
      lineMat.opacity = 0.75 * (1 - dissolve);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    } else {
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(quadScene, quadCam);
    }
  }

  function kick() { if (!running) { clock.getDelta(); frame(); } }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
  kick();

  return {
    setProgress(p) {
      progress = p;
      canvas.style.opacity = p > 0.6 ? '0' : '1';
      kick();
    }
  };
}

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
