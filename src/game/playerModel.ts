import * as THREE from 'three';
import { COURT } from './constants';

export interface CharacterRig {
  group: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  shadowMesh: THREE.Mesh;
  setPose: (pose: string, animProgress?: number) => void;
  updateWalkCycle: (speed: number, time: number) => void;
}

export function createBasketball(): { mesh: THREE.Mesh; shadow: THREE.Mesh } {
  // Basketball texture with authentic pebble leather and black rubber seams
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base orange leather
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, 512, 256);

  // Leather pebble noise
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 4000; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 256;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // Black seams
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 6;

  // Horizontal equator seam
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(512, 128);
  ctx.stroke();

  // Vertical meridian seams
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 256);
  ctx.moveTo(384, 0);
  ctx.lineTo(384, 256);
  ctx.stroke();

  // Curved basketball side seams
  ctx.beginPath();
  ctx.arc(128, 128, 80, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(384, 128, 80, Math.PI / 2, -Math.PI / 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.SphereGeometry(COURT.BALL_RADIUS, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.55,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  // Ground contact shadow
  const shadowGeo = new THREE.PlaneGeometry(0.35, 0.35);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;

  return { mesh, shadow };
}

/**
 * Creates a detailed multi-part 3D character (Player or Defender AI)
 */
export function createCharacter(options: {
  isPlayer: boolean;
  jerseyColor: number;
  jerseyNumber: string;
  name: string;
}): CharacterRig {
  const group = new THREE.Group();
  group.name = options.name;

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: options.isPlayer ? 0xd49b72 : 0x785338,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Jersey texture with number
  const jerseyCanvas = document.createElement('canvas');
  jerseyCanvas.width = 256;
  jerseyCanvas.height = 256;
  const jCtx = jerseyCanvas.getContext('2d')!;
  jCtx.fillStyle = options.isPlayer ? '#dc2626' : '#2563eb'; // Red for Player, Royal Blue for AI
  jCtx.fillRect(0, 0, 256, 256);

  // Team stripe accent
  jCtx.fillStyle = '#ffffff';
  jCtx.fillRect(10, 0, 16, 256);
  jCtx.fillRect(230, 0, 16, 256);

  // Number or Name on jersey
  const isChineseOrMulti = options.jerseyNumber.length > 1;
  jCtx.font = isChineseOrMulti ? 'bold 74px sans-serif' : 'bold 120px sans-serif';
  jCtx.textAlign = 'center';
  jCtx.textBaseline = 'middle';
  jCtx.fillStyle = '#ffffff';
  jCtx.fillText(options.jerseyNumber, 128, 128);

  const jerseyTex = new THREE.CanvasTexture(jerseyCanvas);
  jerseyTex.colorSpace = THREE.SRGBColorSpace;

  const jerseyMat = new THREE.MeshStandardMaterial({
    map: jerseyTex,
    roughness: 0.5,
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    color: options.isPlayer ? 0x991b1b : 0x1e3a8a,
    roughness: 0.55,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: options.isPlayer ? 0xf8fafc : 0x0f172a,
    roughness: 0.3,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: options.isPlayer ? 0xdc2626 : 0x38bdf8,
    roughness: 0.4,
  });

  // 1. Torso (Jerseys & Chest)
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.32);
  const torso = new THREE.Mesh(torsoGeo, jerseyMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  group.add(torso);

  // 2. Head & Accessories (Headband, Hair)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.82, 0);

  const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Headband
  const headbandGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.06, 16);
  const headbandMat = new THREE.MeshStandardMaterial({
    color: options.isPlayer ? 0xffffff : 0x10b981,
    roughness: 0.5,
  });
  const headband = new THREE.Mesh(headbandGeo, headbandMat);
  headband.position.y = 0.04;
  headGroup.add(headband);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.185, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 0.05;
  headGroup.add(hair);

  group.add(headGroup);

  // 3. Limbs Setup with Pivot Anchors
  // Left Arm (Shoulder pivot at Y=1.52, X=-0.36)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 1.52, 0);
  const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.58, 10);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.y = -0.28;
  armL.castShadow = true;
  leftArm.add(armL);
  group.add(leftArm);

  // Right Arm (Shooting arm for player)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 1.52, 0);
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.y = -0.28;
  armR.castShadow = true;
  rightArm.add(armR);

  // Wristband on right arm
  const wristbandGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10);
  const wristband = new THREE.Mesh(wristbandGeo, headbandMat);
  wristband.position.y = -0.38;
  rightArm.add(wristband);
  group.add(rightArm);

  // 4. Shorts / Pelvis
  const shortsGeo = new THREE.BoxGeometry(0.56, 0.34, 0.34);
  const shorts = new THREE.Mesh(shortsGeo, shortsMat);
  shorts.position.y = 0.82;
  shorts.castShadow = true;
  group.add(shorts);

  // 5. Left Leg (Hip pivot at Y=0.75, X=-0.16)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.75, 0);

  const thighGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.42, 10);
  const thighL = new THREE.Mesh(thighGeo, skinMat);
  thighL.position.y = -0.2;
  thighL.castShadow = true;
  leftLeg.add(thighL);

  const leftKnee = new THREE.Group();
  leftKnee.position.set(0, -0.4, 0);
  const calfGeo = new THREE.CylinderGeometry(0.068, 0.058, 0.42, 10);
  const calfL = new THREE.Mesh(calfGeo, skinMat);
  calfL.position.y = -0.18;
  calfL.castShadow = true;
  leftKnee.add(calfL);

  // High-top Sneaker
  const shoeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.28);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(0, -0.36, 0.06);
  shoeL.castShadow = true;
  leftKnee.add(shoeL);

  const soleGeo = new THREE.BoxGeometry(0.15, 0.03, 0.3);
  const soleL = new THREE.Mesh(soleGeo, soleMat);
  soleL.position.set(0, -0.43, 0.06);
  leftKnee.add(soleL);

  leftLeg.add(leftKnee);
  group.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.75, 0);

  const thighR = new THREE.Mesh(thighGeo, skinMat);
  thighR.position.y = -0.2;
  thighR.castShadow = true;
  rightLeg.add(thighR);

  const rightKnee = new THREE.Group();
  rightKnee.position.set(0, -0.4, 0);
  const calfR = new THREE.Mesh(calfGeo, skinMat);
  calfR.position.y = -0.18;
  calfR.castShadow = true;
  rightKnee.add(calfR);

  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0, -0.36, 0.06);
  shoeR.castShadow = true;
  rightKnee.add(shoeR);

  const soleR = new THREE.Mesh(soleGeo, soleMat);
  soleR.position.set(0, -0.43, 0.06);
  rightKnee.add(soleR);

  rightLeg.add(rightKnee);
  group.add(rightLeg);

  // Contact shadow on ground
  const charShadowGeo = new THREE.PlaneGeometry(0.9, 0.9);
  const charShadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(charShadowGeo, charShadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  group.add(shadowMesh);

  // Walk/Run cycle animation
  const updateWalkCycle = (speed: number, time: number) => {
    if (speed < 0.05) {
      // Return to resting idle
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.15);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.15);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.15);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.15);
      torso.position.y = 1.25 + Math.sin(time * 3) * 0.015;
      return;
    }

    const freq = 12 * Math.min(speed / 3.0, 1.8);
    const legSwing = Math.sin(time * freq) * 0.65;
    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;

    leftKnee.rotation.x = Math.max(0, -legSwing * 0.8);
    rightKnee.rotation.x = Math.max(0, legSwing * 0.8);

    leftArm.rotation.x = -legSwing * 0.7;
    // Right arm swings less if dribbling
    rightArm.rotation.x = legSwing * 0.5;

    torso.position.y = 1.25 + Math.abs(Math.sin(time * freq)) * 0.04;
  };

  // Pose setter for shooting, dribbling, defense stance, celebrate
  const setPose = (pose: string, animProgress = 0) => {
    switch (pose) {
      case 'idle':
        leftArm.rotation.set(0.1, 0, 0.1);
        rightArm.rotation.set(0.2, 0, -0.2);
        leftLeg.rotation.set(0, 0, 0);
        rightLeg.rotation.set(0, 0, 0);
        leftKnee.rotation.set(0, 0, 0);
        rightKnee.rotation.set(0, 0, 0);
        torso.rotation.set(0, 0, 0);
        break;

      case 'dribble':
        // Dribble stance: bent knees, right arm guiding ball
        leftLeg.rotation.set(-0.25, 0, -0.15);
        rightLeg.rotation.set(0.15, 0, 0.15);
        leftKnee.rotation.set(0.45, 0, 0);
        rightKnee.rotation.set(0.35, 0, 0);
        torso.position.y = 1.15;
        // Right hand pumping down towards ball
        rightArm.rotation.set(0.7 + Math.sin(animProgress * 14) * 0.35, 0, -0.2);
        leftArm.rotation.set(0.4, 0, 0.4); // Shielding off-arm
        break;

      case 'gather':
        // Player crouches down, bringing both hands onto ball
        leftLeg.rotation.set(-0.4, 0, -0.1);
        rightLeg.rotation.set(-0.4, 0, 0.1);
        leftKnee.rotation.set(0.8, 0, 0);
        rightKnee.rotation.set(0.8, 0, 0);
        torso.position.y = 1.0;
        rightArm.rotation.set(1.2, 0, -0.25);
        leftArm.rotation.set(1.1, 0, 0.25);
        break;

      case 'jump_shoot':
        // Rising in the air, legs slightly trailing, arms extended up high
        torso.position.y = 1.25;
        leftLeg.rotation.set(0.1, 0, -0.05);
        rightLeg.rotation.set(0.15, 0, 0.05);
        leftKnee.rotation.set(0.2, 0, 0);
        rightKnee.rotation.set(0.25, 0, 0);
        // High shooting release
        rightArm.rotation.set(2.8, 0, -0.1);
        leftArm.rotation.set(2.4, 0, 0.3); // Guide hand
        break;

      case 'layup':
        // Driving layup forward elevation
        torso.position.y = 1.35;
        rightLeg.rotation.set(-0.6, 0, 0);
        rightKnee.rotation.set(1.1, 0, 0);
        leftLeg.rotation.set(0.3, 0, 0);
        rightArm.rotation.set(2.9, 0, 0.1); // Finger roll extension
        leftArm.rotation.set(0.8, 0, 0.4);
        break;

      case 'dunk_windup':
        // Tomahawk dunk takeoff: right arm cocked far back behind head, arched back
        torso.position.y = 1.35;
        torso.rotation.x = -0.35;
        rightArm.rotation.set(3.2, 0, -0.35);
        leftArm.rotation.set(1.4, 0, 0.45);
        leftLeg.rotation.set(-0.7, 0, -0.15);
        leftKnee.rotation.set(1.1, 0, 0);
        rightLeg.rotation.set(0.3, 0, 0.15);
        rightKnee.rotation.set(0.6, 0, 0);
        break;

      case 'dunk_slam':
        // Power slam downwards over the rim
        torso.position.y = 1.25;
        torso.rotation.x = 0.45;
        rightArm.rotation.set(1.8, 0, -0.1);
        leftArm.rotation.set(1.1, 0, 0.3);
        leftLeg.rotation.set(-0.2, 0, 0);
        rightLeg.rotation.set(-0.2, 0, 0);
        leftKnee.rotation.set(0.8, 0, 0);
        rightKnee.rotation.set(0.8, 0, 0);
        break;

      case 'stance': // AI defensive stance
        leftLeg.rotation.set(-0.35, 0, -0.3);
        rightLeg.rotation.set(-0.35, 0, 0.3);
        leftKnee.rotation.set(0.65, 0, 0);
        rightKnee.rotation.set(0.65, 0, 0);
        torso.position.y = 1.05;
        // Arms spread wide
        leftArm.rotation.set(0.3, 0, 1.1);
        rightArm.rotation.set(0.3, 0, -1.1);
        break;

      case 'contest': // Hand up defending shot
        leftLeg.rotation.set(-0.2, 0, -0.15);
        rightLeg.rotation.set(-0.2, 0, 0.15);
        torso.position.y = 1.12;
        rightArm.rotation.set(2.7, 0, -0.15); // Hand straight in shooter face
        leftArm.rotation.set(1.2, 0, 0.6);
        break;

      case 'block_jump': // AI airborne block attempt
        torso.position.y = 1.3;
        leftLeg.rotation.set(0.15, 0, 0);
        rightLeg.rotation.set(0.2, 0, 0);
        rightArm.rotation.set(3.05, 0, -0.05);
        leftArm.rotation.set(2.9, 0, 0.15);
        break;

      case 'stumble': // Ankle breaker stumble reaction
        torso.position.y = 0.95;
        torso.rotation.z = -0.4;
        leftLeg.rotation.set(0.6, 0, -0.4);
        rightLeg.rotation.set(-0.5, 0, 0.2);
        leftArm.rotation.set(-0.6, 0, 0.8);
        rightArm.rotation.set(-0.4, 0, -0.8);
        break;

      case 'celebrate':
        torso.position.y = 1.25;
        leftArm.rotation.set(2.6, 0, 0.4);
        rightArm.rotation.set(2.6, 0, -0.4);
        break;
    }
  };

  return {
    group,
    torso,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftKnee,
    rightKnee,
    shadowMesh,
    setPose,
    updateWalkCycle,
  };
}
