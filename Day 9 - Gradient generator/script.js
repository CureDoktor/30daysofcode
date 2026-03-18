const angleInput = document.getElementById("angle");
const angleValue = document.getElementById("angle-value");
const colorA = document.getElementById("color-a");
const colorB = document.getElementById("color-b");
const colorC = document.getElementById("color-c");
const preview = document.getElementById("preview");
const cssOutput = document.getElementById("css-output");
const randomBtn = document.getElementById("random-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const animateBtn = document.getElementById("animate-btn");
const copyBtn = document.getElementById("copy-btn");
const presetButtons = document.querySelectorAll(".preset");

const presets = {
  sunset: { angle: 120, colors: ["#ff7a7a", "#ffd17d", "#ff8fc7"] },
  neon: { angle: 145, colors: ["#71f2ff", "#7f8cff", "#c784ff"] },
  aqua: { angle: 90, colors: ["#7efff5", "#65cfff", "#7a8dff"] },
  violet: { angle: 210, colors: ["#8d7cff", "#d48fff", "#77a7ff"] },
};

let isAnimating = false;
let animationFrame = null;

const randomHex = () => {
  const value = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${value}`;
};

const buildGradient = () => {
  const angle = Number(angleInput.value);
  return `linear-gradient(${angle}deg, ${colorA.value} 0%, ${colorB.value} 48%, ${colorC.value} 100%)`;
};

const render = () => {
  const gradient = buildGradient();
  preview.style.background = gradient;
  angleValue.textContent = `${angleInput.value}deg`;
  cssOutput.textContent = `background: ${gradient};`;
};

const loopAngle = () => {
  if (!isAnimating) {
    return;
  }

  const current = Number(angleInput.value);
  angleInput.value = String((current + 0.35) % 360);
  render();
  animationFrame = requestAnimationFrame(loopAngle);
};

const toggleAnimation = () => {
  isAnimating = !isAnimating;
  animateBtn.textContent = `Animate: ${isAnimating ? "On" : "Off"}`;

  if (isAnimating) {
    loopAngle();
  } else if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
};

const applyPreset = (presetName) => {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  angleInput.value = String(preset.angle);
  [colorA.value, colorB.value, colorC.value] = preset.colors;
  render();
};

randomBtn.addEventListener("click", () => {
  angleInput.value = String(Math.floor(Math.random() * 361));
  colorA.value = randomHex();
  colorB.value = randomHex();
  colorC.value = randomHex();
  render();
});

shuffleBtn.addEventListener("click", () => {
  const colors = [colorA.value, colorB.value, colorC.value];
  colors.sort(() => Math.random() - 0.5);
  [colorA.value, colorB.value, colorC.value] = colors;
  render();
});

animateBtn.addEventListener("click", toggleAnimation);

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(cssOutput.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy CSS";
    }, 1100);
  } catch (error) {
    console.error(error);
  }
});

[angleInput, colorA, colorB, colorC].forEach((input) => {
  input.addEventListener("input", render);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
  });
});

render();
