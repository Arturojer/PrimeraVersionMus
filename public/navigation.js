// navigation.js — Screen navigation & lobby management
(function () {
  'use strict';

  // ── Global state ──
  window.QuantumMusState = {
    playerName: '',
    roomCode: '',
    isHost: false,
    players: [],
    gameMode: '4'
  };

  // ── Helpers ──
  function generateRoomCode() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var code = '';
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  window.generateRoomCode = generateRoomCode;

  // ── Screen navigation ──
  function showScreen(name) {
    var screens = document.querySelectorAll('.screen');
    var gameScreen = document.getElementById('game-screen');

    // Hide game screen whenever we navigate away from it
    if (gameScreen) gameScreen.style.display = 'none';

    // Remove active from all .screen elements
    screens.forEach(function (s) { s.classList.remove('active'); });

    if (name === 'game') {
      // Special case: game screen is not a .screen, just toggle display
      if (gameScreen) gameScreen.style.display = 'block';
      return;
    }

    var target = document.getElementById(name + '-screen');
    if (target) target.classList.add('active');
  }
  window.showScreen = showScreen;

  // ── Socket helpers ──
  function ensureSocket() {
    if (!window.socket) {
      window.socket = io();
      bindSocketEvents(window.socket);
    }
    return window.socket;
  }

  function bindSocketEvents(socket) {
    socket.on('salaCreada', function (data) {
      window.QuantumMusState.roomCode = data.codigo;
      window.QuantumMusState.isHost = true;
      document.getElementById('lobby-room-code').textContent = 'Código: ' + data.codigo;
      showScreen('lobby');
    });

    socket.on('jugadorUnido', function (data) {
      var state = window.QuantumMusState;
      if (data.codigo) state.roomCode = data.codigo;
      state.players = data.jugadores || [];
      updatePlayerList(state.players);

      var btnStart = document.getElementById('btn-start-game');
      if (btnStart) btnStart.disabled = state.players.length < 4;
    });

    socket.on('errorSala', function (data) {
      alert(data.mensaje);
    });

    socket.on('iniciarJuego', function () {
      showScreen('game');
    });
  }

  function updatePlayerList(players) {
    var slots = document.querySelectorAll('#lobby-player-list .lobby-slot');
    slots.forEach(function (li, idx) {
      var nameSpan = li.querySelector('.slot-name');
      if (players[idx]) {
        nameSpan.textContent = players[idx].nombre || players[idx].name || '— vacío —';
      } else {
        nameSpan.textContent = '— vacío —';
      }
    });
  }

  // ── Wire up buttons after DOM is ready ──
  document.addEventListener('DOMContentLoaded', function () {

    // 1. Portada → Name
    document.getElementById('btn-jugar').addEventListener('click', function () {
      showScreen('name');
    });

    // 2. Name → Menu (creates socket)
    document.getElementById('btn-continuar').addEventListener('click', function () {
      var name = document.getElementById('input-nombre').value.trim();
      if (!name) return;
      window.QuantumMusState.playerName = name;
      ensureSocket();
      showScreen('menu');
    });

    // 3. Menu → Crear partida → Lobby
    document.getElementById('btn-crear').addEventListener('click', function () {
      var socket = ensureSocket();
      socket.emit('crearSala', { nombre: window.QuantumMusState.playerName });
    });

    // 4. Menu → Code screen
    document.getElementById('btn-unirse').addEventListener('click', function () {
      showScreen('code');
    });

    // 5. Code → Join room → Lobby
    document.getElementById('btn-unirse-sala').addEventListener('click', function () {
      var code = document.getElementById('input-codigo').value.trim().toUpperCase();
      if (!code) return;
      window.QuantumMusState.roomCode = code;
      var socket = ensureSocket();
      socket.emit('unirseSala', {
        nombre: window.QuantumMusState.playerName,
        codigo: code
      });
      showScreen('lobby');
      document.getElementById('lobby-room-code').textContent = 'Código: ' + code;
    });

    // Code → Back to menu
    document.getElementById('btn-volver-code').addEventListener('click', function () {
      showScreen('menu');
    });

    // 6. Lobby → Start game (host only)
    document.getElementById('btn-start-game').addEventListener('click', function () {
      var socket = ensureSocket();
      socket.emit('iniciarPartida', { codigo: window.QuantumMusState.roomCode });
    });

    // Lobby → Leave
    document.getElementById('btn-leave-lobby').addEventListener('click', function () {
      window.QuantumMusState.isHost = false;
      window.QuantumMusState.players = [];
      showScreen('menu');
    });

    // Game mode radio buttons
    var modeRadios = document.querySelectorAll('input[name="gameMode"]');
    modeRadios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        window.QuantumMusState.gameMode = this.value === '8reyes' ? '8' : '4';
      });
    });

    // 7. Game Over → Play again
    document.getElementById('btn-play-again').addEventListener('click', function () {
      showScreen('lobby');
    });

    // 8. Game Over → Exit
    document.getElementById('btn-exit').addEventListener('click', function () {
      showScreen('portada');
    });
  });
})();
