/* ============================================================
   SYIMI HOME PAGE SLIDER

   Fades slowly between the photos in the hero, by itself. Photos live
   in images/hero/ and are listed in index.html (one <div class="hero-slide">
   per photo). To add, swap or remove a photo, edit its slide there.

   - Moves on every few seconds (change DELAY below).
   - Stops only while the tab is in the background or the slider is
     scrolled out of view, so nothing runs when nobody can see it.
   - Without JavaScript the first photo simply shows.
   ============================================================ */
(function () {
  'use strict';

  var DELAY = 5000; // milliseconds each photo stays up

  var root = document.querySelector('[data-hero-slider]');
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
  if (slides.length < 2) return;

  var index = 0;
  var timer = null;
  var offscreen = false;

  // The other photos load quietly once the page is ready.
  window.addEventListener('load', function () {
    slides.forEach(function (s) {
      var img = s.querySelector('img');
      if (img) img.loading = 'eager';
    });
  });

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) {
      s.classList.toggle('is-active', n === index);
      s.setAttribute('aria-hidden', n === index ? 'false' : 'true');
    });
  }

  function restart() {
    if (timer) { clearInterval(timer); timer = null; }
    if (!offscreen && !document.hidden) {
      timer = setInterval(function () { show(index + 1); }, DELAY);
    }
  }

  document.addEventListener('visibilitychange', restart);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      offscreen = !entries[0].isIntersecting;
      restart();
    }, { threshold: 0.2 }).observe(root);
  }

  show(0);
  restart();
})();
