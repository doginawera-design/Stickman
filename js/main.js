const Confetti = (() => {
  let canvas, ctx, particles, animId;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
  }

  function start() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    particles = [];
    const colors = ['#ff6b35', '#4ecdc4', '#ffe66d', '#e74c3c', '#9b59b6', '#3498db'];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }

    if (animId) cancelAnimationFrame(animId);
    animate();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    animId = requestAnimationFrame(animate);
  }

  function stop() {
    if (animId) cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { init, start, stop };
})();

const App = (() => {
  let saveData;
  let currentLevel = 1;
  let previousScreen = 'menu-screen';

  const screens = {
    menu: 'menu-screen',
    game: 'game-screen',
    pause: 'pause-screen',
    defeat: 'defeat-screen',
    levelComplete: 'level-complete-screen',
    finalVictory: 'final-victory-screen',
    achievements: 'achievements-screen'
  };

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function showOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function hideOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  function init() {
    AudioManager.init();
    saveData = Storage.load();
    currentLevel = saveData.currentLevel || 1;

    if (saveData.soundEnabled !== undefined) {
      AudioManager.setEnabled(saveData.soundEnabled);
      updateSoundButton();
    }

    const gameCanvas = document.getElementById('game-canvas');
    GameEngine.init(gameCanvas);

    const menuCanvas = document.getElementById('menu-canvas');
    GameEngine.drawMenuHero(menuCanvas);

    const confettiCanvas = document.getElementById('confetti-canvas');
    Confetti.init(confettiCanvas);

    setupControls();
    setupButtons();
    updateContinueButton();
  }

  function updateContinueButton() {
    const btn = document.getElementById('btn-continue');
    if (btn) btn.style.display = currentLevel > 1 ? 'block' : 'none';
  }

  function updateSoundButton() {
    const btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = AudioManager.isEnabled() ? '🔊' : '🔇';
  }

  function startGame(level) {
    currentLevel = level;
    saveData.currentLevel = level;
    Storage.save(saveData);

    showScreen(screens.game);
    GameEngine.loadLevel(level, saveData);
    GameEngine.setCallbacks({
      onLevelComplete: handleLevelComplete,
      onPlayerDeath: handlePlayerDeath,
      onPuzzleNeeded: handlePuzzle
    });
    GameEngine.start();
    AudioManager.resume();
  }

  function handlePuzzle(puzzleId, onSuccess, onFail) {
    Puzzles.show(puzzleId, onSuccess, onFail);
  }

  function handleLevelComplete(levelStats) {
    const newlyUnlocked = Achievements.onLevelComplete(currentLevel, saveData, levelStats);

    if (currentLevel >= Levels.getTotal()) {
      showFinalVictory();
    } else {
      const text = document.getElementById('level-complete-text');
      let msg = `${Levels.get(currentLevel).name} пройден!`;
      if (newlyUnlocked.length > 0) {
        msg += '\n🏆 Новое достижение!';
      }
      if (text) text.textContent = msg;
      showOverlay(screens.levelComplete);
    }
  }

  function handlePlayerDeath() {
    showOverlay(screens.defeat);
  }

  function nextLevel() {
    hideOverlay(screens.levelComplete);
    currentLevel++;
    if (currentLevel > Levels.getTotal()) {
      showFinalVictory();
    } else {
      saveData.currentLevel = currentLevel;
      Storage.save(saveData);
      startGame(currentLevel);
    }
  }

  function showFinalVictory() {
    hideOverlay(screens.levelComplete);
    showScreen(screens.finalVictory);
    Confetti.start();
    AudioManager.play('finalVictory');
    drawFinalScene();
  }

  function drawFinalScene() {
    const c = document.getElementById('final-scene-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    Entities.drawBackground(ctx, 300, 200, 'dragon');
    ctx.fillStyle = 'rgba(139,115,85,0.9)';
    ctx.fillRect(0, 165, 300, 35);

    const princess = new Entities.Princess(200, 110);
    princess.draw(ctx);

    const player = new Entities.Player(120, 105);
    player.victoryPose = true;
    player.facing = 1;
    player.draw(ctx);

    ctx.fillStyle = '#ffe66d';
    for (let i = 0; i < 5; i++) {
      const sx = 50 + i * 50;
      const sy = 30 + Math.sin(i) * 10;
      ctx.font = '16px sans-serif';
      ctx.fillText('✨', sx, sy);
    }
  }

  function setupControls() {
    const buttons = {
      'btn-left': 'left',
      'btn-right': 'right',
      'btn-jump': 'jump',
      'btn-attack': 'attack'
    };

    Object.entries(buttons).forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const start = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        GameEngine.setInput(action, true);
      };
      const end = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        GameEngine.setInput(action, false);
      };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    });

    document.addEventListener('keydown', (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', Space: 'attack', KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyJ: 'attack' };
      if (map[e.code]) {
        GameEngine.setInput(map[e.code], true);
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', Space: 'attack', KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyJ: 'attack' };
      if (map[e.code]) GameEngine.setInput(map[e.code], false);
    });
  }

  function setupButtons() {
    bind('btn-start', () => {
      AudioManager.play('button');
      saveData = Storage.reset();
      currentLevel = 1;
      startGame(1);
    });

    bind('btn-continue', () => {
      AudioManager.play('button');
      startGame(currentLevel);
    });

    bind('btn-achievements-menu', () => {
      AudioManager.play('button');
      previousScreen = screens.menu;
      showAchievements();
    });

    bind('btn-sound', () => {
      const enabled = AudioManager.toggle();
      saveData.soundEnabled = enabled;
      Storage.save(saveData);
      updateSoundButton();
      if (enabled) AudioManager.play('button');
    });

    bind('btn-pause', () => {
      AudioManager.play('button');
      GameEngine.pause();
      showOverlay(screens.pause);
    });

    bind('btn-resume', () => {
      AudioManager.play('button');
      hideOverlay(screens.pause);
      GameEngine.resume();
    });

    bind('btn-restart-level', () => {
      AudioManager.play('button');
      hideOverlay(screens.pause);
      startGame(currentLevel);
    });

    bind('btn-quit', () => {
      AudioManager.play('button');
      GameEngine.stop();
      Puzzles.hide();
      hideOverlay(screens.pause);
      showScreen(screens.menu);
      GameEngine.drawMenuHero(document.getElementById('menu-canvas'));
    });

    bind('btn-retry', () => {
      AudioManager.play('button');
      hideOverlay(screens.defeat);
      startGame(currentLevel);
    });

    bind('btn-defeat-menu', () => {
      AudioManager.play('button');
      hideOverlay(screens.defeat);
      GameEngine.stop();
      showScreen(screens.menu);
    });

    bind('btn-next-level', () => {
      AudioManager.play('button');
      nextLevel();
    });

    bind('btn-play-again', () => {
      AudioManager.play('button');
      Confetti.stop();
      hideOverlay(screens.finalVictory);
      saveData = Storage.reset();
      currentLevel = 1;
      showScreen(screens.menu);
      updateContinueButton();
    });

    bind('btn-view-achievements', () => {
      AudioManager.play('button');
      previousScreen = screens.finalVictory;
      showAchievements();
    });

    bind('btn-achievements-back', () => {
      AudioManager.play('button');
      hideOverlay(screens.achievements);
      if (previousScreen === screens.finalVictory) {
        showScreen(screens.finalVictory);
      } else {
        showScreen(screens.menu);
      }
    });
  }

  function bind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  function showAchievements() {
    const list = document.getElementById('achievements-list');
    Achievements.renderList(list, saveData);
    showOverlay(screens.achievements);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
