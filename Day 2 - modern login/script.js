const form = document.getElementById("loginForm");
const card = document.querySelector(".login-card");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "🙈" : "👁";
  togglePassword.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isValid = form.checkValidity();
  clearState();

  if (!isValid) {
    markError();
    highlightInvalidFields();
    return;
  }

  highlightInvalidFields(true);
  setLoading(true);
  await sleep(500);

  // Demo interaction:
  // any email that includes "fail" triggers an error animation.
  if (emailInput.value.toLowerCase().includes("fail")) {
    setLoading(false);
    markError();
    return;
  }

  markSuccess();
  await sleep(220);
  setLoading(false);
});

function setLoading(state) {
  submitBtn.classList.toggle("loading", state);
  submitBtn.disabled = state;
}

function markError() {
  card.classList.remove("show-success");
  card.classList.remove("success");
  card.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-7px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(0)" }
    ],
    {
      duration: 360,
      easing: "ease"
    }
  );
  if (!emailInput.checkValidity()) {
    emailInput.style.borderColor = "rgba(251, 113, 133, 0.75)";
  }
  if (!passwordInput.checkValidity()) {
    passwordInput.style.borderColor = "rgba(251, 113, 133, 0.75)";
  }
}

function markSuccess() {
  card.classList.add("success");
  card.classList.add("show-success");
  emailInput.style.borderColor = "";
  passwordInput.style.borderColor = "";
}

function clearState() {
  card.classList.remove("success");
  emailInput.style.borderColor = "";
  passwordInput.style.borderColor = "";
}

function highlightInvalidFields(clear = false) {
  const inputs = [emailInput, passwordInput];

  inputs.forEach((input) => {
    const invalid = !input.checkValidity();
    input.toggleAttribute("aria-invalid", !clear && invalid);
    if (clear || !invalid) {
      input.style.borderColor = "";
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
