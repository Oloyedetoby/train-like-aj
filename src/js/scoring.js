// src/js/scoring.js - Enhanced scoring system with detailed feedback

// Scoring configuration for different punch types
const SCORING_CONFIG = {
  jab: {
    idealAngle: 165,
    idealSpeed: 150,
    maxSpeed: 2500,
    angleTolerance: 25,
    speedWeight: 0.6,
    formWeight: 0.4,
  },
  cross: {
    idealAngle: 165,
    idealSpeed: 180,
    maxSpeed: 3000,
    angleTolerance: 25,
    speedWeight: 0.65,
    formWeight: 0.35,
  },
  hook: {
    idealAngle: 90,
    idealSpeed: 140,
    maxSpeed: 2200,
    angleTolerance: 30,
    speedWeight: 0.5,
    formWeight: 0.5,
  },
  left: {
    idealAngle: 90,
    idealSpeed: 140,
    maxSpeed: 2200,
    angleTolerance: 30,
    speedWeight: 0.5,
    formWeight: 0.5,
  },
  right: {
    idealAngle: 90,
    idealSpeed: 140,
    maxSpeed: 2200,
    angleTolerance: 30,
    speedWeight: 0.5,
    formWeight: 0.5,
  },
};

/**
 * Calculate comprehensive score for a punch
 * @param {Object} punchData - Contains punchType, speed, angle
 * @returns {Object} Scores and feedback
 */
export function calculateScore(punchData) {
  const { punchType, speed, angle } = punchData;

  if (!punchType || punchType === 'none') {
    return { 
      speedScore: 0, 
      formScore: 0, 
      totalScore: 0,
      feedback: 'No punch detected',
      grade: 'F'
    };
  }

  // Get config for punch type (default to jab if not found)
  const config = SCORING_CONFIG[punchType] || SCORING_CONFIG.jab;

  // Calculate speed score (0-100%)
  const normalizedSpeed = Math.min(speed / config.maxSpeed, 1);
  const idealSpeedRatio = speed / config.idealSpeed;
  
  // Speed score: Best at ideal speed, decreases if too slow or too fast
  let speedScore;
  if (idealSpeedRatio < 0.5) {
    // Too slow
    speedScore = idealSpeedRatio * 2 * 100;
  } else if (idealSpeedRatio <= 1.5) {
    // Good speed range
    speedScore = 100 - Math.abs(idealSpeedRatio - 1) * 30;
  } else {
    // Too fast (less control)
    speedScore = Math.max(70 - (idealSpeedRatio - 1.5) * 20, 40);
  }
  speedScore = Math.max(0, Math.min(100, speedScore));

  // Calculate form score based on angle (0-100%)
  const angleDeviation = Math.abs(angle - config.idealAngle);
  let formScore;
  
  if (angleDeviation <= config.angleTolerance) {
    // Within tolerance - excellent form
    formScore = 100 - (angleDeviation / config.angleTolerance) * 20;
  } else {
    // Outside tolerance - decreasing score
    const excessDeviation = angleDeviation - config.angleTolerance;
    formScore = Math.max(80 - excessDeviation * 1.5, 0);
  }
  formScore = Math.max(0, Math.min(100, formScore));

  // Calculate weighted total score
  const totalScore = (speedScore * config.speedWeight) + (formScore * config.formWeight);

  // Generate feedback based on performance
  const feedback = generateFeedback(speedScore, formScore, punchType, idealSpeedRatio, angleDeviation);
  
  // Assign letter grade
  const grade = getGrade(totalScore);

  // Determine if it's a "perfect" punch
  const isPerfect = totalScore >= 95;
  const isGreat = totalScore >= 85;
  const isGood = totalScore >= 70;

  console.log(`📊 Scoring - ${punchType.toUpperCase()}: Speed=${speed.toFixed(0)} (${speedScore.toFixed(0)}%), Angle=${angle.toFixed(0)}° (${formScore.toFixed(0)}%), Total=${totalScore.toFixed(0)}%, Grade=${grade}`);

  return { 
    speedScore: Math.round(speedScore), 
    formScore: Math.round(formScore),
    totalScore: Math.round(totalScore),
    feedback,
    grade,
    isPerfect,
    isGreat,
    isGood,
    details: {
      speed,
      angle,
      idealSpeed: config.idealSpeed,
      idealAngle: config.idealAngle,
      speedDeviation: Math.abs(idealSpeedRatio - 1),
      angleDeviation,
    }
  };
}

/**
 * Generate contextual feedback based on performance
 */
function generateFeedback(speedScore, formScore, punchType, speedRatio, angleDeviation) {
  const avgScore = (speedScore + formScore) / 2;

  // Perfect punches
  if (avgScore >= 95) {
    const perfectMessages = [
      "🔥 CHAMPION FORM! Absolutely perfect!",
      "⭐ FLAWLESS! That's textbook technique!",
      "💎 ELITE! You're punching like a pro!",
      "🏆 OUTSTANDING! AJ would be proud!",
    ];
    return perfectMessages[Math.floor(Math.random() * perfectMessages.length)];
  }

  // Great punches
  if (avgScore >= 85) {
    const greatMessages = [
      "💪 POWERFUL! Excellent execution!",
      "🎯 GREAT FORM! Keep it up!",
      "⚡ EXPLOSIVE! That's the way!",
      "👊 STRONG! You're on fire!",
    ];
    return greatMessages[Math.floor(Math.random() * greatMessages.length)];
  }

  // Good punches
  if (avgScore >= 70) {
    return "👍 Good punch! Focus on consistency!";
  }

  // Needs improvement - give specific feedback
  const issues = [];
  
  if (speedScore < 60) {
    if (speedRatio < 0.7) {
      issues.push("snap your punch faster");
    } else if (speedRatio > 1.8) {
      issues.push("control your speed more");
    }
  }

  if (formScore < 60) {
    if (angleDeviation > 40) {
      issues.push(`extend your arm more (angle: ${angleDeviation.toFixed(0)}° off)`);
    } else {
      issues.push("watch your form");
    }
  }

  if (issues.length > 0) {
    return `💡 ${issues.join(' and ')}`;
  }

  return "Keep practicing! You'll get there!";
}

/**
 * Convert score to letter grade
 */
function getGrade(score) {
  if (score >= 95) return 'S';  // S-tier for perfect
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D';
  return 'F';
}

/**
 * Calculate combo multiplier based on consecutive hits
 */
export function calculateComboMultiplier(comboCount) {
  if (comboCount < 3) return 1.0;
  if (comboCount < 5) return 1.2;
  if (comboCount < 10) return 1.5;
  if (comboCount < 15) return 1.8;
  if (comboCount < 25) return 2.0;
  return 2.5; // Max multiplier for 25+ combo
}

/**
 * Calculate bonus points for special achievements
 */
export function calculateBonusPoints(punchData, context = {}) {
  let bonus = 0;
  const { isPerfect, isGreat, totalScore } = punchData;
  const { comboCount, timeRemaining, consecutivePerfect } = context;

  // Perfect punch bonus
  if (isPerfect) {
    bonus += 50;
  } else if (isGreat) {
    bonus += 25;
  }

  // Combo bonuses
  if (comboCount >= 5) bonus += 10;
  if (comboCount >= 10) bonus += 25;
  if (comboCount >= 20) bonus += 50;
  if (comboCount >= 50) bonus += 100;

  // Speed bonus (punching under time pressure)
  if (timeRemaining && timeRemaining < 1000) {
    bonus += 20; // Quick reaction bonus
  }

  // Consecutive perfect punches
  if (consecutivePerfect && consecutivePerfect >= 3) {
    bonus += consecutivePerfect * 15;
  }

  return bonus;
}

/**
 * Analyze session performance and provide summary
 */
export function analyzeSessionPerformance(stats) {
  const { 
    totalPunches, 
    hits, 
    misses, 
    perfectPunches, 
    totalScore,
    averageSpeed,
    averageForm,
    maxCombo 
  } = stats;

  const accuracy = totalPunches > 0 ? (hits / totalPunches) * 100 : 0;
  const perfectRate = totalPunches > 0 ? (perfectPunches / totalPunches) * 100 : 0;
  const avgScorePerPunch = totalPunches > 0 ? totalScore / totalPunches : 0;

  let performance = 'Beginner';
  let recommendation = '';

  if (accuracy >= 90 && perfectRate >= 50) {
    performance = 'Elite';
    recommendation = '🏆 Champion level! Consider increasing difficulty!';
  } else if (accuracy >= 80 && perfectRate >= 30) {
    performance = 'Advanced';
    recommendation = '💪 Strong performance! Keep pushing for perfection!';
  } else if (accuracy >= 70 && perfectRate >= 15) {
    performance = 'Intermediate';
    recommendation = '👍 Good progress! Focus on form consistency!';
  } else if (accuracy >= 50) {
    performance = 'Developing';
    recommendation = '📈 You\'re improving! Practice basic combinations!';
  } else {
    performance = 'Beginner';
    recommendation = '🥊 Keep training! Focus on the fundamentals!';
  }

  return {
    performance,
    accuracy: accuracy.toFixed(1),
    perfectRate: perfectRate.toFixed(1),
    avgScorePerPunch: avgScorePerPunch.toFixed(0),
    recommendation,
    strengths: identifyStrengths(averageSpeed, averageForm),
    weaknesses: identifyWeaknesses(averageSpeed, averageForm),
  };
}

function identifyStrengths(avgSpeed, avgForm) {
  const strengths = [];
  if (avgSpeed >= 80) strengths.push('Excellent speed');
  if (avgForm >= 80) strengths.push('Great technique');
  if (avgSpeed >= 70 && avgForm >= 70) strengths.push('Well-balanced fighter');
  return strengths.length > 0 ? strengths : ['Building fundamentals'];
}

function identifyWeaknesses(avgSpeed, avgForm) {
  const weaknesses = [];
  if (avgSpeed < 60) weaknesses.push('Work on punch speed');
  if (avgForm < 60) weaknesses.push('Improve form and extension');
  if (Math.abs(avgSpeed - avgForm) > 25) weaknesses.push('Balance speed and technique');
  return weaknesses;
}

/**
 * Get difficulty adjustment recommendation
 */
export function getDifficultyRecommendation(stats) {
  const { accuracy, perfectRate, maxCombo } = stats;
  
  if (accuracy >= 85 && perfectRate >= 40 && maxCombo >= 20) {
    return { 
      adjustment: 'increase',
      message: 'Ready for harder challenges!',
      suggestedSpeed: 1.2 
    };
  } else if (accuracy < 50 || perfectRate < 10) {
    return { 
      adjustment: 'decrease',
      message: 'Try a slower pace to build fundamentals',
      suggestedSpeed: 0.8 
    };
  }
  
  return { 
    adjustment: 'maintain',
    message: 'Current difficulty is perfect!',
    suggestedSpeed: 1.0 
  };
}