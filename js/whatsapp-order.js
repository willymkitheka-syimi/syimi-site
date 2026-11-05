/* ============================================================
   SYIMI ORDER DIALOG

   When someone taps "Order on WhatsApp" on a product page, a small dialog
   collects the basics (delivery area, delivery day and time, how they want
   to pay), tells them whether delivery is free, and then opens WhatsApp
   with the order message ready to send. That way you don't need a round
   of questions before you can confirm an order.

   Setup:   <script src="/js/whatsapp-order.js" defer></script> before </body>
            on every product page.
   Button:  the order button carries  data-whatsapp-order,  data-product
            ("Haven — Beige") and data-price ("KSh 12,500"). Its normal
            WhatsApp link stays in place as the fallback: if this file
            fails to load, or the browser is too old for dialogs, the
            button works exactly as it did before.
   Price:   js/prices.js keeps data-price up to date (offers included), so
            the dialog always quotes the price the customer actually sees.
   Number:  taken from the button's own WhatsApp link, so the number stays
            in one place (js/main.js).

   Edit the sentences in the WORDING block below. Nothing else needs to change.
   ============================================================ */
(function () {
  'use strict';

  // Already running, or a browser without <dialog> (very old phones and
  // in-app browsers): leave the normal link alone.
  if (window.__syOrderDialog) return;
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  window.__syOrderDialog = true;

  var FREE_DELIVERY_AREA = 'Nairobi';  // free delivery applies here
  var DEPOSIT_PERCENT = 50;
  var FALLBACK_PHONE = '254726796860'; // only used if the button has no wa.me link

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

  /* ---------------- WORDING — edit the sentences here ---------------- */
  var W = {
    title: 'Where and when should we deliver?',
    zoneLegend: 'Delivery location',
    zoneIn: 'Within ' + FREE_DELIVERY_AREA,
    zoneOut: 'Outside ' + FREE_DELIVERY_AREA,
    areaLabel: 'Area or estate',
    areaPlaceholder: 'For example, Kilimani',
    areaError: 'Enter your area or estate so we can confirm delivery.',
    dateLabel: 'Preferred delivery day',
    datePlaceholder: 'For example, Saturday 7 November',
    dateError: 'Choose the day you would like your lamp delivered.',
    dateOldError: 'Choose a day from tomorrow.',
    timeLabel: 'Time of day',
    timeAny: 'Any time',
    timeMorning: 'Morning',
    timeAfternoon: 'Afternoon',
    payLabel: 'Payment',
    payFull: 'Pay in full by M-Pesa',
    payDeposit: DEPOSIT_PERCENT + '% deposit, balance on delivery',
    noteIn: 'Free delivery within ' + FREE_DELIVERY_AREA + '.',
    noteOut: 'We will quote the delivery cost and the earliest delivery date before you pay.',
    noteDeposit: function (deposit, balance) {
      return 'Deposit ' + deposit + ', balance ' + balance + ' on delivery.';
    },
    submit: 'Continue to WhatsApp',
    cancel: 'Cancel',

    // The message that opens in WhatsApp.
    message: function (o) {
      var lines = [
        'Hi SYIMI, I would like to order the ' + o.name + (o.price ? ', ' + o.price : '') + '.',
        'Delivery area: ' + o.place + (o.inside ? ' (free delivery).' : '.')
      ];
      if (o.deposit) {
        lines.push(o.total
          ? 'Payment: ' + DEPOSIT_PERCENT + '% deposit of ' + o.depositAmount + ' now, and ' + o.balanceAmount + ' on delivery.'
          : 'Payment: ' + DEPOSIT_PERCENT + '% deposit now, and the balance on delivery.');
      } else {
        lines.push(o.total ? 'Payment: ' + o.price + ' in full by M-Pesa.' : 'Payment: in full by M-Pesa.');
      }
      if (o.inside) {
        lines.push('Preferred delivery: ' + o.when + '.');
      } else {
        lines.push('Please send the delivery cost and the earliest delivery date.');
      }
      return lines.join('\n');
    }
  };

  /* ---------------- styles (the site's own colors, fonts and buttons) ---------------- */
  var css =
    '.sy-dialog{border:0;padding:0;border-radius:2px 18px 2px 18px;background:var(--paper,#f1ece1);color:var(--ink,#1c1613);' +
      'width:min(92vw,420px);max-height:92vh;font-family:var(--font-body,inherit);box-shadow:0 18px 50px rgba(28,22,19,.35)}' +
    '.sy-dialog::backdrop{background:rgba(28,22,19,.55)}' +
    '.sy-form{padding:26px 24px 22px;display:grid;gap:18px}' +
    '.sy-title{margin:0;font-family:var(--font-display,Georgia,serif);font-size:1.45rem;font-weight:500;line-height:1.2}' +
    '.sy-sub{margin:-8px 0 0;font-size:.95rem;opacity:.8}' +
    '.sy-field{display:grid;gap:8px;border:0;padding:0;margin:0;min-width:0}' +
    '.sy-field[hidden]{display:none}' +
    '.sy-field legend,.sy-lab{font-size:.9rem;font-weight:600;padding:0}' +
    '.sy-row{display:grid;grid-template-columns:1.25fr 1fr;gap:10px}' +
    '.sy-row>div{display:grid;gap:8px;min-width:0}' +
    '.sy-choice{display:flex;gap:10px;align-items:center;padding:11px 12px;border:1px solid var(--line,rgba(28,22,19,.14));' +
      'border-radius:2px;cursor:pointer;font-size:.95rem}' +
    '.sy-choice input{accent-color:var(--mahogany,#6e3126);margin:0}' +
    '.sy-choice.is-on{border-color:var(--mahogany,#6e3126);background:rgba(110,49,38,.07)}' +
    '.sy-input{font:inherit;font-size:1rem;padding:12px 14px;border:1px solid var(--line,rgba(28,22,19,.14));border-radius:2px;' +
      'background:#fff;color:inherit;width:100%;box-sizing:border-box;min-height:48px}' +
    '.sy-input[aria-invalid="true"]{border-color:#a12a1a}' +
    '.sy-note{margin:0;min-height:2.6em;font-size:.92rem;color:var(--mahogany,#6e3126);font-weight:500}' +
    '.sy-note span{display:block}' +
    '.sy-error{margin:0;font-size:.85rem;color:#a12a1a;min-height:1.1em}' +
    '.sy-actions{display:flex;gap:10px;flex-wrap:wrap}' +
    '.sy-actions .btn{justify-content:center;font:inherit;font-size:.9rem;font-weight:500;padding:12px 20px}' +
    '.sy-actions .btn-primary{flex:1 1 auto}' +
    '.sy-dialog :focus-visible{outline:2px solid var(--mahogany,#6e3126);outline-offset:2px}' +
    'html.sy-locked{overflow:hidden}';

  /* ---------------- helpers ---------------- */
  function safeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode: skip */ } }

  // "KSh 11,500" -> 11500   (null if there is no number)
  function amountOf(price) {
    var m = String(price || '').match(/[\d][\d,]*/);
    return m ? parseInt(m[0].replace(/,/g, ''), 10) : null;
  }
  function ksh(n) { return 'KSh ' + Number(n).toLocaleString('en-KE'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function tomorrowIso() { var d = new Date(); d.setDate(d.getDate() + 1); return isoOf(d); }

  // "2026-11-07" -> "Saturday 7 November" (built by hand so the weekday is
  // always right and never shifted by the visitor's time zone)
  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return '';
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  /* ---------------- the dialog (built the first time it is needed) ---------------- */
  var dlg, form, areaInput, dateInput, dateField, errorEl, dateErrorEl, noteEl, productEl, dateIsNative;
  var current = null;   // the lamp being ordered
  var opener = null;    // the button that opened the dialog

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    dlg = document.createElement('dialog');
    dlg.className = 'sy-dialog';
    dlg.setAttribute('aria-labelledby', 'sy-title');
    dlg.innerHTML =
      '<form class="sy-form" method="dialog" novalidate>' +
        '<h2 class="sy-title" id="sy-title">' + W.title + '</h2>' +
        '<p class="sy-sub" id="sy-product"></p>' +
        '<fieldset class="sy-field"><legend>' + W.zoneLegend + '</legend>' +
          '<label class="sy-choice"><input type="radio" name="zone" value="in" checked> ' + W.zoneIn + '</label>' +
          '<label class="sy-choice"><input type="radio" name="zone" value="out"> ' + W.zoneOut + '</label>' +
        '</fieldset>' +
        '<div class="sy-field"><label class="sy-lab" for="sy-area">' + W.areaLabel + '</label>' +
          '<input class="sy-input" id="sy-area" name="area" type="text" maxlength="80" autocomplete="address-level2" ' +
            'aria-describedby="sy-error" placeholder="' + W.areaPlaceholder + '">' +
          '<p class="sy-error" id="sy-error" role="alert"></p></div>' +
        '<div class="sy-field" id="sy-date-field">' +
          '<div class="sy-row">' +
            '<div><label class="sy-lab" for="sy-date">' + W.dateLabel + '</label>' +
              '<input class="sy-input" id="sy-date" name="date" type="date" aria-describedby="sy-date-error"></div>' +
            '<div><label class="sy-lab" for="sy-time">' + W.timeLabel + '</label>' +
              '<select class="sy-input" id="sy-time" name="time">' +
                '<option value="">' + W.timeAny + '</option>' +
                '<option value="morning">' + W.timeMorning + '</option>' +
                '<option value="afternoon">' + W.timeAfternoon + '</option>' +
              '</select></div>' +
          '</div>' +
          '<p class="sy-error" id="sy-date-error" role="alert"></p></div>' +
        '<div class="sy-field"><label class="sy-lab" for="sy-pay">' + W.payLabel + '</label>' +
          '<select class="sy-input" id="sy-pay" name="pay">' +
            '<option value="full">' + W.payFull + '</option>' +
            '<option value="deposit">' + W.payDeposit + '</option>' +
          '</select></div>' +
        '<p class="sy-note" id="sy-note" aria-live="polite"></p>' +
        '<div class="sy-actions">' +
          '<button type="submit" class="btn btn-primary">' + W.submit + '</button>' +
          '<button type="button" class="btn btn-outline" data-close>' + W.cancel + '</button>' +
        '</div>' +
      '</form>';
    document.body.appendChild(dlg);

    form = dlg.querySelector('form');
    areaInput = dlg.querySelector('#sy-area');
    dateInput = dlg.querySelector('#sy-date');
    dateField = dlg.querySelector('#sy-date-field');
    errorEl = dlg.querySelector('#sy-error');
    dateErrorEl = dlg.querySelector('#sy-date-error');
    noteEl = dlg.querySelector('#sy-note');
    productEl = dlg.querySelector('#sy-product');

    // A browser without a date picker turns the field into plain text:
    // let people type the day instead.
    dateIsNative = dateInput.type === 'date';
    if (dateIsNative) {
      dateInput.min = tomorrowIso();
    } else {
      dateInput.placeholder = W.datePlaceholder;
      dateInput.maxLength = 40;
    }

    form.addEventListener('change', refresh);
    // an error goes away as soon as the person fixes the field
    areaInput.addEventListener('input', function () { errorEl.textContent = ''; areaInput.removeAttribute('aria-invalid'); });
    ['input', 'change'].forEach(function (ev) {
      dateInput.addEventListener(ev, function () { dateErrorEl.textContent = ''; dateInput.removeAttribute('aria-invalid'); });
    });
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });

    // Close on a click on the dim background, but not when a text selection
    // that started inside the dialog happens to end outside it.
    var downOnBackdrop = false;
    dlg.addEventListener('pointerdown', function (e) { downOnBackdrop = (e.target === dlg); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg && downOnBackdrop) dlg.close(); });

    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('sy-locked');
      if (opener && typeof opener.focus === 'function') opener.focus();
    });

    form.addEventListener('submit', onSubmit);
  }

  function zone() { return form.elements.zone.value; }
  function paysDeposit() { return form.elements.pay.value === 'deposit'; }

  // Keeps the highlighted choice, the date field and the note under the form
  // in step with the answers. Outside Nairobi there is no date to pick: we
  // send the earliest date together with the delivery quote.
  function refresh() {
    Array.prototype.forEach.call(form.querySelectorAll('.sy-choice'), function (l) {
      l.classList.toggle('is-on', l.querySelector('input').checked);
    });
    dateField.hidden = zone() !== 'in';

    var lines = [zone() === 'in' ? W.noteIn : W.noteOut];
    var total = current && amountOf(current.price);
    if (paysDeposit() && total) {
      var dep = Math.round(total * DEPOSIT_PERCENT / 100);
      lines.push(W.noteDeposit(ksh(dep), ksh(total - dep)));
    }
    noteEl.innerHTML = '';
    lines.forEach(function (t) {
      var s = document.createElement('span');
      s.textContent = t;
      noteEl.appendChild(s);
    });
  }

  function openWhatsApp(url) {
    // A real link click (not window.open with "noopener", which always
    // returns null and would also navigate this page): opens WhatsApp in a
    // new tab, or the app on a phone, and leaves the product page where it is.
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function fail(input, errEl, text) {
    errEl.textContent = text;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }

  function onSubmit(e) {
    e.preventDefault();
    errorEl.textContent = '';
    dateErrorEl.textContent = '';
    areaInput.removeAttribute('aria-invalid');
    dateInput.removeAttribute('aria-invalid');

    var inside = zone() === 'in';
    var area = areaInput.value.trim().replace(/\s+/g, ' ');
    if (area.length < 2) return fail(areaInput, errorEl, W.areaError);

    // delivery day and time of day (Nairobi orders only)
    var when = '';
    if (inside) {
      var raw = dateInput.value.trim();
      if (!raw) return fail(dateInput, dateErrorEl, W.dateError);
      var day = raw;
      if (dateIsNative) {
        if (raw < tomorrowIso()) return fail(dateInput, dateErrorEl, W.dateOldError);
        day = longDate(raw);
      }
      var time = form.elements.time.value;
      when = day + (time ? ', ' + time : '');
    }

    var deposit = paysDeposit();
    var total = amountOf(current.price);
    var dep = total ? Math.round(total * DEPOSIT_PERCENT / 100) : 0;
    var place = inside && !/nairobi/i.test(area) ? area + ', ' + FREE_DELIVERY_AREA : area;

    // remember the answers for the next order on this phone or computer
    safeSet('syimi-order-area', area);
    safeSet('syimi-order-zone', inside ? 'in' : 'out');
    safeSet('syimi-order-pay', deposit ? 'deposit' : 'full');

    var text = W.message({
      name: current.name.replace(/\s*[—–]\s*/g, ' '),   // "Haven — Beige" -> "Haven Beige"
      price: current.price,
      total: total,
      place: place,
      inside: inside,
      when: when,
      deposit: deposit,
      depositAmount: total ? ksh(dep) : '',
      balanceAmount: total ? ksh(total - dep) : ''
    });
    var url = 'https://wa.me/' + current.phone + '?text=' + encodeURIComponent(text);
    dlg.close();
    openWhatsApp(url);
  }

  /* ---------------- take over the order button ---------------- */
  function productInfo(btn) {
    var scope = btn.closest('main, article, .product, section') || document;
    var name = btn.getAttribute('data-product');
    if (!name) {
      var h1 = scope.querySelector('h1') || document.querySelector('h1');
      name = h1 ? h1.textContent : '';
    }
    // data-price is kept current by js/prices.js. Otherwise read the price on
    // the page, preferring the discounted one (".price-now") over a crossed-out one.
    var price = btn.getAttribute('data-price');
    if (!price) {
      var el = scope.querySelector('.price-now, [data-price], .price, .product-price');
      var m = el && el.textContent.match(/KSh\s?[\d,]+/i);
      price = m ? m[0] : '';
    }
    var link = btn.getAttribute('href') || '';
    var phone = (link.match(/wa\.me\/(\d+)/) || [])[1] || FALLBACK_PHONE;
    return { name: (name || '').replace(/\s+/g, ' ').trim(), price: (price || '').trim(), phone: phone };
  }

  // Capture phase, so this runs before any other click handler on the button.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // keep "open in new tab" working
    var btn = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"], [data-whatsapp-order]');
    if (!btn) return;

    var marked = btn.hasAttribute('data-whatsapp-order');
    var isOrderButton = marked || /order/i.test(btn.textContent);
    var onProductPage = marked || location.pathname.indexOf('/products/') !== -1;
    var disabled = btn.getAttribute('aria-disabled') === 'true' || btn.hasAttribute('disabled') || btn.classList.contains('is-sold');
    if (!isOrderButton || !onProductPage || disabled) return;

    var info = productInfo(btn);
    if (!info.name) return; // cannot build a message, so let the normal link run

    e.preventDefault();
    e.stopPropagation();
    if (!dlg) build();
    current = info;
    opener = btn;

    productEl.textContent = info.name + (info.price ? ', ' + info.price : '');
    errorEl.textContent = '';
    dateErrorEl.textContent = '';
    areaInput.removeAttribute('aria-invalid');
    dateInput.removeAttribute('aria-invalid');
    dateInput.value = '';                       // the day is chosen fresh for each order
    form.elements.time.value = '';
    if (dateIsNative) dateInput.min = tomorrowIso();

    // earlier answers on this device
    var savedArea = safeGet('syimi-order-area');
    var savedZone = safeGet('syimi-order-zone');
    var savedPay = safeGet('syimi-order-pay');
    areaInput.value = savedArea || '';
    form.elements.zone.value = savedZone === 'out' ? 'out' : 'in';
    form.elements.pay.value = savedPay === 'deposit' ? 'deposit' : 'full';

    refresh();
    document.documentElement.classList.add('sy-locked');
    dlg.showModal();
    areaInput.focus();
    if (areaInput.value) areaInput.select();
  }, true);
})();
