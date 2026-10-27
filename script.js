/* =====================================================================
   ✏️  EDIT EVERYTHING HERE — all texts on the page come from this block
   ===================================================================== */
const CONFIG = {
  // Used in the greeting: "З днем народження, <name>!"
  name: 'Лера',

  // Text under the envelope
  envelopeHint: 'Відкрий мене ✨',

  // Letter: one string per paragraph
  letter: [
    'Сьогодні твій день, і я хочу, щоб ти знала, яка ти для мене особлива.',
    'Дякую тобі за тебе. Я тебе дуже люблю.',
    'Дуже в тебе вірю і знаю що у тебе все вийде. Ти неймовірна, розумна, красива і добра.',
  ],
  signature: 'Твій Сашко ♥',

  wish: 'Загадай бажання і задмухай свічки 🎂',
  candles: 5, // looks best with up to ~12

  // Shown after the candles are blown out. \n = new line
  finalMessage: 'З днем народження! ✨\nЯ тебе кохаю.',
  photo: 'assets/us.jpg', // '' to hide the photo
  photoCaption: 'Сашко і Лера ♥',

  // Background music, starts when she opens the envelope. e.g. 'assets/song.mp3'
  music: '',
};
/* ===================================================================== */

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TAU = Math.PI * 2;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

let W = innerWidth;
let H = innerHeight;

/* ---------- Canvases ---------- */

const skyCanvas = $('#sky');
const fxCanvas = $('#fx');
const skyCtx = skyCanvas.getContext('2d');
const fxCtx = fxCanvas.getContext('2d');

function resize() {
  W = innerWidth;
  H = innerHeight;
  for (const [c, ctx] of [[skyCanvas, skyCtx], [fxCanvas, fxCtx]]) {
    c.width = W * DPR;
    c.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
}
resize();
addEventListener('resize', resize);

/* ---------- Starry sky ---------- */

// Star positions are 0..1 so they survive resizes (e.g. mobile URL bar)
const stars = Array.from({ length: Math.min(450, Math.round((W * H) / 3000)) }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() ** 2 * 1.4 + 0.3,
  a: rand(0.3, 0.9),
  speed: rand(0.0006, 0.0026),
  phase: rand(0, TAU),
  color: pick(['#ffffff', '#ffffff', '#fff4d6', '#dfe6ff']),
}));
let shooting = null;
let nextShooting = performance.now() + 2500;

function drawSky(now, dt) {
  const ctx = skyCtx;
  ctx.clearRect(0, 0, W, H);

  for (const s of stars) {
    ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(now * s.speed + s.phase));
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
    ctx.fill();
  }

  if (!shooting && now > nextShooting) {
    shooting = { x: rand(0.3, 1) * W, y: rand(0, 0.35) * H, vx: -rand(7, 11), vy: rand(3, 5), life: 55, max: 55 };
    nextShooting = now + rand(4500, 11000);
  }
  if (shooting) {
    const s = shooting;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    const len = 14;
    const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len, s.y - s.vy * len);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = Math.max(0, s.life / s.max);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len);
    ctx.stroke();
    if (s.life <= 0) shooting = null;
  }
  ctx.globalAlpha = 1;
}

/* ---------- Particles: confetti, fireworks, heart ---------- */

const particles = [];
let trailFade = 0.3; // lower = longer trails
let fxDirty = false;

function spawn(o) {
  const p = Object.assign({
    x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 1,
    life: 100, size: 2, color: '#fff', shape: 'dot',
    rot: 0, vr: 0, glow: true, twinkle: false, phase: rand(0, TAU),
    tx: null, ty: null, ease: 0.05,
  }, o);
  p.max = p.life;
  particles.push(p);
  return p;
}

function starPath(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

const heart = { cx: 0, cy: 0 };

function drawFx(now, dt) {
  const ctx = fxCtx;
  if (!particles.length) {
    if (fxDirty) { ctx.clearRect(0, 0, W, H); fxDirty = false; }
    return;
  }
  fxDirty = true;

  // Fade previous frame instead of clearing → soft trails
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(0,0,0,${trailFade})`;
  ctx.fillRect(0, 0, W, H);

  const beat = 1 + 0.06 * Math.max(0, Math.sin(now * 0.006)) ** 6;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (p.hx != null) {
      p.tx = heart.cx + p.hx * beat;
      p.ty = heart.cy + p.hy * beat;
    }
    if (p.tx != null) {
      p.x += (p.tx - p.x) * Math.min(1, p.ease * dt);
      p.y += (p.ty - p.y) * Math.min(1, p.ease * dt);
    } else {
      const d = p.drag ** dt;
      p.vx *= d;
      p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    p.rot += p.vr * dt;
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
      if (p.onDeath) p.onDeath(p);
      continue;
    }

    let alpha = p.life === Infinity ? 1 : Math.min(1, p.life / (p.max * 0.35));
    if (p.twinkle) alpha *= 0.6 + 0.4 * Math.sin(now * 0.012 + p.phase);
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
    ctx.fillStyle = p.color;

    if (p.shape === 'star') {
      starPath(ctx, p.x, p.y, p.size, p.rot);
      ctx.fill();
    } else if (p.shape === 'rect') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.rot * 3)); // paper "flutter"
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

const CONFETTI_COLORS = ['#ffd98a', '#ff9ec7', '#c4a8ff', '#9ee7ff', '#fff3c4'];

function confetti(x, y) {
  trailFade = 0.55;
  for (let i = 0; i < 160; i++) {
    const a = -Math.PI / 2 + rand(-0.65, 0.65) * Math.PI;
    const sp = rand(4, 13);
    const isStar = i % 2 === 0;
    spawn({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      g: 0.13,
      drag: 0.982,
      life: rand(150, 240),
      shape: isStar ? 'star' : 'rect',
      size: isStar ? rand(3, 7) : rand(7, 12),
      color: isStar ? pick(['#ffd98a', '#fff3c4']) : pick(CONFETTI_COLORS),
      glow: isStar,
      rot: rand(0, TAU),
      vr: rand(-0.2, 0.2),
    });
  }
}

const FIREWORK_PALETTES = [
  ['#ffd98a', '#ffb86b', '#fff3c4'],
  ['#ff9ec7', '#ffd1e6', '#ffffff'],
  ['#c4a8ff', '#9ee7ff', '#ffffff'],
  ['#9ee7ff', '#ffd98a', '#ff9ec7'],
];

function explode(x, y) {
  const palette = pick(FIREWORK_PALETTES);
  const n = Math.round(rand(70, 110));
  const power = rand(2.4, 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(-0.05, 0.05);
    const sp = power * rand(0.55, 1);
    spawn({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      g: 0.035,
      drag: 0.975,
      life: rand(70, 110),
      size: rand(1.2, 2.4),
      color: pick(palette),
      twinkle: Math.random() < 0.35,
    });
  }
}

function launchFirework(tx = rand(0.15, 0.85) * W, ty = rand(0.12, 0.42) * H) {
  const x0 = tx + rand(-60, 60);
  const y0 = H + 10;
  const g = 0.06;
  const vy = -Math.sqrt(2 * g * (y0 - ty));
  const frames = -vy / g;
  spawn({
    x: x0, y: y0,
    vx: (tx - x0) / frames,
    vy, g,
    life: frames,
    size: 2,
    color: '#fff3d6',
    onDeath: (p) => explode(p.x, p.y),
  });
}

async function fireworksShow(duration) {
  trailFade = 0.22;
  const end = performance.now() + duration;
  while (performance.now() < end) {
    launchFirework();
    await wait(rand(350, 700));
  }
}

let heartParticles = [];

function formHeart() {
  heart.cx = W / 2;
  heart.cy = H * 0.42;
  const s = Math.min(W, H) / 38;
  const layers = [[150, 1, '#ff9ec7', 2.2], [80, 0.62, '#ffd98a', 1.6]];
  heartParticles = [];
  for (const [n, k, color, size] of layers) {
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      heartParticles.push(spawn({
        x: rand(0, W),
        y: rand(0, H),
        hx: 16 * Math.sin(t) ** 3 * s * k,
        hy: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s * k,
        ease: rand(0.025, 0.06),
        life: Infinity,
        size,
        color,
        twinkle: true,
      }));
    }
  }
}

function releaseHeart() {
  for (const p of heartParticles) {
    p.hx = p.tx = null;
    p.vx = (p.x - heart.cx) * 0.03 + rand(-1, 1);
    p.vy = (p.y - heart.cy) * 0.03 + rand(-1, 1);
    p.g = 0.02;
    p.drag = 0.97;
    p.life = p.max = rand(60, 100);
  }
  heartParticles = [];
}

/* ---------- Main loop ---------- */

let last = performance.now();
function frame(now) {
  const dt = Math.min(3, (now - last) / 16.667);
  last = now;
  drawSky(now, dt);
  drawFx(now, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Scenes ---------- */

let currentScene = $('#intro');

async function goTo(id) {
  const next = $('#' + id);
  currentScene.classList.remove('visible');
  await wait(750);
  currentScene.classList.remove('shown');
  next.classList.add('shown');
  scrollTo(0, 0);
  next.offsetHeight; // force layout so the fade-in transition runs
  next.classList.add('visible');
  currentScene = next;
  await wait(800);
}

/* ---------- Music ---------- */

let audio = null;
const musicToggle = $('#music-toggle');

function startMusic() {
  if (!CONFIG.music) return;
  audio = new Audio(CONFIG.music);
  audio.loop = true;
  audio.volume = 0.6;
  audio.play().catch(() => musicToggle.classList.add('muted'));
  musicToggle.hidden = false;
}

musicToggle.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    musicToggle.classList.remove('muted');
  } else {
    audio.pause();
    musicToggle.classList.add('muted');
  }
});

/* ---------- 1. Envelope ---------- */

const envelope = $('#envelope');
const hint = $('#hint');
hint.textContent = CONFIG.envelopeHint;

envelope.addEventListener('click', async () => {
  if (envelope.classList.contains('open')) return;
  startMusic();
  envelope.classList.add('open');
  hint.classList.add('gone');
  await wait(1300);
  const r = envelope.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height * 0.2);
  await wait(1000);
  await goTo('letter');
  typeLetter();
});

/* ---------- 2. Letter ---------- */

$('#title').textContent = `З днем народження, ${CONFIG.name}!`;
$('#signature').textContent = CONFIG.signature;

async function typeLetter() {
  const box = $('#letter-text');
  const paper = $('#paper');
  let skip = false;
  paper.addEventListener('click', () => { skip = true; }, { once: true });

  const paragraphs = CONFIG.letter.map((text) => {
    // The not-yet-typed part stays in the layout (invisible) so lines don't jump
    const p = document.createElement('p');
    const shown = document.createElement('span');
    const rest = document.createElement('span');
    rest.className = 'ghost';
    rest.textContent = text;
    p.append(shown, rest);
    box.append(p);
    return { shown, rest, chars: Array.from(text) };
  });

  for (const { shown, rest, chars } of paragraphs) {
    shown.classList.add('caret');
    for (let i = 1; i <= chars.length && !skip; i++) {
      shown.textContent = chars.slice(0, i).join('');
      rest.textContent = chars.slice(i).join('');
      await wait(/[.,!?…—:]/.test(chars[i - 1]) ? 260 : 34);
    }
    shown.textContent = chars.join('');
    rest.textContent = '';
    shown.classList.remove('caret');
    if (!skip) await wait(450);
  }

  $('#signature').classList.add('visible');
  await wait(600);
  $('#to-cake').classList.remove('hidden');
}

$('#to-cake').addEventListener('click', () => goTo('cake-scene'));

/* ---------- 3. Cake ---------- */

$('#wish').textContent = CONFIG.wish;

const cake = $('#cake');
const candleCount = Math.max(1, Math.round(CONFIG.candles));
let lit = candleCount;

for (let i = 0; i < candleCount; i++) {
  const candle = document.createElement('div');
  candle.className = 'candle';
  candle.style.setProperty('--i', i);
  candle.innerHTML = '<span class="flame"></span>';
  candle.addEventListener('click', () => blowOut(candle));
  $('#candles').append(candle);
}

function blowOut(candle) {
  if (candle.classList.contains('out')) return;
  candle.classList.add('out');
  const smoke = document.createElement('span');
  smoke.className = 'smoke';
  candle.append(smoke);
  if (--lit === 0) finale();
}

const micBtn = $('#mic-btn');
const cakeHint = $('#cake-hint');
let micStream = null;

micBtn.addEventListener('click', async () => {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    micBtn.hidden = true;
    cakeHint.textContent = 'Мікрофон недоступний, тож просто торкнись вогників 🙂';
    return;
  }
  micBtn.textContent = '🌬️ Дмухай!';
  micBtn.disabled = true;

  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ac.createAnalyser();
  analyser.fftSize = 1024;
  ac.createMediaStreamSource(micStream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let blowing = 0;

  const listen = () => {
    if (lit === 0) {
      micStream.getTracks().forEach((t) => t.stop());
      ac.close();
      return;
    }
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const rms = Math.sqrt(sum / buf.length);

    cake.style.setProperty('--wind', Math.min(1, rms * 5).toFixed(2));
    if (rms > 0.12) {
      if (++blowing % 8 === 0) {
        const litCandles = [...document.querySelectorAll('.candle:not(.out)')];
        blowOut(pick(litCandles));
      }
    } else {
      blowing = 0;
    }
    requestAnimationFrame(listen);
  };
  listen();
});

/* ---------- 4. Finale ---------- */

const photo = $('#photo');
if (CONFIG.photo) {
  photo.src = CONFIG.photo;
  $('#caption').textContent = CONFIG.photoCaption;
} else {
  $('#polaroid').remove();
}
$('#final-message').textContent = CONFIG.finalMessage;

async function finale() {
  cake.style.setProperty('--wind', 0);
  await wait(1000);
  await goTo('finale');
  await fireworksShow(4000);
  await wait(900);
  formHeart();
  await wait(4500);
  releaseHeart();
  await wait(700);
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));

  // Occasional fireworks in the background
  setInterval(() => {
    trailFade = 0.22;
    launchFirework(rand(0.1, 0.9) * W, rand(0.08, 0.3) * H);
  }, 5000);
}

$('#again').addEventListener('click', () => fireworksShow(2500));

/* Preview shortcuts while editing: open index.html#letter, #cake or #finale */
const jump = location.hash.slice(1);
if (jump === 'letter') goTo('letter').then(typeLetter);
if (jump === 'cake') goTo('cake-scene');
if (jump === 'finale') finale();
