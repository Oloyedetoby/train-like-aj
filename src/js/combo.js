// src/js/combo.js
import { playSound, speakCoach } from '/src/js/utils.js';

// Standard Boxing Number System
// 1 = Jab, 2 = Cross, 3 = Left Hook, 4 = Right Hook, 5 = Left Upper, 6 = Right Upper
const COMBOS = [
  { id: '1-2', name: "One Two", sequence: ['Jab', 'Cross'] },
  { id: '1-1-2', name: "Double Jab Cross", sequence: ['Jab', 'Jab', 'Cross'] },
  { id: '1-2-3', name: "One Two Hook", sequence: ['Jab', 'Cross', 'Left Hook'] },
  { id: '2-3-2', name: "Cross Hook Cross", sequence: ['Cross', 'Left Hook', 'Cross'] },
  { id: '1-2-5', name: "One Two Uppercut", sequence: ['Jab', 'Cross', 'Left Uppercut'] },
  { id: '1-6-3', name: "Jab Upper Hook", sequence: ['Jab', 'Right Uppercut', 'Left Hook'] } // Advanced
];

export class ComboDrill {
  constructor(uiElements, onScore) {
    this.jabTarget = uiElements.jabTarget;
    this.crossTarget = uiElements.crossTarget;
    this.feedbackElement = document.getElementById('feedback');
    this.comboDisplay = document.getElementById('combo-display'); // We will add this to HTML
    
    this.onScore = onScore;
    this.isRunning = false;
    
    this.currentCombo = null;
    this.stepIndex = 0; // Which punch in the combo are we on?
    this.lastPunchTime = 0;
  }

  start() {
    console.log("🥊 Combo Trainer Started");
    this.isRunning = true;
    speakCoach("Combo Mode. Listen to my voice.");
    this.nextCombo();
  }

  stop() {
    this.isRunning = false;
    this.hideTargets();
    if (this.comboDisplay) this.comboDisplay.textContent = "";
  }

  nextCombo() {
    if (!this.isRunning) return;

    // 1. Pick a random combo
    this.currentCombo = COMBOS[Math.floor(Math.random() * COMBOS.length)];
    this.stepIndex = 0;
    
    // 2. Announce it
    this.updateDisplay(`Combo: ${this.currentCombo.name}`);
    speakCoach(this.currentCombo.name);

    // 3. Wait a moment, then show the first target
    setTimeout(() => {
      this.showNextTarget();
    }, 1500);
  }

  showNextTarget() {
    if (!this.isRunning) return;

    this.hideTargets();

    const punchType = this.currentCombo.sequence[this.stepIndex];
    let targetElement;
    let text;

    // Map punch type to target (Left hand -> Left Target, Right hand -> Right Target)
    if (punchType.includes('Jab') || punchType.includes('Left')) {
      targetElement = this.jabTarget;
    } else {
      targetElement = this.crossTarget;
    }

    // Set Text (e.g., "3" for Hook)
    if (punchType === 'Jab') text = '1';
    else if (punchType === 'Cross') text = '2';
    else if (punchType === 'Left Hook') text = '3';
    else if (punchType === 'Right Hook') text = '4';
    else if (punchType === 'Left Uppercut') text = '5';
    else if (punchType === 'Right Uppercut') text = '6';

    targetElement.textContent = text;
    targetElement.style.display = 'flex'; // Make sure it's visible
    targetElement.classList.add('visible');
    
    this.feedbackElement.textContent = `Throw: ${punchType.toUpperCase()}`;
  }

  checkPunch(detectedPunch, punchData) {
    if (!this.isRunning || !this.currentCombo) return;

    const requiredPunch = this.currentCombo.sequence[this.stepIndex];
    
    // Normalize strings for comparison (remove spaces, lowercase)
    const d = detectedPunch.toLowerCase().replace(/\s/g, '');
    const r = requiredPunch.toLowerCase().replace(/\s/g, '');

    // CHECK MATCH
    // We allow "Jab" to trigger "Left Hook" logic if the user throws a hook instead of a straight
    // But strictly speaking, we want them to follow instructions.
    
    if (d === r) {
      this.handleHit(punchData);
    }
  }

  handleHit(punchData) {
    playSound('hit');
    this.stepIndex++;

    // VISUAL FEEDBACK
    this.createHitEffect();

    // CHECK IF COMBO IS FINISHED
    if (this.stepIndex >= this.currentCombo.sequence.length) {
      // Combo Complete!
      playSound('combo');
      this.onScore(100 * this.currentCombo.sequence.length); // Big points
      
      const praise = ["Beautiful flow!", "Nice rhythm!", "Fast hands!", "That's it!"];
      const randomPraise = praise[Math.floor(Math.random() * praise.length)];
      this.feedbackElement.textContent = `✅ ${randomPraise}`;
      
      // Short delay before next combo
      setTimeout(() => this.nextCombo(), 1000);
      
    } else {
      // Combo continues... show next target immediately
      // Check rhythm (optional: bonus points for speed)
      this.showNextTarget();
    }
  }

  hideTargets() {
    this.jabTarget.classList.remove('visible');
    this.crossTarget.classList.remove('visible');
    // We don't set display:none here because we want the fade out animation
  }

  updateDisplay(text) {
    if (this.comboDisplay) {
      this.comboDisplay.textContent = text;
      this.comboDisplay.style.animation = 'none';
      this.comboDisplay.offsetHeight; /* trigger reflow */
      this.comboDisplay.style.animation = 'pulse 0.5s';
    }
  }

  createHitEffect() {
    // Reuse the shake effect
    document.body.style.animation = 'screenShake 0.1s ease-in-out';
    setTimeout(() => { document.body.style.animation = ''; }, 100);
  }
}