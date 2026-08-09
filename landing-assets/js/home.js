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
function createWheel(stage, { onCentre, interval = 3.2, dim = 0.28, drag = false, auto = true, start = 0 } = {}) {
  const cards = [...stage.children];
  const N = cards.length;
  if (!N) return null;

  let centreIndex = ((start % N) + N) % N;
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
      card.classList.toggle("is-centre", s === 0);

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

  function step(delta) {
    centreIndex = (((centreIndex + delta) % N) + N) % N;
    render();
  }

  /* Drag with a pointer, swipe on touch, or flick a trackpad sideways. Any of
     them moves the wheel one card and restarts the timer, so the automatic
     rotation never fights the reader mid-gesture. */
  if (drag) {
    const restart = () => {
      if (!timer) return;
      timer.restart(true);
    };

    let startX = null;
    let moved = false;
    stage.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      moved = false;
      stage.classList.add("is-dragging");
      if (timer) timer.pause();
    });

    stage.addEventListener("pointermove", (e) => {
      if (startX !== null && Math.abs(e.clientX - startX) > 6) moved = true;
    });

    const endDrag = (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      stage.classList.remove("is-dragging");
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      if (timer) { timer.play(); restart(); }
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    /* Click or tap a card either side to bring it to the centre. A click that
       ended a drag is ignored, so dragging never also steps twice. */
    cards.forEach((card, i) => {
      card.addEventListener("click", () => {
        if (moved) return;
        let s = (((i - centreIndex) % N) + N) % N;
        if (s > N / 2) s -= N;
        if (s !== 0) { step(s); restart(); }
      });
    });

    /* Sideways trackpad and wheel input. preventDefault runs on every
       horizontal event — including the ones swallowed by the lock — so a
       flick can never fall through to the browser's back gesture. */
    /* A trackpad flick arrives as a long burst of events with momentum
       trailing behind it. The lock is released only once that burst goes
       quiet, so one gesture always moves exactly one card. */
    let wheelLock = false;
    let wheelIdle = null;
    stage.addEventListener("wheel", (e) => {
      // only claim the gesture when it's clearly sideways, so the page can
      // still scroll vertically over the cards
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(wheelIdle);
      wheelIdle = setTimeout(() => { wheelLock = false; }, 260);
      if (wheelLock || Math.abs(e.deltaX) < 6) return;
      wheelLock = true;
      step(e.deltaX > 0 ? 1 : -1);
      restart();
    }, { passive: false });
  }

  return {
    render,
    cards,
    centre: () => cards[centreIndex],
    play: () => timer && timer.play(),
    pause: () => timer && timer.pause(),
    step,
  };
}

/* ---- Promote Music: campaign cards, as on the Music landing ---- */
/* Deliberately not the catalogue the "Tracks available now" row cycles —
   these are campaigns, and repeating the same titles read as a bug. */
const campaigns = [
  ["Nightshift", "Roka", 16, "14", "486,320", "24,316"],
  ["Paper planes", "Mibbo", 17, "18", "793,540", "39,677"],
  ["Slow motion", "Kaydo", 18, "23", "1,247,860", "62,393"],
  ["No signal", "Vintr", 19, "32", "2,335,132", "116,757"],
  ["Overdrive", "Sayu", 20, "27", "1,684,710", "84,236"],
  ["Bad habit", "Trell", 21, "41", "3,928,450", "196,423"],
  ["Golden hour", "Nyra", 22, "56", "5,612,780", "280,639"],
  ["Rewind", "Osco", 1, "68", "7,438,920", "371,946"],
  ["Static", "Halvo", 2, "84", "9,126,370", "456,319"],
  ["Late reply", "Pim", 3, "36", "4,287,640", "214,382"],
];

const campaignStage = document.getElementById("campaignScroller");
let campaignWheel = null;

if (campaignStage) {
  campaignStage.innerHTML = campaigns
    .map(
      ([title, artist, cover, posts, views, engagements]) => `
      <article class="campaign-tile">
        <div class="campaign-tile__cover" style="background-image:url('/landing-assets/img/covers/cover-${cover}.jpg')"></div>
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

  campaignWheel = createWheel(campaignStage, { drag: true });
}

/* ---- Create Content: real clips, autoplaying and advancing on their own ---- */
const clipStage = document.getElementById("clipScroller");
let clipWheel = null;

if (clipStage) {
  clipWheel = createWheel(clipStage, {
    drag: true,
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

/* ---------- Each wheel runs only while its own section is on screen ---------- */
function runInView(wheel, sectionId) {
  if (!wheel) return;
  const section = document.getElementById(sectionId);
  if (!section) return;
  new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        wheel.render(); // the section may have been laid out at zero width
        wheel.play();
      } else {
        wheel.pause();
        wheel.cards.forEach((c) => {
          const v = c.querySelector("video");
          if (v && typeof v.pause === "function") v.pause();
        });
      }
    }),
    { threshold: 0.15 }
  ).observe(section);
}

runInView(campaignWheel, "forArtists");
runInView(clipWheel, "forCreators");

/* ---------- Platform numbers: two rows of cards that flip in turn ----------
   Each card holds two faces. Flipping shows the hidden one, and the face that
   just turned away is refilled with the next entry, so the rows can cycle
   through the whole catalogue without ever duplicating a visible card. */
const flipTracks = [
  ["Miss the rage", "Den Best", 4], ["Still lonely", "Hoover", 5],
  ["6 Gold", "Leboi", 6], ["You\u2019re my fire", "Flare John", 7],
  ["SVEG", "Lukrix", 8], ["My world", "Je333", 9],
  ["U WUT", "Zen X", 10], ["Can\u2019t get away", "Lin Xiao", 11],
  ["Adrenaline rush", "Quayo", 12], ["Not 1 of us", "ZEZTI", 13],
  ["Hope", "Block Demons", 14], ["Lit up", "Garraba", 15],
];

const flipCreators = [
  [1, "instagram", "locotarrr", "74K"], [2, "tiktok", "maywayqt", "102K"],
  [3, "youtube", "evennie0", "891"], [4, "tiktok", "3xox3ne", "1.3K"],
  [5, "tiktok", "slaybay01", "21K"], [6, "instagram", "flex__111", "13K"],
  [9, "tiktok", "glogirlx", "46K"], [10, "tiktok", "lemanche23", "14K"],
  [12, "instagram", "ivori8", "19K"], [13, "youtube", "musfile", "3.5K"],
  [15, "instagram", "edit_ed", "72K"], [16, "tiktok", "dancingbonito", "13K"],
];

const trackFace = ([title, artist, cover]) => `
  <div class="track-chip">
    <div class="track-chip__cover" style="background-image:url('/landing-assets/img/covers/cover-${cover}.jpg')"></div>
    <div>
      <p class="track-chip__title">${title}</p>
      <p class="track-chip__artist">${artist}</p>
    </div>
  </div>`;

const creatorFace = ([pic, platform, handle, followers]) => `
  <div class="creator-chip">
    <div class="creator-chip__photo" style="background-image:url('/landing-assets/img/creators/creator-${pic}.jpg')"></div>
    <div>
      <p class="creator-chip__name">
        <span class="creator-chip__platform creator-chip__platform--${platform}" role="img" aria-label="${platform}"></span>${handle}
      </p>
      <p class="creator-chip__followers">${followers} followers</p>
    </div>
  </div>`;

function buildFlipRow(row, data, renderFace) {
  if (!row) return null;
  const COLS = 4;
  let next = COLS; // the first four are on screen; the rest queue up behind them

  row.innerHTML = Array.from({ length: COLS }, (_, i) => `
    <div class="flip-card">
      <div class="flip-card__face flip-card__face--front">${renderFace(data[i])}</div>
      <div class="flip-card__face flip-card__face--back">${renderFace(data[(i + COLS) % data.length])}</div>
    </div>`).join("");

  const cards = [...row.children];
  let flipped = false;

  return function flip() {
    flipped = !flipped;
    cards.forEach((c) => c.classList.toggle("is-flipped", flipped));

    // once the turn has finished, refill the face now pointing away
    setTimeout(() => {
      const hidden = flipped ? ".flip-card__face--front" : ".flip-card__face--back";
      cards.forEach((c) => {
        c.querySelector(hidden).innerHTML = renderFace(data[next % data.length]);
        next += 1;
      });
    }, 850);
  };
}

const flipTrackRow = buildFlipRow(document.getElementById("trackFlips"), flipTracks, trackFace);
const flipCreatorRow = buildFlipRow(document.getElementById("creatorFlips"), flipCreators, creatorFace);

/* Tracks turn three seconds after the section is reached, creators three
   seconds after that, then back and forth. */
if (flipTrackRow && flipCreatorRow && !prefersReducedMotion) {
  const statsSection = document.getElementById("stats");
  let timer = null;
  let turn = 0;

  const start = () => {
    if (timer) return;
    timer = gsap.to({}, {
      duration: 3,
      repeat: -1,
      onRepeat: () => {
        (turn % 2 === 0 ? flipTrackRow : flipCreatorRow)();
        turn += 1;
      },
    });
  };

  if (statsSection) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) start();
        else if (timer) timer.pause();
        if (e.isIntersecting && timer) timer.play();
      }),
      { threshold: 0.25 }
    ).observe(statsSection);
  } else {
    start();
  }
}

/* ---------- Why it works: the same coverflow, reader-driven ----------
   No timer here — the cards only move when someone drags, swipes, flicks a
   trackpad sideways, or clicks one of the cards either side. */
const whyStage = document.getElementById("whyStack");
/* Opens on "Choice on both sides" rather than the first card */
const whyWheel = whyStage ? createWheel(whyStage, { dim: 0.34, drag: true, auto: false, start: 1 }) : null;

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

/* Logos marquee lives in marquee.js, shared with the other landings. */

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
