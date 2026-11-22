// ==UserScript==
// @name         Takaradex - show chosen cards as a3 (display only)
// @namespace    local.takaradex.a3display
// @version      1.0
// @description  Cosmetically shows selected cards with the a3 look in your own browser. Nothing is sent to the server.
// @match        https://takara-cards.me/*
// @match        https://www.takara-cards.me/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Card names to display as a3. Add or remove names here.
  const TARGETS = ["Silence Suzuka", "Mai Sakurajima", "Megumin"];

  const wanted = new Set(TARGETS.map(n => n.toLowerCase()));

  function upgrade(card) {
    const name = (card.getAttribute("aria-label") || "")
      .replace(/['’]s card$/, "")
      .trim()
      .toLowerCase();
    if (!wanted.has(name)) return;

    const inner = card.querySelector("[data-eveil]");
    if (!inner || inner.dataset.eveil === "3") return;

    // 1. level
    inner.dataset.eveil = "3";

    // 2. a3 glow in the card's own rarity colour
    const rc = getComputedStyle(inner).getPropertyValue("--rc").trim() || "#8b5cf6";
    inner.style.boxShadow =
      `0 0 18px color-mix(in oklab, ${rc} 55%, transparent), 0 4px 14px rgb(0 0 0 / 0.6)`;

    // 3. a3 border overlay
    const frame = card.querySelector(".holo-frame");
    if (frame) {
      frame.classList.remove("holo-frame-1", "holo-frame-2", "holo-frame-thin");
      frame.classList.add("holo-frame-3");
    }

    // 4. a3 shine overlay
    const shine = card.querySelector(".holo, .holo-rainbow");
    if (shine) {
      shine.classList.remove("holo", "holo-rainbow");
      shine.classList.add("holo-dawn");
      shine.style.animationDelay = "";
    }
  }

  function run() {
    document
      .querySelectorAll('[role="button"][aria-label$="card"]')
      .forEach(upgrade);
  }

  // The site re-renders the grid when you scroll, filter or change page,
  // so re-apply whenever the DOM changes (debounced).
  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(run, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  run();
})();
