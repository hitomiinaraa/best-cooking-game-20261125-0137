// food.js — ingredient definitions and all food drawing (layered, shaded, no images).
export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8a54b', dark: '#b97a28', needs: 'none' },
  patty:   { name: 'Patty',   color: '#7a4a21', dark: '#4e2c10', needs: 'cook' },
  cheese:  { name: 'Cheese',  color: '#ffcf3f', dark: '#e0a800', needs: 'none' },
  tomato:  { name: 'Tomato',  color: '#e8483f', dark: '#a92a24', needs: 'chop' },
  lettuce: { name: 'Lettuce', color: '#7dc242', dark: '#4d8a26', needs: 'chop' },
};

// state: 'fresh' | 'raw' | 'chopped' | 'cooked' | 'burned'
export function labelOf(item) {
  if (!item) return '';
  if (item.type === 'plate') return 'Plate';
  const base = INGREDIENTS[item.type].name;
  if (item.state === 'chopped') return base + ' (chopped)';
  if (item.state === 'cooked') return base + ' (cooked)';
  if (item.state === 'burned') return base + ' (BURNT!)';
  if (item.state === 'raw') return 'Raw ' + base;
  return base;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawIngredient(ctx, type, state, x, y, s) {
  // s = half-size in px. Draws the item centred at (x, y).
  ctx.save();
  ctx.translate(x, y);
  if (type === 'bun') {
    ctx.fillStyle = '#e8a54b';
    ctx.beginPath(); ctx.arc(0, 2, s, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7cd8a';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.25, s * 0.72, s * 0.42, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-s * 0.4, -s * 0.35], [0, -s * 0.55], [s * 0.4, -s * 0.35]]) {
      ctx.beginPath(); ctx.ellipse(dx, dy, s * 0.12, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#c98a35';
    rr(ctx, -s, -s * 0.05, s * 2, s * 0.32, s * 0.14); ctx.fill();
  } else if (type === 'patty') {
    const col = state === 'burned' ? '#2b1a12' : state === 'cooked' ? '#8a5426' : '#a85f68';
    const dark = state === 'burned' ? '#120a06' : state === 'cooked' ? '#5d3410' : '#7c3f46';
    ctx.fillStyle = dark;
    rr(ctx, -s, -s * 0.55, s * 2, s * 1.2, s * 0.5); ctx.fill();
    ctx.fillStyle = col;
    rr(ctx, -s, -s * 0.68, s * 2, s * 1.1, s * 0.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, -s * 0.8, -s * 0.6, s * 1.2, s * 0.28, s * 0.14); ctx.fill();
    if (state === 'raw') {
      ctx.fillStyle = '#e8909a';
      ctx.beginPath(); ctx.arc(-s * 0.4, -s * 0.1, s * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.2, s * 0.11, 0, Math.PI * 2); ctx.fill();
    }
  } else if (type === 'cheese') {
    ctx.fillStyle = '#e0a800';
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.5); ctx.lineTo(s, -s * 0.5); ctx.lineTo(s * 0.55, s * 0.6); ctx.lineTo(-s * 0.2, s * 0.1); ctx.lineTo(-s * 0.55, s * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.62); ctx.lineTo(s, -s * 0.62); ctx.lineTo(s * 0.55, s * 0.45); ctx.lineTo(-s * 0.2, -s * 0.02); ctx.lineTo(-s * 0.55, s * 0.45); ctx.closePath(); ctx.fill();
  } else if (type === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = '#c22e28';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b5e';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.72, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd9a0';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.38, Math.sin(a) * s * 0.38, s * 0.16, s * 0.09, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e8483f';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#c22e28';
      ctx.beginPath(); ctx.arc(0, s * 0.08, s * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8483f';
      ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.05, s * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(-s * 0.4, -s * 0.45, s * 0.28, s * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4d8a26';
      ctx.beginPath(); ctx.ellipse(s * 0.15, -s * 0.85, s * 0.3, s * 0.13, 0.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (type === 'lettuce') {
    if (state === 'chopped') {
      ctx.fillStyle = '#4d8a26';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.42, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#7dc242';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#a8dd6d';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#4d8a26';
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7dc242';
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.82, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a8dd6d';
      ctx.lineWidth = s * 0.12;
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.5, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.28, 0.3, Math.PI - 0.3); ctx.stroke();
    }
  }
  ctx.restore();
}

// Draw a stacked burger/salad from a list of item types, centred at (x, y).
// Salad (no bun) draws as a bowl; burger draws as stacked layers.
export function drawDish(ctx, items, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const hasBun = items.includes('bun');
  if (!hasBun) {
    // Salad bowl.
    ctx.fillStyle = '#8a97a8';
    ctx.beginPath(); ctx.ellipse(0, s * 0.55, s * 1.15, s * 0.5, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#aeb9c6';
    ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 1.15, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8edf2';
    ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.95, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    let k = 0;
    for (const t of items) {
      drawIngredient(ctx, t, t === 'tomato' || t === 'lettuce' ? 'chopped' : 'fresh', (k - (items.length - 1) / 2) * s * 0.7, s * 0.1 - k * 2, s * 0.42);
      k++;
    }
    ctx.restore();
    return;
  }
  // Burger stack, bottom bun first.
  const layers = [];
  layers.push({ kind: 'bunBottom' });
  for (const t of items) {
    if (t !== 'bun') layers.push({ kind: t });
  }
  layers.push({ kind: 'bunTop' });
  const lh = s * 0.34;
  const totalH = layers.length * lh;
  let cy = totalH / 2 - lh / 2;
  for (const layer of layers) {
    const w = s * 1.9;
    if (layer.kind === 'bunBottom') {
      ctx.fillStyle = '#c98a35';
      rr(ctx, -w / 2, cy - lh * 0.4, w, lh * 0.9, lh * 0.35); ctx.fill();
      ctx.fillStyle = '#e8a54b';
      rr(ctx, -w / 2, cy - lh * 0.55, w, lh * 0.8, lh * 0.35); ctx.fill();
    } else if (layer.kind === 'bunTop') {
      ctx.fillStyle = '#e8a54b';
      ctx.beginPath(); ctx.arc(0, cy + lh * 0.4, w / 2, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7cd8a';
      ctx.beginPath(); ctx.ellipse(0, cy - lh * 0.1, w * 0.36, lh * 0.55, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const dx of [-w * 0.22, 0, w * 0.22]) {
        ctx.beginPath(); ctx.ellipse(dx, cy - lh * 0.25, w * 0.05, lh * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (layer.kind === 'patty') {
      ctx.fillStyle = '#5d3410';
      rr(ctx, -w / 2 - 2, cy - lh * 0.42, w + 4, lh * 0.95, lh * 0.4); ctx.fill();
      ctx.fillStyle = '#8a5426';
      rr(ctx, -w / 2 - 2, cy - lh * 0.55, w + 4, lh * 0.85, lh * 0.4); ctx.fill();
    } else if (layer.kind === 'cheese') {
      ctx.fillStyle = '#ffcf3f';
      ctx.beginPath();
      ctx.moveTo(-w / 2, cy - lh * 0.4); ctx.lineTo(w / 2, cy - lh * 0.4);
      ctx.lineTo(w * 0.28, cy + lh * 0.7); ctx.lineTo(0, cy - lh * 0.05);
      ctx.lineTo(-w * 0.28, cy + lh * 0.7); ctx.closePath(); ctx.fill();
    } else if (layer.kind === 'tomato') {
      ctx.fillStyle = '#c22e28';
      rr(ctx, -w / 2 + 4, cy - lh * 0.4, w - 8, lh * 0.8, lh * 0.3); ctx.fill();
      ctx.fillStyle = '#ff6b5e';
      rr(ctx, -w / 2 + 8, cy - lh * 0.52, w - 16, lh * 0.6, lh * 0.25); ctx.fill();
    } else if (layer.kind === 'lettuce') {
      ctx.fillStyle = '#4d8a26';
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const px = -w / 2 + (i / 8) * w;
        const py = cy + (i % 2 === 0 ? -lh * 0.35 : lh * 0.25);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineTo(w / 2, cy + lh * 0.5); ctx.lineTo(-w / 2, cy + lh * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7dc242';
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const px = -w / 2 + (i / 8) * w;
        const py = cy - lh * 0.12 + (i % 2 === 0 ? -lh * 0.3 : lh * 0.2);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineTo(w / 2, cy + lh * 0.4); ctx.lineTo(-w / 2, cy + lh * 0.4); ctx.closePath(); ctx.fill();
    }
    cy -= lh;
  }
  ctx.restore();
}

export function drawPlate(ctx, x, y, r) {
  ctx.fillStyle = '#c8ccd2';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#9aa1ab';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.24, 0, 0, Math.PI * 2); ctx.stroke();
}
