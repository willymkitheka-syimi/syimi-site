/* ============================================================
   SYIMI AVAILABILITY — mark a one-of-one lamp as Sold, in one place.

   TO MARK A LAMP AS SOLD:  change its value below from "Available"
   to "Sold"  (keep the quote marks), save, and upload this file.
   TO PUT IT BACK:  change it to "Available".

   What "Sold" does for that lamp:
     - a small "Sold" tag on its cards, its page and the
       "You might also like" list
     - the Order on WhatsApp button becomes a disabled "Sold" button
     - the delivery and payment lines under the price are hidden
     - the page says the color has been taken, with a "See available
       colors" button and a "Join the waitlist" button (WhatsApp)
     - the page stays live with all its photos
   ============================================================ */
window.SYIMI_AVAILABILITY = {
  "penumbra-black":    "Available",   // "Available" or "Sold"
  "penumbra-offwhite": "Available",   // "Available" or "Sold"
  "penumbra-beige":    "Available"    // "Available" or "Sold"
};

/* ------------------------------------------------------------
   Everything below applies the settings above to the site.
   ------------------------------------------------------------ */
(function () {
  var A = window.SYIMI_AVAILABILITY;

  // Where the site's root folder is, so links work from /products/ too.
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/availability\.js(\?.*)?$/, "") : "";

  // The lamps that exist only once. The color is the name used on the page.
  var LAMPS = {
    "penumbra-black":    { color: "Black",     url: "products/penumbra-black.html" },
    "penumbra-offwhite": { color: "Off-white", url: "products/penumbra-offwhite.html" },
    "penumbra-beige":    { color: "Beige",     url: "products/penumbra-beige.html" }
  };

  /* ---------------- WORDING — edit the sentences here ---------------- */
  var W = {
    oneOfOne: "One of one",
    sold: "Sold",
    soldNote: "This color has been taken. Each color exists only once.",
    seeAvailable: "See available colors",
    waitlist: "Join the waitlist",
    availableNow: "Available now:",
    waitlistMessage: function (color) {
      return "Hi SYIMI, I'd like to join the waitlist for the next Penumbra edition in " + color + ".";
    }
  };

  function isSold(id) {
    return String(A[id] || "").trim().toLowerCase() === "sold";
  }
  window.SYIMI_isSold = isSold;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Other colors of the same lamp that are still Available.
  function availableOthers(id) {
    var family = id.split("-")[0];
    return Object.keys(LAMPS).filter(function (k) {
      return k !== id && k.split("-")[0] === family && !isSold(k);
    });
  }

  // Floating tags: "One of one" (+ "Sold") sit on the photo of a card, or
  // under the price in the "You might also like" list.
  function tagCard(item, id, inline) {
    if (item.getAttribute("data-tagged")) return;
    item.setAttribute("data-tagged", "1");
    var tags = item.querySelector(".card-tags");
    if (!tags) {
      tags = el("span", "card-tags" + (inline ? " card-tags--inline" : ""));
      tags.appendChild(el("span", "card-tag card-tag--one", W.oneOfOne));
      if (inline) {
        (item.querySelector("div:last-child") || item).appendChild(tags);
      } else {
        item.insertBefore(tags, item.firstChild);
      }
    }
    if (isSold(id)) tags.appendChild(el("span", "card-tag card-tag--sold", W.sold));
  }

  function soldPage(meta, id) {
    if (meta.getAttribute("data-sold-applied")) return;
    meta.setAttribute("data-sold-applied", "1");
    var color = LAMPS[id].color;

    // "Sold" tag next to the "Floor lamp" label
    var kind = meta.querySelector(".kind");
    if (kind) kind.appendChild(el("span", "card-tag card-tag--sold card-tag--inline", W.sold));

    // Order on WhatsApp -> disabled Sold button
    meta.querySelectorAll(".hero-actions [data-whatsapp]").forEach(function (btn) {
      var sold = el("button", "btn btn-primary btn-sold", W.sold);
      sold.type = "button";
      sold.disabled = true;
      sold.setAttribute("aria-disabled", "true");
      btn.parentNode.replaceChild(sold, btn);
    });

    // The delivery and payment lines are only for lamps you can order
    meta.querySelectorAll(".order-terms").forEach(function (t) { t.hidden = true; });

    // The mobile order bar has nothing to order
    document.querySelectorAll(".sticky-order-bar").forEach(function (bar) { bar.hidden = true; });

    // Short line + See available colors + Join the waitlist
    var others = availableOthers(id);
    var panel = el("div", "sold-panel");
    panel.appendChild(el("p", "sold-note", W.soldNote));

    var actions = el("div", "sold-actions");
    var see = el("a", "btn btn-outline", W.seeAvailable);
    see.href = base + (others.length ? LAMPS[others[0]].url : "floor-lamps.html");
    actions.appendChild(see);
    var wait = el("a", "btn btn-primary", W.waitlist);
    wait.href = "#";
    wait.setAttribute("data-whatsapp", "waitlist");
    wait.setAttribute("data-whatsapp-message", W.waitlistMessage(color));
    actions.appendChild(wait);
    panel.appendChild(actions);

    // With two or more colors left, link each one
    if (others.length > 1) {
      var list = el("p", "sold-others", W.availableNow + " ");
      others.forEach(function (k, i) {
        if (i) list.appendChild(document.createTextNode(" · "));
        var a = el("a", "", LAMPS[k].color);
        a.href = base + LAMPS[k].url;
        list.appendChild(a);
      });
      panel.appendChild(list);
    }

    var actionsRow = meta.querySelector(".hero-actions");
    if (actionsRow && actionsRow.parentNode) actionsRow.parentNode.insertBefore(panel, actionsRow.nextSibling);
    else meta.appendChild(panel);

    // Search engines: mark the product as sold out
    document.querySelectorAll('script[type="application/ld+json"][data-price-key]').forEach(function (s) {
      try {
        var data = JSON.parse(s.textContent);
        if (data.offers) data.offers.availability = "https://schema.org/SoldOut";
        s.textContent = JSON.stringify(data);
      } catch (e) { /* leave untouched if it doesn't parse */ }
    });
  }

  // Applies availability to everything under `root` (default: the whole
  // page). Exposed on window so main.js can call it again after it builds
  // the "You might also like" list.
  function apply(root) {
    root = root || document;
    root.querySelectorAll(".product-card[data-lamp]").forEach(function (card) {
      var id = card.getAttribute("data-lamp");
      if (LAMPS[id]) tagCard(card, id, false);
    });
    root.querySelectorAll(".also-like-item[data-lamp]").forEach(function (item) {
      var id = item.getAttribute("data-lamp");
      if (LAMPS[id]) tagCard(item, id, true);
    });
    root.querySelectorAll(".product-meta[data-lamp]").forEach(function (meta) {
      var id = meta.getAttribute("data-lamp");
      if (LAMPS[id] && isSold(id)) soldPage(meta, id);
    });
  }
  window.SYIMI_applyAvailability = apply;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { apply(document); });
  } else {
    apply(document);
  }
})();
