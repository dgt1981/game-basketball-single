import * as THREE from 'three';
import { COURT } from './constants';

export interface CourtElements {
  group: THREE.Group;
  hoopPosition: THREE.Vector3;
  netMesh: THREE.Mesh;
  backboardMesh: THREE.Mesh;
  rimMesh: THREE.Object3D;
  animateNet: (timeSinceScore: number) => void;
}

/**
 * Creates the procedural basketball court, authentic NBA breakaway hoop, backboard, and net in Three.js
 */
export function buildCourt(maxAnisotropy: number = 4): CourtElements {
  const group = new THREE.Group();
  group.name = 'BasketballCourt';

  // -------------------------------------------------------------
  // 1. Procedural Court Floor Texture
  // -------------------------------------------------------------
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 1024;
  floorCanvas.height = 1024;
  const ctx = floorCanvas.getContext('2d')!;

  // Warm Hardwood Planks
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

  // Coordinate mapping: Canvas X (0..1024) = Court X (-7.5..+7.5), Canvas Y (0..1024) = Court Z (-2.0..12.0)
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
  const straightZ = 3.0;
  const cornerXOffset = ((6.6) / 15.0) * 1024;
  ctx.moveTo(ftCenterX - cornerXOffset, baselineY);
  ctx.lineTo(ftCenterX - cornerXOffset, zToCanvasY(straightZ));
  ctx.arc(hoopCanvasX, hoopCanvasY, threePtPixelRadius, Math.PI * 0.16, Math.PI * 0.84, false);
  ctx.lineTo(ftCenterX + cornerXOffset, baselineY);
  ctx.stroke();

  // Restricted Area Arc (1.25m from hoop center)
  const restrictedPixelRadius = (1.25 / 15.0) * 1024;
  ctx.beginPath();
  ctx.arc(hoopCanvasX, hoopCanvasY, restrictedPixelRadius, 0, Math.PI, false);
  ctx.stroke();

  // Center Court Arc
  ctx.beginPath();
  const halfCourtY = zToCanvasY(12.0);
  ctx.arc(ftCenterX, halfCourtY, ftRadius * 1.5, Math.PI, 0, false);
  ctx.stroke();

  // Mid-court text
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
  floorMesh.position.set(0, 0, 5.0);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Outer Apron
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

  // -------------------------------------------------------------
  // 2. Heavy Regulation Stanchion Support Structure
  // -------------------------------------------------------------
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x242d3d,
    metalness: 0.75,
    roughness: 0.28,
  });

  const safetyPadMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Professional safety blue
    roughness: 0.65,
    metalness: 0.1,
  });

  // Stanchion Padded Base (behind court baseline at Z = -2.6)
  const basePadGeo = new THREE.BoxGeometry(1.0, 1.4, 1.1);
  const basePad = new THREE.Mesh(basePadGeo, safetyPadMat);
  basePad.position.set(0, 0.7, -2.6);
  basePad.castShadow = true;
  basePad.receiveShadow = true;
  group.add(basePad);

  // Main Stanchion Mast (slanted forward from base)
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.8, 16);
  const mast = new THREE.Mesh(mastGeo, steelMat);
  mast.position.set(0, 2.0, -2.15);
  mast.rotation.x = 0.32;
  mast.castShadow = true;
  group.add(mast);

  // Cantilever Boom Arm extending forward horizontally directly to backboard mount
  // Connects from mast top at Z = -1.7 up to backboard at Z = COURT.BACKBOARD_Z (-1.2)
  const boomArmGeo = new THREE.BoxGeometry(0.14, 0.14, 0.65);
  const boomArm = new THREE.Mesh(boomArmGeo, steelMat);
  boomArm.position.set(0, 3.4, COURT.BACKBOARD_Z - 0.32);
  boomArm.castShadow = true;
  group.add(boomArm);

  // Left & Right diagonal backboard stabilization struts
  const strutGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.95, 8);
  const strutLeft = new THREE.Mesh(strutGeo, steelMat);
  strutLeft.position.set(-0.45, 3.55, COURT.BACKBOARD_Z - 0.25);
  strutLeft.rotation.z = -0.55;
  strutLeft.rotation.x = 0.35;
  group.add(strutLeft);

  const strutRight = new THREE.Mesh(strutGeo, steelMat);
  strutRight.position.set(0.45, 3.55, COURT.BACKBOARD_Z - 0.25);
  strutRight.rotation.z = 0.55;
  strutRight.rotation.x = 0.35;
  group.add(strutRight);

  // Rear Heavy Steel Mounting Plate behind backboard
  const rearPlateGeo = new THREE.BoxGeometry(0.36, 0.32, 0.04);
  const rearPlate = new THREE.Mesh(rearPlateGeo, steelMat);
  rearPlate.position.set(0, COURT.HOOP_Y + 0.18, COURT.BACKBOARD_Z - 0.025);
  group.add(rearPlate);

  // -------------------------------------------------------------
  // 3. Clear Tempered Glass Backboard
  // -------------------------------------------------------------
  const bbCanvas = document.createElement('canvas');
  bbCanvas.width = 1024;
  bbCanvas.height = 600;
  const bbCtx = bbCanvas.getContext('2d')!;

  // High-clarity glass translucency tint
  bbCtx.fillStyle = 'rgba(215, 235, 250, 0.22)';
  bbCtx.fillRect(0, 0, 1024, 600);

  // Outer border (white 50mm regulation stripe)
  bbCtx.strokeStyle = '#ffffff';
  bbCtx.lineWidth = 16;
  bbCtx.strokeRect(12, 12, 1000, 576);

  // Inner regulation target box (590mm x 450mm)
  // Backboard height is 1.05m (600px -> 571 px/m)
  // Rim height is 3.05m; Backboard bottom is at 2.875m (0.175m below rim -> 100px from bottom)
  // Bottom of target rectangle aligns with rim: Canvas Y = 600 - 100 = 500
  // Target box height: 0.45m * 571 = 257px -> top = 500 - 257 = 243
  // Target box width: 0.59m * 571 = 337px -> left = 512 - 168 = 344
  bbCtx.lineWidth = 14;
  bbCtx.strokeRect(344, 243, 336, 257);

  // Streetball / League Brand mark in top center of backboard
  bbCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  bbCtx.font = 'bold 22px sans-serif';
  bbCtx.textAlign = 'center';
  bbCtx.fillText('★ 1v1 CHAMPIONSHIP ★', 512, 180);

  const bbTexture = new THREE.CanvasTexture(bbCanvas);
  bbTexture.colorSpace = THREE.SRGBColorSpace;
  bbTexture.anisotropy = maxAnisotropy;

  const backboardGeo = new THREE.BoxGeometry(COURT.BACKBOARD_WIDTH, COURT.BACKBOARD_HEIGHT, 0.025);
  const backboardMat = new THREE.MeshStandardMaterial({
    map: bbTexture,
    transparent: true,
    opacity: 0.88,
    roughness: 0.08,
    metalness: 0.05,
    depthWrite: true,
  });
  const backboardMesh = new THREE.Mesh(backboardGeo, backboardMat);
  backboardMesh.position.set(0, COURT.HOOP_Y + 0.35, COURT.BACKBOARD_Z);
  backboardMesh.castShadow = true;
  group.add(backboardMesh);

  // Dark steel outer protective channel frame around glass
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 });
  const frameGeo = new THREE.BoxGeometry(COURT.BACKBOARD_WIDTH + 0.04, COURT.BACKBOARD_HEIGHT + 0.04, 0.035);
  // Using edges wireframe or outer trim box
  const bottomPadGeo = new THREE.BoxGeometry(COURT.BACKBOARD_WIDTH + 0.06, 0.09, 0.08);
  const bottomPad = new THREE.Mesh(bottomPadGeo, safetyPadMat);
  bottomPad.position.set(0, COURT.HOOP_Y + 0.35 - COURT.BACKBOARD_HEIGHT / 2, COURT.BACKBOARD_Z + 0.01);
  group.add(bottomPad);

  // Side safety corner pads
  const sidePadGeo = new THREE.BoxGeometry(0.06, 0.35, 0.08);
  const sidePadLeft = new THREE.Mesh(sidePadGeo, safetyPadMat);
  sidePadLeft.position.set(-COURT.BACKBOARD_WIDTH / 2 - 0.01, COURT.HOOP_Y + 0.35 - COURT.BACKBOARD_HEIGHT / 2 + 0.17, COURT.BACKBOARD_Z + 0.01);
  group.add(sidePadLeft);

  const sidePadRight = new THREE.Mesh(sidePadGeo, safetyPadMat);
  sidePadRight.position.set(COURT.BACKBOARD_WIDTH / 2 + 0.01, COURT.HOOP_Y + 0.35 - COURT.BACKBOARD_HEIGHT / 2 + 0.17, COURT.BACKBOARD_Z + 0.01);
  group.add(sidePadRight);

  // -------------------------------------------------------------
  // 4. Authentic Breakaway Rim & Mounting Bracket Assembly
  // -------------------------------------------------------------
  // Dimensions & Coordinates:
  // Backboard front face is at Z = COURT.BACKBOARD_Z + 0.0125 (-1.1875)
  // Hoop center is at Z = COURT.HOOP_Z (-0.80)
  // Rim radius is COURT.RIM_RADIUS (0.23)
  // Rear edge of the rim ring is at Z = -0.80 - 0.23 = -1.03
  // Mounting flange / spring housing connects between Backboard (-1.19) and Rim Rear (-1.03)
  // Depth of flange = 0.16m. It DOES NOT protrude into the ring opening!

  const rimOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Vivid Official NBA Orange
    metalness: 0.45,
    roughness: 0.25,
  });

  const bracketSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe05600, // Matching dark orange / red-orange steel
    metalness: 0.5,
    roughness: 0.3,
  });

  // Stationary Mounting Box / Spring Enclosure on Backboard
  // Spans from Z = -1.19 to Z = -1.03 (length = 0.16)
  const bracketDepth = 0.16;
  const bracketCenterZ = COURT.BACKBOARD_Z + 0.0125 + bracketDepth / 2; // -1.1075
  const bracketGeo = new THREE.BoxGeometry(0.16, 0.08, bracketDepth);
  const bracketMesh = new THREE.Mesh(bracketGeo, bracketSteelMat);
  bracketMesh.position.set(0, COURT.HOOP_Y, bracketCenterZ);
  bracketMesh.castShadow = true;
  group.add(bracketMesh);

  // Left & Right angled gusset reinforcement wings on the bracket
  const gussetGeo = new THREE.BoxGeometry(0.015, 0.06, 0.14);
  const gussetLeft = new THREE.Mesh(gussetGeo, bracketSteelMat);
  gussetLeft.position.set(-0.08, COURT.HOOP_Y - 0.01, bracketCenterZ);
  gussetLeft.rotation.y = 0.15;
  group.add(gussetLeft);

  const gussetRight = new THREE.Mesh(gussetGeo, bracketSteelMat);
  gussetRight.position.set(0.08, COURT.HOOP_Y - 0.01, bracketCenterZ);
  gussetRight.rotation.y = -0.15;
  group.add(gussetRight);

  // Breakaway Hinge Pin (horizontal steel cylindrical pin at Z = -1.03)
  const hingePinGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.17, 12);
  const hingePin = new THREE.Mesh(hingePinGeo, steelMat);
  hingePin.rotation.z = Math.PI / 2;
  hingePin.position.set(0, COURT.HOOP_Y, -1.03);
  group.add(hingePin);

  // -------------------------------------------------------------
  // Breakaway Rim Dynamic Pivot Group
  // Pivot origin is located exactly at the Hinge Pin: (0, COURT.HOOP_Y, -1.03)
  // When dunked or pulled, rotating rimPivotGroup.rotation.x tilts the ring
  // down realistically around the hinge!
  // In resting state, rimPivotGroup.rotation.x = 0, and the rim ring is
  // 100% HORIZONTAL in the XZ plane!
  // -------------------------------------------------------------
  const rimPivotGroup = new THREE.Group();
  rimPivotGroup.name = 'BreakawayRimPivot';
  rimPivotGroup.position.set(COURT.HOOP_X, COURT.HOOP_Y, -1.03);

  // Distance from hinge (-1.03) to rim center (-0.80) is +0.23m
  const rimCenterOffsetZ = 0.23;

  // Solid Orange Metal Rim Ring
  const rimGeo = new THREE.TorusGeometry(COURT.RIM_RADIUS, 0.018, 16, 40);
  // Pre-rotate Torus so it lies horizontally in the XZ plane by default!
  rimGeo.rotateX(Math.PI / 2);

  const rimRingMesh = new THREE.Mesh(rimGeo, rimOrangeMat);
  rimRingMesh.position.set(0, 0, rimCenterOffsetZ);
  rimRingMesh.castShadow = true;
  rimPivotGroup.add(rimRingMesh);

  // Front lip reinforcement plate connecting hinge to the ring
  const hingePlateGeo = new THREE.BoxGeometry(0.12, 0.02, 0.06);
  const hingePlate = new THREE.Mesh(hingePlateGeo, bracketSteelMat);
  hingePlate.position.set(0, 0, 0.03);
  rimPivotGroup.add(hingePlate);

  // -------------------------------------------------------------
  // 5. Basketball Net
  // Attached to the rim pivot so it moves seamlessly when the rim flexes!
  // -------------------------------------------------------------
  const netCanvas = document.createElement('canvas');
  netCanvas.width = 512;
  netCanvas.height = 512;
  const netCtx = netCanvas.getContext('2d')!;
  netCtx.fillStyle = 'rgba(0,0,0,0)';
  netCtx.fillRect(0, 0, 512, 512);

  // High-visibility crisp white braided cord with diamond mesh & knots
  netCtx.strokeStyle = '#ffffff';
  netCtx.lineWidth = 7;
  netCtx.lineCap = 'round';

  const gridStep = 42;
  // Diagonal cords \
  for (let x = -512; x < 1024; x += gridStep) {
    netCtx.beginPath();
    netCtx.moveTo(x, 0);
    netCtx.lineTo(x + 512, 512);
    netCtx.stroke();
  }
  // Diagonal cords /
  for (let x = -512; x < 1024; x += gridStep) {
    netCtx.beginPath();
    netCtx.moveTo(x, 512);
    netCtx.lineTo(x + 512, 0);
    netCtx.stroke();
  }

  // Knot dots at intersections
  netCtx.fillStyle = '#f1f5f9';
  for (let x = 0; x <= 512; x += gridStep) {
    for (let y = 0; y <= 512; y += gridStep) {
      netCtx.beginPath();
      netCtx.arc(x, y, 4, 0, Math.PI * 2);
      netCtx.fill();
    }
  }

  const netTexture = new THREE.CanvasTexture(netCanvas);
  netTexture.wrapS = THREE.RepeatWrapping;
  netTexture.wrapT = THREE.ClampToEdgeWrapping;
  netTexture.repeat.set(6, 1);

  // Net geometry: Top radius fits rim ring (0.222m), Bottom tapers (0.12m), Length 0.42m
  const netHeight = 0.42;
  const netGeo = new THREE.CylinderGeometry(
    COURT.RIM_RADIUS * 0.96, // 0.2208m
    COURT.RIM_RADIUS * 0.52, // 0.12m
    netHeight,
    20,
    6,
    true
  );
  // Translate geometry downwards so top rim edge is at Y = 0 (hangs down to Y = -0.42)
  netGeo.translate(0, -netHeight / 2, 0);

  const netMat = new THREE.MeshStandardMaterial({
    map: netTexture,
    transparent: true,
    alphaTest: 0.18,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0.05,
  });

  const netMesh = new THREE.Mesh(netGeo, netMat);
  // Positioned directly under the rim center
  netMesh.position.set(0, -0.015, rimCenterOffsetZ);
  rimPivotGroup.add(netMesh);

  // Add the assembled rim pivot group to the court group
  group.add(rimPivotGroup);

  // Dynamic Net Swish & Ripple Handler
  const animateNet = (timeSinceScore: number) => {
    if (timeSinceScore < 0 || timeSinceScore > 1.25) {
      netMesh.scale.set(1, 1, 1);
      netMesh.rotation.y = 0;
      return;
    }
    // High-energy damped elastic oscillation as ball pushes through net
    const decay = Math.exp(-timeSinceScore * 4.2);
    const flare = Math.sin(timeSinceScore * 16) * decay * 0.55;
    const verticalPull = Math.sin(timeSinceScore * 14 + 0.3) * decay * 0.35;

    // Flare outward at the bottom while top stays firmly attached to rim
    netMesh.scale.set(1 + Math.max(-0.2, flare), 1 + verticalPull, 1 + Math.max(-0.2, flare));
    netMesh.rotation.y = Math.sin(timeSinceScore * 22) * decay * 0.22;
  };

  // -------------------------------------------------------------
  // 6. Arena Perimeter Stadium Seating & Floodlights
  // -------------------------------------------------------------
  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.5,
    wireframe: true,
  });
  const fenceGeo = new THREE.PlaneGeometry(16, 3);
  const backFence = new THREE.Mesh(fenceGeo, fenceMat);
  backFence.position.set(0, 1.5, -3.2);
  group.add(backFence);

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
    const mastTowerGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 8);
    const mastTowerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const mastTower = new THREE.Mesh(mastTowerGeo, mastTowerMat);
    mastTower.position.y = 4;
    towerGroup.add(mastTower);

    const headGeo = new THREE.BoxGeometry(1.2, 0.6, 0.4);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 8, 0);
    towerGroup.add(head);

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

  const hoopPosition = new THREE.Vector3(COURT.HOOP_X, COURT.HOOP_Y, COURT.HOOP_Z);

  return {
    group,
    hoopPosition,
    netMesh,
    backboardMesh,
    rimMesh: rimPivotGroup,
    animateNet,
  };
}
