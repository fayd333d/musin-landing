/* Support dialog, shared by every page. The message is capped at 150 words —
   counted the way a reader would, not by characters — and the send handler is
   a placeholder until the mail endpoint is wired up. */
(function () {
  const dialog = document.getElementById("supportDialog");
  if (!dialog) return;

  const form = dialog.querySelector("[data-support-form]");
  const message = dialog.querySelector("#supportMessage");
  const email = dialog.querySelector("#supportEmail");
  const counter = dialog.querySelector("[data-support-count]");
  const status = dialog.querySelector("[data-support-status]");
  const MAX_WORDS = 150;

  const words = (text) => text.trim().split(/\s+/).filter(Boolean);

  function countWords() {
    const list = words(message.value);
    const over = list.length > MAX_WORDS;
    counter.textContent = `${list.length} / ${MAX_WORDS} words`;
    counter.classList.toggle("is-over", over);
    return over;
  }

  /* Trim the paste rather than rejecting it, so a long paste still lands */
  message.addEventListener("input", () => {
    const list = words(message.value);
    if (list.length > MAX_WORDS) {
      const keep = list.slice(0, MAX_WORDS).join(" ");
      // keep a trailing space so the next word starts cleanly
      message.value = /\s$/.test(message.value) ? keep + " " : keep;
    }
    countWords();
  });

  function open() {
    status.textContent = "";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    countWords();
    message.focus();
  }

  function close() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  document.querySelectorAll("[data-support-open]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); open(); })
  );
  dialog.querySelectorAll("[data-support-close]").forEach((el) =>
    el.addEventListener("click", close)
  );

  // clicking the backdrop closes it
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = ""; // never leave the previous attempt's message up
    if (countWords()) {
      status.textContent = `Please keep your message to ${MAX_WORDS} words or fewer.`;
      return;
    }
    if (!words(message.value).length) {
      status.textContent = "Please write a message before sending.";
      message.focus();
      return;
    }
    if (!email.checkValidity()) { email.reportValidity(); return; }
    /* TODO: post to the support endpoint once it exists. Nothing leaves the
       browser yet, so don't tell the reader it has been sent. */
    status.textContent = "Thanks — message sending isn’t connected yet, so nothing was sent.";
  });
})();
