/* ============================================================
   Central contact config — edit these two lines and every
   "Enquire on WhatsApp" link/button on the site updates.
   ============================================================ */
const SYIMI_WHATSAPP_NUMBER = "254726796860";
const SYIMI_EMAIL = "syimilightingke@gmail.com";

document.addEventListener('DOMContentLoaded', () => {
  // Wire up WhatsApp links. Buttons with a data-price also get an order-style
  // message (product pages); everything else gets a general inquiry message
  // (homepage CTA, footer, contact page).
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    const productName = el.getAttribute('data-whatsapp') || '';
    const price = el.getAttribute('data-price') || '';
    let msg;
    if (productName && price) {
      msg = `Hi SYIMI, I would like to order 1 piece of this ${productName}, ${price}. Kindly send the final quotation with the delivery cost included and when it can be delivered.`;
    } else if (productName) {
      msg = `Hi SYIMI, I'd like to ask about the ${productName}.`;
    } else {
      msg = `Hi SYIMI, I'd like to ask about your lamps.`;
    }
    el.href = `https://wa.me/${SYIMI_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  });

  document.querySelectorAll('[data-email]').forEach(el => {
    el.href = `mailto:${SYIMI_EMAIL}`;
  });

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Homepage hero: "switch it on" lamp glow toggle
  const lampToggle = document.querySelector('.lamp-toggle');
  const glowWrap = document.querySelector('.hero-photo-glow');
  if (lampToggle && glowWrap) {
    lampToggle.addEventListener('click', () => {
      const isOn = !lampToggle.classList.contains('is-on');
      lampToggle.classList.toggle('is-on', isOn);
      glowWrap.classList.toggle('is-on', isOn);
      lampToggle.setAttribute('aria-pressed', String(isOn));
      const label = lampToggle.querySelector('.lamp-toggle-label');
      if (label) label.textContent = isOn ? 'Switch it off' : 'Switch it on';
    });
  }

  // Sticky mobile order bar: show once the main order button scrolls out of view
  const stickyBar = document.querySelector('.sticky-order-bar');
  const mainOrderBtn = document.querySelector('.product-meta .hero-actions [data-whatsapp]');
  if (stickyBar && mainOrderBtn && 'IntersectionObserver' in window) {
    const ctaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        stickyBar.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    ctaObserver.observe(mainOrderBtn);
  }

  // Contact form: no backend yet, so route to WhatsApp with the message pre-filled
  const form = document.querySelector('form.enquiry');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name')?.value || '';
      const lamp = form.querySelector('#lamp')?.value || '';
      const message = form.querySelector('#message')?.value || '';
      const text = `Hi SYIMI, I'm ${name}. Regarding: ${lamp}. ${message}`;
      window.open(`https://wa.me/${SYIMI_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    });
  }
});

// Haven colour navigation cards (real links between pages) get a hover-consistent
// "selected" state already baked in server-side — nothing to wire up here.

// Thumbnail gallery: click a thumbnail to bring that photo into the main image
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.detail-gallery').forEach(gallery => {
    const mainImg = gallery.querySelector('.main-photo img');
    const thumbs = gallery.querySelectorAll('.thumb-col .thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const thumbImg = thumb.querySelector('img');
        if (mainImg && thumbImg) mainImg.src = thumbImg.src;
        thumbs.forEach(t => t.classList.remove('active-thumb'));
        thumb.classList.add('active-thumb');
      });
    });
  });
});

// Reading progress bar (only present on pages with a .reading-progress element, i.e. the story page)
document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.querySelector('.reading-progress');
  if (progressBar) {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // Scroll-reveal: fade/slide in elements marked .reveal as they enter the viewport
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('revealed'));
    }
  }
});

// Mobile swipe gallery: sync the active dot to whichever photo is scrolled into view
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mobile-gallery').forEach(gallery => {
    const track = gallery.querySelector('.mobile-gallery-track');
    const dots = gallery.querySelectorAll('.dot');
    if (!track || !dots.length) return;
    track.addEventListener('scroll', () => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }, { passive: true });
  });
});
