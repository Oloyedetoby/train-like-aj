// src/js/technique.js - COMPLETE MULTI-PUNCH LOGIC
import { computeAngle, playSound, speakCoach } from '/src/js/utils.js';

export class TechniqueTrainer {
  constructor(canvasCtx) {
    this.ctx = canvasCtx;
    this.currentMove = null;
    this.isHoldingPosition = false;
    this.holdStartTime = 0;
    this.requiredHoldTime = 800; // 0.8 seconds hold
    this.feedback = "Select a punch to start";
  }

  start(moveName) {
    this.currentMove = moveName;
    this.feedback = `Get ready: ${moveName}`;
    this.isHoldingPosition = false;
    speakCoach(`Let's perfect your ${moveName}. Assume the position and hold it.`);
    console.log(`Technique Trainer started: ${moveName}`);
  }

  stop() {
    this.currentMove = null;
    this.isHoldingPosition = false;
  }

  analyze(landmarks, width, height) {
    if (!this.currentMove || !landmarks) return;

    let analysis = { passed: false, feedback: '', errors: [], data: {} };

    // --- THIS SWITCH STATEMENT IS CRITICAL ---
    // It directs the AI to the correct math for the selected punch
    switch(this.currentMove) {
      case 'Jab':
        analysis = this.analyzeStraightPunch(landmarks, 'left');
        break;
      case 'Cross':
        analysis = this.analyzeStraightPunch(landmarks, 'right');
        break;
      case 'Left Hook':
        analysis = this.analyzeHook(landmarks, 'left');
        break;
      case 'Right Hook':
        analysis = this.analyzeHook(landmarks, 'right');
        break;
      case 'Left Uppercut':
        analysis = this.analyzeUppercut(landmarks, 'left');
        break;
      case 'Right Uppercut':
        analysis = this.analyzeUppercut(landmarks, 'right');
        break;
      default:
        console.warn("Unknown move:", this.currentMove);
        break;
    }

    this.drawGuides(analysis, landmarks, width, height);
    this.handleProgress(analysis);
    
    return analysis;
  }

  // --- ANALYZERS (THE MATH) ---

  // Logic for Jab & Cross
  analyzeStraightPunch(landmarks, side) {
    const shoulder = landmarks[side === 'left' ? 11 : 12];
    const elbow = landmarks[side === 'left' ? 13 : 14];
    const wrist = landmarks[side === 'left' ? 15 : 16];
    const otherWrist = landmarks[side === 'left' ? 16 : 15];
    const nose = landmarks[0];

    const elbowAngle = computeAngle(shoulder, elbow, wrist);
    let errors = [];

    // 1. Extension Check (Must be straight)
    if (elbowAngle < 150) errors.push("Extend arm fully!");
    
    // 2. Height Check (Punching too low or high?)
    if (Math.abs(wrist.y - shoulder.y) > 0.20) errors.push("Punch at shoulder level");

    return {
      passed: errors.length === 0,
      feedback: errors.length === 0 ? "PERFECT! HOLD IT!" : errors[0],
      errors,
      data: { shoulder, elbow, wrist, angle: elbowAngle }
    };
  }

  // Logic for Hooks
  analyzeHook(landmarks, side) {
    const shoulder = landmarks[side === 'left' ? 11 : 12];
    const elbow = landmarks[side === 'left' ? 13 : 14];
    const wrist = landmarks[side === 'left' ? 15 : 16];

    const elbowAngle = computeAngle(shoulder, elbow, wrist);
    let errors = [];

    // 1. Angle Check (The 90 degree rule)
    if (elbowAngle > 130) errors.push("Don't slap! Bend arm (90°)");
    if (elbowAngle < 60) errors.push("Open arm slightly");

    // 2. Elbow Height (Chicken Wing)
    // Elbow should be roughly parallel to shoulder
    const heightDiff = Math.abs(elbow.y - shoulder.y);
    if (heightDiff > 0.15) errors.push("Raise your elbow!");

    return {
      passed: errors.length === 0,
      feedback: errors.length === 0 ? "LOCKED IN! HOLD IT!" : errors[0],
      errors,
      data: { shoulder, elbow, wrist, angle: elbowAngle }
    };
  }

  // Logic for Uppercuts
  analyzeUppercut(landmarks, side) {
    const shoulder = landmarks[side === 'left' ? 11 : 12];
    const elbow = landmarks[side === 'left' ? 13 : 14];
    const wrist = landmarks[side === 'left' ? 15 : 16];

    const elbowAngle = computeAngle(shoulder, elbow, wrist);
    let errors = [];

    // 1. Angle Check (Tight angle for uppercut)
    if (elbowAngle > 110) errors.push("Bend arm more!");

    // 2. Position Check (Wrist must be above elbow)
    if (wrist.y > elbow.y) errors.push("Punch UPWARDS!");

    // 3. Elbow Tucked 
    if (Math.abs(elbow.x - shoulder.x) > 0.15) errors.push("Tuck your elbow in!");

    return {
      passed: errors.length === 0,
      feedback: errors.length === 0 ? "NAILED IT! HOLD!" : errors[0],
      errors,
      data: { shoulder, elbow, wrist, angle: elbowAngle }
    };
  }

  // --- VISUALS ---
  drawGuides(analysis, landmarks, width, height) {
    if (!analysis.data || !analysis.data.shoulder) return;
    
    const ctx = this.ctx;
    const { shoulder, elbow, wrist, angle } = analysis.data;
    const color = analysis.passed ? '#00FF00' : '#FF0000'; 

    ctx.save();
    
    // Draw the Skeleton Overlay
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(shoulder.x * width, shoulder.y * height);
    ctx.lineTo(elbow.x * width, elbow.y * height);
    ctx.lineTo(wrist.x * width, wrist.y * height);
    ctx.stroke();

    // Draw Joint Dots
    ctx.fillStyle = color;
    [shoulder, elbow, wrist].forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 8, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw Angle Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 20px Arial";
    ctx.fillText(`${Math.round(angle)}°`, elbow.x * width + 20, elbow.y * height);

    // Draw Feedback Text (Big and Center)
    ctx.shadowColor = "black";
    ctx.shadowBlur = 7;
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = analysis.passed ? '#00FF00' : '#FF4444';
    ctx.textAlign = "center";
    ctx.fillText(analysis.feedback, width / 2, height * 0.15);
    
    ctx.restore();
  }

  drawArrow(ctx, x, y, dx, dy) {
    ctx.beginPath();
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 4;
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(x + dx - 10, y + dy + 10);
    ctx.lineTo(x + dx + 10, y + dy + 10);
    ctx.fill();
  }

  handleProgress(analysis) {
    if (analysis.passed) {
      if (!this.isHoldingPosition) {
        this.isHoldingPosition = true;
        this.holdStartTime = Date.now();
      }

      // Calculate hold progress
      const heldTime = Date.now() - this.holdStartTime;
      const progress = Math.min(heldTime / this.requiredHoldTime, 1);
      
      // If held long enough
      if (progress >= 1) {
        this.isHoldingPosition = false;
        playSound('combo'); // Success sound
        speakCoach("Good form! Select another punch.");
        
        // Stop logic so it doesn't spam
        this.stop();
        document.getElementById('feedback').textContent = `Passed: ${this.currentMove}`;
      }
    } else {
      this.isHoldingPosition = false;
    }
  }
}