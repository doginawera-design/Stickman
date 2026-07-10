const Levels = (() => {
  const LEVEL_DATA = [
    {
      id: 1,
      name: 'Лес',
      theme: 'forest',
      type: 'tutorial',
      hint: 'Используй кнопки ◀ ▶ для движения и ⬆ для прыжка. Собери звёзды!',
      enemy: null,
      puzzle: null,
      goalX: 700,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 },
        { x: 200, y: 270, w: 120, h: 15 },
        { x: 400, y: 220, w: 100, h: 15 },
        { x: 550, y: 280, w: 100, h: 15 }
      ],
      collectibles: [
        { type: 'star', x: 220, y: 240 },
        { type: 'star', x: 420, y: 190 },
        { type: 'coin', x: 350, y: 310 },
        { type: 'coin', x: 570, y: 250 },
        { type: 'star', x: 650, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 50, y: 280 }
    },
    {
      id: 2,
      name: 'Пещера',
      theme: 'cave',
      type: 'combat',
      hint: 'Подойди к слизню и нажми ⚔ для атаки!',
      enemy: { type: 'slime', x: 500, y: 300, hp: 40, damage: 10, patrolMin: 400, patrolMax: 650 },
      puzzle: null,
      goalX: 750,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 }
      ],
      collectibles: [
        { type: 'coin', x: 200, y: 310 },
        { type: 'coin', x: 300, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 50, y: 280 }
    },
    {
      id: 3,
      name: 'Болото',
      theme: 'swamp',
      type: 'platforming',
      hint: 'Перепрыгивай через болотные препятствия!',
      enemy: { type: 'bat', x: 400, y: 150, hp: 30, flying: true, speed: 2, damage: 10 },
      puzzle: null,
      goalX: 750,
      platforms: [
        { x: 0, y: 340, w: 150, h: 60 },
        { x: 200, y: 340, w: 100, h: 60 },
        { x: 370, y: 300, w: 80, h: 15 },
        { x: 500, y: 260, w: 80, h: 15 },
        { x: 620, y: 300, w: 80, h: 15 },
        { x: 730, y: 340, w: 170, h: 60 }
      ],
      collectibles: [
        { type: 'star', x: 390, y: 270 },
        { type: 'coin', x: 520, y: 230 },
        { type: 'star', x: 640, y: 270 }
      ],
      hazards: [
        { x: 150, y: 360, w: 50, h: 40, damage: 15 },
        { x: 300, y: 360, w: 70, h: 40, damage: 15 },
        { x: 450, y: 360, w: 50, h: 40, damage: 15 },
        { x: 580, y: 360, w: 40, h: 40, damage: 15 },
        { x: 700, y: 360, w: 30, h: 40, damage: 15 }
      ],
      playerStart: { x: 30, y: 280 }
    },
    {
      id: 4,
      name: 'Башня',
      theme: 'tower',
      type: 'puzzle',
      hint: 'Подойди к двери и реши загадку!',
      enemy: null,
      puzzle: 'tower_key',
      goalX: 700,
      doorX: 650,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 },
        { x: 300, y: 250, w: 100, h: 15 }
      ],
      collectibles: [
        { type: 'star', x: 320, y: 220 },
        { type: 'coin', x: 150, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 50, y: 280 }
    },
    {
      id: 5,
      name: 'Замок скелетов',
      theme: 'castle',
      type: 'combat',
      hint: 'Победи всех скелетов!',
      enemies: [
        { type: 'skeleton', x: 300, y: 300, hp: 35, damage: 12, patrolMin: 250, patrolMax: 400 },
        { type: 'skeleton', x: 500, y: 300, hp: 35, damage: 12, patrolMin: 450, patrolMax: 600 },
        { type: 'golem', x: 650, y: 280, hp: 60, damage: 18, w: 50, h: 50, patrolMin: 600, patrolMax: 750 }
      ],
      puzzle: null,
      goalX: 800,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 },
        { x: 150, y: 260, w: 80, h: 15 }
      ],
      collectibles: [
        { type: 'coin', x: 160, y: 230 },
        { type: 'coin', x: 400, y: 310 },
        { type: 'star', x: 550, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 50, y: 280 }
    },
    {
      id: 6,
      name: 'Огненная земля',
      theme: 'fire',
      type: 'hazard',
      hint: 'Избегай лавы! Прыгай по платформам.',
      enemy: { type: 'fire', x: 600, y: 200, hp: 50, flying: true, speed: 1.5, damage: 20 },
      puzzle: null,
      goalX: 750,
      platforms: [
        { x: 0, y: 340, w: 120, h: 60 },
        { x: 180, y: 310, w: 80, h: 15 },
        { x: 320, y: 270, w: 80, h: 15 },
        { x: 460, y: 240, w: 80, h: 15 },
        { x: 600, y: 270, w: 80, h: 15 },
        { x: 720, y: 340, w: 180, h: 60 }
      ],
      collectibles: [
        { type: 'star', x: 200, y: 280 },
        { type: 'coin', x: 340, y: 240 },
        { type: 'star', x: 480, y: 210 }
      ],
      hazards: [
        { x: 120, y: 370, w: 60, h: 30, damage: 25 },
        { x: 260, y: 370, w: 60, h: 30, damage: 25 },
        { x: 400, y: 370, w: 60, h: 30, damage: 25 },
        { x: 540, y: 370, w: 60, h: 30, damage: 25 },
        { x: 680, y: 370, w: 40, h: 30, damage: 25 }
      ],
      playerStart: { x: 30, y: 280 }
    },
    {
      id: 7,
      name: 'Лабиринт',
      theme: 'maze',
      type: 'puzzle',
      hint: 'Дойди до загадки и выбери правильный путь!',
      enemy: { type: 'spider', x: 400, y: 300, hp: 40, damage: 12, patrolMin: 350, patrolMax: 500 },
      puzzle: 'maze_path',
      goalX: 750,
      doorX: 600,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 }
      ],
      collectibles: [
        { type: 'coin', x: 200, y: 310 },
        { type: 'star', x: 500, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 50, y: 280 }
    },
    {
      id: 8,
      name: 'Призрачный зал',
      theme: 'ghost',
      type: 'puzzle',
      hint: 'Нажми на правильный рычаг, чтобы открыть путь!',
      enemy: { type: 'ghost', x: 350, y: 200, hp: 45, flying: true, speed: 1.8, damage: 15 },
      puzzle: 'ghost_lever',
      goalX: 750,
      doorX: 550,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 }
      ],
      collectibles: [
        { type: 'star', x: 150, y: 310 },
        { type: 'coin', x: 450, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 50, y: 280 }
    },
    {
      id: 9,
      name: 'Арена',
      theme: 'arena',
      type: 'boss',
      hint: 'Победи тёмного рыцаря!',
      enemy: { type: 'knight', x: 500, y: 270, hp: 100, damage: 20, boss: true, speed: 2.5, w: 50, h: 55, attackRange: 60 },
      puzzle: null,
      goalX: 750,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 }
      ],
      collectibles: [
        { type: 'star', x: 100, y: 310 },
        { type: 'star', x: 700, y: 310 }
      ],
      hazards: [],
      playerStart: { x: 80, y: 280 }
    },
    {
      id: 10,
      name: 'Логово дракона',
      theme: 'dragon',
      type: 'final',
      hint: 'Победи дракона и спаси принцессу!',
      enemy: { type: 'dragon', x: 500, y: 220, hp: 150, damage: 25, boss: true, speed: 1.8, w: 70, h: 50, attackRange: 80 },
      puzzle: null,
      goalX: 680,
      princessX: 720,
      platforms: [
        { x: 0, y: 340, w: 900, h: 60 },
        { x: 200, y: 260, w: 80, h: 15 },
        { x: 600, y: 260, w: 80, h: 15 }
      ],
      collectibles: [
        { type: 'star', x: 220, y: 230 },
        { type: 'coin', x: 400, y: 310 },
        { type: 'star', x: 620, y: 230 }
      ],
      hazards: [
        { x: 350, y: 370, w: 100, h: 30, damage: 20 }
      ],
      playerStart: { x: 50, y: 280 }
    }
  ];

  function get(levelId) {
    return LEVEL_DATA.find(l => l.id === levelId) || LEVEL_DATA[0];
  }

  function getTotal() {
    return LEVEL_DATA.length;
  }

  return { get, getTotal, LEVEL_DATA };
})();
