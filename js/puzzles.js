const Puzzles = (() => {
  const puzzles = {
    tower_key: {
      title: '🔑 Загадка башни',
      text: 'На столе лежат три ключа: золотой, серебряный и деревянный. Надпись гласит: «Открой дверь ключом среднего достоинства». Какой ключ выбрать?',
      options: [
        { text: '🥇 Золотой ключ', correct: false, hint: 'Золото — слишком ценно. Попробуй что-то скромнее.' },
        { text: '🥈 Серебряный ключ', correct: true, hint: '' },
        { text: '🪵 Деревянный ключ', correct: false, hint: 'Дерево — слишком просто. Среднее между золотом и деревом — серебро!' }
      ]
    },
    maze_path: {
      title: '🗺️ Лабиринт',
      text: 'Три тропы ведут вперёд. Знаки: ☀️ — солнце, 🌙 — луна, ⭐ — звезда. Подсказка на стене: «Иди туда, где светит вечный свет». Какой путь выбрать?',
      options: [
        { text: '☀️ Тропа солнца', correct: true, hint: '' },
        { text: '🌙 Тропа луны', correct: false, hint: 'Луна светит ночью, а нужен вечный свет — это солнце!' },
        { text: '⭐ Тропа звезды', correct: false, hint: 'Звезды далеко. Вечный свет — это солнце!' }
      ]
    },
    ghost_lever: {
      title: '👻 Призрачный зал',
      text: 'Три рычага: красный 🔴, синий 🔵, зелёный 🟢. Призрак шепчет: «Вспомни радугу: первый цвет — твой выбор». Какой рычаг нажать?',
      options: [
        { text: '🔴 Красный рычаг', correct: true, hint: '' },
        { text: '🔵 Синий рычаг', correct: false, hint: 'В радуге первый цвет — красный, не синий!' },
        { text: '🟢 Зелёный рычаг', correct: false, hint: 'Зелёный — в середине радуги. Первый — красный!' }
      ]
    },
    symbol_order: {
      title: '📜 Тайный код',
      text: 'На стене символы: 🔥 → 💧 → 🌿. Что идёт следующим по логике «огонь, вода, земля»?',
      options: [
        { text: '🔥 Огонь', correct: false, hint: 'Огонь уже был первым. Подумай о цикле стихий.' },
        { text: '💨 Воздух', correct: false, hint: 'Близко! Но по порядку стихий после земли идёт... попробуй снова.' },
        { text: '☀️ Солнце', correct: true, hint: '' }
      ]
    }
  };

  function show(puzzleId, onSuccess, onFail) {
    const puzzle = puzzles[puzzleId];
    if (!puzzle) return;

    const overlay = document.getElementById('puzzle-overlay');
    const title = document.getElementById('puzzle-title');
    const text = document.getElementById('puzzle-text');
    const options = document.getElementById('puzzle-options');
    const hint = document.getElementById('puzzle-hint');

    title.textContent = puzzle.title;
    text.textContent = puzzle.text;
    hint.classList.add('hidden');
    hint.textContent = '';
    options.innerHTML = '';

    puzzle.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'puzzle-option';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        AudioManager.play('button');
        if (opt.correct) {
          AudioManager.play('puzzleRight');
          overlay.classList.add('hidden');
          onSuccess();
        } else {
          AudioManager.play('puzzleWrong');
          hint.textContent = opt.hint || 'Попробуй ещё раз!';
          hint.classList.remove('hidden');
          onFail();
        }
      });
      options.appendChild(btn);
    });

    overlay.classList.remove('hidden');
  }

  function hide() {
    document.getElementById('puzzle-overlay').classList.add('hidden');
  }

  return { show, hide, puzzles };
})();
