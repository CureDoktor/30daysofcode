const offsetXInput = document.getElementById("offset-x");
const offsetYInput = document.getElementById("offset-y");
const blurInput = document.getElementById("blur");
const spreadInput = document.getElementById("spread");
const opacityInput = document.getElementById("opacity");
const insetInput = document.getElementById("inset");
const shadowColorInput = document.getElementById("shadow-color");
const boxColorInput = document.getElementById("box-color");

const offsetXValue = document.getElementById("offset-x-value");
const offsetYValue = document.getElementById("offset-y-value");
const blurValue = document.getElementById("blur-value");
const spreadValue = document.getElementById("spread-value");
const opacityValue = document.getElementById("opacity-value");

const shadowBox = document.getElementById("shadow-box");
const cssOutput = document.getElementById("css-output");
const copyBtn = document.getElementById("copy-btn");
const randomBtn = document.getElementById("random-btn");

const presetSoftBtn = document.getElementById("preset-soft");
const presetHardBtn = document.getElementById("preset-hard");
const presetFloatingBtn = document.getElementById("preset-floating");

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const setLabels = () => {
  offsetXValue.textContent = `${offsetXInput.value}px`;
  offsetYValue.textContent = `${offsetYInput.value}px`;
  blurValue.textContent = `${blurInput.value}px`;
  spreadValue.textContent = `${spreadInput.value}px`;
  opacityValue.textContent = Number(opacityInput.value).toFixed(2);
};

const render = () => {
  setLabels();

  const { r, g, b } = hexToRgb(shadowColorInput.value);
  const alpha = Number(opacityInput.value).toFixed(2);
  const inset = insetInput.checked ? "inset " : "";

  const shadowValue = `${inset}${offsetXInput.value}px ${offsetYInput.value}px ${blurInput.value}px ${spreadInput.value}px rgba(${r}, ${g}, ${b}, ${alpha})`;

  shadowBox.style.boxShadow = shadowValue;
  shadowBox.style.backgroundColor = boxColorInput.value;
  shadowBox.style.transform = `translateY(${Math.max(-10, -Math.abs(Number(offsetYInput.value)) * 0.08)}px)`;

  cssOutput.textContent = `box-shadow: ${shadowValue};`;
};

const applyPreset = (preset) => {
  offsetXInput.value = String(preset.x);
  offsetYInput.value = String(preset.y);
  blurInput.value = String(preset.blur);
  spreadInput.value = String(preset.spread);
  opacityInput.value = String(preset.opacity);
  insetInput.checked = Boolean(preset.inset);
  shadowColorInput.value = preset.shadow;
  boxColorInput.value = preset.box;
  render();
};

const randomHex = () => {
  const value = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${value}`;
};

const randomize = () => {
  offsetXInput.value = String(Math.floor(Math.random() * 101) - 50);
  offsetYInput.value = String(Math.floor(Math.random() * 101) - 50);
  blurInput.value = String(Math.floor(Math.random() * 81) + 8);
  spreadInput.value = String(Math.floor(Math.random() * 41) - 20);
  opacityInput.value = (Math.random() * 0.55 + 0.15).toFixed(2);
  insetInput.checked = Math.random() > 0.72;
  shadowColorInput.value = randomHex();
  boxColorInput.value = randomHex();
  render();
};

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

presetSoftBtn.addEventListener("click", () => {
  applyPreset({
    x: 14,
    y: 14,
    blur: 34,
    spread: -6,
    opacity: 0.24,
    inset: false,
    shadow: "#111827",
    box: "#ffffff",
  });
});

presetHardBtn.addEventListener("click", () => {
  applyPreset({
    x: 10,
    y: 10,
    blur: 0,
    spread: 2,
    opacity: 0.36,
    inset: false,
    shadow: "#111827",
    box: "#ffffff",
  });
});

presetFloatingBtn.addEventListener("click", () => {
  applyPreset({
    x: 0,
    y: 24,
    blur: 52,
    spread: -10,
    opacity: 0.3,
    inset: false,
    shadow: "#1e3a8a",
    box: "#fefefe",
  });
});

randomBtn.addEventListener("click", randomize);

[
  offsetXInput,
  offsetYInput,
  blurInput,
  spreadInput,
  opacityInput,
  insetInput,
  shadowColorInput,
  boxColorInput,
].forEach((input) => {
  input.addEventListener("input", render);
});

render();
