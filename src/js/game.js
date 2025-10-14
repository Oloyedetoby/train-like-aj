// src/js/game.js - V2 Complete with 8 Punch Types & Progressive Unlocking
import { playSound, stopSound } from '/src/js/utils.js';

let timerInterval;
let timeLeft = 180;

export function startTimedMode(timerElement) {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = 180;
  timerInterval = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerElement.textContent = '0:00';
      showNotification('Time\'s up! Round over!', 'success');
    }
  }, 1000);
}

export function startSurvivalMode(timerElement) {
  let survivalTime = 0;
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    survivalTime++;
    const minutes = Math.floor(survivalTime / 60);
    const seconds = survivalTime % 60;
    timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, 1000);
  
  showNotification('Survival Mode: Keep punching!', 'info');
}

export class FocusMittDrill {
  constructor(uiElements, onScore) {
    this.jabTarget = uiElements.jabTarget;
    this.crossTarget = uiElements.crossTarget;
    this.onScore = onScore;
    this.activePunch = null;
    this.activeTarget = null;
    this.drillTimeout = null;
    this.isRunning = false;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.lastHitTime = 0;
    this.comboResetDelay = 3000;
    this.level = 1;
    this.hitsInLevel = 0;
    this.hitsPerLevel = 10;
    this.baseReactionTime = 2500;
    this.minReactionTime = 800;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.perfectHits = 0;
    this.availablePunchTypes = ['Jab', 'Cross'];
  }

  start() {
    console.log("🥊 Focus Mitt Drill Started!");
    this.isRunning = true;
    this.resetStats();
    playSound('start');
    showNotification('Focus Mitt Drill Started!', 'info');
    this.updateAvailablePunches();
    this.nextChallenge();
  }

  stop() {
    this.isRunning = false;
    clearTimeout(this.drillTimeout);
    this.hideAllTargets();
    stopSound('background');
    
    const accuracy = this.totalHits + this.totalMisses > 0 
      ? ((this.totalHits / (this.totalHits + this.totalMisses)) * 100).toFixed(1) 
      : 0;
    
    showNotification(
      `Drill Complete!\nHits: ${this.totalHits} | Misses: ${this.totalMisses}\nAccuracy: ${accuracy}%\nMax Combo: ${this.comboCount}\nLevel Reached: ${this.level}`,
      'success'
    );
    console.log("Focus Mitt Drill Stopped.");
  }

  resetStats() {
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.level = 1;
    this.hitsInLevel = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.perfectHits = 0;
    this.availablePunchTypes = ['Jab', 'Cross'];
  }

  hideAllTargets() {
    this.jabTarget.classList.remove('visible');
    this.crossTarget.classList.remove('visible');
  }

  updateAvailablePunches() {
    if (this.level >= 3 && !this.availablePunchTypes.includes('Left Hook')) {
      this.availablePunchTypes.push('Left Hook', 'Right Hook');
      showNotification('🎉 Hooks Unlocked!', 'success');
    }
    if (this.level >= 5 && !this.availablePunchTypes.includes('Left Uppercut')) {
      this.availablePunchTypes.push('Left Uppercut', 'Right Uppercut');
      showNotification('🎉 Uppercuts Unlocked!', 'success');
    }
    if (this.level >= 7 && !this.availablePunchTypes.includes('Left Body')) {
      this.availablePunchTypes.push('Left Body', 'Right Body');
      showNotification('🎉 Body Shots Unlocked!', 'success');
    }
  }

  getCurrentReactionTime() {
    const reactionTime = Math.max(
      this.baseReactionTime - (this.level - 1) * 150,
      this.minReactionTime
    );
    return reactionTime;
  }

  getDelayBetweenPunches() {
    return Math.max(800 - (this.level - 1) * 40, 250);
  }

  nextChallenge() {
    if (!this.isRunning) return;

    this.hideAllTargets();
    
    const now = Date.now();
    if (now - this.lastHitTime > this.comboResetDelay && this.comboCount > 0) {
      this.resetCombo();
    }
    
    setTimeout(() => {
      if (!this.isRunning) return;
      
      const punchType = this.availablePunchTypes[
        Math.floor(Math.random() * this.availablePunchTypes.length)
      ];
      
      this.showTarget(punchType);
      playSound('target');
      
      const reactionTime = this.getCurrentReactionTime();
      this.drillTimeout = setTimeout(() => this.handleMiss(), reactionTime);
      
    }, this.getDelayBetweenPunches());
  }

  showTarget(punchType) {
    this.activePunch = punchType;
    
    let target;
    if (punchType.includes('Jab')) {
      target = this.jabTarget;
      target.textContent = 'JAB';
    } else if (punchType.includes('Cross')) {
      target = this.crossTarget;
      target.textContent = 'CROSS';
    } else if (punchType.includes('Hook')) {
      target = punchType.includes('Left') ? this.jabTarget : this.crossTarget;
      target.textContent = punchType.includes('Left') ? 'L HOOK' : 'R HOOK';
    } else if (punchType.includes('Uppercut')) {
      target = punchType.includes('Left') ? this.jabTarget : this.crossTarget;
      target.textContent = punchType.includes('Left') ? 'L UPPER' : 'R UPPER';
    } else if (punchType.includes('Body')) {
      target = punchType.includes('Left') ? this.jabTarget : this.crossTarget;
      target.textContent = punchType.includes('Left') ? 'L BODY' : 'R BODY';
    }
    
    this.activeTarget = target;
    target.classList.add('visible');
    target.style.animation = 'targetPulse 0.5s ease-out';
  }

  checkPunch(detectedPunch, punchData = {}) {
    if (!this.isRunning || !this.activePunch) return;

    const normalized = this.normalizePunchName(detectedPunch);
    const expected = this.normalizePunchName(this.activePunch);

    if (normalized === expected) {
      this.handleHit(punchData);
    }
  }

  normalizePunchName(punchName) {
    return punchName.toLowerCase()
      .replace(/\s+/g, '')
      .replace('lefthook', 'lhook')
      .replace('righthook', 'rhook')
      .replace('leftuppercut', 'luppercut')
      .replace('rightuppercut', 'ruppercut')
      .replace('leftbody', 'lbody')
      .replace('rightbody', 'rbody');
  }

  handleHit(punchData = {}) {
    clearTimeout(this.drillTimeout);
    
    this.comboCount++;
    this.comboMultiplier = 1 + Math.floor(this.comboCount / 3) * 0.5;
    this.lastHitTime = Date.now();
    
    let points = 100;
    
    const speedScore = punchData.speedScore || 50;
    const formScore = punchData.formScore || 50;
    const avgQuality = (speedScore + formScore) / 2;
    
    if (avgQuality > 90) {
      points += 50;
      this.perfectHits++;
    } else if (avgQuality > 75) {
      points += 25;
    }
    
    if (this.activePunch.includes('Hook')) points += 10;
    if (this.activePunch.includes('Uppercut')) points += 20;
    if (this.activePunch.includes('Body')) points += 15;
    
    points = Math.floor(points * this.comboMultiplier);
    
    this.onScore(points);
    this.totalHits++;
    this.hitsInLevel++;
    
    playSound('hit');
    this.createHitEffect(this.activePunch);
    this.updateComboDisplay();
    
    const hitsElement = document.getElementById('session-hits');
    if (hitsElement) hitsElement.textContent = this.totalHits;
    
    if (this.hitsInLevel >= this.hitsPerLevel) {
      this.levelUp();
    }
    
    this.activePunch = null;
    this.activeTarget = null;
    this.nextChallenge();
  }

  handleMiss() {
    clearTimeout(this.drillTimeout);
    this.totalMisses++;
    
    const missesElement = document.getElementById('session-misses');
    if (missesElement) missesElement.textContent = this.totalMisses;
    
    if (this.comboCount > 0) {
      playSound('miss');
      showNotification(`Combo Lost! (${this.comboCount}x)`, 'warning');
      this.resetCombo();
    }
    
    this.activePunch = null;
    this.activeTarget = null;
    this.nextChallenge();
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.updateComboDisplay();
  }

  levelUp() {
    this.level++;
    this.hitsInLevel = 0;
    playSound('levelup');
    
    this.updateAvailablePunches();
    
    showNotification(
      `Level ${this.level} Unlocked!\nSpeed: ${this.getCurrentReactionTime()}ms\nPunches: ${this.availablePunchTypes.length}`,
      'success'
    );
    
    const levelElement = document.getElementById('current-level');
    if (levelElement) {
      levelElement.textContent = this.level;
    }
  }

  createHitEffect(punchType) {
    const target = this.activeTarget || this.jabTarget;
    const rect = target.getBoundingClientRect();
    
    document.body.style.animation = 'screenShake 0.2s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 200);
    
    let particleColors = ['#FFD700', '#FFA500'];
    if (punchType.includes('Hook')) particleColors = ['#FF6B6B', '#FF8E53'];
    if (punchType.includes('Uppercut')) particleColors = ['#4ECDC4', '#45B7D1'];
    if (punchType.includes('Body')) particleColors = ['#95E1D3', '#38ADA9'];
    
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'hit-particle';
      particle.style.left = rect.left + rect.width / 2 + 'px';
      particle.style.top = rect.top + rect.height / 2 + 'px';
      
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      particle.style.background = `radial-gradient(circle, ${color}, ${color}88)`;
      
      const angle = (Math.PI * 2 * i) / 10;
      const velocity = 50 + Math.random() * 70;
      particle.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
      particle.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 600);
    }
  }

  updateComboDisplay() {
    const comboElement = document.getElementById('combo-counter');
    if (comboElement) {
      if (this.comboCount > 1) {
        comboElement.textContent = `${this.comboCount}x COMBO!`;
        comboElement.style.display = 'block';
        comboElement.style.animation = 'comboPulse 0.3s ease-out';
        
        if (this.comboCount >= 20) {
          comboElement.style.color = '#FF1744';
        } else if (this.comboCount >= 10) {
          comboElement.style.color = '#FF6B00';
        } else {
          comboElement.style.color = '#FFD700';
        }
      } else {
        comboElement.style.display = 'none';
      }
    }
    
    const bestComboElement = document.getElementById('best-combo');
    if (bestComboElement) {
      const currentBest = parseInt(bestComboElement.textContent) || 0;
      if (this.comboCount > currentBest) {
        bestComboElement.textContent = this.comboCount + 'x';
      }
    }
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.whiteSpace = 'pre-line';
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}