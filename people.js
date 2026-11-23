// ============================================================
// "100 people" pictogram (Global Statistics page)
// Each person = 1% of all the coffee drunk in the world in 2023/24,
// coloured by continent. Figures: International Coffee Organization
// (same as the continent bar chart on this page).
// ============================================================
(function () {
  const chart = document.getElementById("people-chart");
  const legend = document.getElementById("people-legend");
  const readout = document.getElementById("people-readout");
  if (!chart) return;

  // Shares rounded to whole people so they add up to 100
  const GROUPS = [
    { key: "europe", name: "Europe", people: 30, share: 30.4, bags: 53.7, color: "#402718" },
    { key: "asia", name: "Asia & Oceania", people: 26, share: 25.8, bags: 45.7, color: "#b5651d" },
    { key: "northAmerica", name: "North America", people: 21, share: 20.9, bags: 37.0, color: "#d9a441" },
    { key: "southAmerica", name: "South America", people: 16, share: 15.8, bags: 28.0, color: "#6b8e4e" },
    { key: "africa", name: "Africa", people: 7, share: 7.1, bags: 12.5, color: "#c8553d" },
  ];

  const PERSON = `
    <svg viewBox="0 0 24 44" aria-hidden="true">
      <circle cx="12" cy="7" r="6.5" />
      <path d="M3 22c0-5 3-8 9-8s9 3 9 8v9h-4v13h-4.2v-10h-1.6v10H7V31H3z" />
    </svg>`;

  // Build the 100 people: one vertical column per continent, stacked
  // up from a shared baseline like a bar chart
  let n = 0;
  GROUPS.forEach((g) => {
    const col = document.createElement("div");
    col.className = "people-col";
    col.dataset.group = g.key;
    const stack = document.createElement("div");
    stack.className = "people-stack";
    for (let i = 0; i < g.people; i++) {
      const p = document.createElement("span");
      p.className = "person";
      p.dataset.group = g.key;
      p.style.color = g.color;
      p.style.setProperty("--i", n++);
      p.innerHTML = PERSON;
      stack.appendChild(p);
    }
    const label = document.createElement("div");
    label.className = "people-col-label";
    label.innerHTML = `<strong style="color:${g.color}">${g.people}</strong><span>${g.name}</span>`;
    col.append(stack, label);
    chart.appendChild(col);
  });
  chart.setAttribute("role", "img");
  chart.setAttribute(
    "aria-label",
    "100 people icons showing each continent's share of world coffee drinking: " +
      GROUPS.map((g) => `${g.name} ${g.people}`).join(", ")
  );

  // Legend buttons
  legend.innerHTML = GROUPS.map(
    (g) => `<button type="button" data-group="${g.key}" aria-pressed="false">
        <span class="swatch" style="background:${g.color}"></span>${g.name}
        <strong>${g.people}</strong>
      </button>`
  ).join("");

  let pinned = null;

  function highlight(key) {
    chart.classList.toggle("has-focus", !!key);
    chart.querySelectorAll(".person").forEach((p) => {
      p.classList.toggle("is-on", p.dataset.group === key);
    });
    legend.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.group === pinned ? "true" : "false");
    });
    const g = GROUPS.find((x) => x.key === key);
    if (readout) {
      readout.innerHTML = g
        ? `<strong>${g.people} in every 100</strong> cups of coffee are drunk in <strong>${g.name}</strong>: ${g.bags.toFixed(1)} million bags, ${g.share}% of the world total.`
        : "Hover over or tap a person or a continent to see its share.";
    }
  }

  legend.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    pinned = pinned === b.dataset.group ? null : b.dataset.group;
    highlight(pinned);
  });
  legend.addEventListener("mouseover", (e) => {
    const b = e.target.closest("button");
    if (b) highlight(b.dataset.group);
  });
  legend.addEventListener("mouseleave", () => highlight(pinned));

  chart.addEventListener("mouseover", (e) => {
    const p = e.target.closest("[data-group]");
    if (p) highlight(p.dataset.group);
  });
  chart.addEventListener("mouseleave", () => highlight(pinned));
  chart.addEventListener("click", (e) => {
    const p = e.target.closest("[data-group]");
    if (!p) return;
    pinned = pinned === p.dataset.group ? null : p.dataset.group;
    highlight(pinned);
  });

  highlight(null);

  // People pop in one by one when the chart scrolls into view
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        chart.classList.add("is-in");
        io.disconnect();
      }
    }, { threshold: 0.25 });
    io.observe(chart);
  } else {
    chart.classList.add("is-in");
  }
})();
