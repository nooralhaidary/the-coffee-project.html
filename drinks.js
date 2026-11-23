// ============================================================
// Drink guide (Global Statistics page)
// Draws each drink in the site's hand-drawn style: thick dark-brown
// outlines, cream fills, dark coffee. Hovering over a drink plays a
// little pour: a jug tips in, a stream pours, and the drink fills up.
// ============================================================
(function () {
  const arts = document.querySelectorAll(".drink-art[data-drink]");
  if (!arts.length) return;

  const OUT = "#512b20";     // outline (same brown as the drawings)
  const CREAM = "#f6e4b4";   // cup / glass fill
  const EMPTY = "#e8c98a";   // inside of an empty cup
  const COFFEE = "#512b20";  // black coffee
  const CREMA = "#c98a4b";   // crema / milky coffee
  const MILK = "#fff6e2";    // milk and foam
  const CHOC = "#3b1f14";    // chocolate

  // a cup: body, the empty inside, then the drink's surface (which fills)
  const cup = (cx, top, w, h, surface) => `
    <path d="M${cx - w / 2} ${top} C ${cx - w / 2 + 2} ${top + h * 0.72}, ${cx - w * 0.3} ${top + h}, ${cx} ${top + h}
             C ${cx + w * 0.3} ${top + h}, ${cx + w / 2 - 2} ${top + h * 0.72}, ${cx + w / 2} ${top} Z" fill="${CREAM}"/>
    <path d="M${cx - w * 0.36} ${top + h * 0.42} C ${cx - w * 0.3} ${top + h * 0.72}, ${cx - w * 0.16} ${top + h * 0.82}, ${cx - w * 0.02} ${top + h * 0.84}"
          stroke="${EMPTY}" stroke-width="6"/>
    <ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="${w * 0.13}" fill="${EMPTY}"/>
    <ellipse class="liquid" cx="${cx}" cy="${top}" rx="${w / 2 - 5}" ry="${w * 0.13 - 3}" fill="${surface}" stroke="none"/>`;

  // the two-tone handle used on the mug drawings
  const handle = (x, y, s = 1) => {
    const d = `M${x} ${y} C ${x + 34 * s} ${y - 6 * s}, ${x + 38 * s} ${y + 36 * s}, ${x - 6 * s} ${y + 34 * s}`;
    return `<path d="${d}" stroke-width="${20 * s}"/><path d="${d}" stroke="${CREAM}" stroke-width="${8 * s}"/>`;
  };

  const saucer = (cx, y, rx) => `
    <ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${rx * 0.17}" fill="${CREAM}"/>
    <ellipse cx="${cx}" cy="${y - 2}" rx="${rx * 0.62}" ry="${rx * 0.09}" stroke-width="5"/>`;

  const steam = (xs, y) => `<g class="steam-wrap">${xs.map((x, i) =>
    `<path class="drink-steam" style="animation-delay:${-i * 0.6}s" d="M${x} ${y} c -8 -10, 8 -16, 0 -26 c -8 -10, 8 -16, 0 -26" stroke-width="7" opacity="0.75"/>`
  ).join("")}</g>`;

  // a little jug, tipped over, pouring from its spout at about (117, 21)
  const JUG = `
    <g class="pour-jug">
      <g transform="translate(150 22) rotate(-35)">
        <path d="M16 -8 C 30 -8, 30 12, 14 10" stroke-width="14"/>
        <path d="M16 -8 C 30 -8, 30 12, 14 10" stroke="${CREAM}" stroke-width="5"/>
        <path d="M-18 -14 L 18 -14 L 14 16 C 14 22, -14 22, -14 16 Z" fill="${CREAM}"/>
        <path d="M-18 -14 L -27 -20 L -15 -8" fill="${CREAM}"/>
        <path d="M-8 -4 L -9 10" stroke="${EMPTY}" stroke-width="5"/>
      </g>
    </g>`;

  // the poured stream: a brown edge with the liquid's colour inside
  const stream = (d, colour) => `
    <path class="pour-stream" pathLength="1" d="${d}" stroke-width="13"/>
    <path class="pour-stream" pathLength="1" d="${d}" stroke="${colour}" stroke-width="6"/>`;

  const pour = (cx, top, colour) =>
    `<g class="pour">${JUG}${stream(`M117 22 C 110 ${top * 0.45}, ${cx + 2} ${top - 34}, ${cx} ${top - 2}`, colour)}</g>`;

  const DRINKS = {
    espresso: `
      ${steam([92, 110], 104)}
      ${saucer(100, 168, 66)}
      ${handle(136, 124, 0.9)}
      ${cup(100, 118, 80, 48, CREMA)}
      <ellipse class="liquid" cx="100" cy="118" rx="24" ry="4.5" fill="#a86a3a" stroke="none"/>
      ${pour(100, 118, COFFEE)}`,

    macchiato: `
      ${saucer(100, 168, 66)}
      ${handle(136, 124, 0.9)}
      ${cup(100, 118, 80, 48, CREMA)}
      <g class="topping">
        <path d="M78 118 C 74 100, 92 92, 100 98 C 106 88, 126 94, 122 110 C 128 116, 120 122, 100 122 C 84 122, 76 122, 78 118 Z" fill="${MILK}"/>
        <path d="M94 104 C 98 100, 104 100, 106 104" stroke-width="4"/>
      </g>
      ${pour(100, 116, MILK)}`,

    cappuccino: `
      ${saucer(100, 172, 80)}
      ${handle(150, 128, 1)}
      ${cup(100, 120, 108, 50, MILK)}
      <g class="topping">
        <path d="M46 120 C 50 92, 150 92, 154 120" fill="${MILK}"/>
        <g fill="${COFFEE}" stroke="none">
          <circle cx="82" cy="108" r="3.5"/><circle cx="100" cy="102" r="3.5"/><circle cx="118" cy="109" r="3.5"/>
          <circle cx="92" cy="114" r="2.5"/><circle cx="110" cy="114" r="2.5"/>
        </g>
      </g>
      ${pour(100, 112, MILK)}`,

    latte: `
      <defs><clipPath id="latte-clip"><path d="M64 50 L 72 170 C 72 176, 128 176, 128 170 L 136 50 Z"/></clipPath></defs>
      <g clip-path="url(#latte-clip)" stroke="none">
        <rect x="60" y="40" width="80" height="140" fill="${CREAM}"/>
        <g class="liquid-col">
          <rect x="60" y="62" width="80" height="24" fill="${MILK}"/>
          <path d="M60 86 C 80 92, 120 80, 140 88 L 140 126 L 60 126 Z" fill="${CREMA}"/>
          <path d="M60 126 C 80 132, 120 120, 140 128 L 140 180 L 60 180 Z" fill="${MILK}"/>
        </g>
      </g>
      <path d="M64 50 L 72 170 C 72 176, 128 176, 128 170 L 136 50" fill="none"/>
      <ellipse cx="100" cy="50" rx="36" ry="7" fill="none"/>
      <path d="M78 72 L 84 158" stroke="#ffffff" stroke-width="5" opacity="0.8"/>
      <path class="topping" d="M116 30 L 108 120" stroke-width="7"/>
      ${pour(100, 58, MILK)}`,

    flatwhite: `
      ${saucer(100, 172, 74)}
      ${handle(144, 126, 0.95)}
      ${cup(100, 120, 96, 50, CREMA)}
      <g class="topping">
        <path d="M100 128 C 84 118, 86 108, 96 110 C 99 110, 100 113, 100 114 C 100 113, 101 110, 104 110 C 114 108, 116 118, 100 128 Z"
              fill="${MILK}" stroke="none" transform="translate(0 -6) scale(1 0.62) translate(0 70)"/>
        <ellipse cx="100" cy="120" rx="36" ry="7" stroke="${MILK}" stroke-width="3" opacity="0.8"/>
      </g>
      ${pour(100, 118, MILK)}`,

    americano: `
      ${steam([86, 104, 122], 64)}
      ${handle(138, 92, 1.05)}
      <path d="M62 70 L 62 160 C 62 172, 70 176, 80 176 L 120 176 C 130 176, 138 172, 138 160 L 138 70 Z" fill="${CREAM}"/>
      <path d="M74 96 L 74 156" stroke="${EMPTY}" stroke-width="6"/>
      <ellipse cx="100" cy="70" rx="38" ry="10" fill="${EMPTY}"/>
      <ellipse class="liquid" cx="100" cy="70" rx="33" ry="7" fill="${COFFEE}" stroke="none"/>
      <path d="M70 140 L 130 140" stroke-width="4" opacity="0.4"/>
      ${pour(100, 68, COFFEE)}`,

    mocha: `
      <defs><clipPath id="mocha-clip"><path d="M66 84 L 70 166 C 70 174, 130 174, 130 166 L 134 84 Z"/></clipPath></defs>
      ${handle(132, 100, 1)}
      <g clip-path="url(#mocha-clip)" stroke="none">
        <rect x="60" y="80" width="80" height="100" fill="${CREAM}"/>
        <g class="liquid-col">
          <rect x="60" y="86" width="80" height="30" fill="${CREMA}"/>
          <rect x="60" y="116" width="80" height="26" fill="#8f5a43"/>
          <rect x="60" y="142" width="80" height="40" fill="${CHOC}"/>
        </g>
      </g>
      <path d="M66 84 L 70 166 C 70 174, 130 174, 130 166 L 134 84" fill="none"/>
      <g class="topping">
        <path d="M62 86 C 56 70, 74 62, 84 66 C 86 52, 112 50, 116 64 C 128 60, 144 72, 138 86 Z" fill="${MILK}"/>
        <path d="M86 72 C 94 66, 104 66, 110 72" stroke-width="4"/>
        <path d="M74 80 L 84 70 L 92 80 L 102 68 L 110 80 L 120 70 L 128 80" stroke="${CHOC}" stroke-width="4"/>
      </g>
      ${pour(100, 84, CHOC)}`,

    // the pot pours into the little cup itself
    turkish: `
      ${saucer(52, 172, 36)}
      ${cup(52, 146, 44, 26, COFFEE)}
      <ellipse class="liquid" cx="52" cy="146" rx="13" ry="3" fill="${CREMA}" stroke="none"/>
      <g class="pot-tilt">
        <path d="M150 104 L 190 74" stroke-width="18"/>
        <path d="M150 104 L 190 74" stroke="${CREMA}" stroke-width="7"/>
        <path d="M88 92 L 98 106 C 80 132, 80 166, 96 172 L 150 172 C 166 166, 166 132, 148 106 L 158 92 Z" fill="${CREMA}"/>
        <path d="M100 120 C 94 136, 94 154, 100 164" stroke="#e8b27a" stroke-width="6"/>
        <ellipse cx="123" cy="92" rx="35" ry="8" fill="#8f5a43"/>
        <ellipse cx="123" cy="91" rx="20" ry="4" fill="${CREMA}" stroke="none"/>
      </g>
      <g class="pour">${stream("M88 94 C 72 100, 58 120, 54 142", COFFEE)}</g>`,
  };

  arts.forEach((el) => {
    const art = DRINKS[el.dataset.drink];
    if (!art) return;
    el.innerHTML = `
      <svg viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="${OUT}" stroke-width="9"
           stroke-linecap="round" stroke-linejoin="round">${art}</svg>`;
  });
})();
