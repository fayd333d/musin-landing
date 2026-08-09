/* Mobile menu toggle. The landings each carry their own copy inside their
   page script; this is the standalone version the document pages load. */
(function () {
  const burger = document.querySelector(".nav-burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (!burger || !mobileMenu) return;

  burger.addEventListener("click", () => {
    const open = burger.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.hidden = !open;
  });
})();
