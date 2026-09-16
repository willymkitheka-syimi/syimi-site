/* ============================================================
   SYIMI PRICE LIST — single source of truth.

   Edit the numbers below (Kenyan Shillings, no commas) and every
   page that shows a price updates automatically: listing pages,
   product pages, the WhatsApp order message, the sticky order bar,
   the "you might also like" panel, and the structured data Google
   reads for search results.

   Do not edit prices anywhere else — everything on the site reads
   from this one place.
   ============================================================ */
window.SYIMI_PRICES = {
  orimu:   7500,
  merutia: 7500,
  amasot:  7500,
  enguri:  7500,
  haven:   9500
};

/* ------------------------------------------------------------
   Applies the prices above to every priced element on the page.
   Elements opt in with a data-price-key="<product>" attribute,
   where <product> is one of the keys above (orimu, merutia,
   amasot, enguri, haven). You shouldn't need to touch this part —
   just edit the numbers above.
   ------------------------------------------------------------ */
(function () {
  function formatKSh(amount) {
    return "KSh " + Number(amount).toLocaleString("en-KE");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var PRICES = window.SYIMI_PRICES || {};

    // Plain price text/labels (listing cards, product price, sticky bar, "also like" panel)
    document.querySelectorAll("[data-price-key]").forEach(function (el) {
      var key = el.getAttribute("data-price-key");
      if (!(key in PRICES)) return;
      var formatted = formatKSh(PRICES[key]);

      if (el.tagName === "A" || el.tagName === "BUTTON") {
        // WhatsApp order buttons: update the data-price attribute that
        // main.js reads when building the order message.
        el.setAttribute("data-price", formatted);
      } else {
        el.textContent = formatted;
      }
    });

    // Structured data (JSON-LD) for Google — keeps "offers.price" in sync
    document.querySelectorAll('script[type="application/ld+json"][data-price-key]').forEach(function (script) {
      var key = script.getAttribute("data-price-key");
      if (!(key in PRICES)) return;
      try {
        var data = JSON.parse(script.textContent);
        if (data.offers) data.offers.price = String(PRICES[key]);
        script.textContent = JSON.stringify(data);
      } catch (e) {
        /* leave untouched if it doesn't parse */
      }
    });
  });
})();
