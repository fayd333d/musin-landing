/* Logo marquee, shared by the three landings.
   Two copies of the group are only seamless while one copy is at least as wide
   as the window — otherwise the strip runs out part-way through the cycle and
   leaves a blank stretch ahead of the logos. Clone enough copies that half the
   strip always covers the screen, and drive it in pixels so the loop period
   matches that half exactly. */
(function () {
  const marquee = document.getElementById("logoMarquee");
  if (!marquee || typeof gsap === "undefined") return;

  const group = marquee.querySelector(".logos__group");
  if (!group) return;

  const PX_PER_SECOND = 37; // unchanged from the original one-group-per-30s
  let tween = null;

  function build() {
    if (tween) tween.kill();
    gsap.set(marquee, { x: 0 });

    // back to a single group, so the measurement is of one group only
    marquee.querySelectorAll(".logos__group").forEach((g, i) => { if (i) g.remove(); });

    const groupWidth = group.getBoundingClientRect().width;
    if (!groupWidth) return;

    /* Size for the widest the window can get, plus one spare copy, so the gap
       cannot reappear even if the resize rebuild below never runs. */
    const widest = Math.max(window.innerWidth, (window.screen && window.screen.width) || 0);
    const perHalf = Math.ceil(widest / groupWidth) + 1;
    for (let i = 1; i < perHalf * 2; i += 1) marquee.appendChild(group.cloneNode(true));

    const halfWidth = groupWidth * perHalf;
    tween = gsap.fromTo(
      marquee,
      { x: -halfWidth },
      { x: 0, duration: halfWidth / PX_PER_SECOND, ease: "none", repeat: -1, force3D: true }
    );
  }

  build();

  // the logos are SVGs, so the group can settle a little after first paint
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  window.addEventListener("load", build);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
})();
