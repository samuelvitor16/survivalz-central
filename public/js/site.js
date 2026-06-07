document.addEventListener("DOMContentLoaded", () => {
  const scrollTopButton = document.querySelector("[data-scroll-top]");

  if (scrollTopButton) {
    const toggleScrollButton = () => {
      scrollTopButton.classList.toggle("is-visible", window.scrollY > 420);
    };

    toggleScrollButton();
    window.addEventListener("scroll", toggleScrollButton, { passive: true });
    scrollTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.querySelectorAll("[data-action-menu]").forEach((menu) => {
    const trigger = menu.querySelector("[data-action-trigger]");
    if (!trigger) return;

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.toggle("is-open");
    });

    menu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll("[data-action-menu].is-open").forEach((menu) => {
      menu.classList.remove("is-open");
    });
  });

  document.querySelectorAll("form[data-confirm-action]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const message = form.dataset.confirmAction || "Confirmar acao?";
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });
});
