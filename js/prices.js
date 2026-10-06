/* ============================================================
   SYIMI PRICE & OFFERS LIST — single source of truth.

   Edit the values below and every page updates automatically:
   listing pages, product pages, the WhatsApp order message, the
   sticky order bar, the "you might also like" panel, and the
   structured data Google reads for search results.

   ------------------------------------------------------------
   HOW TO RUN AN OFFER
   ------------------------------------------------------------
   Set "active" to true and fill in "discountedPrice" and a
   "deadline". The site will then show the regular price with a
   strike-through next to the discounted price in red, plus a
   live countdown wherever one is shown. Once the deadline passes,
   the site automatically goes back to the regular price on its
   own — you don't need to come back and switch anything off.

   To end an offer early, just set "active" back to false.

   To run a plain price (no offer), leave "active" as false —
   "discountedPrice" and "deadline" are then ignored.

   ------------------------------------------------------------
   DEADLINE FORMAT — a real date, OR just the word "SOON"
   ------------------------------------------------------------
   Option A — an exact date/time:
     "YYYY-MM-DDTHH:MM:SS+03:00"      (+03:00 = Nairobi time)
     Example: "2026-10-31T23:59:59+03:00"  = 31 Oct 2026, 11:59pm
     Shows a live countdown ("Offer ends in 2d 14h 7m") and the offer
     automatically switches itself off the moment that time passes.

   Option B — literally the word "SOON" or "SOON!" (either works,
   any capitalisation):
     deadline: "SOON!"
     Shows "Offer ends SOON!" instead of a specific countdown. This
     does NOT auto-expire — use this when you want urgency without
     committing to an exact date, and turn it off yourself later by
     setting "active" to false.

   Leave deadline as null for an open-ended offer with no countdown
   shown at all (just the discounted price).

   ------------------------------------------------------------
   INDEPENDENT VS SHARED OFFERS
   ------------------------------------------------------------
   Each table lamp — orimu, merutia, amasot, enguri — has its own
   entry, so you can run a different offer on just one of them.

   Haven's 5 colours all read from the single "haven" entry below,
   so editing it once updates every Haven colour page together.
   ============================================================ */
window.SYIMI_PRICES = {
  orimu: {
    price: 7500,
    offer: { active: true, discountedPrice: 6499, deadline: "soon" }
  },
  merutia: {
    price: 7500,
    offer: { active: true, discountedPrice: 6499, deadline: "soon" }
  },
  amasot: {
    price: 7500,
    offer: { active: true, discountedPrice: 6499, deadline: "soon" }
  },
  enguri: {
    price: 7500,
    offer: { active: true, discountedPrice: 6499, deadline: "soon" }
  },
  haven: {
    price: 12500,
    offer: { active: true, discountedPrice: 10499, deadline: "Soon" }
  }
};

/* ------------------------------------------------------------
   Everything below applies the settings above to the page.
   You shouldn't need to edit anything past this line — just
   edit the prices/offers above.
   ------------------------------------------------------------ */
(function () {
  function formatKSh(amount) {
    return "KSh " + Number(amount).toLocaleString("en-KE");
  }

  // "deadline" can be either a real date/time, or literally the word
  // "SOON" or "SOON!" (any capitalisation) when you'd rather not pin
  // the offer to an exact moment. Soon-literal offers never
  // auto-expire on their own — turn them off by setting active:false.
  function isSoonLiteral(deadline) {
    return typeof deadline === "string" && /^soon!?$/i.test(deadline.trim());
  }

  // A real deadline, parsed to a timestamp — null if there isn't one,
  // or if it couldn't be parsed as a date (e.g. a typo, or "SOON").
  function parsedDeadlineMs(deadline) {
    if (!deadline || isSoonLiteral(deadline)) return null;
    var ms = new Date(deadline).getTime();
    return isNaN(ms) ? null : ms;
  }

  // Works out the real, current price for a product: the discounted
  // price if an offer is active and its deadline (if any) hasn't
  // passed yet, otherwise the regular price.
  function getEffective(key) {
    var entry = window.SYIMI_PRICES && window.SYIMI_PRICES[key];
    if (!entry) return null;
    var offer = entry.offer;
    var now = Date.now();
    var deadlineMs = offer ? parsedDeadlineMs(offer.deadline) : null;
    // Live if: active, has a discounted price, and either has no real
    // date attached (open-ended, or a "SOON" literal) or that date is
    // still in the future.
    var offerLive = !!(
      offer &&
      offer.active &&
      offer.discountedPrice != null &&
      (deadlineMs == null || deadlineMs > now)
    );
    return {
      regular: entry.price,
      discounted: offerLive ? offer.discountedPrice : null,
      deadline: offerLive ? offer.deadline : null
    };
  }

  // Renders "KSh 7,500" or, when an offer is live, the struck-through
  // original price next to the discounted price in its own colour.
  function renderPrice(el, eff) {
    if (eff.discounted != null) {
      el.innerHTML =
        '<span class="price-was">' + formatKSh(eff.regular) + "</span> " +
        '<span class="price-now">' + formatKSh(eff.discounted) + "</span>";
    } else {
      el.textContent = formatKSh(eff.regular);
    }
  }

  function applyPriceElement(el) {
    var key = el.getAttribute("data-price-key");
    var eff = getEffective(key);
    if (!eff) return;

    if (el.tagName === "A" || el.tagName === "BUTTON") {
      // WhatsApp order buttons: send the price the customer actually pays.
      var payPrice = eff.discounted != null ? eff.discounted : eff.regular;
      el.setAttribute("data-price", formatKSh(payPrice));
    } else {
      renderPrice(el, eff);
    }
  }

  function applyJsonLd(script) {
    var key = script.getAttribute("data-price-key");
    var eff = getEffective(key);
    if (!eff) return;
    try {
      var data = JSON.parse(script.textContent);
      if (data.offers) {
        data.offers.price = String(eff.discounted != null ? eff.discounted : eff.regular);
        if (eff.deadline) {
          data.offers.priceValidUntil = eff.deadline.slice(0, 10);
        } else {
          delete data.offers.priceValidUntil;
        }
      }
      script.textContent = JSON.stringify(data);
    } catch (e) {
      /* leave untouched if it doesn't parse */
    }
  }

  // Formats the time left as "Offer ends in 2d 14h 7m" for a real date.
  function formatCountdown(ms) {
    var totalMinutes = Math.floor(ms / 60000);
    var days = Math.floor(totalMinutes / 1440);
    var hours = Math.floor((totalMinutes % 1440) / 60);
    var minutes = totalMinutes % 60;
    var parts = [];
    if (days) parts.push(days + "d");
    if (days || hours) parts.push(hours + "h");
    parts.push(minutes + "m");
    return "Offer ends in " + parts.join(" ");
  }

  function wireCountdown(el) {
    var key = el.getAttribute("data-countdown-key");

    function tick() {
      var eff = getEffective(key);

      if (!eff || !eff.deadline) {
        el.textContent = "";
        el.hidden = true;
        return;
      }

      // deadline is literally "SOON" / "SOON!" — show that as-is,
      // with no real date to count down to or expire against.
      if (isSoonLiteral(eff.deadline)) {
        el.hidden = false;
        el.textContent = "Offer ends SOON!";
        return;
      }

      var deadlineMs = parsedDeadlineMs(eff.deadline);
      if (deadlineMs == null) {
        // Not "SOON" and not a date we can parse (e.g. a typo) —
        // fail safe: no countdown shown, but the discounted price
        // above is unaffected.
        el.textContent = "";
        el.hidden = true;
        return;
      }

      var remaining = deadlineMs - Date.now();

      if (remaining <= 0) {
        el.textContent = "";
        el.hidden = true;
        // Offer just lapsed mid-visit — snap every matching price
        // back to the regular price without needing a page reload.
        document
          .querySelectorAll('[data-price-key="' + key + '"]')
          .forEach(applyPriceElement);
        return;
      }

      el.hidden = false;
      el.textContent = formatCountdown(remaining);
    }

    tick();
    setInterval(tick, 30 * 1000); // a minute-level countdown only needs to refresh occasionally
  }

  // Applies prices/offers/countdowns to everything under `root` (default:
  // the whole page). Exposed on window so other scripts — e.g. the
  // "random floor lamps you might also like" picker in main.js — can
  // call it again after inserting new price markup into the page,
  // since this only runs automatically once, on first page load.
  function applyAll(root) {
    root = root || document;
    // Plain price elements only — JSON-LD <script> tags also carry
    // data-price-key, but they're structured data, not visible price
    // text, so they're deliberately excluded here and handled by
    // applyJsonLd below instead.
    root.querySelectorAll("[data-price-key]:not(script)").forEach(applyPriceElement);
    root.querySelectorAll('script[type="application/ld+json"][data-price-key]').forEach(applyJsonLd);
    root.querySelectorAll("[data-countdown-key]").forEach(wireCountdown);
  }

  window.SYIMI_applyPricing = applyAll;

  document.addEventListener("DOMContentLoaded", function () {
    applyAll(document);
  });
})();
