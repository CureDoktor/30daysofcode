const root = document.documentElement;
const themeOptions = Array.from(document.querySelectorAll('input[name="themeMode"]'));
const themeCubeWrap = document.getElementById("themeCube");
const themeCube = themeCubeWrap?.querySelector(".theme-cube");
const cubeCurrent = document.getElementById("cubeCurrent");
const cubeNext = document.getElementById("cubeNext");
const lightThemes = ["default", "soft-light"];
const darkThemes = ["dim", "lights-out"];
const themeCycle = ["default", "soft-light", "dim", "lights-out"];
const themeLabels = {
  default: "Default",
  "soft-light": "Soft Light",
  dim: "Dim",
  "lights-out": "Lights Out",
};
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const savedTheme = localStorage.getItem("theme");
const initialTheme = savedTheme || (prefersDark.matches ? "lights-out" : "default");
const savedCubeTurns = Number(localStorage.getItem("cubeTurns"));
let cubeTurns = Number.isFinite(savedCubeTurns) ? savedCubeTurns : 0;
let cubeTiltX = 0;
let cubeTiltY = 0;
let cubeTargetTiltX = 0;
let cubeTargetTiltY = 0;
let cubeTiltRaf = 0;
let cubeHovering = false;

setTheme(initialTheme, false);
if (themeCube) {
  themeCube.style.setProperty("--cube-turn", `${cubeTurns * 180}deg`);
}
initCubeParallax();

themeOptions.forEach((option) => {
  option.addEventListener("change", (event) => {
    if (!event.target.checked) {
      return;
    }

    const nextTheme = event.target.value;
    const card = event.target.closest(".theme-option");
    if (card) {
      const rect = card.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      applyThemeWithMotion(nextTheme, true, originX, originY);
      return;
    }
    applyThemeWithMotion(nextTheme, true);
  });
});

prefersDark.addEventListener("change", (event) => {
  if (!localStorage.getItem("theme")) {
    applyThemeWithMotion(event.matches ? "lights-out" : "default", true);
  }
});

themeCubeWrap?.addEventListener("click", () => {
  const currentTheme = root.dataset.theme || "default";
  const currentIndex = themeCycle.indexOf(currentTheme);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextTheme = themeCycle[(safeIndex + 1) % themeCycle.length];

  cubeTurns += 1;
  localStorage.setItem("cubeTurns", String(cubeTurns));
  themeCube?.style.setProperty("--cube-turn", `${cubeTurns * 180}deg`);
  themeCubeWrap.classList.remove("is-spinning");
  void themeCubeWrap.offsetWidth;
  themeCubeWrap.classList.add("is-spinning");
  window.setTimeout(() => {
    themeCubeWrap.classList.remove("is-spinning");
  }, 920);

  const cubeRect = themeCubeWrap.getBoundingClientRect();
  const originX = cubeRect.left + cubeRect.width / 2;
  const originY = cubeRect.top + cubeRect.height / 2;
  window.setTimeout(() => {
    applyThemeWithMotion(nextTheme, true, originX, originY);
  }, 180);
});

function setTheme(theme, animate) {
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  if (darkThemes.includes(theme)) {
    localStorage.setItem("lastDarkTheme", theme);
  }
  if (lightThemes.includes(theme)) {
    localStorage.setItem("lastLightTheme", theme);
  }
  syncThemeOptions(theme);

  if (animate) {
    const activeOption = themeOptions.find((option) => option.value === theme);
    const optionCard = activeOption?.closest(".theme-option");
    optionCard?.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-1px) scale(0.985)" },
        { transform: "translateY(0) scale(1.01)" },
        { transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 580,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    );
  }
}

function launchThemeFlash(theme, x, y) {
  const ring = document.createElement("span");
  ring.className = "theme-flash";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.background = lightThemes.includes(theme) ? "#f5f8fa" : "#0f1419";
  document.body.appendChild(ring);

  requestAnimationFrame(() => {
    ring.classList.add("animate");
  });

  ring.addEventListener(
    "animationend",
    () => {
      ring.remove();
    },
    { once: true }
  );
}

function syncThemeOptions(theme) {
  themeOptions.forEach((option) => {
    option.checked = option.value === theme;
  });
  updateCubeReadout(theme);
}

function applyThemeWithMotion(theme, animate, x, y) {
  const canUseViewTransition =
    animate && typeof document.startViewTransition === "function";

  if (canUseViewTransition) {
    document.startViewTransition(() => {
      setTheme(theme, true);
    });
    if (typeof x === "number" && typeof y === "number") {
      launchThemeFlash(theme, x, y);
    }
    return;
  }

  if (typeof x === "number" && typeof y === "number") {
    launchThemeFlash(theme, x, y);
  }
  setTheme(theme, animate);
}

function updateCubeReadout(theme) {
  const currentIndex = themeCycle.indexOf(theme);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextTheme = themeCycle[(safeIndex + 1) % themeCycle.length];
  if (cubeCurrent) {
    cubeCurrent.textContent = themeLabels[theme] || "Default";
  }
  if (cubeNext) {
    cubeNext.textContent = `Next: ${themeLabels[nextTheme]}`;
  }
}

function initCubeParallax() {
  if (!themeCubeWrap || prefersReducedMotion.matches) {
    return;
  }

  themeCubeWrap.addEventListener("pointerenter", () => {
    cubeHovering = true;
    themeCubeWrap.classList.add("is-hovering");
    themeCubeWrap.style.setProperty("--cube-scale", "1.035");
    runCubeTiltLoop();
  });

  themeCubeWrap.addEventListener("pointermove", (event) => {
    const rect = themeCubeWrap.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    const maxTilt = 11;
    cubeTargetTiltY = x * maxTilt;
    cubeTargetTiltX = -y * maxTilt;
    runCubeTiltLoop();
  });

  themeCubeWrap.addEventListener("pointerleave", () => {
    cubeHovering = false;
    cubeTargetTiltX = 0;
    cubeTargetTiltY = 0;
    themeCubeWrap.style.setProperty("--cube-scale", "1");
    runCubeTiltLoop();
  });
}

function runCubeTiltLoop() {
  if (cubeTiltRaf) {
    return;
  }

  const tick = () => {
    cubeTiltX += (cubeTargetTiltX - cubeTiltX) * 0.16;
    cubeTiltY += (cubeTargetTiltY - cubeTiltY) * 0.16;

    themeCubeWrap?.style.setProperty("--tilt-x", `${cubeTiltX.toFixed(3)}deg`);
    themeCubeWrap?.style.setProperty("--tilt-y", `${cubeTiltY.toFixed(3)}deg`);

    const almostStill =
      Math.abs(cubeTiltX - cubeTargetTiltX) < 0.03 &&
      Math.abs(cubeTiltY - cubeTargetTiltY) < 0.03;

    if (!cubeHovering && almostStill) {
      cubeTiltRaf = 0;
      themeCubeWrap?.classList.remove("is-hovering");
      return;
    }

    cubeTiltRaf = window.requestAnimationFrame(tick);
  };

  cubeTiltRaf = window.requestAnimationFrame(tick);
}
