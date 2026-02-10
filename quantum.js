'use strict';

const SUITS = ['oros', 'copas', 'espadas', 'bastos'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

// Team 1: oros↔copas, Team 2: espadas↔bastos
const TEAM_PAIRS = {
  oros: 'copas',
  copas: 'oros',
  espadas: 'bastos',
  bastos: 'espadas',
};

/**
 * In 8 reyes mode: 3→12 (king), 2→1 (ace) for comparison purposes.
 */
function normalizeCardValue(value, gameMode) {
  if (gameMode === '8') {
    if (value === 3) return 12;
    if (value === 2) return 1;
  }
  return value;
}

/**
 * Returns card value ordering for the mus game.
 * In 8 reyes mode kings (12) and 3s share the top rank,
 * aces (1) and 2s share the bottom rank.
 */
function getMusCardOrder(gameMode) {
  if (gameMode === '8') {
    // Normalized values used for ordering (low → high)
    return [1, 4, 5, 6, 7, 10, 11, 12];
  }
  return [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
}

/**
 * Simple deterministic hash for a string, returns a number 0–1.
 */
function hashToFloat(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) / 2147483647; // max 32-bit signed int
}

// ─── QuantumCard ────────────────────────────────────────────────────────────

class QuantumCard {
  constructor(value, suit, gameMode = '8') {
    this.value = value;
    this.suit = suit;
    this.gameMode = gameMode;

    this.isEntangled = false;
    this.entangledPartnerValue = null;
    this.entangledPartnerSuit = null;

    this.isSuperposed = false;
    this.superposedValue = null;
    this.coefficientA = 0;
    this.coefficientB = 0;

    this.isCollapsed = false;
    this.collapsedValue = null;
    this.collapseReason = null;

    this._determineQuantumState();
  }

  _determineQuantumState() {
    if (this.gameMode === '8') {
      // Kings (12), 3s, 2s, and aces (1) are entangled in 8-reyes mode
      if (this.value === 12 || this.value === 3 || this.value === 2) {
        this.isEntangled = true;
        const partnerSuit = TEAM_PAIRS[this.suit];
        this.entangledPartnerSuit = partnerSuit;

        if (this.value === 12 || this.value === 3) {
          // 12 and 3 both normalize to 12, partner is the other of {12, 3}
          this.entangledPartnerValue = this.value === 12 ? 3 : 12;
          this.isSuperposed = true;
          this.superposedValue = 12; // both resolve to king
        } else {
          // value === 2: normalizes to 1, partner is the other of {2, 1}
          this.entangledPartnerValue = 1;
          this.isSuperposed = true;
          this.superposedValue = 1; // both resolve to ace
        }

        this.coefficientA = 0.7071;
        this.coefficientB = 0.7071;
      }
    }
  }

  /**
   * Collapse the card to a definite value.
   * @param {number|null} deterministicValue - Force this value
   * @param {string|null} collapseSeed - Seed for deterministic random collapse
   * @returns {number} The collapsed value
   */
  collapse(deterministicValue, collapseSeed) {
    if (this.isCollapsed) return this.collapsedValue;

    if (deterministicValue != null) {
      this.collapsedValue = deterministicValue;
      this.collapseReason = 'deterministic';
    } else if (collapseSeed != null) {
      const r = hashToFloat(collapseSeed);
      // Probability split by |coefficientA|²
      const probA = this.coefficientA * this.coefficientA;
      this.collapsedValue = r < probA ? this.value : (this.superposedValue != null ? this.superposedValue : this.value);
      this.collapseReason = 'seeded';
    } else {
      const r = Math.random();
      const probA = this.coefficientA * this.coefficientA;
      this.collapsedValue = r < probA ? this.value : (this.superposedValue != null ? this.superposedValue : this.value);
      this.collapseReason = 'random';
    }

    this.isCollapsed = true;
    return this.collapsedValue;
  }

  toDict() {
    return {
      value: this.value,
      suit: this.suit,
      gameMode: this.gameMode,
      isEntangled: this.isEntangled,
      entangledPartnerValue: this.entangledPartnerValue,
      entangledPartnerSuit: this.entangledPartnerSuit,
      isSuperposed: this.isSuperposed,
      superposedValue: this.superposedValue,
      coefficientA: this.coefficientA,
      coefficientB: this.coefficientB,
      isCollapsed: this.isCollapsed,
      collapsedValue: this.collapsedValue,
      collapseReason: this.collapseReason,
    };
  }
}

// ─── EntanglementSystem ─────────────────────────────────────────────────────

class EntanglementSystem {
  constructor(gameMode) {
    this.gameMode = gameMode;
    // Map of pairId → { cards: [{value, suit}, {value, suit}], activated: bool, activatedBy: number|null }
    this._pairs = new Map();
    this._buildPairs();
  }

  _pairId(value, suit) {
    // Canonical pair id: sort the two partner keys so id is the same from either side
    const partnerSuit = TEAM_PAIRS[suit];
    if (!partnerSuit) return null;

    let partnerValue;
    if (this.gameMode === '8') {
      if (value === 12) partnerValue = 3;
      else if (value === 3) partnerValue = 12;
      else if (value === 2) partnerValue = 1;
      else if (value === 1) partnerValue = 2;
      else return null;
    } else {
      return null; // no entanglement outside 8-reyes
    }

    const a = `${value}-${suit}`;
    const b = `${partnerValue}-${partnerSuit}`;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  _buildPairs() {
    if (this.gameMode !== '8') return;

    const entangledValues = [12, 3, 2, 1];
    const added = new Set();

    for (const val of entangledValues) {
      for (const suit of SUITS) {
        const id = this._pairId(val, suit);
        if (id && !added.has(id)) {
          const partnerSuit = TEAM_PAIRS[suit];
          let partnerValue;
          if (val === 12) partnerValue = 3;
          else if (val === 3) partnerValue = 12;
          else if (val === 2) partnerValue = 1;
          else partnerValue = 2;

          this._pairs.set(id, {
            cards: [
              { value: val, suit },
              { value: partnerValue, suit: partnerSuit },
            ],
            activated: false,
            activatedBy: null,
          });
          added.add(id);
        }
      }
    }
  }

  isCardEntangled(value, suit) {
    const id = this._pairId(value, suit);
    return id != null && this._pairs.has(id);
  }

  getPartnerCard(value, suit) {
    const id = this._pairId(value, suit);
    if (!id || !this._pairs.has(id)) return null;
    const pair = this._pairs.get(id);
    const me = `${value}-${suit}`;
    for (const c of pair.cards) {
      if (`${c.value}-${c.suit}` !== me) return { value: c.value, suit: c.suit };
    }
    return null;
  }

  activateEntanglement(value, suit, playerIdx) {
    const id = this._pairId(value, suit);
    if (!id || !this._pairs.has(id)) return false;
    const pair = this._pairs.get(id);
    pair.activated = true;
    pair.activatedBy = playerIdx;
    return true;
  }

  resetPairStates() {
    for (const pair of this._pairs.values()) {
      pair.activated = false;
      pair.activatedBy = null;
    }
  }

  getAllPairs() {
    const result = [];
    for (const [id, pair] of this._pairs) {
      result.push({ id, ...pair });
    }
    return result;
  }
}

// ─── QuantumDeck ────────────────────────────────────────────────────────────

class QuantumDeck {
  constructor(gameMode) {
    this.gameMode = gameMode;
    this.cards = [];
    this._build();
  }

  _build() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const num of NUMBERS) {
        this.cards.push(new QuantumCard(num, suit, this.gameMode));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(numCards) {
    return this.cards.splice(0, numCards);
  }

  remaining() {
    return this.cards.length;
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  QuantumCard,
  EntanglementSystem,
  QuantumDeck,
  normalizeCardValue,
  getMusCardOrder,
};
