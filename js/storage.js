const Storage = (() => {
  const KEY = 'stickman_princess_save';

  const defaults = {
    currentLevel: 1,
    wins: 0,
    defeats: 0,
    coins: 0,
    stars: 0,
    enemiesDefeated: 0,
    achievements: [],
    soundEnabled: true
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return { ...defaults };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Не удалось сохранить прогресс:', e);
    }
  }

  function reset() {
    localStorage.removeItem(KEY);
    return { ...defaults };
  }

  function update(partial) {
    const data = { ...load(), ...partial };
    save(data);
    return data;
  }

  return { load, save, reset, update, defaults };
})();
