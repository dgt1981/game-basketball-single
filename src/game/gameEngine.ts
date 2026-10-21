import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COURT, DIFFICULTIES, WINNING_SCORE, SHOT_CLOCK_DURATION } from './constants';
import { buildCourt, CourtElements } from './court';
import { createBasketball, createCharacter, CharacterRig } from './playerModel';
import {
  createBallPhysics,
  BallPhysicsState,
  calculateShotVelocity,
  stepBallPhysics,
} from './physics';
import {
  createAIDefender,
  AIDefenderState,
  updateAIDefender,
  triggerAnkleBreaker,
} from './aiDefender';
import { ReplayRecorder } from './replay';
import {
  DifficultyLevel,
  GamePhase,
  PlayerStats,
  ShotRating,
  ShotResult,
  ReplayClip,
  ReplayKeyframe,
} from '../types/game';
import { sounds } from './audio';

// Pre-allocated math objects to ensure zero GC in animation loop
const _vec3 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();

export interface GameEngineCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onScoreUpdate: (playerScore: number, aiScore: number) => void;
  onShotClockUpdate: (secondsRemaining: number) => void;
  onShotMeterUpdate: (
    meterValue: number,
    isGreen: boolean,
    rating: ShotRating | null,
    contest: number
  ) => void;
  onShotResult: (result: ShotResult) => void;
  onMatchFinished: (playerWon: boolean, stats: PlayerStats) => void;
  onHighlightReady: (clip: ReplayClip) => void;
  onFeedbackToast: (message: string, type: 'green' | 'score' | 'ankle' | 'contest' | 'miss') => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // Game Elements
  private courtElements!: CourtElements;
  private playerRig!: CharacterRig;
  private aiDefender!: AIDefenderState;
  private ballMesh!: THREE.Mesh;
  private ballShadow!: THREE.Mesh;
  private ballPhysics!: BallPhysicsState;

  // Game State
  private phase: GamePhase = 'TITLE';
  private difficulty: DifficultyLevel = 'allstar';
  private playerName: string = '街球选手';
  private callbacks: GameEngineCallbacks;

  // Scores & Clocks
  private playerScore: number = 0;
  private aiScore: number = 0;
  private shotClock: number = SHOT_CLOCK_DURATION;
  private stats: PlayerStats = {
    points: 0,
    fgMade: 0,
    fgAttempts: 0,
    threeMade: 0,
    threeAttempts: 0,
    blocks: 0,
    steals: 0,
    ankleBreakers: 0,
  };

  // Replay
  private replayRecorder: ReplayRecorder = new ReplayRecorder();
  private lastScoredClip: ReplayClip | null = null;
  private activeReplayClip: ReplayClip | null = null;
  private replayFrameIdx: number = 0;
  private replaySpeed: number = 0.5; // Slow-mo default
  private replayCamAngle: 'broadcast' | 'rim' | 'follow' = 'broadcast';

  // Input states
  private keys: Record<string, boolean> = {};
  private touchDirection: THREE.Vector2 = new THREE.Vector2();
  private touchIsSprinting: boolean = false;
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 7.2);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerRot: number = 0;
  private isSprinting: boolean = false;

  // Shot Meter & Mechanics
  private isChargingShot: boolean = false;
  private shotChargeStartTime: number = 0;
  private sweetSpotDuration: number = 0.65; // Sweet spot at 650ms
  private pendingShotResult: ShotResult | null = null;
  private shotFlightTimer: number = 0;
  private netAnimTimer: number = -1;
  private celebrationTimer: number = 0;

  // Camera Cinematic Angles
  private titlePanAngle: number = 0;

  constructor(container: HTMLDivElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.detectHardware();
    this.initScene();
    this.initInputListeners();
    this.startLoop();
  }

  private detectHardware() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Renderer Setup with PBR standard
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.022);

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    this.camera.position.set(0, 5, 12);
    this.camera.lookAt(0, 2.5, 0);

    // 3. Procedural Studio Environment Reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 0.85);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    const d = 10;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    rimLight.position.set(-6, 8, -6);
    this.scene.add(rimLight);

    // 5. Add Court
    this.courtElements = buildCourt(this.renderer.capabilities.getMaxAnisotropy());
    this.scene.add(this.courtElements.group);

    // 6. Add Players
    this.playerRig = createCharacter({
      isPlayer: true,
      jerseyColor: 0xdc2626,
      jerseyNumber: '23',
      name: 'Player',
    });
    this.scene.add(this.playerRig.group);

    const aiRig = createCharacter({
      isPlayer: false,
      jerseyColor: 0x2563eb,
      jerseyNumber: '老黄',
      name: '老黄',
    });
    this.scene.add(aiRig.group);
    this.aiDefender = createAIDefender(aiRig, this.difficulty);

    // 7. Add Basketball
    const ballObj = createBasketball();
    this.ballMesh = ballObj.mesh;
    this.ballShadow = ballObj.shadow;
    this.scene.add(this.ballMesh);
    this.scene.add(this.ballShadow);
    this.ballPhysics = createBallPhysics();

    this.resetPositions();

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private initInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Shoot / Gather trigger
      if (e.code === 'Space' && !this.isChargingShot && this.phase === 'PLAYING') {
        e.preventDefault();
        this.startShotGather();
      }

      // Stepback trigger
      if (e.code === 'KeyX' && this.phase === 'PLAYING') {
        e.preventDefault();
        this.triggerStepBack();
      }

      // Crossover trigger
      if (e.code === 'KeyC' && this.phase === 'PLAYING') {
        e.preventDefault();
        this.triggerCrossover();
      }

      // Enter to start from title
      if (e.code === 'Enter' && this.phase === 'TITLE') {
        this.startMatch();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;

      // Shoot Release
      if (e.code === 'Space' && this.isChargingShot && this.phase === 'PLAYING') {
        e.preventDefault();
        this.releaseShot();
      }
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      if (this.isChargingShot) {
        this.releaseShot();
      }
    });
  }

  // --- External Control APIs for Touch HUD ---
  public onTouchDirection(dir: { x: number; z: number }, sprint: boolean = false) {
    if (this.phase !== 'PLAYING') return;
    this.touchDirection.set(dir.x, dir.z);
    this.touchIsSprinting = sprint;
  }

  public onTouchShootPress() {
    if (this.phase === 'PLAYING' && !this.isChargingShot) {
      this.startShotGather();
    }
  }

  public onTouchShootRelease() {
    if (this.phase === 'PLAYING' && this.isChargingShot) {
      this.releaseShot();
    }
  }

  public setDifficulty(level: DifficultyLevel) {
    this.difficulty = level;
    if (this.aiDefender) {
      this.aiDefender.level = level;
    }
  }

  public setPlayerName(name: string) {
    this.playerName = name;
  }

  public startMatch() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.shotClock = SHOT_CLOCK_DURATION;
    this.stats = {
      points: 0,
      fgMade: 0,
      fgAttempts: 0,
      threeMade: 0,
      threeAttempts: 0,
      blocks: 0,
      steals: 0,
      ankleBreakers: 0,
    };
    this.phase = 'PLAYING';
    this.callbacks.onPhaseChange(this.phase);
    this.callbacks.onScoreUpdate(this.playerScore, this.aiScore);
    this.callbacks.onShotClockUpdate(this.shotClock);
    this.resetPositions();
    sounds.playBuzzer();
  }

  public pauseMatch() {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
      this.callbacks.onPhaseChange('PAUSED');
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
      this.callbacks.onPhaseChange('PLAYING');
    }
  }

  public returnToTitle() {
    this.phase = 'TITLE';
    this.callbacks.onPhaseChange('TITLE');
    this.resetPositions();
  }

  public playReplay(clip: ReplayClip) {
    this.activeReplayClip = clip;
    this.replayFrameIdx = 0;
    this.phase = 'REPLAY';
    this.callbacks.onPhaseChange('REPLAY');
  }

  public setReplaySpeed(speed: number) {
    this.replaySpeed = speed;
  }

  public setReplayCameraAngle(angle: 'broadcast' | 'rim' | 'follow') {
    this.replayCamAngle = angle;
  }

  public stopReplay() {
    this.activeReplayClip = null;
    this.phase = 'PLAYING';
    this.callbacks.onPhaseChange('PLAYING');
    this.resetPositions();
  }

  private resetPositions() {
    this.playerPos.set(0, 0, 7.2);
    this.playerVelocity.set(0, 0, 0);
    this.playerRig.group.position.copy(this.playerPos);
    this.playerRig.setPose('dribble');

    this.aiDefender.position.set(0, 0, 4.2);
    this.aiDefender.velocity.set(0, 0, 0);
    this.aiDefender.rig.group.position.copy(this.aiDefender.position);
    this.aiDefender.rig.setPose('stance');

    this.ballPhysics.isHeld = true;
    this.ballPhysics.inAir = false;
    this.ballPhysics.hasScored = false;
    this.ballPhysics.scoreTriggered = false;
    this.ballPhysics.position.set(0.35, 0.85, 7.2);
    this.ballMesh.position.copy(this.ballPhysics.position);

    this.shotClock = SHOT_CLOCK_DURATION;
    this.isChargingShot = false;
    this.pendingShotResult = null;
    this.shotFlightTimer = 0;
  }

  // --- Offensive Action Mechanics ---
  private startShotGather() {
    if (!this.ballPhysics.isHeld) return;
    this.isChargingShot = true;
    this.shotChargeStartTime = performance.now();
    this.playerRig.setPose('gather');
  }

  private releaseShot() {
    if (!this.isChargingShot) return;
    this.isChargingShot = false;

    const chargeDuration = (performance.now() - this.shotChargeStartTime) / 1000;

    // Pump Fake check: quick tap < 0.18s
    if (chargeDuration < 0.18) {
      this.playerRig.setPose('dribble');
      // Bait AI Defender to jump or bite!
      const config = DIFFICULTIES[this.difficulty];
      if (Math.random() < 1 - config.contestDiscipline * 0.7) {
        this.aiDefender.isAirborne = true;
        this.aiDefender.jumpVelocity = 4.0;
        this.aiDefender.pose = 'block_jump';
        this.callbacks.onFeedbackToast('🎯 假动作晃飞老黄！', 'ankle');
      }
      this.callbacks.onShotMeterUpdate(0, false, null, this.aiDefender.contestPercent);
      return;
    }

    // Committed Jump Shot
    const timingDiffMs = (chargeDuration - this.sweetSpotDuration) * 1000;
    const absDiff = Math.abs(timingDiffMs);

    let rating: ShotRating = 'GOOD';
    let isGreen = false;

    if (absDiff <= 35) {
      rating = 'PERFECT';
      isGreen = true;
      sounds.playGreenChime();
      this.callbacks.onFeedbackToast('🟢 完美出手 (GREEN RELEASE)!', 'green');
    } else if (absDiff <= 75) {
      rating = timingDiffMs < 0 ? 'EARLY' : 'LATE';
    } else {
      rating = timingDiffMs < 0 ? 'VERY_EARLY' : 'VERY_LATE';
    }

    // Distance calculation
    const hoopPos = new THREE.Vector3(COURT.HOOP_X, COURT.HOOP_Y, COURT.HOOP_Z);
    const shotDist = this.playerPos.distanceTo(new THREE.Vector3(COURT.HOOP_X, 0, COURT.HOOP_Z));
    const is3Pt = shotDist >= COURT.THREE_PT_RADIUS;

    const contestPct = this.aiDefender.contestPercent;

    // Ball Release trajectory
    const releasePos = this.playerPos.clone();
    releasePos.y = 2.3; // High release point above head
    releasePos.z -= 0.2;

    const { initialVelocity, expectedDuration, isMadePrediction } = calculateShotVelocity(
      releasePos,
      hoopPos,
      timingDiffMs,
      contestPct,
      isGreen
    );

    this.ballPhysics.isHeld = false;
    this.ballPhysics.inAir = true;
    this.ballPhysics.position.copy(releasePos);
    this.ballPhysics.velocity.copy(initialVelocity);
    this.ballPhysics.hasScored = false;
    this.ballPhysics.scoreTriggered = false;

    this.phase = 'SHOT_IN_FLIGHT';
    this.playerRig.setPose('jump_shoot');
    this.callbacks.onPhaseChange(this.phase);

    this.stats.fgAttempts++;
    if (is3Pt) this.stats.threeAttempts++;

    const shotResult: ShotResult = {
      rating,
      timingOffset: Math.round(timingDiffMs),
      contestPercent: contestPct,
      isThreePointer: is3Pt,
      isMade: isMadePrediction,
      scoreAwarded: is3Pt ? 3 : 2,
      shotDistance: shotDist,
      releaseSpeed: initialVelocity.length(),
      description: isGreen
        ? '完美空心入网！'
        : contestPct > 50
        ? '顶着严密防守强行出手！'
        : '空位投篮出击',
    };

    this.pendingShotResult = shotResult;
    this.callbacks.onShotResult(shotResult);
    this.callbacks.onShotMeterUpdate(100, isGreen, rating, contestPct);

    // Announce contest toast
    if (contestPct > 55) {
      this.callbacks.onFeedbackToast(`🛡️ 老黄严密干扰 ${contestPct}%!`, 'contest');
    }
  }

  private triggerStepBack() {
    if (!this.ballPhysics.isHeld) return;
    // Step back rapidly away from hoop
    const toHoop = new THREE.Vector3(0, 0, COURT.HOOP_Z).sub(this.playerPos).normalize();
    this.playerVelocity.addScaledVector(toHoop, -5.5);
    sounds.playSqueak();
    this.callbacks.onFeedbackToast('⚡ 后撤步拉开空间！', 'ankle');

    // Trigger AI stumble check if close
    if (this.playerPos.distanceTo(this.aiDefender.position) < 2.0) {
      if (triggerAnkleBreaker(this.aiDefender)) {
        this.stats.ankleBreakers++;
        this.callbacks.onFeedbackToast('💥 晃倒老黄 (ANKLE BREAKER)!', 'ankle');
      }
    }
  }

  private triggerCrossover() {
    if (!this.ballPhysics.isHeld) return;
    const side = Math.random() > 0.5 ? 1 : -1;
    this.playerVelocity.x += side * 5.2;
    sounds.playWhoosh();
    sounds.playSqueak();

    // Check ankle breaker
    if (this.playerPos.distanceTo(this.aiDefender.position) < 2.2) {
      if (triggerAnkleBreaker(this.aiDefender)) {
        this.stats.ankleBreakers++;
        this.callbacks.onFeedbackToast('💥 突破变向晃过老黄！', 'ankle');
      }
    }
  }

  private onBasketScored() {
    if (!this.pendingShotResult) return;
    this.netAnimTimer = 0;
    this.celebrationTimer = 1.6;
    this.phase = 'SCORED_CELEBRATION';
    this.callbacks.onPhaseChange(this.phase);

    const pts = this.pendingShotResult.scoreAwarded;
    this.playerScore += pts;
    this.stats.points += pts;
    this.stats.fgMade++;
    if (this.pendingShotResult.isThreePointer) {
      this.stats.threeMade++;
    }

    this.callbacks.onScoreUpdate(this.playerScore, this.aiScore);
    this.callbacks.onFeedbackToast(
      `🎉 进球有效 +${pts}! ${this.pendingShotResult.isThreePointer ? '三分轰炸!' : '两分打进!'}`,
      'score'
    );

    // Save highlight clip
    const clip = this.replayRecorder.createClipFromBuffer(
      this.pendingShotResult,
      this.playerName,
      this.difficulty
    );
    this.lastScoredClip = clip;
    this.callbacks.onHighlightReady(clip);

    // Check match victory
    if (this.playerScore >= WINNING_SCORE) {
      setTimeout(() => {
        this.phase = 'MATCH_OVER';
        this.callbacks.onPhaseChange(this.phase);
        this.callbacks.onMatchFinished(true, this.stats);
        sounds.playBuzzer();
      }, 1200);
    }
  }

  // --- Main Animation Loop (60fps Paced) ---
  private lastTime: number = performance.now();

  private startLoop() {
    const tick = () => {
      if (this.isDisposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics explosion

      this.update(dt);
      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number) {
    const timeSec = performance.now() / 1000;

    // 1. Replay Playback Mode
    if (this.phase === 'REPLAY' && this.activeReplayClip) {
      this.updateReplayPlayback(dt);
      return;
    }

    // 2. Net Swish Animation
    if (this.netAnimTimer >= 0) {
      this.netAnimTimer += dt;
      this.courtElements.animateNet(this.netAnimTimer);
      if (this.netAnimTimer > 1.2) {
        this.netAnimTimer = -1;
      }
    }

    // 3. Title Screen Cinematic Pan
    if (this.phase === 'TITLE') {
      this.titlePanAngle += dt * 0.25;
      const camRadius = 11;
      this.camera.position.set(
        Math.sin(this.titlePanAngle) * camRadius,
        4.5 + Math.sin(this.titlePanAngle * 0.5) * 1.0,
        Math.cos(this.titlePanAngle) * camRadius + 2.5
      );
      this.camera.lookAt(0, 2.4, 0);
      return;
    }

    // 4. Celebration Post-Score
    if (this.phase === 'SCORED_CELEBRATION') {
      this.celebrationTimer -= dt;
      this.playerRig.setPose('celebrate');
      if (this.celebrationTimer <= 0) {
        this.phase = 'PLAYING';
        this.callbacks.onPhaseChange(this.phase);
        this.resetPositions();
      }
      return;
    }

    if (this.phase !== 'PLAYING' && this.phase !== 'SHOT_IN_FLIGHT') return;

    // 5. Shot Clock Countdown
    if (this.phase === 'PLAYING') {
      this.shotClock -= dt;
      this.callbacks.onShotClockUpdate(Math.max(0, Math.ceil(this.shotClock)));
      if (this.shotClock <= 0) {
        sounds.playBuzzer();
        this.callbacks.onFeedbackToast('⚠️ 进攻24秒违例！重新发球', 'miss');
        this.resetPositions();
        return;
      }
    }

    // 6. Player Movement & Dribbling
    if (this.phase === 'PLAYING' && !this.isChargingShot) {
      const moveInput = new THREE.Vector2();
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveInput.y -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveInput.y += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveInput.x -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveInput.x += 1;

      // Integrate mobile analog virtual joystick
      if (this.touchDirection.length() > 0.05) {
        moveInput.x = this.touchDirection.x;
        moveInput.y = this.touchDirection.y;
      }

      this.isSprinting = !!(
        this.keys['ShiftLeft'] ||
        this.keys['ShiftRight'] ||
        this.touchIsSprinting
      );
      const moveSpeed = this.isSprinting ? 5.2 : 3.6;

      const inputLen = moveInput.length();
      if (inputLen > 0.05) {
        if (inputLen > 1) moveInput.normalize();
        this.playerVelocity.x = moveInput.x * moveSpeed;
        this.playerVelocity.z = moveInput.y * moveSpeed;

        // Player faces forward movement or faces hoop
        this.playerRot = Math.atan2(moveInput.x, moveInput.y);

        // Sneaker squeaks
        if (Math.random() < 0.015) sounds.playSqueak();
      } else {
        this.playerVelocity.multiplyScalar(0.75); // Friction
      }

      this.playerPos.addScaledVector(this.playerVelocity, dt);

      // Court boundary limits
      this.playerPos.x = Math.max(-7.0, Math.min(7.0, this.playerPos.x));
      this.playerPos.z = Math.max(-0.5, Math.min(11.2, this.playerPos.z));

      this.playerRig.group.position.copy(this.playerPos);
      this.playerRig.group.rotation.y = this.playerRot;

      const currentSpeed = this.playerVelocity.length();
      this.playerRig.updateWalkCycle(currentSpeed, timeSec);

      // Ball Dribble attached to player hand
      if (this.ballPhysics.isHeld) {
        this.ballPhysics.dribblePhase += dt * (currentSpeed > 1 ? 16 : 10);
        const bounceHeight = Math.abs(Math.sin(this.ballPhysics.dribblePhase)) * 0.75;
        this.ballPhysics.position.set(
          this.playerPos.x + 0.38,
          COURT.BALL_RADIUS + bounceHeight,
          this.playerPos.z + 0.15
        );
        this.ballMesh.position.copy(this.ballPhysics.position);
        this.ballShadow.position.set(this.ballPhysics.position.x, 0.01, this.ballPhysics.position.z);

        if (bounceHeight < 0.08 && Math.sin(this.ballPhysics.dribblePhase) < 0) {
          sounds.playBounce(0.5);
        }
      }
    }

    // 7. Shot Meter Charge Progress
    if (this.isChargingShot) {
      const elapsed = (performance.now() - this.shotChargeStartTime) / 1000;
      const progress = Math.min(elapsed / this.sweetSpotDuration, 1.3);
      const isGreen = Math.abs(elapsed - this.sweetSpotDuration) < 0.04;
      this.callbacks.onShotMeterUpdate(
        Math.min(progress * 100, 100),
        isGreen,
        null,
        this.aiDefender.contestPercent
      );
    }

    // 8. Ball in Flight Physics
    if (this.phase === 'SHOT_IN_FLIGHT') {
      stepBallPhysics(this.ballPhysics, dt, () => this.onBasketScored());
      this.ballMesh.position.copy(this.ballPhysics.position);
      this.ballMesh.rotation.x += this.ballPhysics.angularVelocity.x * dt;
      this.ballMesh.rotation.z += this.ballPhysics.angularVelocity.z * dt;
      this.ballShadow.position.set(this.ballPhysics.position.x, 0.01, this.ballPhysics.position.z);
      const shadowScale = Math.max(0.3, 1.0 - this.ballPhysics.position.y / 6.0);
      this.ballShadow.scale.set(shadowScale, shadowScale, shadowScale);

      this.shotFlightTimer += dt;
      // If ball hit ground and didn't score after 3.2s, reset play
      if (this.shotFlightTimer > 3.2 && !this.ballPhysics.hasScored) {
        this.callbacks.onFeedbackToast('❌ 投篮不中！争抢篮板', 'miss');
        this.phase = 'PLAYING';
        this.callbacks.onPhaseChange(this.phase);
        this.resetPositions();
      }
    }

    // 9. AI Defender Update
    updateAIDefender(
      this.aiDefender,
      this.playerPos,
      this.isChargingShot,
      this.playerRig.torso.position.y < 1.1,
      this.phase === 'SHOT_IN_FLIGHT',
      this.ballPhysics.position,
      dt
    );

    // 10. Record Keyframe for Replay
    this.recordCurrentKeyframe();

    // 11. Third-Person Follow Camera with Silky Damping
    const distFromHoop = this.playerPos.z;
    _camTarget.set(this.playerPos.x * 0.4, 2.0, this.playerPos.z * 0.5 - 0.8);

    _desiredCamPos.set(
      this.playerPos.x * 0.65,
      3.8 + distFromHoop * 0.12,
      this.playerPos.z + 4.8
    );

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _desiredCamPos.x, 5.0, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _desiredCamPos.y, 5.0, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _desiredCamPos.z, 5.0, dt);
    this.camera.lookAt(_camTarget);
  }

  private recordCurrentKeyframe() {
    const frame: ReplayKeyframe = {
      timestamp: performance.now(),
      playerPos: [this.playerPos.x, this.playerPos.y, this.playerPos.z],
      playerRot: this.playerRot,
      playerPose: this.isChargingShot
        ? 'gather'
        : this.phase === 'SHOT_IN_FLIGHT'
        ? 'jump_shoot'
        : this.phase === 'SCORED_CELEBRATION'
        ? 'celebrate'
        : this.playerVelocity.length() > 0.5
        ? 'run'
        : 'dribble',
      aiPos: [this.aiDefender.position.x, this.aiDefender.position.y, this.aiDefender.position.z],
      aiRot: this.aiDefender.rig.group.rotation.y,
      aiPose: this.aiDefender.pose,
      ballPos: [this.ballPhysics.position.x, this.ballPhysics.position.y, this.ballPhysics.position.z],
      ballRot: [this.ballMesh.rotation.x, this.ballMesh.rotation.y, this.ballMesh.rotation.z],
      ballState: this.ballPhysics.isHeld
        ? 'dribbling'
        : this.ballPhysics.hasScored
        ? 'net_swish'
        : 'in_air',
    };
    this.replayRecorder.recordFrame(frame);
  }

  private updateReplayPlayback(dt: number) {
    if (!this.activeReplayClip || this.activeReplayClip.frames.length === 0) return;

    this.replayFrameIdx += dt * 30 * this.replaySpeed;
    if (this.replayFrameIdx >= this.activeReplayClip.frames.length) {
      this.replayFrameIdx = 0; // Loop replay
    }

    const idx = Math.floor(this.replayFrameIdx);
    const frame = this.activeReplayClip.frames[idx];
    if (!frame) return;

    // Apply recorded positions
    this.playerRig.group.position.set(...frame.playerPos);
    this.playerRig.group.rotation.y = frame.playerRot;
    this.playerRig.setPose(frame.playerPose);

    this.aiDefender.rig.group.position.set(...frame.aiPos);
    this.aiDefender.rig.group.rotation.y = frame.aiRot;
    this.aiDefender.rig.setPose(frame.aiPose);

    this.ballMesh.position.set(...frame.ballPos);
    this.ballShadow.position.set(frame.ballPos[0], 0.01, frame.ballPos[2]);

    // Position Camera based on replay angle
    if (this.replayCamAngle === 'broadcast') {
      this.camera.position.set(7.5, 4.0, 3.5);
      this.camera.lookAt(frame.ballPos[0], frame.ballPos[1], frame.ballPos[2]);
    } else if (this.replayCamAngle === 'rim') {
      this.camera.position.set(0, 4.2, -1.8);
      this.camera.lookAt(frame.playerPos[0], 1.5, frame.playerPos[2]);
    } else {
      // Follow cam
      this.camera.position.set(frame.playerPos[0] + 0.8, 2.8, frame.playerPos[2] + 3.8);
      this.camera.lookAt(0, 2.5, COURT.HOOP_Z);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }
}
