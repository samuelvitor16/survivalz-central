function setupServerShotsCarousel() {
  const track = document.getElementById("serverShotsTrack");
  const prev = document.getElementById("serverShotsPrev");
  const next = document.getElementById("serverShotsNext");

  if (!track || !prev || !next) return;

  function getCardWidth() {
    const card = track.querySelector(".home-shot-card");
    if (!card) return 320;

    const styles = window.getComputedStyle(track);
    const gap = parseInt(styles.columnGap || styles.gap || "16", 10);

    return card.offsetWidth + gap;
  }

  function goNext() {
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (track.scrollLeft >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    track.scrollBy({ left: getCardWidth(), behavior: "smooth" });
  }

  function goPrev() {
    if (track.scrollLeft <= 10) {
      track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
      return;
    }

    track.scrollBy({ left: -getCardWidth(), behavior: "smooth" });
  }

  next.addEventListener("click", goNext);
  prev.addEventListener("click", goPrev);

  setInterval(goNext, 5500);
}

document.addEventListener("DOMContentLoaded", setupServerShotsCarousel);