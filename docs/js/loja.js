document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".promo-carousel-track");
  const slides = document.querySelectorAll(".promo-slide");
  const dotsContainer = document.querySelector(".promo-carousel-dots");
  const prevBtn = document.querySelector(".promo-prev");
  const nextBtn = document.querySelector(".promo-next");

  if (!track || slides.length === 0) return;

  let current = 0;
  let autoPlay;
  const INTERVAL = 5000;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.classList.add("promo-dot");
    if (i === 0) dot.classList.add("active");
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll(".promo-dot");

  function goTo(index) {
    current = ((index % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoPlay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(next, INTERVAL);
  }

  prevBtn.addEventListener("click", () => { prev(); startAutoPlay(); });
  nextBtn.addEventListener("click", () => { next(); startAutoPlay(); });

  const carousel = document.querySelector(".promo-carousel");
  carousel.addEventListener("mouseenter", () => clearInterval(autoPlay));
  carousel.addEventListener("mouseleave", startAutoPlay);

  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; clearInterval(autoPlay); }, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    startAutoPlay();
  }, { passive: true });

  startAutoPlay();
});
