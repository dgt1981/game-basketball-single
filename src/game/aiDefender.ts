import * as THREE from 'three';
import { CharacterRig } from './playerModel';
import { COURT, DIFFICULTIES } from './constants';
import { DifficultyLevel } from '../types/game';
import { sounds } from './audio';

export interface AIDefenderState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  pose: 'stance' | 'slide' | 'contest' | 'block_jump' | 'stumble' | 'rebound';
  isAirborne: boolean;
  jumpVelocity: number;
  stumbleTimer: number;
  contestPercent: number;
  rig: CharacterRig;
  level: DifficultyLevel;
  reactionDelayTimer: number;
  lastTargetPos: THREE.Vector3;
}

export function createAIDefender(rig: CharacterRig, level: DifficultyLevel): AIDefenderState {
  const initialPos = new THREE.Vector3(0, 0, 3.2);
  rig.group.position.copy(initialPos);
  rig.setPose('stance');

  return {
    position: initialPos,
    velocity: new THREE.Vector3(),
    rotation: 0,
    pose: 'stance',
    isAirborne: false,
    jumpVelocity: 0,
    stumbleTimer: 0,
    contestPercent: 0,
    rig,
    level,
    reactionDelayTimer: 0,
    lastTargetPos: initialPos.clone(),
  };
}

/**
 * Calculates defense contest level on shooter (0% to 100%)
 */
export function calculateContest(
  defenderPos: THREE.Vector3,
  shooterPos: THREE.Vector3,
  defenderPose: string,
  isDefenderAirborne: boolean
): number {
  const dist = defenderPos.distanceTo(shooterPos);

  // If defender is behind shooter or way off:
  const toShooter = shooterPos.clone().sub(defenderPos).normalize();
  const toHoop = new THREE.Vector3(0, 0, COURT.HOOP_Z).sub(shooterPos).normalize();
  const angleFacing = toShooter.dot(toHoop); // Defender should be between shooter and hoop

  if (dist > 3.0) return 0; // Wide open
  if (angleFacing < -0.2) return 5; // Defender blown by / behind

  let baseContest = 0;
  if (dist < 1.0) baseContest = 80;
  else if (dist < 1.6) baseContest = 60;
  else if (dist < 2.2) baseContest = 35;
  else baseContest = 15;

  if (isDefenderAirborne || defenderPose === 'block_jump') {
    baseContest += 25;
  } else if (defenderPose === 'contest') {
    baseContest += 15;
  } else if (defenderPose === 'stumble') {
    baseContest = 0; // Stumbled = open look!
  }

  return Math.min(Math.max(Math.round(baseContest), 0), 100);
}

/**
 * Update AI defender movement and reaction logic
 */
export function updateAIDefender(
  ai: AIDefenderState,
  playerPos: THREE.Vector3,
  isPlayerShooting: boolean,
  isPlayerGathering: boolean,
  isBallInFlight: boolean,
  ballPos: THREE.Vector3,
  dt: number
) {
  const config = DIFFICULTIES[ai.level];

  // 1. Handle stumble from ankle breaker
  if (ai.stumbleTimer > 0) {
    ai.stumbleTimer -= dt;
    ai.pose = 'stumble';
    ai.rig.setPose('stumble');
    ai.contestPercent = 0;
    // Decelerate
    ai.velocity.multiplyScalar(0.9);
    ai.position.addScaledVector(ai.velocity, dt);
    ai.rig.group.position.copy(ai.position);
    return;
  }

  // 2. Handle Jump Block airborne physics
  if (ai.isAirborne) {
    ai.jumpVelocity += COURT.GRAVITY * 1.4 * dt;
    ai.position.y += ai.jumpVelocity * dt;

    if (ai.position.y <= 0) {
      ai.position.y = 0;
      ai.isAirborne = false;
      ai.jumpVelocity = 0;
      ai.pose = 'stance';
      ai.rig.setPose('stance');
    } else {
      ai.pose = 'block_jump';
      ai.rig.setPose('block_jump');
    }
    ai.rig.group.position.copy(ai.position);
    return;
  }

  // 3. Rebounding loose ball
  if (isBallInFlight && ballPos.y < 2.5) {
    ai.pose = 'rebound';
    const toBall = ballPos.clone().sub(ai.position);
    toBall.y = 0;
    if (toBall.length() > 0.4) {
      toBall.normalize();
      ai.position.addScaledVector(toBall, 3.5 * config.speedMultiplier * dt);
    }
    ai.rig.group.position.copy(ai.position);
    ai.rig.setPose('rebound');
    return;
  }

  // 4. Defensive Positioning: Stay between player and the hoop!
  const hoopPos = new THREE.Vector3(0, 0, COURT.HOOP_Z);
  const playerToHoop = hoopPos.clone().sub(playerPos);
  const distToHoop = playerToHoop.length();

  // Ideal defensive position: 1.1m to 1.6m in front of player on the hoop line
  const idealOffset = Math.min(1.3, distToHoop * 0.4);
  const idealDefPos = playerPos.clone().add(playerToHoop.normalize().multiplyScalar(idealOffset));
  idealDefPos.y = 0;

  // Reaction lag based on difficulty
  ai.reactionDelayTimer += dt;
  if (ai.reactionDelayTimer >= config.reactionTime) {
    ai.lastTargetPos.copy(idealDefPos);
    ai.reactionDelayTimer = 0;
  }

  const moveVec = ai.lastTargetPos.clone().sub(ai.position);
  moveVec.y = 0;
  const distToTarget = moveVec.length();

  const maxSpeed = 3.6 * config.speedMultiplier;

  if (distToTarget > 0.1) {
    moveVec.normalize();
    const currentSpeed = Math.min(distToTarget * 4, maxSpeed);
    ai.velocity.copy(moveVec).multiplyScalar(currentSpeed);
    ai.position.addScaledVector(ai.velocity, dt);

    // Sneaker squeak on sharp slide
    if (currentSpeed > 3.0 && Math.random() < 0.04) {
      sounds.playSqueak();
    }
  } else {
    ai.velocity.set(0, 0, 0);
  }

  // Boundary clamp
  ai.position.x = Math.max(-6.8, Math.min(6.8, ai.position.x));
  ai.position.z = Math.max(-0.5, Math.min(10.5, ai.position.z));
  ai.position.y = 0;
  ai.rig.group.position.copy(ai.position);

  // Face the offensive player
  const angleToPlayer = Math.atan2(playerPos.x - ai.position.x, playerPos.z - ai.position.z);
  ai.rig.group.rotation.y = angleToPlayer;

  // 5. Contest & Block Logic when player shoots or gathers
  if (isPlayerShooting || isPlayerGathering) {
    const distToShooter = ai.position.distanceTo(playerPos);

    if (distToShooter < 2.5) {
      // Chance to jump for block
      if (!ai.isAirborne && Math.random() < config.jumpBlockProbability * dt * 5) {
        ai.isAirborne = true;
        ai.jumpVelocity = 4.2;
        ai.pose = 'block_jump';
        ai.rig.setPose('block_jump');
      } else {
        ai.pose = 'contest';
        ai.rig.setPose('contest');
      }
    } else {
      ai.pose = 'stance';
      ai.rig.setPose('stance');
    }
  } else {
    ai.pose = distToTarget > 0.3 ? 'slide' : 'stance';
    ai.rig.setPose(ai.pose);
  }

  // Calculate real-time contest percentage
  ai.contestPercent = calculateContest(ai.position, playerPos, ai.pose, ai.isAirborne);
}

/**
 * Triggers ankle breaker stumble if player does a sharp crossover and AI is caught
 */
export function triggerAnkleBreaker(ai: AIDefenderState): boolean {
  const config = DIFFICULTIES[ai.level];
  // Rookie gets broken 60%, Legend only 15%
  const breakChance = Math.max(0.15, 0.7 - config.contestDiscipline * 0.55);

  if (Math.random() < breakChance && ai.stumbleTimer <= 0) {
    ai.stumbleTimer = 1.2; // Stumbles for 1.2 seconds!
    ai.velocity.x += (Math.random() > 0.5 ? 1 : -1) * 2.5;
    sounds.playWhoosh();
    sounds.playSqueak();
    return true;
  }
  return false;
}
