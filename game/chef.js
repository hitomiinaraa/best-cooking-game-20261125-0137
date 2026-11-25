// chef.js — the player chef: movement, click-to-walk, carrying, drawing.
import { drawIngredient } from './food.js';
import { FLOOR } from './kitchen.js';

export class Chef {
  constructor() {
    this.x = 480;
    this.y = 380;
    this.r = 20;
    this.speed = 250;
    this.dir = 1; // facing: 1 right, -1 left
    this.moving = false;
    this.carrying = null; // {type, state} or {type:'plate', items:[...]}
    this.target = null; // {x, y} click-to-walk destination
    this.walkBob = 0;
  }

  update(dt, keys) {
    let dx = 0;
    let dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    if (dx !== 0 || dy !== 0) {
      this.target = null;
      const len = Math.hypot(dx, dy);
      this.x += (dx / len) * this.speed * dt;
      this.y += (dy / len) * this.speed * dt;
      if (dx !== 0) this.dir = dx > 0 ? 1 : -1;
      this.moving = true;
    } else if (this.target) {
      const tx = this.target.x - this.x;
      const ty = this.target.y - this.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 6) {
        this.target = null;
        this.moving = false;
      } else {
        this.x += (tx / dist) * this.speed * dt;
        this.y += (ty / dist) * this.speed * dt;
        if (Math.abs(tx) > 4) this.dir = tx > 0 ? 1 : -1;
        this.moving = true;
      }
    } else {
      this.moving = false;
    }
    if (this.moving) this.walkBob += dt * 12;
    // Stay on the floor.
    this.x = Math.max(FLOOR.x + this.r, Math.min(FLOOR.x + FLOOR.w - this.r, this.x));
    this.y = Math.max(FLOOR.y + this.r, Math.min(FLOOR.y + FLOOR.h - this.r, this.y));
  }

  draw(ctx) {
    const bob = this.moving ? Math.sin(this.walkBob) * 2 : 0;
    ctx.save();
    ctx.translate(this.x, this.y + bob * 0.4);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 20, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Legs.
    const step = this.moving ? Math.sin(this.walkBob) * 5 : 0;
    ctx.fillStyle = '#2f3a4a';
    ctx.fillRect(-11 + step, 8, 8, 13);
    ctx.fillRect(3 - step, 8, 8, 13);
    // Body: white chef coat.
    ctx.fillStyle = '#f4f6f8';
    ctx.beginPath();
    ctx.moveTo(-17, 12); ctx.quadraticCurveTo(-19, -8, -12, -10);
    ctx.lineTo(12, -10); ctx.quadraticCurveTo(19, -8, 17, 12);
    ctx.quadraticCurveTo(0, 17, -17, 12);
    ctx.fill();
    ctx.strokeStyle = '#c8ccd2';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Coat buttons + red neckerchief.
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(0, -2, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 5, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d23b2e';
    ctx.beginPath(); ctx.moveTo(-7, -10); ctx.lineTo(7, -10); ctx.lineTo(0, -3); ctx.closePath(); ctx.fill();
    // Arms.
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(-23, -6, 7, 13);
    ctx.fillRect(16, -6, 7, 13);
    // Head.
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath(); ctx.arc(0, -22, 12, 0, Math.PI * 2); ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-7, -31, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -34, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -31, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-11, -33, 22, 7);
    // Face.
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-4 + this.dir * 1.5, -23, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4 + this.dir * 1.5, -23, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a35a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(this.dir * 2, -18, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // Carried item above the head.
    if (this.carrying) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(0, -46, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
      if (this.carrying.type === 'plate') {
        ctx.fillStyle = '#e8edf2';
        ctx.beginPath(); ctx.ellipse(0, -48, 21, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a5426';
        ctx.beginPath(); ctx.ellipse(0, -50, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8a54b';
        ctx.beginPath(); ctx.arc(0, -56, 12, Math.PI, 0); ctx.closePath(); ctx.fill();
      } else {
        drawIngredient(ctx, this.carrying.type, this.carrying.state, 0, -50, 13);
      }
    }
    ctx.restore();
  }
}
