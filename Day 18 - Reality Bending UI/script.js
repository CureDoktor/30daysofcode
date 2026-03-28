const scene = document.getElementById("scene");
const hero = document.getElementById("hero");
const headline = document.getElementById("headline");
const subline = document.getElementById("subline");
const buttons = [...document.querySelectorAll("[data-btn]")];
const floatingPanel = document.querySelector(".floating-panel");
const cursorDot = document.getElementById("cursor-dot");
const cursorRing = document.getElementById("cursor-ring");
const cursorGhostA = document.getElementById("cursor-ghost-a");
const cursorGhostB = document.getElementById("cursor-ghost-b");
const burstLayer = document.getElementById("burst-layer");

const state = {
  px: window.innerWidth * 0.5,
  py: window.innerHeight * 0.5,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.5,
  vx: 0,
  vy: 0,
  speed: 0,
  mx: 0.5,
  my: 0.5,
  hoverStrength: 0,
  cx: window.innerWidth * 0.5,
  cy: window.innerHeight * 0.5,
  crx: window.innerWidth * 0.5,
  cry: window.innerHeight * 0.5,
  gax: window.innerWidth * 0.5,
  gay: window.innerHeight * 0.5,
  gbx: window.innerWidth * 0.5,
  gby: window.innerHeight * 0.5,
  cursorHover: 0,
  cursorDown: 0,
  lastInputAt: performance.now(),
  autoDemo: false,
  demoPhase: 0,
  burstCooldown: 0
};

const splitTargets = [];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

function splitText(node) {
  const text = node.textContent || "";
  node.textContent = "";
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "split-char";
    span.textContent = ch;
    node.append(span);
    if (ch !== " ") splitTargets.push(span);
  }
}

splitText(headline);
splitText(subline);

function getHeroRect() {
  return hero.getBoundingClientRect();
}

function updateButtonRipple(button, x, y) {
  const rect = button.getBoundingClientRect();
  button.style.setProperty("--rx", `${x - rect.left}px`);
  button.style.setProperty("--ry", `${y - rect.top}px`);
  button.classList.remove("ripple-on");
  // Restart keyframe cleanly.
  void button.offsetWidth;
  button.classList.add("ripple-on");
}

window.addEventListener("pointermove", (event) => {
  state.tx = event.clientX;
  state.ty = event.clientY;
  state.cx = event.clientX;
  state.cy = event.clientY;
  state.lastInputAt = performance.now();
  state.autoDemo = false;
});

window.addEventListener("pointerdown", () => {
  state.cursorDown = 1;
});

window.addEventListener("pointerup", () => {
  state.cursorDown = 0;
});

for (const button of buttons) {
  button.addEventListener("pointerenter", (event) => {
    updateButtonRipple(button, event.clientX, event.clientY);
  });
  button.addEventListener("pointerdown", (event) => {
    updateButtonRipple(button, event.clientX, event.clientY);
  });
}

function updateTextDeformation() {
  const chroma = clamp(state.speed * 0.08, 0, 3.6);

  for (const char of splitTargets) {
    const rect = char.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = state.px - cx;
    const dy = state.py - cy;
    const dist = Math.hypot(dx, dy);
    const influence = clamp(1 - dist / 220, 0, 1);

    const stretchX = 1 + influence * 0.18 + Math.sin(performance.now() * 0.004 + cx * 0.02) * influence * 0.08;
    const stretchY = 1 - influence * 0.09 + Math.cos(performance.now() * 0.0037 + cy * 0.02) * influence * 0.05;
    const shiftX = (dx / (dist || 1)) * influence * 6;
    const shiftY = (dy / (dist || 1)) * influence * 3;

    char.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${stretchX}, ${stretchY})`;
    char.style.textShadow = `${chroma}px 0 rgba(110, 136, 255, 0.18), ${-chroma}px 0 rgba(199, 108, 255, 0.12)`;
  }
}

function updateButtons() {
  for (const btn of buttons) {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = state.px - cx;
    const dy = state.py - cy;
    const dist = Math.hypot(dx, dy);
    const influence = clamp(1 - dist / 190, 0, 1);

    const sx = 1 + influence * 0.22 + clamp(state.speed * 0.012, 0, 0.06);
    const sy = 1 - influence * 0.1;
    const rA = 999 - influence * 470;
    const rB = 999 - influence * 340;
    const tx = (dx / (dist || 1)) * influence * 8;
    const ty = (dy / (dist || 1)) * influence * 4;

    btn.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    btn.style.borderRadius = `${rA}px ${rB}px ${rA}px ${rB}px / ${rB}px ${rA}px ${rB}px ${rA}px`;

    const label = btn.querySelector(".btn-label");
    if (label) {
      label.style.transform = `translate(${tx * 0.25}px, ${ty * 0.25}px) scale(${1 + influence * 0.05}, ${1 - influence * 0.03})`;
    }
  }
}

function triggerBurst(x, y) {
  if (!burstLayer) return;
  const mk = (alt = false) => {
    const ring = document.createElement("span");
    ring.className = alt ? "burst-ring alt" : "burst-ring";
    ring.style.setProperty("--bx", `${x}px`);
    ring.style.setProperty("--by", `${y}px`);
    burstLayer.append(ring);
    ring.addEventListener("animationend", () => ring.remove(), { once: true });
  };
  mk(false);
  mk(true);
  hero.classList.remove("hyper");
  void hero.offsetWidth;
  hero.classList.add("hyper");
}

function render() {
  const now = performance.now();
  if (now - state.lastInputAt > 2400) {
    state.autoDemo = true;
  }

  if (state.autoDemo) {
    state.demoPhase += 0.015;
    const dx = Math.cos(state.demoPhase * 1.5) * (window.innerWidth * 0.18);
    const dy = Math.sin(state.demoPhase * 2.2) * (window.innerHeight * 0.14);
    state.tx = window.innerWidth * 0.5 + dx;
    state.ty = window.innerHeight * 0.5 + dy;
    state.cx = state.tx;
    state.cy = state.ty;
  }

  state.px = lerp(state.px, state.tx, 0.14);
  state.py = lerp(state.py, state.ty, 0.14);

  const vx = state.tx - state.px;
  const vy = state.ty - state.py;
  state.vx = lerp(state.vx, vx, 0.12);
  state.vy = lerp(state.vy, vy, 0.12);
  state.speed = lerp(state.speed, Math.hypot(state.vx, state.vy), 0.16);

  if (state.burstCooldown > 0) {
    state.burstCooldown -= 1;
  } else if (state.speed > 22) {
    triggerBurst(state.cx, state.cy);
    state.burstCooldown = 16;
  }

  const rect = getHeroRect();
  const localX = clamp((state.px - rect.left) / rect.width, 0, 1);
  const localY = clamp((state.py - rect.top) / rect.height, 0, 1);
  state.mx = lerp(state.mx, localX, 0.18);
  state.my = lerp(state.my, localY, 0.18);

  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const dist = Math.hypot(state.px - cx, state.py - cy);
  const hover = clamp(1 - dist / (Math.max(rect.width, rect.height) * 0.75), 0, 1);
  state.hoverStrength = lerp(state.hoverStrength, hover, 0.14);

  const tiltX = (state.my - 0.5) * -14;
  const tiltY = (state.mx - 0.5) * 18;
  const pushX = (state.mx - 0.5) * 16;
  const pushY = (state.my - 0.5) * 10;
  const scale = 1 + state.hoverStrength * 0.022 + clamp(state.speed * 0.003, 0, 0.02);

  hero.style.transform = `translate3d(${pushX}px, ${pushY}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
  hero.style.borderRadius = `${34 + state.hoverStrength * 14}px ${30 + state.hoverStrength * 18}px ${32 + state.hoverStrength * 16}px ${36 + state.hoverStrength * 14}px`;
  hero.style.setProperty("--mx", `${(state.mx * 100).toFixed(2)}%`);
  hero.style.setProperty("--my", `${(state.my * 100).toFixed(2)}%`);
  hero.style.setProperty("--overlay-opacity", `${0.28 + state.hoverStrength * 0.55}`);
  hero.style.boxShadow = `
    inset 0 1px 0 rgba(255,255,255,0.92),
    0 ${28 + state.hoverStrength * 16}px ${68 + state.hoverStrength * 18}px rgba(38,48,90,${0.2 + state.hoverStrength * 0.12})
  `;

  if (floatingPanel) {
    const fpX = (state.mx - 0.5) * 30;
    const fpY = (state.my - 0.5) * -20;
    floatingPanel.style.transform = `translate(${18 + fpX * 0.06}vw, ${-11 + fpY * 0.06}vh) rotate(${7 + (state.mx - 0.5) * 5}deg) scale(${1 + state.hoverStrength * 0.03})`;
    floatingPanel.style.opacity = `${0.45 + state.hoverStrength * 0.35}`;
  }

  updateTextDeformation();
  updateButtons();

  const hoverTarget = document.elementFromPoint(state.cx, state.cy);
  const isInteractive = !!hoverTarget?.closest(".liquid-btn, .split-char, .hero");
  state.cursorHover = lerp(state.cursorHover, isInteractive ? 1 : 0, 0.16);
  state.crx = lerp(state.crx, state.cx, 0.18);
  state.cry = lerp(state.cry, state.cy, 0.18);
  state.gax = lerp(state.gax, state.crx, 0.14);
  state.gay = lerp(state.gay, state.cry, 0.14);
  state.gbx = lerp(state.gbx, state.gax, 0.11);
  state.gby = lerp(state.gby, state.gay, 0.11);

  if (cursorDot && cursorRing && cursorGhostA && cursorGhostB) {
    const scale = (1 + state.cursorHover * 0.42) * (1 - state.cursorDown * 0.24);
    const speedGlow = clamp(state.speed * 0.09, 0, 0.7);
    const split = clamp(state.speed * 8, 0, 10);
    const speedLen = Math.hypot(state.vx, state.vy) || 1;
    const nx = state.vx / speedLen;
    const ny = state.vy / speedLen;
    const splitX = nx * split;
    const splitY = ny * split;
    const ghostOpacityA = 0.24 + state.cursorHover * 0.22 + speedGlow * 0.2;
    const ghostOpacityB = 0.14 + state.cursorHover * 0.18 + speedGlow * 0.16;
    cursorDot.style.opacity = "1";
    cursorRing.style.opacity = "1";
    cursorGhostA.style.opacity = `${ghostOpacityA}`;
    cursorGhostB.style.opacity = `${ghostOpacityB}`;
    cursorDot.style.transform = `translate3d(${state.cx}px, ${state.cy}px, 0) scale(${1 - state.cursorDown * 0.28})`;
    cursorRing.style.transform = `translate3d(${state.crx}px, ${state.cry}px, 0) scale(${scale})`;
    cursorRing.style.boxShadow = `
      ${splitX * 0.35}px ${splitY * 0.35}px ${20 + split * 0.8}px rgba(89, 229, 255, 0.28),
      ${-splitX * 0.35}px ${-splitY * 0.35}px ${20 + split * 0.8}px rgba(226, 118, 255, 0.24),
      inset 0 0 20px rgba(173, 127, 255, 0.12)
    `;
    cursorGhostA.style.transform = `translate3d(${state.gax + splitX * 0.45}px, ${state.gay + splitY * 0.45}px, 0) scale(${1 + state.cursorHover * 0.24 - state.cursorDown * 0.1})`;
    cursorGhostB.style.transform = `translate3d(${state.gbx - splitX * 0.35}px, ${state.gby - splitY * 0.35}px, 0) scale(${1 + state.cursorHover * 0.34 - state.cursorDown * 0.06})`;
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
