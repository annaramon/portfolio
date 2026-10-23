// ==========================================================================
// Anna Ramon Hinojosa — Portfolio Interactions
// Nav/reveal/scroll behavior started from script.js; the story-stack
// polaroid effect below is specific to this page.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll reveal ----
  const reveals = document.querySelectorAll('.reveal');

  if (prefersReducedMotion) {
    reveals.forEach(el => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
          const index = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = `${index * 0.1}s`;
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  }

  // ---- Throttle utility ----
  function throttle(fn, wait) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  }

  // ---- Nav scroll ----
  const nav = document.getElementById('nav');

  const handleNavScroll = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, 100);

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ---- Mobile menu ----
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
  });

  // ---- Smooth scroll for nav links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Active nav link highlighting (throttled, class-based) ----
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = throttle(() => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }, 100);

  window.addEventListener('scroll', highlightNav, { passive: true });

  // ---- Story: nine polaroids slide up from below and stack, one per ----
  // ---- equal segment of this section's scroll range, each paired     ----
  // ---- with a caption that crossfades in sync, and a title card      ----
  // ---- ("Anna Ramon Hinojosa") that dissolves as photo 1 arrives     ----
  (function storyStack() {
    const zone = document.querySelector('.story-zone');
    const photos = Array.from(document.querySelectorAll('.polaroid'));
    const captionContainer = document.getElementById('storyCaption');
    const storyMark = document.getElementById('storyMark');
    if (!zone || !photos.length) return;

    const N = photos.length;
    const ENTER_VH = 0.8; // how far below the resting spot each photo starts

    // Captions come from texts.js (text1..text9 as plain globals, one per
    // photo in order) — nothing is hardcoded here. Built once, at startup,
    // by reading window.textN for N = 1..photos.length.
    const captions = [];
    if (captionContainer) {
      for (let i = 0; i < N; i++) {
        const text = window[`text${i + 1}`];
        if (typeof text !== 'string') {
          console.warn(`texts.js is missing "text${i + 1}" — caption ${i + 1} will be blank.`);
        }
        const p = document.createElement('p');
        p.className = 'story-caption-item';
        p.dataset.index = String(i);
        p.textContent = text || '';
        captionContainer.appendChild(p);
        captions.push(p);
      }
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function render(progress) {
      const enterPx = window.innerHeight * ENTER_VH;
      const g = progress * N;
      const locals = photos.map((_, i) => Math.max(0, Math.min(1, g - i)));

      photos.forEach((el, i) => {
        const eased = easeOutCubic(locals[i]);
        const ox = parseFloat(el.dataset.ox) || 0;
        const oy = parseFloat(el.dataset.oy) || 0;
        const rot = parseFloat(el.dataset.rot) || 0;
        const y = oy + (1 - eased) * enterPx;
        el.style.transform = `translate(${ox}px, ${y}px) rotate(${rot}deg)`;
        el.style.zIndex = String(i + 1);
      });

      // Captions swap sequentially, never blended: the previous caption
      // fades fully to 0 over the first half of the new photo's arrival,
      // then the new caption fades in over the second half. No two
      // captions are ever simultaneously legible, so the text never
      // overlaps itself mid-transition.
      const currentIndex = Math.max(0, Math.min(N - 1, Math.floor(g)));
      const frac = Math.max(0, Math.min(1, g - currentIndex));
      const outPhase = Math.min(1, frac / 0.5);
      const inPhase = Math.max(0, Math.min(1, (frac - 0.5) / 0.5));

      captions.forEach((el, i) => {
        let opacity = 0;
        if (i === currentIndex) opacity = inPhase;
        else if (i === currentIndex - 1) opacity = 1 - outPhase;
        el.style.opacity = String(opacity);
      });

      if (storyMark) {
        storyMark.style.opacity = String(1 - easeOutCubic(locals[0]));
      }
    }

    if (prefersReducedMotion) {
      render(1); // all nine already stacked at rest, no scroll-jacked motion
      return;
    }

    let progress = 0;
    function updateProgress() {
      const rect = zone.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      progress = scrollable <= 0 ? 0 : Math.max(0, Math.min(1, -rect.top / scrollable));
    }

    window.addEventListener('scroll', () => {
      updateProgress();
      render(progress);
    }, { passive: true });
    window.addEventListener('resize', () => render(progress), { passive: true });

    updateProgress();
    render(progress);
  })();

  // ---- One-at-a-time horizontal carousel: pins a zone on screen and    ----
  // ---- slides the current item out left as the next slides in from    ----
  // ---- the right, driven by scroll progress through the pinned zone.  ----
  // ---- Shared by Experience and Events & Talks — same mechanic, just  ----
  // ---- different selectors and item counts.                          ----
  function initSlideCarousel(zoneSelector, itemsSelector) {
    const zone = document.querySelector(zoneSelector);
    const items = Array.from(document.querySelectorAll(itemsSelector));
    if (!zone || !items.length || prefersReducedMotion) return; // CSS handles the reduced-motion fallback

    const N = items.length;
    const T = 0.35; // fraction of one item's slot spent sliding; the rest is a resting plateau

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function render(progress) {
      // g spans 0..N-1 (not 0..N) so the last item finishes entering and
      // simply rests at the end of the pin zone, instead of sliding itself
      // back out with nothing behind it.
      const g = progress * (N - 1);
      items.forEach((el, i) => {
        const d = g - i;
        let tx;
        if (d <= 0) {
          const enterT = Math.max(0, Math.min(1, (d + T) / T));
          tx = 100 * (1 - easeInOutCubic(enterT));
        } else {
          const exitT = Math.max(0, Math.min(1, (d - (1 - T)) / T));
          tx = -100 * easeInOutCubic(exitT);
        }
        el.style.transform = `translateX(${tx}%)`;
      });
    }

    let progress = 0;
    function updateProgress() {
      const rect = zone.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      progress = scrollable <= 0 ? 0 : Math.max(0, Math.min(1, -rect.top / scrollable));
    }

    window.addEventListener('scroll', () => {
      updateProgress();
      render(progress);
    }, { passive: true });
    window.addEventListener('resize', () => render(progress), { passive: true });

    updateProgress();
    render(progress);
  }

  initSlideCarousel('.experience-zone', '.experience-stage .timeline-item');
  initSlideCarousel('.recognition-zone', '.recognition-stage .event-row');
});
