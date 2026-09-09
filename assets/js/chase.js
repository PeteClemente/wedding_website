document.addEventListener('partialsLoaded', () => {
  const canvas = document.getElementById('chase-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const movesEl = document.getElementById('chase-moves');
  const winEl = document.getElementById('chase-win');
  const restartBtn = document.getElementById('chase-restart');
  const dpad = document.querySelector('.chase-dpad');

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
  const CELL = 48;
  const PIXEL = CELL / 8;

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
  const pathColor = style.getPropertyValue('--color-bg-alt').trim() || '#fff';
  const blushColor = style.getPropertyValue('--color-blush').trim() || '#ecdfd6';

  // 8x8 pixel-art sprites. 0 = transparent.
  const PALETTE = {
    skin: '#e8b98a',
    groomHair: '#2b2620',
    groomSuit: '#232228',
    shirt: '#f5f0e6',
    tie: '#5f6d54',
    brideHair: '#3a2a1e',
    veil: blushColor,
    dress: '#f7f2ea',
    sash: '#c9a15a',
  };

  const GROOM = [
    [0, 0, 'groomHair', 'groomHair', 'groomHair', 'groomHair', 0, 0],
    [0, 'groomHair', 'skin', 'skin', 'skin', 'skin', 'groomHair', 0],
    [0, 'groomHair', 'skin', 'skin', 'skin', 'skin', 'groomHair', 0],
    [0, 0, 'shirt', 'tie', 'tie', 'shirt', 0, 0],
    [0, 0, 'groomSuit', 'groomSuit', 'groomSuit', 'groomSuit', 0, 0],
    [0, 'groomSuit', 'groomSuit', 'groomSuit', 'groomSuit', 'groomSuit', 'groomSuit', 0],
    [0, 'groomSuit', 0, 0, 0, 0, 'groomSuit', 0],
    [0, 'groomSuit', 0, 0, 0, 0, 'groomSuit', 0],
  ];

  const BRIDE = [
    [0, 0, 'veil', 'veil', 'veil', 'veil', 0, 0],
    [0, 'veil', 'skin', 'skin', 'skin', 'skin', 'veil', 0],
    [0, 'brideHair', 'skin', 'skin', 'skin', 'skin', 'brideHair', 0],
    [0, 0, 'dress', 'dress', 'dress', 'dress', 0, 0],
    [0, 'dress', 'dress', 'sash', 'sash', 'dress', 'dress', 0],
    [0, 'dress', 'dress', 'dress', 'dress', 'dress', 'dress', 0],
    [0, 'dress', 'dress', 0, 0, 'dress', 'dress', 0],
    [0, 'dress', 0, 0, 0, 0, 'dress', 0],
  ];

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
        ctx.fillStyle = MAZE[row][col] === '#' ? wallColor : pathColor;
        ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
      }
    }
    drawSprite(BRIDE, goal.col * CELL + PIXEL, goal.row * CELL);
    drawSprite(GROOM, player.col * CELL + PIXEL, player.row * CELL);
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
    draw();
  });

  draw();
});
