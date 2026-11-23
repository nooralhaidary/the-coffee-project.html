// ============================================================
// Immersive scrolling for the content pages
// (History, Global Statistics, Roasters)
//  1. The page opens with a full-screen title
//  2. Each section starts with a full-screen "part" card where coffee
//     rises with your scroll until the screen is full
//  3. Content slides in as it scrolls into view
// Same look as the coffee story on the home page.
// ============================================================
(function () {
  const page = document.querySelector("main.page");
  if (!page) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1. Full-screen opening ----------
  const title = page.querySelector(".page-title");
  const intro = page.querySelector(".page-intro");
  const toc = page.querySelector(".toc");
  if (title) {
    const hero = document.createElement("header");
    hero.className = "page-hero";
    title.before(hero);
    [title, intro, toc].forEach((el) => el && hero.appendChild(el));
    const hint = document.createElement("p");
    hint.className = "page-hero-hint";
    hint.innerHTML = 'Scroll to begin';
    hero.appendChild(hint);
  }

  // ---------- 2. Coffee "part" cards ----------
  const sections = [...page.querySelectorAll(".section")].filter((s) => s.id !== "sources" && s.id !== "quiz-section" && s.querySelector("h2"));
  const total = sections.length;
  const breaks = [];

  sections.forEach((section, i) => {
    const h2 = section.querySelector("h2");
    const brk = document.createElement("div");
    brk.className = "part-break";
    brk.setAttribute("aria-hidden", "true");
    brk.innerHTML = `
      <div class="part-stage">
        <div class="part-text">
          <span class="part-num">Part ${String(i + 1).padStart(2, "0")} of ${String(total).padStart(2, "0")}</span>
          <span class="part-title">${h2.textContent}</span>
        </div>
        <div class="part-coffee">
          <div class="story-wave story-wave--back"></div>
          <div class="story-wave story-wave--front"></div>
          <img class="story-bean" src="images/bean-1.png" alt="">
          <img class="story-bean" src="images/bean-2.png" alt="">
          <img class="story-bean" src="images/bean-3.png" alt="">
        </div>
        <!-- a cream copy of the text, only visible where the coffee has risen -->
        <div class="part-text part-text--cream">
          <span class="part-num">Part ${String(i + 1).padStart(2, "0")} of ${String(total).padStart(2, "0")}</span>
          <span class="part-title">${h2.textContent}</span>
        </div>
      </div>`;
    section.prepend(brk);
    // The card shows the heading big, so the original stays for
    // screen readers and links but is tucked away visually
    h2.classList.add("part-heading");
    breaks.push(brk);
  });

  // Where the coffee stops: just above the "Part 0X" label
  const stopLevel = (brk) => {
    const stage = brk.querySelector(".part-stage");
    const num = brk.querySelector(".part-num");
    const vh = stage.offsetHeight || window.innerHeight;
    return Math.min(1.02, 1 - num.offsetTop / vh + 0.08);
  };

  if (!reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      breaks.forEach((brk) => {
        const rect = brk.getBoundingClientRect();
        if (rect.bottom < -50 || rect.top > vh + 50) return; // off screen
        const dist = brk.offsetHeight - vh;
        const p = Math.min(1, Math.max(0, -rect.top / dist));
        // coffee rises from just below the screen and stops a little
        // above the text, so the title is filled and stays on screen
        const stop = stopLevel(brk);
        const t = Math.min(1, p / 0.85);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const level = -0.05 + (stop + 0.05) * eased;
        brk.style.setProperty("--level", level.toFixed(3));
        brk.classList.toggle("is-full", level > 0.55);
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  } else {
    breaks.forEach((brk) => {
      brk.style.setProperty("--level", stopLevel(brk).toFixed(3));
      brk.classList.add("is-full", "is-static");
    });
  }

  // ---------- 3. Content slides in ----------
  const SELECTOR = [
    ".section > p", ".section > ul", ".section > h3", ".section > figure",
    ".section > .cards", ".section > .table-wrap", ".section > .gallery",
    ".section > .profile", ".section > .tl", ".section > .bars",
    ".section > .globe-layout", ".section > .people-chart", ".section > .people-legend",
    ".section > .timeline", ".section > #quiz", ".section > .globe-region-buttons", ".section > .drink-guide",
  ].join(",");
  const items = [...page.querySelectorAll(SELECTOR)];

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  items.forEach((el) => el.classList.add("slide-in"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => io.observe(el));
})();
