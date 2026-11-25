// kitchen.js — the kitchen floor plan: counters, stations, crates, and their drawing.
import { drawIngredient, drawDish, drawPlate } from './food.js';

export const FLOOR = { x: 16, y: 128, w: 928, h: 500 };

// Every interactable station. cx/cy = front edge point the chef stands at.
export const STATIONS = [
  { id: 'crate-tomato', kind: 'crate', item: 'tomato', label: 'Tomatoes', x: 28, y: 140, w: 118, h: 62 },
  { id: 'crate-lettuce', kind: 'crate', item: 'lettuce', label: 'Lettuce', x: 158, y: 140, w: 118, h: 62 },
  { id: 'crate-patty', kind: 'crate', item: 'patty', label: 'Raw Patties', x: 288, y: 140, w: 118, h: 62 },
  { id: 'crate-bun', kind: 'crate', item: 'bun', label: 'Buns', x: 418, y: 140, w: 118, h: 62 },
  { id: 'crate-cheese', kind: 'crate', item: 'cheese', label: 'Cheese', x: 548, y: 140, w: 118, h: 62 },
  { id: 'board', kind: 'board', label: 'Cutting Board', x: 28, y: 300, w: 130, h: 96 },
  { id: 'stove', kind: 'stove', label: 'Stove', x: 786, y: 300, w: 158, h: 96 },
  { id: 'plate', kind: 'plate', label: 'Plate Station', x: 380, y: 536, w: 200, h: 84 },
  { id: 'serve', kind: 'serve', label: 'SERVE WINDOW', x: 700, y: 536, w: 220, h: 84 },
  { id: 'trash', kind: 'trash', label: 'Trash', x: 40, y: 536, w: 110, h: 84 },
];

export function stationById(id) {
  return STATIONS.find(s => s.id === id);
}

export function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

// Point in front of the station where the chef should stand to use it.
export function stationFront(s) {
  const c = stationCenter(s);
  if (s.kind === 'crate') return { x: c.x, y: s.y + s.h + 26 };
  if (s.id === 'board') return { x: s.x + s.w + 30, y: c.y };
  if (s.id === 'stove') return { x: s.x - 30, y: c.y };
  if (s.kind === 'plate' || s.kind === 'serve') return { x: c.x, y: s.y - 30 };
  if (s.id === 'trash') return { x: c.x, y: s.y - 30 };
  return c;
}

function progressBar(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 1, y - 1, w + 2, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, 8);
}

export function drawKitchen(ctx, state, time) {
  const { board, stove, plate } = state;
  // Floor tiles.
  ctx.fillStyle = '#4a3421';
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.fillStyle = '#54402c';
  for (let ty = FLOOR.y; ty < FLOOR.y + FLOOR.h; ty += 44) {
    for (let tx = FLOOR.x; tx < FLOOR.x + FLOOR.w; tx += 88) {
      if (((tx + ty) / 44) % 2 === 0) ctx.fillRect(tx, ty, 86, 42);
    }
  }
  ctx.strokeStyle = '#2c1d10';
  ctx.lineWidth = 2;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);

  // Centre rug, for a warmer floor.
  ctx.fillStyle = 'rgba(122,74,43,0.55)';
  ctx.beginPath(); ctx.ellipse(480, 420, 175, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,87,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(480, 420, 160, 42, 0, 0, Math.PI * 2); ctx.stroke();

  // Wall band with a menu sign.
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(16, 116, 928, 12);
  ctx.fillStyle = '#ffc857';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— SIZZLE & SERVE KITCHEN —', 480, 112);

  for (const s of STATIONS) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    if (s.kind === 'crate') {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#a9743c';
      ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
      ctx.strokeStyle = '#5d3a17';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
      drawIngredient(ctx, s.item, s.item === 'patty' ? 'raw' : 'fresh', cx, cy - 4, 17);
      ctx.fillStyle = '#fff2d9';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, cx, s.y + s.h - 7);
    } else if (s.kind === 'board') {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12);
      ctx.fillStyle = '#d9b48f';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#c49a6c';
      ctx.fillRect(s.x, s.y, s.w, 10);
      ctx.fillStyle = '#5d3a17';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHOP', cx, s.y + s.h - 8);
      if (board.item) {
        drawIngredient(ctx, board.item.type, board.item.state, cx, cy - 6, 20);
        if (board.item.state === 'fresh') {
          progressBar(ctx, cx - 40, s.y + s.h - 24, 80, board.progress, '#7dc242');
          ctx.fillStyle = '#3a2a1c';
          ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
          ctx.fillText('chopping…', cx, s.y + s.h - 28);
        } else {
          ctx.fillStyle = '#2e7d32';
          ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
          ctx.fillText('READY — press E', cx, s.y + s.h - 26);
        }
      } else {
        ctx.fillStyle = '#8a6a45';
        ctx.font = '12px "Trebuchet MS", sans-serif';
        ctx.fillText('tomato / lettuce', cx, cy + 2);
      }
    } else if (s.kind === 'stove') {
      ctx.fillStyle = '#3c3c46';
      ctx.fillRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12);
      ctx.fillStyle = '#565664';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#fff2d9';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STOVE', cx, s.y + 16);
      stove.slots.forEach((slot, i) => {
        const bx = s.x + 40 + i * 78;
        const by = s.y + 58;
        ctx.fillStyle = '#22222a';
        ctx.beginPath(); ctx.arc(bx, by, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#888894';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, 30, 0, Math.PI * 2); ctx.stroke();
        if (slot.item) {
          if (slot.item.state === 'raw' || slot.item.state === 'cooked') {
            const flick = 0.6 + 0.4 * Math.sin(time * 10 + i * 2);
            ctx.fillStyle = `rgba(255,${140 + Math.floor(60 * flick)},40,${0.25 + 0.2 * flick})`;
            ctx.beginPath(); ctx.arc(bx, by, 26, 0, Math.PI * 2); ctx.fill();
          }
          drawIngredient(ctx, 'patty', slot.item.state, bx, by - 4, 19);
          if (slot.item.state === 'raw') {
            progressBar(ctx, bx - 26, by + 24, 52, slot.progress, '#ff8c42');
          } else if (slot.item.state === 'cooked') {
            const frac = 1 - slot.burnTimer / slot.burnLimit;
            progressBar(ctx, bx - 26, by + 24, 52, frac, frac > 0.4 ? '#7dc242' : '#e8483f');
            ctx.fillStyle = frac > 0.4 ? '#a8dd6d' : '#ff8a7a';
            ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
            ctx.fillText(frac > 0.4 ? 'COOKED!' : 'BURNING!', bx, by - 34);
          } else {
            ctx.fillStyle = '#ff8a7a';
            ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
            ctx.fillText('BURNT', bx, by - 34);
          }
        }
      });
    } else if (s.kind === 'plate') {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12);
      ctx.fillStyle = '#b98a56';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      drawPlate(ctx, cx + 48, cy + 8, 30);
      if (plate.items.length > 0) {
        drawDish(ctx, plate.items, cx + 48, cy - 16, 20);
      }
      ctx.fillStyle = '#fff2d9';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PLATE', s.x + 8, s.y + 18);
      ctx.font = '11px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffe9c4';
      const target = state.plateTarget;
      if (target) {
        ctx.fillText('Building: ' + target.name, s.x + 8, s.y + 36);
        ctx.fillText('Next: ' + (state.nextNeeded || '—'), s.x + 8, s.y + 52);
      } else {
        ctx.fillText('No orders yet', s.x + 8, s.y + 36);
      }
      if (plate.complete) {
        const pulse = 0.6 + 0.4 * Math.sin(time * 6);
        ctx.fillStyle = `rgba(125,194,66,${pulse})`;
        ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.fillText('READY! Press E', s.x + 8, s.y + 70);
      }
    } else if (s.kind === 'serve') {
      const glow = 0.5 + 0.5 * Math.sin(time * 4);
      ctx.fillStyle = `rgba(255,200,87,${0.25 + 0.25 * glow})`;
      ctx.fillRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12);
      ctx.fillStyle = '#7a2e0e';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#a8431a';
      ctx.fillRect(s.x + 6, s.y + 6, s.w - 12, s.h - 34);
      ctx.fillStyle = '#ffd9a0';
      ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERVE  ▲', cx, cy + 2);
      ctx.font = '12px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffe9c4';
      ctx.fillText('bring finished plates here', cx, s.y + s.h - 8);
    } else if (s.kind === 'trash') {
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#33333a';
      ctx.beginPath();
      ctx.moveTo(s.x + 18, s.y + 16); ctx.lineTo(s.x + s.w - 18, s.y + 16);
      ctx.lineTo(s.x + s.w - 26, s.y + s.h - 12); ctx.lineTo(s.x + 26, s.y + s.h - 12);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a5a64';
      ctx.fillRect(s.x + 12, s.y + 8, s.w - 24, 8);
      ctx.fillStyle = '#cfd3d8';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TRASH', cx, s.y + s.h - 8);
    }
  }
}
