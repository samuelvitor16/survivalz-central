function setupHomeNewsModal() {
  const modal = document.getElementById("homeNewsModal");
  const openButtons = document.querySelectorAll("[data-news-open]");
  const closeButtons = document.querySelectorAll("[data-news-close]");

  if (!modal || !openButtons.length) return;

  const image = document.getElementById("homeNewsModalImage");
  const category = document.getElementById("homeNewsModalCategory");
  const title = document.getElementById("homeNewsModalTitle");
  const meta = document.getElementById("homeNewsModalMeta");
  const text = document.getElementById("homeNewsModalText");
  const url = document.getElementById("homeNewsModalUrl");

  function openModal(button) {
    if (image) image.src = button.dataset.newsImage || "/images/home/hero-bg.png";
    if (category) category.textContent = button.dataset.newsCategory || "Notícia";
    if (title) title.textContent = button.dataset.newsTitle || "Notícia SurvivalZ";
    if (meta) {
      meta.textContent = `${button.dataset.newsDate || ""} • ${button.dataset.newsAuthor || "Equipe SurvivalZ"}`;
    }
    if (text) {
  const templateId = button.dataset.newsTemplate;
  const template = templateId ? document.getElementById(templateId) : null;

  text.innerHTML = template ? template.innerHTML : "";
}
    if (url) url.href = button.dataset.newsUrl || "/forum";

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", () => openModal(button));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", setupHomeNewsModal);