document.addEventListener('partialsLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
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
      if (nav) nav.classList.remove('open');
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

    const hero = document.querySelector('main .hero');
    if (hero) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveHash('');
          });
        },
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
      );
      heroObserver.observe(hero);
    }
  } else {
    navLinks.forEach((link) => {
      const url = new URL(link.href);
      if (url.pathname === currentPath && !url.hash) {
        link.classList.add('active');
      }
    });
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
