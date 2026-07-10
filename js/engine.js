const GameEngine = (() => {
  let canvas, ctx;
  let width, height;
  let player, enemies, collectibles, platforms, hazards;
  let levelData;
  let camera = { x: 0 };
  let input = { left: false, right: false, jump: false, attack: false };
  let state = 'playing';
  let puzzleSolved = false;
  let doorOpen = false;
  let levelStats = { noDamage: true, startHp: 100 };
  let princess = null;
  let messageTimer = 0;
  let messageText = '';
  let onLevelComplete = null;
  let onPlayerDeath = null;
  let onPuzzleNeeded = null;
  let saveData = null;
  let animId = null;
  let worldWidth = 900;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loadLevel(levelId, save) {
    saveData = save;
    levelData = Levels.get(levelId);
    puzzleSolved = !levelData.puzzle;
    doorOpen = !levelData.doorX;
    levelStats = { noDamage: true, startHp: 100 };

    player = new Entities.Player(levelData.playerStart.x, levelData.playerStart.y);
    player.hp = player.maxHp;
    levelStats.startHp = player.maxHp;

    platforms = levelData.platforms.map(p => ({ ...p }));
    hazards = (levelData.hazards || []).map(h => ({ ...h }));
    collectibles = (levelData.collectibles || []).map(c => new Entities.Collectible(c.type, c.x, c.y));

    enemies = [];
    if (levelData.enemy) {
      const e = levelData.enemy;
      enemies.push(new Entities.Enemy(e.type, e.x, e.y, e));
    }
    if (levelData.enemies) {
      levelData.enemies.forEach(e => {
        enemies.push(new Entities.Enemy(e.type, e.x, e.y, e));
      });
    }

    princess = null;
    if (levelData.princessX) {
      princess = new Entities.Princess(levelData.princessX, 285);
    }

    camera.x = 0;
    state = 'playing';
    messageTimer = 0;

    if (levelData.hint) {
      showMessage(levelData.hint, 180);
    }
  }

  function showMessage(text, duration) {
    messageText = text;
    messageTimer = duration;
    const el = document.getElementById('message-overlay');
    const txt = document.getElementById('message-text');
    if (el && txt) {
      txt.textContent = text;
      el.classList.remove('hidden');
    }
  }

  function setInput(key, val) {
    if (input.hasOwnProperty(key)) input[key] = val;
  }

  function setCallbacks(callbacks) {
    onLevelComplete = callbacks.onLevelComplete;
    onPlayerDeath = callbacks.onPlayerDeath;
    onPuzzleNeeded = callbacks.onPuzzleNeeded;
  }

  function start() {
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function stop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
  }

  function pause() { state = 'paused'; }
  function resume() { if (state === 'paused') state = 'playing'; }

  function loop() {
    if (state === 'playing') update();
    render();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    if (messageTimer > 0) {
      messageTimer--;
      if (messageTimer <= 0) {
        const el = document.getElementById('message-overlay');
        if (el) el.classList.add('hidden');
      }
    }

    const prevHp = player.hp;
    player.update(input, platforms, hazards);

    if (player.hp < prevHp) levelStats.noDamage = false;

    enemies.forEach(e => e.update(player, platforms));
    collectibles.forEach(c => c.update());

    collectibles.forEach(c => {
      if (c.collides(player)) {
        c.collected = true;
        AudioManager.play('coin');
        if (c.type === 'coin') saveData.coins++;
        else saveData.stars++;
        Storage.save(saveData);
        updateHUD();
      }
    });

    enemies.forEach(e => {
      if (!e.alive && !e.counted) {
        e.counted = true;
        saveData.enemiesDefeated++;
        Storage.save(saveData);
      }
    });

    if (levelData.doorX && !doorOpen && player.x + player.w > levelData.doorX - 30) {
      if (!puzzleSolved && onPuzzleNeeded) {
        state = 'puzzle';
        onPuzzleNeeded(levelData.puzzle, () => {
          puzzleSolved = true;
          doorOpen = true;
          state = 'playing';
          AudioManager.play('door');
          showMessage('🚪 Дверь открыта!', 90);
        }, () => {});
      }
    }

    if (player.hp <= 0) {
      state = 'dead';
      saveData.defeats++;
      Storage.save(saveData);
      AudioManager.play('defeat');
      if (onPlayerDeath) onPlayerDeath();
      return;
    }

    const allEnemiesDead = enemies.length === 0 || enemies.every(e => !e.alive);
    const combatRequired = levelData.type === 'combat' || levelData.type === 'boss' || levelData.type === 'final' || levelData.enemies;

    let canFinish = player.x >= levelData.goalX;
    if (combatRequired && !allEnemiesDead) canFinish = false;
    if (levelData.doorX && !doorOpen) canFinish = false;

    if (levelData.type === 'final' && allEnemiesDead && princess && state === 'playing') {
      canFinish = true;
    }

    if (canFinish && state === 'playing') {
      if (levelData.type === 'final' && princess) {
        state = 'victory_walk';
        player.victoryPose = false;
      } else {
        completeLevel();
      }
    }

    if (state === 'victory_walk') {
      const targetX = princess.x - 35;
      const dir = targetX > player.x ? 1 : -1;
      player.vx = dir * 2;
      player.x += player.vx;
      player.state = 'run';
      player.facing = dir;
      if (Math.abs(player.x - targetX) < 5) {
        player.x = targetX;
        player.victoryPose = true;
        player.vx = 0;
        player.state = 'idle';
        state = 'final_victory';
        setTimeout(() => completeLevel(), 1500);
      }
    }

    camera.x = Math.max(0, Math.min(player.x - width / 3, worldWidth - width));
    updateHUD();
  }

  function completeLevel() {
    state = 'complete';
    stop();
    saveData.wins++;
    Storage.save(saveData);
    AudioManager.play('victory');
    if (onLevelComplete) onLevelComplete(levelStats);
  }

  function updateHUD() {
    const playerHp = document.getElementById('player-hp');
    const enemyHp = document.getElementById('enemy-hp');
    const enemyBar = document.getElementById('enemy-bar-group');
    const enemyName = document.getElementById('enemy-name');
    const coinsDisplay = document.getElementById('coins-display');
    const starsDisplay = document.getElementById('stars-display');
    const levelLabel = document.getElementById('level-label');
    const levelName = document.getElementById('level-name');

    if (playerHp) playerHp.style.width = (player.hp / player.maxHp * 100) + '%';

    const aliveEnemy = enemies.find(e => e.alive);
    if (aliveEnemy && enemyBar) {
      enemyBar.style.display = 'flex';
      if (enemyHp) enemyHp.style.width = (aliveEnemy.hp / aliveEnemy.maxHp * 100) + '%';
      const names = {
        slime: 'Слизень', bat: 'Летучая мышь', golem: 'Голем',
        skeleton: 'Скелет', fire: 'Огненный монстр', troll: 'Тролль',
        spider: 'Паук', ghost: 'Призрак', knight: 'Тёмный рыцарь', dragon: 'Дракон'
      };
      if (enemyName) enemyName.textContent = names[aliveEnemy.type] || 'Враг';
    } else if (enemyBar) {
      enemyBar.style.display = levelData.enemy || levelData.enemies ? 'flex' : 'none';
      if (enemyHp) enemyHp.style.width = '0%';
    }

    if (coinsDisplay) coinsDisplay.textContent = '🪙 ' + (saveData?.coins || 0);
    if (starsDisplay) starsDisplay.textContent = '⭐ ' + (saveData?.stars || 0);
    if (levelLabel) levelLabel.textContent = 'Уровень ' + levelData.id;
    if (levelName) levelName.textContent = levelData.name;
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-camera.x, 0);

    Entities.drawBackground(ctx, worldWidth, height, levelData.theme);

    platforms.forEach(p => {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      grad.addColorStop(0, 'rgba(139,115,85,0.9)');
      grad.addColorStop(1, 'rgba(101,84,62,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(p.x, p.y, p.w, 3);
    });

    hazards.forEach(h => {
      const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
      ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
      for (let i = 0; i < h.w; i += 15) {
        ctx.beginPath();
        ctx.arc(h.x + i + 7, h.y + 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (levelData.doorX && !doorOpen) {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(levelData.doorX, 260, 50, 80);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(levelData.doorX + 40, 310, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (levelData.doorX && doorOpen) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(levelData.doorX, 260, 50, 80);
    }

    collectibles.forEach(c => c.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    if (princess) princess.draw(ctx);
    player.draw(ctx);

    if (levelData.goalX) {
      const gx = levelData.goalX;
      ctx.strokeStyle = 'rgba(255, 230, 109, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(gx, 200);
      ctx.lineTo(gx, 340);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 230, 109, 0.3)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏁', gx, 195);
    }

    ctx.restore();
  }

  function getState() { return state; }
  function getLevelData() { return levelData; }
  function getPlayer() { return player; }

  function drawMenuHero(canvasEl) {
    const c = canvasEl.getContext('2d');
    const p = new Entities.Player(45, 30);
    p.state = 'idle';
    c.clearRect(0, 0, 120, 160);
    Entities.drawBackground(c, 120, 160, 'forest');
    c.fillStyle = 'rgba(139,115,85,0.9)';
    c.fillRect(0, 130, 120, 30);
    p.draw(c);
  }

  return {
    init, loadLevel, start, stop, pause, resume,
    setInput, setCallbacks, showMessage,
    getState, getLevelData, getPlayer, updateHUD,
    drawMenuHero, resize
  };
})();
