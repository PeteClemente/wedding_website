(function () {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;

  const weddingDate = new Date('2027-04-04T14:00:00');
  const daysEl = countdownEl.querySelector('[data-days]');
  const hoursEl = countdownEl.querySelector('[data-hours]');
  const minutesEl = countdownEl.querySelector('[data-minutes]');
  const secondsEl = countdownEl.querySelector('[data-seconds]');

  let timer;

  function update() {
    const diff = weddingDate - new Date();

    if (diff <= 0) {
      countdownEl.innerHTML = '<p class="countdown-done">We\'re married! 🎉</p>';
      clearInterval(timer);
      return;
    }

    daysEl.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
    hoursEl.textContent = Math.floor((diff / (1000 * 60 * 60)) % 24);
    minutesEl.textContent = Math.floor((diff / (1000 * 60)) % 60);
    secondsEl.textContent = Math.floor((diff / 1000) % 60);
  }

  update();
  timer = setInterval(update, 1000);
})();
