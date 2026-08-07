/* The closing CTA sits on brand red until it is scrolled to, then cycles
   through the other brand colours. Shared by all three landings. */
(function () {
  const card = document.querySelector(".cta__card");
  if (!card) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        card.classList.add("is-live");
        observer.disconnect();
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(card);
})();
