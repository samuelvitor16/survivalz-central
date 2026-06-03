document.addEventListener("DOMContentLoaded", () => {
  const animatedItems = document.querySelectorAll(
    ".home-v2-hero-content, .home-v2-status-card, .home-v2-feature-card, .home-v2-step, .home-v2-store-card, .home-v2-diff-card, .home-v2-final-box"
  );

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

  animatedItems.forEach((item) => {
    observer.observe(item);
  });
});