/* ============================================================
   SYIMI ORDER DIALOG

   When someone taps "Order on WhatsApp" on a product page, a compact
   dialog collects the basics (delivery area, delivery day and time, how
   they want to pay), shows what they pay now and what is free, and then
   opens WhatsApp with the order message ready to send. That way you
   don't need a round of questions before you can confirm an order.
   On a phone it slides up from the bottom; on a laptop it sits in the
   middle of the page.

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
  var DAYS_AHEAD = 21;                 // how many days the delivery day list shows
  var FALLBACK_PHONE = '254726796860'; // only used if the button has no wa.me link

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

  /* ---------------- WORDING — edit the sentences here ---------------- */
  var W = {
    title: 'Delivery and payment',
    close: 'Close',
    zoneLegend: 'Delivery location',
    zoneIn: 'Within ' + FREE_DELIVERY_AREA,
    zoneOut: 'Outside ' + FREE_DELIVERY_AREA,
    areaLabel: 'Area or estate',
    areaPlaceholder: 'For example, Kilimani',
    areaError: 'Enter your area or estate so we can confirm delivery.',
    dayLabel: 'Preferred delivery day',
    dayPlaceholder: 'Choose a day',
    tomorrow: 'Tomorrow',
    dayError: 'Choose the day you would like your lamp delivered.',
    timeLabel: 'Time of day',
    timeAny: 'Any time',
    timeMorning: 'Morning',
    timeAfternoon: 'Afternoon',
    payLegend: 'Payment',
    payFull: 'Pay in full',
    payFullSub: 'by M-Pesa',
    payDeposit: DEPOSIT_PERCENT + '% deposit',
    payDepositSub: 'Balance on delivery',
    sumDeliveryIn: 'Free delivery',
    sumDeliveryOut: 'Delivery quoted before you pay',
    sumPayNow: 'Pay now',
    sumPayNowFull: 'in full',
    sumPayNowDeposit: DEPOSIT_PERCENT + '% deposit',
    sumBalance: 'On delivery',
    submit: 'Continue to WhatsApp',
    reassure: 'Nothing is charged here. We confirm on WhatsApp.',

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
    // the box: centered on a laptop, a sheet from the bottom on a phone
    '.sy-dialog{border:0;padding:0;background:var(--paper,#f1ece1);color:var(--ink,#1c1613);' +
      'width:min(92vw,392px);max-width:none;max-height:min(88vh,620px);overflow:hidden;' +
      'border-radius:2px 18px 2px 18px;font-family:var(--font-body,inherit);box-shadow:0 22px 60px rgba(28,22,19,.4)}' +
    '.sy-dialog[open]{display:flex;flex-direction:column;animation:sy-in .2s ease-out}' +
    '.sy-dialog::backdrop{background:rgba(28,22,19,.55)}' +
    '@keyframes sy-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '@keyframes sy-up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}' +
    '@media (max-width:560px){' +
      '.sy-dialog{width:100%;margin:auto 0 0 0;max-height:90vh;max-height:90dvh;border-radius:18px 18px 0 0}' +
      '.sy-dialog[open]{animation:sy-up .24s ease-out}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){.sy-dialog[open]{animation:none}}' +
    '.sy-form{display:flex;flex-direction:column;min-height:0;flex:1 1 auto;margin:0}' +

    // header: lamp photo, title, lamp name and price, close
    '.sy-head{display:flex;align-items:center;gap:12px;padding:14px 14px 12px 20px;border-bottom:1px solid var(--line,rgba(28,22,19,.14))}' +
    '.sy-thumb{width:40px;height:56px;flex:0 0 auto;object-fit:cover;border-radius:2px 8px 2px 8px;background:var(--paper-dim,#e8dfd0)}' +
    '.sy-head-text{flex:1 1 auto;min-width:0}' +
    '.sy-title{margin:0;font-family:var(--font-display,Georgia,serif);font-size:1.12rem;font-weight:500;line-height:1.2}' +
    '.sy-sub{margin:3px 0 0;font-size:.8rem;color:rgba(28,22,19,.68);line-height:1.3}' +
    '.sy-x{flex:0 0 auto;width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;' +
      'color:var(--ink,#1c1613);cursor:pointer;padding:0}' +
    '.sy-x:hover{background:rgba(28,22,19,.07)}' +
    '.sy-x svg{width:16px;height:16px}' +

    // body (scrolls on a short screen) and the sticky footer
    '.sy-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:14px 20px 14px;display:grid;gap:11px;align-content:start}' +
    '.sy-foot{padding:10px 20px 14px;border-top:1px solid var(--line,rgba(28,22,19,.14));background:var(--paper,#f1ece1);display:grid;gap:8px}' +
    '.sy-foot .btn{width:100%;justify-content:center;font:inherit;font-size:.92rem;font-weight:500;padding:12px 20px}' +
    '.sy-reassure{margin:0;text-align:center;font-size:.72rem;line-height:1.4;color:rgba(28,22,19,.6)}' +

    // fields
    '.sy-field{display:grid;gap:6px;border:0;padding:0;margin:0;min-width:0}' +
    '.sy-field[hidden]{display:none}' +
    '.sy-lab,.sy-legend{font-size:.78rem;font-weight:600;padding:0;color:rgba(28,22,19,.78)}' +
    '.sy-visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
    '.sy-input{font:inherit;font-size:.9rem;padding:0 12px;border:1px solid var(--line,rgba(28,22,19,.14));border-radius:2px;' +
      'background:#fff;color:inherit;width:100%;box-sizing:border-box;height:40px}' +
    '.sy-input::placeholder{color:rgba(28,22,19,.45)}' +
    '.sy-input[aria-invalid="true"]{border-color:#a12a1a}' +
    'select.sy-input{padding-right:8px}' +
    '.sy-row{display:grid;grid-template-columns:1.5fr 1fr;gap:8px}' +
    '.sy-row>div{display:grid;gap:6px;min-width:0}' +
    '.sy-error{margin:0;font-size:.76rem;color:#a12a1a;line-height:1.3}' +
    '.sy-error:empty{display:none}' +

    // the two-choice cards (location, payment)
    '.sy-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.sy-opt{position:relative;display:flex;align-items:center;gap:9px;padding:8px 11px;min-height:40px;box-sizing:border-box;' +
      'border:1px solid var(--line,rgba(28,22,19,.14));border-radius:2px;background:#fff;cursor:pointer;font-size:.84rem;line-height:1.25}' +
    '.sy-opt input{position:absolute;opacity:0;pointer-events:none}' +
    '.sy-dot{flex:0 0 auto;width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(28,22,19,.35);box-sizing:border-box;background:#fff}' +
    '.sy-opt.is-on{border-color:var(--mahogany,#6e3126);background:rgba(110,49,38,.06)}' +
    '.sy-opt.is-on .sy-dot{border-color:var(--mahogany,#6e3126);background:radial-gradient(circle,var(--mahogany,#6e3126) 0 38%,#fff 42%)}' +
    '.sy-opt:focus-within{outline:2px solid var(--mahogany,#6e3126);outline-offset:2px}' +
    '.sy-opt-text{display:grid;gap:1px;min-width:0}' +
    '.sy-opt-text strong{font-weight:600}' +
    '.sy-opt-text small{font-size:.72rem;color:rgba(28,22,19,.62)}' +

    // what you pay: one short line of facts
    '.sy-sum{background:var(--paper-dim,#e8dfd0);border-radius:2px 12px 2px 12px;padding:9px 13px;margin:0;' +
      'display:flex;flex-wrap:wrap;gap:3px 16px;font-size:.8rem;line-height:1.35;color:rgba(28,22,19,.72)}' +
    '.sy-sum span{white-space:nowrap}' +
    '.sy-sum span b{font-weight:600;color:var(--ink,#1c1613)}' +
    '.sy-sum .is-free b{color:var(--mahogany,#6e3126)}' +
    '.sy-sum .is-pay b{color:var(--mahogany,#6e3126);font-size:.92rem}' +

    '.sy-dialog :focus-visible{outline:2px solid var(--mahogany,#6e3126);outline-offset:2px}' +
    // phones that zoom the page when a field smaller than 16px is tapped (iPhone)
    '@supports (-webkit-touch-callout:none){.sy-input{font-size:16px}}' +
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
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  // "Saturday 7 November" (built by hand so the weekday is always right)
  function longDate(d) {
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  /* ---------------- the dialog (built the first time it is needed) ---------------- */
  var dlg, form, areaInput, dayInput, dayField, errorEl, dayErrorEl, sumEl, thumbEl, titleSubEl;
  var current = null;   // the lamp being ordered
  var opener = null;    // the button that opened the dialog

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    dlg = document.createElement('dialog');
    dlg.className = 'sy-dialog';
    dlg.tabIndex = -1;
    dlg.setAttribute('aria-labelledby', 'sy-title');
    dlg.innerHTML =
      '<form class="sy-form" method="dialog" novalidate>' +
        '<div class="sy-head">' +
          '<img class="sy-thumb" alt="" hidden>' +
          '<div class="sy-head-text"><h2 class="sy-title" id="sy-title">' + W.title + '</h2><p class="sy-sub" id="sy-product"></p></div>' +
          '<button type="button" class="sy-x" data-close aria-label="' + W.close + '">' +
            '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="sy-body">' +
          '<fieldset class="sy-field"><legend class="sy-visually-hidden">' + W.zoneLegend + '</legend>' +
            '<div class="sy-opts">' +
              '<label class="sy-opt"><input type="radio" name="zone" value="in" checked><span class="sy-dot"></span><span class="sy-opt-text"><strong>' + W.zoneIn + '</strong></span></label>' +
              '<label class="sy-opt"><input type="radio" name="zone" value="out"><span class="sy-dot"></span><span class="sy-opt-text"><strong>' + W.zoneOut + '</strong></span></label>' +
            '</div></fieldset>' +
          '<div class="sy-field"><label class="sy-lab" for="sy-area">' + W.areaLabel + '</label>' +
            '<input class="sy-input" id="sy-area" name="area" type="text" maxlength="80" autocomplete="address-level2" ' +
              'aria-describedby="sy-error" placeholder="' + W.areaPlaceholder + '">' +
            '<p class="sy-error" id="sy-error" role="alert"></p></div>' +
          '<div class="sy-field" id="sy-day-field">' +
            '<div class="sy-row">' +
              '<div><label class="sy-lab" for="sy-day">' + W.dayLabel + '</label>' +
                '<select class="sy-input" id="sy-day" name="day" aria-describedby="sy-day-error"></select></div>' +
              '<div><label class="sy-lab" for="sy-time">' + W.timeLabel + '</label>' +
                '<select class="sy-input" id="sy-time" name="time">' +
                  '<option value="">' + W.timeAny + '</option>' +
                  '<option value="morning">' + W.timeMorning + '</option>' +
                  '<option value="afternoon">' + W.timeAfternoon + '</option>' +
                '</select></div>' +
            '</div>' +
            '<p class="sy-error" id="sy-day-error" role="alert"></p></div>' +
          '<fieldset class="sy-field"><legend class="sy-legend">' + W.payLegend + '</legend>' +
            '<div class="sy-opts">' +
              '<label class="sy-opt"><input type="radio" name="pay" value="full" checked><span class="sy-dot"></span><span class="sy-opt-text"><strong>' + W.payFull + '</strong><small>' + W.payFullSub + '</small></span></label>' +
              '<label class="sy-opt"><input type="radio" name="pay" value="deposit"><span class="sy-dot"></span><span class="sy-opt-text"><strong>' + W.payDeposit + '</strong><small>' + W.payDepositSub + '</small></span></label>' +
            '</div></fieldset>' +
          '<p class="sy-sum" id="sy-sum" aria-live="polite"></p>' +
        '</div>' +
        '<div class="sy-foot">' +
          '<button type="submit" class="btn btn-primary">' + W.submit + '</button>' +
          '<p class="sy-reassure">' + W.reassure + '</p>' +
        '</div>' +
      '</form>';
    document.body.appendChild(dlg);

    form = dlg.querySelector('form');
    areaInput = dlg.querySelector('#sy-area');
    dayInput = dlg.querySelector('#sy-day');
    dayField = dlg.querySelector('#sy-day-field');
    errorEl = dlg.querySelector('#sy-error');
    dayErrorEl = dlg.querySelector('#sy-day-error');
    sumEl = dlg.querySelector('#sy-sum');
    thumbEl = dlg.querySelector('.sy-thumb');
    titleSubEl = dlg.querySelector('#sy-product');

    form.addEventListener('change', refresh);
    // an error goes away as soon as the person fixes the field
    areaInput.addEventListener('input', function () { errorEl.textContent = ''; areaInput.removeAttribute('aria-invalid'); });
    dayInput.addEventListener('change', function () { dayErrorEl.textContent = ''; dayInput.removeAttribute('aria-invalid'); });
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

  // The next few days, starting tomorrow.
  function fillDays() {
    var html = '<option value="">' + W.dayPlaceholder + '</option>';
    var d = new Date();
    for (var i = 1; i <= DAYS_AHEAD; i++) {
      var n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      var label = longDate(n);
      var short = DAYS[n.getDay()].slice(0, 3) + ' ' + n.getDate() + ' ' + MONTHS[n.getMonth()].slice(0, 3);
      html += '<option value="' + esc(label) + '">' + (i === 1 ? W.tomorrow + ', ' : '') + esc(short) + '</option>';
    }
    dayInput.innerHTML = html;
  }

  function zone() { return form.elements.zone.value; }
  function paysDeposit() { return form.elements.pay.value === 'deposit'; }

  // Keeps the highlighted cards, the day field and the "what you pay" box
  // in step with the answers. Outside Nairobi there is no day to pick: we
  // send the earliest date together with the delivery quote.
  function refresh() {
    Array.prototype.forEach.call(form.querySelectorAll('.sy-opt'), function (l) {
      l.classList.toggle('is-on', l.querySelector('input').checked);
    });
    dayField.hidden = zone() !== 'in';

    var inside = zone() === 'in';
    var total = current && amountOf(current.price);
    var dep = total ? Math.round(total * DEPOSIT_PERCENT / 100) : 0;
    var rows = '<span class="' + (inside ? 'is-free' : '') + '"><b>' + (inside ? W.sumDeliveryIn : W.sumDeliveryOut) + '</b></span>';
    if (paysDeposit()) {
      rows += '<span class="is-pay">' + W.sumPayNow + ' <b>' + (total ? ksh(dep) : W.sumPayNowDeposit) + '</b></span>';
      if (total) rows += '<span>' + W.sumBalance + ' <b>' + ksh(total - dep) + '</b></span>';
    } else {
      rows += '<span class="is-pay">' + W.sumPayNow + ' <b>' + (total ? ksh(total) : '') + '</b>' + (total ? '' : W.sumPayNowFull) + '</span>';
    }
    sumEl.innerHTML = rows;
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
    dayErrorEl.textContent = '';
    areaInput.removeAttribute('aria-invalid');
    dayInput.removeAttribute('aria-invalid');

    var inside = zone() === 'in';
    var area = areaInput.value.trim().replace(/\s+/g, ' ');
    if (area.length < 2) return fail(areaInput, errorEl, W.areaError);

    // delivery day and time of day (Nairobi orders only)
    var when = '';
    if (inside) {
      var day = dayInput.value;
      if (!day) return fail(dayInput, dayErrorEl, W.dayError);
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
    var img = document.querySelector('.main-photo img, .product-detail img');
    return {
      name: (name || '').replace(/\s+/g, ' ').trim(),
      price: (price || '').trim(),
      phone: phone,
      photo: img ? (img.currentSrc || img.src) : ''
    };
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

    titleSubEl.textContent = info.name + (info.price ? ' · ' + info.price : '');
    if (info.photo) { thumbEl.src = info.photo; thumbEl.hidden = false; } else { thumbEl.hidden = true; }
    errorEl.textContent = '';
    dayErrorEl.textContent = '';
    areaInput.removeAttribute('aria-invalid');
    dayInput.removeAttribute('aria-invalid');
    fillDays();                                  // the day is chosen fresh for each order
    form.elements.time.value = '';

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
    // On a laptop, start typing the area straight away. On a phone, don't pop
    // the keyboard over the sheet before the person has seen it.
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      areaInput.focus();
      if (areaInput.value) areaInput.select();
    } else {
      dlg.focus();
    }
  }, true);
})();
