// src/js/punch.js - V2 Enhanced with MORE punch types and accuracy
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
  constructor(cooldownMs = 350) {
    this.cooldownMs = cooldownMs;
    this.lastPunchTime = 0;
    this.lastPunchType = null;
  }

  canPunch(punchType) {
    const now = performance.now();
    const timeSinceLastPunch = now - this.lastPunchTime;
    
    if (timeSinceLastPunch > this.cooldownMs || this.lastPunchType !== punchType) {
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
const punchCooldown = new PunchCooldown(350);

// Enhanced punch detection with MORE punch types
export async function detectPunch(landmarks, width, height) {
  if (!landmarks || landmarks.length < 17) {
    return { 
      punch: null, 
      extras: getDefaultExtras()
    };
  }

  const leftShoulder = landmarks[11];
  const leftElbow = landmarks[13];
  const leftWrist = landmarks[15];
  const rightShoulder = landmarks[12];
  const rightElbow = landmarks[14];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const nose = landmarks[0];

  // Calculate speeds
  const leftSpeed = leftWrist ? speedTracker.updateSpeed(15, leftWrist.x * width, leftWrist.y * height) : 0;
  const rightSpeed = rightWrist ? speedTracker.updateSpeed(16, rightWrist.x * width, rightWrist.y * height) : 0;
  
  // Calculate angles
  const leftAngle = leftShoulder && leftElbow && leftWrist ? computeAngle(leftShoulder, leftElbow, leftWrist) : 0;
  const rightAngle = rightShoulder && rightElbow && rightWrist ? computeAngle(rightShoulder, rightElbow, rightWrist) : 0;

  // Calculate extensions
  const leftExtension = leftWrist && leftShoulder ? Math.abs(leftWrist.x * width - leftShoulder.x * width) : 0;
  const rightExtension = rightWrist && rightShoulder ? Math.abs(rightWrist.x * width - rightShoulder.x * width) : 0;

  // Calculate vertical positions (for uppercuts and body shots)
  const leftWristY = leftWrist ? leftWrist.y * height : 0;
  const rightWristY = rightWrist ? rightWrist.y * height : 0;
  const leftShoulderY = leftShoulder ? leftShoulder.y * height : 0;
  const rightShoulderY = rightShoulder ? rightShoulder.y * height : 0;
  const leftHipY = leftHip ? leftHip.y * height : 0;
  const rightHipY = rightHip ? rightHip.y * height : 0;

  // Check stance (for accuracy tips)
  const stanceInfo = analyzeStance(landmarks, width, height);

  const extras = { 
    leftSpeed, 
    rightSpeed, 
    leftAngle, 
    rightAngle, 
    leftExtension, 
    rightExtension,
    leftWristY,
    rightWristY,
    leftShoulderY,
    rightShoulderY,
    stance: stanceInfo
  };

  // Improved thresholds for better accuracy
  const MIN_SPEED = 70;
  const MIN_EXTENSION = 100;
  const MIN_STRAIGHT_ANGLE = 135;
  const MAX_HOOK_ANGLE = 110;
  const MIN_UPPERCUT_SPEED = 60;

  // 1. JAB (Left straight punch)
  if (leftSpeed > MIN_SPEED && 
      leftExtension > MIN_EXTENSION && 
      leftAngle > MIN_STRAIGHT_ANGLE &&
      leftWristY < leftShoulderY + 50 && // Not too low
      leftWristY > leftShoulderY - 50 && // Not too high
      punchCooldown.canPunch('Jab')) {
    return { 
      punch: 'Jab', 
      extras, 
      confidence: calculateConfidence(leftSpeed, leftAngle, 'jab'),
      formTip: getFormTip('Jab', leftAngle, leftExtension, stanceInfo)
    };
  }

  // 2. CROSS (Right straight punch)
  if (rightSpeed > MIN_SPEED && 
      rightExtension > MIN_EXTENSION && 
      rightAngle > MIN_STRAIGHT_ANGLE &&
      rightWristY < rightShoulderY + 50 &&
      rightWristY > rightShoulderY - 50 &&
      punchCooldown.canPunch('Cross')) {
    return { 
      punch: 'Cross', 
      extras, 
      confidence: calculateConfidence(rightSpeed, rightAngle, 'cross'),
      formTip: getFormTip('Cross', rightAngle, rightExtension, stanceInfo)
    };
  }

  // 3. LEFT HOOK
  if (leftSpeed > MIN_SPEED * 0.85 && 
      leftAngle < MAX_HOOK_ANGLE && 
      leftWristY < leftShoulderY + 30 &&
      leftWristY > leftShoulderY - 30 &&
      punchCooldown.canPunch('Left Hook')) {
    return { 
      punch: 'Left Hook', 
      extras, 
      confidence: calculateConfidence(leftSpeed, leftAngle, 'hook'),
      formTip: getFormTip('Left Hook', leftAngle, leftExtension, stanceInfo)
    };
  }

  // 4. RIGHT HOOK
  if (rightSpeed > MIN_SPEED * 0.85 && 
      rightAngle < MAX_HOOK_ANGLE && 
      rightWristY < rightShoulderY + 30 &&
      rightWristY > rightShoulderY - 30 &&
      punchCooldown.canPunch('Right Hook')) {
    return { 
      punch: 'Right Hook', 
      extras, 
      confidence: calculateConfidence(rightSpeed, rightAngle, 'hook'),
      formTip: getFormTip('Right Hook', rightAngle, rightExtension, stanceInfo)
    };
  }

  // 5. LEFT UPPERCUT (Upward punch)
  const leftUpwardMovement = leftShoulderY - leftWristY;
  if (leftSpeed > MIN_UPPERCUT_SPEED && 
      leftUpwardMovement > 80 && // Wrist moving significantly upward
      leftAngle < 100 &&
      leftWristY < leftShoulderY &&
      punchCooldown.canPunch('Left Uppercut')) {
    return { 
      punch: 'Left Uppercut', 
      extras, 
      confidence: calculateConfidence(leftSpeed, leftAngle, 'uppercut'),
      formTip: getFormTip('Left Uppercut', leftAngle, leftExtension, stanceInfo)
    };
  }

  // 6. RIGHT UPPERCUT
  const rightUpwardMovement = rightShoulderY - rightWristY;
  if (rightSpeed > MIN_UPPERCUT_SPEED && 
      rightUpwardMovement > 80 &&
      rightAngle < 100 &&
      rightWristY < rightShoulderY &&
      punchCooldown.canPunch('Right Uppercut')) {
    return { 
      punch: 'Right Uppercut', 
      extras, 
      confidence: calculateConfidence(rightSpeed, rightAngle, 'uppercut'),
      formTip: getFormTip('Right Uppercut', rightAngle, rightExtension, stanceInfo)
    };
  }

  // 7. LEFT BODY SHOT (Punch to body level)
  if (leftSpeed > MIN_SPEED * 0.8 && 
      leftExtension > MIN_EXTENSION * 0.8 &&
      leftWristY > leftHipY - 100 && // At body level
      leftWristY < leftHipY + 50 &&
      leftAngle > 120 &&
      punchCooldown.canPunch('Left Body')) {
    return { 
      punch: 'Left Body', 
      extras, 
      confidence: calculateConfidence(leftSpeed, leftAngle, 'body'),
      formTip: getFormTip('Left Body', leftAngle, leftExtension, stanceInfo)
    };
  }

  // 8. RIGHT BODY SHOT
  if (rightSpeed > MIN_SPEED * 0.8 && 
      rightExtension > MIN_EXTENSION * 0.8 &&
      rightWristY > rightHipY - 100 &&
      rightWristY < rightHipY + 50 &&
      rightAngle > 120 &&
      punchCooldown.canPunch('Right Body')) {
    return { 
      punch: 'Right Body', 
      extras, 
      confidence: calculateConfidence(rightSpeed, rightAngle, 'body'),
      formTip: getFormTip('Right Body', rightAngle, rightExtension, stanceInfo)
    };
  }

  return { punch: null, extras, confidence: 0, formTip: null };
}

function getDefaultExtras() {
  return {
    leftSpeed: 0,
    rightSpeed: 0,
    leftAngle: 0,
    rightAngle: 0,
    leftExtension: 0,
    rightExtension: 0,
    leftWristY: 0,
    rightWristY: 0,
    stance: { isGood: false, tips: [] }
  };
}

// Analyze boxing stance
function analyzeStance(landmarks, width, height) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const nose = landmarks[0];

  const tips = [];
  let isGood = true;

  // Check if shoulders are level
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y) * height;
  if (shoulderDiff > 50) {
    tips.push('Keep shoulders level');
    isGood = false;
  }

  // Check if facing forward (shoulders alignment)
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * width;
  if (shoulderWidth < 100) {
    tips.push('Turn body slightly - show your side');
    isGood = false;
  }

  // Check head position (should be forward)
  const centerX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
  const noseX = nose.x * width;
  if (Math.abs(noseX - centerX) > 80) {
    tips.push('Keep head centered and chin tucked');
    isGood = false;
  }

  return { isGood, tips, shoulderWidth, shoulderLevel: shoulderDiff < 50 };
}

// Get specific form tips for each punch
function getFormTip(punchType, angle, extension, stanceInfo) {
  const tips = [];

  switch(punchType) {
    case 'Jab':
      if (angle < 150) tips.push('💡 Extend your arm more fully');
      if (extension < 120) tips.push('💡 Push forward more - reach the target');
      if (!stanceInfo.isGood) tips.push('💡 ' + stanceInfo.tips[0]);
      break;
    
    case 'Cross':
      if (angle < 150) tips.push('💡 Full extension - straighten that arm');
      if (!stanceInfo.shoulderLevel) tips.push('💡 Rotate your hips for power');
      break;

    case 'Left Hook':
    case 'Right Hook':
      if (angle > 100) tips.push('💡 Keep your elbow at 90° for hooks');
      if (extension > 150) tips.push('💡 Don\'t overextend on hooks - stay compact');
      break;

    case 'Left Uppercut':
    case 'Right Uppercut':
      if (angle > 90) tips.push('💡 Bend your arm more - uppercuts are tight');
      tips.push('💡 Drive upward from your legs');
      break;

    case 'Left Body':
    case 'Right Body':
      if (angle < 130) tips.push('💡 Slight downward angle for body shots');
      tips.push('💡 Aim for the ribs or solar plexus');
      break;
  }

  return tips.length > 0 ? tips[0] : '✅ Perfect form!';
}

function calculateConfidence(speed, angle, punchType) {
  let idealSpeed, idealAngle;
  
  switch(punchType) {
    case 'jab':
    case 'cross':
      idealSpeed = 150;
      idealAngle = 160;
      break;
    case 'hook':
      idealSpeed = 140;
      idealAngle = 90;
      break;
    case 'uppercut':
      idealSpeed = 130;
      idealAngle = 70;
      break;
    case 'body':
      idealSpeed = 140;
      idealAngle = 150;
      break;
    default:
      idealSpeed = 150;
      idealAngle = 160;
  }
  
  const speedScore = Math.min((speed / idealSpeed) * 50, 50);
  const angleScore = Math.max(50 - Math.abs(angle - idealAngle) / 2, 0);
  
  return Math.min(speedScore + angleScore, 100);
}

export function resetPunchDetection() {
  speedTracker.reset();
  punchCooldown.reset();
}

// Export punch types for the game to use
export const PUNCH_TYPES = [
  'Jab',
  'Cross',
  'Left Hook',
  'Right Hook',
  'Left Uppercut',
  'Right Uppercut',
  'Left Body',
  'Right Body'
];