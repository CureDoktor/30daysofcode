const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

let activePage = "home";
let isTransitioning = false;

const getPage = (name) => document.getElementById(`page-${name}`);

const switchPage = (nextPage) => {
  if (isTransitioning || nextPage === activePage) {
    return;
  }

  const currentEl = getPage(activePage);
  const nextEl = getPage(nextPage);
  if (!currentEl || !nextEl) {
    return;
  }

  isTransitioning = true;
  const currentIndex = [...navButtons].findIndex((b) => b.dataset.page === activePage);
  const nextIndex = [...navButtons].findIndex((b) => b.dataset.page === nextPage);
  const directionClass = nextIndex > currentIndex ? "out-left" : "out-right";

  pages.forEach((page) => {
    page.classList.remove("out-left", "out-right");
  });

  currentEl.classList.add(directionClass);
  currentEl.classList.remove("active");
  nextEl.classList.add("active");

  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === nextPage);
  });

  activePage = nextPage;

  setTimeout(() => {
    pages.forEach((page) => page.classList.remove("out-left", "out-right"));
    isTransitioning = false;
  }, 520);
};

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchPage(button.dataset.page);
  });
});
