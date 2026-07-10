const AudioManager = (() => {
  let ctx = null;
  let enabled = true;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      enabled = false;
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!enabled || !ctx) return;
    resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playNoise(duration, volume = 0.1) {
    if (!enabled || !ctx) return;
    resume();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  const sounds = {
    button: () => playTone(600, 0.1, 'sine', 0.2),
    jump: () => { playTone(300, 0.08, 'sine'); playTone(500, 0.12, 'sine', 0.1); },
    attack: () => { playTone(200, 0.05, 'sawtooth', 0.2); playNoise(0.08, 0.08); },
    hit: () => playTone(150, 0.15, 'sawtooth', 0.15),
    coin: () => { playTone(800, 0.08, 'sine'); playTone(1200, 0.1, 'sine', 0.1); },
    victory: () => {
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 150);
      });
    },
    defeat: () => {
      [400, 350, 300, 200].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sawtooth', 0.15), i * 200);
      });
    },
    door: () => { playTone(400, 0.2, 'sine'); setTimeout(() => playTone(600, 0.3, 'sine', 0.15), 200); },
    finalVictory: () => {
      const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
      melody.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.4, 'sine', 0.2), i * 200);
      });
    },
    enemyHit: () => playTone(100, 0.1, 'sawtooth', 0.12),
    puzzleWrong: () => playTone(200, 0.2, 'triangle', 0.15),
    puzzleRight: () => { playTone(500, 0.15, 'sine'); setTimeout(() => playTone(700, 0.2, 'sine', 0.15), 150); }
  };

  function play(name) {
    if (!enabled) return;
    const fn = sounds[name];
    if (fn) fn();
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function isEnabled() { return enabled; }

  function setEnabled(val) { enabled = val; }

  return { init, play, toggle, isEnabled, setEnabled, resume };
})();
