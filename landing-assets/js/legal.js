/* The footer's Legal entry opens a list of the legal documents rather than
   navigating to a page of its own. */
(function () {
  const dialog = document.getElementById("legalDialog");
  if (!dialog) return;

  function open() {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function close() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  document.querySelectorAll("[data-legal-open]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); open(); })
  );
  dialog.querySelectorAll("[data-legal-close]").forEach((el) =>
    el.addEventListener("click", close)
  );

  // clicking the backdrop closes it, same as the support dialog
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
})();
