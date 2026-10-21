import * as THREE from 'three';
import { COURT } from './constants';

export interface CourtElements {
  group: THREE.Group;
  hoopPosition: THREE.Vector3;
  netMesh: THREE.Mesh;
  backboardMesh: THREE.Mesh;
  rimMesh: THREE.Mesh;
  animateNet: (timeSinceScore: number) => void;
}

/**
 * Creates the procedural basketball court and hoop in Three.js
 */
export function buildCourt(maxAnisotropy: number = 4): CourtElements {
  const group = new THREE.Group();
  group.name = 'BasketballCourt';

  // 1. Procedural Court Floor Texture
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 1024;
  floorCanvas.height = 1024;
  const ctx = floorCanvas.getContext('2d')!;

  // Warm Hardwood Planks or Streetball Rubberized Surface
  ctx.fillStyle = '#c88a4e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Parquet plank stripes
  ctx.fillStyle = '#b77c44';
  const plankWidth = 32;
  for (let x = 0; x < 1024; x += plankWidth * 2) {
    ctx.fillRect(x, 0, plankWidth, 1024);
  }
  // Subtle wood grain noise
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let y = 0; y < 1024; y += 4) {
    if (Math.random() > 0.4) {
      ctx.fillRect(0, y, 1024, 2);
    }
  }

  // Paint the Restricted Area / Key zone with contrasting navy/deep blue street style
  // Coordinate mapping: Canvas X (0..1024) = Court X (-7.5..+7.5), Canvas Y (0..1024) = Court Z (-2.0..12.0)
  // Baseline is at Z = 0 (around Y=146 on canvas)
  const zToCanvasY = (z: number) => ((z - (-2.0)) / (12.0 - (-2.0))) * 1024;
  const xToCanvasX = (x: number) => ((x - (-7.5)) / (7.5 - (-7.5))) * 1024;

  const baselineY = zToCanvasY(0);
  const keyLeftX = xToCanvasX(-COURT.KEY_WIDTH / 2);
  const keyRightX = xToCanvasX(COURT.KEY_WIDTH / 2);
  const freeThrowY = zToCanvasY(COURT.FREE_THROW_DIST);

  // Painted Key interior
  ctx.fillStyle = '#1e293b'; // Sleek dark slate key
  ctx.fillRect(keyLeftX, baselineY, keyRightX - keyLeftX, freeThrowY - baselineY);

  // White Regulation Court Markings
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#f8fafc';
  ctx.lineCap = 'round';

  // Baseline
  ctx.beginPath();
  ctx.moveTo(xToCanvasX(-7.5), baselineY);
  ctx.lineTo(xToCanvasX(7.5), baselineY);
  ctx.stroke();

  // Court perimeter sidelines
  ctx.beginPath();
  ctx.moveTo(xToCanvasX(-7.5), baselineY);
  ctx.lineTo(xToCanvasX(-7.5), zToCanvasY(12.0));
  ctx.lineTo(xToCanvasX(7.5), zToCanvasY(12.0));
  ctx.lineTo(xToCanvasX(7.5), baselineY);
  ctx.stroke();

  // Key outline
  ctx.strokeRect(keyLeftX, baselineY, keyRightX - keyLeftX, freeThrowY - baselineY);

  // Free-throw circle
  const ftCenterX = xToCanvasX(0);
  const ftRadius = ((1.8) / 15.0) * 1024;
  ctx.beginPath();
  ctx.arc(ftCenterX, freeThrowY, ftRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 3-Point Arc
  const hoopCanvasX = xToCanvasX(COURT.HOOP_X);
  const hoopCanvasY = zToCanvasY(COURT.HOOP_Z);
  const threePtPixelRadius = (COURT.THREE_PT_RADIUS / 15.0) * 1024;

  ctx.beginPath();
  // 3-Point line straight corners then arc
  const straightZ = 3.0; // corner 3 transition
  const cornerXOffset = ((6.6) / 15.0) * 1024;
  ctx.moveTo(ftCenterX - cornerXOffset, baselineY);
  ctx.lineTo(ftCenterX - cornerXOffset, zToCanvasY(straightZ));
  ctx.arc(hoopCanvasX, hoopCanvasY, threePtPixelRadius, Math.PI * 0.16, Math.PI * 0.84, false);
  ctx.lineTo(ftCenterX + cornerXOffset, baselineY);
  ctx.stroke();

  // Center Court Arc
  ctx.beginPath();
  const halfCourtY = zToCanvasY(12.0);
  ctx.arc(ftCenterX, halfCourtY, ftRadius * 1.5, Math.PI, 0, false);
  ctx.stroke();

  // Mid-court logo / 挑战老黄 text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('挑战老黄 1v1', ftCenterX, zToCanvasY(9.0));

  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.anisotropy = maxAnisotropy;

  // Floor Mesh
  const floorGeo = new THREE.PlaneGeometry(COURT.WIDTH, COURT.LENGTH);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.35,
    metalness: 0.05,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  // Center plane so Z: -2.0 to 12.0 -> center is 5.0
  floorMesh.position.set(0, 0, 5.0);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Outer Apron / Ground extension
  const outerFloorGeo = new THREE.PlaneGeometry(36, 36);
  const outerFloorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.1,
  });
  const outerFloor = new THREE.Mesh(outerFloorGeo, outerFloorMat);
  outerFloor.rotation.x = -Math.PI / 2;
  outerFloor.position.set(0, -0.01, 5.0);
  outerFloor.receiveShadow = true;
  group.add(outerFloor);

  // 2. Hoop Stanchion, Backboard, Rim, and Net
  const hoopPosition = new THREE.Vector3(COURT.HOOP_X, COURT.HOOP_Y, COURT.HOOP_Z);

  // Stanchion Base & Main Pole
  const poleBaseGeo = new THREE.BoxGeometry(0.8, 1.4, 0.8);
  const poleBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Navy padded safety stanchion
    roughness: 0.6,
  });
  const poleBase = new THREE.Mesh(poleBaseGeo, poleBaseMat);
  poleBase.position.set(0, 0.7, COURT.BACKBOARD_Z - 1.2);
  poleBase.castShadow = true;
  poleBase.receiveShadow = true;
  group.add(poleBase);

  // Heavy steel pole angling forward to support backboard
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.11, 4.2, 16);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.25,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, 2.2, COURT.BACKBOARD_Z - 0.7);
  pole.rotation.x = 0.25;
  pole.castShadow = true;
  group.add(pole);

  // Horizontal cantilever arm
  const armGeo = new THREE.BoxGeometry(0.12, 0.12, 1.1);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(0, 3.4, COURT.BACKBOARD_Z - 0.55);
  group.add(arm);

  // 3. Transparent Acrylic Backboard with painted target square
  const bbCanvas = document.createElement('canvas');
  bbCanvas.width = 512;
  bbCanvas.height = 300;
  const bbCtx = bbCanvas.getContext('2d')!;
  bbCtx.fillStyle = 'rgba(230, 245, 255, 0.35)'; // Glass tinted
  bbCtx.fillRect(0, 0, 512, 300);

  // Outer border
  bbCtx.strokeStyle = '#ffffff';
  bbCtx.lineWidth = 14;
  bbCtx.strokeRect(7, 7, 498, 286);

  // Inner target box (above rim)
  bbCtx.lineWidth = 10;
  bbCtx.strokeRect(176, 120, 160, 120);

  const bbTexture = new THREE.CanvasTexture(bbCanvas);
  bbTexture.colorSpace = THREE.SRGBColorSpace;

  const backboardGeo = new THREE.BoxGeometry(COURT.BACKBOARD_WIDTH, COURT.BACKBOARD_HEIGHT, 0.05);
  const backboardMat = new THREE.MeshStandardMaterial({
    map: bbTexture,
    transparent: true,
    opacity: 0.88,
    roughness: 0.1,
    metalness: 0.1,
  });
  const backboardMesh = new THREE.Mesh(backboardGeo, backboardMat);
  backboardMesh.position.set(0, COURT.HOOP_Y + 0.35, COURT.BACKBOARD_Z);
  backboardMesh.castShadow = true;
  group.add(backboardMesh);

  // Backboard safety padding along bottom
  const bbPadGeo = new THREE.BoxGeometry(COURT.BACKBOARD_WIDTH + 0.06, 0.08, 0.09);
  const bbPadMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
  const bbPad = new THREE.Mesh(bbPadGeo, bbPadMat);
  bbPad.position.set(0, COURT.HOOP_Y + 0.35 - COURT.BACKBOARD_HEIGHT / 2, COURT.BACKBOARD_Z);
  group.add(bbPad);

  // 4. Solid Orange Metal Breakaway Rim
  const rimGeo = new THREE.TorusGeometry(COURT.RIM_RADIUS, 0.018, 12, 32);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Vivid NBA Orange
    metalness: 0.4,
    roughness: 0.3,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.copy(hoopPosition);
  rimMesh.castShadow = true;
  group.add(rimMesh);

  // Rim connector bracket to backboard
  const bracketGeo = new THREE.BoxGeometry(0.12, 0.08, COURT.HOOP_Z - COURT.BACKBOARD_Z);
  const bracket = new THREE.Mesh(bracketGeo, rimMat);
  bracket.position.set(0, COURT.HOOP_Y, (COURT.HOOP_Z + COURT.BACKBOARD_Z) / 2);
  group.add(bracket);

  // 5. Basketball Net (3D Cone mesh with procedural open weave texture)
  const netCanvas = document.createElement('canvas');
  netCanvas.width = 256;
  netCanvas.height = 256;
  const netCtx = netCanvas.getContext('2d')!;
  netCtx.fillStyle = 'rgba(0,0,0,0)';
  netCtx.fillRect(0, 0, 256, 256);
  netCtx.strokeStyle = '#ffffff';
  netCtx.lineWidth = 5;

  // Weave diamond pattern
  const grid = 32;
  for (let x = -256; x < 512; x += grid) {
    netCtx.beginPath();
    netCtx.moveTo(x, 0);
    netCtx.lineTo(x + 256, 256);
    netCtx.stroke();

    netCtx.beginPath();
    netCtx.moveTo(x, 256);
    netCtx.lineTo(x + 256, 0);
    netCtx.stroke();
  }
  const netTexture = new THREE.CanvasTexture(netCanvas);
  netTexture.wrapS = THREE.RepeatWrapping;
  netTexture.wrapT = THREE.RepeatWrapping;
  netTexture.repeat.set(4, 2);

  const netGeo = new THREE.CylinderGeometry(COURT.RIM_RADIUS * 0.98, COURT.RIM_RADIUS * 0.55, 0.55, 18, 4, true);
  const netMat = new THREE.MeshStandardMaterial({
    map: netTexture,
    transparent: true,
    alphaTest: 0.15,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const netMesh = new THREE.Mesh(netGeo, netMat);
  netMesh.position.set(COURT.HOOP_X, COURT.HOOP_Y - 0.28, COURT.HOOP_Z);
  group.add(netMesh);

  // Dynamic net swish animation handler
  const initialScaleY = netMesh.scale.y;
  const animateNet = (timeSinceScore: number) => {
    if (timeSinceScore < 0 || timeSinceScore > 1.2) {
      netMesh.scale.set(1, 1, 1);
      netMesh.rotation.y = 0;
      return;
    }
    // Damped elastic oscillation (ball passing through pulls and shakes the net)
    const decay = Math.exp(-timeSinceScore * 4);
    const stretch = Math.sin(timeSinceScore * 18) * decay * 0.45;
    netMesh.scale.set(1 + stretch * 0.5, initialScaleY + stretch * 0.7, 1 + stretch * 0.5);
    netMesh.rotation.y = Math.sin(timeSinceScore * 24) * decay * 0.25;
  };

  // 6. Arena Atmosphere: Fences, Perimeter Stadium Seating & Floodlights
  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.5,
    wireframe: true,
  });
  const fenceGeo = new THREE.PlaneGeometry(16, 3);
  // Back fence behind hoop
  const backFence = new THREE.Mesh(fenceGeo, fenceMat);
  backFence.position.set(0, 1.5, -3.0);
  group.add(backFence);

  // Left & Right boundary fences
  const sideFenceGeo = new THREE.PlaneGeometry(18, 3);
  const leftFence = new THREE.Mesh(sideFenceGeo, fenceMat);
  leftFence.rotation.y = Math.PI / 2;
  leftFence.position.set(-8.5, 1.5, 5.0);
  group.add(leftFence);

  const rightFence = new THREE.Mesh(sideFenceGeo, fenceMat);
  rightFence.rotation.y = -Math.PI / 2;
  rightFence.position.set(8.5, 1.5, 5.0);
  group.add(rightFence);

  // Stadium Arena Lights (Floodlight Towers)
  const createLightTower = (x: number, z: number, targetPos: THREE.Vector3) => {
    const towerGroup = new THREE.Group();
    const mastGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 4;
    towerGroup.add(mast);

    const headGeo = new THREE.BoxGeometry(1.2, 0.6, 0.4);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 8, 0);
    towerGroup.add(head);

    // SpotLight
    const spot = new THREE.SpotLight(0xfff5e6, 120, 28, Math.PI / 3.5, 0.4, 1.0);
    spot.position.set(0, 8, 0);
    spot.target.position.copy(targetPos);
    group.add(spot.target);
    towerGroup.add(spot);

    towerGroup.position.set(x, 0, z);
    return towerGroup;
  };

  group.add(createLightTower(-8, -2, new THREE.Vector3(0, 0, 4)));
  group.add(createLightTower(8, -2, new THREE.Vector3(0, 0, 4)));
  group.add(createLightTower(-8, 12, new THREE.Vector3(0, 0, 5)));
  group.add(createLightTower(8, 12, new THREE.Vector3(0, 0, 5)));

  return {
    group,
    hoopPosition,
    netMesh,
    backboardMesh,
    rimMesh,
    animateNet,
  };
}
