const host = document.getElementById("webgl-host");
const canvas = document.createElement("canvas");
host.append(canvas);
const cursorDot = document.getElementById("cursor-dot");
const cursorRing = document.getElementById("cursor-ring");

const ctx = canvas.getContext("2d");
if (!ctx) {
  host.innerHTML = "<p style='padding:1rem;color:#efefef'>Canvas nije dostupan u ovom browseru.</p>";
  throw new Error("2D canvas not supported");
}

const state = {
  yaw: 0.2,
  pitch: -0.25,
  targetYaw: 0.2,
  targetPitch: -0.25,
  zoom: 1,
  dragging: false,
  lastX: 0,
  lastY: 0,
  mouseX: 0,
  mouseY: 0,
  mouseInside: false,
  cursorX: 0,
  cursorY: 0,
  cursorRingX: 0,
  cursorRingY: 0,
  cursorHover: false,
  cursorDown: false,
  cursorScale: 1
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

const DOT_COUNT = 1600;
const dots = Array.from({ length: DOT_COUNT }, () => {
  const u = Math.random() * 2 - 1;
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return {
    x: r * Math.cos(t),
    y: u,
    z: r * Math.sin(t),
    size: 0.9 + Math.random() * 1.9,
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0
  };
});

function rotatePoint(x, y, z, yaw, pitch) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;

  return { x: x1, y: y2, z: z2 };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(host.clientWidth * dpr));
  const h = Math.max(1, Math.floor(host.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function drawSphereBase(cx, cy, radius) {
  const shadowY = cy + radius * 1.1;
  const shadowW = radius * 0.9;
  const shadowH = radius * 0.24;

  const shadow = ctx.createRadialGradient(cx, shadowY, 1, cx, shadowY, shadowW);
  shadow.addColorStop(0, "rgba(0, 0, 0, 0.36)");
  shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const grad = ctx.createRadialGradient(
    cx - radius * 0.42,
    cy - radius * 0.48,
    radius * 0.1,
    cx,
    cy,
    radius * 1.06
  );
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.52, "#f1f1f1");
  grad.addColorStop(0.82, "#d8d8d8");
  grad.addColorStop(1, "#c8c8c8");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw(now) {
  resize();
  const t = now * 0.001;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const radius = Math.min(w, h) * 0.305 * state.zoom;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  drawSphereBase(cx, cy, radius);

  if (!state.dragging) {
    state.targetYaw += 0.0032;
  }
  state.yaw = lerp(state.yaw, state.targetYaw, 0.08);
  state.pitch = lerp(state.pitch, state.targetPitch, 0.08);

  const projected = [];
  const repelRadius = radius * 0.2;

  for (const dot of dots) {
    const p = rotatePoint(dot.x, dot.y, dot.z, state.yaw, state.pitch);
    const depth = (p.z + 1) * 0.5;
    const persp = 0.55 + depth * 0.55;
    const sx = cx + p.x * radius * persp;
    const sy = cy + p.y * radius * persp;

    if (state.mouseInside) {
      const dx = sx + dot.ox - state.mouseX;
      const dy = sy + dot.oy - state.mouseY;
      const dist = Math.hypot(dx, dy);
      if (dist < repelRadius && dist > 0.001) {
        const power = (1 - dist / repelRadius) * 1.7 * (0.25 + depth);
        dot.vx += (dx / dist) * power;
        dot.vy += (dy / dist) * power;
      }
    }

    dot.vx *= 0.9;
    dot.vy *= 0.9;
    dot.ox = (dot.ox + dot.vx) * 0.92;
    dot.oy = (dot.oy + dot.vy) * 0.92;

    projected.push({
      x: sx + dot.ox,
      y: sy + dot.oy,
      z: p.z,
      depth,
      size: dot.size * (0.45 + depth * 0.95)
    });
  }

  projected.sort((a, b) => a.z - b.z);
  for (const p of projected) {
    if (p.z < -0.98) continue;
    const alpha = 0.5 + p.depth * 0.5;
    ctx.fillStyle = `rgba(10, 10, 10, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  const sheen = ctx.createRadialGradient(
    cx - radius * 0.38 + Math.sin(t * 1.1) * radius * 0.03,
    cy - radius * 0.42,
    radius * 0.02,
    cx - radius * 0.35,
    cy - radius * 0.38,
    radius * 0.42
  );
  sheen.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (cursorDot && cursorRing) {
    const targetScale = (state.cursorHover ? 1.35 : 1) * (state.cursorDown ? 0.82 : 1);
    state.cursorScale = lerp(state.cursorScale, targetScale, 0.2);
    state.cursorRingX = lerp(state.cursorRingX, state.cursorX, 0.22);
    state.cursorRingY = lerp(state.cursorRingY, state.cursorY, 0.22);
    cursorDot.style.transform = `translate3d(${state.cursorX}px, ${state.cursorY}px, 0)`;
    cursorRing.style.transform = `translate3d(${state.cursorRingX}px, ${state.cursorRingY}px, 0) scale(${state.cursorScale})`;
  }

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);

host.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  host.setPointerCapture(event.pointerId);
  state.cursorDown = true;
  if (cursorRing) cursorRing.classList.add("active");
});

host.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
  state.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
  state.mouseInside = true;

  if (!state.dragging) return;
  const dx = event.clientX - state.lastX;
  const dy = event.clientY - state.lastY;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  state.targetYaw += dx * 0.005;
  state.targetPitch = clamp(state.targetPitch + dy * 0.0045, -1.15, 1.15);
});

host.addEventListener("pointerup", (event) => {
  state.dragging = false;
  host.releasePointerCapture(event.pointerId);
  state.cursorDown = false;
  if (cursorRing) cursorRing.classList.remove("active");
});

host.addEventListener("pointerleave", () => {
  state.dragging = false;
  state.mouseInside = false;
  state.cursorDown = false;
  if (cursorRing) cursorRing.classList.remove("active");
});

host.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const dir = Math.sign(event.deltaY);
    state.zoom = clamp(state.zoom - dir * 0.05, 0.75, 1.35);
  },
  { passive: false }
);

window.addEventListener("pointermove", (event) => {
  state.cursorX = event.clientX;
  state.cursorY = event.clientY;

  if (cursorDot && cursorRing) {
    cursorDot.style.opacity = "1";
    cursorRing.style.opacity = "1";
    const interactive = event.target.closest(".glass, #webgl-host, .x-badge");
    state.cursorHover = Boolean(interactive);
    cursorRing.classList.toggle("hovering", Boolean(interactive));
  }
});

window.addEventListener("pointerdown", () => {
  state.cursorDown = true;
  if (cursorRing) cursorRing.classList.add("active");
});

window.addEventListener("pointerup", () => {
  state.cursorDown = false;
  if (cursorRing) cursorRing.classList.remove("active");
});

requestAnimationFrame(draw);
