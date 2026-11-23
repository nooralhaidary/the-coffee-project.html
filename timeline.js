// ============================================================
// Interactive timelines (History page)
// Turns each <ol class="timeline"> into a row of clickable years
// with one event card that slides between events.
// The original list stays in the page if this script doesn't run.
// ============================================================
(function () {
  const lists = document.querySelectorAll("ol.timeline");

  lists.forEach((list, listIndex) => {
    const events = [...list.querySelectorAll(":scope > li")].map((li) => ({
      when: li.querySelector(".when")?.textContent.trim() || "",
      what: li.querySelector(".what")?.textContent.trim() || "",
      detail: li.querySelector(".detail")?.innerHTML.trim() || "",
      img: li.dataset.img || "",
      cap: li.dataset.cap || "",
    }));
    if (!events.length) return;

    const id = `tl${listIndex}`;
    const wrap = document.createElement("div");
    wrap.className = "tl";
    wrap.innerHTML = `
      <div class="tl-track-wrap">
        <div class="tl-line" aria-hidden="true"><span class="tl-progress"></span></div>
        <div class="tl-track" role="tablist" aria-label="Timeline">
          ${events
            .map(
              (e, i) => `
            <button class="tl-stop" role="tab" type="button"
                    id="${id}-tab${i}" aria-controls="${id}-panel"
                    aria-selected="false" tabindex="-1">
              <span class="tl-dot" aria-hidden="true"></span>
              <span class="tl-year">${e.when}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>
      <div class="tl-card" role="tabpanel" id="${id}-panel" aria-live="polite">
        <div class="tl-card-inner"></div>
        <div class="tl-controls">
          <button type="button" class="tl-prev" aria-label="Previous event">←</button>
          <span class="tl-count"></span>
          <button type="button" class="tl-next" aria-label="Next event">→</button>
        </div>
      </div>`;

    list.replaceWith(wrap);

    const stops = [...wrap.querySelectorAll(".tl-stop")];
    const inner = wrap.querySelector(".tl-card-inner");
    const count = wrap.querySelector(".tl-count");
    const progress = wrap.querySelector(".tl-progress");
    const prev = wrap.querySelector(".tl-prev");
    const next = wrap.querySelector(".tl-next");
    let current = -1;

    function render(i) {
      const e = events[i];
      inner.classList.toggle("has-img", !!e.img);
      inner.innerHTML = `
        <div class="tl-card-text">
          <span class="tl-card-when">${e.when}</span>
          <h3 class="tl-card-what">${e.what}</h3>
          ${e.detail ? `<p class="tl-card-detail">${e.detail}</p>` : ""}
        </div>
        ${e.img ? `<figure class="tl-card-img"><img src="${e.img}" alt="${e.cap}"><figcaption>${e.cap}</figcaption></figure>` : ""}`;
    }

    function select(i, focus) {
      if (i < 0 || i >= events.length || i === current) return;
      const direction = i > current ? 1 : -1;
      const first = current === -1;
      current = i;

      stops.forEach((s, j) => {
        const on = j === i;
        s.setAttribute("aria-selected", on ? "true" : "false");
        s.tabIndex = on ? 0 : -1;
        s.classList.toggle("is-past", j < i);
      });
      wrap.querySelector(".tl-card").setAttribute("aria-labelledby", stops[i].id);
      progress.style.width = events.length > 1 ? `${(i / (events.length - 1)) * 100}%` : "100%";
      count.textContent = `${i + 1} / ${events.length}`;
      prev.disabled = i === 0;
      next.disabled = i === events.length - 1;

      // Keep the chosen year in view on narrow screens
      // (scrolls only the row of years, never the page)
      const track = wrap.querySelector(".tl-track");
      track.scrollTo({
        left: stops[i].offsetLeft - track.clientWidth / 2 + stops[i].offsetWidth / 2,
        behavior: first ? "auto" : "smooth",
      });
      if (focus) stops[i].focus({ preventScroll: true });

      if (first) {
        render(i);
        return;
      }

      // Slide the old card out, then the new one in
      inner.style.setProperty("--dir", direction);
      inner.classList.add("is-leaving");
      setTimeout(() => {
        render(i);
        inner.classList.remove("is-leaving");
        inner.classList.add("is-entering");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => inner.classList.remove("is-entering"));
        });
      }, 220);
    }

    stops.forEach((s, i) => s.addEventListener("click", () => select(i)));
    prev.addEventListener("click", () => select(current - 1));
    next.addEventListener("click", () => select(current + 1));

    // Arrow keys / Home / End move between years
    wrap.querySelector(".tl-track").addEventListener("keydown", (e) => {
      const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: events.length - 1 };
      if (e.key in keys) {
        e.preventDefault();
        select(Math.max(0, Math.min(events.length - 1, keys[e.key])), true);
      }
    });

    select(0);
  });
})();
