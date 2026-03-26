const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const roastBtn = document.getElementById("roast-btn");
const actionStatus = document.getElementById("action-status");
const previewImage = document.getElementById("preview-image");
const previewPlaceholder = document.getElementById("preview-placeholder");
const scoreRing = document.getElementById("score-ring");
const verdict = document.getElementById("verdict");
const summary = document.getElementById("summary");
const metricsWrap = document.getElementById("metrics");
const feedbackList = document.getElementById("feedback-list");
const roastBox = document.getElementById("roast-box");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const resultPanel = document.querySelector(".result-panel");
const toneSelect = document.getElementById("tone");
const productTypeSelect = document.getElementById("product-type");

let selectedImage = null;
let imageUrl = "";
let roastRun = 0;

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  const block = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener(eventName, block, { capture: true });
  document.addEventListener(eventName, block, { capture: true });
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const mapRange = (value, inMin, inMax, outMin, outMax) => {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  const url = URL.createObjectURL(file);
  imageUrl = url;
  const img = new Image();
  img.onload = () => {
    selectedImage = img;
    previewImage.src = url;
    previewImage.style.display = "block";
    previewPlaceholder.style.display = "none";
    roastBtn.disabled = false;
    actionStatus.textContent = "Ready. Click Roast My UI.";
  };
  img.src = url;
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  loadImage(file);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  event.stopPropagation();
  dropzone.classList.remove("dragover");
  const file = event.dataTransfer?.files?.[0];
  loadImage(file);
});

function analyzeImage(image) {
  const maxSide = 360;
  const scale = Math.min(maxSide / image.width, maxSide / image.height, 1);
  const width = Math.max(1, Math.floor(image.width * scale));
  const height = Math.max(1, Math.floor(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);

  const pixels = ctx.getImageData(0, 0, width, height).data;

  let lumSum = 0;
  let lumSqSum = 0;
  let satSum = 0;
  let nearWhite = 0;
  let leftLum = 0;
  let rightLum = 0;
  let edgeCount = 0;
  const colorBins = new Set();

  const getLum = (index) => {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const lum = getLum(i);

      lumSum += lum;
      lumSqSum += lum * lum;

      const maxV = Math.max(r, g, b);
      const minV = Math.min(r, g, b);
      satSum += maxV === 0 ? 0 : (maxV - minV) / maxV;

      if (lum > 238) nearWhite += 1;
      if (x < width / 2) leftLum += lum;
      else rightLum += lum;

      const qR = Math.floor(r / 24);
      const qG = Math.floor(g / 24);
      const qB = Math.floor(b / 24);
      colorBins.add(`${qR}-${qG}-${qB}`);

      if (x < width - 1) {
        const rightLumPx = getLum(i + 4);
        if (Math.abs(lum - rightLumPx) > 26) edgeCount += 1;
      }
      if (y < height - 1) {
        const bottomLum = getLum(i + width * 4);
        if (Math.abs(lum - bottomLum) > 26) edgeCount += 1;
      }
    }
  }

  const totalPixels = width * height;
  const avgLum = lumSum / totalPixels;
  const lumVariance = lumSqSum / totalPixels - avgLum * avgLum;
  const lumStd = Math.sqrt(Math.max(lumVariance, 0));
  const avgSat = satSum / totalPixels;
  const edgeDensity = edgeCount / (totalPixels * 2);
  const whitespaceRatio = nearWhite / totalPixels;
  const paletteDensity = colorBins.size / (totalPixels / 10000);
  const balanceDiff = Math.abs(leftLum - rightLum) / Math.max(lumSum, 1);

  const contrastScore = Math.round(mapRange(lumStd, 16, 74, 20, 100));
  const hierarchyScore = Math.round(mapRange(edgeDensity, 0.015, 0.17, 20, 100));
  const consistencyScore = Math.round(clamp(100 - Math.abs(paletteDensity - 22) * 2.6, 16, 100));
  const spacingScore = Math.round(clamp(100 - Math.abs(whitespaceRatio - 0.27) * 240, 16, 100));
  const balanceScore = Math.round(clamp(100 - balanceDiff * 260, 20, 100));

  const metrics = [
    { key: "contrast", label: "Contrast", score: contrastScore },
    { key: "hierarchy", label: "Hierarchy", score: hierarchyScore },
    { key: "spacing", label: "Spacing", score: spacingScore },
    { key: "consistency", label: "Consistency", score: consistencyScore },
    { key: "balance", label: "Balance", score: balanceScore }
  ];

  const overall = Math.round(
    contrastScore * 0.24 +
      hierarchyScore * 0.24 +
      spacingScore * 0.18 +
      consistencyScore * 0.2 +
      balanceScore * 0.14
  );

  return {
    metrics,
    overall,
    meta: {
      avgSat,
      whitespaceRatio,
      paletteDensity
    }
  };
}

function getVerdict(score) {
  if (score >= 88) return { title: "Ship It", summary: "This UI is polished and production ready." };
  if (score >= 74) return { title: "Almost There", summary: "Strong base. A few tweaks unlock premium feel." };
  if (score >= 58) return { title: "Needs Iteration", summary: "Good idea, but visual system needs tighter execution." };
  return { title: "Needs a Redesign Sprint", summary: "Concept exists, but hierarchy and consistency are fighting." };
}

function scoreColor(score) {
  if (score >= 78) return "var(--good)";
  if (score >= 55) return "var(--mid)";
  return "var(--bad)";
}

function generateFeedback(result) {
  const feedback = [];
  const sorted = [...result.metrics].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  if (weakest.key === "contrast") {
    feedback.push("Increase contrast between text and background to improve readability.");
  }
  if (weakest.key === "hierarchy") {
    feedback.push("Create stronger visual hierarchy: bigger headings, clearer CTA priority.");
  }
  if (weakest.key === "spacing") {
    feedback.push("Tighten spacing rhythm. Use consistent 8px/12px/16px steps across blocks.");
  }
  if (weakest.key === "consistency") {
    feedback.push("Unify your style tokens: fewer colors, fewer border styles, one spacing scale.");
  }
  if (weakest.key === "balance") {
    feedback.push("Redistribute visual weight. One side currently feels heavier than the other.");
  }

  if (result.meta.avgSat > 0.52) {
    feedback.push("Saturation is high; desaturate supporting colors so CTA can stand out.");
  }
  if (result.meta.whitespaceRatio < 0.12) {
    feedback.push("Add breathing room around key components to reduce visual noise.");
  }
  if (result.meta.paletteDensity > 30) {
    feedback.push("Color palette is wide. Limit base colors and reserve accents with intention.");
  }

  feedback.push(`Strongest area is ${strongest.label.toLowerCase()} (${strongest.score}/100). Keep that direction.`);

  return feedback.slice(0, 5);
}

function generateRoast(result) {
  const tone = toneSelect.value;
  const type = productTypeSelect.value;
  const score = result.overall;

  const weak = [...result.metrics].sort((a, b) => a.score - b.score)[0];
  const typeText = {
    landing: "landing page",
    dashboard: "dashboard",
    mobile: "mobile UI",
    ecommerce: "e-commerce screen",
    other: "interface"
  }[type];

  const friendlyLines = [
    `This ${typeText} has potential. Right now ${weak.label.toLowerCase()} is holding back the wow factor.`,
    `Good direction. Clean up ${weak.label.toLowerCase()} and this could feel 2x more premium.`,
    `You are one design pass away from "damn, this looks expensive". Focus on ${weak.label.toLowerCase()}.`
  ];

  const savageLines = [
    `Brutal truth: this ${typeText} looks like three Figma drafts merged at 2AM. Fix ${weak.label.toLowerCase()}.`,
    `Your UI has energy, but ${weak.label.toLowerCase()} is currently in witness protection.`,
    `It is not bad, but it is not feared either. Improve ${weak.label.toLowerCase()} and it starts cooking.`
  ];

  const bank = tone === "savage" ? savageLines : friendlyLines;
  const picked = bank[score % bank.length];
  return `Score: ${score}/100. ${picked}`;
}

function setLoadingState(isLoading, label = "Analyzing UI patterns...") {
  roastBtn.classList.toggle("loading", isLoading);
  roastBtn.disabled = isLoading || !selectedImage;
  roastBtn.textContent = isLoading ? "Roasting..." : "Roast My UI";
  loadingText.textContent = label;
  loadingOverlay.hidden = !isLoading;
  resultPanel.classList.toggle("is-loading", isLoading);
}

function animateNumber(element, to, duration = 850) {
  const startText = Number.parseInt(element.textContent, 10);
  const from = Number.isFinite(startText) ? startText : 0;
  const start = performance.now();

  const tick = (now) => {
    const p = clamp((now - start) / duration, 0, 1);
    const eased = 1 - (1 - p) * (1 - p);
    const value = Math.round(from + (to - from) * eased);
    element.textContent = value;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function revealText(element) {
  element.classList.remove("show");
  element.classList.add("text-reveal");
  // Force reflow so animation restarts on repeated roasts.
  void element.offsetWidth;
  element.classList.add("show");
}

async function animateMetrics(metrics) {
  metricsWrap.innerHTML = "";
  for (const metric of metrics) {
    const row = document.createElement("div");
    row.className = "metric";
    row.innerHTML = `
      <span>${metric.label}</span>
      <div class="bar">
        <div class="fill"></div>
      </div>
      <span class="metric-score">0</span>
    `;

    metricsWrap.append(row);
    await sleep(90);

    const fill = row.querySelector(".fill");
    const scoreText = row.querySelector(".metric-score");
    fill.style.background = scoreColor(metric.score);
    requestAnimationFrame(() => {
      fill.style.width = `${metric.score}%`;
    });
    animateNumber(scoreText, metric.score, 860);
  }
}

function renderResult(result) {
  const status = getVerdict(result.overall);

  animateNumber(scoreRing, result.overall, 980);
  scoreRing.style.borderColor = scoreColor(result.overall);
  verdict.textContent = status.title;
  summary.textContent = status.summary;
  revealText(verdict);
  revealText(summary);

  animateMetrics(result.metrics);

  const feedback = generateFeedback(result);
  feedbackList.innerHTML = feedback
    .map((item, index) => `<li class="feedback-item" style="animation-delay:${index * 70}ms">${item}</li>`)
    .join("");
  feedbackList.scrollTop = 0;
  roastBox.textContent = generateRoast(result);
  roastBox.scrollTop = 0;
  revealText(roastBox);
}

roastBtn.addEventListener("click", async () => {
  if (!selectedImage) return;

  const runId = ++roastRun;
  let overlayFailSafe = null;
  try {
    setLoadingState(true, "Analyzing layout, contrast and spacing...");
    actionStatus.textContent = "Running roast pipeline...";
    overlayFailSafe = window.setTimeout(() => {
      if (runId === roastRun) {
        setLoadingState(false);
        actionStatus.textContent = "Analysis took too long, but UI was unlocked.";
      }
    }, 3000);

    await sleep(140);
    if (runId !== roastRun) return;
    const result = analyzeImage(selectedImage);

    // Stop overlay as soon as raw analysis is finished.
    setLoadingState(false);
    actionStatus.textContent = "Analysis done. Building roast...";
    await sleep(160);
    if (runId !== roastRun) return;

    renderResult(result);
    actionStatus.textContent = "Roast complete. Tweak tone/type and run again.";
  } catch (error) {
    console.error(error);
    actionStatus.textContent = "Something failed during roast. Please try another screenshot.";
    roastBox.textContent = "Roast failed this time. Upload again and rerun.";
  } finally {
    if (overlayFailSafe) window.clearTimeout(overlayFailSafe);
    if (runId === roastRun) {
      setLoadingState(false);
    }
  }
});
