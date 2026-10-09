document.addEventListener("DOMContentLoaded", () => {
  // Duplicate the sauce tiles once so the marquee loops seamlessly
  const track = document.getElementById("sauceTrack");
  if (track) {
    Array.from(track.children).forEach((tile) => {
      const clone = tile.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("tabindex");
      track.appendChild(clone);
    });
  }

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
