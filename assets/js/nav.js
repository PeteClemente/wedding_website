document.addEventListener('partialsLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const navLinksWrap = document.querySelector('.site-nav-links');

  if (toggle && navLinksWrap) {
    toggle.addEventListener('click', () => {
      navLinksWrap.classList.toggle('open');
    });
  }

  const currentPath = window.location.pathname.endsWith('/')
    ? '/index.html'
    : window.location.pathname;

  const navLinks = Array.from(document.querySelectorAll('.site-nav a'));

  function setActiveHash(hash) {
    navLinks.forEach((link) => {
      const url = new URL(link.href);
      const isMatch = url.pathname === currentPath && url.hash === hash;
      link.classList.toggle('active', isMatch);
    });
  }

  // Close the mobile menu after picking a section.
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navLinksWrap) navLinksWrap.classList.remove('open');
    });
  });

  // Smooth-scroll to top instead of reloading when already on the home page.
  document.querySelectorAll('a[href="/index.html"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (currentPath === '/index.html') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.pushState(null, '', '/index.html');
        setActiveHash('');
      }
    });
  });

  const sections = document.querySelectorAll('main section[id]');
  if (sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash('#' + entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  } else {
    navLinks.forEach((link) => {
      const url = new URL(link.href);
      if (url.pathname === currentPath && !url.hash) {
        link.classList.add('active');
      }
    });
  }

  // On the home page, the header floats transparently over the full-bleed
  // hero photo and turns solid once you scroll past it.
  if (document.body.classList.contains('has-hero-photo')) {
    const header = document.querySelector('.site-header');
    const hero = document.querySelector('main .hero--photo');
    if (header && hero) {
      const threshold = () => Math.max(hero.offsetHeight - 90, 100);

      function updateHeaderState() {
        header.classList.toggle('site-header--overlay', window.scrollY < threshold());
      }

      updateHeaderState();
      window.addEventListener('scroll', updateHeaderState, { passive: true });
      window.addEventListener('resize', updateHeaderState);
    }
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
      }, 1500);

      if (clicks >= 5) {
        clicks = 0;
        window.location.href = '/game.html';
      }
    });
  }
});
