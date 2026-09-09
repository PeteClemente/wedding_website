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
  const VIEWPORT_ROWS = 7;

  canvas.width = cols * CELL;
  canvas.height = VIEWPORT_ROWS * CELL;
  const worldHeight = rows * CELL;
  const maxCamY = Math.max(0, worldHeight - canvas.height);
  let camY = 0;

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
    mouth: '#b97b57',
    cheek: '#e3a9a0',
    groomHair: '#2b2620',
    groomSuit: '#232228',
    lapel: '#33323a',
    shirt: '#f5f0e6',
    tie: '#5f6d54',
    shoe: '#181619',
    eye: '#231f1c',
    brideHair: '#e8c579',
    brideHairShade: '#cda758',
    veil: blushColor,
    veilShade: '#ddc9bb',
    dress: '#f7f2ea',
    dressShade: '#e7ddce',
    sash: '#c9a15a',
    bouquet: '#7c8b6f',
    guestHairA: '#3a2a1e',
    guestHairB: '#5c4a38',
    guestHairC: '#7a5c3e',
    guestHairD: '#9a958c',
  };

  const GUEST_OUTFITS = ['#8a5a5a', '#5f6d54', '#4a5a7a', '#7a5f8a'];
  const GUEST_HAIRS = ['guestHairA', 'guestHairB', 'guestHairC', 'guestHairD'];
  const GUEST_W = 20;
  const GUEST_H = 26;

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
    [12, 0, 20, 1, 'groomHair'],
    [9, 1, 23, 2, 'groomHair'],
    [8, 2, 24, 6, 'groomHair'],
    [8, 6, 10, 14, 'groomHair'],
    [22, 6, 24, 14, 'groomHair'],
    [10, 6, 22, 17, 'skin'],
    [10, 15, 22, 17, 'skinShade'],
    [12, 9, 15, 10, 'groomHair'],
    [17, 9, 20, 10, 'groomHair'],
    [13, 11, 15, 13, 'eye'],
    [17, 11, 19, 13, 'eye'],
    [14, 15, 18, 16, 'mouth'],
    [13, 17, 19, 19, 'skin'],
    [9, 19, 23, 21, 'shirt'],
    [14, 19, 18, 28, 'tie'],
    [8, 21, 24, 30, 'groomSuit'],
    [8, 21, 12, 26, 'lapel'],
    [20, 21, 24, 26, 'lapel'],
    [9, 24, 11, 26, 'sash'],
    [5, 22, 8, 29, 'groomSuit'],
    [24, 22, 27, 29, 'groomSuit'],
    [4, 27, 7, 30, 'skin'],
    [25, 27, 28, 30, 'skin'],
    [10, 30, 15, 32, 'shoe'],
    [17, 30, 22, 32, 'shoe'],
  ]);

  const BRIDE = buildGrid(32, 32, [
    [10, 0, 22, 1, 'veil'],
    [8, 1, 24, 3, 'veil'],
    [7, 3, 25, 7, 'veil'],
    [6, 7, 9, 21, 'veilShade'],
    [23, 7, 26, 21, 'veilShade'],
    [11, 4, 21, 6, 'brideHair'],
    [9, 5, 11, 15, 'brideHair'],
    [21, 5, 23, 15, 'brideHair'],
    [11, 6, 21, 17, 'skin'],
    [11, 15, 21, 17, 'skinShade'],
    [13, 9, 15, 10, 'brideHairShade'],
    [17, 9, 19, 10, 'brideHairShade'],
    [13, 11, 15, 13, 'eye'],
    [17, 11, 19, 13, 'eye'],
    [12, 13, 14, 14, 'cheek'],
    [20, 13, 22, 14, 'cheek'],
    [14, 15, 18, 16, 'mouth'],
    [13, 17, 19, 19, 'skin'],
    [10, 19, 22, 22, 'dress'],
    [12, 22, 20, 24, 'sash'],
    [9, 24, 23, 27, 'dress'],
    [7, 27, 25, 30, 'dress'],
    [7, 30, 25, 32, 'dressShade'],
    [4, 25, 7, 29, 'bouquet'],
    [3, 26, 5, 28, 'sash'],
  ]);

  function buildGuestSuit(hair, suit) {
    return buildGrid(GUEST_W, GUEST_H, [
      [6, 0, 14, 3, hair],
      [5, 3, 7, 9, hair],
      [13, 3, 15, 9, hair],
      [7, 3, 13, 11, 'skin'],
      [8, 6, 9, 7, 'eye'],
      [11, 6, 12, 7, 'eye'],
      [8, 11, 12, 13, 'skin'],
      [6, 13, 14, 15, 'shirt'],
      [9, 15, 11, 21, 'tie'],
      [5, 15, 15, 26, suit],
      [3, 16, 5, 23, suit],
      [15, 16, 17, 23, suit],
      [2, 21, 4, 24, 'skin'],
      [16, 21, 18, 24, 'skin'],
    ]);
  }

  function buildGuestDress(hair, dress) {
    return buildGrid(GUEST_W, GUEST_H, [
      [6, 0, 14, 3, hair],
      [5, 3, 7, 9, hair],
      [13, 3, 15, 9, hair],
      [7, 3, 13, 11, 'skin'],
      [8, 6, 9, 7, 'eye'],
      [11, 6, 12, 7, 'eye'],
      [8, 11, 12, 13, 'skin'],
      [6, 13, 14, 16, dress],
      [8, 16, 12, 17, 'sash'],
      [4, 16, 16, 22, dress],
      [3, 22, 17, 26, dress],
    ]);
  }

  const GUEST_SPRITES = GUEST_OUTFITS.map((outfit, i) => {
    const hair = GUEST_HAIRS[i % GUEST_HAIRS.length];
    return i % 2 === 0 ? buildGuestSuit(hair, outfit) : buildGuestDress(hair, outfit);
  });

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

  function updateCamera() {
    const target = Math.max(0, Math.min(player.y - canvas.height / 2, maxCamY));
    camY += (target - camY) * 0.14;
    if (Math.abs(target - camY) < 0.5) camY = target;
  }

  function draw() {
    const cam = Math.round(camY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const firstRow = Math.max(0, Math.floor(cam / CELL) - 1);
    const lastRow = Math.min(rows - 1, Math.ceil((cam + canvas.height) / CELL));
    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = 0; col < MAZE[row].length; col++) {
        const x = col * CELL;
        const y = row * CELL - cam;
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

    drawGrid(BRIDE, goal.col * CELL + (CELL - SPRITE_PX) / 2, goal.row * CELL + (CELL - SPRITE_PX) / 2 - cam, PIXEL);

    obstacles.forEach((o) => {
      const gw = GUEST_W * 2;
      const gh = GUEST_H * 2;
      drawGrid(o.sprite, o.x + (o.w - gw) / 2, o.y + (o.h - gh) / 2 - 6 - cam, 2);
    });

    const flashing = Date.now() < invulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0;
    if (!flashing) {
      drawGrid(GROOM, player.x - SPRITE_PX / 2, player.y - SPRITE_PX + 10 - cam, PIXEL);
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

    updateCamera();
    draw();
    requestAnimationFrame(loop);
  }

  restartBtn.addEventListener('click', () => {
    resetPlayer(start);
    camY = Math.max(0, Math.min(player.y - canvas.height / 2, maxCamY));
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
