// ==========================================================================
// Anna Ramon Hinojosa — Portfolio Interactions
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

  // ---- Counter animation ----
  const counters = document.querySelectorAll('.impact-number[data-target]');

  if (prefersReducedMotion) {
    counters.forEach(el => {
      el.textContent = el.getAttribute('data-target');
    });
  } else {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          if (isNaN(target)) return;
          let current = 0;
          const duration = 1800;
          const step = target / (duration / 16);

          const update = () => {
            current += step;
            if (current >= target) {
              el.textContent = target;
            } else {
              el.textContent = Math.floor(current);
              requestAnimationFrame(update);
            }
          };

          requestAnimationFrame(update);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  }

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
});
