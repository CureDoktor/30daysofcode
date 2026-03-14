const cards = document.querySelectorAll(".js-tilt");
const levelButtons = document.querySelectorAll(".level-btn");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const carouselGrid = document.querySelector(".card-grid");

const hoverConfig = {
  tilt: 16,
  scale: 1.034,
  stiffness: 0.16,
  damping: 0.72,
};

const speedConfig = {
  slow: 0.00018,
  medium: 0.00034,
  fast: 0.00058,
};

const variantProfiles = {
  orbit: {
    tiltX: 0.9,
    tiltY: 1.02,
    roll: 4.6,
    stiffness: 1,
    damping: 1,
    scale: 1,
    contentX: 8,
    contentY: 7,
    logoX: 14,
    logoY: 12,
    demoAmp: 0.23,
    demoSpeed: 0.92,
  },
  snap: {
    tiltX: 1.18,
    tiltY: 1.23,
    roll: 6.8,
    stiffness: 1.28,
    damping: 0.9,
    scale: 1.03,
    contentX: 12,
    contentY: 9,
    logoX: 24,
    logoY: 18,
    demoAmp: 0.28,
    demoSpeed: 1.15,
  },
  drift: {
    tiltX: 0.72,
    tiltY: 0.8,
    roll: 3.2,
    stiffness: 0.8,
    damping: 1.1,
    scale: 0.995,
    contentX: 10,
    contentY: 8,
    logoX: 12,
    logoY: 10,
    demoAmp: 0.2,
    demoSpeed: 0.7,
  },
};

let speedLevel = "medium";
let lastPointerActivity = performance.now();
let demoModeActive = false;
let hoveredCardIndex = -1;
let carouselAngle = 0;
let carouselVelocity = 0;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const cardStates = Array.from(cards).map((card, index) => {
  const wrap = card.closest(".card-wrap");
  const accent = card.dataset.accent || "#61d4ff";
  const variantName = card.dataset.variant || "orbit";
  const variant = variantProfiles[variantName] || variantProfiles.orbit;
  card.style.setProperty("--accent", accent);

  let targetX = 0;
  let targetY = 0;
  let targetZ = 0;
  let targetScale = 1;
  let currentX = 0;
  let currentY = 0;
  let currentZ = 0;
  let currentScale = 1;
  let velocityX = 0;
  let velocityY = 0;
  let velocityZ = 0;
  let velocityScale = 0;
  let isInside = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let orbitX = 0;
  let orbitY = 0;
  let orbitDepth = 0;
  let wrapScale = 1;
  let wrapScaleVelocity = 0;
  let wrapLift = 0;
  let wrapLiftVelocity = 0;
  let targetWrapScale = 1;
  let targetWrapLift = 0;

  const tick = (dt) => {
    const stiffness = hoverConfig.stiffness * variant.stiffness;
    const damping = hoverConfig.damping * variant.damping;

    const springX = (targetX - currentX) * stiffness;
    const springY = (targetY - currentY) * stiffness;
    const springZ = (targetZ - currentZ) * (stiffness * 0.9);
    const springScale = (targetScale - currentScale) * (stiffness * 0.75);

    velocityX = velocityX * damping + springX * dt;
    velocityY = velocityY * damping + springY * dt;
    velocityZ = velocityZ * damping + springZ * dt;
    velocityScale = velocityScale * damping + springScale * dt;

    currentX += velocityX * dt;
    currentY += velocityY * dt;
    currentZ += velocityZ * dt;
    currentScale += velocityScale * dt;

    card.style.transform =
      `rotateX(${currentX}deg) rotateY(${currentY}deg) ` +
      `rotateZ(${currentZ}deg) scale3d(${currentScale}, ${currentScale}, ${currentScale})`;

    // Smoothly derive internal parallax from physical card state.
    card.style.setProperty("--content-x", `${currentY * 0.62}px`);
    card.style.setProperty("--content-y", `${-currentX * 0.62}px`);
    card.style.setProperty("--logo-x", `${currentY * 1.15}px`);
    card.style.setProperty("--logo-y", `${-currentX * 0.95}px`);

    const wrapSpringScale = (targetWrapScale - wrapScale) * 0.2;
    const wrapSpringLift = (targetWrapLift - wrapLift) * 0.18;
    wrapScaleVelocity = wrapScaleVelocity * 0.74 + wrapSpringScale * dt;
    wrapLiftVelocity = wrapLiftVelocity * 0.76 + wrapSpringLift * dt;
    wrapScale += wrapScaleVelocity * dt;
    wrapLift += wrapLiftVelocity * dt;

    if (wrap) {
      wrap.style.transform =
        `translate(-50%, -50%) translate(${orbitX}px, ${orbitY - wrapLift}px) scale(${wrapScale})`;
      wrap.style.zIndex = `${Math.floor(orbitDepth * 100) + (index === hoveredCardIndex ? 200 : 0)}`;
      wrap.style.filter = index === hoveredCardIndex
        ? "brightness(1.1)"
        : `brightness(${0.8 + orbitDepth * 0.25})`;
      wrap.style.opacity = `${0.72 + orbitDepth * 0.28}`;
    }
  };

  const setCenterVisual = () => {
    card.style.setProperty("--mouse-x", "50%");
    card.style.setProperty("--mouse-y", "50%");
    card.style.setProperty("--shine-x", "15%");
    card.style.setProperty("--shine-y", "12%");
    card.style.setProperty("--logo-x", "0px");
    card.style.setProperty("--logo-y", "0px");
  };

  const setAmbientVisual = (nx, ny) => {
    card.style.setProperty("--mouse-x", `${50 + nx * 24}%`);
    card.style.setProperty("--mouse-y", `${50 + ny * 21}%`);
    card.style.setProperty("--shine-x", `${-90 + (nx + 1) * 135}px`);
    card.style.setProperty("--shine-y", `${-90 + (ny + 1) * 118}px`);
    card.style.setProperty("--content-x", `${nx * variant.contentX * 0.5}px`);
    card.style.setProperty("--content-y", `${ny * variant.contentY * 0.5}px`);
    card.style.setProperty("--logo-x", `${nx * variant.logoX * 0.34}px`);
    card.style.setProperty("--logo-y", `${ny * variant.logoY * 0.34}px`);
  };

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const nx = x / rect.width - 0.5;
    const ny = y / rect.height - 0.5;
    const { tilt } = hoverConfig;
    lastPointerX = nx;
    lastPointerY = ny;

    targetX = -ny * tilt * variant.tiltX;
    targetY = nx * tilt * variant.tiltY;
    targetZ = nx * ny * variant.roll;
    targetScale = hoverConfig.scale * variant.scale;

    if (variantName === "snap") {
      const snapStep = 0.45;
      targetX = Math.round(targetX / snapStep) * snapStep;
      targetY = Math.round(targetY / snapStep) * snapStep;
      targetZ += nx * 1.45;
    } else if (variantName === "drift") {
      targetZ -= ny * 0.95;
    } else if (variantName === "orbit") {
      targetZ += Math.sin(nx * Math.PI * 2) * 0.8;
    }

    isInside = true;
    card.style.setProperty("--hovered", "1");

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.setProperty("--shine-x", `${x - 110}px`);
    card.style.setProperty("--shine-y", `${y - 110}px`);
    card.style.setProperty("--logo-x", `${nx * variant.logoX}px`);
    card.style.setProperty("--logo-y", `${ny * variant.logoY}px`);
  });

  card.addEventListener("pointerenter", () => {
    isInside = true;
    targetScale = hoverConfig.scale * variant.scale;
    card.style.setProperty("--hovered", "1");
    hoveredCardIndex = index;
  });

  card.addEventListener("pointerleave", () => {
    isInside = false;
    targetX = 0;
    targetY = 0;
    targetZ = 0;
    targetScale = 1;
    lastPointerX = 0;
    lastPointerY = 0;
    card.style.setProperty("--hovered", "0");
    setCenterVisual();
    if (hoveredCardIndex === index) {
      hoveredCardIndex = -1;
    }
  });

  setCenterVisual();

  return {
    index,
    wrap,
    variant,
    isInside: () => isInside,
    tick,
    setTarget: (x, y, z) => {
      targetX = x;
      targetY = y;
      targetZ = z;
    },
    setScale: (value) => {
      targetScale = value;
    },
    pointer: () => ({ x: lastPointerX, y: lastPointerY }),
    setOrbit: (x, y, depth, targetScaleValue, targetLiftValue) => {
      orbitX = x;
      orbitY = y;
      orbitDepth = depth;
      targetWrapScale = targetScaleValue;
      targetWrapLift = targetLiftValue;
    },
    setAmbientVisual,
    resetVisual: setCenterVisual,
  };
});

const idleDelayMs = 1700;
let lastFrameTime = performance.now();
const autoDemoLoop = (time) => {
  const frameMs = time - lastFrameTime;
  const dt = clamp(frameMs / 16.666, 0.6, 1.6);
  lastFrameTime = time;
  const idle = time - lastPointerActivity > idleDelayMs;
  const canDemo = idle && !prefersReducedMotion.matches;

  const baseSpeed = speedConfig[speedLevel];
  const autoSpeed = hoveredCardIndex === -1 ? baseSpeed : baseSpeed * 0.24;
  carouselVelocity *= hoveredCardIndex === -1 ? 0.955 : 0.92;
  carouselVelocity = clamp(carouselVelocity, -0.0031, 0.0031);
  carouselAngle += frameMs * (autoSpeed + carouselVelocity);

  if (carouselGrid) {
    const width = carouselGrid.clientWidth || 980;
    const radius = clamp(width * 0.29, 120, 270);
    const yRadius = radius * 0.48;
    const count = cardStates.length || 1;

    cardStates.forEach((state) => {
      const orbitAngle = carouselAngle + (state.index * Math.PI * 2) / count;
      const isFocused = state.index === hoveredCardIndex;
      const extraRadius = isFocused ? 64 : 0;
      const x = Math.cos(orbitAngle) * (radius + extraRadius);
      const y = Math.sin(orbitAngle) * yRadius - (isFocused ? 18 : 0);
      const depth = (Math.sin(orbitAngle) + 1) / 2;
      const scale = 0.84 + depth * 0.22 + (isFocused ? 0.14 : 0);
      const lift = isFocused ? 16 : 0;
      state.setOrbit(x, y, depth, scale, lift);
    });
  }

  if (canDemo) {
    demoModeActive = true;
    cardStates.forEach((state) => {
      if (state.isInside() || hoveredCardIndex !== -1) {
        return;
      }

      const { tilt } = hoverConfig;
      const phase = time * 0.001 * state.variant.demoSpeed + state.index * 1.35;
      const nx = Math.cos(phase * 0.92);
      const ny = Math.sin(phase * 0.78);
      const amp = state.variant.demoAmp;
      const tx = ny * tilt * amp * state.variant.tiltX;
      const ty = nx * tilt * amp * state.variant.tiltY;
      const tz = nx * ny * state.variant.roll * 0.45;
      state.setTarget(tx, ty, tz);
      state.setScale(1 + (hoverConfig.scale - 1) * 0.5 * state.variant.scale);
      state.setAmbientVisual(nx * 0.82, ny * 0.76);
    });
  } else if (demoModeActive) {
    demoModeActive = false;
    cardStates.forEach((state) => {
      if (state.isInside()) {
        return;
      }

      state.setTarget(0, 0, 0);
      state.setScale(1);
      state.resetVisual();
    });
  }

  cardStates.forEach((state) => {
    if (state.isInside()) {
      const p = state.pointer();
      state.setAmbientVisual(p.x * 0.52, p.y * 0.52);
    }
    state.tick(dt);
  });

  requestAnimationFrame(autoDemoLoop);
};

const bumpActivity = () => {
  lastPointerActivity = performance.now();
};

window.addEventListener("pointermove", bumpActivity);
window.addEventListener("pointerdown", bumpActivity);

if (carouselGrid) {
  carouselGrid.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      bumpActivity();

      // Wheel controls rotation with inertial carry.
      const delta = clamp(event.deltaY + event.deltaX * 0.6, -120, 120);
      carouselVelocity += delta * 0.0000032;
      carouselVelocity = clamp(carouselVelocity, -0.0031, 0.0031);
    },
    { passive: false }
  );
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { level } = button.dataset;
    if (!speedConfig[level]) {
      return;
    }

    speedLevel = level;
    levelButtons.forEach((item) => item.classList.toggle("active", item === button));
  });
});

requestAnimationFrame(autoDemoLoop);
