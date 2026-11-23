// ============================================================
// Coffee sacks (Global Statistics page, "per person" section)
// Each country is a hand-drawn sack that fills with beans up to its
// kg per person per year. A full sack = Finland's 12 kg.
// The figures are read from the table on the page, so the table stays
// the single source of truth.
// ============================================================
(function () {
  const holder = document.getElementById("sacks");
  const table = document.querySelector("#countries table");
  if (!holder || !table) return;

  const rows = [...table.querySelectorAll("tbody tr")].map((tr) => {
    const td = tr.querySelectorAll("td");
    return { rank: td[0].textContent.trim(), country: td[1].textContent.trim(), kg: parseFloat(td[2].textContent) };
  });
  // The USA, for comparison (mentioned in the text: about 4.2 kg, ~25th)
  rows.push({ rank: "~25", country: "USA", kg: 4.2, compare: true });

  const MAX = Math.max(...rows.map((r) => r.kg)); // 12 kg = a full sack

  // Sack body runs from y=46 (neck) to y=146 (bottom)
  const TOP = 46, BOTTOM = 146, H = BOTTOM - TOP;
  const BODY = "M34 46 C 20 62, 10 98, 15 126 C 19 148, 101 148, 105 126 C 110 98, 100 62, 86 46 Z";

  const sackSVG = (r, i) => {
    const level = r.kg / MAX;
    const id = `sack${i}`;
    return `
      <svg viewBox="0 0 120 156" aria-hidden="true" style="--drop:${((1 - level) * H).toFixed(1)}px">
        <defs>
          <clipPath id="${id}-clip"><path d="${BODY}"/></clipPath>
          <pattern id="${id}-beans" width="24" height="20" patternUnits="userSpaceOnUse">
            <g stroke="#512b20" stroke-width="2" stroke-linecap="round">
              <ellipse cx="7" cy="6" rx="5.6" ry="7.4" transform="rotate(-35 7 6)" fill="#8f5a43"/>
              <path d="M5 1.5 C 9 4.5, 4 8, 9 11" fill="none"/>
              <ellipse cx="18" cy="15" rx="5.6" ry="7.4" transform="rotate(30 18 15)" fill="#a0684c"/>
              <path d="M16.5 10 C 20 13, 15 16.5, 19.5 20" fill="none"/>
            </g>
          </pattern>
        </defs>
        <!-- sack -->
        <path d="${BODY}" fill="#f6e4b4"/>
        <!-- beans filling the sack -->
        <g clip-path="url(#${id}-clip)">
          <g class="sack-fill">
            <rect x="0" y="${TOP}" width="120" height="${H + 10}" fill="#6b4226"/>
            <rect x="0" y="${TOP}" width="120" height="${H + 10}" fill="url(#${id}-beans)"/>
            <path d="M0 ${TOP + 3} Q 30 ${TOP - 4} 60 ${TOP + 3} T 120 ${TOP + 3}" fill="none" stroke="#512b20" stroke-width="3"/>
          </g>
        </g>
        <!-- outline, tie and top flaps, in the thick hand-drawn style -->
        <g class="sack-outline" fill="none" stroke="#512b20" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
          <path d="${BODY}"/>
          <path d="M36 44 C 46 50, 74 50, 84 44"/>
          <path d="M40 41 C 30 26, 44 14, 52 28 C 56 18, 66 18, 68 28 C 76 14, 92 24, 80 41" fill="#f6e4b4"/>
        </g>
        <!-- printed label on the sack -->
        <g class="sack-label">
          <rect x="34" y="92" width="52" height="30" rx="6" fill="#f6e4b4" stroke="#512b20" stroke-width="3"/>
          <text x="60" y="113" text-anchor="middle">${r.kg.toFixed(1)}</text>
        </g>
      </svg>`;
  };

  holder.innerHTML = rows
    .map(
      (r, i) => `
      <figure class="sack${r.compare ? " is-compare" : ""}" style="--i:${i}">
        <span class="sack-rank">${r.compare ? "for comparison" : "#" + r.rank}</span>
        ${sackSVG(r, i)}
        <figcaption><strong>${r.country}</strong><span>${r.kg.toFixed(1)} kg a year</span></figcaption>
      </figure>`
    )
    .join("");
  holder.setAttribute("role", "img");
  holder.setAttribute(
    "aria-label",
    "Coffee sacks filled to each country's kg of coffee per person per year: " +
      rows.map((r) => `${r.country} ${r.kg} kg`).join(", ")
  );

  // Pour the beans in when the sacks scroll into view
  const fill = () => holder.classList.add("is-filled");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fill();
      }
    }, { threshold: 0.25 });
    io.observe(holder);
  } else {
    fill();
  }
})();
