const tlInput = document.getElementById("tl");
const trInput = document.getElementById("tr");
const brInput = document.getElementById("br");
const blInput = document.getElementById("bl");

const tlValue = document.getElementById("tl-value");
const trValue = document.getElementById("tr-value");
const brValue = document.getElementById("br-value");
const blValue = document.getElementById("bl-value");

const lockAllInput = document.getElementById("lock-all");
const shapeColorInput = document.getElementById("shape-color");
const glowColorInput = document.getElementById("glow-color");
const canvasColorInput = document.getElementById("canvas-color");

const shape = document.getElementById("shape");
const preview = document.getElementById("preview");
const cssOutput = document.getElementById("css-output");
const copyBtn = document.getElementById("copy-btn");

const presetOrganicBtn = document.getElementById("preset-organic");
const presetCardBtn = document.getElementById("preset-card");
const presetPillBtn = document.getElementById("preset-pill");
const randomBtn = document.getElementById("random-btn");

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const syncLabels = () => {
  tlValue.textContent = `${tlInput.value}px`;
  trValue.textContent = `${trInput.value}px`;
  brValue.textContent = `${brInput.value}px`;
  blValue.textContent = `${blInput.value}px`;
};

const radiusString = () => `${tlInput.value}px ${trInput.value}px ${brInput.value}px ${blInput.value}px`;

const render = () => {
  syncLabels();

  const borderRadius = radiusString();
  const { r, g, b } = hexToRgb(glowColorInput.value);

  shape.style.borderRadius = borderRadius;
  shape.style.backgroundColor = shapeColorInput.value;
  shape.style.boxShadow = `0 0 0 1px rgba(255,255,255,0.24), 0 16px 36px rgba(${r}, ${g}, ${b}, 0.42)`;
  preview.style.backgroundColor = canvasColorInput.value;

  cssOutput.textContent = `border-radius: ${borderRadius};`;
};

const applyPreset = (preset) => {
  tlInput.value = String(preset.tl);
  trInput.value = String(preset.tr);
  brInput.value = String(preset.br);
  blInput.value = String(preset.bl);
  shapeColorInput.value = preset.shape;
  glowColorInput.value = preset.glow;
  canvasColorInput.value = preset.canvas;
  render();
};

const randomHex = () => {
  const value = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${value}`;
};

const randomize = () => {
  tlInput.value = String(Math.floor(Math.random() * 141));
  trInput.value = String(Math.floor(Math.random() * 141));
  brInput.value = String(Math.floor(Math.random() * 141));
  blInput.value = String(Math.floor(Math.random() * 141));
  shapeColorInput.value = randomHex();
  glowColorInput.value = randomHex();
  canvasColorInput.value = randomHex();
  render();
};

const maybeLockAndSync = (event) => {
  if (!lockAllInput.checked) {
    return;
  }

  const value = event.target.value;
  tlInput.value = value;
  trInput.value = value;
  brInput.value = value;
  blInput.value = value;
};

[tlInput, trInput, brInput, blInput].forEach((input) => {
  input.addEventListener("input", (event) => {
    maybeLockAndSync(event);
    render();
  });
});

[shapeColorInput, glowColorInput, canvasColorInput].forEach((input) => {
  input.addEventListener("input", render);
});

lockAllInput.addEventListener("change", () => {
  if (lockAllInput.checked) {
    trInput.value = tlInput.value;
    brInput.value = tlInput.value;
    blInput.value = tlInput.value;
    render();
  }
});

presetOrganicBtn.addEventListener("click", () => {
  applyPreset({
    tl: 36,
    tr: 92,
    br: 28,
    bl: 108,
    shape: "#7d8cff",
    glow: "#52f3ff",
    canvas: "#0d1429",
  });
});

presetCardBtn.addEventListener("click", () => {
  applyPreset({
    tl: 18,
    tr: 18,
    br: 18,
    bl: 18,
    shape: "#6f8aff",
    glow: "#7aa7ff",
    canvas: "#121b35",
  });
});

presetPillBtn.addEventListener("click", () => {
  applyPreset({
    tl: 120,
    tr: 120,
    br: 120,
    bl: 120,
    shape: "#7b6dff",
    glow: "#82ecff",
    canvas: "#0a1224",
  });
});

randomBtn.addEventListener("click", randomize);

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

render();
