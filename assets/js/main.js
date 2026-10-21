const MAIN_SITE_URL = "";

// Project root (main.js lives in assets/js/), so pages in sub-folders such as
// brand/ can still load the shared header and footer
const SITE_ROOT = new URL("../../", document.currentScript.src);

// Load a partial HTML file into the element with the given id
async function loadPartial(id, url) {
  const placeholder = document.getElementById(id);
  if (!placeholder) return;
  try {
    const res = await fetch(new URL(url, SITE_ROOT));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    // Replace the placeholder itself so the header stays a direct child of
    // .page-wrapper (keeps .sticky-top working)
    placeholder.outerHTML = await res.text();
  } catch (err) {
    console.error(`Could not load ${url}:`, err);
  }
}

// Entrance animations – elements slide up / fade in once they enter the viewport
function initScrollAnimations() {
  const items = document.querySelectorAll("[data-animate]");
  if (!items.length) return;

  const reveal = (el) => {
    // data-animate-tablet="none" – show without animating on tablet & mobile
    if (el.dataset.animateTablet === "none" && window.innerWidth <= 991) {
      el.classList.add("animated");
      return;
    }
    const delay = parseInt(el.dataset.animateDelay, 10) || 0;
    setTimeout(() => el.classList.add("animated", el.dataset.animate), delay);
  };

  if (!("IntersectionObserver" in window)) {
    items.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  });
  items.forEach((el) => observer.observe(el));
}

// Background parallax – the layer is taller than its section and moves up as
// the page content (<main>) scrolls through the viewport, like the previous site
function initParallax() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-parallax-speed]").forEach((section) => {
    const layer = section.querySelector(".parallax-layer, .food-pattern-layer");
    if (!layer || reduceMotion) return;
    const range = section.closest("main") || section;
    const extra = (parseFloat(section.dataset.parallaxSpeed) || 0) * 10 / 100;
    let ticking = false;

    const update = () => {
      ticking = false;
      const height = section.offsetHeight;
      const movable = height * extra;
      layer.style.height = `${height + movable}px`;

      const top = range.getBoundingClientRect().top;
      const passed = Math.min(Math.max((window.innerHeight - top) / (range.offsetHeight + window.innerHeight), 0), 1);
      layer.style.transform = `translateY(${-movable * passed}px)`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  });
}

// Sauce carousel – loops forever, moves one slide every 1.8s (1s slide),
// 7 slides on desktop, 3 on tablet, 2 on mobile, pauses on hover / swipe
function initSauceCarousel() {
  const wrap = document.querySelector(".menu-sauces");
  const track = wrap && wrap.querySelector(".menu-sauces-track");
  if (!track) return;

  const GAP = 10, DELAY = 1800, SPEED = 1000;
  const originals = Array.from(track.children);
  const total = originals.length;
  const perView = () => (window.innerWidth <= 767 ? 2 : window.innerWidth <= 991 ? 3 : 7);

  // Clone a full set on each side so the loop never shows a gap
  originals.forEach((s) => {
    const c = s.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll("[tabindex]").forEach((el) => el.removeAttribute("tabindex"));
    track.appendChild(c);
  });
  originals.slice().reverse().forEach((s) => {
    const c = s.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll("[tabindex]").forEach((el) => el.removeAttribute("tabindex"));
    track.insertBefore(c, track.firstChild);
  });

  let index = total, slideW = 0, timer = null, paused = false, moving = false;

  const place = (animate) => {
    track.style.transition = animate ? `transform ${SPEED}ms ease` : "none";
    track.style.transform = `translate3d(${-index * (slideW + GAP)}px, 0, 0)`;
  };
  const layout = () => {
    const n = perView();
    slideW = (wrap.clientWidth - GAP * (n - 1)) / n;
    Array.from(track.children).forEach((s) => (s.style.width = `${slideW}px`));
    place(false);
  };
  const go = (step) => {
    if (moving) return;
    moving = true;
    index += step;
    place(true);
  };
  track.addEventListener("transitionend", (e) => {
    if (e.target !== track) return;
    moving = false;
    if (index >= total * 2) index -= total;
    if (index < total) index += total;
    place(false);
    schedule();
  });
  const schedule = () => {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(() => go(1), DELAY);
  };

  wrap.addEventListener("mouseenter", () => { paused = true; clearTimeout(timer); });
  wrap.addEventListener("mouseleave", () => { paused = false; schedule(); });

  let startX = null;
  wrap.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  wrap.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { clearTimeout(timer); go(dx < 0 ? 1 : -1); }
  });

  window.addEventListener("resize", layout);
  layout();
  schedule();
}

// FAQ accordion – one item open at a time, 400ms height animation (same as the previous site)
function initFaqAccordion() {
  var DURATION = 400;
  var items = document.querySelectorAll(".contact-accordion-item");
  var animations = new Map();

  function finish(item, open) {
    item.open = open;
    animations.set(item, null);
    item.style.height = "";
    item.style.overflow = "";
  }

  function animate(item, from, to, open) {
    item.style.overflow = "hidden";
    var current = animations.get(item);
    if (current) current.cancel();
    var anim = item.animate({ height: [from, to] }, { duration: DURATION });
    anim.onfinish = function () { finish(item, open); };
    animations.set(item, anim);
    item.querySelector("summary").setAttribute("aria-expanded", open);
  }

  function close(item) {
    var title = item.querySelector("summary");
    animate(item, item.offsetHeight + "px", title.offsetHeight + "px", false);
  }

  function open(item) {
    var title = item.querySelector("summary");
    var content = item.querySelector(".contact-accordion-content");
    item.style.overflow = "hidden";
    item.style.height = item.offsetHeight + "px";
    item.open = true;
    requestAnimationFrame(function () {
      var start = item.offsetHeight, t = title.offsetHeight, c = content.offsetHeight;
      if (!start || !t || !c) return;
      animate(item, start + "px", t + c + "px", true);
    });
  }

  items.forEach(function (item) {
    item.querySelector("summary").addEventListener("click", function (e) {
      e.preventDefault();
      var wasOpen = item.open;
      items.forEach(close);
      if (!wasOpen) open(item);
    });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && item.open) close(item);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initScrollAnimations();
  initParallax();
  initSauceCarousel();
  initFaqAccordion();

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

  await Promise.all([
    loadPartial("header", "header.html"),
    loadPartial("footer", "footer.html"),
  ]);

  // Highlight the current page in the header and footer menus
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar .nav-link, .footer-links a").forEach((link) => {
    if (link.getAttribute("href") === page) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  // Pages outside the root (e.g. brand/) resolve the partials' links and images
  // from the project root; on the brand page, links go to MAIN_SITE_URL once set
  const onBrandPage = document.body.classList.contains("bg-page");
  const isRootPage = new URL(".", location.href).href === SITE_ROOT.href;
  if (!isRootPage || (MAIN_SITE_URL && onBrandPage)) {
    document.querySelectorAll(".site-header [href], .site-header [src], .site-footer [href], .site-footer [src]").forEach((el) => {
      const attr = el.hasAttribute("href") ? "href" : "src";
      const value = el.getAttribute(attr);
      if (/^(https?:|mailto:|tel:|#|\/)/.test(value)) return;
      const base = attr === "href" && MAIN_SITE_URL && onBrandPage ? MAIN_SITE_URL : SITE_ROOT;
      el.setAttribute(attr, new URL(value, base).href);
    });
  }

  // Footer year (set after the footer partial is loaded)
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
