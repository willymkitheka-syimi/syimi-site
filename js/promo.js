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
  // Live countdown text, e.g. "4d 09h 12m 33s" (no seconds-jitter: digits are fixed width in CSS)
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function countdownText() {
    var end = toMs(P.endsAt);
    if (end == null) return "";
    var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
    var d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600),
        m = Math.floor((left % 3600) / 60), sec = left % 60;
    return (d ? d + "d " : "") + (d || h ? two(h) + "h " : "") + two(m) + "m " + two(sec) + "s";
  }
  // The ticking part: "Ends in 4d 09h 12m 33s". Filled in and updated every second.
  function countdownHtml() {
    return P.endsAt ? "<span class=\"promo-countdown\" data-promo-countdown>Ends in " + countdownText() + "</span>" : "";
  }
  var endLong = function () { return endDate({ day: "numeric", month: "long", year: "numeric" }); }; // 3 November 2026

  /* ---------------- WORDING — edit the sentences here ---------------- */
  var W = {
    // Banner: the sentence, then the live countdown (added in render below).
    banner: function () {
      return "Celebrating 1,000 Instagram followers: free delivery and home setup for " + who() + ". " +
        "Mention code " + P.code + (P.endsAt ? " · " : ".");
    },
    bannerLink: "See details",

    productLine: function () {
      return (P.limit ? "First " + P.limit + " orders only: free" : "Free") +
        " delivery and home setup in " + P.freeDeliveryAreas + ". Mention code " + P.code +
        " when you order." + (P.endsAt ? " " + countdownHtml() : "");
    },

    contactHtml: function () {
      return "" +
        "<div class=\"promo-intro\">" +
          "<h3>Celebrating 1,000 Instagram followers</h3>" +
          "<p>" + who().charAt(0).toUpperCase() + who().slice(1) +
          " come with free delivery and home setup in " + P.freeDeliveryAreas +
          ". Other areas are quoted on request.</p>" +
          (P.endsAt ? "<p class=\"promo-timer\">" + countdownHtml() + "</p>" : "") +
          "<p class=\"promo-small\">" + (P.endsAt ? "Offer closes " + endLong() : "") +
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
      text.textContent = W.banner();
      banner.appendChild(text);
      if (P.endsAt) {
        var cd = document.createElement("span");
        cd.className = "promo-countdown";
        cd.setAttribute("data-promo-countdown", "");
        banner.appendChild(cd);
        banner.appendChild(document.createTextNode(" "));
      }
      var link = document.createElement("a");
      link.href = base + "contact.html#offer";
      link.textContent = W.bannerLink;
      banner.appendChild(link);
      document.body.insertBefore(banner, document.body.firstChild);
    } else if (!live && banner) {
      banner.remove();
    }

    // One small line under the price on lamp pages
    document.querySelectorAll("[data-promo-line]").forEach(function (el) {
      el.innerHTML = live ? W.productLine() : "";
      el.hidden = !live;
    });

    // Section on the Contact page
    document.querySelectorAll("[data-promo-contact]").forEach(function (el) {
      el.innerHTML = live ? W.contactHtml() : "";
      el.hidden = !live;
    });
  }

  // Update every countdown on the page ("Ends in 4d 09h 12m 33s").
  function tickCountdowns() {
    var t = "Ends in " + countdownText();
    document.querySelectorAll("[data-promo-countdown]").forEach(function (el) {
      if (el.textContent !== t) el.textContent = t;
    });
  }

  var wasLive = null;
  function start() {
    render();
    tickCountdowns();
    wasLive = P.isLive();
    // Every second: tick the countdown, and hide everything the moment the
    // offer ends (or switches state) while a page is open.
    setInterval(function () {
      var live = P.isLive();
      if (live !== wasLive) { wasLive = live; render(); }
      if (live) tickCountdowns();
    }, 1000);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
