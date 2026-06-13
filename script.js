(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  const header = document.querySelector('.header');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero-video');
  const heroVideo = document.querySelector('.hero-bg-video');
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const contactForm = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeOutQuart = (value) => 1 - Math.pow(1 - value, 4);

  const setMenu = (isOpen) => {
    if (!menuBtn || !nav) return;
    menuBtn.classList.toggle('active', isOpen);
    nav.classList.toggle('active', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  };

  if (menuBtn && nav) {
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('active')));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  let smoothScrollFrame = null;

  const stopSmoothScroll = () => {
    if (!smoothScrollFrame) return;
    cancelAnimationFrame(smoothScrollFrame);
    smoothScrollFrame = null;
    document.documentElement.style.scrollBehavior = '';
  };

  const getTargetTop = (target) => {
    const headerOffset = header ? header.offsetHeight + 18 : 0;
    return Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerOffset);
  };

  const smoothScrollTo = (targetTop) => {
    stopSmoothScroll();

    if (prefersReducedMotion.matches) {
      window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });
      return;
    }

    const startTop = window.pageYOffset;
    const distance = targetTop - startTop;
    const duration = clamp(Math.abs(distance) * 0.62, 520, 1250);
    let startTime = null;

    document.documentElement.style.scrollBehavior = 'auto';

    const step = (time) => {
      if (!startTime) startTime = time;
      const progress = clamp((time - startTime) / duration, 0, 1);
      const nextTop = startTop + distance * easeOutQuart(progress);

      window.scrollTo(0, nextTop);

      if (progress < 1) {
        smoothScrollFrame = requestAnimationFrame(step);
      } else {
        smoothScrollFrame = null;
        document.documentElement.style.scrollBehavior = '';
      }
    };

    smoothScrollFrame = requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      setMenu(false);
      smoothScrollTo(getTargetTop(target));

      if (window.history.pushState) {
        window.history.pushState(null, '', hash);
      }
    });
  });

  ['wheel', 'touchstart'].forEach((eventName) => {
    window.addEventListener(eventName, stopSmoothScroll, { passive: true });
  });

  if (prefersReducedMotion.matches) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('visible');
        observer.unobserve(entry.target);

        window.setTimeout(() => {
          entry.target.style.setProperty('--reveal-delay', '0ms');
        }, 1100);
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    });

    revealItems.forEach((item) => {
      const siblings = Array.from(item.parentElement?.children || []).filter((child) => child.classList?.contains('reveal'));
      const itemIndex = Math.max(0, siblings.indexOf(item));
      const delay = Math.min((itemIndex % 5) * 80, 320);

      item.style.setProperty('--reveal-delay', `${delay}ms`);
      revealObserver.observe(item);
    });
  }

  const sectionById = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));

  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => link.classList.remove('active'));
        sectionById.get(entry.target.id)?.classList.add('active');
      });
    }, {
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0,
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  let scrollTicking = false;

  const updateScrollEffects = () => {
    const scrollTop = window.pageYOffset;

    header?.classList.toggle('scrolled', scrollTop > 24);

    if (hero && heroVideo && !prefersReducedMotion.matches) {
      const progress = clamp(scrollTop / Math.max(hero.offsetHeight, 1), 0, 1);
      const scale = 1 + progress * 0.035;
      const offset = progress * 28;

      heroVideo.style.transform = `scale(${scale.toFixed(3)}) translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }

    scrollTicking = false;
  };

  const requestScrollEffects = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener('scroll', requestScrollEffects, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMenu(false);
    requestScrollEffects();
  });
  requestScrollEffects();

  if (!prefersReducedMotion.matches && finePointer.matches) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      let tiltFrame = null;
      let nextTransform = '';

      const applyTilt = () => {
        card.style.transform = nextTransform;
        tiltFrame = null;
      };

      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        nextTransform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translate3d(0, -6px, 0)`;

        if (!tiltFrame) tiltFrame = requestAnimationFrame(applyTilt);
      });

      card.addEventListener('pointerleave', () => {
        if (tiltFrame) cancelAnimationFrame(tiltFrame);
        tiltFrame = null;
        card.style.transform = '';
      });
    });
  }

  if (contactForm && formMessage) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      formMessage.textContent = 'Cảm ơn bạn. Print4Life sẽ liên hệ lại trong thời gian sớm nhất.';
      contactForm.reset();
    });
  }
})();
