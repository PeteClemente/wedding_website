document.addEventListener('partialsLoaded', () => {
  const canvas = document.getElementById('chase-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const timeEl = document.getElementById('chase-time');
  const bumpsEl = document.getElementById('chase-bumps');
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

  // Garden hedge maze, then a row of open "lawn" leading into three
  // Frogger-style crossing lanes, then the altar.
  const MAZE = [
    '#########',
    '#S..#...#',
    '#.#.#.#.#',
    '#.#...#.#',
    '#.###.#.#',
    '#.......#',
    '#.......#',
    '#.......#', // lane 1
    '#.......#', // lane 2
    '#.......#', // lane 3
    '#...B...#',
    '#########',
  ];
  const LANE_ROWS = [7, 8, 9];
  const CHECKPOINT = { row: 6, col: 4 };

  const rows = MAZE.length;
  const cols = MAZE[0].length;
  const CELL = 80;
  const SPRITE_SIZE = 32;
  const PIXEL = 2;
  const SPRITE_PX = SPRITE_SIZE * PIXEL;

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

  const style = getComputedStyle(document.documentElement);
  const wallColor = style.getPropertyValue('--color-sage-deep').trim() || '#4a5640';
  const wallShadow = style.getPropertyValue('--color-primary-dark').trim() || '#5f6d54';
  const pathA = style.getPropertyValue('--color-bg').trim() || '#faf7f2';
  const pathB = style.getPropertyValue('--color-blush').trim() || '#ecdfd6';
  const laneTint = 'rgba(201, 161, 90, 0.14)';
  const blushColor = pathB;

  // Pixel-art sprites, composed from layered rectangles. 0 = transparent.
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
    guestHairA: '#3a2a1e',
    guestHairB: '#5c4a38',
  };

  const GUEST_OUTFITS = ['#8a5a5a', '#5f6d54', '#4a5a7a', '#7a5f8a'];

  function buildGrid(width, height, regions) {
    const grid = Array.from({ length: height }, () => new Array(width).fill(0));
    regions.forEach(([x0, y0, x1, y1, color]) => {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) grid[y][x] = color;
      }
    });
    return grid;
  }

  const GROOM = buildGrid(32, 32, [
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

  const BRIDE = buildGrid(32, 32, [
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

  function buildGuest(outfit, hair) {
    return buildGrid(16, 20, [
      [4, 0, 12, 3, hair],
      [4, 3, 12, 9, 'skin'],
      [6, 5, 7, 6, 'eye'],
      [9, 5, 10, 6, 'eye'],
      [5, 9, 11, 11, 'skin'],
      [3, 11, 13, 20, outfit],
    ]);
  }

  const GUEST_SPRITES = GUEST_OUTFITS.map((outfit, i) =>
    buildGuest(outfit, i % 2 === 0 ? 'guestHairA' : 'guestHairB')
  );

  function drawGrid(grid, originX, originY, pixel) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const key = grid[r][c];
        if (!key) continue;
        ctx.fillStyle = PALETTE[key];
        ctx.fillRect(originX + c * pixel, originY + r * pixel, pixel, pixel);
      }
    }
  }

  function isWall(row, col) {
    if (row < 0 || row >= rows || col < 0 || col >= MAZE[row].length) return true;
    return MAZE[row][col] === '#';
  }

  function collides(x, y, w, h) {
    const colStart = Math.floor(x / CELL);
    const colEnd = Math.floor((x + w - 1) / CELL);
    const rowStart = Math.floor(y / CELL);
    const rowEnd = Math.floor((y + h - 1) / CELL);
    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        if (isWall(row, col)) return true;
      }
    }
    return false;
  }

  // Player state: x/y is the feet-center anchor point.
  const HITBOX_W = 42;
  const HITBOX_H = 40;
  const cellCenter = (cell) => cell * CELL + CELL / 2;

  let player = { x: 0, y: 0 };
  let won = false;
  let elapsed = 0;
  let bumps = 0;
  let lastShownSecond = -1;
  let invulnerableUntil = 0;

  function resetPlayer(cell) {
    player.x = cellCenter(cell.col);
    player.y = cellCenter(cell.row) + CELL * 0.3;
  }

  function playerHitbox(x, y) {
    return { x: x - HITBOX_W / 2, y: y - HITBOX_H, w: HITBOX_W, h: HITBOX_H };
  }

  // Obstacles: wandering guests sliding back and forth across each lane.
  const laneLeft = CELL + 4;
  const laneRight = (cols - 1) * CELL - 4;

  function makeObstacles() {
    const list = [];
    LANE_ROWS.forEach((row, laneIndex) => {
      const dir = laneIndex % 2 === 0 ? 1 : -1;
      const speed = 90 + laneIndex * 30;
      const count = 2;
      for (let i = 0; i < count; i++) {
        list.push({
          row,
          w: 28,
          h: 34,
          x: laneLeft + ((laneRight - laneLeft) / count) * i,
          y: row * CELL + CELL / 2 - 17,
          vx: dir * speed,
          sprite: GUEST_SPRITES[(laneIndex + i) % GUEST_SPRITES.length],
        });
      }
    });
    return list;
  }

  let obstacles = makeObstacles();

  function updateObstacles(dt) {
    obstacles.forEach((o) => {
      o.x += o.vx * dt;
      if (o.vx > 0 && o.x > laneRight) o.x = laneLeft - o.w;
      if (o.vx < 0 && o.x + o.w < laneLeft) o.x = laneRight;
    });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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
          if (LANE_ROWS.includes(row)) {
            ctx.fillStyle = laneTint;
            ctx.fillRect(x, y, CELL, CELL);
          }
        }
      }
    }

    drawGrid(BRIDE, goal.col * CELL + (CELL - SPRITE_PX) / 2, goal.row * CELL + (CELL - SPRITE_PX) / 2, PIXEL);

    obstacles.forEach((o) => {
      const gw = 16 * 2;
      const gh = 20 * 2;
      drawGrid(o.sprite, o.x + (o.w - gw) / 2, o.y + (o.h - gh) / 2 - 6, 2);
    });

    const flashing = Date.now() < invulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0;
    if (!flashing) {
      drawGrid(GROOM, player.x - SPRITE_PX / 2, player.y - SPRITE_PX + 10, PIXEL);
    }
  }

  function setTime(t) {
    const shown = Math.floor(t);
    if (shown !== lastShownSecond) {
      lastShownSecond = shown;
      timeEl.textContent = String(shown);
    }
  }

  const keysDown = new Set();
  const KEY_MAP = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  };

  window.addEventListener('keydown', (event) => {
    const dir = KEY_MAP[event.key];
    if (!dir) return;
    event.preventDefault();
    keysDown.add(dir);
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEY_MAP[event.key];
    if (!dir) return;
    keysDown.delete(dir);
  });

  if (dpad) {
    dpad.querySelectorAll('[data-dir]').forEach((btn) => {
      const dir = btn.dataset.dir;
      const press = (e) => { e.preventDefault(); keysDown.add(dir); };
      const release = () => keysDown.delete(dir);
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    });
  }

  const SPEED = 230; // px/sec

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (keysDown.has('left')) dx -= 1;
    if (keysDown.has('right')) dx += 1;
    if (keysDown.has('up')) dy -= 1;
    if (keysDown.has('down')) dy += 1;
    if (dx === 0 && dy === 0) return;
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    const step = SPEED * dt;
    const nextX = player.x + dx * step;
    const hbX = playerHitbox(nextX, player.y);
    if (!collides(hbX.x, hbX.y, hbX.w, hbX.h)) player.x = nextX;

    const nextY = player.y + dy * step;
    const hbY = playerHitbox(player.x, nextY);
    if (!collides(hbY.x, hbY.y, hbY.w, hbY.h)) player.y = nextY;
  }

  function checkObstacleHits() {
    if (Date.now() < invulnerableUntil) return;
    const hb = playerHitbox(player.x, player.y);
    const hit = obstacles.some((o) => rectsOverlap(hb, o));
    if (hit) {
      bumps++;
      bumpsEl.textContent = String(bumps);
      resetPlayer(CHECKPOINT);
      invulnerableUntil = Date.now() + 900;
    }
  }

  function checkWin() {
    const hb = playerHitbox(player.x, player.y);
    const goalRect = { x: goal.col * CELL + 12, y: goal.row * CELL + 12, w: CELL - 24, h: CELL - 24 };
    if (rectsOverlap(hb, goalRect)) {
      won = true;
      winEl.hidden = false;
      spawnConfetti();
    }
  }

  let lastTs = null;
  function loop(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    updateObstacles(dt);

    if (!won) {
      updatePlayer(dt);
      checkObstacleHits();
      checkWin();
      elapsed += dt;
      setTime(elapsed);
    }

    draw();
    requestAnimationFrame(loop);
  }

  restartBtn.addEventListener('click', () => {
    resetPlayer(start);
    won = false;
    elapsed = 0;
    bumps = 0;
    lastShownSecond = -1;
    invulnerableUntil = 0;
    timeEl.textContent = '0';
    bumpsEl.textContent = '0';
    winEl.hidden = true;
    clearConfetti();
    obstacles = makeObstacles();
    draw();
  });

  resetPlayer(start);
  draw();
  requestAnimationFrame(loop);
});
