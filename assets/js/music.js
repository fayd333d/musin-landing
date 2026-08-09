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

/* Engagements (likes + shares + comments) run at roughly 5% of views, so
   486,320 views → ~24,316 engagements. The campaign carousel derives its
   figure straight from that flat rate. */
const ENGAGEMENT_RATE = 0.05;
const engagementsFor = (views) => Math.round(views * ENGAGEMENT_RATE);

/* ---------- Hero: example screen rotation (every 3 s) ----------
   Views and Engagements both change with each clip; the next screen scrolls
   up into the main phone from below, TikTok-style.

   Each clip carries its own engagement count rather than deriving one, so the
   badge lands on believable figures instead of the round numbers a flat 5%
   produces (398K views would read a suspiciously neat "20K"). They still sit
   between 4.9% and 5.3% of that clip's views. */
const heroData = [
  { views: 398000, engagements: 19383 },  // Video A — 4.9% of views
  { views: 43000, engagements: 2292 },    // Video B — 5.3%
  { views: 640000, engagements: 31744 },  // Video C — 5.0%
  { views: 123000, engagements: 6408 },   // Video D — 5.2%
  { views: 12000, engagements: 631 },     // Video E — 5.3%
];

const slides = gsap.utils.toArray(".phone-slide");
const rotateEls = {
  views: document.querySelector('[data-rotate="views"]'),
  engagements: document.querySelector('[data-rotate="engagements"]'),
};
const notifs = [
  document.getElementById("notifViews"),
  document.getElementById("notifEngagements"),
];

let heroIndex = 0;

/* 398000 → "398K", 43000 → "43K" */
function badge(n) {
  if (n >= 1e6) return (Math.floor(n / 1e5) / 10).toFixed(1) + "M";
  if (n >= 1e4) return Math.round(n / 1e3) + "K";
  if (n >= 1e3) return (Math.floor(n / 100) / 10).toFixed(1) + "K";
  return String(n);
}

/* Engagement counts keep their decimal all the way up, so the badge reads
   "19.3K" rather than collapsing to a flat-looking "19K" */
function engagementBadge(n) {
  if (n >= 1e6) return (Math.floor(n / 1e5) / 10).toFixed(1) + "M";
  if (n >= 1e3) return (Math.floor(n / 100) / 10).toFixed(1) + "K";
  return String(n);
}

function applyHeroData(d) {
  rotateEls.views.textContent = badge(d.views);
  rotateEls.engagements.textContent = engagementBadge(d.engagements);
}

applyHeroData(heroData[0]);
// Playback starts when the hero scrolls into view — see the observer below

/* ---------- Campaign card: a running total ----------
   The figures always cover the clips shown so far, including the one on screen,
   so the card opens on the first clip already counted — 1 post, its views and
   engagements, and its cost. Each rotation banks the incoming clip.

   The total covers exactly one pass of the example screen, so it never claims
   more posts than the viewer has actually been shown: it climbs to 5 and then
   starts over as the clips come round again. */
const CAMPAIGN_RESET_AFTER = heroData.length;
const campaign = { posts: 0, views: 0, engagements: 0, cost: 0 };
let videosPlayed = 0;

const clipCost = () => Math.floor(gsap.utils.random(8, 20)); // $8–19 per post

const campaignEls = {
  posts: document.querySelector('[data-stat="posts"]'),
  views: document.querySelector('[data-stat="views"]'),
  engagements: document.querySelector('[data-stat="engagements"]'),
  cost: document.querySelector('[data-stat="cost"]'),
};

/* 1265000 → "1.26M", 867000 → "867K", 37000 → "37K", 9100 → "9.1K".
   The decimal only shows below 10K, where it still carries information. */
function campaignNum(n) {
  if (n >= 1e6) return (Math.floor(n / 1e4) / 100).toFixed(2) + "M";
  if (n >= 1e4) return Math.round(n / 1e3) + "K";
  if (n >= 1e3) return (Math.floor(n / 100) / 10).toFixed(1) + "K";
  return String(Math.round(n));
}

function renderCampaign(c) {
  campaignEls.posts.textContent = Math.round(c.posts);
  campaignEls.views.textContent = campaignNum(c.views);
  campaignEls.engagements.textContent = campaignNum(c.engagements);
  campaignEls.cost.textContent = "$" + Math.round(c.cost);
}
/* Bank the clip now showing, tweening to the new total */
function addToCampaign(clip, animate = true) {
  // the 20-clip total stays up until the next clip lands, then it starts over
  if (videosPlayed >= CAMPAIGN_RESET_AFTER) {
    videosPlayed = 0;
    Object.assign(campaign, { posts: 0, views: 0, engagements: 0, cost: 0 });
  }
  videosPlayed += 1;

  const from = { ...campaign };
  campaign.posts += 1;
  campaign.views += clip.views;
  campaign.engagements += clip.engagements;
  campaign.cost += clipCost();

  if (!animate || prefersReducedMotion) {
    renderCampaign(campaign);
    return;
  }
  gsap.to(from, {
    posts: campaign.posts,
    views: campaign.views,
    engagements: campaign.engagements,
    cost: campaign.cost,
    duration: 0.9,
    ease: "power2.out",
    onUpdate: () => renderCampaign(from),
    onComplete: () => renderCampaign(campaign),
  });
}

// the first clip is already on screen, so the card opens on 1 post, not 0
addToCampaign(heroData[0], false);

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
  heroIndex += 1;
  const next = slides[heroIndex % slides.length];
  const data = heroData[heroIndex % heroData.length];

  // the clip coming on screen joins the campaign total
  addToCampaign(data);

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

/* `prefix` is the path up to the file number, e.g. "assets/img/creators/creator" */
function buildCreatorChips(list, prefix) {
  return list
    .map(
      ([pic, platform, handle, followers]) => `
      <div class="creator-chip">
        <div class="creator-chip__photo" style="background-image:url('${prefix}-${pic}.jpg')"></div>
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
const creatorMarquee = document.getElementById("creatorMarquee");
const creatorHtml = buildCreatorChips(creators, "assets/img/creators/creator");
creatorMarquee.innerHTML = creatorHtml + creatorHtml;

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

/* ---------- Genres: big colourful tags, lines drift slightly ----------
   The same set as the Content landing, sitting above the creator line. */
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

/* ---------- Build engagement around your music: campaign card carousel ------
   The same 3D coverflow the Content landing uses for its clips, but the cards
   advance on a timer: no arrows, no dragging. Cards are placed by "slot" — the
   signed distance from the centre, wrapping round the list — so only slots
   -1/0/+1 are visible and the side cards face outward.
   Covers and track names come from the Content landing's line-up. */
/* [title, artist, cover number, posts, views] \u2014 engagements come off the views */
const campaigns = [
  ["Miss the rage", "Den Best", 4, 14, 486320],
  ["Still lonely", "Hoover", 5, 18, 793540],
  ["6 Gold", "Leboi", 6, 23, 1247860],
  ["You\u2019re my fire", "Flare John", 7, 32, 2335132],
  ["SVEG", "Lukrix", 8, 27, 1684710],
  ["My world", "Je333", 9, 41, 3928450],
  ["U WUT", "Zen X", 10, 56, 5612780],
  ["Can\u2019t get away", "Lin Xiao", 11, 68, 7438920],
  ["Adrenaline rush", "Quayo", 12, 84, 9126370],
  ["Not 1 of us", "ZEZTI", 13, 36, 4287640],
];

const campaignStage = document.getElementById("campaignScroller");

if (campaignStage) {
  const group = (n) => n.toLocaleString("en-US");

  campaignStage.innerHTML = campaigns
    .map(
      ([title, artist, cover, posts, views]) => `
      <article class="campaign-tile">
        <div class="campaign-tile__cover" style="background-image:url('assets/img/covers/cover-${cover}.jpg')"></div>
        <div class="campaign-tile__body">
          <div class="campaign-tile__track">
            <p class="campaign-tile__title">${title}</p>
            <p class="campaign-tile__artist">${artist}</p>
          </div>
          <dl class="campaign-tile__stats">
            <div><dt>Posts</dt><dd>${posts}</dd></div>
            <div><dt>Views</dt><dd>${group(views)}</dd></div>
            <div><dt>Engagements</dt><dd>${group(engagementsFor(views))}</dd></div>
          </dl>
        </div>
      </article>`
    )
    .join("");

  const wheelCards = [...campaignStage.querySelectorAll(".campaign-tile")];
  const N = wheelCards.length;
  let centreIndex = 0;
  const lastSlot = new Array(N).fill(null);

  function renderWheel() {
    if (!N) return;
    const cardW = wheelCards[0].offsetWidth || 260;
    const spacing = cardW * 0.9; // room so the side cards aren't hidden behind the centre
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
  }

  window.addEventListener("resize", renderWheel);
  campaignStage.classList.add("no-anim");
  renderWheel();
  void campaignStage.offsetWidth;
  campaignStage.classList.remove("no-anim");

  /* Advance on a timer. It runs from the start rather than waiting on the
     observer, which only pauses it while the section is off screen — so the
     carousel can never end up stuck if the observer never reports back. */
  let campaignTimer = null;
  if (!prefersReducedMotion) {
    campaignTimer = gsap.to({}, {
      duration: 3.2,
      repeat: -1,
      onRepeat: () => {
        centreIndex = (centreIndex + 1) % N;
        renderWheel();
      },
    });

    const campaignSection = document.getElementById("create");
    if (campaignSection) {
      new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? campaignTimer.play() : campaignTimer.pause())),
        { threshold: 0.2 }
      ).observe(campaignSection);
    }
  }
}

/* Pay only for results: the cards stack purely via CSS sticky positioning —
   no JS needed. */

/* ---------- Logos: auto-run left to right ---------- */
/* Logos marquee lives in marquee.js, shared with the other landings. */

/* ---------- Section entrance animations ---------- */
if (!prefersReducedMotion) {
  gsap.utils
    .toArray([".section-title", ".cta__inner"])
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
