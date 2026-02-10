/* generate-cards.js – SVG card generation for QuantumMus */

class CardGenerator {

  static SUIT_COLORS = {
    oros:    '#f5c518',
    copas:   '#ff6b6b',
    espadas: '#64748b',
    bastos:  '#2ecc71'
  };

  static SUIT_SYMBOLS = {
    oros:    '🪙',
    copas:   '🏆',
    espadas: '⚔️',
    bastos:  '🪄'
  };

  static DISPLAY_VALUES = {
    1: 'A', 10: 'S', 11: 'C', 12: 'R'
  };

  /* ───── 1. generateCard ───── */
  static generateCard(numero, palo, options) {
    const opts   = options || {};
    const w      = opts.width || 70;
    const h      = Math.round(w / 0.7);
    const color  = CardGenerator.SUIT_COLORS[palo] || '#888';
    const symbol = CardGenerator.SUIT_SYMBOLS[palo] || '?';
    const label  = CardGenerator.DISPLAY_VALUES[numero] || String(numero);
    const entangled = !!opts.isEntangled;

    const border = entangled
      ? 'stroke:#00bcd4;stroke-width:3;filter:drop-shadow(0 0 4px #00bcd4)'
      : 'stroke:#bbb;stroke-width:1';

    const entangledBadge = entangled
      ? `<text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="${w * 0.16}" fill="#00bcd4">⚛</text>`
      : '';

    const fontSize     = Math.round(w * 0.22);
    const symbolSize   = Math.round(w * 0.34);
    const cornerOffset = Math.round(w * 0.18);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" ry="6"
        fill="#fdf6e3" style="${border}"/>
  <text x="${cornerOffset}" y="${cornerOffset + fontSize * 0.35}" text-anchor="middle"
        font-size="${fontSize}" font-weight="bold" fill="${color}">${label}</text>
  <text x="${w - cornerOffset}" y="${h - cornerOffset + fontSize * 0.35}"
        text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="${color}"
        transform="rotate(180,${w - cornerOffset},${h - cornerOffset})">${label}</text>
  <text x="${w / 2}" y="${h / 2 + symbolSize * 0.2}" text-anchor="middle"
        font-size="${symbolSize}">${symbol}</text>
  ${entangledBadge}
</svg>`;

    return `<div class="card-svg" style="display:inline-block;width:${w}px;height:${h}px">${svg}</div>`;
  }

  /* ───── 2. generateCardBack ───── */
  static generateCardBack(width) {
    const w = width || 70;
    const h = Math.round(w / 0.7);
    const mid = w / 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" ry="6"
        fill="#0d1b2a" stroke="#1b2838" stroke-width="1"/>
  <line x1="${mid - 12}" y1="20" x2="${mid - 12}" y2="${h - 20}"
        stroke="#1b4965" stroke-width="1" opacity="0.5"/>
  <line x1="${mid}" y1="20" x2="${mid}" y2="${h - 20}"
        stroke="#1b4965" stroke-width="1" opacity="0.5"/>
  <line x1="${mid + 12}" y1="20" x2="${mid + 12}" y2="${h - 20}"
        stroke="#1b4965" stroke-width="1" opacity="0.5"/>
  <circle cx="${mid - 12}" cy="${h * 0.35}" r="3" fill="none" stroke="#5bc0be" stroke-width="0.8"/>
  <circle cx="${mid}" cy="${h * 0.55}" r="3" fill="none" stroke="#5bc0be" stroke-width="0.8"/>
  <circle cx="${mid + 12}" cy="${h * 0.45}" r="3" fill="none" stroke="#5bc0be" stroke-width="0.8"/>
  <line x1="${mid - 12}" y1="${h * 0.35}" x2="${mid}" y2="${h * 0.55}"
        stroke="#5bc0be" stroke-width="0.8" opacity="0.6"/>
  <line x1="${mid}" y1="${h * 0.55}" x2="${mid + 12}" y2="${h * 0.45}"
        stroke="#5bc0be" stroke-width="0.8" opacity="0.6"/>
  <text x="${mid}" y="${h / 2 + w * 0.12}" text-anchor="middle"
        font-size="${w * 0.34}" fill="#5bc0be" opacity="0.8"
        font-family="serif" font-style="italic">Ψ</text>
</svg>`;

    return `<div class="card-svg card-back" style="display:inline-block;width:${w}px;height:${h}px">${svg}</div>`;
  }

  /* ───── 3. generateBlochSphere ───── */
  static generateBlochSphere(state, suitColor) {
    const s   = 48;
    const cx  = s / 2;
    const cy  = s / 2;
    const r   = s * 0.38;
    const col = suitColor || '#5bc0be';

    const animating = (state === 'superposition' || state === 'entangled');

    let vx, vy;
    if (state === 'collapsed') {
      vx = cx;
      vy = cy - r;
    } else if (state === 'entangled') {
      vx = cx + r * 0.6;
      vy = cy - r * 0.5;
    } else {
      vx = cx + r * 0.7;
      vy = cy;
    }

    const rotateAnim = animating
      ? `<animateTransform attributeName="transform" type="rotate"
           from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="3s" repeatCount="indefinite"/>`
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#555" stroke-width="0.7"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.35}" fill="none"
           stroke="#555" stroke-width="0.5" stroke-dasharray="2,2"/>
  <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"
        stroke="#777" stroke-width="0.5"/>
  <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}"
        stroke="#777" stroke-width="0.5"/>
  <g>
    <line x1="${cx}" y1="${cy}" x2="${vx}" y2="${vy}"
          stroke="${col}" stroke-width="1.5"/>
    <circle cx="${vx}" cy="${vy}" r="2.5" fill="${col}"/>
    ${rotateAnim}
  </g>
</svg>`;

    return svg;
  }

  /* ───── 4. generateCharacter ───── */
  static generateCharacter(name) {
    const palette = {
      Preskill: { fill: '#00bcd4', accent: '#00838f', symbol: 'Q' },
      Cirac:    { fill: '#ff6b6b', accent: '#c62828', symbol: '⚛' },
      Zoller:   { fill: '#b39ddb', accent: '#5e35b1', symbol: 'λ' },
      Deutsch:  { fill: '#f5c518', accent: '#c49000', symbol: 'D' }
    };

    const p  = palette[name] || palette.Preskill;
    const s  = 80;
    const cx = s / 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- head -->
  <circle cx="${cx}" cy="22" r="14" fill="${p.fill}" stroke="${p.accent}" stroke-width="1.5"/>
  <!-- eyes -->
  <circle cx="${cx - 5}" cy="20" r="1.5" fill="#fff"/>
  <circle cx="${cx + 5}" cy="20" r="1.5" fill="#fff"/>
  <!-- body -->
  <path d="M${cx - 14} 75 Q${cx - 14} 36 ${cx} 36 Q${cx + 14} 36 ${cx + 14} 75"
        fill="${p.fill}" stroke="${p.accent}" stroke-width="1.5" opacity="0.85"/>
  <!-- specialty symbol -->
  <text x="${cx}" y="62" text-anchor="middle" font-size="16" font-weight="bold"
        fill="#fff" font-family="serif">${p.symbol}</text>
</svg>`;

    return svg;
  }
}

window.CardGenerator = CardGenerator;
