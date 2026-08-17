(function () {
  const board = document.getElementById('game-board');
  if (!board) return;

  const symbols = ['💍', '💐', '🥂', '👰', '🤵', '🎂', '🕊️', '💒'];
  const movesEl = document.getElementById('game-moves');
  const timeEl = document.getElementById('game-time');
  const winEl = document.getElementById('game-win');
  const restartBtn = document.getElementById('game-restart');

  let flipped = [];
  let matched = 0;
  let moves = 0;
  let seconds = 0;
  let timer = null;
  let locked = false;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startTimer() {
    clearInterval(timer);
    seconds = 0;
    timeEl.textContent = '0';
    timer = setInterval(() => {
      seconds++;
      timeEl.textContent = seconds;
    }, 1000);
  }

  function flipCard(card) {
    if (locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flipped.push(card);

    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = moves;
      locked = true;
      const [a, b] = flipped;

      if (a.dataset.symbol === b.dataset.symbol) {
        a.classList.add('matched');
        b.classList.add('matched');
        matched += 2;
        flipped = [];
        locked = false;

        if (matched === symbols.length * 2) {
          clearInterval(timer);
          winEl.hidden = false;
        }
      } else {
        setTimeout(() => {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          flipped = [];
          locked = false;
        }, 800);
      }
    }
  }

  function render() {
    board.innerHTML = '';
    shuffle([...symbols, ...symbols]).forEach((symbol) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-card';
      card.dataset.symbol = symbol;
      card.setAttribute('aria-label', 'Hidden card');
      card.innerHTML =
        '<span class="game-card-inner">' +
        '<span class="game-card-back"></span>' +
        '<span class="game-card-front">' + symbol + '</span>' +
        '</span>';
      card.addEventListener('click', () => flipCard(card));
      board.appendChild(card);
    });
  }

  function newGame() {
    flipped = [];
    matched = 0;
    moves = 0;
    locked = false;
    movesEl.textContent = '0';
    winEl.hidden = true;
    render();
    startTimer();
  }

  restartBtn.addEventListener('click', newGame);
  newGame();
})();
