// orders.js — recipes, the order board, timers, scoring, combo and strikes.
import { drawDish, drawIngredient } from './food.js';

export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'cheese', 'tomato', 'lettuce'], base: 120 },
  { id: 'cheese', name: 'Cheeseburger', items: ['bun', 'patty', 'cheese'], base: 90 },
  { id: 'garden', name: 'Garden Salad', items: ['lettuce', 'tomato', 'cheese'], base: 80 },
  { id: 'double', name: 'Double Stack', items: ['bun', 'patty', 'patty', 'cheese', 'tomato'], base: 160 },
];

export function recipeById(id) {
  return RECIPES.find(r => r.id === id);
}

let nextOrderId = 1;

export class Order {
  constructor(recipe, timeLimit) {
    this.id = nextOrderId++;
    this.recipe = recipe;
    this.timeLeft = timeLimit;
    this.timeLimit = timeLimit;
    this.flash = 0;
  }
}

export class OrderManager {
  constructor() {
    this.orders = [];
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.strikes = 0;
    this.served = 0;
    this.spawnTimer = 2.5;
    this.elapsed = 0;
    this.events = []; // {text, color, t} floating messages
    this.onExpire = null;
    this.onServe = null;
    this.onNewOrder = null;
  }

  get maxOrders() { return 3; }

  spawnInterval() {
    // Rush grows with score: orders arrive faster as the kitchen heats up.
    return Math.max(6.5, 13 - this.score / 120);
  }

  orderTimeLimit() {
    return Math.max(32, 62 - this.score / 40);
  }

  pickRecipe() {
    const pool = this.score < 150 ? RECIPES.slice(0, 3) : RECIPES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  update(dt) {
    this.elapsed += dt;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < this.maxOrders) {
      const order = new Order(this.pickRecipe(), this.orderTimeLimit());
      this.orders.push(order);
      this.spawnTimer = this.spawnInterval();
      if (this.onNewOrder) this.onNewOrder(order);
    }
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      o.timeLeft -= dt;
      if (o.flash > 0) o.flash -= dt;
      if (o.timeLeft <= 0) {
        this.orders.splice(i, 1);
        this.strikes++;
        this.combo = 0;
        this.events.push({ text: 'Order expired! Strike ' + this.strikes + '/3', color: '#ff6b5e', t: 0 });
        if (this.onExpire) this.onExpire(o);
      }
    }
    for (let i = this.events.length - 1; i >= 0; i--) {
      this.events[i].t += dt;
      if (this.events[i].t > 2.2) this.events.splice(i, 1);
    }
  }

  // Try to serve a finished plate (array of item types). Returns points or 0.
  serve(items) {
    const key = items.slice().sort().join(',');
    const idx = this.orders.findIndex(o => o.recipe.items.slice().sort().join(',') === key);
    if (idx < 0) return 0;
    const order = this.orders[idx];
    this.orders.splice(idx, 1);
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served++;
    const timeBonus = Math.round(order.timeLeft) * 2;
    const comboBonus = (this.combo - 1) * 25;
    const points = order.recipe.base + timeBonus + comboBonus;
    this.score += points;
    const tip = timeBonus >= 60 ? ' + speedy tip!' : '';
    this.events.push({
      text: '+' + points + '  ' + order.recipe.name + (this.combo > 1 ? '  COMBO x' + this.combo : '') + tip,
      color: '#ffc857', t: 0,
    });
    if (this.onServe) this.onServe(order, points);
    return points;
  }

  oldestOrder() {
    return this.orders.length ? this.orders[0] : null;
  }

  drawBoard(ctx, time) {
    // Board background.
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(0, 0, 960, 116);
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(0, 0, 960, 4);
    ctx.fillStyle = '#ffc857';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ORDER BOARD', 16, 20);
    ctx.fillStyle = '#d9b48f';
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillText('serve fast for tips — 3 expired orders ends the shift', 130, 20);

    if (this.orders.length === 0) {
      ctx.fillStyle = '#8a6a45';
      ctx.font = 'italic 14px "Trebuchet MS", sans-serif';
      ctx.fillText('Waiting for the first order…', 16, 62);
    }
    this.orders.forEach((o, i) => {
      const x = 16 + i * 224;
      const y = 28;
      const w = 212;
      const h = 78;
      const low = o.timeLeft < 12;
      const pulse = low ? 0.5 + 0.5 * Math.sin(time * 8) : 0;
      ctx.fillStyle = low ? `rgba(122,32,20,${0.75 + 0.25 * pulse})` : '#4a3421';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = low ? '#ff6b5e' : '#8a5a2b';
      ctx.lineWidth = low ? 3 : 2;
      ctx.strokeRect(x, y, w, h);
      drawDish(ctx, o.recipe.items, x + 34, y + 44, 15);
      ctx.fillStyle = '#fff2d9';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(o.recipe.name, x + 62, y + 24);
      // Recipe as mini ingredient icons (readable at a glance, always fits).
      o.recipe.items.forEach((t, k) => {
        const st = t === 'patty' ? 'cooked' : (t === 'tomato' || t === 'lettuce') ? 'chopped' : 'fresh';
        drawIngredient(ctx, t, st, x + 72 + k * 26, y + 44, 9);
      });
      // Timer bar.
      const frac = Math.max(0, o.timeLeft / o.timeLimit);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 62, y + 58, 138, 10);
      ctx.fillStyle = frac > 0.5 ? '#7dc242' : frac > 0.25 ? '#ffc857' : '#e8483f';
      ctx.fillRect(x + 62, y + 58, 138 * frac, 10);
      ctx.fillStyle = low ? '#ff8a7a' : '#fff2d9';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.fillText(Math.ceil(o.timeLeft) + 's', x + 62, y + 76);
      ctx.fillStyle = '#d9b48f';
      ctx.font = '11px "Trebuchet MS", sans-serif';
      ctx.fillText('+$' + o.recipe.base, x + 150, y + 76);
    });

    // Floating event messages.
    ctx.textAlign = 'center';
    this.events.forEach((e, i) => {
      ctx.globalAlpha = Math.max(0, 1 - e.t / 2.2);
      ctx.fillStyle = e.color;
      ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
      ctx.fillText(e.text, 480, 150 + i * 26 - e.t * 14);
      ctx.globalAlpha = 1;
    });
  }
}
