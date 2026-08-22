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

  document.querySelectorAll('.site-nav a').forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });

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
