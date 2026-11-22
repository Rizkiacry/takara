// ==UserScript==
// @name         Takaradex - show all cards as a3 (display only)
// @namespace    local.takaradex.a3display
// @version      1.1
// @description  Cosmetically shows every card with the a3 look in your own browser. Nothing is sent to the server.
// @match        https://takara-cards.me/*
// @match        https://www.takara-cards.me/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Cards listed here keep their real level. Example: ["Rupa", "Hina"]
  const EXCLUDE = [];

  const skip = new Set(EXCLUDE.map(n => n.toLowerCase()));

  function upgrade(card) {
    const name = (card.getAttribute("aria-label") || "")
      .replace(/['’]s card$/, "")
      .trim()
      .toLowerCase();
    if (skip.has(name)) return;

    const inner = card.querySelector("[data-eveil]");
    if (!inner || inner.dataset.eveil === "3") return;

    // 1. level
    inner.dataset.eveil = "3";

    // 2. a3 glow in the card's own rarity colour
    const rc = getComputedStyle(inner).getPropertyValue("--rc").trim() || "#8b5cf6";
    inner.style.boxShadow =
      `0 0 18px color-mix(in oklab, ${rc} 55%, transparent), 0 4px 14px rgb(0 0 0 / 0.6)`;

    // 3. a3 border overlay (a0 cards don't have one yet, so create it)
    let frame = inner.querySelector(".holo-frame");
    if (!frame) {
      frame = document.createElement("span");
      frame.setAttribute("aria-hidden", "true");
      frame.className = "pointer-events-none absolute inset-0 rounded-xl holo-frame";
      inner.appendChild(frame);
    }
    frame.classList.remove("holo-frame-1", "holo-frame-2", "holo-frame-thin");
    frame.classList.add("holo-frame-3");

    // 4. a3 shine overlay (also created for a0 cards)
    let shine = inner.querySelector(".holo, .holo-rainbow, .holo-dawn");
    if (!shine) {
      const wrap = document.createElement("div");
      wrap.setAttribute("aria-hidden", "true");
      wrap.className = "pointer-events-none absolute inset-0 overflow-hidden rounded-xl";
      shine = document.createElement("span");
      shine.className = "absolute inset-0";
      wrap.appendChild(shine);
      inner.appendChild(wrap);
    }
    shine.classList.remove("holo", "holo-rainbow");
    shine.classList.add("holo-dawn");
    shine.style.animationDelay = "";
  }

  function run() {
    document
      .querySelectorAll('[role="button"][aria-label$="card"]')
      .forEach(upgrade);
  }

  // The site re-renders the grid when you scroll, filter or change page,
  // so re-apply whenever the DOM changes (debounced).
  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(run, 100);
  }).observe(document.body, { childList: true, subtree: true });

  run();
})();
