const rawVideo = document.getElementById("camera-raw");
const fxVideo = document.getElementById("camera-bg");
const fxCanvas = document.getElementById("fx-canvas");
const fxCtx = fxCanvas.getContext("2d");

let cameraStream = null;
let handsEngine = null;
let handsReady = false;
let handLoopRunning = false;
let lastHandSentAt = 0;

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
const LETTER_SOURCE = "MIRRORWEBSITE";

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

  const radius = 96;
  for (const letter of letters) {
    if (fingertip.active) {
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

    fxCtx.font = `700 ${letter.size}px Outfit, sans-serif`;
    fxCtx.fillStyle = `rgba(245, 248, 255, ${letter.alpha})`;
    fxCtx.shadowBlur = 14;
    fxCtx.shadowColor = "rgba(255,255,255,0.3)";
    fxCtx.fillText(letter.char, letter.x, letter.y);
  }
};

const animateFx = () => {
  drawLetters();
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
animateFx();
startCamera();
