const primaryButton = document.querySelector(".btn--primary");
const primaryLabel = primaryButton?.querySelector(".btn__label");

let loadingTimeout = 0;
const defaultLabel = primaryLabel?.textContent ?? "Get Started";
const loadingLabel = "Launching X...";

function startLoading() {
  if (!primaryButton) return;
  if (primaryButton.getAttribute("data-loading") === "true") return;

  primaryButton.setAttribute("data-loading", "true");
  primaryButton.setAttribute("aria-busy", "true");
  if (primaryLabel) primaryLabel.textContent = loadingLabel;

  window.clearTimeout(loadingTimeout);
  loadingTimeout = window.setTimeout(() => {
    primaryButton.setAttribute("data-loading", "false");
    primaryButton.setAttribute("aria-busy", "false");
    if (primaryLabel) primaryLabel.textContent = defaultLabel;
  }, 3000);
}

if (primaryButton) {
  primaryButton.addEventListener("click", startLoading);
}

