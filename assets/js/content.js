/* ============ Musin — Content Creators landing (GSAP animations) ============ */

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

/* ---------- Hero: example screen rotation (every 3 s) ----------
   Price, views and track change; the next screen scrolls up into the
   main phone from below, TikTok-style (corrections #6). */
const heroData = [
  { price: "+$26", views: "467K", track: "Like It", artist: "Eliot Felix", cover: "assets/img/covers/cover-1.jpg" },
  { price: "+$48", views: "1.2M", track: "Get On", artist: "Natsha", cover: "assets/img/covers/cover-2.jpg" },
  { price: "+$81", views: "891K", track: "Sway Me", artist: "Olmoy", cover: "assets/img/covers/cover-3.jpg" },
  { price: "+$56", views: "829K", track: "Legit Dog", artist: "Katika", cover: "assets/img/covers/cover-21.jpg" },
  { price: "+$91", views: "1.1M", track: "Lolli", artist: "Indica Steve", cover: "assets/img/covers/cover-22.jpg" },
];

const slides = gsap.utils.toArray(".phone-slide");
const rotateEls = {
  price: document.querySelector('[data-rotate="price"]'),
  views: document.querySelector('[data-rotate="views"]'),
  track: document.querySelector('[data-rotate="track"]'),
  artist: document.querySelector('[data-rotate="artist"]'),
  cover: document.querySelector('[data-rotate="cover"]'),
};
const notifs = [
  document.getElementById("notifMoney"),
  document.getElementById("notifViews"),
  document.getElementById("notifTrack"),
];

let heroIndex = 0;
applyHeroData(heroData[0]);
// Playback starts when the hero scrolls into view — see the observer below (#2)

function applyHeroData(d) {
  rotateEls.price.textContent = d.price;
  rotateEls.views.textContent = d.views;
  rotateEls.track.textContent = d.track;
  rotateEls.artist.textContent = d.artist;
  rotateEls.cover.style.backgroundImage = `url("${d.cover}")`;
  rotateEls.cover.style.backgroundSize = "cover";
  rotateEls.cover.style.backgroundPosition = "center";
}

/* Only play while the hero is on screen (#2) */
let heroInView = false;

/* Restart the given clip from the top and pause the others so each video
   plays its ~3-second window before the next one swipes in (#1). */
function playCurrentClip(el) {
  slides.forEach((s) => {
    if (typeof s.pause === "function" && s !== el) s.pause();
  });
  if (el && typeof el.play === "function" && heroInView) {
    try { el.currentTime = 0; } catch (e) {}
    const p = el.play();
    if (p && p.catch) {
      p.catch(() => {
        // Not buffered yet — retry once the clip can play
        el.addEventListener("canplay", () => { const r = el.play(); if (r && r.catch && heroInView) r.catch(() => {}); }, { once: true });
      });
    }
  }
}

function nextHeroSlide() {
  const prev = slides[heroIndex % slides.length];
  heroIndex += 1;
  const next = slides[heroIndex % slides.length];
  const data = heroData[heroIndex % heroData.length];

  gsap.set(next, { visibility: "visible", yPercent: 100, scale: 1, zIndex: 2 });
  gsap.set(prev, { zIndex: 1 });
  playCurrentClip(next); // restart the incoming clip from 0

  /* TikTok / Instagram-style vertical swipe: the current clip flicks up and
     out while the next one rises from below in sync (#5). Self-scheduling so
     rotations never overlap even when rAF is throttled. */
  const tl = gsap.timeline({
    onComplete: () => gsap.delayedCall(2.4, nextHeroSlide),
  });
  // Let the clip play its ~3 s, then swipe fast so the swap lands right as it
  // loops — the restart is hidden behind the quick transition (#1)
  tl.to(prev, { yPercent: -100, scale: 0.96, duration: 0.3, ease: "power3.in" }, 0)
    .to(next, {
      yPercent: 0,
      duration: 0.3,
      ease: "power3.out",
      onComplete: () => {
        slides.forEach((s) => s !== next && gsap.set(s, { visibility: "hidden", yPercent: 0, scale: 1 }));
      },
    }, 0);
  tl.to(notifs, { opacity: 0, y: -6, duration: 0.2, stagger: 0.04, ease: "power1.in" }, 0.08)
    .add(() => applyHeroData(data))
    .to(notifs, { opacity: 1, y: 0, duration: 0.28, stagger: 0.05, ease: "power2.out" });
}

/* Start playing only once the hero is scrolled into view; pause when it leaves
   and resume when it comes back (#2) */
let heroStarted = false;
const heroSection = document.getElementById("hero");
if (heroSection) {
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heroInView = entry.isIntersecting;
        const current = slides[heroIndex % slides.length];
        if (entry.isIntersecting) {
          if (!heroStarted) {
            heroStarted = true;
            playCurrentClip(slides[0]);
            if (!prefersReducedMotion) gsap.delayedCall(2.7, nextHeroSlide);
          } else if (current && current.paused && typeof current.play === "function") {
            const p = current.play();
            if (p && p.catch) p.catch(() => {});
          }
        } else if (current && typeof current.pause === "function") {
          current.pause();
        }
      });
    },
    { threshold: 0.4 }
  );
  heroObserver.observe(heroSection);
}

/* ---------- Track marquee (replaces "tracks available right now") ----------
   Covers are placeholders until final artwork is provided. */
const tracks = [
  ["Miss the rage", "Den Best", 4],
  ["Still lonely", "Hoover", 5],
  ["6 Gold", "Leboi", 6],
  ["You’re my fire", "Flare John", 7],
  ["SVEG", "Lukrix", 8],
  ["My world", "Je333", 9],
  ["U WUT", "Zen X", 10],
  ["Can’t get away", "Lin Xiao", 11],
  ["Adrenaline rush", "Quayo", 12],
  ["Not 1 of us", "ZEZTI", 13],
  ["Hope", "Block Demons", 14],
  ["Lit up", "Garraba", 15],
  ["She was a baddie", "Onlock", 16],
  ["Sax Neo", "With me", 17],
  ["Fashion Diva", "8t Diggy", 18],
  ["Wonders", "Fly Hollywood", 19],
  ["Say so", "Imma Frost", 20],
];

const marqueeInner = document.getElementById("trackMarquee");

function buildTrackChips() {
  return tracks
    .map(
      ([title, artist, cover]) => `
      <div class="track-chip">
        <div class="track-chip__cover" style="background-image:url('assets/img/covers/cover-${cover}.jpg')"></div>
        <div>
          <p class="track-chip__title">${title}</p>
          <p class="track-chip__artist">${artist}</p>
        </div>
      </div>`
    )
    .join("");
}

/* Two copies for a seamless wrap. */
marqueeInner.innerHTML = buildTrackChips() + buildTrackChips();

gsap.to(marqueeInner, {
  xPercent: -50,
  duration: 40,
  ease: "none",
  repeat: -1,
});

/* ---------- Track counter (corrections #2) ----------
   The base value is derived from the real clock, so every visitor sees the
   same number and it grows steadily over time — it never resets on reload.
   A locally-stored high-water mark keeps it from ever ticking backwards, and
   it is capped at 5,000. Occasional live nudges add a little movement. */
const countEl = document.getElementById("trackCount");
const COUNT_BASE = 3436;
const COUNT_EPOCH = Date.UTC(2026, 6, 1); // 1 Jul 2026
const COUNT_GROWTH_MS = 22 * 60 * 1000; // +1 roughly every 22 minutes
const COUNT_MAX = 5000;

function deterministicCount() {
  const grown = COUNT_BASE + Math.floor((Date.now() - COUNT_EPOCH) / COUNT_GROWTH_MS);
  return Math.min(COUNT_MAX, Math.max(COUNT_BASE, grown));
}

const storedCount = parseInt(localStorage.getItem("musinTrackCount") || "0", 10) || 0;
let trackCount = Math.min(COUNT_MAX, Math.max(deterministicCount(), storedCount));

/* Scale the number so its rendered width matches the 'tracks available now'
   line beneath it — they share the same width border (correction #3). Width
   scales ~linearly with font-size, so a couple of iterations converge. */
const unitEl = document.querySelector(".genres__unit");
function fitStatWidth() {
  if (!countEl || !unitEl) return;
  const target = unitEl.getBoundingClientRect().width;
  if (!target) return;
  let fs = parseFloat(getComputedStyle(countEl).fontSize) || 88;
  for (let i = 0; i < 5; i++) {
    const w = countEl.getBoundingClientRect().width;
    if (!w || Math.abs(w - target) < 0.5) break;
    fs = Math.max(40, Math.min(160, fs * (target / w)));
    countEl.style.fontSize = fs + "px";
  }
}

let lastCountStr = "";
function renderCount(n) {
  const s = Math.round(n).toLocaleString("en-US");
  if (s === lastCountStr) return;
  lastCountStr = s;
  countEl.textContent = s;
  fitStatWidth();
}
renderCount(trackCount);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStatWidth);
window.addEventListener("resize", fitStatWidth);

function persistCount() {
  localStorage.setItem("musinTrackCount", String(Math.round(trackCount)));
}
persistCount();

function tweenCount(to) {
  gsap.to({ v: trackCount }, {
    v: to,
    duration: 1.1,
    ease: "power2.out",
    onUpdate() {
      renderCount(this.targets()[0].v);
    },
  });
  trackCount = to;
  persistCount();
}

/* Nudge by exactly 1, at most 3 times in a single session (#3) */
let countEventsFired = 0;
function scheduleCountEvent() {
  if (countEventsFired >= 3) return;
  gsap.delayedCall(gsap.utils.random(30, 70), () => {
    countEventsFired += 1;
    const goesUp = Math.random() < 0.78; // generally up
    let next = trackCount + (goesUp ? 1 : -1); // never more than 1 at a time
    next = Math.min(COUNT_MAX, Math.max(COUNT_BASE, next)); // never below base, cap 5,000
    tweenCount(next);
    scheduleCountEvent();
  });
}

if (!prefersReducedMotion) scheduleCountEvent();

/* ---------- Genres: big colourful tags, lines drift slightly ---------- */
/* Three lines: mainstream genres first, then subgenres of rap, pop and EDM */
const genreRows = [
  ["Rap", "Pop", "Electronic", "Rock", "R&B", "Alternative", "Latin", "Afrobeats", "Jazz", "Instrumental"],
  ["Country", "Reggae", "Dancehall", "Trap", "Drill", "Boom Bap", "Melodic Rap", "Conscious Rap", "Cloud Rap"],
  ["Dance Pop", "Indie Pop", "Electropop", "Hyperpop", "House", "Techno", "EDM", "Drum & Bass", "Dubstep"],
];

const genreColors = [
  "#e54552", "#ffac12", "#22c55e", "#3d5ddc", "#8b5cf6",
  "#2dd4bf", "#f472b6", "#eab308", "#60a5fa", "#fb923c",
];

document.querySelectorAll(".genre-line").forEach((line, rowIdx) => {
  line.innerHTML = genreRows[rowIdx]
    .map(
      (g, i) =>
        `<span class="genre-tag" style="color:${genreColors[(rowIdx * 3 + i) % genreColors.length]}"><span class="hash">#</span>${g}</span>`
    )
    .join("");

  if (!prefersReducedMotion) {
    const dir = Number(line.dataset.drift) || 1;
    gsap.to(line, {
      x: 36 * dir,
      duration: 5 + rowIdx * 1.3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
});

/* ---------- Create content: endless 3D coverflow wheel (corrections #4-7) ----
   Cards are positioned by "slot" (signed distance from the current centre,
   wrapping around the list) rather than by scroll. Only slots -1/0/+1 are
   visible; the side cards face OUTWARD and the rest stay hidden in the shade.
   Advancing the centre index (arrows, swipe, or the auto-timer) loops for
   ever. */
const stage = document.getElementById("createScroller");
const wheelCards = [...stage.querySelectorAll(".video-card")];
const N = wheelCards.length;
let centreIndex = 0; // first screen the user sees is Video 4 (#3)
const lastSlot = new Array(N).fill(null);

/* Each card holds a real clip (Video 4-13). The centre clip autoplays; when it
   ends the wheel advances and the next one autoplays. The user can pause it or
   change cards with the arrows / swipe (#4). */
function pauseAllClips() {
  wheelCards.forEach((c) => {
    const v = c.querySelector("video");
    if (v && typeof v.pause === "function") v.pause();
    c.classList.remove("is-playing");
  });
}
function playCentre() {
  const card = wheelCards[centreIndex];
  const video = card && card.querySelector("video");
  if (!video) return;
  try { video.currentTime = 0; } catch (e) {}
  const p = video.play();
  if (p && p.catch) p.catch(() => {
    video.addEventListener("canplay", () => { const r = video.play(); if (r && r.catch) r.catch(() => {}); }, { once: true });
  });
}
wheelCards.forEach((card, i) => {
  const video = card.querySelector("video");
  const btn = card.querySelector(".video-card__play");
  if (!video) return;
  const toggle = (e) => {
    if (e) e.stopPropagation();
    if (video.paused) {
      wheelCards.forEach((c) => {
        const v = c.querySelector("video");
        if (v && v !== video) { v.pause(); c.classList.remove("is-playing"); }
      });
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      video.pause();
    }
  };
  if (btn) btn.addEventListener("click", toggle);
  video.addEventListener("click", toggle);
  video.addEventListener("play", () => card.classList.add("is-playing"));
  video.addEventListener("pause", () => card.classList.remove("is-playing"));
  // When a clip finishes, show its play button again (no auto-advance, #3)
  video.addEventListener("ended", () => card.classList.remove("is-playing"));
});

function renderWheel() {
  if (!N) return;
  const cardW = wheelCards[0].offsetWidth || 280;
  const spacing = cardW * 0.9; // more space so side cards aren't hidden behind the centre (#5)
  wheelCards.forEach((card, i) => {
    let s = (((i - centreIndex) % N) + N) % N; // 0..N-1
    if (s > N / 2) s -= N; // wrap to a signed slot
    const a = Math.abs(s);
    const dir = Math.sign(s);
    const near = Math.min(a, 2);
    const rotateY = dir * Math.min(a, 1) * 42; // side cards face outward
    const tx = s * spacing;
    const tz = -near * 100;
    const scale = 1 - near * 0.16;
    const bright = 1 - near * 0.5;
    const visible = a <= 1;

    const prev = lastSlot[i];
    const wrapped = prev !== null && Math.abs(s - prev) > N / 2;
    if (wrapped) card.style.transition = "none"; // jump hidden cards silently

    card.style.transform =
      `translate(-50%, -50%) perspective(1400px) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    card.style.filter = `brightness(${bright.toFixed(3)})`;
    card.style.opacity = visible ? "1" : "0";
    card.style.zIndex = String(100 - a * 10);

    if (wrapped) {
      void card.offsetWidth; // force reflow, then restore the transition
      card.style.transition = "";
    }
    lastSlot[i] = s;
  });
}

function advance(step) {
  centreIndex = (((centreIndex + step) % N) + N) % N;
  pauseAllClips(); // stop any playing clip when the wheel moves; user clicks play (#3)
  renderWheel();
}

/* Side arrows on desktop, swipe on touch; the centre clip autoplays (#4) */
const prevBtn = document.getElementById("scrollPrev");
const nextBtn = document.getElementById("scrollNext");
if (prevBtn) prevBtn.addEventListener("click", () => advance(-1));
if (nextBtn) nextBtn.addEventListener("click", () => advance(1));

/* Swipe / drag to move one card (both directions, phone + pointer) */
let dragStartX = null;
stage.addEventListener("pointerdown", (e) => { dragStartX = e.clientX; stage.classList.add("is-dragging"); });
window.addEventListener("pointerup", (e) => {
  if (dragStartX === null) return;
  const dx = e.clientX - dragStartX;
  if (Math.abs(dx) > 40) advance(dx < 0 ? 1 : -1);
  dragStartX = null;
  stage.classList.remove("is-dragging");
});

window.addEventListener("resize", renderWheel);
stage.classList.add("no-anim");
renderWheel();
void stage.offsetWidth;
stage.classList.remove("no-anim");
playCentre(); // start with Video 4 playing (#3, #4)

/* Get paid for posting: the cards stack purely via CSS sticky positioning so
   their coloured tops peek out — no JS needed. */

/* ---------- Logos: auto-run left to right ---------- */
const logoMarquee = document.getElementById("logoMarquee");
logoMarquee.appendChild(logoMarquee.querySelector(".logos__group").cloneNode(true));

gsap.fromTo(
  logoMarquee,
  { xPercent: -50 },
  { xPercent: 0, duration: 30, ease: "none", repeat: -1 }
);

/* ---------- Section entrance animations ---------- */
if (!prefersReducedMotion) {
  gsap.utils
    .toArray([".discover__heading", ".discover__count", ".section-title", ".cta__card"])
    .forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

  gsap.from(".hero__inner > *", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power2.out",
  });

  gsap.from(".hero-mockup", { y: 60, opacity: 0, duration: 1, delay: 0.3, ease: "power2.out" });
}

/* ---------- FAQ: only one item open at a time ---------- */
const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) faqItems.forEach((o) => o !== item && (o.open = false));
  });
});
