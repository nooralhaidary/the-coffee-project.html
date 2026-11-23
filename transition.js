// ============================================================
// Coffee page transition
// ============================================================

// 👉 When your drawing is ready, put the file next to this script
//    and set its name here, e.g. "coffee-drawing.png" or "cup.svg".
//    Leave it empty to show the placeholder cup.
const COFFEE_DRAWING = "title-o.png";

// How long the fill takes before the browser opens the next page (ms).
// Should roughly match the stream (0.18s) + --fill-duration (0.95s) in the CSS.
const FILL_TIME = 1350;

const PLACEHOLDER_CUP = `
  <svg viewBox="0 0 200 200" fill="none" stroke="currentColor"
       stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path class="steam" d="M78 58c-8-10 8-16 0-28" />
    <path class="steam" d="M100 54c-8-10 8-16 0-28" />
    <path class="steam" d="M122 58c-8-10 8-16 0-28" />
    <path d="M44 80h112v40a46 46 0 0 1-46 46h-20a46 46 0 0 1-46-46z" />
    <path d="M156 92h10a18 18 0 0 1 0 36h-14" />
    <path d="M30 180h140" />
  </svg>`;

// ---------- Build the coffee layer ----------
const coffee = document.createElement("div");
coffee.className = "coffee-transition";
coffee.setAttribute("aria-hidden", "true");

const art = COFFEE_DRAWING
  ? `<img src="${COFFEE_DRAWING}" alt="">`
  : PLACEHOLDER_CUP;

const bubbles = [
  { left: 12, size: 10, delay: 0.0 },
  { left: 27, size: 6, delay: 0.9 },
  { left: 41, size: 14, delay: 0.4 },
  { left: 63, size: 8, delay: 1.3 },
  { left: 76, size: 12, delay: 0.2 },
  { left: 89, size: 7, delay: 1.0 },
]
  .map(
    (b) =>
      `<span class="coffee-bubble" style="left:${b.left}%;width:${b.size}px;height:${b.size}px;animation-delay:${b.delay}s"></span>`
  )
  .join("");

coffee.innerHTML = `
  <div class="coffee-stream"></div>
  <div class="coffee-fill">
    <div class="coffee-wave coffee-wave--back"></div>
    <div class="coffee-wave coffee-wave--front"></div>
    ${bubbles}
    <div class="coffee-art">${art}</div>
  </div>`;

document.body.appendChild(coffee);

const fill = coffee.querySelector(".coffee-fill");

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ---------- Arriving on a page: drain the coffee ----------
if (sessionStorage.getItem("coffeeTransition") === "yes") {
  sessionStorage.removeItem("coffeeTransition");
  coffee.classList.add("is-full");

  async function revealPage() {
    await document.fonts.ready;

    document.documentElement.classList.remove("coffee-entering");
    document.documentElement.classList.add("coffee-arrived");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        coffee.classList.remove("is-full");
        coffee.classList.add("is-draining");
      });
    });
  }

  fill.addEventListener("animationend", (event) => {
    if (event.animationName === "coffee-drain") {
      coffee.classList.remove("is-draining");
    }
  });

  if (document.readyState === "complete") {
    revealPage();
  } else {
    window.addEventListener("load", revealPage, { once: true });
  }
} else {
  // Safety net: never leave the page hidden.
  document.documentElement.classList.remove("coffee-entering");
}

// ---------- Leaving a page: fill with coffee ----------
document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    // Keep new-tab clicks and other special clicks working.
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    const destination = new URL(link.href);

    if (
      destination.origin !== location.origin ||
      destination.pathname === location.pathname
    ) {
      return;
    }

    if (reduceMotion) return;

    event.preventDefault();
    coffee.classList.remove("is-draining", "is-full");
    coffee.classList.add("is-filling");
    sessionStorage.setItem("coffeeTransition", "yes");

    setTimeout(() => {
      window.location.href = link.href;
    }, FILL_TIME);
  });
});

// Reset the layer when coming back with the browser's Back button.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    coffee.classList.remove("is-filling", "is-full", "is-draining");
  }
});

// ============================================================
// Scroll to pour: at the bottom of each page, keep scrolling and
// the coffee rises with your scroll. When the screen is full,
// the next page opens (and drains as usual).
// ============================================================
const PAGES = [
  { file: "individual.html", name: "The Coffee Project" },
  { file: "coffee history.html", name: "The History" },
  { file: "global statistics.html", name: "The Global Statistics" },
  { file: "the roasters.html", name: "The Roasters" },
  { file: "sources.html", name: "The Sources" },
];

const currentFile = decodeURIComponent(location.pathname.split("/").pop() || "individual.html");
const pageIndex = PAGES.findIndex((p) => p.file === currentFile);

if (pageIndex !== -1) {
  const next = PAGES[(pageIndex + 1) % PAGES.length];
  // the "tap the title" line only appears on the home page
  const isHome = pageIndex === 0;

  // The text is drawn twice: brown on the cream page, and a cream copy
  // that only shows where the coffee has risen over it
  const textHTML = (cream) => `
    <div class="pour-text${cream ? " pour-text--cream" : ""}"${cream ? ' aria-hidden="true"' : ""}>
      <p class="pour-kicker">Up next</p>
      ${cream ? `<span class="pour-link">${next.name}</span>` : `<a class="pour-link" href="${next.file}">${next.name}</a>`}
      <p class="pour-hint"><span class="pour-hint-text">${reduceMotion ? "Click the title to continue" : "Keep scrolling to pour yourself a cup"}</span> <span class="pour-arrow" aria-hidden="true">↓</span></p>
    </div>`;

  const zone = document.createElement("section");
  zone.className = "pour-next";
  zone.setAttribute("aria-label", "Next page");
  zone.innerHTML = `
    <div class="pour-stage">
      ${textHTML(false)}
      <div class="pour-coffee" aria-hidden="true">
        <div class="coffee-wave coffee-wave--back"></div>
        <div class="coffee-wave coffee-wave--front"></div>
        <img class="pour-bean" src="images/bean-1.png" alt="">
        <img class="pour-bean" src="images/bean-2.png" alt="">
        <img class="pour-bean" src="images/bean-3.png" alt="">
      </div>
      ${textHTML(true)}
    </div>`;
  document.body.appendChild(zone);

  const stage = zone.querySelector(".pour-stage");
  const text = zone.querySelector(".pour-text");
  const hints = zone.querySelectorAll(".pour-hint-text");
  let navigating = false;

  // Clicking the title pours the coffee over the whole screen and opens the next page
  zone.querySelector("a.pour-link").addEventListener("click", (event) => {
    if (reduceMotion) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    coffee.classList.remove("is-draining", "is-full");
    coffee.classList.add("is-filling");
    sessionStorage.setItem("coffeeTransition", "yes");
    setTimeout(() => {
      window.location.href = next.file;
    }, FILL_TIME);
  });

  // The coffee rises with the scroll and stops just above the text,
  // so the whole title is "filled" and the scene stays on screen
  let ticking = false;
  let poured = false;

  function update() {
    ticking = false;
    const vh = stage.offsetHeight || window.innerHeight;
    // where the coffee stops: a little above the top of the text
    const stop = Math.min(1.02, 1 - text.querySelector(".pour-kicker").offsetTop / vh + 0.08);
    let level;
    if (reduceMotion) {
      level = stop;
    } else {
      const rect = zone.getBoundingClientRect();
      const dist = zone.offsetHeight - window.innerHeight;
      // starts as the zone scrolls in, full by the time it reaches the bottom
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - rect.top) / (dist + window.innerHeight * 0.5)));
      const t = Math.min(1, p / 0.9);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      level = -0.06 + (stop + 0.06) * eased;
    }
    zone.style.setProperty("--pour-level", level.toFixed(4));
    const nowPoured = level >= stop - 0.005;
    if (nowPoured !== poured) {
      poured = nowPoured;
      zone.classList.toggle("is-poured", poured);
      hints.forEach((h) => {
        h.textContent = poured
          ? (isHome ? "Your cup is ready: tap the title to drink up" : "")
          : reduceMotion ? "Click the title to continue" : "Keep scrolling to pour yourself a cup";
      });
    }
  }

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);
  update();

  // Coming back with the Back button: reset the full-screen layer
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    navigating = false;
    coffee.classList.remove("is-filling", "is-full", "is-draining");
    update();
  });
}

// ---------- Mark the current page's tile in the menu ----------
document.querySelectorAll("nav a").forEach((a) => {
  const file = decodeURIComponent(a.getAttribute("href") || "");
  if (file === currentFile) a.setAttribute("aria-current", "page");
});

// ============================================================
// The menu: a slim bar with a MENU button that opens a full-screen
// café-style menu poster listing every page and its sections
// ============================================================
(function () {
  const nav = document.querySelector("nav");
  if (!nav) return;

  const MENU = [
    {
      file: "coffee history.html", name: "The History", no: "01",
      items: [
        ["#origins", "Where coffee comes from", "Kaldi, his goats and the Ethiopian highlands"],
        ["#uses", "Before the cup", "Coffee eaten as cherries and energy balls"],
        ["#beverage", "Becoming a drink", "Sufi monasteries, Mecca and the first coffeehouses"],
        ["#spread", "Going global", "Istanbul, Venice, London and the espresso machine"],
      ],
    },
    {
      file: "global statistics.html", name: "The Global Statistics", no: "02",
      items: [
        ["#explore", "The coffee globe", "Spin the world and tap a continent"],
        ["#beans", "Which beans", "Arabica, Robusta and the rest"],
        ["#drinks", "Favourite drinks", "What the world searches for"],
        ["#guide", "Drink guide", "Espresso to Turkish coffee, drawn and explained"],
        ["#regions", "By continent", "100 people, one world of coffee"],
        ["#countries", "Per person", "Sacks of beans, country by country"],
      ],
    },
    {
      file: "the roasters.html", name: "The Roasters", no: "03",
      items: [
        ["#madrid", "Local: Madrid", "Literary cafés around the corner"],
        ["#spain", "National: Spain", "Spain's historic coffeehouses"],
        ["#historic", "Historic cafés", "Europe's oldest places for a cup"],
        ["#brands", "Famous brands", "Starbucks, Costa, Lavazza and illy"],
        ["#quiz-section", "The final test", "Ten questions: how well do you know coffee?"],
      ],
    },
    {
      file: "sources.html", name: "Sources", no: "04",
      items: [
        ["#history", "History sources", "Where every history fact comes from"],
        ["#stats", "Statistics sources", "The numbers behind the charts"],
        ["#roasters", "Roasters sources", "Cafés, brands and their stories"],
        ["#home", "Image credits", "Photos and logos used on the site"],
      ],
    },
  ];

  const here = typeof currentFile === "string" ? currentFile : "";
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const section = (page) => `
    <section class="mp-page${page.file === here ? " is-here" : ""}">
      <a class="mp-page-head" href="${page.file}">
        <span class="mp-page-name">${esc(page.name)}</span><span class="mp-price">No. ${page.no}</span>
      </a>
      <ul class="mp-items">
        ${page.items.map(([hash, name, desc], i) => `
          <li><a class="mp-item" href="${page.file}${hash}">
            <span class="mp-name">${esc(name)}</span><span class="mp-price">${page.no}.${i + 1}</span>
            <span class="mp-desc">[${esc(desc)}]</span>
          </a></li>`).join("")}
      </ul>
    </section>`;

  // ---------- The slim bar ----------
  const homeLink = nav.querySelector('a[href="individual.html"]');
  nav.classList.add("menu-bar");
  nav.innerHTML = `
    <a class="mb-home" href="individual.html"${here === "individual.html" ? ' aria-current="page"' : ""}>
      <img src="images/icons/favicon-192.png" alt=""><span>The Coffee Project</span>
    </a>
    <button type="button" class="mb-open" aria-haspopup="dialog" aria-expanded="false">
      <span class="mb-open-beans" aria-hidden="true"><i></i><i></i><i></i></span>Menu
    </button>`;
  if (!homeLink) nav.querySelector(".mb-home").remove();

  // ---------- The poster ----------
  const poster = document.createElement("div");
  poster.className = "menu-poster";
  poster.setAttribute("role", "dialog");
  poster.setAttribute("aria-modal", "true");
  poster.setAttribute("aria-label", "Menu");
  poster.hidden = true;
  poster.innerHTML = `
    <button type="button" class="mp-close"><span aria-hidden="true">✕</span> Close</button>
    <div class="mp-sheet">
      <div class="mp-row mp-row--top">
        <div class="mp-title" aria-hidden="true">
          <span>ME</span><span>NU</span>
          <img class="mp-doodle mp-doodle--bean" src="images/bean-1.png" alt="">
          <img class="mp-doodle mp-doodle--latte" src="images/latte-cup.png" alt="">
          <img class="mp-doodle mp-doodle--mug" src="images/mug.png" alt="">
        </div>
        ${section(MENU[0])}
      </div>

      <div class="mp-row mp-row--mid">
        ${section(MENU[1])}
        <p class="mp-side" aria-hidden="true"><span class="mp-script">best</span><span class="mp-vertical">Selections</span></p>
      </div>

      <p class="mp-divider"><span>Our signature</span></p>

      <div class="mp-row mp-row--bottom">
        <div class="mp-col">
          ${section(MENU[2])}
          ${section(MENU[3])}
        </div>
        <div class="mp-illus" aria-hidden="true">
          <div class="mp-stack">
            <img src="images/mug-rotated.png" alt="" style="--r:-7deg;--x:-6%">
            <img src="images/mug-rotated.png" alt="" style="--r:5deg;--x:7%">
            <img src="images/mug-rotated.png" alt="" style="--r:-4deg;--x:-3%">
            <img src="images/mug-rotated.png" alt="" style="--r:3deg;--x:2%">
          </div>
          <img class="mp-illus-icon" src="images/bean-1.png" alt="" style="--x:10%;--y:14%;--w:11%;--r:-30deg;--d:0s">
          <img class="mp-illus-icon" src="images/bean-2.png" alt="" style="--x:80%;--y:20%;--w:8%;--r:40deg;--d:-1.1s">
          <img class="mp-illus-icon" src="images/bean-3.png" alt="" style="--x:6%;--y:46%;--w:7%;--r:20deg;--d:-2s">
          <img class="mp-illus-icon" src="images/bean-1.png" alt="" style="--x:84%;--y:50%;--w:12%;--r:-55deg;--d:-0.6s">
          <img class="mp-illus-icon" src="images/bean-2.png" alt="" style="--x:12%;--y:78%;--w:9%;--r:-12deg;--d:-1.6s">
          <img class="mp-illus-icon" src="images/bean-3.png" alt="" style="--x:78%;--y:80%;--w:10%;--r:14deg;--d:-2.4s">
          <img class="mp-illus-icon" src="images/bean-1.png" alt="" style="--x:46%;--y:4%;--w:6%;--r:65deg;--d:-0.3s">
          <img class="mp-illus-icon" src="images/bean-2.png" alt="" style="--x:48%;--y:92%;--w:7%;--r:-70deg;--d:-1.4s">
        </div>
      </div>

      <a class="mp-brand" href="individual.html">
        <img src="images/icons/favicon-192.png" alt="">
        <span><strong>The Coffee Project</strong><small>Home</small></span>
      </a>
    </div>`;
  document.body.appendChild(poster);

  const openBtn = nav.querySelector(".mb-open");
  const closeBtn = poster.querySelector(".mp-close");

  function openMenu() {
    poster.hidden = false;
    requestAnimationFrame(() => poster.classList.add("is-open"));
    document.documentElement.classList.add("menu-open");
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function closeMenu(returnFocus = true) {
    poster.classList.remove("is-open");
    document.documentElement.classList.remove("menu-open");
    openBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => { poster.hidden = true; }, reduceMotion ? 0 : 350);
    if (returnFocus) openBtn.focus();
  }

  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", () => closeMenu());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !poster.hidden) closeMenu();
  });

  // Going somewhere: same page just scrolls, another page pours the coffee
  function go(link, event) {
    const url = new URL(link.href);
    if (url.pathname === location.pathname) {
      closeMenu(false);
      event.preventDefault();
      if (!url.hash) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        const target = document.querySelector(url.hash);
        setTimeout(() => {
          if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
          history.replaceState(null, "", url.hash);
        }, reduceMotion ? 0 : 300);
      }
      return;
    }
    if (reduceMotion || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    coffee.classList.remove("is-draining", "is-full");
    coffee.classList.add("is-filling");
    sessionStorage.setItem("coffeeTransition", "yes");
    setTimeout(() => { window.location.href = link.href; }, FILL_TIME);
  }

  poster.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) go(link, e);
  });
  const home = nav.querySelector(".mb-home");
  if (home) home.addEventListener("click", (e) => go(home, e));
})();
