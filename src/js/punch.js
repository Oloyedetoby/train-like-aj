// src/js/punch.js - EASIER DETECTION & FASTER GAMEPLAY
import { computeAngle } from '/src/js/utils.js';

export class SpeedTracker {
  constructor() {
    this.lastPositions = new Map();
    this.velocityHistory = new Map();
    this.maxHistorySize = 5;
  }

  updateSpeed(landmarkId, x, y) {
    const key = `${landmarkId}`;
    const now = performance.now();
    
    if (!this.lastPositions.has(key)) {
      this.lastPositions.set(key, { x, y, time: now });
      this.velocityHistory.set(key, []);
      return 0;
    }
    
    const last = this.lastPositions.get(key);
    const dx = x - last.x;
    const dy = y - last.y;
    const dt = (now - last.time) / 1000;
    
    if (dt === 0) return 0;
    
    const instantSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
    
    let history = this.velocityHistory.get(key) || [];
    history.push(instantSpeed);
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    this.velocityHistory.set(key, history);
    
    const smoothedSpeed = history.reduce((sum, v) => sum + v, 0) / history.length;
    
    this.lastPositions.set(key, { x, y, time: now });
    return smoothedSpeed;
  }

  reset() {
    this.lastPositions.clear();
    this.velocityHistory.clear();
  }
}

class PunchCooldown {
  constructor(cooldownMs = 250) { // Reduced from 350 to 250 for faster combos
    this.cooldownMs = cooldownMs;
    this.lastPunchTime = 0;
    this.lastPunchType = null;
  }

  canPunch(punchType) {
    const now = performance.now();
    
    // LOGIC: Allow alternating hands instantly.
    // Only apply cooldown if punching with the SAME hand consecutively.
    const isLeft = punchType.includes('Left') || punchType === 'Jab';
    const wasLeft = this.lastPunchType && (this.lastPunchType.includes('Left') || this.lastPunchType === 'Jab');
    
    const isSameHand = (isLeft && wasLeft) || (!isLeft && !wasLeft && this.lastPunchType);

    if (!isSameHand || (now - this.lastPunchTime > this.cooldownMs)) {
      this.lastPunchTime = now;
      this.lastPunchType = punchType;
      return true;
    }
    return false;
  }

  reset() {
    this.lastPunchTime = 0;
    this.lastPunchType = null;
  }
}

const speedTracker = new SpeedTracker();
const punchCooldown = new PunchCooldown(250);

// Enhanced punch detection with RELAXED thresholds
export async function detectPunch(landmarks, width, height) {
  if (!landmarks || landmarks.length < 17) {
    return { 
      punch: null, 
      extras: getDefaultExtras()
    };
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  // Calculate speeds
  const leftSpeed = leftWrist ? speedTracker.updateSpeed(15, leftWrist.x * width, leftWrist.y * height) : 0;
  const rightSpeed = rightWrist ? speedTracker.updateSpeed(16, rightWrist.x * width, rightWrist.y * height) : 0;
  
  // Calculate angles
  const leftAngle = computeAngle(leftShoulder, leftElbow, leftWrist);
  const rightAngle = computeAngle(rightShoulder, rightElbow, rightWrist);

  // Calculate Extension Ratio (How far arm is extended relative to body size)
  // This makes it work regardless of how close/far you are from camera
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * width;
  const leftExtensionDist = Math.abs(leftWrist.x - leftShoulder.x) * width;
  const rightExtensionDist = Math.abs(rightWrist.x - rightShoulder.x) * width;
  
  const leftExtRatio = leftExtensionDist / shoulderWidth;
  const rightExtRatio = rightExtensionDist / shoulderWidth;

  const extras = { 
    leftSpeed, rightSpeed, leftAngle, rightAngle, 
    leftExtension: leftExtensionDist, rightExtension: rightExtensionDist,
    stance: { isGood: true, tips: [] } // Simplified stance for gameplay performance
  };

  // --- ARCADE THRESHOLDS (Easier to hit) ---
  const MIN_SPEED = 40;        // Lowered from 70
  const MIN_EXT_RATIO = 0.5;   // Register hit at 50% extension (was 100%)
  
  // 1. JAB (Left)
  if (leftSpeed > MIN_SPEED && leftExtRatio > MIN_EXT_RATIO) {
    if (punchCooldown.canPunch('Jab')) {
      return { punch: 'Jab', extras, confidence: 100, formTip: "Nice speed!" };
    }
  }

  // 2. CROSS (Right)
  if (rightSpeed > MIN_SPEED && rightExtRatio > MIN_EXT_RATIO) {
    if (punchCooldown.canPunch('Cross')) {
      return { punch: 'Cross', extras, confidence: 100, formTip: "Good power!" };
    }
  }

  // 3. LEFT HOOK
  // Logic: High speed, but arm is bent (low extension), and wrist is high
  if (leftSpeed > MIN_SPEED && leftExtRatio < 0.7 && leftWrist.y < leftShoulder.y + 0.2) {
    if (punchCooldown.canPunch('Left Hook')) {
      return { punch: 'Left Hook', extras, confidence: 85 };
    }
  }

  // 4. RIGHT HOOK
  if (rightSpeed > MIN_SPEED && rightExtRatio < 0.7 && rightWrist.y < rightShoulder.y + 0.2) {
    if (punchCooldown.canPunch('Right Hook')) {
      return { punch: 'Right Hook', extras, confidence: 85 };
    }
  }

  // 5. UPPERCUTS
  // Logic: High speed, Wrist is below nose but moving up, Elbow is low
  if (leftSpeed > MIN_SPEED && leftWrist.y > leftShoulder.y - 0.2 && leftAngle < 120) {
    if (punchCooldown.canPunch('Left Uppercut')) {
      return { punch: 'Left Uppercut', extras, confidence: 80 };
    }
  }

  if (rightSpeed > MIN_SPEED && rightWrist.y > rightShoulder.y - 0.2 && rightAngle < 120) {
    if (punchCooldown.canPunch('Right Uppercut')) {
      return { punch: 'Right Uppercut', extras, confidence: 80 };
    }
  }

  return { punch: null, extras, confidence: 0, formTip: null };
}

function getDefaultExtras() {
  return {
    leftSpeed: 0, rightSpeed: 0,
    leftAngle: 0, rightAngle: 0,
    leftExtension: 0, rightExtension: 0,
    stance: { isGood: false, tips: [] }
  };
}

export function resetPunchDetection() {
  speedTracker.reset();
  punchCooldown.reset();
}

export const PUNCH_TYPES = [
  'Jab', 'Cross', 
  'Left Hook', 'Right Hook', 
  'Left Uppercut', 'Right Uppercut'
];