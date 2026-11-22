// ==UserScript==
// @name         Takaradex - show all cards as a3 (display only)
// @namespace    local.takaradex.a3display
// @version      1.3
// @description  Cosmetically shows every card (collection, market, etc.) with the a3 look in your own browser. Nothing is sent to the server. Alt+Shift+A toggles real/a3 view.
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
  const KEY = "takaradex-a3-display-enabled";
  const originals = new WeakMap();
  const touched = new Set(); // elements we changed, so we can revert them

  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== "0"; } catch (e) {}

  function cardName(inner) {
    const el = inner.querySelector("[data-card-caption] span[title]");
    return el ? el.textContent.trim().toLowerCase() : "";
  }

  function upgrade(inner) {
    const lvl = inner.dataset.eveil;
    if (lvl === undefined || lvl === "3") return;
    if (skip.has(cardName(inner))) return;

    const orig = {
      eveil: lvl,
      boxShadow: inner.style.boxShadow,
      frame: null, frameClass: null, frameCreated: false,
      shine: null, shineClass: null, shineDelay: "", shineWrap: null, shineCreated: false,
    };

    inner.dataset.eveil = "3";

    // a3 glow in the card's own rarity colour
    const rc = getComputedStyle(inner).getPropertyValue("--rc").trim() || "#8b5cf6";
    inner.style.boxShadow =
      `0 0 18px color-mix(in oklab, ${rc} 55%, transparent), 0 4px 14px rgb(0 0 0 / 0.6)`;

    // a3 border overlay (a0 cards have none, so create it)
    let frame = inner.querySelector(".holo-frame");
    if (frame) {
      orig.frame = frame; orig.frameClass = frame.className;
    } else {
      frame = document.createElement("span");
      frame.setAttribute("aria-hidden", "true");
      frame.className = "pointer-events-none absolute inset-0 rounded-xl holo-frame";
      inner.appendChild(frame);
      orig.frame = frame; orig.frameCreated = true;
    }
    frame.classList.remove("holo-frame-1", "holo-frame-2", "holo-frame-thin");
    frame.classList.add("holo-frame-3");

    // a3 shine overlay (also created for a0 cards)
    let shine = inner.querySelector(".holo, .holo-rainbow, .holo-dawn");
    if (shine) {
      orig.shine = shine; orig.shineClass = shine.className; orig.shineDelay = shine.style.animationDelay;
    } else {
      const wrap = document.createElement("div");
      wrap.setAttribute("aria-hidden", "true");
      wrap.className = "pointer-events-none absolute inset-0 overflow-hidden rounded-xl";
      shine = document.createElement("span");
      shine.className = "absolute inset-0";
      wrap.appendChild(shine);
      inner.appendChild(wrap);
      orig.shine = shine; orig.shineWrap = wrap; orig.shineCreated = true;
    }
    shine.classList.remove("holo", "holo-rainbow");
    shine.classList.add("holo-dawn");
    shine.style.animationDelay = "";

    originals.set(inner, orig);
    touched.add(inner);
  }

  function revert(inner) {
    const o = originals.get(inner);
    if (!o) return;
    if (o.added) return revertPicker(inner);
    inner.dataset.eveil = o.eveil;
    inner.style.boxShadow = o.boxShadow;
    if (o.frameCreated) o.frame.remove(); else o.frame.className = o.frameClass;
    if (o.shineCreated) o.shineWrap.remove();
    else { o.shine.className = o.shineClass; o.shine.style.animationDelay = o.shineDelay; }
    originals.delete(inner);
  }

  // Card pickers (e.g. "New trade" -> card to give) have no level marker at all,
  // so they get the a3 overlays added directly onto the button.
  function upgradePicker(btn) {
    if (btn.dataset.fakeA3) return;
    const scale = btn.querySelector(".card-scale");
    const frameEl = btn.querySelector(".card-frame");
    if (!scale || !frameEl || btn.querySelector("[data-eveil]")) return;
    const cap = btn.querySelector("[data-card-caption] span[title]");
    if (cap && skip.has(cap.textContent.trim().toLowerCase())) return;

    const colour = getComputedStyle(frameEl).borderTopColor;
    const orig = { filter: scale.style.filter, scale, added: [] };
    scale.style.filter =
      `drop-shadow(0 0 9px color-mix(in oklab, ${colour} 55%, transparent)) drop-shadow(0 4px 7px rgb(0 0 0 / 0.6))`;

    const frame = document.createElement("span");
    frame.setAttribute("aria-hidden", "true");
    frame.className = "pointer-events-none absolute inset-0 rounded-xl holo-frame holo-frame-3";
    const wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "pointer-events-none absolute inset-0 overflow-hidden rounded-xl";
    const shine = document.createElement("span");
    shine.className = "absolute inset-0 holo-dawn";
    wrap.appendChild(shine);
    btn.appendChild(frame);
    btn.appendChild(wrap);
    orig.added.push(frame, wrap);

    btn.dataset.fakeA3 = "1";
    originals.set(btn, orig);
    touched.add(btn);
  }

  function revertPicker(btn) {
    const o = originals.get(btn);
    if (!o) return;
    o.scale.style.filter = o.filter;
    o.added.forEach(el => el.remove());
    delete btn.dataset.fakeA3;
    originals.delete(btn);
  }

  function run() {
    if (!enabled) return;
    document.querySelectorAll("[data-eveil]").forEach(upgrade);
    document.querySelectorAll('[role="radio"]').forEach(upgradePicker);
  }

  function revertAll() {
    touched.forEach(revert);
    touched.clear();
  }

  // Re-apply whenever the site re-renders (scroll, filter, page change...).
  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(run, 100);
  }).observe(document.body, { childList: true, subtree: true });

  // Alt+Shift+A: toggle real levels / a3 display
  document.addEventListener("keydown", e => {
    if (e.altKey && e.shiftKey && e.code === "KeyA") {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? "1" : "0"); } catch (err) {}
      if (enabled) run(); else revertAll();
    }
  });

  run();
})();
