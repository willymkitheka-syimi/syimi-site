/* ============================================================
   SYIMI PROMOTION — one place to run or switch off the offer.

   TO SWITCH THE OFFER OFF:  set  active: false  below.
   Everything it controls disappears (top banner, the line under
   the price on lamp pages, the section on the Contact page) and
   the WhatsApp order message goes back to the normal one.

   You never need to switch it off at the end date: once "endsAt"
   has passed, the offer hides itself automatically.

   "limit" is the number of orders the offer is open to. The site
   can't count orders by itself, so once you've taken that many,
   set  active: false  to close the offer early.

   TO RUN A NEW OFFER LATER: change the values below and, if the
   wording changes too, the sentences in the "WORDING" block.

   endsAt format:  "YYYY-MM-DDTHH:MM:SS+03:00"  (+03:00 = Nairobi time)
   startsAt:       same format, or null to start straight away.
   ============================================================ */
window.SYIMI_PROMO = {
  active: true,
  startsAt: null,
  endsAt: "2026-11-03T23:59:59+03:00",   // ends 3 Nov 2026, 11:59pm
  code: "1K",
  limit: 5,                              // only the first 5 orders (use null for no limit)
  depositPercent: 50,
  freeDeliveryAreas: "Nairobi, Kiambu and Thika"
};

/* ------------------------------------------------------------
   Everything below applies the settings above to the site.
   ------------------------------------------------------------ */
(function () {
  var P = window.SYIMI_PROMO;

  // Where the site's root folder is, so links work from /products/ too.
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/promo\.js(\?.*)?$/, "") : "";

  function toMs(v) {
    if (!v) return null;
    var ms = new Date(v).getTime();
    return isNaN(ms) ? null : ms;
  }

  // Live = switched on, started (if a start date is set) and not yet ended.
  // A mistyped endsAt that can't be read is treated as "ended" so the
  // offer can never get stuck on by accident.
  P.isLive = function () {
    if (!P.active) return false;
    var now = Date.now();
    var start = toMs(P.startsAt);
    if (P.startsAt && start == null) return false;
    if (start != null && now < start) return false;
    if (P.endsAt) {
      var end = toMs(P.endsAt);
      if (end == null || now >= end) return false;
    }
    return true;
  };

  function endDate(opts) {
    var ms = toMs(P.endsAt);
    if (ms == null) return "";
    return new Date(ms).toLocaleDateString("en-GB", Object.assign({ timeZone: "Africa/Nairobi" }, opts));
  }
  // "our first 5 lamp orders" / "every lamp order"
  function who() { return P.limit ? "our first " + P.limit + " lamp orders" : "every lamp order"; }
  var endShort = function () { return endDate({ day: "numeric", month: "short" }); };      // 3 Nov
  var endLong = function () { return endDate({ day: "numeric", month: "long", year: "numeric" }); }; // 3 November 2026

  /* ---------------- WORDING — edit the sentences here ---------------- */
  var W = {
    banner: function () {
      return "Celebrating 1,000 Instagram followers: free delivery and home setup for " + who() + ". " +
        "Mention code " + P.code + (P.endsAt ? " · Ends " + endShort() : "") + ".";
    },
    bannerLink: "See details",

    productLine: function () {
      return (P.limit ? "First " + P.limit + " orders only: free" : "Free") +
        " delivery and home setup in " + P.freeDeliveryAreas + ". Mention code " + P.code +
        " when you order." + (P.endsAt ? " Ends " + endShort() + "." : "");
    },

    contactHtml: function () {
      return "" +
        "<div class=\"promo-intro\">" +
        "<h3>Celebrating 1,000 Instagram followers</h3>" +
        "<p>" + who().charAt(0).toUpperCase() + who().slice(1) +
        " come with free delivery and home setup in " + P.freeDeliveryAreas +
        ". Other areas are quoted on request.</p>" +
        "<p class=\"promo-small\">" + (P.endsAt ? "Ends " + endLong() : "") +
        (P.limit ? (P.endsAt ? ", or sooner if" : "Closes once") + " the first " + P.limit + " orders are taken." : ".") + "</p>" +
        "</div>" +
        "<div>" +
        "<p class=\"promo-panel-title\">How to order</p>" +
        "<ol>" +
        "<li>Choose a lamp and tap <strong>Order on WhatsApp</strong>, or use the form below.</li>" +
        "<li>Mention the code <strong>" + P.code + "</strong>.</li>" +
        "<li>We confirm your area and delivery day, and tell you how to pay.</li>" +
        "</ol>" +
        "</div>" +
        "<div>" +
        "<p class=\"promo-panel-title\">Book with a deposit</p>" +
        "<p>Pay a " + P.depositPercent + "% M-Pesa deposit to book your lamp, and pay the rest on delivery.</p>" +
        "</div>";
    },

    // WhatsApp order message on lamp pages while the offer is live.
    // (When the offer is off, the normal message in main.js is used.)
    whatsappOrder: function (name, price) {
      return "Hi SYIMI, I would like to order 1 piece of this " + name + ", " + price +
        ", with offer code " + P.code + " (free delivery and home setup). " +
        "Kindly confirm that my area is covered and when it can be delivered.";
    },
    // Added to the end of a Contact form message while the offer is live.
    whatsappFormNote: function () {
      return "Offer code: " + P.code + ".";
    }
  };

  P.orderMessage = W.whatsappOrder;
  P.formNote = W.whatsappFormNote;

  /* ---------------- show / hide ---------------- */
  function render() {
    var live = P.isLive();

    // Slim banner at the very top of the page
    var banner = document.querySelector(".promo-banner");
    if (live && !banner) {
      banner = document.createElement("div");
      banner.className = "promo-banner";
      banner.setAttribute("role", "region");
      banner.setAttribute("aria-label", "Offer");
      var text = document.createElement("span");
      text.textContent = W.banner() + " ";
      var link = document.createElement("a");
      link.href = base + "contact.html#offer";
      link.textContent = W.bannerLink;
      banner.appendChild(text);
      banner.appendChild(link);
      document.body.insertBefore(banner, document.body.firstChild);
    } else if (!live && banner) {
      banner.remove();
    }

    // One small line under the price on lamp pages
    document.querySelectorAll("[data-promo-line]").forEach(function (el) {
      el.textContent = live ? W.productLine() : "";
      el.hidden = !live;
    });

    // Section on the Contact page
    document.querySelectorAll("[data-promo-contact]").forEach(function (el) {
      el.innerHTML = live ? W.contactHtml() : "";
      el.hidden = !live;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
  // Hide everything on its own if the end time passes while a page is open.
  setInterval(render, 60 * 1000);
})();
