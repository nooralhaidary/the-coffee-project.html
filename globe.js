// ============================================================
// Interactive coffee globe (The Global Statistics page)
// Drag to spin, click a country to see coffee facts for it
// and for its ICO consumption region.
// Needs d3 + topojson (loaded from cdnjs) and an internet connection
// for the world map.
// ============================================================

(function () {
  const holder = document.getElementById("globe");
  const panel = document.getElementById("globe-info");
  const regionButtons = document.getElementById("globe-regions");
  if (!holder || !panel) return;

  const MAP_URL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

  // ---------- Data (all figures come from the sections below / History page) ----------

  // Coffee drunk per continent, coffee year 2023/24, in million 60 kg bags.
  // Built from the International Coffee Organization's regional table (source [6]):
  //  - North America = ICO "North America" (USA & Canada, 30.9)
  //                  + ICO "Caribbean, Central America & Mexico" (6.1)
  //  - Asia and Oceania are only published together by the ICO.
  const REGIONS = {
    europe: {
      name: "Europe",
      bags: 53.7, share: 30.4, rank: 1,
      color: "#402718",
      text: "The world's biggest coffee-drinking continent. Nine of the ten countries that drink the most coffee per person are in Europe, led by Finland.",
    },
    asia: {
      name: "Asia & Oceania",
      bags: 45.7, share: 25.8, rank: 2,
      color: "#b5651d",
      text: "Official figures count Asia and Oceania together. Australia alone drinks just over 2 million bags a year. Asia is also a major grower: Vietnam and Indonesia were the world's 2nd and 4th largest producers in 2020.",
      extraCite: 14,
    },
    northAmerica: {
      name: "North America",
      bags: 37.0, share: 20.9, rank: 3,
      color: "#d9a441",
      text: "Includes the USA and Canada (30.9 million bags) plus Mexico, Central America and the Caribbean (6.1 million). The USA is one of the biggest coffee markets in total, but only around 25th per person.",
    },
    southAmerica: {
      name: "South America",
      bags: 28.0, share: 15.8, rank: 4,
      color: "#6b8e4e",
      text: "Grows about half of the world's coffee, but ranks only fourth in how much it drinks. Brazil is the world's largest producer.",
    },
    africa: {
      name: "Africa",
      bags: 12.5, share: 7.1, rank: 5,
      color: "#c8553d",
      text: "Coffee's birthplace: the coffee plant is native to the highlands of Ethiopia, which was still the world's 5th largest producer in 2020.",
    },
  };

  // ISO 3166 numeric codes → continent (anything else with a code = Asia & Oceania)
  const CODES = {
    europe: [8, 20, 40, 56, 70, 100, 112, 191, 196, 203, 208, 233, 246, 250, 276, 300, 348, 352, 372, 380, 428, 440, 442, 470, 498, 499, 528, 807, 578, 616, 620, 642, 643, 688, 703, 705, 724, 752, 756, 792, 804, 826],
    africa: [12, 24, 204, 72, 854, 108, 120, 140, 148, 178, 180, 384, 262, 818, 226, 232, 748, 231, 266, 270, 288, 324, 624, 404, 426, 430, 434, 450, 454, 466, 478, 504, 508, 516, 562, 566, 646, 686, 694, 706, 710, 728, 729, 834, 768, 788, 800, 894, 716, 732],
    southAmerica: [32, 68, 76, 152, 170, 218, 328, 600, 604, 740, 858, 862, 238],
    northAmerica: [840, 124, 484, 84, 188, 222, 320, 340, 558, 591, 192, 214, 332, 388, 44, 780, 630],
  };
  const NO_DATA = new Set([10, 304, 260]); // Antarctica, Greenland, French Southern Territories

  const regionOf = new Map();
  for (const [region, codes] of Object.entries(CODES)) {
    codes.forEach((c) => regionOf.set(c, region));
  }
  function getRegion(id) {
    const n = Number(id);
    if (!id || Number.isNaN(n) || NO_DATA.has(n)) return null;
    return regionOf.get(n) || "asia";
  }

  // Country facts. Sources: [7] per-person ranking, [5] Coffeeness search study,
  // History page for producers (2020) and history facts.
  const STATS = "sources.html#stats-s";
  const HIST = "sources.html#history-s";
  const COUNTRY = {
    246: { perCapita: [1, 12.0] },
    578: { perCapita: [2, 9.9] },
    352: { perCapita: [3, 9.0] },
    208: { perCapita: [4, 8.7] },
    528: { perCapita: [5, 8.4] },
    752: { perCapita: [6, 8.2] },
    756: { perCapita: [7, 7.9], drink: "Cappuccino" },
    56: { perCapita: [8, 6.8] },
    442: { perCapita: [9, 6.5] },
    124: { perCapita: [10, 6.2], drink: "Espresso" },
    840: { note: "Drinks about 4.2 kg of coffee per person per year (around 25th in the world), but is one of the largest markets in total.", drink: "Espresso" },
    76: { producer: 1, drink: "Latte", history: "Coffee arrived in 1727, when Francisco de Melo Palheta brought it from French Guiana." },
    704: { producer: 2 },
    170: { producer: 3 },
    360: { producer: 4, history: "The Dutch began growing coffee on Java in the 1690s, which is why \"java\" became a nickname for coffee." },
    231: { producer: 5, history: "The birthplace of coffee: the plant is native to the highlands of the Kaffa region." },
    887: { history: "Where coffee first became a roasted, brewed drink, in Sufi circles in the 15th century. The port of Mocha was the centre of the world coffee trade." },
    724: { drink: "Cappuccino" },
    250: { drink: "Cappuccino", history: "Café Procope opened in Paris in 1686." },
    276: { drink: "Espresso" },
    300: { drink: "Espresso" },
    458: { drink: "Latte" },
    792: { drink: "Turkish coffee", history: "The first coffeehouses opened in Istanbul around 1554–55." },
    826: { drink: "Macchiato", history: "England's first coffeehouses opened in Oxford (1650–51) and London (1652). They were nicknamed \"penny universities\"." },
    380: { history: "The espresso machine was developed in Italy between 1884 and 1906." },
    356: { history: "Legend says the pilgrim Baba Budan brought coffee seeds to Karnataka, around 1600–1670." },
  };

  // ---------- Globe ----------
  const size = 600;
  const svg = d3
    .select(holder)
    .append("svg")
    .attr("viewBox", `0 0 ${size} ${size}`)
    .attr("role", "img")
    .attr("aria-label", "Globe of world coffee consumption. Drag to spin, click a continent for details.");

  const projection = d3
    .geoOrthographic()
    .scale(size / 2 - 10)
    .translate([size / 2, size / 2])
    .rotate([-10, -25])
    .clipAngle(90);
  const path = d3.geoPath(projection);

  svg.append("circle")
    .attr("class", "globe-ocean")
    .attr("cx", size / 2).attr("cy", size / 2).attr("r", size / 2 - 10);

  const graticule = svg.append("path")
    .datum(d3.geoGraticule10())
    .attr("class", "globe-graticule");

  const countriesG = svg.append("g");
  const tooltip = d3.select(holder).append("div").attr("class", "globe-tooltip").attr("hidden", true);


  let countries = [];
  let selectedRegion = null;
  let hoverRegion = null;
  let spinning = true;

  function redraw() {
    graticule.attr("d", path);
    countriesG.selectAll("path").attr("d", path);
  }

  // Whole continents are coloured, highlighted and selected together
  function paint() {
    countriesG.selectAll("path")
      .attr("fill", (d) => {
        const r = getRegion(d.id);
        if (!r) return "#d9c98f";
        return REGIONS[r].color;
      })
      .attr("fill-opacity", (d) => {
        const r = getRegion(d.id);
        if (!selectedRegion && !hoverRegion) return 1;
        return r === selectedRegion || r === hoverRegion ? 1 : 0.3;
      })
      .classed("is-clickable", (d) => !!getRegion(d.id));
    regionButtons?.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.region === selectedRegion ? "true" : "false");
    });
  }

  function rotateTo(lonLat) {
    const [lon, lat] = lonLat;
    const from = projection.rotate();
    const to = [-lon, -lat * 0.8];
    const interp = d3.interpolate(from, to);
    d3.transition().duration(900).tween("rotate", () => (t) => {
      projection.rotate(interp(t));
      redraw();
    });
  }

  // A good point to turn the globe to for each continent
  const CENTRES = {
    europe: [15, 52],
    asia: [95, 30],
    northAmerica: [-95, 35],
    southAmerica: [-60, -18],
    africa: [20, 5],
  };

  function cite(href, n) {
    return `<a href="${href}${n}">[${n}]</a>`;
  }

  // Short lines for the country highlights inside a continent's panel
  function countryLines(regionKey) {
    const lines = [];
    countries
      .filter((f) => getRegion(f.id) === regionKey && COUNTRY[Number(f.id)])
      .sort((a, b) => {
        const fa = COUNTRY[Number(a.id)], fb = COUNTRY[Number(b.id)];
        const ra = fa.perCapita ? fa.perCapita[0] : fa.producer ? 20 + fa.producer : 99;
        const rb = fb.perCapita ? fb.perCapita[0] : fb.producer ? 20 + fb.producer : 99;
        return ra - rb;
      })
      .forEach((f) => {
        const facts = COUNTRY[Number(f.id)];
        const bits = [];
        if (facts.perCapita) bits.push(`#${facts.perCapita[0]} per person (${facts.perCapita[1].toFixed(1)} kg a year) ${cite(STATS, 7)}`);
        if (facts.note) bits.push(`${facts.note} ${cite(STATS, 7)}`);
        if (facts.producer) bits.push(`#${facts.producer} producer in the world (2020) ${cite(HIST, 4)}`);
        if (facts.drink) bits.push(`favourite drink: ${facts.drink} ${cite(STATS, 5)}`);
        if (facts.history) bits.push(`${facts.history} <a href="coffee history.html">(History)</a>`);
        lines.push(`<li><strong>${f.properties.name}:</strong> ${bits.join("; ")}</li>`);
      });
    return lines;
  }

  function showInfo(regionKey) {
    const r = REGIONS[regionKey];
    if (!r) return;
    const lines = countryLines(regionKey);
    panel.innerHTML = `
      <div class="globe-region">
        <p class="globe-kicker">Continent · #${r.rank} of 5</p>
        <h3>${r.name}</h3>
        <div class="globe-numbers">
          <div><span class="big">${r.bags.toFixed(1)}M</span><span>bags (60 kg) drunk in 2023/24</span></div>
          <div><span class="big">${r.share}%</span><span>of world consumption</span></div>
        </div>
        <p>${r.text}</p>
        <p class="cite">Evidence: ${cite(STATS, 6)}${r.extraCite ? " " + cite(STATS, r.extraCite) : ""}</p>
      </div>
      ${lines.length ? `<div class="globe-highlights"><p class="globe-kicker">Country highlights</p><ul class="globe-facts">${lines.join("")}</ul></div>` : ""}`;
  }

  function stopSpin() {
    spinning = false;
  }

  function selectRegion(key) {
    if (!key) return;
    stopSpin();
    selectedRegion = key;
    paint();
    showInfo(key);
    rotateTo(CENTRES[key]);
  }

  // Drag to spin
  const drag = d3.drag()
    .on("start", stopSpin)
    .on("drag", (event) => {
      const k = 75 / projection.scale();
      const [lon, lat] = projection.rotate();
      projection.rotate([lon + event.dx * k * 1.2, Math.max(-80, Math.min(80, lat - event.dy * k * 1.2))]);
      redraw();
    });
  svg.call(drag);

  // Slow spin until the visitor touches it
  d3.timer(() => {
    if (!spinning) return;
    const [lon, lat] = projection.rotate();
    projection.rotate([lon + 0.12, lat]);
    redraw();
  });

  // Continent buttons (also make the globe usable with a keyboard)
  if (regionButtons) {
    regionButtons.innerHTML = Object.entries(REGIONS)
      .map(([key, r]) => `<button type="button" data-region="${key}" aria-pressed="false"><span class="swatch" style="background:${r.color}"></span>${r.name}</button>`)
      .join("");
    regionButtons.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) selectRegion(b.dataset.region);
    });
  }

  // ---------- Load the map ----------
  d3.json(MAP_URL)
    .then((world) => {
      countries = topojson.feature(world, world.objects.countries).features;
      countriesG.selectAll("path")
        .data(countries)
        .join("path")
        .attr("class", "globe-country")
        .on("click", (event, d) => selectRegion(getRegion(d.id)))
        .on("mousemove", (event, d) => {
          const r = getRegion(d.id);
          if (r !== hoverRegion) {
            hoverRegion = r;
            paint();
          }
          if (!r) {
            tooltip.attr("hidden", true);
            return;
          }
          const box = holder.getBoundingClientRect();
          tooltip
            .attr("hidden", null)
            .style("left", `${event.clientX - box.left + 12}px`)
            .style("top", `${event.clientY - box.top + 12}px`)
            .text(REGIONS[r].name);
        })
        .on("mouseleave", () => {
          hoverRegion = null;
          paint();
          tooltip.attr("hidden", true);
        });
      paint();
      redraw();
    })
    .catch(() => {
      holder.innerHTML =
        '<p class="globe-muted">The globe needs an internet connection to load the world map. The same figures are in the tables below.</p>';
    });
})();
