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
  let builtGroupWidth = 0;
  let builtCopies = 0;

  function copiesNeeded(groupWidth) {
    /* Size for the widest the window can get, plus one spare copy, so the gap
       cannot reappear even if the resize rebuild below never runs. */
    const widest = Math.max(window.innerWidth, (window.screen && window.screen.width) || 0);
    return (Math.ceil(widest / groupWidth) + 1) * 2;
  }

  function build() {
    // measure the original group; the clones are identical, so no need to
    // tear the strip down before knowing whether anything has to change
    const groupWidth = group.getBoundingClientRect().width;
    if (!groupWidth) return;

    const copies = copiesNeeded(groupWidth);

    /* Rebuilding restarts the loop, which reads as a jump. Only do it when the
       layout genuinely changed — not on every resize event. */
    if (tween && copies === builtCopies && Math.abs(groupWidth - builtGroupWidth) < 1) return;

    const progress = tween ? tween.progress() : 0;
    if (tween) tween.kill();

    marquee.querySelectorAll(".logos__group").forEach((g, i) => { if (i) g.remove(); });
    for (let i = 1; i < copies; i += 1) marquee.appendChild(group.cloneNode(true));

    const halfWidth = (groupWidth * copies) / 2;
    tween = gsap.fromTo(
      marquee,
      { x: -halfWidth },
      { x: 0, duration: halfWidth / PX_PER_SECOND, ease: "none", repeat: -1, force3D: true }
    );
    tween.progress(progress); // carry on from where it was, rather than snapping

    builtGroupWidth = groupWidth;
    builtCopies = copies;
  }

  build();

  // the logos are SVGs, so the group can settle a little after first paint
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  window.addEventListener("load", build);

  /* On phones, scrolling up expands the browser chrome, which fires resize with
     only the height changed. Rebuilding on that is what made the strip jump. */
  let lastWidth = window.innerWidth;
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
})();
