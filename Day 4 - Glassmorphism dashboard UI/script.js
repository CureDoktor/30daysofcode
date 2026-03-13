const menuItems = document.querySelectorAll(".menu-item");
const views = document.querySelectorAll(".view");
const kickerText = document.getElementById("kicker-text");
const titleText = document.getElementById("title-text");
const actionBtn = document.getElementById("action-btn");

const viewMeta = {
  overview: {
    kicker: "Welcome back",
    title: "Modern Glass Dashboard",
    action: "+ New Widget",
  },
  analytics: {
    kicker: "Data focus",
    title: "Analytics Pulse",
    action: "+ Export Report",
  },
  activity: {
    kicker: "Live feed",
    title: "Team Activity Stream",
    action: "+ Add Event",
  },
  settings: {
    kicker: "Personalize",
    title: "Dashboard Settings",
    action: "Save Changes",
  },
};

const animateCounter = (el) => {
  const target = Number(el.dataset.target);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const duration = 1200;
  const start = performance.now();

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(target * eased);
    el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const revealInView = (view) => {
  const revealElements = view.querySelectorAll(".reveal");
  revealElements.forEach((el, index) => {
    el.classList.remove("show");
    el.style.transitionDelay = `${index * 0.08}s`;
    requestAnimationFrame(() => {
      el.classList.add("show");
    });
  });
};

const runCountersInView = (view) => {
  const counters = view.querySelectorAll("[data-target]");
  counters.forEach((counter) => {
    const prefix = counter.dataset.prefix || "";
    const suffix = counter.dataset.suffix || "";
    counter.textContent = `${prefix}0${suffix}`;
    animateCounter(counter);
  });
};

const switchView = (viewName) => {
  views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });

  const meta = viewMeta[viewName];
  kickerText.textContent = meta.kicker;
  titleText.textContent = meta.title;
  actionBtn.textContent = meta.action;

  const activeView = document.getElementById(`view-${viewName}`);
  revealInView(activeView);
  runCountersInView(activeView);
};

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    switchView(item.dataset.view);
  });
});

const pills = document.querySelectorAll(".pill");
pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((current) => current.classList.remove("active"));
    pill.classList.add("active");
    document.body.dataset.theme = pill.dataset.theme;
  });
});

switchView("overview");
