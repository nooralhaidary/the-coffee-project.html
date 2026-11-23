// ============================================================
// Fun extras (all pages)
//  1. Click anywhere → a little splash of coffee drops
//  2. Home: live "coffee drunk since you arrived" counter
//  3. Home: steam on the latte cup, click it to take a sip
//  4. History: "True or false?" coffee quiz
// Everything respects "reduce motion" settings.
// ============================================================
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1. Coffee splash on click ----------
  if (!reduceMotion) {
    document.addEventListener("pointerdown", (event) => {
      // Not while dragging the globe or using form controls
      if (event.target.closest("#globe, input, textarea, select")) return;
      if (event.button !== 0) return;

      // Your three coffee beans, cut out of the beans drawing
      const BEANS = ["images/bean-1.png", "images/bean-2.png", "images/bean-3.png"];
      const rush = document.body.classList.contains("is-rush");
      const count = rush ? 18 : 7; // much bigger bursts during a caffeine rush
      for (let i = 0; i < count; i++) {
        const drop = document.createElement("img");
        drop.src = BEANS[Math.floor(Math.random() * BEANS.length)];
        drop.alt = "";
        drop.className = "splash-drop";
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const distance = (35 + Math.random() * 45) * (rush ? 2.2 : 1);
        drop.style.left = `${event.clientX}px`;
        drop.style.top = `${event.clientY}px`;
        drop.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        // beans fly out, then tumble down a little
        drop.style.setProperty("--dy", `${Math.sin(angle) * distance + 45}px`);
        drop.style.setProperty("--rot", `${Math.round(Math.random() * 540 - 270)}deg`);
        drop.style.width = `${16 + Math.random() * 14}px`;
        document.body.appendChild(drop);
        drop.addEventListener("animationend", () => drop.remove());
      }
    });
  }

  // ---------- 2. Live coffee counter (home page) ----------
  // ICO: about 177.0 million 60 kg bags drunk in coffee year 2023/24
  const counter = document.getElementById("coffee-counter");
  if (counter) {
    const KG_PER_SECOND = (177.0e6 * 60) / (365.25 * 24 * 60 * 60); // ≈ 336.5
    const start = performance.now();
    const rate = document.getElementById("coffee-rate");
    if (rate) rate.textContent = Math.round(KG_PER_SECOND).toLocaleString("en-GB");

    const elapsed = document.getElementById("coffee-elapsed");
    const pad = (n, len = 2) => String(n).padStart(len, "0");

    // The number is shown as one big figure; screen readers get a
    // separate, calmer version that only updates every 10 seconds
    counter.setAttribute("aria-hidden", "true");
    const sr = document.createElement("span");
    sr.className = "visually-hidden";
    counter.after(sr);

    let lastSpoken = -1;
    const tick = () => {
      const seconds = (performance.now() - start) / 1000;
      const kg = Math.floor(seconds * KG_PER_SECOND);
      counter.textContent = kg.toLocaleString("en-GB");

      if (elapsed) {
        const total = Math.floor(seconds * 10);
        const h = Math.floor(total / 36000);
        const m = Math.floor((total % 36000) / 600);
        const s = Math.floor((total % 600) / 10);
        elapsed.textContent = `${pad(h)}:${pad(m)}:${pad(s)}.${total % 10}`;
      }

      // Only update the screen-reader text every 10 seconds
      const bucket = Math.floor(seconds / 10);
      if (bucket !== lastSpoken) {
        lastSpoken = bucket;
        sr.textContent = `About ${kg.toLocaleString("en-GB")} kilograms`;
      }
    };
    tick();
    setInterval(tick, 100);
  }

  // ---------- 3. Latte cup: steam + sip ----------
  const cup = document.querySelector(".hero-drawing");
  if (cup) {
    const holder = document.createElement("div");
    holder.className = "cup-holder";
    cup.replaceWith(holder);
    holder.appendChild(cup);

    // Squiggly steam: three hand-drawn-style curls, each a little different
    const SQUIGGLES = [
      "M20 118 C 4 104, 36 92, 20 78 S 4 52, 20 40 S 36 16, 18 4",
      "M18 118 C 34 106, 2 94, 18 80 S 36 58, 16 44 S 2 22, 22 6",
      "M20 118 C 6 100, 34 96, 22 76 S 2 60, 18 46 S 38 26, 16 10 S 14 2, 20 2",
    ];
    SQUIGGLES.forEach((d) => {
      const steam = document.createElement("span");
      steam.className = "cup-steam";
      steam.setAttribute("aria-hidden", "true");
      steam.innerHTML = `<svg viewBox="0 0 40 120" fill="none"><path d="${d}" pathLength="100" /></svg>`;
      holder.appendChild(steam);
    });

    cup.setAttribute("role", "button");
    cup.setAttribute("tabindex", "0");
    cup.title = "Take a sip";

    // Caffeine meter: 10 sips fills it and triggers a CAFFEINE RUSH
    const SIPS_FOR_RUSH = 6;
    const RUSH_SECONDS = 8;
    const meter = document.createElement("div");
    meter.className = "caffeine-meter";
    meter.innerHTML = `
      <span class="caffeine-label">Caffeine</span>
      <span class="caffeine-bar" role="progressbar" aria-label="Caffeine level" aria-valuemin="0" aria-valuemax="${SIPS_FOR_RUSH}" aria-valuenow="0">
        ${'<span class="caffeine-seg"></span>'.repeat(SIPS_FOR_RUSH)}
      </span>`;
    holder.after(meter);

    // "Tap the cup" hint + skip link (the home page opens locked until the rush)
    const hint = document.createElement("div");
    hint.className = "cup-hint";
    const HINT_TEXT = "Tap the cup to wake up";
    hint.innerHTML = `
      <span class="cup-hint-text" aria-hidden="true">${[...HINT_TEXT].map((ch, i) => ch === " " ? '<span class="bub-space"> </span>' : `<span class="bub-ch" style="--i:${i}">${ch}</span>`).join("")}</span>
      <span class="visually-hidden">${HINT_TEXT}</span>
      <span class="cup-hint-sub" aria-live="polite">Fill the caffeine meter to start scrolling</span>
      <button type="button" class="cup-skip">skip <span aria-hidden="true">↓</span></button>`;
    meter.after(hint);
    const hintSub = hint.querySelector(".cup-hint-sub");
    holder.classList.add("is-calling");

    // Lock scrolling on the first visit this session, while at the top
    const nextSection = document.querySelector(".panel-intro");
    const lockScroll = !sessionStorage.getItem("homeAwake") && window.scrollY < 20 && nextSection;
    if (lockScroll) document.documentElement.classList.add("is-locked");

    const wakeUp = (smooth) => {
      sessionStorage.setItem("homeAwake", "yes");
      document.documentElement.classList.remove("is-locked");
      holder.classList.remove("is-calling");
      hint.classList.add("is-done");
      if (nextSection) {
        // wait a frame so the page can scroll again, then glide down
        requestAnimationFrame(() => {
          const y = nextSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
          // fallback: if the browser didn't move at all, jump there
          setTimeout(() => {
            if (window.scrollY < 20) window.scrollTo(0, y);
          }, 1600);
        });
      }
    };
    hint.querySelector(".cup-skip").addEventListener("click", () => wakeUp(true));
    const segs = [...meter.querySelectorAll(".caffeine-seg")];
    const bar = meter.querySelector(".caffeine-bar");

    let sips = 0;
    let rushing = false;

    const setMeter = (n) => {
      segs.forEach((s, i) => s.classList.toggle("is-full", i < n));
      bar.setAttribute("aria-valuenow", n);
      meter.classList.toggle("is-almost", n >= SIPS_FOR_RUSH - 2 && n < SIPS_FOR_RUSH);
    };

    const sip = () => {
      cup.classList.remove("is-sipping");
      void cup.offsetWidth; // restart the animation
      cup.classList.add("is-sipping");

      const heart = document.createElement("span");
      heart.className = "sip-heart";
      heart.setAttribute("aria-hidden", "true");
      heart.style.left = `${40 + Math.random() * 20}%`;
      holder.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove());

      if (rushing) {
        heart.textContent = "⚡";
        return;
      }
      sips++;
      setMeter(sips);
      const left = SIPS_FOR_RUSH - sips;
      if (left > 0) hintSub.textContent = left === 1 ? "One more sip…" : `${left} more sips…`;
      heart.textContent = sips === SIPS_FOR_RUSH - 1 ? "one more…" : sips >= SIPS_FOR_RUSH ? "⚡⚡⚡" : "♥";
      if (sips >= SIPS_FOR_RUSH) startRush();
    };

    // ---------- The power-up ----------
    function startRush() {
      rushing = true;
      document.body.classList.add("is-rush");

      // ...and the cup takes over: it scrolls the page down for you
      hintSub.textContent = "Here we go!";
      setTimeout(() => wakeUp(true), reduceMotion ? 0 : 1300);

      const banner = document.createElement("div");
      banner.className = "rush-banner";
      banner.setAttribute("role", "status");
      banner.innerHTML = `
        <span class="rush-title">☕ Caffeine rush!</span>
        <span class="rush-sub">Beans everywhere for ${RUSH_SECONDS} seconds</span>
        <span class="rush-timer"><span></span></span>`;
      document.body.appendChild(banner);
      banner.querySelector(".rush-timer span").style.animationDuration = `${RUSH_SECONDS}s`;

      // the badge sits just above the page title, and slides up to the
      // top of the screen once the title scrolls away
      // a space opens up above the title, and the badge sits in it
      const pageTitle = document.querySelector(".hero h1, .page-title");
      const slot = document.createElement("div");
      slot.className = "rush-slot";
      if (pageTitle) {
        pageTitle.before(slot);
        requestAnimationFrame(() => { slot.style.height = `${banner.offsetHeight + 14}px`; });
      }
      const placeBanner = () => {
        const slotTop = pageTitle ? slot.getBoundingClientRect().top : 0;
        banner.style.top = `${Math.max(12, slotTop + 4)}px`;
      };
      const follow = setInterval(placeBanner, 50); // keeps up while the space opens
      setTimeout(() => clearInterval(follow), 600);
      placeBanner();
      window.addEventListener("scroll", placeBanner, { passive: true });

      const BEANS = ["images/bean-1.png", "images/bean-2.png", "images/bean-3.png"];
      const spawnBean = (x, y, cls) => {
        const b = document.createElement("img");
        b.src = BEANS[Math.floor(Math.random() * BEANS.length)];
        b.alt = "";
        b.className = cls;
        b.style.left = `${x}px`;
        b.style.top = `${y}px`;
        b.style.setProperty("--rot", `${Math.round(Math.random() * 720 - 360)}deg`);
        b.style.setProperty("--drift", `${Math.round(Math.random() * 120 - 60)}px`);
        b.style.width = `${16 + Math.random() * 18}px`;
        document.body.appendChild(b);
        b.addEventListener("animationend", () => b.remove());
        return b;
      };

      // Coffee beans rain down the whole page during the rush.
      // Each bean is animated by the script itself (Web Animations),
      // which keeps them falling smoothly even with lots on screen
      let streams = null;
      let rain = null;
      if (!reduceMotion) {
        const dropBean = () => {
          const b = document.createElement("img");
          b.src = BEANS[Math.floor(Math.random() * BEANS.length)];
          b.alt = "";
          b.className = "rush-bean";
          const size = 22 + Math.random() * 22;
          b.style.width = `${size}px`;
          b.style.left = `${Math.random() * (window.innerWidth - size)}px`;
          document.body.appendChild(b);
          const drift = Math.random() * 80 - 40;
          const spin = Math.random() * 720 - 360;
          const fall = b.animate(
            [
              { transform: "translate3d(0, 0, 0) rotate(0deg)" },
              { transform: `translate3d(${drift}px, ${window.innerHeight + 120}px, 0) rotate(${spin}deg)` },
            ],
            { duration: 2200 + Math.random() * 1600, easing: "cubic-bezier(0.35, 0, 0.75, 1)", fill: "forwards" }
          );
          fall.onfinish = () => b.remove();
        };
        rain = setInterval(dropBean, 70);
      }

      // Bean trail behind the cursor
      let lastTrail = 0;
      const trail = (e) => {
        const now = performance.now();
        if (now - lastTrail < 45) return;
        lastTrail = now;
        spawnBean(e.clientX, e.clientY, "rush-trail");
      };
      if (!reduceMotion) document.addEventListener("pointermove", trail);

      setTimeout(() => {
        clearInterval(rain);
        document.removeEventListener("pointermove", trail);
        document.body.classList.remove("is-rush");
        window.removeEventListener("scroll", placeBanner);
        banner.classList.add("is-leaving");
        setTimeout(() => banner.remove(), 500);
        if (streams) {
          streams.classList.add("is-leaving");
          setTimeout(() => streams.remove(), 900);
        }

        // The crash
        const crash = document.createElement("div");
        crash.className = "rush-banner rush-crash";
        crash.setAttribute("role", "status");
        crash.innerHTML = `<span class="rush-title">☕ You crashed.</span><span class="rush-sub">Sip again to recharge.</span>`;
        document.body.appendChild(crash);
        crash.style.top = banner.style.top;
        setTimeout(() => {
          crash.classList.add("is-leaving");
          setTimeout(() => crash.remove(), 500);
          slot.style.height = "0px";
          setTimeout(() => slot.remove(), 600);
        }, 2600);

        sips = 0;
        setMeter(0);
        rushing = false;
      }, RUSH_SECONDS * 1000);
    }
    cup.addEventListener("click", sip);
    cup.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        sip();
      }
    });
  }

  // ---------- 4. True-or-false quiz (History page) ----------
  const quiz = document.getElementById("quiz");
  if (quiz) {
    const QUESTIONS = [
      {
        q: "A goatherd called Kaldi discovered coffee when his goats started dancing.",
        answer: false,
        why: "It's a legend. The story first appears in writing in 1671, about 800 years after it supposedly happened.",
      },
      {
        q: "The coffee plant is native to the highlands of Ethiopia.",
        answer: true,
        why: "True. Wild coffee comes from the Kaffa region of Ethiopia.",
      },
      {
        q: "People ate coffee before they drank it.",
        answer: true,
        why: "True. Coffee cherries were chewed, and crushed cherries were mixed with fat into energy balls for long journeys.",
      },
      {
        q: "The very first coffee was made from roasted beans.",
        answer: false,
        why: "False. The earliest coffee was brewed from green, unroasted beans. Roasting came later.",
      },
      {
        q: "English coffeehouses were nicknamed \"penny universities\".",
        answer: true,
        why: "True. For the price of a cup, anyone could join the conversation.",
      },
      {
        q: "Coffee was first grown in Brazil in the 1800s.",
        answer: false,
        why: "False. Francisco de Melo Palheta brought coffee to Brazil in 1727.",
      },
      {
        q: "Robusta makes up most of the world's coffee.",
        answer: false,
        why: "False. Arabica is about 60% of world production, although Robusta's share has been growing.",
      },
      {
        q: "Europe drinks more coffee than any other continent.",
        answer: true,
        why: "True. Europe drank about 53.7 million bags in 2023/24, around 30% of the world's coffee.",
      },
      {
        q: "Finland drinks more coffee per person than any other country.",
        answer: true,
        why: "True. Finns get through about 12 kg of coffee each a year.",
      },
      {
        q: "When Starbucks opened in 1971, it sold cups of coffee to take away.",
        answer: false,
        why: "False. It sold whole coffee beans, tea and spices. Drinks only came after Howard Schultz joined.",
      },
    ];

    // ===== The quiz as a story-game scene (one line at a time, click to continue) =====
    const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? Math.min(ms, 120) : ms));
    let name = "";
    let score = 0;
    let started = false;

    quiz.innerHTML = `
      <div class="vn-psst" aria-hidden="true">PSST!</div>
      <div class="vn-hud">
        <div class="vn-toast" role="status" aria-live="polite"></div>
        <div class="vn-beans" aria-label="Score"><span class="vn-beans-icons" aria-hidden="true"></span><span class="vn-beans-count">0 / ${QUESTIONS.length}</span></div>
      </div>
      <div class="vn-box">
        <div class="vn-speaker"><img src="images/mug-rotated.png" alt=""><span>The Barista</span></div>
        <p class="vn-line" aria-live="polite"></p>
        <button type="button" class="vn-next" hidden>Continue <span aria-hidden="true">▸</span></button>
      </div>
      <div class="vn-choices"></div>`;

    const line = quiz.querySelector(".vn-line");
    const nextBtn = quiz.querySelector(".vn-next");
    const choicesEl = quiz.querySelector(".vn-choices");
    const toastEl = quiz.querySelector(".vn-toast");
    const beansEl = quiz.querySelector(".vn-beans-icons");
    const beansCount = quiz.querySelector(".vn-beans-count");
    const scene = quiz.closest(".section");

    // Type a line out letter by letter (clicking finishes it at once)
    let skipTyping = null;
    function typeLine(html) {
      return new Promise((resolve) => {
        line.classList.remove("is-in");
        void line.offsetWidth;
        line.classList.add("is-in");
        if (reduceMotion) {
          line.innerHTML = html;
          resolve();
          return;
        }
        // Build the text as hidden letters, then reveal them one by one
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const letters = [];
        const wrap = (node) => {
          [...node.childNodes].forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const frag = document.createDocumentFragment();
              [...child.textContent].forEach((ch) => {
                const s = document.createElement("span");
                s.className = "vn-ch";
                s.textContent = ch;
                frag.appendChild(s);
                letters.push(s);
              });
              child.replaceWith(frag);
            } else {
              wrap(child);
            }
          });
        };
        wrap(tmp);
        line.innerHTML = "";
        while (tmp.firstChild) line.appendChild(tmp.firstChild);

        let i = 0;
        const finish = () => {
          clearInterval(timer);
          letters.forEach((l) => l.classList.add("is-shown"));
          skipTyping = null;
          resolve();
        };
        const timer = setInterval(() => {
          if (i >= letters.length) return finish();
          letters[i++].classList.add("is-shown");
        }, 22);
        skipTyping = finish;
      });
    }

    // Wait for a click / Space / Enter to continue
    let advance = null;
    function waitForContinue() {
      return new Promise((resolve) => {
        nextBtn.hidden = false;
        advance = () => {
          nextBtn.hidden = true;
          advance = null;
          resolve();
        };
      });
    }

    // Clicking the dialogue: finish typing, or continue
    quiz.querySelector(".vn-box").addEventListener("click", () => {
      if (skipTyping) skipTyping();
      else if (advance) advance();
    });
    document.addEventListener("keydown", (e) => {
      if (!started || !scene) return;
      const r = scene.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // only when on screen
      if (e.target.closest("input")) return;
      if (e.key === " " || e.key === "Enter") {
        if (skipTyping) { e.preventDefault(); skipTyping(); }
        else if (advance) { e.preventDefault(); advance(); }
      }
    });

    // A line of dialogue. With choices coming next, there's no "continue" step
    async function say(html, { thenChoose = false, shake = false } = {}) {
      choicesEl.innerHTML = "";
      if (shake && !reduceMotion) {
        line.classList.add("is-shaking");
        setTimeout(() => line.classList.remove("is-shaking"), 600);
      }
      await typeLine(html);
      if (!thenChoose) await waitForContinue();
    }

    // Story-game choices
    function choose(options) {
      return new Promise((resolve) => {
        choicesEl.innerHTML = "";
        choicesEl.classList.toggle("is-binary", options.length === 2);
        options.forEach((opt, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "vn-choice";
          b.style.setProperty("--i", i);
          const arrowL = options.length === 2 && i === 0 ? '<span class="vn-arrow" aria-hidden="true">◀</span>' : "";
          const arrowR = options.length === 2 && i === 1 ? '<span class="vn-arrow" aria-hidden="true">▶</span>' : "";
          b.innerHTML = `${arrowL}<span class="vn-key" aria-hidden="true">${i + 1}</span><span>${opt}</span>${arrowR}`;
          b.addEventListener("click", () => {
            document.removeEventListener("keydown", onKey);
            b.classList.add("is-picked");
            choicesEl.querySelectorAll("button").forEach((x) => (x.disabled = true));
            setTimeout(() => {
              choicesEl.innerHTML = "";
              resolve(opt);
            }, reduceMotion ? 0 : 450);
          });
          choicesEl.appendChild(b);
        });
        const onKey = (e) => {
          const buttons = [...choicesEl.querySelectorAll("button")];
          if (!buttons.length) return;
          let idx = -1;
          if (/^[1-9]$/.test(e.key)) idx = Number(e.key) - 1;
          if (buttons.length === 2 && e.key === "ArrowLeft") idx = 0;
          if (buttons.length === 2 && e.key === "ArrowRight") idx = 1;
          if (buttons[idx]) {
            e.preventDefault();
            buttons[idx].click();
          }
        };
        document.addEventListener("keydown", onKey);
        choicesEl.querySelector("button").focus({ preventScroll: true });
      });
    }

    // Name entry, styled like a story-game prompt
    function askName() {
      return new Promise((resolve) => {
        choicesEl.classList.remove("is-binary");
        choicesEl.innerHTML = `
          <form class="vn-name">
            <label class="visually-hidden" for="vn-name-input">Your name</label>
            <input id="vn-name-input" type="text" maxlength="24" placeholder="Your name" autocomplete="given-name">
            <div class="vn-name-buttons">
              <button type="submit" class="vn-choice"><span class="vn-key" aria-hidden="true">↵</span><span>That's me</span></button>
              <button type="button" class="vn-choice vn-skip"><span class="vn-key" aria-hidden="true">–</span><span>Rather not say</span></button>
            </div>
          </form>`;
        const form = choicesEl.querySelector("form");
        const field = form.querySelector("input");
        field.focus({ preventScroll: true });
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const v = field.value.trim().slice(0, 24);
          choicesEl.innerHTML = "";
          resolve(v);
        });
        form.querySelector(".vn-skip").addEventListener("click", () => {
          choicesEl.innerHTML = "";
          resolve("");
        });
      });
    }

    // "The barista will remember that." — the consequence notification
    function toast(text, good) {
      toastEl.innerHTML = `<span class="vn-toast-icon" aria-hidden="true">${good ? "☕" : "✎"}</span>${text}`;
      toastEl.classList.toggle("is-good", !!good);
      toastEl.classList.remove("is-showing");
      void toastEl.offsetWidth;
      toastEl.classList.add("is-showing");
    }

    function updateBeans() {
      beansEl.innerHTML = Array.from({ length: QUESTIONS.length }, (_, i) =>
        `<img src="images/bean-${(i % 3) + 1}.png" alt="" class="${i < score ? "is-earned" : ""}">`
      ).join("");
      beansCount.textContent = `${score} / ${QUESTIONS.length}`;
    }

    const RIGHT = ["Ooh, spot on.", "Yes! Nailed it.", "Correct. Look at you go.", "Exactly right.", "Bang on."];
    const WRONG = ["Ah… not quite.", "Ooh, close. But no.", "Nope. Easy mistake, though.", "Not this time.", "Hmm. Not quite."];
    const GOOD_TOASTS = ["The barista is impressed.", "You earned a coffee bean.", "The barista nods approvingly."];
    const BAD_TOASTS = ["The barista will remember that.", "The barista raises an eyebrow.", "The barista will remember that."];
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    async function run() {
      score = 0;
      updateBeans();
      await say("Hey. <strong>You.</strong> Yes, you. Don't scroll away just yet.", { shake: true });
      await say("You've just read the whole of The Coffee Project. Let's see how much of it stuck.");
      await say("First things first… what should I call you?", { thenChoose: true });
      name = await askName();
      const who = name ? esc(name) : "coffee lover";
      if (name) toast(`The barista will remember your name.`, true);
      await say(name ? `<strong>${who}.</strong> Nice to meet you. ☕` : "Fine. I'll call you <strong>coffee lover</strong>. ☕");
      await say(`Here's how this works. I tell you something. You decide: <strong>true</strong>, or <strong>false</strong>.`, { thenChoose: true });
      await choose(["I'm ready.", "Pour me a question."]);

      for (let i = 0; i < QUESTIONS.length; i++) {
        const item = QUESTIONS[i];
        await say(`<span class="vn-qnum">Question ${i + 1} of ${QUESTIONS.length}</span>${item.q}`, { thenChoose: true });
        const answer = await choose(["True", "False"]);
        const right = (answer === "True") === item.answer;
        if (right) score++;
        updateBeans();
        toast(pick(right ? GOOD_TOASTS : BAD_TOASTS), right);
        await say(`<strong class="${right ? "is-right" : "is-wrong"}">${pick(right ? RIGHT : WRONG)}</strong> ${item.why}`);
      }

      const total = QUESTIONS.length;
      let verdict;
      if (score === total) verdict = `Full marks, ${who}. You're a true coffee connoisseur.`;
      else if (score >= 7) verdict = `Nicely brewed, ${who}. Just a few beans short of perfect.`;
      else if (score >= 4) verdict = `Not bad, ${who}. A solid medium roast. Come back stronger.`;
      else verdict = `A little under-extracted, ${who}. Have another look around and try again.`;
      await say(`<span class="vn-score">${score} / ${total}</span>${verdict}`, { thenChoose: true });

      const again = await choose(["Play again", "Show me the sources"]);
      if (again === "Play again") {
        run();
      } else {
        await say('Every source and image credit is on the <a href="sources.html">Sources page</a>. Thanks for reading. ☕', { thenChoose: true });
        await choose(["Take me to the Sources"]);
        window.location.href = "sources.html";
      }
    }

    // Start suddenly as soon as the scene comes into view
    function begin() {
      if (started) return;
      started = true;
      if (scene && !reduceMotion) {
        scene.classList.add("is-sudden");
        setTimeout(() => scene.classList.remove("is-sudden"), 1400);
      }
      setTimeout(run, reduceMotion ? 0 : 900);
    }
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          begin();
        }
      }, { threshold: 0.35 });
      io.observe(quiz);
    } else {
      begin();
    }
  }
})();

// ============================================================
// 5. Timer story (home): grows to full screen, then steps through
//    the story as you scroll
// 6. Clickable titles: letters do a wave when you click a big title,
//    section headings wobble
// ============================================================
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 5. Timer story ----------
  const story = document.querySelector(".timer-story");
  if (story) {
    const steps = [...story.querySelectorAll(".story-step")];
    const dots = [...story.querySelectorAll(".story-dots span")];
    const stage = story.querySelector(".timer-stage");
    // A cream copy of the captions and dots that only shows below the
    // coffee's surface, so text is never brown on brown mid-fill
    const cream = document.createElement("div");
    cream.className = "story-cream";
    cream.setAttribute("aria-hidden", "true");
    [".story-steps", ".story-dots"].forEach((s) => {
      const el = stage.querySelector(s);
      if (el) cream.appendChild(el.cloneNode(true));
    });
    cream.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    stage.appendChild(cream);
    const creamSteps = [...cream.querySelectorAll(".story-step")];
    const creamDots = [...cream.querySelectorAll(".story-dots span")];
    const storyTop = stage.querySelector(".story-top");
    // How full the "cup" is: rises gently through steps 1–4 (staying
    // below the captions), then fills the whole screen on the last step
    const LOW = 0.34, MID = 0.48, LAST = 0.8;
    let ticking = false;
    let current = -1;

    const update = () => {
      ticking = false;
      const rect = story.getBoundingClientRect();
      const total = story.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));

      let level;
      if (p < LAST) {
        level = LOW + (MID - LOW) * (p / LAST);
      } else {
        const t = (p - LAST) / (1 - LAST);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        level = MID + (1.02 - MID) * eased;
      }
      story.style.setProperty("--level", level.toFixed(3));
      // each piece of text turns cream exactly when the coffee surface
      // (the middle of the waves) passes its middle
      if (storyTop) {
        const sr = stage.getBoundingClientRect();
        const r = storyTop.getBoundingClientRect();
        storyTop.classList.toggle("is-under", r.top + r.height / 2 - sr.top > sr.height * (1 - level) - 30);
      }

      const n = steps.length;
      const idx = Math.min(n - 1, Math.floor(p * n));
      if (idx !== current) {
        current = idx;
        steps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
        dots.forEach((d, i) => d.classList.toggle("is-active", i <= idx));
        creamSteps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
        creamDots.forEach((d, i) => d.classList.toggle("is-active", i <= idx));
      }
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // ---------- 6. Clickable titles ----------
  // Split a big title into letters (keeping words together) so they can wave
  function splitTitle(title) {
    if (!title.hasAttribute("aria-label")) {
      const clone = title.cloneNode(true);
      clone.querySelectorAll(".drawing-o").forEach((o) => o.replaceWith("o"));
      title.setAttribute("aria-label", clone.textContent.replace(/\s+/g, " ").trim());
    }
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          const insideWord = !!child.parentElement.closest(".word");
          child.textContent.split(/(\s+)/).forEach((chunk) => {
            if (!chunk) return;
            if (/^\s+$/.test(chunk)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const holder = insideWord ? frag : document.createElement("span");
            if (!insideWord) holder.className = "title-word";
            [...chunk].forEach((ch) => {
              const s = document.createElement("span");
              s.className = "char";
              s.textContent = ch;
              s.style.setProperty("--n", n++);
              holder.appendChild(s);
            });
            if (!insideWord) frag.appendChild(holder);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.classList.contains("drawing-o")) {
            child.classList.add("char");
            child.style.setProperty("--n", n++);
          } else {
            walk(child);
          }
        }
      });
    };
    walk(title);
  }

  function play(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth; // restart the animation
    el.classList.add(cls);
    clearTimeout(el._playTimer);
    el._playTimer = setTimeout(() => el.classList.remove(cls), ms);
  }

  document.querySelectorAll(".hero h1, .page-title").forEach((title) => {
    splitTitle(title);
    title.classList.add("is-clickable-title");
    title.title = "Click me!";
    title.addEventListener("click", () => {
      if (reduceMotion) return;
      const count = title.querySelectorAll(".char").length;
      play(title, "is-waving", 700 + count * 45);
    });
  });

  document.querySelectorAll(".section h2, .summary-intro h2").forEach((h) => {
    h.classList.add("is-clickable-title");
    h.addEventListener("click", () => {
      if (!reduceMotion) play(h, "is-jelly", 800);
    });
  });
})();

// ============================================================
// 7. Interactive images
//    - Chapter pictures tilt in 3D and catch the light as you move the mouse
//    - Photos across the site open larger (with caption) when clicked
// ============================================================
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Tilt ----------
  if (!reduceMotion) {
    document.querySelectorAll(".chapter").forEach((chapter) => {
      const fig = chapter.querySelector(".chapter-img");
      if (!fig) return;
      chapter.addEventListener("pointermove", (e) => {
        const r = fig.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;   // 0 → 1
        const y = (e.clientY - r.top) / r.height;
        fig.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
        fig.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
        fig.style.setProperty("--gx", `${x * 100}%`);
        fig.style.setProperty("--gy", `${y * 100}%`);
      });
      chapter.addEventListener("pointerleave", () => {
        ["--rx", "--ry"].forEach((v) => fig.style.setProperty(v, "0deg"));
      });
    });
  }

  // ---------- Click to enlarge ----------
  const ZOOMABLE = ".photo img, .gallery img, .tl-card-img img, .card-img";

  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Enlarged picture");
  box.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close">×</button>
    <figure class="lightbox-figure">
      <img alt="">
      <figcaption></figcaption>
    </figure>`;
  document.body.appendChild(box);
  const bigImg = box.querySelector("img");
  const bigCap = box.querySelector("figcaption");
  let lastFocus = null;

  function captionFor(img) {
    const fig = img.closest("figure");
    const cap = fig && fig.querySelector("figcaption");
    if (cap) return cap.innerHTML;
    return img.alt || "";
  }

  function open(img) {
    lastFocus = document.activeElement;
    bigImg.src = img.currentSrc || img.src;
    bigImg.alt = img.alt || "";
    bigCap.innerHTML = captionFor(img);
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("is-open"));
    box.querySelector(".lightbox-close").focus({ preventScroll: true });
  }

  function close() {
    box.classList.remove("is-open");
    setTimeout(() => {
      box.hidden = true;
      bigImg.removeAttribute("src");
    }, reduceMotion ? 0 : 250);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  // Mark zoomable photos (timeline pictures are added later, so this
  // also runs when they appear)
  function mark(root) {
    root.querySelectorAll(ZOOMABLE).forEach((img) => {
      if (img.dataset.zoomable) return;
      img.dataset.zoomable = "1";
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", `Enlarge picture${img.alt ? ": " + img.alt : ""}`);
    });
  }
  mark(document);
  new MutationObserver(() => mark(document)).observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", (e) => {
    const img = e.target.closest(ZOOMABLE);
    if (img && !box.contains(img)) {
      e.preventDefault();
      open(img);
      return;
    }
    if (!box.hidden && (e.target === box || e.target.closest(".lightbox-close"))) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!box.hidden && e.key === "Escape") close();
    const img = e.target.closest && e.target.closest(ZOOMABLE);
    if (img && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open(img);
    }
  });
})();

// ============================================================
// 8. "Scroll" hints: the words bubble onto the screen, then a big,
//    solid, looping arrow draws itself down through all the empty
//    space to the bottom of the screen, and fades once you scroll.
//    (Runs after every other script has built the page.)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hints = document.querySelectorAll(".scroll-hint, .page-hero-hint");
  if (!hints.length) return;

  const NS = "http://www.w3.org/2000/svg";
  const LOOP = "M50 6 C 52 32, 18 44, 26 70 C 34 96, 82 94, 80 66 C 78 42, 36 46, 38 80 C 40 104, 50 118, 50 140";
  const HEAD = (dy) =>
    `M24 ${142 + dy} C 34 ${145 + dy}, 42 ${149 + dy}, 50 ${151 + dy} C 58 ${149 + dy}, 66 ${145 + dy}, 76 ${142 + dy} ` +
    `C 81 ${142 + dy}, 83 ${147 + dy}, 79 ${152 + dy} C 70 ${166 + dy}, 60 ${178 + dy}, 53 ${188 + dy} ` +
    `C 51 ${191 + dy}, 49 ${191 + dy}, 47 ${188 + dy} C 40 ${178 + dy}, 30 ${166 + dy}, 21 ${152 + dy} ` +
    `C 17 ${147 + dy}, 19 ${142 + dy}, 24 ${142 + dy} Z`;

  hints.forEach((hint) => {
    // 1. Words bubble in, letter by letter
    const words = hint.textContent.trim();
    hint.textContent = "";
    hint.setAttribute("aria-label", words);
    const text = document.createElement("span");
    text.className = "bubble-text";
    text.setAttribute("aria-hidden", "true");
    [...words].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = ch === " " ? "bub-space" : "bub-ch";
      s.textContent = ch === " " ? " " : ch;
      s.style.setProperty("--i", i);
      text.appendChild(s);
    });
    hint.appendChild(text);
    const lettersDone = 0.3 + words.length * 0.04 + 0.4; // seconds

    // 2. The arrow
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "magic-arrow");
    svg.setAttribute("aria-hidden", "true");
    const line = document.createElementNS(NS, "path");
    line.setAttribute("class", "ma-line");
    line.setAttribute("pathLength", "100");
    const head = document.createElementNS(NS, "path");
    head.setAttribute("class", "ma-head");
    svg.append(line, head);
    hint.appendChild(svg);
    svg.style.setProperty("--start", `${lettersDone}s`);

    const BASE_WIDTH = Math.min(90, Math.max(70, window.innerWidth * 0.065)); // px
    const layout = () => {
      const top = svg.getBoundingClientRect().top + window.scrollY;
      // fits in the space left on the opening screen (up to 260px);
      // on short screens it shrinks rather than spilling onto the next section
      // a good-sized arrow (180–240px). It uses the free space on the opening
      // screen with a ~70px gap at the bottom; if there isn't enough, the
      // opening grows to hold it, so the next section never cuts it off
      const room = window.innerHeight - top - 70;
      const avail = Math.max(180, Math.min(240, room));
      // the loop + head need ~200 units of height, so narrow the arrow if needed
      const WIDTH = Math.min(BASE_WIDTH, avail / 2);
      const scale = WIDTH / 100;
      const h = avail / scale;                                      // viewBox height
      const tailEnd = h - 52;
      const dy = Math.max(0, tailEnd - 140) - 4;   // where the head sits
      // the line runs a little way into the head so the two are joined
      line.setAttribute("d", `${LOOP} L 50 ${(156 + dy).toFixed(1)}`);
      head.setAttribute("d", HEAD(dy));
      svg.setAttribute("viewBox", `0 0 100 ${h.toFixed(1)}`);
      svg.setAttribute("width", WIDTH.toFixed(0));
      svg.setAttribute("height", avail.toFixed(0));
    };
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts) document.fonts.ready.then(layout);
    window.addEventListener("load", layout);

    // 3. Fade the arrow away as soon as you start scrolling
    if (!reduceMotion) {
      const fade = () => {
        // fades as the arrow moves up the screen: fully visible while it's
        // in the lower part, gone once it reaches the top quarter
        const r = svg.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.55 - r.top) / (vh * 0.4)));
        const eased = p * p * (3 - 2 * p); // smooth start and finish
        svg.style.opacity = String(1 - eased);
        svg.style.translate = `0 ${eased * 20}px`;
      };
      window.addEventListener("scroll", fade, { passive: true });
    }
  });
});
