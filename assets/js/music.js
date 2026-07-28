/* ============ Musin — Music Artists landing (GSAP animations) ============ */

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
   Views and +Streams change with each clip; the next screen scrolls up into
   the main phone from below, TikTok-style. */
const heroData = [
  { views: 398000, streams: 2900 },  // Video A
  { views: 43000, streams: 625 },    // Video B
  { views: 640000, streams: 7900 },  // Video C
  { views: 123000, streams: 843 },   // Video D
  { views: 12000, streams: 213 },    // Video E
];

const slides = gsap.utils.toArray(".phone-slide");
const rotateEls = {
  views: document.querySelector('[data-rotate="views"]'),
  streams: document.querySelector('[data-rotate="streams"]'),
};
const notifs = [
  document.getElementById("notifViews"),
  document.getElementById("notifStreams"),
];

let heroIndex = 0;

/* 398000 → "398K", 2900 → "+2.9K" on the floating badges */
function badge(n) {
  if (n >= 1e6) return (Math.floor(n / 1e5) / 10).toFixed(1) + "M";
  if (n >= 1e5) return Math.round(n / 1e3) + "K";
  if (n >= 1e3) return (Math.floor(n / 100) / 10).toFixed(1) + "K";
  return String(n);
}

function applyHeroData(d) {
  rotateEls.views.textContent = badge(d.views);
  rotateEls.streams.textContent = "+" + badge(d.streams);
}

applyHeroData(heroData[0]);
// Playback starts when the hero scrolls into view — see the observer below

/* ---------- Campaign card: a running total ----------
   The card opens on the figures below. Every time the example screen rotates to
   the next clip, that clip's views and streams are added, along with one post
   and its cost. The total keeps climbing across cycles — it only resets when
   the page is reloaded. */
const campaign = { posts: 15, views: 867000, streams: 6200, cost: 193 };

const campaignEls = {
  posts: document.querySelector('[data-stat="posts"]'),
  views: document.querySelector('[data-stat="views"]'),
  streams: document.querySelector('[data-stat="streams"]'),
  cost: document.querySelector('[data-stat="cost"]'),
};

/* 867000 → "867K", 1265000 → "1.26M", 9100 → "9.1K" */
function campaignNum(n) {
  if (n >= 1e6) return (Math.floor(n / 1e4) / 100).toFixed(2) + "M";
  if (n >= 1e5) return Math.round(n / 1e3) + "K";
  if (n >= 1e3) return (Math.floor(n / 100) / 10).toFixed(1) + "K";
  return String(Math.round(n));
}

function renderCampaign(c) {
  campaignEls.posts.textContent = Math.round(c.posts);
  campaignEls.views.textContent = campaignNum(c.views);
  campaignEls.streams.textContent = campaignNum(c.streams);
  campaignEls.cost.textContent = "$" + Math.round(c.cost);
}
renderCampaign(campaign);

/* Add the clip that just finished playing, tweening to the new total */
function addToCampaign(clip) {
  const from = { ...campaign };
  campaign.posts += 1;
  campaign.views += clip.views;
  campaign.streams += clip.streams;
  campaign.cost += Math.floor(gsap.utils.random(8, 20)); // $8–19 per post

  if (prefersReducedMotion) {
    renderCampaign(campaign);
    return;
  }
  gsap.to(from, {
    posts: campaign.posts,
    views: campaign.views,
    streams: campaign.streams,
    cost: campaign.cost,
    duration: 0.9,
    ease: "power2.out",
    onUpdate: () => renderCampaign(from),
    onComplete: () => renderCampaign(campaign),
  });
}

/* Only play while the hero is on screen */
let heroInView = false;

/* Restart the given clip from the top and pause the others so each video
   plays its ~3-second window before the next one swipes in. */
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
  // the clip that just played is now banked into the campaign total
  addToCampaign(heroData[heroIndex % heroData.length]);
  heroIndex += 1;
  const next = slides[heroIndex % slides.length];
  const data = heroData[heroIndex % heroData.length];

  gsap.set(next, { visibility: "visible", yPercent: 100, scale: 1, zIndex: 2 });
  gsap.set(prev, { zIndex: 1 });
  playCurrentClip(next); // restart the incoming clip from 0

  /* TikTok / Instagram-style vertical swipe: the current clip flicks up and
     out while the next one rises from below in sync. Self-scheduling so
     rotations never overlap even when rAF is throttled. */
  const tl = gsap.timeline({
    onComplete: () => gsap.delayedCall(2.4, nextHeroSlide),
  });
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
   and resume when it comes back */
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
            // Don't start cycling until the first clip is buffered enough to
            // play through, so it doesn't stutter/advance mid-load
            const first = slides[0];
            let begun = false;
            const begin = () => {
              if (begun) return;
              begun = true;
              playCurrentClip(first);
              if (!prefersReducedMotion) gsap.delayedCall(2.7, nextHeroSlide);
            };
            if (first.readyState >= 4) begin();
            else {
              first.addEventListener("canplaythrough", begin, { once: true });
              setTimeout(begin, 4000); // fallback so it can never stall
            }
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

/* ---------- Creator marquee (replaces the track marquee) ----------
   Round photo, the platform they post on, handle and follower count (#3). */
const creators = [
  [1, "instagram", "locotarrr", "74K"],
  [2, "tiktok", "maywayqt", "102K"],
  [3, "youtube", "evennie0", "891"],
  [4, "tiktok", "3xox3ne", "1.3K"],
  [5, "tiktok", "slaybay01", "21K"],
  [6, "instagram", "flex__111", "13K"],
  [7, "tiktok", "b0n0prt", "253"],
  [8, "youtube", "slay", "2.4K"],
  [9, "tiktok", "glogirlx", "46K"],
  [10, "tiktok", "lemanche23", "14K"],
  [11, "instagram", "cc_cp91", "4.1K"],
  [12, "instagram", "ivori8", "19K"],
  [13, "youtube", "musfile", "3.5K"],
  // edit_ed and dancingbonito sit between musfile and artell so the two
  // aren't neighbours in the line
  [15, "instagram", "edit_ed", "72K"],
  [16, "tiktok", "dancingbonito", "13K"],
  [14, "tiktok", "artell", "34K"],
];

const creatorMarquee = document.getElementById("creatorMarquee");

function buildCreatorChips() {
  return creators
    .map(
      ([pic, platform, handle, followers]) => `
      <div class="creator-chip">
        <div class="creator-chip__photo" style="background-image:url('assets/img/creators/creator-${pic}.jpg')"></div>
        <div>
          <p class="creator-chip__name">
            <span class="creator-chip__platform creator-chip__platform--${platform}" role="img" aria-label="${platform}"></span>${handle}
          </p>
          <p class="creator-chip__followers">${followers} followers</p>
        </div>
      </div>`
    )
    .join("");
}

/* Two copies for a seamless wrap. */
creatorMarquee.innerHTML = buildCreatorChips() + buildCreatorChips();

gsap.to(creatorMarquee, {
  xPercent: -50,
  duration: 40,
  ease: "none",
  repeat: -1,
});

/* ---------- Active creator counter ----------
   The number gently fluctuates between COUNT_MIN and COUNT_MAX (#2). A slow
   triangle wave off the real clock sets the starting value (so it drifts over
   time and is the same for everyone), then live nudges keep it moving. */
const countEl = document.getElementById("creatorCount");
const COUNT_MIN = 7843;
const COUNT_MAX = 8214;
const COUNT_EPOCH = Date.UTC(2026, 6, 1); // 1 Jul 2026
const COUNT_STEP_MS = 8 * 60 * 1000; // drift one step every ~8 minutes

const clampCount = (n) => Math.min(COUNT_MAX, Math.max(COUNT_MIN, Math.round(n)));

function baseCount() {
  const span = COUNT_MAX - COUNT_MIN;
  const step = Math.floor((Date.now() - COUNT_EPOCH) / COUNT_STEP_MS);
  const tri = Math.abs((step % (2 * span)) - span); // triangle wave 0..span
  return COUNT_MIN + tri;
}

let creatorCount = baseCount();

/* Scale the number so its rendered width matches the 'content creators active'
   line beneath it — they share the same width border. Width scales ~linearly
   with font-size, so a couple of iterations converge. */
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
renderCount(creatorCount);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStatWidth);
window.addEventListener("resize", fitStatWidth);

function tweenCount(to) {
  gsap.to({ v: creatorCount }, {
    v: to,
    duration: 1.1,
    ease: "power2.out",
    onUpdate() {
      renderCount(this.targets()[0].v);
    },
  });
  creatorCount = to;
}

/* Keep the number gently fluctuating, always within [COUNT_MIN, COUNT_MAX] */
function scheduleCountEvent() {
  gsap.delayedCall(gsap.utils.random(20, 45), () => {
    const goesUp = creatorCount <= COUNT_MIN ? true
                 : creatorCount >= COUNT_MAX ? false
                 : Math.random() < 0.5;
    const delta = Math.ceil(Math.random() * 3); // 1..3 at a time
    tweenCount(clampCount(creatorCount + (goesUp ? delta : -delta)));
    scheduleCountEvent();
  });
}

if (!prefersReducedMotion) scheduleCountEvent();

/* ---------- Tags creators can be filtered by ---------- */
const tagRows = [
  ["Lifestyle", "Love", "Fashion", "Sports", "Beauty", "Party", "Fitness", "Travel", "Success", "Gaming", "Chill", "Food"],
  ["Motivation", "Romantic", "Dance", "Glow Up", "Clips", "Music", "Fit", "Hype", "Soft Life", "Heartbreak", "Chaotic"],
  ["Night", "Confident", "Edits", "Dating", "Dreamy", "Storytime", "Nostalgic", "Vlog", "Self-Care", "Funny", "Lip-sync"],
];

const tagColors = [
  "#e54552", "#ffac12", "#22c55e", "#3d5ddc", "#8b5cf6",
  "#2dd4bf", "#f472b6", "#eab308", "#60a5fa", "#fb923c",
];

document.querySelectorAll(".genre-line").forEach((line, rowIdx) => {
  line.innerHTML = tagRows[rowIdx]
    .map(
      (t, i) =>
        `<span class="genre-tag" style="color:${tagColors[(rowIdx * 3 + i) % tagColors.length]}"><span class="hash">#</span>${t}</span>`
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

/* ---------- Music discovery: endless 3D coverflow wheel ----------
   Cards are positioned by "slot" (signed distance from the current centre,
   wrapping around the list) rather than by scroll. Only slots -1/0/+1 are
   visible; the side cards face OUTWARD and the rest stay hidden in the shade. */
const stage = document.getElementById("createScroller");
const wheelCards = [...stage.querySelectorAll(".video-card")];
const N = wheelCards.length;
let centreIndex = 0;
const lastSlot = new Array(N).fill(null);

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
wheelCards.forEach((card) => {
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
  video.addEventListener("ended", () => card.classList.remove("is-playing"));
});

function renderWheel() {
  if (!N) return;
  const cardW = wheelCards[0].offsetWidth || 280;
  const spacing = cardW * 0.9; // space so side cards aren't hidden behind the centre
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
  pauseAllClips(); // stop the clip we're leaving
  renderWheel();
  playCentre(); // autoplay the newly-centred clip when the user switches
}

/* Side arrows on desktop, swipe on touch; the centre clip autoplays */
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

/* Autoplay the first clip only once the section scrolls into view (not on page
   load); pause the clips when it leaves */
let createStarted = false;
const createSection = document.getElementById("create");
if (createSection) {
  const createObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!createStarted) {
            createStarted = true;
            playCentre();
          }
        } else {
          pauseAllClips();
        }
      });
    },
    { threshold: 0.4 }
  );
  createObserver.observe(createSection);
}

/* Pay only for results: the cards stack purely via CSS sticky positioning —
   no JS needed. */

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
    .toArray([".section-title", ".cta__card"])
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
