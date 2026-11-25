// main.js — boot, game loop, input, interaction rules, HUD and game-over screen.
import { Chef } from './chef.js';
import { OrderManager } from './orders.js';
import { drawKitchen, STATIONS, stationById, stationFront, stationCenter } from './kitchen.js';
import { INGREDIENTS, labelOf } from './food.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SHIFT_SECONDS = 180;
const CHOP_SECONDS = 2.2;
const COOK_SECONDS = 5;
const BURN_SECONDS = 7;

const state = {
  mode: 'title', // 'title' | 'playing' | 'over'
  time: 0,
  shiftLeft: SHIFT_SECONDS,
  overReason: '',
  chef: new Chef(),
  orders: new OrderManager(),
  board: { item: null, progress: 0 },
  stove: { slots: [{ item: null, progress: 0, burnTimer: 0, burnLimit: BURN_SECONDS, warned: false },
                    { item: null, progress: 0, burnTimer: 0, burnLimit: BURN_SECONDS, warned: false }] },
  plate: { items: [], complete: false },
  keys: {},
  pendingStation: null,
  chopTick: 0,
  sizzleTick: 0,
  flashMsg: '',
  flashT: 0,
};

// Serving state the kitchen draws from.
const kitchenState = {
  get board() { return state.board; },
  get stove() { return state.stove; },
  get plate() { return state.plate; },
  get plateTarget() { return state.orders.oldestOrder() ? state.orders.oldestOrder().recipe : null; },
  get nextNeeded() {
    const target = state.orders.oldestOrder();
    if (!target) return '—';
    const need = target.recipe.items[state.plate.items.length];
    if (!need) return 'done!';
    const ing = INGREDIENTS[need];
    if (ing.needs === 'chop') return ing.name + ' (chopped)';
    if (ing.needs === 'cook') return ing.name + ' (cooked)';
    return ing.name;
  },
};

function flash(text) {
  state.flashMsg = text;
  state.flashT = 0;
}

function nearestStation() {
  const c = state.chef;
  let best = null;
  let bestD = 78;
  for (const s of STATIONS) {
    const nx = Math.max(s.x, Math.min(c.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(c.y, s.y + s.h));
    const d = Math.hypot(c.x - nx, c.y - ny);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

function itemReady(item) {
  if (!item) return false;
  const need = INGREDIENTS[item.type].needs;
  if (need === 'chop') return item.state === 'chopped';
  if (need === 'cook') return item.state === 'cooked';
  return true;
}

function interact(forcedStation) {
  if (state.mode !== 'playing') return;
  // A click names its station explicitly: never let "nearest station" win
  // when the chef is standing between two counters (e.g. tomato crate
  // above the cutting board). Keyboard E still uses the nearest station.
  const s = forcedStation || nearestStation();
  if (!s) { return; }
  const chef = state.chef;

  if (s.kind === 'crate') {
    if (chef.carrying) { sfx.error(); flash('Hands full — serve or trash it first'); return; }
    chef.carrying = { type: s.item, state: s.item === 'patty' ? 'raw' : 'fresh' };
    sfx.pickup();
    return;
  }

  if (s.kind === 'board') {
    const b = state.board;
    if (!b.item && chef.carrying && (chef.carrying.type === 'tomato' || chef.carrying.type === 'lettuce') && chef.carrying.state === 'fresh') {
      b.item = chef.carrying;
      b.progress = 0;
      chef.carrying = null;
      sfx.putdown();
      return;
    }
    if (b.item && b.item.state === 'chopped' && !chef.carrying) {
      chef.carrying = b.item;
      state.board.item = null;
      state.board.progress = 0;
      sfx.pickup();
      return;
    }
    if (b.item && b.item.state === 'fresh') { flash('Still chopping…'); return; }
    sfx.error();
    flash('The board only chops tomato and lettuce');
    return;
  }

  if (s.kind === 'stove') {
    if (chef.carrying && chef.carrying.type === 'patty' && chef.carrying.state === 'raw') {
      const slot = state.stove.slots.find(sl => !sl.item);
      if (!slot) { sfx.error(); flash('Both burners are full'); return; }
      slot.item = chef.carrying;
      slot.progress = 0;
      slot.burnTimer = 0;
      slot.warned = false;
      chef.carrying = null;
      sfx.putdown();
      return;
    }
    if (!chef.carrying) {
      const slot = state.stove.slots.find(sl => sl.item && (sl.item.state === 'cooked' || sl.item.state === 'burned'));
      if (slot) {
        chef.carrying = slot.item;
        slot.item = null;
        slot.progress = 0;
        slot.burnTimer = 0;
        sfx.pickup();
        return;
      }
      if (state.stove.slots.some(sl => sl.item)) { flash('Still cooking…'); return; }
      sfx.error();
      flash('Put a raw patty on the stove first');
      return;
    }
    sfx.error();
    flash('The stove only cooks raw patties');
    return;
  }

  if (s.kind === 'plate') {
    const p = state.plate;
    const target = state.orders.oldestOrder();
    if (chef.carrying && chef.carrying.type === 'plate') { sfx.error(); flash('Already carrying a plate'); return; }
    if (!chef.carrying && p.complete) {
      chef.carrying = { type: 'plate', items: p.items.slice() };
      state.plate.items = [];
      state.plate.complete = false;
      sfx.pickup();
      return;
    }
    if (chef.carrying && chef.carrying.type !== 'plate') {
      if (!target) { sfx.error(); flash('No orders on the board yet'); return; }
      if (p.complete) { sfx.error(); flash('Plate is done — pick it up'); return; }
      const need = target.recipe.items[p.items.length];
      if (chef.carrying.type !== need || !itemReady(chef.carrying)) {
        sfx.error();
        flash('Wrong step — plate needs ' + kitchenState.nextNeeded);
        return;
      }
      p.items.push(chef.carrying.type);
      chef.carrying = null;
      if (p.items.length === target.recipe.items.length) {
        p.complete = true;
        sfx.ding();
        flash(target.recipe.name + ' is ready!');
      } else {
        sfx.stack();
      }
      return;
    }
    if (!chef.carrying && !p.complete) { flash('Bring the next ingredient: ' + kitchenState.nextNeeded); return; }
    return;
  }

  if (s.kind === 'serve') {
    if (chef.carrying && chef.carrying.type === 'plate') {
      const points = state.orders.serve(chef.carrying.items);
      if (points > 0) {
        chef.carrying = null;
        sfx.serve();
      } else {
        sfx.error();
        flash('No order wants this dish right now');
      }
      return;
    }
    sfx.error();
    flash('Bring a finished plate to the window');
    return;
  }

  if (s.kind === 'trash') {
    if (chef.carrying) {
      chef.carrying = null;
      sfx.putdown();
      flash('Tossed it');
      return;
    }
    sfx.error();
    return;
  }
}

function resetGame() {
  state.mode = 'playing';
  state.time = 0;
  state.shiftLeft = SHIFT_SECONDS;
  state.overReason = '';
  state.chef = new Chef();
  state.orders = new OrderManager();
  state.orders.onExpire = () => sfx.expire();
  state.orders.onServe = () => {};
  state.orders.onNewOrder = () => sfx.newOrder();
  state.board = { item: null, progress: 0 };
  state.stove = { slots: [{ item: null, progress: 0, burnTimer: 0, burnLimit: BURN_SECONDS, warned: false },
                           { item: null, progress: 0, burnTimer: 0, burnLimit: BURN_SECONDS, warned: false }] };
  state.plate = { items: [], complete: false };
  state.pendingStation = null;
  state.flashMsg = '';
  state.flashT = 0;
}

function gameOver(reason) {
  state.mode = 'over';
  state.overReason = reason;
  sfx.gameOver();
}

function update(dt) {
  if (state.mode !== 'playing') return;
  state.time += dt;
  state.shiftLeft -= dt;
  if (state.flashT < 3) state.flashT += dt;

  state.chef.update(dt, state.keys);

  // Click-to-walk arrival: use the pending station.
  if (state.pendingStation) {
    const s = stationById(state.pendingStation);
    if (s && !state.chef.target) {
      const nx = Math.max(s.x, Math.min(state.chef.x, s.x + s.w));
      const ny = Math.max(s.y, Math.min(state.chef.y, s.y + s.h));
      if (Math.hypot(state.chef.x - nx, state.chef.y - ny) < 78) {
        state.pendingStation = null;
        interact(s);
      }
    }
  }

  // Chopping.
  const b = state.board;
  if (b.item && b.item.state === 'fresh') {
    b.progress += dt / CHOP_SECONDS;
    state.chopTick -= dt;
    if (state.chopTick <= 0) { sfx.chop(); state.chopTick = 0.35; }
    if (b.progress >= 1) {
      b.item.state = 'chopped';
      b.progress = 1;
      sfx.chopDone();
    }
  }

  // Cooking.
  let anyCooking = false;
  for (const slot of state.stove.slots) {
    if (!slot.item) continue;
    if (slot.item.state === 'raw') {
      anyCooking = true;
      slot.progress += dt / COOK_SECONDS;
      if (slot.progress >= 1) {
        slot.item.state = 'cooked';
        slot.progress = 1;
        slot.burnTimer = 0;
        sfx.cooked();
      }
    } else if (slot.item.state === 'cooked') {
      anyCooking = true;
      slot.burnTimer += dt;
      if (!slot.warned && slot.burnTimer > slot.burnLimit - 3) {
        slot.warned = true;
        sfx.burnWarn();
        flash('Patty is about to burn!');
      }
      if (slot.burnTimer >= slot.burnLimit) {
        slot.item.state = 'burned';
        sfx.burnWarn();
        flash('Burnt patty! Trash it.');
      }
    }
  }
  if (anyCooking) {
    state.sizzleTick -= dt;
    if (state.sizzleTick <= 0) { sfx.sizzle(); state.sizzleTick = 1.4; }
  }

  // Plate target changed underneath the build? Clear a stale plate.
  const target = state.orders.oldestOrder();
  const p = state.plate;
  if (p.items.length > 0 && !p.complete && target) {
    const ok = p.items.every((t, i) => t === target.recipe.items[i]);
    if (!ok) {
      p.items = [];
      flash('Order changed — plate cleared');
    }
  }

  state.orders.update(dt);
  if (state.orders.strikes >= 3) { gameOver('strikes'); return; }
  if (state.shiftLeft <= 0) { gameOver('time'); return; }
}

function drawHud() {
  const o = state.orders;
  const x = 700;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText('SCORE ' + o.score, x, 48);
  ctx.fillStyle = o.combo > 1 ? '#7dc242' : '#d9b48f';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.fillText(o.combo > 1 ? 'COMBO x' + o.combo : 'No combo yet', x, 70);
  const mm = Math.max(0, Math.floor(state.shiftLeft / 60));
  const ss = Math.max(0, Math.floor(state.shiftLeft % 60));
  const lowTime = state.shiftLeft < 30;
  ctx.fillStyle = lowTime ? '#ff6b5e' : '#fff2d9';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('Shift ' + mm + ':' + String(ss).padStart(2, '0'), x, 92);
  // Strikes.
  ctx.fillStyle = '#d9b48f';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText('Strikes:', 850, 70);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < o.strikes ? '#e8483f' : '#5d3a17';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText('✕', 850 + i * 22, 92);
  }
  // Carried item label.
  if (state.chef.carrying) {
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(700, 96, 244, 20);
    ctx.fillStyle = '#ffc857';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText('Carrying: ' + labelOf(state.chef.carrying), 706, 111);
  }
}

function drawTitle() {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 54px "Trebuchet MS", sans-serif';
  ctx.fillText('SIZZLE & SERVE', 480, 190);
  ctx.fillStyle = '#f6e8d4';
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillText('The lunch rush is on. Cook it, stack it, serve it.', 480, 230);
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#d9b48f';
  const lines = [
    'Grab ingredients from the crates along the top wall.',
    'Chop tomato & lettuce on the cutting board. Cook raw patties on the stove — don\'t let them burn!',
    'Stack the plate in the order shown, then serve it at the window.',
    'Fast serves earn tips and build your combo. 3 expired orders ends the shift.',
    '',
    'WASD / arrows to move  •  E or Space to use a station  •  click a counter to walk to it',
  ];
  lines.forEach((l, i) => ctx.fillText(l, 480, 280 + i * 28));
  const pulse = 0.6 + 0.4 * Math.sin(state.time * 4);
  ctx.fillStyle = `rgba(255,200,87,${pulse})`;
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText('Press ENTER or click to start', 480, 480);
  ctx.fillStyle = '#8a6a45';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText('3-minute shift  •  Top 10 paid on make.fun', 480, 514);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillText(state.overReason === 'strikes' ? 'SHIFT OVER — TOO MANY STRIKES' : 'SHIFT OVER — TIME\'S UP!', 480, 200);
  const o = state.orders;
  ctx.fillStyle = '#f6e8d4';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.fillText('Final score: ' + o.score, 480, 270);
  ctx.font = '20px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#d9b48f';
  ctx.fillText('Dishes served: ' + o.served + '    Best combo: x' + o.bestCombo + '    Strikes: ' + o.strikes, 480, 310);
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText('Press R to cook again', 480, 380);
}

function draw() {
  ctx.clearRect(0, 0, 960, 640);
  if (state.mode === 'title') {
    // Show the kitchen behind the title overlay.
    drawKitchen(ctx, kitchenState, state.time);
    state.orders.drawBoard(ctx, state.time);
    state.chef.draw(ctx);
    drawTitle();
    return;
  }
  drawKitchen(ctx, kitchenState, state.time);
  state.orders.drawBoard(ctx, state.time);
  drawHud();
  state.chef.draw(ctx);
  // Flash message.
  if (state.flashMsg && state.flashT < 2.2) {
    ctx.globalAlpha = Math.max(0, 1 - state.flashT / 2.2);
    ctx.fillStyle = '#fff2d9';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.flashMsg, 480, 620);
    ctx.globalAlpha = 1;
  }
  if (state.mode === 'over') drawGameOver();
}

// Input.
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  state.keys[k] = true;
  if (k === 'enter' && state.mode === 'title') { sfx.unlock(); resetGame(); return; }
  if (k === 'r' && state.mode === 'over') { resetGame(); return; }
  if ((k === 'e' || k === ' ') && state.mode === 'playing') { interact(); return; }
  if (k === 'm') { sfx.toggleMute(); }
});
window.addEventListener('keyup', (e) => { state.keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  if (state.mode === 'title') { resetGame(); return; }
  if (state.mode === 'over') return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = STATIONS.find(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
  if (hit) {
    const front = stationFront(hit);
    const nx = Math.max(hit.x, Math.min(state.chef.x, hit.x + hit.w));
    const ny = Math.max(hit.y, Math.min(state.chef.y, hit.y + hit.h));
    if (Math.hypot(state.chef.x - nx, state.chef.y - ny) < 78) {
      interact(hit);
    } else {
      state.chef.target = front;
      state.pendingStation = hit.id;
    }
  } else {
    state.chef.target = { x, y };
    state.pendingStation = null;
  }
});

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = STATIONS.find(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

// Debug/testing hook: lets an automated play-test read live positions.
window.SIZZLE = {
  state,
  kitchenState,
  stations: STATIONS,
  stationCenter,
  stationFront,
  start: () => { if (state.mode === 'title') resetGame(); },
  interact,
  reset: resetGame,
};

// Game loop.
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.mode === 'title') state.time += dt;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
