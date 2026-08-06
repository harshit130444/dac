/* ==========================================================================
   DAC — landing page behaviour
   Replaces what the old React bundle did. Plain JavaScript, no build step.

   Sections, in order:
     1. sticky nav + scroll progress bar
     2. mobile menu
     3. reveal on scroll
     4. counting numbers
     5. hero typewriter
     6. stacked-section scroll effect
     7. hero cursor glow

   Numbers and links come from window.DAC_CONFIG (assets/js/config.js),
   so edit them there, not here.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. STICKY NAV + SCROLL PROGRESS
     The nav gets a border and background once you scroll past the hero top,
     and the thin bar underneath fills as you move down the page.
     --------------------------------------------------------------------- */
  var nav      = document.querySelector('[data-nav]');
  var progress = document.querySelector('[data-progress]');

  function onScroll() {
    var y   = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) nav.classList.toggle('is-stuck', y > 8);
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    updateStack();
  }

  /* ---------------------------------------------------------------------
     2. MOBILE MENU
     One button toggles the slide-in panel. Escape and any link close it.
     --------------------------------------------------------------------- */
  var menu       = document.querySelector('[data-menu]');
  var menuToggle = document.querySelector('[data-menu-toggle]');

  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }

  if (menuToggle) menuToggle.addEventListener('click', function () {
    setMenu(!menu.classList.contains('is-open'));
  });
  if (menu) menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------------------------------------------------------------------
     3. REVEAL ON SCROLL
     Everything marked data-reveal fades in once, the first time it is seen.
     Siblings inside the same data-reveal-group are staggered.
     --------------------------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach(function (el) {
      // stagger: each child of a group waits a little longer than the last
      var group = el.closest('[data-reveal-group]');
      if (group) {
        var peers = Array.prototype.slice.call(group.querySelectorAll('[data-reveal]'));
        el.style.transitionDelay = Math.min(peers.indexOf(el) * 60, 320) + 'ms';
      }
      revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     4. COUNTING NUMBERS
     <span data-count="members"> counts up to DAC_CONFIG.members when it
     first scrolls into view. Change the value in config.js.
     --------------------------------------------------------------------- */
  var config   = window.DAC_CONFIG || {};
  var counters = document.querySelectorAll('[data-count]');

  function countUp(el) {
    var target = Number(config[el.dataset.count] || el.dataset.countTo || 0);
    if (reduceMotion) { el.textContent = target; return; }

    var duration = 1400;
    var started  = null;

    (function step(now) {
      if (started === null) started = now;
      var t = Math.min((now - started) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);               // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------------------------------------------------------------------
     5. HERO TYPEWRITER
     Types the headline out one character at a time, then holds. The whole
     sentence also sits in a .sr-only span so it is never hidden from
     screen readers or search engines.
     --------------------------------------------------------------------- */
  var typer = document.querySelector('[data-typewriter]');

  if (typer) {
    var full  = typer.dataset.typewriter;
    var lead  = Number(typer.dataset.typewriterLead || 0);  // chars shown in full ink
    var out   = typer.querySelector('[data-typewriter-out]');
    var caret = typer.querySelector('.dac-caret');

    if (reduceMotion) {
      out.innerHTML = '<span class="text-ink">' + full.slice(0, lead) + '</span>' +
                      '<span class="text-ink-muted">' + full.slice(lead) + '</span>';
      if (caret) caret.remove();
    } else {
      var i = 0;
      (function type() {
        i++;
        out.innerHTML = '<span class="text-ink">' + full.slice(0, Math.min(i, lead)) + '</span>' +
                        '<span class="text-ink-muted">' + (i > lead ? full.slice(lead, i) : '') + '</span>';
        if (i < full.length) setTimeout(type, 45 + Math.random() * 55);
      })();
    }
  }

  /* ---------------------------------------------------------------------
     6. STACKED SECTIONS
     Each section[data-stack] sets --stack from 0 to 1 as its top edge
     travels the last 220px up to the top of the viewport. The CSS turns
     that into rounded corners, a shadow and a small lift.
     --------------------------------------------------------------------- */
  var stacked = document.querySelectorAll('section[data-stack]');
  var DISTANCE = 220;

  function updateStack() {
    if (reduceMotion) return;
    stacked.forEach(function (section) {
      var top = section.getBoundingClientRect().top;
      // 1 while far below, easing to 0 as the section reaches the top
      var t = Math.max(0, Math.min(1, top / DISTANCE));
      section.style.setProperty('--stack', String(1 - t));
    });
  }

  /* ---------------------------------------------------------------------
     7. HERO SPEECH BUBBLE
     Plays once, a few seconds after load, then fades away. Its position is
     driven by assets/js/robot.js, which pins it to the robot's head.
     --------------------------------------------------------------------- */
  var bubble = document.querySelector('[data-bubble]');

  if (bubble) {
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(10px) scale(.82)';
    bubble.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)';

    setTimeout(function () {
      bubble.style.opacity = '1';
      bubble.style.transform = 'none';
      setTimeout(function () {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(6px) scale(.92)';
      }, 6000);
    }, 3000);
  }

  /* ---------------------------------------------------------------------
     8. COOKIE BAR
     Remembers the choice in localStorage under "dac-cookie-consent", the
     same key every other page uses, so answering once covers the site.
     --------------------------------------------------------------------- */
  var cookieBar = document.querySelector('[data-cookie]');
  var COOKIE_KEY = 'dac-cookie-consent';

  if (cookieBar) {
    var stored = null;
    try { stored = localStorage.getItem(COOKIE_KEY); } catch (e) {}

    if (stored) {
      cookieBar.remove();
    } else {
      cookieBar.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var choice = /decline/i.test(btn.textContent) ? 'declined' : 'accepted';
          try { localStorage.setItem(COOKIE_KEY, choice); } catch (e) {}
          cookieBar.remove();
        });
      });
    }
  }

  /* ---------------------------------------------------------------------
     9. FILE:// WARNING
     robot.js is an ES module, and browsers refuse to load modules from a
     file:// URL. Opening index.html by double-clicking therefore shows the
     hero with no robot. This lives here, not in robot.js, because robot.js
     is the file that fails to load.
     --------------------------------------------------------------------- */
  if (location.protocol === 'file:') {
    console.warn(
      '[DAC] The 3D robot is hidden because this page was opened directly from a file.\n' +
      'Browsers block ES modules on file:// URLs. To preview locally, run:\n' +
      '    python -m http.server\n' +
      'in this folder, then open http://localhost:8000\n' +
      'This does not affect the live site.'
    );
  }

  /* --------------------------------------------------------------------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateStack);
  onScroll();
})();
