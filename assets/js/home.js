/* ============ Musin — Home landing (GSAP animations) ============ */

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Mobile menu ---------- */
const burger = document.querySelector(".nav-burger");
const mobileMenu = document.querySelector(".mobile-menu");

burger.addEventListener("click", () => {
  const open = burger.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
});

/* ---------- Hero wheels ----------
   Both panes use the 3D coverflow from the other landings: cards are placed by
   "slot" (signed distance from the centre, wrapping round the list) so only
   slots -1/0/+1 are visible and the side cards face outward. Here they advance
   on a timer only — no arrows, no dragging, no play/pause. */
function createWheel(stage, { onCentre, interval = 3.2, dim = 0.28, auto = true } = {}) {
  const cards = [...stage.children];
  const N = cards.length;
  if (!N) return null;

  let centreIndex = 0;
  const lastSlot = new Array(N).fill(null);

  function render() {
    const cardW = cards[0].offsetWidth || 160;
    const spacing = cardW * 0.9; // room so the side cards aren't hidden behind the centre
    cards.forEach((card, i) => {
      let s = (((i - centreIndex) % N) + N) % N; // 0..N-1
      if (s > N / 2) s -= N; // wrap to a signed slot
      const a = Math.abs(s);
      const dir = Math.sign(s);
      const near = Math.min(a, 2);
      const rotateY = dir * Math.min(a, 1) * 42; // side cards face outward
      const tx = s * spacing;
      const tz = -near * 100;
      const scale = 1 - near * 0.16;
      /* a gentler falloff than the other landings use — these wheels sit on a
         lighter card, where a heavy dim just looks muddy */
      const bright = 1 - near * dim;

      const prev = lastSlot[i];
      const wrapped = prev !== null && Math.abs(s - prev) > N / 2;
      if (wrapped) card.style.transition = "none"; // jump hidden cards silently

      card.style.transform =
        `translate(-50%, -50%) perspective(1400px) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      card.style.filter = `brightness(${bright.toFixed(3)})`;
      card.style.opacity = a <= 1 ? "1" : "0";
      card.style.zIndex = String(100 - a * 10);

      if (wrapped) {
        void card.offsetWidth; // force reflow, then restore the transition
        card.style.transition = "";
      }
      lastSlot[i] = s;
    });
    if (onCentre) onCentre(cards[centreIndex], cards);
  }

  // lay the cards out before their first paint so nothing slides in from a pile
  stage.classList.add("no-anim");
  render();
  void stage.offsetWidth;
  stage.classList.remove("no-anim");

  window.addEventListener("resize", render);

  /* The timer runs from the start and the observer only pauses it off screen,
     so a wheel can never end up stuck if the observer never reports back. */
  let timer = null;
  if (auto && !prefersReducedMotion) {
    timer = gsap.to({}, {
      duration: interval,
      repeat: -1,
      onRepeat: () => {
        centreIndex = (centreIndex + 1) % N;
        render();
      },
    });
  }

  return {
    render,
    cards,
    centre: () => cards[centreIndex],
    play: () => timer && timer.play(),
    pause: () => timer && timer.pause(),
    setCentre(i) {
      const next = ((i % N) + N) % N;
      if (next === centreIndex) return;
      centreIndex = next;
      render();
    },
  };
}

/* ---- Promote Music: campaign cards, as on the Music landing ---- */
const campaigns = [
  ["Miss the rage", "Den Best", 4, "14", "486,320", "24,316"],
  ["Still lonely", "Hoover", 5, "18", "793,540", "39,677"],
  ["6 Gold", "Leboi", 6, "23", "1,247,860", "62,393"],
  ["You’re my fire", "Flare John", 7, "32", "2,335,132", "116,757"],
  ["SVEG", "Lukrix", 8, "27", "1,684,710", "84,236"],
  ["My world", "Je333", 9, "41", "3,928,450", "196,423"],
  ["U WUT", "Zen X", 10, "56", "5,612,780", "280,639"],
  ["Can’t get away", "Lin Xiao", 11, "68", "7,438,920", "371,946"],
  ["Adrenaline rush", "Quayo", 12, "84", "9,126,370", "456,319"],
  ["Not 1 of us", "ZEZTI", 13, "36", "4,287,640", "214,382"],
];

const campaignStage = document.getElementById("campaignScroller");
let campaignWheel = null;

if (campaignStage) {
  campaignStage.innerHTML = campaigns
    .map(
      ([title, artist, cover, posts, views, engagements]) => `
      <article class="campaign-tile">
        <div class="campaign-tile__cover" style="background-image:url('assets/img/covers/cover-${cover}.jpg')"></div>
        <div class="campaign-tile__body">
          <div class="campaign-tile__track">
            <p class="campaign-tile__title">${title}</p>
            <p class="campaign-tile__artist">${artist}</p>
          </div>
          <dl class="campaign-tile__stats">
            <div><dt>Posts</dt><dd>${posts}</dd></div>
            <div><dt>Views</dt><dd>${views}</dd></div>
            <div><dt>Engagements</dt><dd>${engagements}</dd></div>
          </dl>
        </div>
      </article>`
    )
    .join("");

  campaignWheel = createWheel(campaignStage);
}

/* ---- Create Content: real clips, autoplaying and advancing on their own ---- */
const clipStage = document.getElementById("clipScroller");
let clipWheel = null;

if (clipStage) {
  clipWheel = createWheel(clipStage, {
    interval: 4.2, // a beat longer, so each clip gets a moment to play
    onCentre: (card, cards) => {
      cards.forEach((c) => {
        const v = c.querySelector("video");
        if (v && c !== card && typeof v.pause === "function") v.pause();
      });
      const video = card && card.querySelector("video");
      if (!video || typeof video.play !== "function") return;
      try { video.currentTime = 0; } catch (e) {}
      const p = video.play();
      if (p && p.catch) {
        p.catch(() => {
          // not buffered yet — retry once it can play
          video.addEventListener("canplay", () => {
            const r = video.play();
            if (r && r.catch) r.catch(() => {});
          }, { once: true });
        });
      }
    },
  });
}

/* ---------- Hero tabs ----------
   Only the visible pane's wheel runs, so the hidden one isn't decoding video
   or burning frames off screen. */
const modeTabs = [...document.querySelectorAll(".mode-tab")];

function selectMode(tab) {
  modeTabs.forEach((t) => {
    const on = t === tab;
    const pane = document.getElementById(t.getAttribute("aria-controls"));
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    if (!pane) return;
    pane.hidden = !on;
    pane.classList.toggle("is-active", on);
  });

  const musicOn = tab.id === "tabMusic";
  if (campaignWheel) musicOn ? campaignWheel.play() : campaignWheel.pause();
  if (clipWheel) {
    if (musicOn) {
      clipWheel.pause();
      clipWheel.cards.forEach((c) => {
        const v = c.querySelector("video");
        if (v && typeof v.pause === "function") v.pause();
      });
    } else {
      clipWheel.play();
      // the pane was display:none until now, so re-measure before playing
      clipWheel.render();
      const v = clipWheel.centre().querySelector("video");
      if (v && typeof v.play === "function") {
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      }
    }
  }
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectMode(tab));
  tab.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = modeTabs.indexOf(tab);
    const next = modeTabs[(i + (e.key === "ArrowRight" ? 1 : modeTabs.length - 1)) % modeTabs.length];
    next.focus();
    selectMode(next);
  });
});

// the Content pane starts hidden, so its wheel shouldn't be running yet
if (clipWheel) clipWheel.pause();

/* Pause both wheels while the hero is off screen */
const heroSection = document.getElementById("hero");
if (heroSection) {
  new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      const activeTab = modeTabs.find((t) => t.classList.contains("is-active"));
      if (e.isIntersecting) {
        if (activeTab) selectMode(activeTab);
      } else {
        if (campaignWheel) campaignWheel.pause();
        if (clipWheel) {
          clipWheel.pause();
          clipWheel.cards.forEach((c) => {
            const v = c.querySelector("video");
            if (v && typeof v.pause === "function") v.pause();
          });
        }
      }
    }),
    { threshold: 0.15 }
  ).observe(heroSection);
}

/* ---------- Why Musin: a coverflow the page scroll drives ----------
   Same wheel as the hero, but instead of a timer the centre index tracks how
   far the section has travelled through the viewport, so the cards turn as
   the reader scrolls past them. */
const whyStage = document.getElementById("whyStack");

if (whyStage) {
  const whyWheel = createWheel(whyStage, { auto: false, dim: 0.34 });

  if (whyWheel && !prefersReducedMotion) {
    const steps = whyWheel.cards.length;
    ScrollTrigger.create({
      trigger: ".why",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        // hold the first and last card a little longer than the middle ones
        const eased = gsap.utils.clamp(0, 1, (self.progress - 0.15) / 0.7);
        whyWheel.setCentre(Math.round(eased * (steps - 1)));
      },
    });
  }
}

/* ---------- Statistics ----------
   Each number gently fluctuates within its own range. A slow triangle wave off
   the real clock sets the starting value (so it drifts over time and is the
   same for everyone), then live nudges keep it moving. */
const COUNT_EPOCH = Date.UTC(2026, 6, 1); // 1 Jul 2026
const COUNT_STEP_MS = 8 * 60 * 1000; // drift one step every ~8 minutes

/* Unlike the other landings, the two numbers here sit side by side, so they
   keep one shared size from the stylesheet rather than each being scaled to
   the width of its own label — that left them visibly different sizes. */
function liveCounter(numberEl, min, max) {
  if (!numberEl) return;

  const clamp = (n) => Math.min(max, Math.max(min, Math.round(n)));

  const span = max - min;
  const step = Math.floor((Date.now() - COUNT_EPOCH) / COUNT_STEP_MS);
  let value = min + Math.abs((step % (2 * span)) - span); // triangle wave

  let lastStr = "";
  function render(n) {
    const s = Math.round(n).toLocaleString("en-US");
    if (s === lastStr) return;
    lastStr = s;
    numberEl.textContent = s;
  }

  render(value);

  if (prefersReducedMotion) return;

  function schedule() {
    gsap.delayedCall(gsap.utils.random(20, 45), () => {
      const goesUp = value <= min ? true : value >= max ? false : Math.random() < 0.5;
      const to = clamp(value + (goesUp ? 1 : -1) * Math.ceil(Math.random() * 2));
      gsap.to({ v: value }, {
        v: to,
        duration: 1.1,
        ease: "power2.out",
        onUpdate() { render(this.targets()[0].v); },
      });
      value = to;
      schedule();
    });
  }
  schedule();
}

liveCounter(document.getElementById("trackCount"), 3764, 3873);
liveCounter(document.getElementById("creatorCount"), 7843, 8214);

/* ---------- Logos: auto-run left to right ---------- */
const logoMarquee = document.getElementById("logoMarquee");
if (logoMarquee) {
  logoMarquee.appendChild(logoMarquee.querySelector(".logos__group").cloneNode(true));
  gsap.fromTo(
    logoMarquee,
    { xPercent: -50 },
    { xPercent: 0, duration: 30, ease: "none", repeat: -1 }
  );
}

/* ---------- Section entrance animations ---------- */
if (!prefersReducedMotion) {
  gsap.utils
    .toArray([".home-hero__title", ".about__text", ".section-title"])
    .forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
}
