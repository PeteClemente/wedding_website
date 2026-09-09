document.addEventListener('partialsLoaded', () => {
  const canvas = document.getElementById('chase-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const movesEl = document.getElementById('chase-moves');
  const winEl = document.getElementById('chase-win');
  const restartBtn = document.getElementById('chase-restart');
  const dpad = document.querySelector('.chase-dpad');
  const confettiEl = document.getElementById('chase-confetti');

  function spawnConfetti() {
    if (!confettiEl) return;
    const colors = ['#c9a15a', '#7c8b6f', '#c98a8a', '#5f6d54'];
    const fallDistance = confettiEl.clientHeight + 60;
    for (let i = 0; i < 28; i++) {
      const heart = document.createElement('span');
      heart.className = 'confetti-heart';
      heart.style.left = Math.random() * 96 + '%';
      heart.style.setProperty('--heart-color', colors[i % colors.length]);
      heart.style.setProperty('--fall-distance', fallDistance + 'px');
      heart.style.animationDuration = 1.4 + Math.random() * 1.2 + 's';
      heart.style.animationDelay = Math.random() * 0.5 + 's';
      heart.addEventListener('animationend', () => heart.remove());
      confettiEl.appendChild(heart);
    }
  }

  function clearConfetti() {
    if (confettiEl) confettiEl.innerHTML = '';
  }

  const MAZE = [
    '#########',
    '#S..#...#',
    '#.#.#.#.#',
    '#.#...#.#',
    '#.###.#.#',
    '#.....#B#',
    '#########',
  ];

  const rows = MAZE.length;
  const cols = MAZE[0].length;
  const CELL = 80;
  const SPRITE_SIZE = 32;
  const PIXEL = 2;
  const SPRITE_PX = SPRITE_SIZE * PIXEL;
  const SPRITE_PAD = (CELL - SPRITE_PX) / 2;

  canvas.width = cols * CELL;
  canvas.height = rows * CELL;

  let start = { row: 0, col: 0 };
  let goal = { row: 0, col: 0 };
  MAZE.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      if (line[col] === 'S') start = { row, col };
      if (line[col] === 'B') goal = { row, col };
    }
  });

  let player = { ...start };
  let moves = 0;
  let won = false;

  const style = getComputedStyle(document.documentElement);
  const wallColor = style.getPropertyValue('--color-sage-deep').trim() || '#4a5640';
  const wallShadow = style.getPropertyValue('--color-primary-dark').trim() || '#5f6d54';
  const pathA = style.getPropertyValue('--color-bg').trim() || '#faf7f2';
  const pathB = style.getPropertyValue('--color-blush').trim() || '#ecdfd6';
  const blushColor = pathB;

  // 32x32 pixel-art sprites, composed from layered rectangles. 0 = transparent.
  const PALETTE = {
    skin: '#e8b98a',
    skinShade: '#d3a172',
    groomHair: '#2b2620',
    groomSuit: '#232228',
    lapel: '#33323a',
    shirt: '#f5f0e6',
    tie: '#5f6d54',
    shoe: '#181619',
    eye: '#231f1c',
    brideHair: '#3a2a1e',
    veil: blushColor,
    veilShade: '#ddc9bb',
    dress: '#f7f2ea',
    dressShade: '#e7ddce',
    sash: '#c9a15a',
    bouquet: '#7c8b6f',
  };

  function buildSprite(regions) {
    const grid = Array.from({ length: SPRITE_SIZE }, () => new Array(SPRITE_SIZE).fill(0));
    regions.forEach(([x0, y0, x1, y1, color]) => {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) grid[y][x] = color;
      }
    });
    return grid;
  }

  const GROOM = buildSprite([
    [10, 1, 22, 7, 'groomHair'],
    [8, 4, 10, 14, 'groomHair'],
    [22, 4, 24, 14, 'groomHair'],
    [10, 6, 22, 16, 'skin'],
    [10, 14, 22, 16, 'skinShade'],
    [13, 10, 15, 12, 'eye'],
    [17, 10, 19, 12, 'eye'],
    [13, 16, 19, 18, 'skin'],
    [9, 18, 23, 20, 'shirt'],
    [14, 18, 18, 27, 'tie'],
    [8, 20, 24, 30, 'groomSuit'],
    [8, 20, 11, 26, 'lapel'],
    [21, 20, 24, 26, 'lapel'],
    [5, 21, 8, 29, 'groomSuit'],
    [24, 21, 27, 29, 'groomSuit'],
    [4, 27, 7, 30, 'skin'],
    [25, 27, 28, 30, 'skin'],
    [10, 30, 15, 32, 'shoe'],
    [17, 30, 22, 32, 'shoe'],
  ]);

  const BRIDE = buildSprite([
    [9, 0, 23, 6, 'veil'],
    [6, 5, 9, 20, 'veilShade'],
    [23, 5, 26, 20, 'veilShade'],
    [11, 6, 21, 16, 'skin'],
    [11, 14, 21, 16, 'skinShade'],
    [13, 10, 15, 12, 'eye'],
    [17, 10, 19, 12, 'eye'],
    [10, 4, 12, 14, 'brideHair'],
    [20, 4, 22, 14, 'brideHair'],
    [13, 16, 19, 18, 'skin'],
    [10, 18, 22, 21, 'dress'],
    [12, 21, 20, 23, 'sash'],
    [9, 23, 23, 26, 'dress'],
    [7, 26, 25, 29, 'dress'],
    [7, 29, 25, 32, 'dressShade'],
    [4, 24, 7, 28, 'bouquet'],
    [3, 25, 5, 27, 'sash'],
  ]);

  function drawSprite(sprite, originX, originY) {
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        const key = sprite[r][c];
        if (!key) continue;
        ctx.fillStyle = PALETTE[key];
        ctx.fillRect(originX + c * PIXEL, originY + r * PIXEL, PIXEL, PIXEL);
      }
    }
  }

  function isWall(row, col) {
    if (row < 0 || row >= rows || col < 0 || col >= MAZE[row].length) return true;
    return MAZE[row][col] === '#';
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < MAZE[row].length; col++) {
        const x = col * CELL;
        const y = row * CELL;
        if (MAZE[row][col] === '#') {
          ctx.fillStyle = wallColor;
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = wallShadow;
          ctx.fillRect(x, y + CELL - 6, CELL, 6);
        } else {
          ctx.fillStyle = (row + col) % 2 === 0 ? pathA : pathB;
          ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }
    drawSprite(BRIDE, goal.col * CELL + SPRITE_PAD, goal.row * CELL + SPRITE_PAD);
    drawSprite(GROOM, player.col * CELL + SPRITE_PAD, player.row * CELL + SPRITE_PAD);
  }

  function tryMove(dRow, dCol) {
    if (won) return;
    const target = { row: player.row + dRow, col: player.col + dCol };
    if (isWall(target.row, target.col)) return;
    player = target;
    moves++;
    movesEl.textContent = String(moves);
    draw();
    if (player.row === goal.row && player.col === goal.col) {
      won = true;
      winEl.hidden = false;
      spawnConfetti();
    }
  }

  const DIR = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };

  window.addEventListener('keydown', (event) => {
    const map = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    };
    const dir = map[event.key];
    if (!dir) return;
    event.preventDefault();
    tryMove(...DIR[dir]);
  });

  if (dpad) {
    dpad.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('click', () => tryMove(...DIR[btn.dataset.dir]));
    });
  }

  restartBtn.addEventListener('click', () => {
    player = { ...start };
    moves = 0;
    won = false;
    movesEl.textContent = '0';
    winEl.hidden = true;
    clearConfetti();
    draw();
  });

  draw();
});
