(function () {
  const items = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  if (!items.length || !lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-image');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  function open(item) {
    const img = item.querySelector('img');

    if (img) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.hidden = false;
    } else {
      lightboxImg.hidden = true;
    }

    lightbox.classList.add('open');
  }

  function close() {
    lightbox.classList.remove('open');
  }

  items.forEach((item) => item.addEventListener('click', () => open(item)));
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
})();
