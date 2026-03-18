const rawVideo = document.getElementById("camera-raw");
const fxVideo = document.getElementById("camera-bg");
const fxCanvas = document.getElementById("fx-canvas");
const fxCtx = fxCanvas.getContext("2d");
const navButtons = Array.from(document.querySelectorAll(".nav-hold-btn"));
const views = Array.from(document.querySelectorAll(".view"));
const gameScoreEl = document.getElementById("game-score");
const gameBestEl = document.getElementById("game-best");
const gameStateEl = document.getElementById("game-state");

let cameraStream = null;
let handsEngine = null;
let handsReady = false;
let handLoopRunning = false;
let lastHandSentAt = 0;
let activePage = "home";
let holdButton = null;
let holdStartAt = 0;
let holdCooldownUntil = 0;
let lastFrameAt = performance.now();

const fingertip = {
  active: false,
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  vx: 0,
  vy: 0,
};

const letters = [];
const LETTER_SOURCE = "MIRRORX0123456789";
const HOLD_MS = 1000;
const PLAYER_RADIUS = 12;

const game = {
  running: false,
  score: 0,
  best: 0,
  spawnTimer: 0,
  obstacles: [],
};

const getVideoLayout = () => {
  const vw = rawVideo.videoWidth || 1280;
  const vh = rawVideo.videoHeight || 720;
  const cw = fxCanvas.width;
  const ch = fxCanvas.height;
  const scale = Math.min(cw / vw, ch / vh);
  const drawW = vw * scale;
  const drawH = vh * scale;
  const offsetX = (cw - drawW) / 2;
  const offsetY = (ch - drawH) / 2;
  return { drawW, drawH, offsetX, offsetY };
};

const resizeFxCanvas = () => {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
};

const createLetters = () => {
  letters.length = 0;
  const chars = LETTER_SOURCE.split("");
  const area = fxCanvas.width * fxCanvas.height;
  const count = Math.max(180, Math.min(420, Math.floor(area / 7000)));

  for (let i = 0; i < count; i += 1) {
    const char = chars[i % chars.length];
    letters.push({
      char,
      x: Math.random() * fxCanvas.width,
      y: Math.random() * fxCanvas.height,
      vx: (Math.random() - 0.5) * 1.8,
      vy: (Math.random() - 0.5) * 1.8,
      size: 12 + Math.random() * 18,
      alpha: 0.28 + Math.random() * 0.55,
    });
  }
};

const drawLetters = () => {
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

  const showFlow = activePage === "flow";
  const radius = 96;
  for (const letter of letters) {
    if (showFlow && fingertip.active) {
      const dx = letter.x - fingertip.x;
      const dy = letter.y - fingertip.y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius && dist > 0.001) {
        const force = ((radius - dist) / radius) * 1.38;
        const nx = dx / dist;
        const ny = dy / dist;
        letter.vx += nx * force + fingertip.vx * 0.03;
        letter.vy += ny * force + fingertip.vy * 0.03;
      }
    }

    letter.vx *= 0.986;
    letter.vy *= 0.986;
    letter.x += letter.vx;
    letter.y += letter.vy;

    if (letter.x < 8 || letter.x > fxCanvas.width - 8) {
      letter.vx *= -0.9;
      letter.x = Math.max(8, Math.min(fxCanvas.width - 8, letter.x));
    }
    if (letter.y < 8 || letter.y > fxCanvas.height - 8) {
      letter.vy *= -0.9;
      letter.y = Math.max(8, Math.min(fxCanvas.height - 8, letter.y));
    }

    if (showFlow) {
      fxCtx.font = `700 ${letter.size}px Outfit, sans-serif`;
      fxCtx.fillStyle = `rgba(245, 248, 255, ${letter.alpha})`;
      fxCtx.shadowBlur = 14;
      fxCtx.shadowColor = "rgba(255,255,255,0.3)";
      fxCtx.fillText(letter.char, letter.x, letter.y);
    }
  }

  if (fingertip.active) {
    fxCtx.beginPath();
    fxCtx.arc(fingertip.x, fingertip.y, 11, 0, Math.PI * 2);
    fxCtx.fillStyle = "rgba(165, 244, 255, 0.86)";
    fxCtx.shadowBlur = 16;
    fxCtx.shadowColor = "rgba(165, 244, 255, 0.8)";
    fxCtx.fill();
  }
};

const resetGame = () => {
  game.running = true;
  game.score = 0;
  game.spawnTimer = 0;
  game.obstacles = [];
  if (gameStateEl) {
    gameStateEl.textContent = "Game running - dodge the orbs.";
  }
  if (gameScoreEl) {
    gameScoreEl.textContent = "0.0";
  }
  if (gameBestEl) {
    gameBestEl.textContent = game.best.toFixed(1);
  }
};

const updateGame = (dt) => {
  if (activePage !== "game") {
    return;
  }

  if (!game.running) {
    return;
  }

  game.score += dt;
  game.spawnTimer += dt;
  if (gameScoreEl) {
    gameScoreEl.textContent = game.score.toFixed(1);
  }

  const targetCount = Math.min(4 + Math.floor(game.score / 4), 16);
  const spawnInterval = Math.max(0.28, 0.78 - game.score * 0.015);
  if (game.spawnTimer >= spawnInterval && game.obstacles.length < targetCount) {
    game.spawnTimer = 0;
    const edge = Math.floor(Math.random() * 4);
    const radius = 10 + Math.random() * 16;
    const speed = 90 + Math.min(220, game.score * 8) + Math.random() * 70;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;

    if (edge === 0) {
      x = -radius;
      y = Math.random() * fxCanvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed * 0.35;
    } else if (edge === 1) {
      x = fxCanvas.width + radius;
      y = Math.random() * fxCanvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed * 0.35;
    } else if (edge === 2) {
      x = Math.random() * fxCanvas.width;
      y = -radius;
      vy = speed;
      vx = (Math.random() - 0.5) * speed * 0.35;
    } else {
      x = Math.random() * fxCanvas.width;
      y = fxCanvas.height + radius;
      vy = -speed;
      vx = (Math.random() - 0.5) * speed * 0.35;
    }

    game.obstacles.push({ x, y, vx, vy, r: radius });
  }

  game.obstacles = game.obstacles.filter((orb) => {
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;

    const inside =
      orb.x > -80 &&
      orb.x < fxCanvas.width + 80 &&
      orb.y > -80 &&
      orb.y < fxCanvas.height + 80;

    if (!inside) {
      return false;
    }

    if (fingertip.active) {
      const dx = orb.x - fingertip.x;
      const dy = orb.y - fingertip.y;
      const dist = Math.hypot(dx, dy);
      if (dist < orb.r + PLAYER_RADIUS) {
        game.running = false;
        game.best = Math.max(game.best, game.score);
        if (gameBestEl) {
          gameBestEl.textContent = game.best.toFixed(1);
        }
        if (gameStateEl) {
          gameStateEl.textContent = "Hit! Hold on Game button for 1s to restart.";
        }
        return false;
      }
    }

    return true;
  });

  for (const orb of game.obstacles) {
    fxCtx.beginPath();
    fxCtx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    fxCtx.fillStyle = "rgba(255, 130, 130, 0.86)";
    fxCtx.shadowBlur = 18;
    fxCtx.shadowColor = "rgba(255,120,120,0.9)";
    fxCtx.fill();
  }
};

const setPage = (pageName) => {
  if (pageName === activePage) {
    return;
  }

  activePage = pageName;
  navButtons.forEach((button) => {
    const isActive = button.dataset.page === pageName;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.classList.remove("switch-pop");
      requestAnimationFrame(() => {
        button.classList.add("switch-pop");
      });
      setTimeout(() => {
        button.classList.remove("switch-pop");
      }, 380);
    }
  });
  views.forEach((view) => {
    view.classList.toggle("active", view.id === `page-${pageName}`);
  });

  if (pageName === "game") {
    resetGame();
  }
};

const pickButtonUnderFinger = () => {
  if (!fingertip.active) {
    return null;
  }

  for (const button of navButtons) {
    const rect = button.getBoundingClientRect();
    const inside =
      fingertip.x >= rect.left &&
      fingertip.x <= rect.right &&
      fingertip.y >= rect.top &&
      fingertip.y <= rect.bottom;
    if (inside) {
      return button;
    }
  }
  return null;
};

const updateHoldNav = (time) => {
  const hovered = pickButtonUnderFinger();
  if (!hovered || time < holdCooldownUntil) {
    holdButton = null;
    holdStartAt = 0;
    navButtons.forEach((button) => button.style.setProperty("--hold-progress", "0"));
    return;
  }

  if (holdButton !== hovered) {
    holdButton = hovered;
    holdStartAt = time;
  }

  const progress = Math.min((time - holdStartAt) / HOLD_MS, 1);
  navButtons.forEach((button) => {
    button.style.setProperty("--hold-progress", button === holdButton ? String(progress) : "0");
  });

  if (progress >= 1) {
    setPage(holdButton.dataset.page);
    holdCooldownUntil = time + 300;
    holdButton = null;
    holdStartAt = 0;
    navButtons.forEach((button) => button.style.setProperty("--hold-progress", "0"));
  }
};

const animateFx = (time) => {
  const now = time || performance.now();
  const dt = Math.min(0.05, (now - lastFrameAt) / 1000);
  lastFrameAt = now;

  updateHoldNav(time || performance.now());
  drawLetters();
  updateGame(dt);
  requestAnimationFrame(animateFx);
};

const updateFingertip = (x, y) => {
  fingertip.prevX = fingertip.x;
  fingertip.prevY = fingertip.y;
  fingertip.x = x;
  fingertip.y = y;
  fingertip.vx = fingertip.x - fingertip.prevX;
  fingertip.vy = fingertip.y - fingertip.prevY;
};

const setupHandTracking = async () => {
  if (typeof window.Hands !== "function") {
    return;
  }

  handsEngine = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  handsEngine.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.6,
  });

  handsEngine.onResults((results) => {
    const hand = results.multiHandLandmarks?.[0];
    if (!hand) {
      fingertip.active = false;
      return;
    }

    const tip = hand[8];
    const layout = getVideoLayout();
    const x = layout.offsetX + (1 - tip.x) * layout.drawW;
    const y = layout.offsetY + tip.y * layout.drawH;
    updateFingertip(x, y);
    fingertip.active = true;
  });

  handsReady = true;
};

const runHandLoop = async () => {
  if (handLoopRunning) {
    return;
  }
  handLoopRunning = true;

  const step = async (time) => {
    if (handsReady && rawVideo.readyState >= 2) {
      if (time - lastHandSentAt > 34) {
        lastHandSentAt = time;
        try {
          await handsEngine.send({ image: rawVideo });
        } catch (error) {
          console.warn("Hand tracking frame failed.", error);
        }
      }
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const startCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return;
  }

  if (cameraStream) {
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        resizeMode: "none",
      },
      audio: false,
    });

    cameraStream = stream;
    rawVideo.srcObject = stream;
    fxVideo.srcObject = stream;

    const track = stream.getVideoTracks()[0];
    const caps = track.getCapabilities ? track.getCapabilities() : null;
    if (caps && "zoom" in caps && track.applyConstraints) {
      const minZoom = caps.zoom?.min;
      if (typeof minZoom === "number") {
        try {
          await track.applyConstraints({ advanced: [{ zoom: minZoom }] });
        } catch (zoomError) {
          console.warn("Zoom reset not supported on this device.", zoomError);
        }
      }
    }

    await setupHandTracking();
    runHandLoop();
  } catch (error) {
    console.error(error);
  }
};

window.addEventListener("resize", () => {
  resizeFxCanvas();
  createLetters();
});

resizeFxCanvas();
createLetters();
if (gameBestEl) {
  gameBestEl.textContent = game.best.toFixed(1);
}
animateFx();
startCamera();
