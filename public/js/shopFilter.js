function normalizeShopText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function setupShopFilters() {
  const searchInput = document.getElementById("shopSearchInput");
  const filterButtons = document.querySelectorAll("[data-shop-filter]");
  const cards = document.querySelectorAll("[data-shop-card]");
  const sections = document.querySelectorAll("[data-shop-section]");
  const noResults = document.getElementById("shopNoResults");

  if (!searchInput || !filterButtons.length || !cards.length) return;

  let activeCategory = "all";

  function applyFilters() {
    const searchTerm = normalizeShopText(searchInput.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardCategory = card.dataset.shopCategory || "";
      const cardSearch = normalizeShopText(card.dataset.shopSearch || card.textContent);

      const matchesCategory =
        activeCategory === "all" || cardCategory === activeCategory;

      const matchesSearch =
        !searchTerm || cardSearch.includes(searchTerm);

      const shouldShow = matchesCategory && matchesSearch;

      card.hidden = !shouldShow;

      if (shouldShow) {
        visibleCount++;
      }
    });

    sections.forEach((section) => {
      const visibleCards = section.querySelectorAll("[data-shop-card]:not([hidden])");
      section.hidden = visibleCards.length === 0;
    });

    if (noResults) {
      noResults.hidden = visibleCount > 0;
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.shopFilter || "all";

      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);

  applyFilters();
}

document.addEventListener("DOMContentLoaded", setupShopFilters);