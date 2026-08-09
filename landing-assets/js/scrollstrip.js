/* Turns a GSAP-driven running line into a strip the reader can scroll.
   The animation runs until the first touch, drag or sideways wheel, then it
   hands over: the transform is converted into a scroll offset so the strip
   stays exactly where it was, and from then on it is an ordinary scroller. */
window.makeStripScrollable = function (viewport, inner, tween) {
  if (!viewport || !inner || !tween) return;

  let handedOver = false;

  function handOver() {
    if (handedOver) return;
    handedOver = true;

    // where the tween had pushed it to, in pixels
    const pct = Number(gsap.getProperty(inner, "xPercent")) || 0;
    const x = Number(gsap.getProperty(inner, "x")) || 0;
    const offset = -(x + (inner.offsetWidth * pct) / 100);

    tween.kill();
    gsap.set(inner, { clearProps: "transform,willChange" });
    viewport.classList.add("is-scrollable");
    viewport.scrollLeft = offset;
  }

  viewport.addEventListener("pointerdown", handOver);
  viewport.addEventListener("touchstart", handOver, { passive: true });
  viewport.addEventListener(
    "wheel",
    (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) handOver(); },
    { passive: true }
  );
};
