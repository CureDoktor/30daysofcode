const componentTypeInput = document.getElementById("component-type");
const sizeInput = document.getElementById("size");
const radiusInput = document.getElementById("radius");
const borderInput = document.getElementById("border");
const shadowInput = document.getElementById("shadow");
const glassInput = document.getElementById("glass");

const primaryInput = document.getElementById("primary");
const accentInput = document.getElementById("accent");
const textColorInput = document.getElementById("text-color");
const canvasInput = document.getElementById("canvas");

const sizeValue = document.getElementById("size-value");
const radiusValue = document.getElementById("radius-value");
const borderValue = document.getElementById("border-value");
const shadowValue = document.getElementById("shadow-value");

const preview = document.getElementById("preview");
const component = document.getElementById("component");
const cssOutput = document.getElementById("css-output");
const htmlOutput = document.getElementById("html-output");

const copyCssBtn = document.getElementById("copy-css-btn");
const copyHtmlBtn = document.getElementById("copy-html-btn");
const randomBtn = document.getElementById("random-btn");

const presetNeonBtn = document.getElementById("preset-neon");
const presetCleanBtn = document.getElementById("preset-clean");
const presetCyberBtn = document.getElementById("preset-cyber");

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const randomHex = () => {
  const value = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${value}`;
};

const setLabels = () => {
  sizeValue.textContent = `${sizeInput.value}px`;
  radiusValue.textContent = `${radiusInput.value}px`;
  borderValue.textContent = `${borderInput.value}px`;
  shadowValue.textContent = shadowInput.value;
};

const getShadow = () => {
  const strength = Number(shadowInput.value);
  const { r, g, b } = hexToRgb(accentInput.value);
  const alpha = Math.min(0.62, Math.max(0.1, strength / 100)).toFixed(2);
  const y = Math.round(strength * 0.5);
  const blur = Math.round(strength * 1.2);
  return `0 ${y}px ${blur}px rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildComponentClass = (type) => {
  component.className = "component";
  component.classList.add(`live-${type}`);
};

const buildMarkup = (type) => {
  if (type === "card") {
    component.innerHTML = "<strong>X Component Card</strong><p>Clean, sharp, futuristic UI block.</p>";
    return `<div class="x-card">\n  <strong>X Component Card</strong>\n  <p>Clean, sharp, futuristic UI block.</p>\n</div>`;
  }

  if (type === "input") {
    component.innerHTML = "";
    component.setAttribute("contenteditable", "false");
    component.textContent = "Search X components...";
    return `<input class="x-input" placeholder="Search X components..." />`;
  }

  if (type === "badge") {
    component.innerHTML = "X LIVE";
    return `<span class="x-badge-ui">X LIVE</span>`;
  }

  component.innerHTML = "Launch X UI";
  return `<button class="x-button">Launch X UI</button>`;
};

const render = () => {
  setLabels();

  const type = componentTypeInput.value;
  buildComponentClass(type);
  const htmlCode = buildMarkup(type);

  const baseSize = Number(sizeInput.value);
  const borderRadius = `${radiusInput.value}px`;
  const border = `${borderInput.value}px solid ${accentInput.value}`;
  const shadow = getShadow();
  const isGlass = glassInput.checked;

  preview.style.backgroundColor = canvasInput.value;
  component.style.borderRadius = borderRadius;
  component.style.border = border;
  component.style.color = textColorInput.value;
  component.style.boxShadow = shadow;
  component.style.background = isGlass
    ? `linear-gradient(135deg, ${primaryInput.value}66, ${accentInput.value}4a)`
    : `linear-gradient(135deg, ${primaryInput.value}, ${accentInput.value})`;
  component.style.backdropFilter = isGlass ? "blur(10px)" : "none";
  component.style.webkitBackdropFilter = isGlass ? "blur(10px)" : "none";

  if (type === "card") {
    component.style.width = `${Math.max(220, baseSize + 90)}px`;
    component.style.minHeight = `${Math.max(120, baseSize)}px`;
    component.style.padding = `${Math.round(baseSize * 0.11)}px`;
  } else if (type === "input") {
    component.style.width = `${Math.max(220, baseSize + 90)}px`;
    component.style.padding = `${Math.round(baseSize * 0.085)}px ${Math.round(baseSize * 0.1)}px`;
  } else if (type === "badge") {
    component.style.width = "auto";
    component.style.padding = `${Math.round(baseSize * 0.045)}px ${Math.round(baseSize * 0.085)}px`;
  } else {
    component.style.width = "auto";
    component.style.padding = `${Math.round(baseSize * 0.08)}px ${Math.round(baseSize * 0.16)}px`;
  }

  const cssClassName = {
    button: ".x-button",
    card: ".x-card",
    input: ".x-input",
    badge: ".x-badge-ui",
  }[type];

  cssOutput.textContent = `${cssClassName} {
  border-radius: ${borderRadius};
  border: ${border};
  color: ${textColorInput.value};
  background: ${isGlass ? `linear-gradient(135deg, ${primaryInput.value}66, ${accentInput.value}4a)` : `linear-gradient(135deg, ${primaryInput.value}, ${accentInput.value})`};
  box-shadow: ${shadow};
}`;

  htmlOutput.textContent = htmlCode;
};

const applyPreset = (preset) => {
  componentTypeInput.value = preset.type;
  sizeInput.value = String(preset.size);
  radiusInput.value = String(preset.radius);
  borderInput.value = String(preset.border);
  shadowInput.value = String(preset.shadow);
  glassInput.checked = Boolean(preset.glass);
  primaryInput.value = preset.primary;
  accentInput.value = preset.accent;
  textColorInput.value = preset.text;
  canvasInput.value = preset.canvas;
  render();
};

const randomize = () => {
  const types = ["button", "card", "input", "badge"];
  componentTypeInput.value = types[Math.floor(Math.random() * types.length)];
  sizeInput.value = String(Math.floor(Math.random() * 151) + 60);
  radiusInput.value = String(Math.floor(Math.random() * 61));
  borderInput.value = String(Math.floor(Math.random() * 5));
  shadowInput.value = String(Math.floor(Math.random() * 61) + 10);
  glassInput.checked = Math.random() > 0.5;
  primaryInput.value = randomHex();
  accentInput.value = randomHex();
  textColorInput.value = randomHex();
  canvasInput.value = randomHex();
  render();
};

[componentTypeInput, sizeInput, radiusInput, borderInput, shadowInput, glassInput, primaryInput, accentInput, textColorInput, canvasInput].forEach((input) => {
  input.addEventListener("input", render);
});

presetNeonBtn.addEventListener("click", () => {
  applyPreset({
    type: "button",
    size: 122,
    radius: 16,
    border: 1,
    shadow: 36,
    glass: true,
    primary: "#7d8cff",
    accent: "#52f3ff",
    text: "#f5f8ff",
    canvas: "#0d1429",
  });
});

presetCleanBtn.addEventListener("click", () => {
  applyPreset({
    type: "card",
    size: 130,
    radius: 18,
    border: 1,
    shadow: 20,
    glass: false,
    primary: "#4e6cff",
    accent: "#7aa7ff",
    text: "#f8fbff",
    canvas: "#121b35",
  });
});

presetCyberBtn.addEventListener("click", () => {
  applyPreset({
    type: "badge",
    size: 104,
    radius: 28,
    border: 2,
    shadow: 50,
    glass: true,
    primary: "#8b4dff",
    accent: "#3df4ff",
    text: "#f9fcff",
    canvas: "#08111f",
  });
});

randomBtn.addEventListener("click", randomize);

const copyWithFeedback = async (button, text) => {
  try {
    await navigator.clipboard.writeText(text);
    const previous = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = previous;
    }, 1100);
  } catch (error) {
    console.error(error);
  }
};

copyCssBtn.addEventListener("click", () => copyWithFeedback(copyCssBtn, cssOutput.textContent));
copyHtmlBtn.addEventListener("click", () => copyWithFeedback(copyHtmlBtn, htmlOutput.textContent));

render();
