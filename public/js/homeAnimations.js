document.addEventListener("DOMContentLoaded", () => {
  const animatedItems = document.querySelectorAll(
    ".home-hero-copy, .home-survivor-card, .home-status-panel, .home-steps article, .home-systems-grid article, .home-final-box"
  );

  if (!("IntersectionObserver" in window)) {
    animatedItems.forEach((item) => item.classList.add("visible"));
    return;
  }

  animatedItems.forEach((item) => {
    item.classList.add("reveal-item");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  animatedItems.forEach((item) => observer.observe(item));
});
