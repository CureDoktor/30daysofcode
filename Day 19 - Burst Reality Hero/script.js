const faceStage = document.getElementById("face-stage");
const faceRobot = document.getElementById("face-robot");
const hackRing = document.getElementById("hack-ring");
const heroCopy = document.querySelector(".hero-copy");
const lowerText = document.querySelector(".hero-copy p:last-of-type");
const navInteractiveSelector = ".brand, .navbar a, .nav-btn";

const state = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.5,
  radius: 0,
  tradius: 0,
  tick: 0,
  down: 0,
  tDown: 0,
  deform: 0,
  tDeform: 0,
  lastX: window.innerWidth * 0.5,
  lastY: window.innerHeight * 0.5
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

const lowerWordSpans = [];
if (lowerText) {
  const raw = (lowerText.textContent || "").trim();
  const words = raw.split(/\s+/).filter(Boolean);
  lowerText.textContent = "";
  for (let i = 0; i < words.length; i += 1) {
    const span = document.createElement("span");
    span.className = "bottom-word";
    span.style.setProperty("--wi", String(i));
    span.textContent = words[i];
    lowerText.append(span);
    lowerWordSpans.push(span);
    if (i < words.length - 1) lowerText.append(document.createTextNode(" "));
  }
}

const HACK_COUNT = 28;
const hackChars = [];
if (hackRing) {
  for (let i = 0; i < HACK_COUNT; i += 1) {
    const el = document.createElement("span");
    el.className = "hack-char";
    el.textContent = String(Math.floor(Math.random() * 10));
    hackRing.append(el);
    hackChars.push(el);
  }
}

function setTargetFromEvent(event) {
  state.tx = clamp(event.clientX, 0, window.innerWidth);
  state.ty = clamp(event.clientY, 0, window.innerHeight);
  const overNavInteractive = !!event.target?.closest?.(navInteractiveSelector);
  if (overNavInteractive) {
    state.tradius = 0;
    state.tDown = 0;
    return;
  }
  state.tradius = clamp(Math.max(window.innerWidth, window.innerHeight) * 0.082, 96, 205);
}

window.addEventListener("pointermove", setTargetFromEvent);
window.addEventListener("pointerdown", (event) => {
  if (!faceStage || !event.target?.closest?.("#face-stage")) return;
  state.tDown = 1;
});
window.addEventListener("pointerup", () => {
  state.tDown = 0;
});
window.addEventListener("pointerleave", () => {
  state.tradius = 0;
  state.tDown = 0;
});

function render() {
  state.tick += 1;
  // Keep reveal center exactly under the live cursor (no XY lag).
  state.x = state.tx;
  state.y = state.ty;
  state.radius = lerp(state.radius, state.tradius, 0.18);
  state.down = lerp(state.down, state.tDown, 0.2);

  const vx = state.x - state.lastX;
  const vy = state.y - state.lastY;
  const speed = Math.hypot(vx, vy);
  state.lastX = state.x;
  state.lastY = state.y;

  state.tDeform = clamp(speed * 0.018 + state.down * 0.2, 0, 0.24);
  state.deform = lerp(state.deform, state.tDeform, 0.18);

  const x = state.x;
  const y = state.y;
  const rx = state.radius * (1 + state.deform);
  const ry = state.radius * (1 - state.deform * 0.72);
  const robotStyles = getComputedStyle(faceRobot);
  const robotRect = faceRobot.getBoundingClientRect();
  const fxPercent = Number.parseFloat(robotStyles.getPropertyValue("--fx")) || 0;
  const fyPercent = Number.parseFloat(robotStyles.getPropertyValue("--fy")) || 0;
  // Compensate robot translate() so reveal center stays exactly under cursor.
  const revealX = x - (fxPercent / 100) * robotRect.width;
  const revealY = y - (fyPercent / 100) * robotRect.height;

  // Keep reveal center exactly under cursor/ring center.
  faceRobot.style.setProperty("--rxpx", `${revealX.toFixed(2)}px`);
  faceRobot.style.setProperty("--rypx", `${revealY.toFixed(2)}px`);
  faceRobot.style.setProperty("--revealx", `${rx.toFixed(2)}px`);
  faceRobot.style.setProperty("--revealy", `${ry.toFixed(2)}px`);

  if (heroCopy) {
    const copyRect = heroCopy.getBoundingClientRect();
    const localX = x - copyRect.left;
    const localY = y - copyRect.top;
    heroCopy.style.setProperty("--text-cut-x", `${localX.toFixed(2)}px`);
    heroCopy.style.setProperty("--text-cut-y", `${localY.toFixed(2)}px`);
    heroCopy.style.setProperty("--text-cut-rx", `${rx.toFixed(2)}px`);
    heroCopy.style.setProperty("--text-cut-ry", `${ry.toFixed(2)}px`);
  }

  if (hackRing) {
    hackRing.style.setProperty("--cx", `${x.toFixed(2)}px`);
    hackRing.style.setProperty("--cy", `${y.toFixed(2)}px`);
    hackRing.style.setProperty("--ring-rx", `${rx.toFixed(2)}px`);
    hackRing.style.setProperty("--ring-ry", `${ry.toFixed(2)}px`);
    hackRing.style.setProperty("--hack-opacity", (state.radius / 130).toFixed(3));

    const t = performance.now() * 0.002;
    for (let i = 0; i < hackChars.length; i += 1) {
      const el = hackChars[i];
      const baseA = (i / hackChars.length) * Math.PI * 2;
      const wobble = Math.sin(t * 1.4 + i * 0.8) * 0.08;
      const a = baseA + t * 0.45 + wobble;
      const px = x + Math.cos(a) * rx;
      const py = y + Math.sin(a) * ry;
      const opacity = clamp((state.radius / 170) * (0.65 + 0.35 * Math.sin(t * 2.1 + i)), 0, 1);
      el.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px) translate(-50%, -50%)`;
      el.style.opacity = opacity.toFixed(3);

      if ((state.tick + i) % 7 === 0) {
        el.textContent = String(Math.floor(Math.random() * 10));
      }
    }
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
