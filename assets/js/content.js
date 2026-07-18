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
   Price, views and track change; the next screen slides into the
   main phone from the right shade, right to left. */
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

  gsap.set(next, { visibility: "visible", xPercent: 100, zIndex: 2 });
  gsap.set(prev, { zIndex: 1 });

  /* Self-scheduling (instead of setInterval) so rotations never overlap,
     even when the tab is backgrounded and rAF is throttled. */
  const tl = gsap.timeline({
    onComplete: () => gsap.delayedCall(2.2, nextHeroSlide),
  });
  tl.to(next, {
    xPercent: 0,
    duration: 0.8,
    ease: "power3.inOut",
    onComplete: () => {
      slides.forEach((s) => s !== next && gsap.set(s, { visibility: "hidden", xPercent: 0 }));
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

/* ---------- Genres: big colourful tags, lines drift slightly ---------- */
const genreRows = [
  ["Lo-Fi", "Rap", "Bachata", "Pop", "Soul", "Electronic", "Metal", "Rock", "Punk"],
  ["R&B", "Techno", "Alternative", "Blues", "Latin", "Piano", "Afrobeats", "Jazz", "Salsa"],
  ["Instrumental", "Amapiano", "Country", "Reggae", "Dancehall", "Trap", "Hyperpop", "House"],
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

/* ---------- Create content: horizontal scroll (arrows + drag) ---------- */
const scroller = document.getElementById("createScroller");

document.getElementById("scrollPrev").addEventListener("click", () => {
  scroller.scrollBy({ left: -360, behavior: "smooth" });
});
document.getElementById("scrollNext").addEventListener("click", () => {
  scroller.scrollBy({ left: 360, behavior: "smooth" });
});

let isDown = false;
let startX = 0;
let startScroll = 0;

scroller.addEventListener("pointerdown", (e) => {
  isDown = true;
  startX = e.clientX;
  startScroll = scroller.scrollLeft;
  scroller.classList.add("is-dragging");
});
window.addEventListener("pointermove", (e) => {
  if (!isDown) return;
  scroller.scrollLeft = startScroll - (e.clientX - startX);
});
window.addEventListener("pointerup", () => {
  isDown = false;
  scroller.classList.remove("is-dragging");
});

/* ---------- Get paid for posting: cards stack on scroll ---------- */
const payCards = gsap.utils.toArray(".pay-card");

if (!prefersReducedMotion) {
  payCards.forEach((card, i) => {
    if (i === payCards.length - 1) return;
    gsap.to(card, {
      scale: 0.92 - (payCards.length - 2 - i) * 0.02,
      opacity: 0.55,
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
