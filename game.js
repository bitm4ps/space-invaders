(() => {
'use strict';

const W = 240, H = 282;
const cv = document.getElementById('c');
const cx = cv.getContext('2d');

/* ═══════════════════════════════════════════
   AUDIO ENGINE (Web Audio — no external files)
═══════════════════════════════════════════ */
const AC = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq, type, dur, vol = 0.18, decay = true) {
  try {
    const osc = AC.createOscillator();
    const gain = AC.createGain();
    osc.connect(gain); gain.connect(AC.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, AC.currentTime);
    if (decay) gain.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    osc.start(); osc.stop(AC.currentTime + dur);
  } catch(e) {}
}
function sfxShoot()   { beep(880,'square',.08,.12); beep(440,'square',.1,.08); }
function sfxExplode() { beep(120,'sawtooth',.3,.2); beep(60,'square',.25,.15); }
function sfxUFO()     { beep(800+(Math.sin(Date.now()*.01)*400),'sine',.05,.1,false); }

const MARCH_FREQS = [160,130,100,80];
let marchStep = 0;
function sfxMarch() { beep(MARCH_FREQS[marchStep%4],'square',.07,.12); marchStep++; }

/* ═══════════════════════════════════════════
   PIXEL SPRITES  (each cell = 1 logical px)
═══════════════════════════════════════════ */
const S = {
  squid_a: [
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,0,0,1,0,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,0,1,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,0,0,0,1,0,1,0,0,0,0],
  ],
  squid_b: [
    [0,0,0,1,0,0,0,1,0,0,0],
    [1,0,0,0,1,0,1,0,0,0,1],
    [1,0,0,1,1,1,1,1,0,0,1],
    [1,1,1,1,0,1,0,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
  ],
  crab_a: [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,1,0,1,1,0,0,0],
  ],
  crab_b: [
    [0,0,1,0,0,0,0,0,1,0,0],
    [1,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,1,1,0,1,1,1,0,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,1,0],
    [0,0,1,1,0,0,0,1,1,0,0],
  ],
  octopus_a: [
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,0,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,1,0],
  ],
  octopus_b: [
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,0,1,1,1,0,0],
    [0,1,0,0,0,0,0,0,0,1,0],
    [0,0,1,0,0,0,1,0,0,0,0],
  ],
  ufo: [
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,0,1,0,1,1,1,0,1,0,1],
    [0,1,1,1,1,1,1,1,1,1,0],
  ],
  player: [
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
  ],
  explode: [
    [0,1,0,0,1,0,0,1,0],
    [0,0,1,0,0,0,1,0,0],
    [1,0,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,1],
    [0,0,1,0,0,0,1,0,0],
    [0,1,0,0,1,0,0,1,0],
  ],
  bunker: [
    [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1],
  ],
};

/* ═══════════════════════════════════════════
   SPRITE RENDERER
═══════════════════════════════════════════ */
function spr(rows, x, y, color, ps = 1) {
  cx.fillStyle = color;
  rows.forEach((row, ry) => {
    row.forEach((bit, rx) => {
      if (bit) cx.fillRect(x + rx*ps, y + ry*ps, ps, ps);
    });
  });
}

/* ═══════════════════════════════════════════
   STARS  (3 parallax layers)
═══════════════════════════════════════════ */
const STARS = Array.from({length: 80}, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  layer: Math.floor(Math.random() * 3), // 0=far, 1=mid, 2=near
  twinkle: Math.random() * Math.PI * 2,
}));
const STAR_SPEED = [0.1, 0.2, 0.4];
const STAR_SIZE  = [0.8, 1.0, 1.5];
const STAR_ALPHA = [0.3, 0.5, 0.9];

function updateStars() {
  STARS.forEach(s => {
    s.y += STAR_SPEED[s.layer];
    s.twinkle += 0.04;
    if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
  });
}

function drawStars() {
  STARS.forEach(s => {
    const a = STAR_ALPHA[s.layer] * (0.6 + Math.sin(s.twinkle) * 0.4);
    cx.globalAlpha = a;
    cx.fillStyle = '#fff';
    const sz = STAR_SIZE[s.layer];
    cx.fillRect(Math.floor(s.x), Math.floor(s.y), sz, sz);
  });
  cx.globalAlpha = 1;
}

/* ═══════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════ */
const STATE = { MENU:0, GAME:1, PAUSED:2, GAMEOVER:3, LEVELUP:4 };

const DIFFICULTIES = [
  { name:'EASY',   invSpd:0.3, fireRate:0.004, bulletSpd:1.4, scrollSpd:4 },
  { name:'NORMAL', invSpd:0.5, fireRate:0.007, bulletSpd:2.0, scrollSpd:5 },
  { name:'HARD',   invSpd:0.9, fireRate:0.012, bulletSpd:2.8, scrollSpd:6 },
];

let state     = STATE.MENU;
let diffIdx   = 1;
let score     = 0;
let hiScore   = 0;
let lives     = 3;
let level     = 1;
let scrollSpd = 5;  // px per scroll event — adjustable in settings

// ── INVADER GRID ─────────────────────────
const COLS_ = 9, ROWS_ = 4;
const INV_PS = 1;    // pixel size for sprites
const INV_W  = 11;   // sprite width in logical pixels
const INV_H  = 8;
const CELL_W = 22, CELL_H = 20;
const GRID_W = COLS_ * CELL_W;
const GRID_X = (W - GRID_W) / 2;
const GRID_Y = 38;

// Row types & colors
const ROW_TYPES  = ['squid','squid','crab','octopus'];
const ROW_COLORS = ['#00ffff','#00ffff','#00ff66','#ffffff'];
const ROW_PTS    = [10, 10, 20, 30];

let invaders = [];     // {row, col, alive, exploding, explodeTimer}
let gridX = GRID_X;
let gridY = GRID_Y;
let invDir = 1;        // +1=right, -1=left
let invMoveTimer = 0;
let invMoveInterval = 60; // frames between moves
let invFrame = 0;      // animation frame 0/1
let frameToggle = 0;
let invAlive = 0;

// ── PLAYER ───────────────────────────────
const PLAYER_PS = 2;
const PLAYER_W  = 11 * PLAYER_PS;
const PLAYER_H  = 6  * PLAYER_PS;
const PLAYER_Y  = H - 30;
let playerX = W / 2 - PLAYER_W / 2;
let playerExploding = false;
let playerExplodeTimer = 0;
let playerBullets = [];  // [{x, y}]
let autoFireTimer = 0;
const AUTO_FIRE_RATE = 12; // frames between auto shots

// ── INVADER BULLETS ───────────────────────
let invBullets = [];  // [{x, y, speed}]

// ── UFO ──────────────────────────────────
let ufo = null;  // {x, dir, score}
let ufoTimer = 0;

// ── BUNKERS ──────────────────────────────
const BUNKER_PS = 1.5;
const BUNKER_W  = Math.floor(15 * BUNKER_PS);
const BUNKER_H  = Math.floor(8 * BUNKER_PS);
const BUNKER_Y  = H - 54;
const BUNKER_XS = [20, 95, 170];
let bunkers = [];  // pixel grids

// ── MENU ──────────────────────────────────
let menuBlink = 0;
let menuInvX = 0, menuInvDir = 1;
let menuInvFrame = 0, menuInvTimer = 0;

// ── LEVELUP / GAMEOVER ───────────────────
let transTimer = 0;

/* ═══════════════════════════════════════════
   INIT GAME
═══════════════════════════════════════════ */
function initGame() {
  const diff = DIFFICULTIES[diffIdx];
  score = 0;
  lives = 3;
  level = 1;
  scrollSpd = diff.scrollSpd;
  playerX = W / 2 - PLAYER_W / 2;
  playerExploding = false;
  playerBullets = [];
  invBullets = [];
  ufo = null;
  ufoTimer = 0;
  spawnInvaders();
  spawnBunkers();
  state = STATE.GAME;
}

function spawnInvaders() {
  invaders = [];
  for (let r = 0; r < ROWS_; r++) {
    for (let c = 0; c < COLS_; c++) {
      invaders.push({ row: r, col: c, alive: true, exploding: false, explodeTimer: 0 });
    }
  }
  gridX = GRID_X;
  gridY = GRID_Y;
  invDir = 1;
  invAlive = invaders.length;
  invMoveInterval = Math.max(8, 60 - (level - 1) * 8);
  invMoveTimer = 0;
  invFrame = 0;
}

function spawnBunkers() {
  bunkers = BUNKER_XS.map(() =>
    S.bunker.map(row => [...row])
  );
}

/* ═══════════════════════════════════════════
   COLLISION HELPERS
═══════════════════════════════════════════ */
function invaderBounds(inv) {
  return {
    x: gridX + inv.col * CELL_W + (CELL_W - INV_W) / 2,
    y: gridY + inv.row * CELL_H,
    w: INV_W, h: INV_H,
  };
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

/* ═══════════════════════════════════════════
   UPDATE
═══════════════════════════════════════════ */
function update() {
  updateStars();

  if (state === STATE.MENU) {
    menuBlink++;
    menuInvTimer++;
    if (menuInvTimer > 30) { menuInvFrame ^= 1; menuInvTimer = 0; }
    menuInvX += menuInvDir * 0.6;
    if (menuInvX > W - 80 || menuInvX < 10) menuInvDir *= -1;
    return;
  }

  if (state === STATE.PAUSED) return;

  if (state === STATE.LEVELUP) {
    transTimer--;
    if (transTimer <= 0) { level++; spawnInvaders(); spawnBunkers(); state = STATE.GAME; }
    return;
  }

  if (state === STATE.GAMEOVER) {
    transTimer--;
    return;
  }

  const diff = DIFFICULTIES[diffIdx];

  // ── player bullets ─────────────────────
  playerBullets = playerBullets.filter(pb => {
    pb.y -= 6;
    if (pb.y < 0) return false;

    // hit invader?
    for (const inv of invaders) {
      if (!inv.alive || inv.exploding) continue;
      const b = invaderBounds(inv);
      if (rectsOverlap(pb.x-1, pb.y-4, 2, 8, b.x, b.y, b.w, b.h)) {
        inv.alive = false; inv.exploding = true; inv.explodeTimer = 18;
        invAlive--;
        score += ROW_PTS[inv.row];
        sfxExplode();
        invMoveInterval = Math.max(8, Math.floor(invMoveInterval * (invAlive / (invAlive + 1))));
        return false;
      }
    }

    // hit UFO?
    if (ufo && rectsOverlap(pb.x-1, pb.y-4, 2, 8, ufo.x, 8, 22, 8)) {
      score += ufo.pts;
      sfxExplode();
      ufo = null;
      return false;
    }

    // hit bunker?
    for (let bi = 0; bi < BUNKER_XS.length; bi++) {
      const bx = BUNKER_XS[bi];
      if (pb.x >= bx && pb.x < bx + BUNKER_W &&
          pb.y >= BUNKER_Y && pb.y < BUNKER_Y + BUNKER_H) {
        const col = Math.floor((pb.x - bx) / BUNKER_PS);
        const row = Math.floor((pb.y - BUNKER_Y) / BUNKER_PS);
        if (row >= 0 && row < bunkers[bi].length && col >= 0 && col < bunkers[bi][row].length) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const rr = row+dr, cc = col+dc;
              if (rr>=0 && rr<bunkers[bi].length && cc>=0 && cc<bunkers[bi][rr].length)
                bunkers[bi][rr][cc] = 0;
            }
          return false;
        }
        break;
      }
    }
    return true;
  });

  // ── auto fire ─────────────────────────
  if (!playerExploding) {
    autoFireTimer++;
    if (autoFireTimer >= AUTO_FIRE_RATE) {
      autoFireTimer = 0;
      shoot();
    }
  }

  // ── invader move ───────────────────────
  if (!playerExploding) {
    invMoveTimer++;
    if (invMoveTimer >= invMoveInterval) {
      invMoveTimer = 0;
      invFrame ^= 1;
      sfxMarch();

      // check if need to drop
      let leftmost = W, rightmost = 0;
      invaders.forEach(inv => {
        if (!inv.alive) return;
        const b = invaderBounds(inv);
        leftmost  = Math.min(leftmost,  b.x);
        rightmost = Math.max(rightmost, b.x + b.w);
      });

      if ((invDir > 0 && rightmost + 6 >= W - 2) ||
          (invDir < 0 && leftmost  - 6 <= 2)) {
        gridY += 8;
        invDir *= -1;
      } else {
        gridX += invDir * 6;
      }

      // invaders reached player level?
      const lowestY = Math.max(...invaders.filter(i=>i.alive).map(i => gridY + i.row * CELL_H + INV_H));
      if (lowestY >= PLAYER_Y) { killPlayer(); }
    }
  }

  // explode timers
  invaders.forEach(inv => {
    if (inv.exploding) { inv.explodeTimer--; if (inv.explodeTimer <= 0) inv.exploding = false; }
  });

  // ── invader fire ──────────────────────
  if (!playerExploding && Math.random() < diff.fireRate + level * 0.001) {
    const alive = invaders.filter(i => i.alive);
    if (alive.length) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      const b = invaderBounds(shooter);
      invBullets.push({ x: b.x + b.w/2, y: b.y + b.h, spd: diff.bulletSpd + level * 0.2 });
    }
  }

  // move invader bullets
  invBullets = invBullets.filter(b => {
    b.y += b.spd;
    if (b.y > H) return false;

    // hit player?
    if (rectsOverlap(b.x-1, b.y-4, 2, 8,
        playerX, PLAYER_Y, PLAYER_W, PLAYER_H)) {
      killPlayer();
      return false;
    }

    // hit bunker?
    for (let bi = 0; bi < BUNKER_XS.length; bi++) {
      const bx = BUNKER_XS[bi];
      if (b.x >= bx && b.x < bx + BUNKER_W && b.y >= BUNKER_Y && b.y < BUNKER_Y + BUNKER_H) {
        const col = Math.floor((b.x - bx) / BUNKER_PS);
        const row = Math.floor((b.y - BUNKER_Y) / BUNKER_PS);
        if (row >= 0 && row < bunkers[bi].length && col >= 0 && col < bunkers[bi][row].length
            && bunkers[bi][row][col]) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const rr=row+dr, cc=col+dc;
              if (rr>=0&&rr<bunkers[bi].length&&cc>=0&&cc<bunkers[bi][rr].length)
                bunkers[bi][rr][cc]=0;
            }
          return false;
        }
      }
    }
    return true;
  });

  // ── player explode ─────────────────────
  if (playerExploding) {
    playerExplodeTimer--;
    if (playerExplodeTimer <= 0) {
      playerExploding = false;
      if (lives <= 0) {
        if (score > hiScore) hiScore = score;
        transTimer = 180;
        state = STATE.GAMEOVER;
      } else {
        playerX = W/2 - PLAYER_W/2;
        playerBullets = [];
        invBullets = [];
      }
    }
    return;
  }

  // ── UFO ────────────────────────────────
  ufoTimer++;
  if (!ufo && ufoTimer > 600 + Math.random()*600) {
    ufoTimer = 0;
    ufo = { x: -24, dir: 1, pts: [50,100,150,300][Math.floor(Math.random()*4)] };
  }
  if (ufo) {
    ufo.x += ufo.dir * 1.2;
    sfxUFO();
    if (ufo.x > W + 24) ufo = null;
  }

  // ── level clear ────────────────────────
  if (invAlive <= 0) {
    transTimer = 120;
    state = STATE.LEVELUP;
  }
}

function killPlayer() {
  if (playerExploding) return;
  lives--;
  playerExploding = true;
  playerExplodeTimer = 90;
  sfxExplode();
}

function shoot() {
  if (playerExploding || playerBullets.length >= 3) return;
  playerBullets.push({ x: playerX + PLAYER_W/2, y: PLAYER_Y - 4 });
  sfxShoot();
}

/* ═══════════════════════════════════════════
   DRAW
═══════════════════════════════════════════ */
function draw() {
  // background
  cx.fillStyle = '#000';
  cx.fillRect(0, 0, W, H);
  drawStars();

  if (state === STATE.MENU)     { drawMenu(); return; }
  if (state === STATE.GAMEOVER) { drawGameOver(); return; }
  if (state === STATE.LEVELUP)  { drawLevelUp(); }

  drawHUD();
  drawBunkers();
  drawInvaders();
  drawUFO();
  drawPlayerBullet();
  drawInvaderBullets();
  drawPlayer();
}

function drawMenu() {
  cx.font = '10px "Press Start 2P"';
  cx.textAlign = 'center';

  // title glow
  cx.shadowColor = '#00ffff';
  cx.shadowBlur = 16;
  cx.fillStyle = '#00ffff';
  cx.fillText('SPACE', W/2, 46);
  cx.fillText('INVADERS', W/2, 62);
  cx.shadowBlur = 0;

  // demo invaders row
  const types = ['squid','crab','octopus'];
  const colors = ['#00ffff','#00ff66','#ffffff'];
  types.forEach((t, i) => {
    const spName = invFrame ? t+'_b' : t+'_a';
    const spFall = S[spName] || S[t+'_a'];
    spr(spFall, menuInvX + i*28, 80, colors[i], INV_PS+1);
    cx.font = '5px "Press Start 2P"';
    cx.fillStyle = colors[i];
    cx.textAlign = 'right';
    cx.fillText(['10','20','30'][i]+' PTS', menuInvX + i*28 + 28, 95);
  });

  cx.textAlign = 'center';

  // hi-score
  cx.font = '7px "Press Start 2P"';
  cx.fillStyle = 'rgba(255,255,255,.4)';
  cx.fillText('HI-SCORE  ' + String(hiScore).padStart(6,'0'), W/2, 118);

  // difficulty
  cx.fillStyle = '#fff';
  cx.fillText('DIFFICULTY', W/2, 142);

  const diff = DIFFICULTIES[diffIdx];
  cx.font = '9px "Press Start 2P"';
  cx.fillStyle = ['#00ff66','#ffdd00','#ff4444'][diffIdx];
  cx.shadowColor = cx.fillStyle; cx.shadowBlur = 10;
  cx.fillText('< ' + diff.name + ' >', W/2, 160);
  cx.shadowBlur = 0;

  // speed display
  cx.font = '6px "Press Start 2P"';
  cx.fillStyle = 'rgba(255,255,255,.3)';
  cx.fillText('SCROLL SPD  ' + DIFFICULTIES[diffIdx].scrollSpd, W/2, 178);

  // blink "press PTT"
  if (Math.floor(menuBlink / 30) % 2 === 0) {
    cx.font = '7px "Press Start 2P"';
    cx.fillStyle = '#fff';
    cx.fillText('PTT TO START', W/2, 210);
  }

  // controls hint
  cx.font = '5px "Press Start 2P"';
  cx.fillStyle = 'rgba(255,255,255,.2)';
  cx.fillText('\u2191\u2193 CHANGE DIFF', W/2, 232);
  cx.fillText('SCROLL = MOVE  AUTO FIRE', W/2, 246);

  // tag
  cx.font = '6px "Press Start 2P"';
  cx.fillStyle = 'rgba(255,255,255,.12)';
  cx.fillText('// Bitm4p', W/2, 272);
}

function drawHUD() {
  cx.font = '7px "Press Start 2P"';

  // score
  cx.fillStyle = '#fff';
  cx.textAlign = 'left';
  cx.fillText(String(score).padStart(6,'0'), 6, 14);

  // lives
  cx.fillStyle = '#00ff66';
  cx.textAlign = 'center';
  for (let i = 0; i < lives; i++) {
    spr(S.player, 6 + i * 14 + 80, 6, '#00ff66', 1);
  }

  // level
  cx.textAlign = 'right';
  cx.fillStyle = '#ffdd00';
  cx.fillText('LV' + level, W - 6, 14);

  // divider
  cx.fillStyle = 'rgba(255,255,255,.1)';
  cx.fillRect(0, 18, W, 1);
}

function drawInvaders() {
  invaders.forEach(inv => {
    const b = invaderBounds(inv);
    if (inv.exploding) {
      spr(S.explode, b.x - 1, b.y - 1, '#fff', 1);
      return;
    }
    if (!inv.alive) return;
    const type = ROW_TYPES[inv.row];
    const spName = invFrame ? type+'_b' : type+'_a';
    spr(S[spName] || S[type+'_a'], b.x, b.y, ROW_COLORS[inv.row], INV_PS);
  });
}

function drawPlayer() {
  if (playerExploding) {
    const frame = Math.floor(playerExplodeTimer / 8) % 2;
    const exX = playerX + PLAYER_W/2 - 9;
    const exY = PLAYER_Y - 2;
    spr(S.explode, exX, exY, frame ? '#ff8800' : '#ffdd00', 2);
  } else {
    spr(S.player, playerX, PLAYER_Y, '#00ff66', PLAYER_PS);
  }
}

function drawPlayerBullet() {
  cx.fillStyle = '#fff';
  cx.shadowColor = '#fff'; cx.shadowBlur = 4;
  playerBullets.forEach(pb => {
    cx.fillRect(pb.x - 1, pb.y - 6, 2, 8);
  });
  cx.shadowBlur = 0;
}

function drawInvaderBullets() {
  invBullets.forEach(b => {
    cx.fillStyle = '#ff4444';
    cx.shadowColor = '#ff4444'; cx.shadowBlur = 3;
    cx.fillRect(b.x - 1, b.y - 4, 2, 8);
    cx.shadowBlur = 0;
  });
}

function drawUFO() {
  if (!ufo) return;
  cx.shadowColor = '#ff0066'; cx.shadowBlur = 8;
  spr(S.ufo, ufo.x, 22, '#ff0066', 2);
  cx.shadowBlur = 0;
  cx.font = '5px "Press Start 2P"';
  cx.textAlign = 'center';
  cx.fillStyle = '#ff66aa';
  cx.fillText('?'+ufo.pts, ufo.x + 11, 20);
}

function drawBunkers() {
  bunkers.forEach((grid, bi) => {
    const bx = BUNKER_XS[bi];
    grid.forEach((row, ry) => {
      row.forEach((bit, rx) => {
        if (!bit) return;
        cx.fillStyle = '#00ff66';
        cx.fillRect(bx + rx * BUNKER_PS, BUNKER_Y + ry * BUNKER_PS, BUNKER_PS, BUNKER_PS);
      });
    });
  });
}

function drawLevelUp() {
  if (transTimer > 60) return;
  cx.font = '10px "Press Start 2P"';
  cx.textAlign = 'center';
  cx.fillStyle = '#ffdd00';
  cx.shadowColor = '#ffdd00'; cx.shadowBlur = 14;
  cx.fillText('LEVEL ' + (level + 1), W/2, H/2);
  cx.font = '7px "Press Start 2P"';
  cx.fillStyle = '#fff';
  cx.shadowBlur = 0;
  cx.fillText('GET READY!', W/2, H/2 + 18);
}

function drawGameOver() {
  drawHUD();
  cx.font = '10px "Press Start 2P"';
  cx.textAlign = 'center';
  cx.fillStyle = '#ff4444';
  cx.shadowColor = '#ff4444'; cx.shadowBlur = 16;
  cx.fillText('GAME OVER', W/2, H/2 - 20);
  cx.shadowBlur = 0;

  cx.font = '7px "Press Start 2P"';
  cx.fillStyle = '#fff';
  cx.fillText('SCORE  ' + String(score).padStart(6,'0'), W/2, H/2 + 4);
  cx.fillStyle = '#ffdd00';
  cx.fillText('BEST   ' + String(hiScore).padStart(6,'0'), W/2, H/2 + 20);

  if (transTimer <= 0 && Math.floor(Date.now()/500) % 2 === 0) {
    cx.font = '6px "Press Start 2P"';
    cx.fillStyle = '#fff';
    cx.fillText('PTT TO RETRY', W/2, H/2 + 44);
  }

  cx.font = '5px "Press Start 2P"';
  cx.fillStyle = 'rgba(255,255,255,.15)';
  cx.fillText('// Bitm4p', W/2, H - 10);
}

/* ═══════════════════════════════════════════
   GAME LOOP
═══════════════════════════════════════════ */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ═══════════════════════════════════════════
   INPUT — R1 + KEYBOARD FALLBACK
═══════════════════════════════════════════ */
const isR1 = typeof PluginMessageHandler !== 'undefined';

function onScrollUp() {
  if (state === STATE.MENU) {
    diffIdx = (diffIdx + 2) % 3;  // scroll up = prev difficulty
    scrollSpd = DIFFICULTIES[diffIdx].scrollSpd;
    return;
  }
  if (state === STATE.GAME && !playerExploding) {
    playerX = Math.max(0, playerX - scrollSpd);
  }
}

function onScrollDown() {
  if (state === STATE.MENU) {
    diffIdx = (diffIdx + 1) % 3;  // scroll down = next difficulty
    scrollSpd = DIFFICULTIES[diffIdx].scrollSpd;
    return;
  }
  if (state === STATE.GAME && !playerExploding) {
    playerX = Math.min(W - PLAYER_W, playerX + scrollSpd);
  }
}

function onPTT() {
  if (AC.state === 'suspended') AC.resume();
  if (state === STATE.MENU) { initGame(); return; }
  if (state === STATE.GAMEOVER && transTimer <= 0) { state = STATE.MENU; return; }
  if (state === STATE.GAME)   { shoot(); return; }
  if (state === STATE.PAUSED) { state = STATE.GAME; return; }
}

function onLongPress() {
  if (state === STATE.GAME) state = STATE.PAUSED;
  else if (state === STATE.PAUSED) state = STATE.GAME;
}

if (isR1) {
  document.addEventListener('scrollUp',      onScrollUp);
  document.addEventListener('scrollDown',    onScrollDown);
  document.addEventListener('sideClick',     onPTT);
  document.addEventListener('longPressStart',onLongPress);
} else {
  // keyboard fallback for browser preview
  const keys = {};
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  onScrollUp();
    if (e.key === 'ArrowRight') onScrollDown();
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onPTT(); }
    if (e.key === 'p' || e.key === 'Escape') onLongPress();
  });

  // mobile touch
  let touchStartX = 0;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 20) { dx < 0 ? onScrollUp() : onScrollDown(); }
    else onPTT();
  });
}

})();
