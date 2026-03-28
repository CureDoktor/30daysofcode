const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  centerX: 0,
  centerY: 0,
  pointerX: 0,
  pointerY: 0,
  pointerPrevX: 0,
  pointerPrevY: 0,
  pointerSpeed: 0,
  lastInputAt: performance.now(),
  autoDemo: false,
  demoPhase: 0,
  proximity: 0,
  pulse: 0,
  wasInside: false
};

const orb = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  scale: 1,
  scaleV: 0
};

const particles = [];
const PARTICLE_COUNT = 168;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.centerX = state.width * 0.5;
  state.centerY = state.height * 0.5;

  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

  if (orb.x === 0 && orb.y === 0) {
    orb.x = state.centerX;
    orb.y = state.centerY;
  }
}

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push({
      angle: (Math.PI * 2 * i) / PARTICLE_COUNT,
      baseRadius: 82 + Math.random() * 120,
      size: 0.45 + Math.random() * 1.5,
      orbitSpeed: 0.001 + Math.random() * 0.0021,
      offset: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.7 + Math.random() * 1.4,
      drift: (Math.random() - 0.5) * 0.32,
      alpha: 0.1 + Math.random() * 0.22
    });
  }
}

function trackPointer(x, y) {
  state.pointerX = x;
  state.pointerY = y;
  state.autoDemo = false;
  state.lastInputAt = performance.now();
}

window.addEventListener("mousemove", (event) => {
  trackPointer(event.clientX, event.clientY);
});

window.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    trackPointer(touch.clientX, touch.clientY);
  },
  { passive: true }
);

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    state.autoDemo = !state.autoDemo;
    if (state.autoDemo) state.demoPhase = 0;
  }
});

function updateAutoDemo(dt, timeMs) {
  const idleFor = timeMs - state.lastInputAt;
  if (idleFor > 3200) state.autoDemo = true;
  if (!state.autoDemo) return;

  state.demoPhase += dt * 0.012;
  const rx = state.width * 0.26;
  const ry = state.height * 0.22;
  state.pointerX = state.centerX + Math.cos(state.demoPhase * 1.6) * rx;
  state.pointerY = state.centerY + Math.sin(state.demoPhase * 2.2) * ry;
}

function updatePhysics(dt, time) {
  updateAutoDemo(dt, time);

  const ptrDx = state.pointerX - state.pointerPrevX;
  const ptrDy = state.pointerY - state.pointerPrevY;
  const ptrInstantSpeed = Math.hypot(ptrDx, ptrDy) / Math.max(dt, 0.001);
  state.pointerSpeed = lerp(state.pointerSpeed, ptrInstantSpeed, 0.12);
  state.pointerPrevX = state.pointerX;
  state.pointerPrevY = state.pointerY;

  const toPointerX = state.pointerX - state.centerX;
  const toPointerY = state.pointerY - state.centerY;
  const distToCenterPointer = Math.hypot(toPointerX, toPointerY);
  const influenceRadius = Math.min(state.width, state.height) * 0.42;
  const proximity = clamp(1 - distToCenterPointer / influenceRadius, 0, 1);
  state.proximity = lerp(state.proximity, proximity, 0.12);

  const maxPull = 86;
  const pullStrength = Math.pow(state.proximity, 1.75);
  const targetX = state.centerX + (distToCenterPointer > 0 ? (toPointerX / distToCenterPointer) * maxPull * pullStrength : 0);
  const targetY = state.centerY + (distToCenterPointer > 0 ? (toPointerY / distToCenterPointer) * maxPull * pullStrength : 0);

  // Cursor speed adds slight inertial lag to make motion feel alive.
  const speedBoost = clamp(state.pointerSpeed * 0.012, -34, 34);
  const inertialX = ptrDx * speedBoost;
  const inertialY = ptrDy * speedBoost;
  const springTargetX = targetX + inertialX * state.proximity;
  const springTargetY = targetY + inertialY * state.proximity;

  const k = 0.074;
  const damp = 0.84;
  orb.vx = (orb.vx + (springTargetX - orb.x) * k * dt) * damp;
  orb.vy = (orb.vy + (springTargetY - orb.y) * k * dt) * damp;
  orb.x += orb.vx;
  orb.y += orb.vy;

  const targetScale = 1 + state.proximity * 0.11 + clamp(state.pointerSpeed * 0.0032, 0, 0.06);
  orb.scale += (targetScale - orb.scale) * 0.11 * dt;

  const distanceOrbPointer = Math.hypot(state.pointerX - orb.x, state.pointerY - orb.y);
  const inside = distanceOrbPointer < 48;
  if (inside && !state.wasInside) {
    state.pulse = 1;
  }
  state.wasInside = inside;
  state.pulse *= 0.92;
}

function drawFieldLines() {
  if (state.proximity < 0.06) return;
  const amount = 18;
  for (let i = 0; i < amount; i += 1) {
    const t = i / Math.max(amount - 1, 1);
    const wave = Math.sin(performance.now() * 0.0016 + i * 0.9) * 16;
    const bend = (t - 0.5) * 180;
    const cp1x = lerp(orb.x, state.pointerX, 0.28) + bend * 0.48 + wave;
    const cp1y = lerp(orb.y, state.pointerY, 0.33) - 18 - Math.abs(bend) * 0.05;
    const cp2x = lerp(orb.x, state.pointerX, 0.7) - bend * 0.52 - wave * 0.65;
    const cp2y = lerp(orb.y, state.pointerY, 0.72) + 18 + Math.cos(i * 0.7) * 10;

    const alpha = (0.012 + (1 - Math.abs(t - 0.5) * 1.8) * 0.045) * state.proximity;
    ctx.strokeStyle = `rgba(35, 52, 105, ${alpha})`;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(orb.x, orb.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, state.pointerX, state.pointerY);
    ctx.stroke();
  }
}

function drawParticles(time) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  for (const p of particles) {
    p.angle += p.orbitSpeed * (1 + state.proximity * 0.9);
    const radiusJitter = Math.sin(time * 0.0012 + p.offset) * 11 + p.drift * 12;
    const radius = p.baseRadius + radiusJitter - state.proximity * 14;

    let x = orb.x + Math.cos(p.angle + p.offset) * radius;
    let y = orb.y + Math.sin(p.angle * 1.08 + p.offset) * radius;

    const toCursorX = x - state.pointerX;
    const toCursorY = y - state.pointerY;
    const dist = Math.hypot(toCursorX, toCursorY);
    if (dist < 150 && dist > 0.001) {
      const push = (1 - dist / 150) * 13 * state.proximity;
      x += (toCursorX / dist) * push;
      y += (toCursorY / dist) * push;
    }

    const twinkle = 0.55 + 0.45 * Math.sin(time * 0.001 * p.twinkleSpeed + p.offset);
    const alpha = p.alpha * twinkle * (0.45 + state.proximity * 0.95);
    const size = p.size + state.proximity * 0.95;

    ctx.fillStyle = `rgba(29, 41, 79, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOrb(time) {
  const baseRadius = 56 + state.pulse * 10;
  const radius = baseRadius * orb.scale;
  const toPointerX = state.pointerX - orb.x;
  const toPointerY = state.pointerY - orb.y;
  const angleToPointer = Math.atan2(toPointerY, toPointerX);
  const deform = 0.03 + state.proximity * 0.12 + clamp(state.pointerSpeed * 0.0013, 0, 0.08);

  const shadowAlpha = 0.11 + state.proximity * 0.1;
  const shadowWidth = radius * (1.05 + state.proximity * 0.16);
  const shadowHeight = radius * (0.34 + state.proximity * 0.08);
  ctx.fillStyle = `rgba(22, 28, 44, ${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(orb.x, orb.y + radius * 0.92, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  const glowRadius = radius * (1.55 + state.proximity * 0.42);
  const glow = ctx.createRadialGradient(orb.x, orb.y, radius * 0.2, orb.x, orb.y, glowRadius);
  glow.addColorStop(0, `rgba(82, 107, 205, ${0.1 + state.proximity * 0.1})`);
  glow.addColorStop(1, "rgba(82, 107, 205, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  const points = [];
  const segments = 26;
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const directional = Math.cos(a - angleToPointer) * deform;
    const wobble = Math.sin(time * 0.004 + i * 0.7) * 0.02 * state.proximity;
    const r = radius * (1 + directional + wobble);
    points.push({
      x: orb.x + Math.cos(a) * r,
      y: orb.y + Math.sin(a) * r
    });
  }

  const orbPath = new Path2D();
  const first = points[0];
  orbPath.moveTo(first.x, first.y);
  for (let i = 0; i < points.length; i += 1) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;
    orbPath.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  orbPath.closePath();

  const speedShift = clamp(state.pointerSpeed * 0.02, 0, 24);
  const grad = ctx.createRadialGradient(
    orb.x - radius * 0.35,
    orb.y - radius * 0.44,
    radius * 0.1,
    orb.x + radius * 0.28,
    orb.y + radius * 0.34,
    radius * 1.2
  );
  grad.addColorStop(0, `hsl(${228 + speedShift * 0.2} 45% 31%)`);
  grad.addColorStop(0.48, `hsl(${243 + speedShift * 0.3} 38% 18%)`);
  grad.addColorStop(1, "hsl(248 26% 8%)");
  ctx.fillStyle = grad;
  ctx.fill(orbPath);

  const gloss = ctx.createRadialGradient(
    orb.x - radius * 0.4,
    orb.y - radius * 0.46,
    0,
    orb.x - radius * 0.34,
    orb.y - radius * 0.36,
    radius * 0.72
  );
  gloss.addColorStop(0, `rgba(255,255,255,${0.36 + state.proximity * 0.08})`);
  gloss.addColorStop(0.44, `rgba(255,255,255,${0.08 + state.proximity * 0.05})`);
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fill(orbPath);

  // Perforated texture for a "rupicast" premium material feel.
  ctx.save();
  ctx.clip(orbPath);
  ctx.globalCompositeOperation = "destination-out";
  const holeDensity = 140;
  for (let i = 0; i < holeDensity; i += 1) {
    const a = (i / holeDensity) * Math.PI * 2 + Math.sin(time * 0.0005 + i) * 0.06;
    const ring = 0.16 + (i % 14) / 14 * 0.78;
    const jitter = Math.sin(time * 0.001 + i * 0.6) * 2.2;
    const hx = orb.x + Math.cos(a) * radius * ring + jitter;
    const hy = orb.y + Math.sin(a * 1.06) * radius * ring + jitter * 0.5;
    const holeSize = 0.55 + (i % 5) * 0.32 + state.proximity * 0.3;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + state.proximity * 0.06})`;
    ctx.beginPath();
    ctx.arc(hx, hy, holeSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function render(time) {
  const dt = clamp((time - (render.prevTime || time)) / 16.67, 0.8, 1.8);
  render.prevTime = time;

  updatePhysics(dt, time);

  ctx.clearRect(0, 0, state.width, state.height);
  drawFieldLines();
  drawParticles(time);
  drawOrb(time);

  requestAnimationFrame(render);
}

resize();
initParticles();
state.pointerX = state.centerX;
state.pointerY = state.centerY;
state.pointerPrevX = state.centerX;
state.pointerPrevY = state.centerY;
orb.x = state.centerX;
orb.y = state.centerY;

window.addEventListener("resize", resize);
requestAnimationFrame(render);
