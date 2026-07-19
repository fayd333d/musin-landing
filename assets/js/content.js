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
  { price: "+ $54", views: "324K", track: "Levitating", artist: "Dua Lipa", cover: "#ffac12" },
  { price: "+ $87", views: "1.2M", track: "Bad Guy", artist: "Billie Eilish", cover: "#8b5cf6" },
  { price: "+ $32", views: "87K", track: "Uptown Funk", artist: "Mark Ronson", cover: "#2dd4bf" },
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

function applyHeroData(d) {
  rotateEls.price.textContent = d.price;
  rotateEls.views.textContent = d.views;
  rotateEls.track.textContent = d.track;
  rotateEls.artist.textContent = d.artist;
  rotateEls.cover.style.background = d.cover;
}

function nextHeroSlide() {
  const prev = slides[heroIndex % slides.length];
  heroIndex += 1;
  const next = slides[heroIndex % slides.length];
  const data = heroData[heroIndex % heroData.length];

  gsap.set(next, { visibility: "visible", yPercent: 100, zIndex: 2 });
  gsap.set(prev, { zIndex: 1 });

  /* Self-scheduling (instead of setInterval) so rotations never overlap,
     even when the tab is backgrounded and rAF is throttled. */
  const tl = gsap.timeline({
    onComplete: () => gsap.delayedCall(2.2, nextHeroSlide),
  });
  tl.to(next, {
    yPercent: 0,
    duration: 0.8,
    ease: "power3.inOut",
    onComplete: () => {
      slides.forEach((s) => s !== next && gsap.set(s, { visibility: "hidden", yPercent: 0 }));
    },
  });
  tl.to(notifs, { opacity: 0, y: -6, duration: 0.22, stagger: 0.05, ease: "power1.in" }, 0.15)
    .add(() => applyHeroData(data))
    .to(notifs, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "power2.out" });
}

if (!prefersReducedMotion) {
  gsap.delayedCall(3, nextHeroSlide);
}

/* ---------- Track marquee (replaces "tracks available right now") ----------
   Covers are placeholders until final artwork is provided. */
const tracks = [
  ["Levitating", "Dua Lipa"],
  ["Bad Guy", "Billie Eilish"],
  ["Uptown Funk", "Mark Ronson ft. Bruno Mars"],
  ["Midnight Drive", "KØVA"],
  ["Golden Hour", "Ava Lune"],
  ["Static Love", "The Vermilion"],
  ["Low Tide", "Marlowe"],
  ["Paper Planes", "Juno East"],
  ["Afterglow", "NYX"],
  ["Cherry Soda", "Pastel Club"],
  ["Gravity", "Solenne"],
  ["Wildfire", "Rex Aurelio"],
];

const coverGradients = [
  "linear-gradient(135deg,#e54552,#8b1e3f)",
  "linear-gradient(135deg,#3d5ddc,#1e2a78)",
  "linear-gradient(135deg,#ffac12,#c2410c)",
  "linear-gradient(135deg,#22c55e,#065f46)",
  "linear-gradient(135deg,#8b5cf6,#4c1d95)",
  "linear-gradient(135deg,#2dd4bf,#0f766e)",
];

const marqueeInner = document.getElementById("trackMarquee");

function buildTrackChips() {
  return tracks
    .map(
      ([title, artist], i) => `
      <div class="track-chip">
        <div class="track-chip__cover" style="background:${coverGradients[i % coverGradients.length]}">${title[0]}</div>
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

function renderCount(n) {
  countEl.textContent = Math.round(n).toLocaleString("en-US");
}
renderCount(trackCount);

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

function scheduleCountEvent() {
  gsap.delayedCall(gsap.utils.random(30, 70), () => {
    const goesUp = Math.random() < 0.78; // generally up
    const delta = Math.ceil(Math.random() * 7); // 1..7, never more than 7
    let next = trackCount + (goesUp ? delta : -delta);
    next = Math.min(COUNT_MAX, Math.max(COUNT_BASE, next)); // never below base, cap 5,000
    tweenCount(next);
    scheduleCountEvent();
  });
}

if (!prefersReducedMotion) scheduleCountEvent();

/* ---------- Genres: big colourful tags, lines drift slightly ---------- */
/* Mainstream genres first, then subgenres of rap / pop / electronic / rock (corrections #5) */
const genreRows = [
  ["Rap", "Pop", "Electronic", "Rock", "R&B", "Alternative", "Latin", "Afrobeats", "Jazz"],
  ["Instrumental", "Country", "Reggae", "Dancehall", "Trap", "Drill", "Boom Bap", "Melodic Rap", "Conscious Rap"],
  ["Rage", "Jersey", "Cloud Rap", "Dance Pop", "Indie Pop", "Electropop", "Pop Rock", "Hyperpop", "House"],
  ["Techno", "EDM", "Drum & Bass", "Dubstep", "Ambient", "Hard Rock", "Punk", "Metal", "Pop Punk", "Alternative Metal"],
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
let centreIndex = Math.floor(N / 2);
const lastSlot = new Array(N).fill(null);

function renderWheel() {
  if (!N) return;
  const cardW = wheelCards[0].offsetWidth || 280;
  const spacing = cardW * 0.62;
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
  renderWheel();
}

document.getElementById("scrollPrev").addEventListener("click", () => { advance(-1); resetAuto(); });
document.getElementById("scrollNext").addEventListener("click", () => { advance(1); resetAuto(); });

/* Swipe / drag to move one card */
let dragStartX = null;
stage.addEventListener("pointerdown", (e) => { dragStartX = e.clientX; stage.classList.add("is-dragging"); });
window.addEventListener("pointerup", (e) => {
  if (dragStartX === null) return;
  const dx = e.clientX - dragStartX;
  if (Math.abs(dx) > 40) { advance(dx < 0 ? 1 : -1); resetAuto(); }
  dragStartX = null;
  stage.classList.remove("is-dragging");
});

/* Endless auto-rotation */
let autoTimer = null;
function startAuto() { if (!prefersReducedMotion) autoTimer = window.setInterval(() => advance(1), 3500); }
function resetAuto() { window.clearInterval(autoTimer); startAuto(); }

window.addEventListener("resize", renderWheel);
stage.classList.add("no-anim");
renderWheel();
void stage.offsetWidth;
stage.classList.remove("no-anim");
startAuto();

/* ---------- Get paid for posting: cards stack on scroll ---------- */
const payCards = gsap.utils.toArray(".pay-card");

if (!prefersReducedMotion) {
  /* Only scale back the covered cards for depth — no opacity fade, so every
     icon stays fully bright (corrections #11). */
  payCards.forEach((card, i) => {
    if (i === payCards.length - 1) return;
    gsap.to(card, {
      scale: 0.92 - (payCards.length - 2 - i) * 0.02,
      ease: "none",
      scrollTrigger: {
        trigger: payCards[i + 1],
        start: "top bottom-=120",
        end: "top top+=220",
        scrub: true,
      },
    });
  });
}

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

/* ---------- Newsletter (no backend yet) ---------- */
document.getElementById("newsletterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.textContent = "Subscribed ✓";
  setTimeout(() => (btn.textContent = "Subscribe"), 2500);
});
