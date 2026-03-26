const canvas = document.getElementById("trail-canvas");
const ctx = canvas.getContext("2d");

const controls = {
  trailType: document.getElementById("trail-type"),
  size: document.getElementById("size"),
  speed: document.getElementById("speed"),
  fade: document.getElementById("fade"),
  opacity: document.getElementById("opacity"),
  gradientEnabled: document.getElementById("gradient-enabled"),
  colorA: document.getElementById("color-a"),
  colorB: document.getElementById("color-b"),
  demoBtn: document.getElementById("demo-btn"),
  copyBtn: document.getElementById("copy-btn"),
  shareBtn: document.getElementById("share-btn")
};

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.5
};

const settings = {
  trailType: "glow",
  size: 28,
  speed: 18,
  fade: 8,
  opacity: 85,
  gradientEnabled: true,
  colorA: "#5ee6ff",
  colorB: "#b86bff",
  demoMode: false
};

const trail = [];
const maxTrail = 130;
let width = 0;
let height = 0;
let dpr = 1;
let lastTime = performance.now();
let pulse = 0;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgba(hex, alpha = 1) {
  const raw = hex.replace("#", "");
  const valid = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
  const int = Number.parseInt(valid, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readUI() {
  settings.trailType = controls.trailType.value;
  settings.size = Number(controls.size.value);
  settings.speed = Number(controls.speed.value);
  settings.fade = Number(controls.fade.value);
  settings.opacity = Number(controls.opacity.value);
  settings.gradientEnabled = controls.gradientEnabled.checked;
  settings.colorA = controls.colorA.value;
  settings.colorB = controls.colorB.value;
  writeUrlState();
}

function writeUrlState() {
  const params = new URLSearchParams();
  params.set("type", settings.trailType);
  params.set("size", String(settings.size));
  params.set("speed", String(settings.speed));
  params.set("fade", String(settings.fade));
  params.set("opacity", String(settings.opacity));
  params.set("ga", settings.gradientEnabled ? "1" : "0");
  params.set("a", settings.colorA.replace("#", ""));
  params.set("b", settings.colorB.replace("#", ""));
  params.set("demo", settings.demoMode ? "1" : "0");
  history.replaceState(null, "", `?${params.toString()}`);
}

function loadUrlState() {
  const params = new URLSearchParams(location.search);
  const has = (k) => params.get(k) !== null;
  if (has("type")) settings.trailType = params.get("type");
  if (has("size")) settings.size = clamp(Number(params.get("size")), 8, 60);
  if (has("speed")) settings.speed = clamp(Number(params.get("speed")), 6, 35);
  if (has("fade")) settings.fade = clamp(Number(params.get("fade")), 2, 20);
  if (has("opacity")) settings.opacity = clamp(Number(params.get("opacity")), 20, 100);
  if (has("ga")) settings.gradientEnabled = params.get("ga") === "1";
  if (has("a")) settings.colorA = `#${params.get("a").slice(0, 6)}`;
  if (has("b")) settings.colorB = `#${params.get("b").slice(0, 6)}`;
  if (has("demo")) settings.demoMode = params.get("demo") === "1";
}

function syncUI() {
  controls.trailType.value = settings.trailType;
  controls.size.value = String(settings.size);
  controls.speed.value = String(settings.speed);
  controls.fade.value = String(settings.fade);
  controls.opacity.value = String(settings.opacity);
  controls.gradientEnabled.checked = settings.gradientEnabled;
  controls.colorA.value = settings.colorA;
  controls.colorB.value = settings.colorB;
  controls.demoBtn.textContent = `Demo mode: ${settings.demoMode ? "On" : "Off"}`;
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function addTrailPoint(x, y, movement) {
  trail.unshift({
    x,
    y,
    life: 1,
    age: 0,
    movement
  });
  if (trail.length > maxTrail) trail.length = maxTrail;
}

function updatePointer(dt, time) {
  if (settings.demoMode) {
    const t = time * 0.00042;
    const radiusX = width * 0.26;
    const radiusY = height * 0.24;
    pointer.tx = width * 0.5 + Math.cos(t * 1.9) * radiusX;
    pointer.ty = height * 0.5 + Math.sin(t * 2.8) * radiusY;
  }

  const smooth = settings.speed / 100;
  const prevX = pointer.x;
  const prevY = pointer.y;
  pointer.x = lerp(pointer.x, pointer.tx, smooth * dt * 1.35);
  pointer.y = lerp(pointer.y, pointer.ty, smooth * dt * 1.35);

  const movement = Math.hypot(pointer.x - prevX, pointer.y - prevY);
  pulse = lerp(pulse, clamp(movement * 0.085, 0, 1), 0.18);

  if (movement > 0.25) addTrailPoint(pointer.x, pointer.y, movement);
}

function updateTrail(dt) {
  const decay = settings.fade / 1000;
  for (let i = trail.length - 1; i >= 0; i -= 1) {
    const p = trail[i];
    p.age += dt;
    p.life -= decay * dt;
    if (p.life <= 0) trail.splice(i, 1);
  }
}

function drawBackdrop() {
  ctx.globalCompositeOperation = "source-over";
  const bg = ctx.createRadialGradient(width * 0.5, height * 0.45, 30, width * 0.5, height * 0.5, Math.max(width, height) * 0.65);
  bg.addColorStop(0, "rgba(9, 13, 28, 0.25)");
  bg.addColorStop(1, "rgba(3, 4, 8, 0.5)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

function drawGlowTrail() {
  if (trail.length < 2) return;
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < trail.length - 1; i += 1) {
    const p = trail[i];
    const n = trail[i + 1];
    const t = i / Math.max(trail.length - 1, 1);
    const alpha = p.life * (settings.opacity / 100) * (1 - t) * 0.9;
    const color = settings.gradientEnabled
      ? lerpColor(settings.colorA, settings.colorB, t, alpha)
      : hexToRgba(settings.colorA, alpha);

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, settings.size * (0.36 - t * 0.22));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = settings.size * (1.8 - t * 0.9);
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(n.x, n.y);
    ctx.stroke();

    const r = settings.size * (0.35 - t * 0.22) + pulse * 4;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawDotTrail() {
  if (!trail.length) return;
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < trail.length; i += 1) {
    const p = trail[i];
    const t = i / Math.max(trail.length - 1, 1);
    const alpha = p.life * (settings.opacity / 100) * (1 - t) * 0.85;
    const radius = Math.max(1, settings.size * (0.22 - t * 0.16) + pulse * 2.6);
    const color = settings.gradientEnabled
      ? lerpColor(settings.colorA, settings.colorB, t, alpha)
      : hexToRgba(settings.colorA, alpha);

    ctx.fillStyle = color;
    ctx.shadowBlur = settings.size * 1.2;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawLineTrail() {
  if (trail.length < 4) return;
  ctx.globalCompositeOperation = "lighter";
  const pts = trail.slice(0, Math.min(70, trail.length));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length - 2; i += 1) {
    const xc = (pts[i].x + pts[i + 1].x) * 0.5;
    const yc = (pts[i].y + pts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }

  const lineAlpha = settings.opacity / 100;
  const baseColor = settings.gradientEnabled
    ? lerpColor(settings.colorA, settings.colorB, 0.4 + pulse * 0.3, lineAlpha * 0.8)
    : hexToRgba(settings.colorA, lineAlpha * 0.8);

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = settings.size * (0.16 + pulse * 0.05);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = settings.size * (0.95 + pulse * 0.5);
  ctx.shadowColor = baseColor;
  ctx.stroke();

  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const t = i / Math.max(pts.length - 1, 1);
    const alpha = p.life * (settings.opacity / 100) * (1 - t) * 0.35;
    const c = settings.gradientEnabled
      ? lerpColor(settings.colorA, settings.colorB, t, alpha)
      : hexToRgba(settings.colorA, alpha);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.8, settings.size * 0.06 * (1 - t)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function lerpColor(a, b, t, alpha = 1) {
  const ar = Number.parseInt(a.slice(1, 3), 16);
  const ag = Number.parseInt(a.slice(3, 5), 16);
  const ab = Number.parseInt(a.slice(5, 7), 16);

  const br = Number.parseInt(b.slice(1, 3), 16);
  const bg = Number.parseInt(b.slice(3, 5), 16);
  const bb = Number.parseInt(b.slice(5, 7), 16);

  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

function render(time) {
  const dt = clamp((time - lastTime) / 16.67, 0.6, 2.5);
  lastTime = time;

  updatePointer(dt, time);
  updateTrail(dt);
  drawBackdrop();

  if (settings.trailType === "glow") drawGlowTrail();
  if (settings.trailType === "dots") drawDotTrail();
  if (settings.trailType === "line") drawLineTrail();

  requestAnimationFrame(render);
}

function applyShareFeedback(button, text) {
  const original = button.textContent;
  button.textContent = text;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1200);
}

function buildCodeSnippet() {
  return `/* Cursor Trail Generator Preset */\n:root {\n  --trail-type: ${settings.trailType};\n  --trail-size: ${settings.size}px;\n  --trail-speed: ${settings.speed};\n  --trail-fade: ${settings.fade};\n  --trail-opacity: ${settings.opacity}%;\n  --trail-color-a: ${settings.colorA};\n  --trail-color-b: ${settings.colorB};\n  --trail-gradient: ${settings.gradientEnabled};\n}\n\n/* Share URL */\n${location.href}`;
}

controls.demoBtn.addEventListener("click", () => {
  settings.demoMode = !settings.demoMode;
  controls.demoBtn.textContent = `Demo mode: ${settings.demoMode ? "On" : "Off"}`;
  writeUrlState();
});

controls.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildCodeSnippet());
    applyShareFeedback(controls.copyBtn, "Copied!");
  } catch {
    applyShareFeedback(controls.copyBtn, "Copy failed");
  }
});

controls.shareBtn.addEventListener("click", async () => {
  const shareUrl = location.href;
  try {
    if (navigator.share) {
      await navigator.share({
        title: "Cursor Trail Generator",
        text: "Check out this cursor trail effect preset.",
        url: shareUrl
      });
      applyShareFeedback(controls.shareBtn, "Shared!");
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    applyShareFeedback(controls.shareBtn, "Link copied!");
  } catch {
    applyShareFeedback(controls.shareBtn, "Share failed");
  }
});

Object.values(controls).forEach((el) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
    el.addEventListener("input", readUI);
    el.addEventListener("change", readUI);
  }
});

window.addEventListener("mousemove", (event) => {
  if (settings.demoMode) return;
  pointer.tx = event.clientX;
  pointer.ty = event.clientY;
});

window.addEventListener("touchmove", (event) => {
  if (settings.demoMode) return;
  const touch = event.touches[0];
  if (!touch) return;
  pointer.tx = touch.clientX;
  pointer.ty = touch.clientY;
}, { passive: true });

window.addEventListener("resize", resize);

loadUrlState();
syncUI();
resize();
writeUrlState();
requestAnimationFrame(render);
