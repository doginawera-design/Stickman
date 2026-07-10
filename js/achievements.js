const Achievements = (() => {
  const LIST = [
    { id: 'first_step', name: 'Первый шаг', desc: 'Пройти 1 уровень', icon: '👣' },
    { id: 'monster_slayer', name: 'Победитель чудовищ', desc: 'Победить 5 врагов', icon: '⚔️' },
    { id: 'logician', name: 'Логик', desc: 'Пройти уровень с загадкой', icon: '🧩' },
    { id: 'flawless', name: 'Без поражений', desc: 'Пройти уровень без потери здоровья', icon: '💎' },
    { id: 'princess_saver', name: 'Спасатель принцессы', desc: 'Пройти всю игру', icon: '👸' }
  ];

  function unlock(id, saveData) {
    if (!saveData.achievements.includes(id)) {
      saveData.achievements.push(id);
      Storage.save(saveData);
      return true;
    }
    return false;
  }

  function check(id, saveData) {
    return saveData.achievements.includes(id);
  }

  function onLevelComplete(levelNum, saveData, levelStats) {
    const newlyUnlocked = [];

    if (levelNum >= 1 && unlock('first_step', saveData)) newlyUnlocked.push('first_step');

    if (saveData.enemiesDefeated >= 5 && unlock('monster_slayer', saveData)) {
      newlyUnlocked.push('monster_slayer');
    }

    const puzzleLevels = [4, 7, 8];
    if (puzzleLevels.includes(levelNum) && unlock('logician', saveData)) {
      newlyUnlocked.push('logician');
    }

    if (levelStats.noDamage && unlock('flawless', saveData)) {
      newlyUnlocked.push('flawless');
    }

    if (levelNum >= 10 && unlock('princess_saver', saveData)) {
      newlyUnlocked.push('princess_saver');
    }

    return newlyUnlocked;
  }

  function renderList(container, saveData) {
    container.innerHTML = '';
    LIST.forEach(a => {
      const unlocked = check(a.id, saveData);
      const li = document.createElement('li');
      li.className = unlocked ? 'unlocked' : 'achievement-locked';
      li.innerHTML = `
        <span class="achievement-icon">${unlocked ? a.icon : '🔒'}</span>
        <div class="achievement-info">
          <span class="achievement-name">${a.name}</span>
          <span class="achievement-desc">${a.desc}</span>
        </div>
      `;
      container.appendChild(li);
    });
  }

  return { LIST, unlock, check, onLevelComplete, renderList };
})();
