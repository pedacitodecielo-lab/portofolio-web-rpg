/* ==========================================================================
   THE DATA TAVERN — Game Engine
   ========================================================================== */

(async function () {

  // ============================
  // LOAD DATA
  // ============================
  let data;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('no');
    data = await res.json();
  } catch (err) {
    const inline = document.getElementById('inline-data');
    if (inline) data = JSON.parse(inline.textContent);
    else { console.error('No data', err); return; }
  }

  // ============================
  // TILE WORLD MAP
  // Map symbols:
  //   . = floor    : = floor alt    # = wall (back)    = = wall wood (lower)
  //   W = window in wall    B = bar counter   S = bar shelf
  //   T = table     o = stool    L = lamp position
  //   P = cork board (achievements)    K = bookshelf (resume)
  //   F = picture frame    H = phone (contact)
  //   M = bartender NPC start   @ = player start
  // ============================
  const MAP = [
    '################W####W####W#################',  // 0
    '################=====================#######',  // 1
    '##SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS######',  // 2 - shelf with bottles
    '#..........................................#',  // 3
    '#..........................................#',  // 4
    '#..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......#',  // 5 - bar
    '#..........M...........H....................#', // 6 - bartender + phone on bar
    '#..o..o..o.................................#',  // 7 - stools
    '#..........................................#',  // 8
    '#..........................................#',  // 9
    '#..........@......T....T...................#',  // 10 - player start + tables
    '#..................o.....o.................#',  // 11
    '#..........................................#',  // 12
    '#.PP....................................KK.#',  // 13 - board left, bookshelf right
    '#.PP....................................KK.#',  // 14
    '#..........................................#',  // 15
    '#..........F........F............F.........#',  // 16 - picture frames
    '############################################'   // 17
  ];

  // Width and height
  const MW = MAP[0].length;
  const MH = MAP.length;
  const TILE = 32;
  const WORLD_W = MW * TILE;
  const WORLD_H = MH * TILE;

  // ============================
  // OBJECT DEFINITIONS
  // Each "thing" you can interact with: position + handler
  // ============================
  const interactables = [];  // {x, y, w, h, type, data, label}
  const collisions = [];      // walkable map: 2D array, true = walkable

  // Initialize collision map - default everything is not walkable
  for (let y = 0; y < MH; y++) {
    collisions.push(new Array(MW).fill(false));
  }

  let playerStart = { x: 12, y: 10 };
  let bartenderPos = { x: 12, y: 6 };

  // First pass: parse map, identify walkable tiles + object positions
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const ch = MAP[y][x];
      // Walkable: . : @ M (start positions on floor)
      if (ch === '.' || ch === ':' || ch === '@' || ch === 'M' || ch === 'o') {
        collisions[y][x] = true;
      }
      if (ch === '@') playerStart = { x, y };
      if (ch === 'M') bartenderPos = { x, y };
    }
  }

  // ============================
  // RENDER THE WORLD
  // ============================
  const world = document.getElementById('world');
  world.style.width = WORLD_W + 'px';
  world.style.height = WORLD_H + 'px';

  function placeTile(x, y, cls) {
    const t = document.createElement('div');
    t.className = 'tile ' + cls;
    t.style.left = (x * TILE) + 'px';
    t.style.top = (y * TILE) + 'px';
    world.appendChild(t);
    return t;
  }

  function placeObj(x, y, w, h, cls, opts = {}) {
    const o = document.createElement('div');
    o.className = 'obj ' + cls;
    o.style.left = x + 'px';
    o.style.top = y + 'px';
    o.style.width = w + 'px';
    o.style.height = h + 'px';
    if (opts.zIndex) o.style.zIndex = opts.zIndex;
    if (opts.id) o.dataset.id = opts.id;
    world.appendChild(o);
    return o;
  }

  // Render floor + walls + windows
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const ch = MAP[y][x];
      // Background tile first
      if (ch === '.' || ch === '@' || ch === 'M' || ch === 'o') {
        placeTile(x, y, ((x + y) % 2 === 0) ? 'tile-floor' : 'tile-floor alt');
      } else if (ch === ':') {
        placeTile(x, y, 'tile-floor alt');
      } else if (ch === '#') {
        placeTile(x, y, 'tile-wall');
      } else if (ch === '=') {
        placeTile(x, y, 'tile-wall-wood');
      } else if (ch === 'W') {
        placeTile(x, y, 'tile-wall');
        placeObj(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8, 'tile-window');
      } else {
        // Other things sit on floor
        placeTile(x, y, 'tile-floor');
      }
    }
  }

  // Render furniture - we'll batch-process by scanning runs
  // BAR — find horizontal runs of B
  let barStart = null;
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MAP[y][x] === 'B' && barStart === null) {
        barStart = { x, y };
      } else if (MAP[y][x] !== 'B' && barStart !== null) {
        const barW = (x - barStart.x) * TILE;
        placeObj(barStart.x * TILE, barStart.y * TILE + 8, barW, TILE + 4, 'obj-bar');
        barStart = null;
      }
    }
    if (barStart !== null) {
      const barW = (MW - barStart.x) * TILE;
      placeObj(barStart.x * TILE, barStart.y * TILE + 8, barW, TILE + 4, 'obj-bar');
      barStart = null;
    }
  }

  // SHELF — run of S
  for (let y = 0; y < MH; y++) {
    let runStart = null;
    for (let x = 0; x <= MW; x++) {
      if (x < MW && MAP[y][x] === 'S') {
        if (runStart === null) runStart = x;
      } else if (runStart !== null) {
        const w = (x - runStart) * TILE;
        const shelf = placeObj(runStart * TILE, y * TILE + 8, w, TILE - 4, 'obj-shelf');
        // Add bottles
        for (let i = 0; i < Math.floor(w / 16) - 1; i++) {
          const bottle = document.createElement('div');
          bottle.className = 'bottle bottle-' + ((i % 6) + 1);
          bottle.style.left = (4 + i * 16) + 'px';
          shelf.appendChild(bottle);
        }
        runStart = null;
      }
    }
  }

  // STOOLS
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MAP[y][x] === 'o') {
        placeObj(x * TILE + 4, y * TILE + 2, 24, 28, 'obj-stool');
      }
    }
  }

  // TABLES — pairs of T
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW - 1; x++) {
      if (MAP[y][x] === 'T') {
        placeObj(x * TILE + 4, y * TILE + 6, TILE - 8, TILE - 12, 'obj-table');
        // Block collision
        collisions[y][x] = false;
      }
    }
  }

  // HANGING LAMPS — place at preset spots based on map width
  const lampSpots = [
    { x: 10 * TILE, y: 2 * TILE + 24 },
    { x: 22 * TILE, y: 2 * TILE + 24 },
    { x: 34 * TILE, y: 2 * TILE + 24 },
    { x: 14 * TILE, y: 9 * TILE },
    { x: 28 * TILE, y: 9 * TILE },
  ];
  lampSpots.forEach(s => {
    placeObj(s.x, s.y, 24, 32, 'obj-lamp', { zIndex: 30 });
    placeObj(s.x - 36, s.y + 12, 96, 96, 'obj-lampglow', { zIndex: 1 });
  });

  // CORK BOARD (Achievements list) - find PP block
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MAP[y][x] === 'P' && MAP[y][x+1] === 'P' && (y === 0 || MAP[y-1][x] !== 'P')) {
        // This is the top-left of a PP block; check if there's another row
        const isBlock = (y + 1 < MH) && MAP[y+1][x] === 'P';
        const h = isBlock ? 2 : 1;
        const board = placeObj(x * TILE + 2, y * TILE + 2, TILE * 2 - 4, TILE * h - 4, 'obj-board interactable', { id: 'board', zIndex: 6 });
        board.dataset.interact = 'board';
        interactables.push({
          gridX: x, gridY: y + h, // Player approach from below
          el: board,
          type: 'achievements',
          label: 'Read Job Board',
          tile: 'P'
        });
        // Block collision on this 2x2
        for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < 2; dx++) {
          if (y + dy < MH && x + dx < MW) collisions[y + dy][x + dx] = false;
        }
      }
    }
  }

  // BOOKSHELF (Resume) - find KK block
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MAP[y][x] === 'K' && MAP[y][x+1] === 'K' && (y === 0 || MAP[y-1][x] !== 'K')) {
        const isBlock = (y + 1 < MH) && MAP[y+1][x] === 'K';
        const h = isBlock ? 2 : 1;
        const shelf = placeObj(x * TILE + 2, y * TILE + 2, TILE * 2 - 4, TILE * h - 4, 'obj-bookshelf interactable', { id: 'bookshelf', zIndex: 6 });
        // Add some colored "books"
        const colors = ['#d36a5e', '#6dd49d', '#5fb8d6', '#c08fff', '#f4b860', '#ff9876'];
        for (let row = 0; row < h; row++) {
          for (let bi = 0; bi < 6; bi++) {
            const b = document.createElement('div');
            b.className = 'book';
            b.style.left = (8 + bi * 10) + 'px';
            b.style.top = (4 + row * 32) + 'px';
            b.style.background = colors[(bi + row) % colors.length];
            shelf.appendChild(b);
          }
        }
        interactables.push({
          gridX: x, gridY: y + h,
          el: shelf,
          type: 'resume',
          label: 'Take Resume',
          tile: 'K'
        });
        for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < 2; dx++) {
          if (y + dy < MH && x + dx < MW) collisions[y + dy][x + dx] = false;
        }
      }
    }
  }

  // PICTURE FRAMES - F single tiles
  let frameIdx = 0;
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MAP[y][x] === 'F') {
        const f = placeObj(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8, 'obj-frame interactable', { zIndex: 6 });
        interactables.push({
          gridX: x, gridY: y + 1,
          el: f,
          type: 'frame',
          frameIdx: frameIdx++,
          label: 'Inspect Photo',
          tile: 'F'
        });
        collisions[y][x] = false;
      }
    }
  }

  // PHONE on counter
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MAP[y][x] === 'H') {
        const ph = placeObj(x * TILE + 4, y * TILE + 4, 24, 24, 'obj-phone interactable', { zIndex: 12 });
        interactables.push({
          gridX: x, gridY: y + 1,
          el: ph,
          type: 'contact',
          label: 'Use Telephone',
          tile: 'H'
        });
      }
    }
  }

  // ============================
  // SPRITES (Player + Bartender)
  // ============================
  function makeSprite(cls) {
    const s = document.createElement('div');
    s.className = 'sprite ' + cls;
    s.innerHTML = `
      <div class="sprite-body">
        <div class="sprite-head"></div>
        <div class="sprite-torso"></div>
        <div class="sprite-legs"></div>
      </div>
    `;
    return s;
  }

  // Bartender
  const bartender = makeSprite('sprite-bartender interactable');
  bartender.style.left = (bartenderPos.x * TILE + 4) + 'px';
  bartender.style.top = (bartenderPos.y * TILE) + 'px';
  bartender.style.zIndex = '11';
  const bLabel = document.createElement('div');
  bLabel.className = 'sprite-label';
  bLabel.textContent = 'EMELIO';
  bartender.appendChild(bLabel);
  world.appendChild(bartender);

  interactables.push({
    gridX: bartenderPos.x, gridY: bartenderPos.y + 1,
    el: bartender,
    type: 'bartender',
    label: 'Talk to Emelio',
    tile: 'M'
  });

  // Player
  const player = makeSprite('sprite-player');
  let playerX = playerStart.x;  // grid coords
  let playerY = playerStart.y;
  let playerFacing = 'down';
  let playerPixelX = playerX * TILE + 4;
  let playerPixelY = playerY * TILE;
  player.style.left = playerPixelX + 'px';
  player.style.top = playerPixelY + 'px';
  world.appendChild(player);

  // ============================
  // CAMERA
  // ============================
  const viewport = document.getElementById('viewport');
  let camX = 0, camY = 0;
  let targetCamX = 0, targetCamY = 0;

  function updateCamera() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    targetCamX = playerPixelX + 12 - vw / 2;
    targetCamY = playerPixelY + 16 - vh / 2;
    // Clamp to world
    targetCamX = Math.max(0, Math.min(WORLD_W - vw, targetCamX));
    targetCamY = Math.max(0, Math.min(WORLD_H - vh, targetCamY));
    if (vw > WORLD_W) targetCamX = (WORLD_W - vw) / 2;
    if (vh > WORLD_H) targetCamY = (WORLD_H - vh) / 2;
  }

  function applyCamera() {
    world.style.transform = `translate(${-camX}px, ${-camY}px)`;
  }

  // ============================
  // MOVEMENT
  // ============================
  const heldKeys = new Set();
  let isWalking = false;
  const MOVE_SPEED = 2.4; // pixels per frame

  function canWalk(gx, gy) {
    // gx/gy in grid coords
    if (gx < 0 || gy < 0 || gx >= MW || gy >= MH) return false;
    return collisions[gy][gx];
  }

  function tryMove(dx, dy) {
    // Sub-tile movement: convert pixel position to grid for collision
    const newPxX = playerPixelX + dx;
    const newPxY = playerPixelY + dy;

    // Player occupies a 16x16 footprint roughly at bottom center
    const footY1 = newPxY + 22; // bottom of legs
    const footY2 = newPxY + 30;
    const footX1 = newPxX + 6;
    const footX2 = newPxX + 18;

    // Check four corners of foot rectangle
    const corners = [
      { x: footX1, y: footY1 },
      { x: footX2, y: footY1 },
      { x: footX1, y: footY2 },
      { x: footX2, y: footY2 },
    ];

    for (const c of corners) {
      const gx = Math.floor(c.x / TILE);
      const gy = Math.floor(c.y / TILE);
      if (!canWalk(gx, gy)) return false;
    }

    playerPixelX = newPxX;
    playerPixelY = newPxY;
    return true;
  }

  function updatePlayer() {
    if (dialogActive || invOpen || itemModalOpen) {
      player.classList.remove('walking');
      return;
    }

    let dx = 0, dy = 0;
    if (heldKeys.has('w') || heldKeys.has('arrowup'))    dy -= MOVE_SPEED;
    if (heldKeys.has('s') || heldKeys.has('arrowdown'))  dy += MOVE_SPEED;
    if (heldKeys.has('a') || heldKeys.has('arrowleft'))  dx -= MOVE_SPEED;
    if (heldKeys.has('d') || heldKeys.has('arrowright')) dx += MOVE_SPEED;

    if (dx !== 0 || dy !== 0) {
      // Try X and Y separately so we can slide along walls
      if (dx !== 0) tryMove(dx, 0);
      if (dy !== 0) tryMove(0, dy);

      // Facing
      if (Math.abs(dx) > Math.abs(dy)) {
        playerFacing = dx > 0 ? 'right' : 'left';
      } else {
        playerFacing = dy > 0 ? 'down' : 'up';
      }
      player.classList.remove('face-left', 'face-right');
      if (playerFacing === 'left') player.classList.add('face-left');
      if (playerFacing === 'right') player.classList.add('face-right');

      if (!isWalking) {
        player.classList.add('walking');
        isWalking = true;
      }
    } else if (isWalking) {
      player.classList.remove('walking');
      isWalking = false;
    }

    player.style.left = playerPixelX + 'px';
    player.style.top = playerPixelY + 'px';
  }

  // ============================
  // INTERACTION DETECTION
  // ============================
  let nearbyInteract = null;
  function updateInteractables() {
    // Player grid coords (approximate from foot center)
    const pgx = Math.floor((playerPixelX + 12) / TILE);
    const pgy = Math.floor((playerPixelY + 28) / TILE);

    let nearest = null;
    let nearestDist = Infinity;

    for (const it of interactables) {
      // Distance in grid cells
      const d = Math.abs(it.gridX - pgx) + Math.abs(it.gridY - pgy);
      if (d <= 2 && d < nearestDist) {
        nearest = it;
        nearestDist = d;
      }
    }

    // Toggle "near" class
    interactables.forEach(it => {
      if (it === nearest) it.el.classList.add('near');
      else it.el.classList.remove('near');
    });

    const prompt = document.getElementById('prompt');
    if (nearest) {
      document.getElementById('prompt-text').textContent = nearest.label;
      prompt.classList.add('visible');
    } else {
      prompt.classList.remove('visible');
    }

    nearbyInteract = nearest;
  }

  // ============================
  // GAME LOOP
  // ============================
  let lastT = 0;
  function tick(t) {
    const dt = Math.min(50, t - lastT) || 16;
    lastT = t;

    updatePlayer();
    updateInteractables();
    updateCamera();

    // Smoothly move camera
    camX += (targetCamX - camX) * 0.15;
    camY += (targetCamY - camY) * 0.15;
    applyCamera();

    requestAnimationFrame(tick);
  }

  // ============================
  // KEYBOARD
  // ============================
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    heldKeys.add(k);

    // Special handlers
    if (dialogActive) {
      handleDialogKey(e);
      return;
    }

    if (invOpen) {
      handleInvKey(e);
      return;
    }

    if (itemModalOpen) {
      if (k === 'escape' || k === 'e' || k === ' ') closeItemModal();
      return;
    }

    if (k === 'e' || k === ' ') {
      if (nearbyInteract) {
        e.preventDefault();
        triggerInteract(nearbyInteract);
      }
    }
    if (k === 'i') {
      e.preventDefault();
      openInventory();
    }
    if (k === 'escape') {
      // Nothing to close if we got here
    }
  });

  window.addEventListener('keyup', (e) => {
    heldKeys.delete(e.key.toLowerCase());
  });

  // Also let player click interactables directly
  document.addEventListener('click', (e) => {
    const obj = e.target.closest('.obj.interactable, .sprite.interactable');
    if (!obj || dialogActive || invOpen || itemModalOpen) return;
    // Find which interactable this is
    const it = interactables.find(i => i.el === obj);
    if (it && nearbyInteract === it) {
      triggerInteract(it);
    }
  });

  // ============================
  // INTERACTION ROUTER
  // ============================
  function triggerInteract(it) {
    if (it.type === 'bartender') {
      startDialog(bartenderDialog());
    } else if (it.type === 'achievements') {
      startDialog([{
        portrait: 'narrator',
        name: 'JOB BOARD',
        text: 'A cork board crowded with notes, polaroids, certificates, and yellowing newspaper clippings. Each one is a chapter.',
        next: () => openInventory('achievements')
      }]);
    } else if (it.type === 'resume') {
      startDialog([{
        portrait: 'narrator',
        name: 'BOOKSHELF',
        text: 'Worn books line the shelves. One sits forward, deliberately placed: a slim black folder labeled "RESUME.PDF".',
        choices: [
          { text: 'Take resume (open PDF)', action: () => { window.open('Emelio_Exaudi_Resume.pdf', '_blank'); endDialog(); } },
          { text: 'Leave it', action: endDialog }
        ]
      }]);
    } else if (it.type === 'contact') {
      startDialog([{
        portrait: 'narrator',
        name: 'TELEPHONE',
        text: 'An old rotary phone with a small amber light blinking. A handwritten note is taped to it: "For inquiries — pick a line."',
        choices: [
          { text: '→ Email', action: () => { window.location.href = 'mailto:' + data.profile.email; endDialog(); } },
          { text: '→ LinkedIn', action: () => { window.open(data.profile.linkedin, '_blank'); endDialog(); } },
          { text: '→ Phone', action: () => { window.location.href = 'tel:' + data.profile.phone.replace(/\s/g, ''); endDialog(); } },
          { text: 'Hang up', action: endDialog }
        ]
      }]);
    } else if (it.type === 'frame') {
      const photoMsgs = [
        { name: 'PHOTOGRAPH 01', text: 'A team photo. Six people in matching shirts, all grinning. The Atmosphaira RnD division at field deployment in the partner village. The AWLR is visible in the background.' },
        { name: 'PHOTOGRAPH 02', text: 'Aerial view of a steep, terraced mine site. Equipment scattered along the contour lines. The Pongkor concession area, where ANTAM\'s extensometers monitor for movement.' },
        { name: 'PHOTOGRAPH 03', text: 'A presentation slide projected on a wall, faces in the foreground turned toward it. The ECOS framework anchor slide, IEEEBIG national finals.' }
      ];
      const msg = photoMsgs[it.frameIdx % photoMsgs.length];
      startDialog([{ portrait: 'narrator', name: msg.name, text: msg.text }]);
    }
  }

  // ============================
  // DIALOG SYSTEM
  // ============================
  let dialogActive = false;
  let dialogQueue = [];
  let dialogIdx = 0;
  let dialogTextTimer = null;
  let dialogTextIdx = 0;
  let dialogFullText = '';
  let dialogChoiceIdx = 0;
  const dialogEl = document.getElementById('dialog');

  function startDialog(steps) {
    dialogActive = true;
    dialogQueue = steps;
    dialogIdx = 0;
    dialogEl.classList.add('visible');
    showStep();
  }

  function showStep() {
    const step = dialogQueue[dialogIdx];
    if (!step) { endDialog(); return; }

    // Portrait
    const portraitEl = document.getElementById('dialog-portrait');
    portraitEl.innerHTML = '';
    if (step.portrait === 'bartender') {
      const s = makeSprite('sprite-bartender');
      portraitEl.appendChild(s);
    } else if (step.portrait === 'player') {
      const s = makeSprite('sprite-player');
      portraitEl.appendChild(s);
    } else {
      portraitEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--font-pixel);font-size:32px;color:var(--c-amber);">?</div>';
    }

    document.getElementById('dialog-name').textContent = step.name || '';
    document.getElementById('dialog-choices').innerHTML = '';
    document.getElementById('dialog-continue').classList.remove('visible');

    // Typewriter
    dialogFullText = step.text || '';
    dialogTextIdx = 0;
    document.getElementById('dialog-text').innerHTML = '';
    if (dialogTextTimer) clearInterval(dialogTextTimer);
    dialogTextTimer = setInterval(() => {
      dialogTextIdx++;
      const txt = dialogFullText.substring(0, dialogTextIdx);
      document.getElementById('dialog-text').innerHTML = txt + '<span class="blink-cursor"></span>';
      if (dialogTextIdx >= dialogFullText.length) {
        clearInterval(dialogTextTimer);
        dialogTextTimer = null;
        document.getElementById('dialog-text').innerHTML = dialogFullText;
        showChoicesOrContinue();
      }
    }, 18);
  }

  function showChoicesOrContinue() {
    const step = dialogQueue[dialogIdx];
    if (step.choices && step.choices.length) {
      const cs = document.getElementById('dialog-choices');
      dialogChoiceIdx = 0;
      step.choices.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'dialog-choice' + (i === 0 ? ' selected' : '');
        btn.textContent = c.text;
        btn.dataset.idx = i;
        btn.addEventListener('click', () => selectChoice(i));
        btn.addEventListener('mouseenter', () => {
          dialogChoiceIdx = i;
          updateChoiceSelection();
        });
        cs.appendChild(btn);
      });
    } else {
      document.getElementById('dialog-continue').classList.add('visible');
    }
  }

  function updateChoiceSelection() {
    document.querySelectorAll('.dialog-choice').forEach((el, i) => {
      el.classList.toggle('selected', i === dialogChoiceIdx);
    });
  }

  function selectChoice(i) {
    const step = dialogQueue[dialogIdx];
    if (step && step.choices && step.choices[i]) {
      const choice = step.choices[i];
      if (choice.action) {
        choice.action();
        return; // action handles its own dialog state
      }
      if (choice.next) {
        // next can be an array (eager) or function returning array (lazy)
        const nextTree = (typeof choice.next === 'function') ? choice.next() : choice.next;
        dialogQueue = nextTree;
        dialogIdx = 0;
        showStep();
      } else {
        endDialog();
      }
    }
  }

  function advanceDialog() {
    const step = dialogQueue[dialogIdx];
    // If text still typing, complete it
    if (dialogTextTimer) {
      clearInterval(dialogTextTimer);
      dialogTextTimer = null;
      document.getElementById('dialog-text').innerHTML = dialogFullText;
      dialogTextIdx = dialogFullText.length;
      showChoicesOrContinue();
      return;
    }
    // If choices showing, do nothing (user must pick)
    if (step && step.choices && step.choices.length) {
      // Confirm current choice
      selectChoice(dialogChoiceIdx);
      return;
    }
    // If next is a callback function (not an array), call it
    if (step && step.next && typeof step.next === 'function') {
      const fn = step.next;
      endDialog();
      fn();
      return;
    }
    // Otherwise advance
    dialogIdx++;
    if (dialogIdx >= dialogQueue.length) {
      endDialog();
    } else {
      showStep();
    }
  }

  function endDialog() {
    dialogActive = false;
    dialogEl.classList.remove('visible');
    if (dialogTextTimer) { clearInterval(dialogTextTimer); dialogTextTimer = null; }
  }

  function handleDialogKey(e) {
    const k = e.key.toLowerCase();
    const step = dialogQueue[dialogIdx];
    if (k === 'escape') { endDialog(); return; }
    if (step && step.choices && step.choices.length && !dialogTextTimer) {
      if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        dialogChoiceIdx = (dialogChoiceIdx + 1) % step.choices.length;
        updateChoiceSelection();
        return;
      }
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        dialogChoiceIdx = (dialogChoiceIdx - 1 + step.choices.length) % step.choices.length;
        updateChoiceSelection();
        return;
      }
    }
    if (k === 'e' || k === ' ' || k === 'enter') {
      e.preventDefault();
      advanceDialog();
    }
  }

  // ============================
  // BARTENDER DIALOG TREE
  // (All `next` are functions so trees are built lazily, no recursion)
  // ============================
  function bartenderDialog() {
    return [
      { portrait: 'bartender', name: 'EMELIO', text: 'Welcome to the Data Tavern. Pull up a stool.' },
      { portrait: 'bartender', name: 'EMELIO', text: "I'm Emelio. Final-year Meteorology student at ITB, but the lab coat doesn't quite fit me anymore. I read patterns in noisy data — atmospheric, geospatial, behavioral — and I'm pivoting into analyst work." },
      { portrait: 'bartender', name: 'EMELIO', text: 'What would you like to hear about?',
        choices: [
          { text: 'What kind of work have you done?', next: () => workMenu() },
          { text: 'What\'s your toolkit?',            next: () => toolkitChat() },
          { text: 'What are you up to now?',           next: () => nowChat() },
          { text: 'How do I hire you?',                next: () => hireChat() },
          { text: 'Nothing, just looking around.',    next: () => [{ portrait: 'bartender', name: 'EMELIO', text: 'Suit yourself. The board\'s over there if you want to browse — and the bookshelf has my resume in it.' }] }
        ]
      }
    ];
  }

  function backToMenu() {
    return {
      portrait: 'bartender', name: 'EMELIO', text: 'Anything else?',
      choices: [
        { text: 'Tell me about your work',    next: () => workMenu() },
        { text: 'What\'s your toolkit?',      next: () => toolkitChat() },
        { text: 'What are you up to now?',     next: () => nowChat() },
        { text: 'How do I hire you?',          next: () => hireChat() },
        { text: 'That\'s enough for now',     next: () => [{ portrait: 'bartender', name: 'EMELIO', text: 'Cheers. The board and the phone are open.' }] }
      ]
    };
  }

  function workMenu() {
    return [{
      portrait: 'bartender', name: 'EMELIO', text: 'Which one? Pick something off the board if you want full notes.',
      choices: [
        { text: 'ECOS / IEEEBIG finals', next: () => [
          { portrait: 'bartender', name: 'EMELIO', text: 'Team Elpatron, 2026 IEEEBIG nationals. We proposed an end-of-life EV battery system for an Indonesian manufacturer — Battery-as-a-Service, collection through SPKLU, grading facility for second life.' },
          { portrait: 'bartender', name: 'EMELIO', text: 'My piece was the risk model. Twelve operational and financial risk factors scored on probability and impact, plotted as a heatmap in Python. Became the team\'s anchor slide.' },
          backToMenu()
        ]},
        { text: 'ANTAM mining internship', next: () => [
          { portrait: 'bartender', name: 'EMELIO', text: 'Six weeks at the Pongkor gold mine working with HSSE. Their slope-monitoring system used rainfall thresholds that didn\'t account for satellite bias or cumulative rain.' },
          { portrait: 'bartender', name: 'EMELIO', text: 'I bias-corrected GPM IMERG and CHIRPS against rain gauges using Linear Scaling and Quantile Mapping, ran cross-correlation against extensometer displacement, and proposed a revised threshold logic. Ended with four formal recommendations to HSSE leadership.' },
          backToMenu()
        ]},
        { text: 'BMKG climate work', next: () => [
          { portrait: 'bartender', name: 'EMELIO', text: 'Four-week internship at BMKG\'s Climate Change Information Centre. Statistical downscaling of CMIP6 model outputs in Python — Linear Scaling bias correction validated against CHIRPS records.' },
          { portrait: 'bartender', name: 'EMELIO', text: 'Built a reusable workflow in xarray and netCDF4 so the team could keep using it after I left.' },
          backToMenu()
        ]},
        { text: 'Atmosphaira RnD division', next: () => [
          { portrait: 'bartender', name: 'EMELIO', text: 'Led a 10-person team for ten months. We built IoT-based water-level and rainfall recorders from prototype to field deployment in a partner village. They run as community early-warning tools now.' },
          { portrait: 'bartender', name: 'EMELIO', text: 'WRF-Hydro modeling on the side told us where to place them. Closed the term with a formal post-mortem for the next division head.' },
          backToMenu()
        ]},
        { text: 'Back to top',  next: () => bartenderDialog() }
      ]
    }];
  }

  function toolkitChat() {
    return [
      { portrait: 'bartender', name: 'EMELIO', text: 'Python is my main language — pandas, NumPy, scikit-learn, xarray. SQL at an intermediate-to-advanced level: window functions, CTEs, optimization. Microsoft Excel for the office side of analyst work.' },
      { portrait: 'bartender', name: 'EMELIO', text: 'Geospatial: QGIS, ArcGIS, Google Earth Engine. Modeling: WRF-Hydro, HEC-RAS, HEC-HMS, CMIP6 downscaling — that\'s the science background showing.' },
      { portrait: 'bartender', name: 'EMELIO', text: 'I\'m honest about gaps. My SQL has more theory than public proof right now. Working on that.' },
      backToMenu()
    ];
  }

  function nowChat() {
    return [
      { portrait: 'bartender', name: 'EMELIO', text: 'Finishing my undergraduate thesis on WRF-Hydro hydrological modeling for the new Indonesian capital region. Should wrap by mid-year.' },
      { portrait: 'bartender', name: 'EMELIO', text: 'Otherwise: applying to data analyst and engineering roles, mostly Indonesia. Open to remote analyst contract work too.' },
      backToMenu()
    ];
  }

  function hireChat() {
    return [
      { portrait: 'bartender', name: 'EMELIO', text: 'Telephone\'s on the counter. Pick a line — email, LinkedIn, or phone number. The bookshelf has my resume in PDF form, ready to take.' },
      { portrait: 'bartender', name: 'EMELIO', text: 'I respond to email within a day. LinkedIn within two.' },
      backToMenu()
    ];
  }

  // ============================
  // INVENTORY
  // ============================
  let invOpen = false;
  let invTab = 'achievements';
  let invSelectedIdx = 0;

  function openInventory(tab) {
    if (tab) invTab = tab;
    invOpen = true;
    document.getElementById('inventory').classList.add('visible');
    renderInventory();
  }

  function closeInventory() {
    invOpen = false;
    document.getElementById('inventory').classList.remove('visible');
  }

  function renderInventory() {
    const tabs = ['profile', 'achievements', 'skills'];
    const tabLabels = { profile: 'CHARACTER', achievements: 'JOURNAL', skills: 'STATS' };
    const tabsEl = document.getElementById('inv-tabs');
    tabsEl.innerHTML = tabs.map(t =>
      `<button class="inv-tab ${t === invTab ? 'active' : ''}" data-tab="${t}">${tabLabels[t]}</button>`
    ).join('');
    tabsEl.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', () => { invTab = btn.dataset.tab; invSelectedIdx = 0; renderInventory(); });
    });

    const body = document.getElementById('inv-body');
    if (invTab === 'profile') {
      body.innerHTML = renderProfile();
      // Hook photo loading
      const port = document.getElementById('inv-portrait-el');
      if (data.profile.photo && port) {
        const img = new Image();
        img.onload = () => {
          port.classList.add('has-photo');
          port.appendChild(img);
        };
        img.src = data.profile.photo;
      }
    } else if (invTab === 'skills') {
      body.innerHTML = renderSkills();
    } else {
      body.innerHTML = `<div class="inv-grid">${data.achievements.map((a, i) => slotHtml(a, i)).join('')}</div>`;
      body.querySelectorAll('.inv-slot').forEach((el, i) => {
        el.addEventListener('click', () => {
          invSelectedIdx = i;
          openItemDetail(data.achievements[i]);
        });
        el.addEventListener('mouseenter', () => { invSelectedIdx = i; updateInvSel(); });
      });
      updateInvSel();
    }
  }

  function updateInvSel() {
    document.querySelectorAll('.inv-slot').forEach((el, i) => {
      el.classList.toggle('selected', i === invSelectedIdx);
    });
  }

  function slotHtml(a, i) {
    const icons = {
      'Competition': '★', 'Internship': '⚒', 'Academic': '✦',
      'Leadership': '◆', 'Certification': '✓'
    };
    return `
      <div class="inv-slot" data-type="${esc(a.type)}">
        <div style="display:flex; gap:10px; align-items:center;">
          <div class="slot-icon">${icons[a.type] || '?'}</div>
          <div class="slot-meta">
            <span>${esc(a.year)}</span>
            <span class="slot-type">${esc(a.type)}</span>
          </div>
        </div>
        <div class="slot-name">${esc(a.title)}</div>
        <div class="slot-org">${esc(a.org)}</div>
      </div>
    `;
  }

  function renderProfile() {
    return `
      <div class="inv-profile">
        <div class="inv-portrait" id="inv-portrait-el">
          ${spriteMarkup('sprite-player')}
        </div>
        <div class="inv-character">
          <div class="ch-name">${esc(data.profile.name)}</div>
          <div class="ch-class">Lv 7 ${esc(data.profile.roles[0])}</div>
          <div class="ch-bio">${esc(data.profile.summary)}</div>
          <div class="ch-row"><div class="k">CLASS</div><div class="v">Meteorologist → Data Analyst</div></div>
          <div class="ch-row"><div class="k">HOMETOWN</div><div class="v">${esc(data.profile.location)}</div></div>
          <div class="ch-row"><div class="k">EMAIL</div><div class="v"><a href="mailto:${esc(data.profile.email)}">${esc(data.profile.email)}</a></div></div>
          <div class="ch-row"><div class="k">LINKEDIN</div><div class="v"><a href="${esc(data.profile.linkedin)}" target="_blank">@emelio-exaudi</a></div></div>
          <div class="ch-row"><div class="k">PHONE</div><div class="v">${esc(data.profile.phone)}</div></div>
        </div>
      </div>
    `;
  }

  function renderSkills() {
    // Render skill groups as RPG-style stat bars
    const groups = Object.entries(data.skills);
    const skillLevels = {
      'Python': 85, 'SQL': 70, 'MATLAB': 55, 'Bash': 60, 'R': 50,
      'pandas': 80, 'NumPy': 75, 'scikit-learn': 60, 'xarray': 75, 'Microsoft Excel': 70,
      'QGIS': 75, 'ArcGIS': 60, 'Google Earth Engine': 55,
      'WRF-Hydro': 75, 'HEC-RAS': 55, 'HEC-HMS': 55, 'CMIP6 Downscaling': 70
    };
    return groups.map(([group, items]) => `
      <div style="margin-bottom: 24px;">
        <div style="font-family: var(--font-pixel); font-size: 10px; color: var(--c-amber); letter-spacing: 0.12em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid var(--c-wood);">${esc(group).toUpperCase()}</div>
        <div class="inv-stats">
          ${items.map(s => {
            const lvl = skillLevels[s] || 60;
            return `
              <div class="inv-stat">
                <div class="stat-name">${esc(s)}</div>
                <div class="stat-bar"><div class="stat-fill" style="width:${lvl}%"></div></div>
                <div class="stat-value">LV ${Math.floor(lvl/10)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  function spriteMarkup(cls) {
    return `<div class="sprite ${cls}"><div class="sprite-body"><div class="sprite-head"></div><div class="sprite-torso"></div><div class="sprite-legs"></div></div></div>`;
  }

  function handleInvKey(e) {
    const k = e.key.toLowerCase();
    if (k === 'i' || k === 'escape') { e.preventDefault(); closeInventory(); return; }
    if (k === 'tab') {
      e.preventDefault();
      const order = ['profile', 'achievements', 'skills'];
      const idx = order.indexOf(invTab);
      invTab = order[(idx + 1) % order.length];
      invSelectedIdx = 0;
      renderInventory();
      return;
    }
    if (invTab === 'achievements') {
      const slots = document.querySelectorAll('.inv-slot');
      const cols = Math.max(1, Math.floor(slots.length > 0 ? document.querySelector('.inv-grid').offsetWidth / 230 : 1));
      if (k === 'arrowdown' || k === 's') { e.preventDefault(); invSelectedIdx = Math.min(slots.length - 1, invSelectedIdx + cols); updateInvSel(); }
      else if (k === 'arrowup' || k === 'w') { e.preventDefault(); invSelectedIdx = Math.max(0, invSelectedIdx - cols); updateInvSel(); }
      else if (k === 'arrowleft' || k === 'a') { e.preventDefault(); invSelectedIdx = Math.max(0, invSelectedIdx - 1); updateInvSel(); }
      else if (k === 'arrowright' || k === 'd') { e.preventDefault(); invSelectedIdx = Math.min(slots.length - 1, invSelectedIdx + 1); updateInvSel(); }
      else if (k === 'e' || k === ' ' || k === 'enter') {
        e.preventDefault();
        if (data.achievements[invSelectedIdx]) openItemDetail(data.achievements[invSelectedIdx]);
      }
    }
  }

  // ============================
  // ITEM DETAIL MODAL
  // ============================
  let itemModalOpen = false;
  function openItemDetail(item) {
    itemModalOpen = true;
    const content = document.getElementById('item-content');
    content.innerHTML = `
      <div class="ic-meta">
        <span class="ic-type">${esc(item.type)}</span>
        <span>YEAR ${esc(item.year)}</span>
        ${item.period ? `<span>${esc(item.period)}</span>` : ''}
        ${item.role ? `<span>${esc(item.role)}</span>` : ''}
      </div>
      <h2>${esc(item.title)}</h2>
      <div class="ic-org">${esc(item.org)}</div>
      <div class="ic-body">
        ${(item.fullDescription || [item.description]).map(p => `<p>${esc(p)}</p>`).join('')}
      </div>
      ${item.highlights && item.highlights.length ? `
        <div class="ic-section">
          <div class="ic-section-title">// HIGHLIGHTS</div>
          <ul class="ic-highlights">${item.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>` : ''}
      ${item.tags && item.tags.length ? `
        <div class="ic-section">
          <div class="ic-section-title">// TOOLS</div>
          <div class="ic-tags">${item.tags.map(t => `<span class="ic-tag">${esc(t)}</span>`).join('')}</div>
        </div>` : ''}
      ${item.showcase && item.showcase.length ? `
        <div class="ic-section">
          <div class="ic-section-title">// SHOWCASE</div>
          <div class="ic-showcase">
            ${item.showcase.map(s => `
              <div class="ic-show-tile">
                <div class="show-img">
                  ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.label)}" />` : esc((s.type || 'FILE').toUpperCase())}
                  <span class="wm">PREVIEW</span>
                </div>
                <div class="show-label">${esc(s.label)}</div>
                <div class="show-caption">${esc(s.caption || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
    `;
    document.getElementById('item-modal').classList.add('visible');
  }

  function closeItemModal() {
    itemModalOpen = false;
    document.getElementById('item-modal').classList.remove('visible');
  }

  document.getElementById('item-close').addEventListener('click', closeItemModal);
  document.getElementById('item-modal').addEventListener('click', (e) => {
    if (e.target.id === 'item-modal') closeItemModal();
  });

  document.getElementById('inv-close').addEventListener('click', closeInventory);

  // ============================
  // BOOT BUTTON
  // ============================
  document.getElementById('boot-start').addEventListener('click', () => {
    document.getElementById('boot').classList.add('gone');
    setTimeout(() => { document.getElementById('boot').style.display = 'none'; }, 600);
  });

  // ============================
  // MOBILE FALLBACK
  // ============================
  function renderMobile() {
    const m = document.getElementById('mobile');
    m.innerHTML = `
      <div class="mf-title">The <span style="color:var(--c-amber);">Data</span> Tavern</div>
      <div class="mf-sub">${esc(data.profile.name)} · ${esc(data.profile.roles[0])}</div>
      <div class="mf-notice">// The interactive bar runs on desktop. Here's the readable version.</div>
      <div class="mf-section">
        <div class="mf-eyebrow">// LOGGED ACHIEVEMENTS</div>
        ${data.achievements.map(a => `
          <div class="mf-card">
            <div class="mfc-meta">
              <span>${esc(a.year)}</span>
              <span class="mfc-type">${esc(a.type)}</span>
            </div>
            <h3>${esc(a.title)}</h3>
            <div class="mfc-org">${esc(a.org)}</div>
            <p>${esc(a.description)}</p>
          </div>
        `).join('')}
      </div>
      <div class="mf-section">
        <div class="mf-eyebrow">// CONTACT</div>
        <div class="mf-contact">
          <div class="mfc-row"><span class="mfc-k">EMAIL</span><a href="mailto:${esc(data.profile.email)}">${esc(data.profile.email)}</a></div>
          <div class="mfc-row"><span class="mfc-k">PHONE</span><span>${esc(data.profile.phone)}</span></div>
          <div class="mfc-row"><span class="mfc-k">LINKEDIN</span><a href="${esc(data.profile.linkedin)}" target="_blank">${esc(data.profile.linkedin.replace('https://',''))}</a></div>
          <div class="mfc-row"><span class="mfc-k">RESUME</span><a href="Emelio_Exaudi_Resume.pdf" target="_blank">download .pdf</a></div>
        </div>
      </div>
    `;
  }
  renderMobile();

  // ============================
  // UTIL
  // ============================
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================
  // START
  // ============================
  // Initialize camera and player position
  playerPixelX = playerStart.x * TILE + 4;
  playerPixelY = playerStart.y * TILE;
  player.style.left = playerPixelX + 'px';
  player.style.top = playerPixelY + 'px';
  updateCamera();
  camX = targetCamX;
  camY = targetCamY;
  applyCamera();

  requestAnimationFrame(tick);

})();
