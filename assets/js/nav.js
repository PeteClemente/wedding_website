document.addEventListener('partialsLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const navLinksWrap = document.querySelector('.site-nav-links');
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('main .hero--photo');
  const hasHeroOverlay = document.body.classList.contains('has-hero-photo') && header && hero;

  function updateHeaderState() {
    if (!hasHeroOverlay) return;
    const threshold = Math.max(hero.offsetHeight - 90, 100);
    header.classList.toggle('site-header--overlay', window.scrollY < threshold);
  }

  if (toggle && navLinksWrap) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinksWrap.classList.toggle('open');
      if (hasHeroOverlay) {
        // Keep the dropdown on a solid background instead of showing it
        // transparently over the hero photo.
        if (isOpen) {
          header.classList.remove('site-header--overlay');
        } else {
          updateHeaderState();
        }
      }
    });
  }

  const currentPath = window.location.pathname.endsWith('/')
    ? '/index.html'
    : window.location.pathname;

  const navLinks = Array.from(document.querySelectorAll('.site-nav a'));

  navLinks.forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });

  // Close the mobile menu after picking a page.
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navLinksWrap) navLinksWrap.classList.remove('open');
      updateHeaderState();
    });
  });

  // Smooth-scroll to top instead of reloading when already on the home page.
  document.querySelectorAll('a[href="/index.html"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (currentPath === '/index.html') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Footer "Return to Top" button, present on every page.
  document.querySelectorAll('.back-to-top').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // On the home page, the header floats transparently over the full-bleed
  // hero photo and turns solid once you scroll past it.
  if (hasHeroOverlay) {
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    window.addEventListener('resize', updateHeaderState);
  }

  // Hidden easter egg: click the "&" in the logo 5 times to find the game.
  const amp = document.getElementById('brand-amp');
  if (amp) {
    let clicks = 0;
    let resetTimer = null;

    amp.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      clicks++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        clicks = 0;
      }, 2500);

      if (clicks >= 5) {
        clicks = 0;
        window.location.href = '/game.html';
      }
    });
  }
});
