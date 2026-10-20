import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { World } from './world';

export interface Stage {
  key: string;
  name: string;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const STAGES: Stage[] = [
  { key: 'beach', name: '海边', pos: V(13.4, 5.15, 21.2), look: V(0, 5.5, 1.0) },
  { key: 'stair', name: '台阶与门廊', pos: V(0, 4.17, 6.4), look: V(0, 5.0, 3.2) },
  { key: 'hall', name: '礼堂', pos: V(0, 4.17, 3.1), look: V(0, 5.7, -7.0) },
  { key: 'terrace', name: '观海露台', pos: V(0, 4.12, -6.55), look: V(0, 3.4, -26) },
];

const SEGMENTS: Record<string, THREE.Vector3[]> = {
  '0-1': [
    V(13.4, 5.15, 21.2), V(10.0, 4.8, 18), V(6.0, 4.4, 14.5), V(2.6, 4.0, 11.6),
    V(0.6, 3.2, 10.0), V(0.15, 3.55, 8.4), V(0, 4.0, 7.2), V(0, 4.17, 6.4),
  ],
  '1-2': [
    V(0, 4.17, 6.4), V(0, 4.17, 5.35), V(0, 4.17, 4.95), V(1.55, 4.17, 4.55),
    V(2.10, 4.17, 3.80), V(1.55, 4.17, 3.30), V(0, 4.17, 3.1),
  ],
  '2-3': [
    V(0, 4.17, 3.1), V(0, 4.17, 0.6), V(0, 4.17, -2.2), V(0, 4.17, -4.7),
    V(0, 4.14, -5.9), V(0, 4.12, -6.55),
  ],
};

type Mode = 'orbit' | 'travel' | 'interior';

export class CameraDirector {
  stage = 0;
  mode: Mode = 'orbit';
  readonly controls: OrbitControls;
  private world: World;
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private travel: {
    points: THREE.Vector3[];
    lengths: number[];
    total: number;
    elapsed: number;
    duration: number;
    fromLook: THREE.Vector3;
    toLook: THREE.Vector3;
    toStage: number;
  } | null = null;
  private look = {
    yaw: 0,
    pitch: 0,
    baseYaw: 0,
    basePitch: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };
  private homePos = V(13.4, 5.15, 21.2);
  private homeLook = V(0, 5.5, 1.0);
  private onStageChange: (stage: number, mode: Mode) => void = () => {};

  constructor(world: World, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.world = world;
    this.camera = camera;
    this.canvas = canvas;
    this.controls = new OrbitControls(camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.75;
    this.controls.minDistance = 9;
    this.controls.maxDistance = 78;
    this.controls.minPolarAngle = 0.28;
    this.controls.maxPolarAngle = 1.48;
    this.controls.minAzimuthAngle = -1.32;
    this.controls.maxAzimuthAngle = 1.32;
    this.controls.target.copy(this.homeLook);
    this.controls.update();
    this.camera.rotation.order = 'YXZ';

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  setListener(fn: (stage: number, mode: Mode) => void) {
    this.onStageChange = fn;
  }

  get isTransitioning() {
    return this.mode === 'travel';
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode !== 'interior') return;
    this.look.dragging = true;
    this.look.lastX = e.clientX;
    this.look.lastY = e.clientY;
    this.canvas.classList.add('dragging');
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.mode !== 'interior' || !this.look.dragging) return;
    const dx = e.clientX - this.look.lastX;
    const dy = e.clientY - this.look.lastY;
    this.look.lastX = e.clientX;
    this.look.lastY = e.clientY;
    this.look.yaw -= dx * 0.0032;
    this.look.pitch -= dy * 0.0026;
    const maxYaw = 1.15;
    const maxPitch = 0.42;
    this.look.yaw = THREE.MathUtils.clamp(this.look.yaw, this.look.baseYaw - maxYaw, this.look.baseYaw + maxYaw);
    this.look.pitch = THREE.MathUtils.clamp(this.look.pitch, this.look.basePitch - maxPitch, this.look.basePitch + maxPitch);
  };

  private onPointerUp = () => {
    this.look.dragging = false;
    this.canvas.classList.remove('dragging');
  };

  private pathBetween(from: number, to: number): THREE.Vector3[] {
    if (from === to) return [this.camera.position.clone()];
    const dir = Math.sign(to - from);
    const pts: THREE.Vector3[] = [];
    for (let i = from; i !== to; i += dir) {
      const key = `${Math.min(i, i + dir)}-${Math.max(i, i + dir)}`;
      const seg = SEGMENTS[key];
      if (!seg) continue;
      const ordered = dir > 0 ? seg : [...seg].reverse();
      if (pts.length === 0) pts.push(...ordered.map((p) => p.clone()));
      else pts.push(...ordered.slice(1).map((p) => p.clone()));
    }
    return pts;
  }

  goTo(index: number, opts: { instant?: boolean } = {}) {
    const to = THREE.MathUtils.clamp(index, 0, STAGES.length - 1);
    if (this.mode === 'travel' && this.travel?.toStage === to) return;
    if (to === this.stage && this.mode !== 'travel') {
      this.settle(this.stage);
      return;
    }
    const path = this.pathBetween(this.stage, to);
    if (path.length === 0) return;
    // begin from wherever the camera actually is
    path[0].copy(this.camera.position);
    if (this.stage === 0 && to > 0) {
      path.splice(1, 0, V(this.camera.position.x * 0.55, 5.0, 16.5));
    }
    if (this.stage === 0 && to === 0) {
      path.push(this.homePos.clone());
      path[0].copy(this.camera.position);
    }
    if (opts.instant) {
      this.finishTravel(to);
      return;
    }
    const lengths: number[] = [];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const d = path[i].distanceTo(path[i - 1]);
      lengths.push(d);
      total += d;
    }
    const fromLook = new THREE.Vector3();
    this.camera.getWorldDirection(fromLook);
    fromLook.multiplyScalar(4).add(this.camera.position);
    const toLook = STAGES[to].look.clone();
    this.travel = {
      points: path,
      lengths,
      total,
      elapsed: 0,
      duration: THREE.MathUtils.clamp(total / 4.2, 1.4, 7.2),
      fromLook,
      toLook,
      toStage: to,
    };
    this.mode = 'travel';
    this.controls.enabled = false;
    this.canvas.classList.remove('dragging');
    this.onStageChange(this.stage, this.mode);
  }

  skip() {
    if (this.travel) {
      this.travel.elapsed = this.travel.duration;
      this.updateTravel(0);
    }
  }

  private updateTravel(dt: number) {
    if (!this.travel) return;
    const tr = this.travel;
    tr.elapsed = Math.min(tr.duration, tr.elapsed + dt);
    const raw = tr.duration > 0 ? tr.elapsed / tr.duration : 1;
    const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    const dist = t * tr.total;
    let acc = 0;
    let pos = tr.points[tr.points.length - 1];
    for (let i = 0; i < tr.lengths.length; i++) {
      if (dist <= acc + tr.lengths[i] || i === tr.lengths.length - 1) {
        const local = tr.lengths[i] > 0 ? (dist - acc) / tr.lengths[i] : 1;
        pos = tr.points[i].clone().lerp(tr.points[i + 1], THREE.MathUtils.clamp(local, 0, 1));
        break;
      }
      acc += tr.lengths[i];
    }
    this.camera.position.copy(pos);
    const lookT = THREE.MathUtils.clamp((raw - 0.15) / 0.7, 0, 1);
    const look = tr.fromLook.clone().lerp(tr.toLook, lookT * lookT * (3 - 2 * lookT));
    this.camera.lookAt(look);

    // the wooden door swings open as we approach
    const nearDoor = pos.z < 8.6 && pos.z > 3.0;
    this.world.setDoorOpen(nearDoor || tr.toStage >= 2 ? 1 : 0);

    if (raw >= 1) {
      this.travel = null;
      this.finishTravel(tr.toStage);
    }
  }

  private finishTravel(to: number) {
    this.travel = null;
    this.stage = to;
    this.mode = to >= 2 ? 'interior' : 'orbit';
    if (this.mode === 'orbit') {
      const pose = this.poseFor(to);
      this.controls.enabled = true;
      this.controls.enableZoom = true;
      this.controls.minDistance = 9;
      this.controls.maxDistance = 78;
      this.controls.minPolarAngle = 0.28;
      this.controls.maxPolarAngle = 1.48;
      this.controls.target.copy(pose.look);
      this.camera.position.copy(pose.pos);
      this.controls.update();
    } else {
      this.controls.enabled = false;
      this.enterInterior();
    }
    this.onStageChange(this.stage, this.mode);
  }

  /** stage 0 is pulled back on tall screens so the whole chapel fits */
  private poseFor(index: number) {
    const s = STAGES[index];
    if (index !== 0) return { pos: s.pos.clone(), look: s.look.clone() };
    const k = window.innerWidth / window.innerHeight < 0.95 ? 1.55 : 1;
    const pos = s.pos.clone().sub(s.look).multiplyScalar(k).add(s.look);
    return { pos, look: s.look.clone() };
  }

  private enterInterior() {
    const stage = STAGES[this.stage];
    const dir = stage.look.clone().sub(this.camera.position).normalize();
    this.look.baseYaw = Math.atan2(-dir.x, -dir.z);
    this.look.basePitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    this.look.yaw = this.look.baseYaw;
    this.look.pitch = this.look.basePitch;
    this.camera.position.copy(stage.pos);
    this.camera.rotation.set(this.look.pitch, this.look.yaw, 0, 'YXZ');
  }

  /** move one stage forward/back, used by the route buttons */
  step(dir: number) {
    this.goTo(THREE.MathUtils.clamp(this.stage + dir, 0, STAGES.length - 1));
  }

  leave() {
    this.goTo(0);
  }

  reset() {
    if (this.mode === 'travel') return;
    if (this.stage === 0) {
      const home = this.poseFor(0);
      const path = [this.camera.position.clone(), V(11, 5.6, 25), home.pos.clone()];
      const tr = {
        points: path,
        lengths: [path[1].distanceTo(path[0]), path[2].distanceTo(path[1])],
        total: path[1].distanceTo(path[0]) + path[2].distanceTo(path[1]),
        elapsed: 0,
        duration: 1.5,
        fromLook: this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(6).add(this.camera.position),
        toLook: home.look.clone(),
        toStage: 0,
      };
      this.travel = tr;
      this.mode = 'travel';
      this.controls.enabled = false;
      this.onStageChange(this.stage, this.mode);
    } else {
      this.goTo(0);
    }
  }

  settle(stage: number) {
    this.stage = stage;
    this.mode = stage >= 2 ? 'interior' : 'orbit';
    const pose = this.poseFor(stage);
    this.camera.position.copy(pose.pos);
    this.camera.lookAt(pose.look);
    if (this.mode === 'orbit') {
      this.controls.enabled = true;
      this.controls.target.copy(pose.look);
      this.controls.update();
    } else {
      this.controls.enabled = false;
      this.enterInterior();
    }
    this.onStageChange(this.stage, this.mode);
  }

  update(dt: number) {
    if (this.mode === 'travel') {
      this.updateTravel(dt);
    } else if (this.mode === 'orbit') {
      this.controls.update();
    } else {
      this.camera.rotation.set(this.look.pitch, this.look.yaw, 0, 'YXZ');
    }
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.controls.dispose();
  }
}
