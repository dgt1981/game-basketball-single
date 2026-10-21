import * as THREE from 'three';
import { COURT } from './constants';
import { sounds } from './audio';

export interface BallPhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  isHeld: boolean;
  dribblePhase: number;
  inAir: boolean;
  shotTarget: THREE.Vector3 | null;
  targetOffset: THREE.Vector3;
  hasCollidedRim: boolean;
  hasCollidedBackboard: boolean;
  hasScored: boolean;
  scoreTriggered: boolean;
}

export function createBallPhysics(): BallPhysicsState {
  return {
    position: new THREE.Vector3(0, COURT.BALL_RADIUS, 5),
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    isHeld: true,
    dribblePhase: 0,
    inAir: false,
    shotTarget: null,
    targetOffset: new THREE.Vector3(),
    hasCollidedRim: false,
    hasCollidedBackboard: false,
    hasScored: false,
    scoreTriggered: false,
  };
}

/**
 * Calculates shooting trajectory velocity given release point, target, timing error, and contest
 */
export function calculateShotVelocity(
  releasePos: THREE.Vector3,
  targetPos: THREE.Vector3,
  timingOffsetMs: number, // 0 is sweet spot
  contestPercent: number, // 0 - 100
  isGreen: boolean
): { initialVelocity: THREE.Vector3; expectedDuration: number; isMadePrediction: boolean } {
  const dx = targetPos.x - releasePos.x;
  const dz = targetPos.z - releasePos.z;
  const dy = targetPos.y - releasePos.y;
  const horizDist = Math.sqrt(dx * dx + dz * dz);

  // High arc apex: typically 1.6m to 2.4m above the rim
  const apexHeight = targetPos.y + 1.6 + horizDist * 0.12;
  const hUp = apexHeight - releasePos.y;
  const hDown = apexHeight - targetPos.y;

  const g = Math.abs(COURT.GRAVITY);
  const timeUp = Math.sqrt((2 * Math.max(hUp, 0.5)) / g);
  const timeDown = Math.sqrt((2 * Math.max(hDown, 0.5)) / g);
  const totalTime = timeUp + timeDown;

  const vy = g * timeUp;

  // Accuracy calculation based on timing and contest
  // Green release is 100% dead center swish unless contested > 80%
  let offsetX = 0;
  let offsetZ = 0;

  const contestFactor = 1.0 + (contestPercent / 100) * 0.8;
  const absOffset = Math.abs(timingOffsetMs);

  let isMade = false;
  if (isGreen) {
    // Perfect release: minor variance, almost guaranteed
    offsetX = (Math.random() - 0.5) * 0.04;
    offsetZ = (Math.random() - 0.5) * 0.04;
    isMade = true;
  } else if (absOffset < 70) {
    // Slightly early / slightly late: good chance to bounce in
    const roll = Math.random();
    if (roll > (contestPercent > 40 ? 0.45 : 0.2)) {
      isMade = true;
      // Slight rim roll
      offsetX = (timingOffsetMs / 70) * 0.09 * contestFactor;
      offsetZ = (Math.random() - 0.5) * 0.06;
    } else {
      isMade = false;
      offsetX = (timingOffsetMs / 70) * 0.18 * contestFactor;
      offsetZ = 0.15;
    }
  } else {
    // Early or late release: clangs rim or misses
    isMade = false;
    const sign = timingOffsetMs < 0 ? -1 : 1;
    offsetX = (Math.random() - 0.5) * 0.25;
    offsetZ = sign * (0.22 + Math.min(absOffset / 200, 0.25)) * contestFactor;
  }

  const vx = (dx + offsetX) / totalTime;
  const vz = (dz + offsetZ) / totalTime;

  return {
    initialVelocity: new THREE.Vector3(vx, vy, vz),
    expectedDuration: totalTime,
    isMadePrediction: isMade,
  };
}

/**
 * Updates free ball physics, bounces, backboard & rim collisions
 */
export function stepBallPhysics(
  ball: BallPhysicsState,
  dt: number,
  onScore: () => void
) {
  if (ball.isHeld) return;

  const g = COURT.GRAVITY;
  // Apply gravity
  ball.velocity.y += g * dt;

  // Integrate position
  ball.position.x += ball.velocity.x * dt;
  ball.position.y += ball.velocity.y * dt;
  ball.position.z += ball.velocity.z * dt;

  // Rotate ball with spin
  ball.angularVelocity.x = -ball.velocity.z * 4;
  ball.angularVelocity.z = ball.velocity.x * 4;

  // 1. Floor collision
  if (ball.position.y <= COURT.BALL_RADIUS) {
    ball.position.y = COURT.BALL_RADIUS;
    if (Math.abs(ball.velocity.y) > 0.4) {
      ball.velocity.y = -ball.velocity.y * 0.72; // Floor restitution
      ball.velocity.x *= 0.88; // Ground friction
      ball.velocity.z *= 0.88;
      sounds.playBounce(Math.min(Math.abs(ball.velocity.y) / 4.0, 1.0));
    } else {
      ball.velocity.y = 0;
      ball.velocity.x *= 0.82;
      ball.velocity.z *= 0.82;
    }
  }

  // 2. Score check through hoop rim
  // Rim center: (COURT.HOOP_X, COURT.HOOP_Y, COURT.HOOP_Z) = (0, 3.05, -0.8)
  const hoopZ = COURT.HOOP_Z;
  const hoopY = COURT.HOOP_Y;
  const distToHoopCenterHoriz = Math.hypot(ball.position.x, ball.position.z - hoopZ);

  if (!ball.scoreTriggered && ball.velocity.y < 0) {
    if (
      ball.position.y <= hoopY + 0.05 &&
      ball.position.y >= hoopY - 0.25 &&
      distToHoopCenterHoriz < COURT.RIM_RADIUS * 0.85
    ) {
      ball.hasScored = true;
      ball.scoreTriggered = true;
      // Dampen velocity when swishing through net
      ball.velocity.x *= 0.3;
      ball.velocity.z *= 0.3;
      ball.velocity.y = Math.max(ball.velocity.y * 0.4, -2.5);
      sounds.playSwish();
      sounds.playCheer();
      onScore();
    }
  }

  // 3. Rim Torus Collision
  // Rim is circle radius 0.23 at Y=3.05, centered at (0, 3.05, -0.8)
  const rimRad = COURT.RIM_RADIUS;
  const distFromRimCircle = Math.abs(distToHoopCenterHoriz - rimRad);
  const distFromRimHeight = Math.abs(ball.position.y - hoopY);

  if (distFromRimCircle < COURT.BALL_RADIUS && distFromRimHeight < COURT.BALL_RADIUS * 1.1) {
    // Collision with metal rim!
    if (!ball.hasCollidedRim) {
      ball.hasCollidedRim = true;
      sounds.playRimHit(Math.min(ball.velocity.length() / 5.0, 1.0));

      // Calculate radial normal pointing away from rim wire
      const angle = Math.atan2(ball.position.z - hoopZ, ball.position.x);
      const nearestRimPointX = Math.cos(angle) * rimRad;
      const nearestRimPointZ = hoopZ + Math.sin(angle) * rimRad;

      const norm = new THREE.Vector3(
        ball.position.x - nearestRimPointX,
        ball.position.y - hoopY,
        ball.position.z - nearestRimPointZ
      ).normalize();

      // Reflect velocity: v' = v - 1.6 * (v . n) * n
      const dot = ball.velocity.dot(norm);
      if (dot < 0) {
        ball.velocity.addScaledVector(norm, -1.65 * dot);
        // Add random slight deflection for realistic bounce
        ball.velocity.x += (Math.random() - 0.5) * 0.6;
        ball.velocity.z += (Math.random() - 0.5) * 0.6;
      }
    }
  } else {
    ball.hasCollidedRim = false;
  }

  // 4. Backboard Box Collision
  // Backboard is at Z = COURT.BACKBOARD_Z = -1.2, X in [-0.9, 0.9], Y in [2.52, 3.57]
  const bbZ = COURT.BACKBOARD_Z;
  const bbMinX = -COURT.BACKBOARD_WIDTH / 2;
  const bbMaxX = COURT.BACKBOARD_WIDTH / 2;
  const bbMinY = hoopY + 0.35 - COURT.BACKBOARD_HEIGHT / 2;
  const bbMaxY = hoopY + 0.35 + COURT.BACKBOARD_HEIGHT / 2;

  if (
    ball.position.z - COURT.BALL_RADIUS <= bbZ &&
    ball.position.z + COURT.BALL_RADIUS >= bbZ - 0.1 &&
    ball.position.x >= bbMinX &&
    ball.position.x <= bbMaxX &&
    ball.position.y >= bbMinY &&
    ball.position.y <= bbMaxY
  ) {
    if (!ball.hasCollidedBackboard && ball.velocity.z < 0) {
      ball.hasCollidedBackboard = true;
      ball.position.z = bbZ + COURT.BALL_RADIUS;
      ball.velocity.z = -ball.velocity.z * 0.65;
      ball.velocity.x *= 0.85;
      ball.velocity.y *= 0.85;
      sounds.playBackboardHit();
    }
  } else {
    ball.hasCollidedBackboard = false;
  }
}
