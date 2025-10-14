// src/js/utils.js - COMPLETE Enhanced Utilities and Sound Manager

export function computeAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.5;
    this.initializeSounds();
  }

  initializeSounds() {
    const soundPaths = {
      'hit': '/src/assets/sounds/playerHit.wav',
      'punch': '/src/assets/sounds/punch.mp3',
      'combo': '/src/assets/sounds/combo.wav',
      'miss': '/src/assets/sounds/punch.mp3',
      'target': '/src/assets/sounds/punch.mp3',
      'start': '/src/assets/sounds/punch.mp3',
      'levelup': '/src/assets/sounds/combo.wav',
      'background': '/src/assets/sounds/punch.mp3',
    };

    for (const [id, path] of Object.entries(soundPaths)) {
      try {
        const audio = new Audio(path);
        audio.volume = this.volume;
        audio.preload = 'auto';
        this.sounds.set(id, audio);
      } catch (e) {
        console.warn(`Failed to load sound: ${id}`, e);
      }
    }
  }

  play(soundId, options = {}) {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundId);
    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    try {
      const audioClone = sound.cloneNode();
      audioClone.volume = options.volume !== undefined ? options.volume : this.volume;
      
      if (options.loop) {
        audioClone.loop = true;
      }

      audioClone.play().catch(e => {
        console.debug('Sound play blocked:', e);
      });

      return audioClone;
    } catch (e) {
      console.warn(`Failed to play sound: ${soundId}`, e);
    }
  }

  stop(soundId) {
    const sound = this.sounds.get(soundId);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const soundManager = new SoundManager();

export function playSound(soundId, options) {
  return soundManager.play(soundId, options);
}

export function stopSound(soundId) {
  soundManager.stop(soundId);
}

export function setSoundVolume(volume) {
  soundManager.setVolume(volume);
}

export function toggleSound() {
  return soundManager.toggle();
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class FPSCounter {
  constructor() {
    this.frames = [];
    this.lastTime = performance.now();
  }

  update() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    
    this.frames.push(delta);
    if (this.frames.length > 60) {
      this.frames.shift();
    }
  }

  getFPS() {
    if (this.frames.length === 0) return 0;
    const avgDelta = this.frames.reduce((a, b) => a + b) / this.frames.length;
    return Math.round(1000 / avgDelta);
  }
}

export class StateManager {
  constructor() {
    this.state = {
      highScore: 0,
      totalPunches: 0,
      bestCombo: 0,
      trainingTime: 0,
      achievements: [],
      sessions: 0,
      perfectPunches: 0,
    };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    console.log(`State updated: ${key} = ${value}`);
  }

  increment(key, amount = 1) {
    this.state[key] = (this.state[key] || 0) + amount;
  }

  getAll() {
    return { ...this.state };
  }

  reset() {
    this.state = {
      highScore: 0,
      totalPunches: 0,
      bestCombo: 0,
      trainingTime: 0,
      achievements: [],
      sessions: 0,
      perfectPunches: 0,
    };
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.state = { ...this.state, ...data };
      console.log('State imported successfully');
      return true;
    } catch (e) {
      console.error('Failed to import state:', e);
      return false;
    }
  }
}

export const gameState = new StateManager();

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function normalize(value, min, max) {
  return (value - min) / (max - min);
}

export function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await wait(interval);
  }
}

export function createParticle(x, y, color = '#FFD700') {
  const particle = document.createElement('div');
  particle.style.position = 'fixed';
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  particle.style.width = '10px';
  particle.style.height = '10px';
  particle.style.borderRadius = '50%';
  particle.style.backgroundColor = color;
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '9999';
  
  const angle = Math.random() * Math.PI * 2;
  const velocity = 50 + Math.random() * 100;
  const tx = Math.cos(angle) * velocity;
  const ty = Math.sin(angle) * velocity;
  
  particle.style.setProperty('--tx', tx + 'px');
  particle.style.setProperty('--ty', ty + 'px');
  
  document.body.appendChild(particle);
  
  particle.style.animation = 'particleExplode 0.8s ease-out forwards';
  
  setTimeout(() => particle.remove(), 800);
  
  return particle;
}

export function createExplosion(x, y, particleCount = 12, colors = ['#FFD700', '#FFA500', '#FF6347']) {
  for (let i = 0; i < particleCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    setTimeout(() => {
      createParticle(x, y, color);
    }, i * 20);
  }
}

export function vibrateDevice(pattern = 200) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
}

export function downloadAsJSON(data, filename = 'train-like-aj-data.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

export function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
}

export function requestFullscreen(element = document.documentElement) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  }
}

export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  }
}

export function logPerformance(label, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function logAsyncPerformance(label, asyncFn) {
  const start = performance.now();
  const result = await asyncFn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export const Utils = {
  computeAngle,
  playSound,
  stopSound,
  setSoundVolume,
  toggleSound,
  debounce,
  throttle,
  formatTime,
  distance,
  lerp,
  clamp,
  randomInt,
  easeInOutQuad,
  easeOutCubic,
  easeInOutCubic,
  degToRad,
  radToDeg,
  map,
  normalize,
  getRandomElement,
  shuffleArray,
  wait,
  waitForCondition,
  createParticle,
  createExplosion,
  vibrateDevice,
  copyToClipboard,
  downloadAsJSON,
  isMobileDevice,
  isTouchDevice,
  getDevicePixelRatio,
  fullscreenElement,
  requestFullscreen,
  exitFullscreen,
  logPerformance,
  logAsyncPerformance,
};

export default Utils;