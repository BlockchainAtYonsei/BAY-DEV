import * as THREE from "three";
import { CHAINS, sampleChainPoints } from "./chains";

const PARTICLES = 620;
const LOGO_SCALE = 15;
const SPAWN_INTERVAL = 4.6;

// 타임라인 (초): 폭발 비행 → 로고로 수렴 → 유지 → 낙하/소멸
const BURST_END = 0.8;
const MORPH_END = 1.8;
const HOLD_END = 3.4;
const LIFE_END = 4.4;

type Firework = {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  velocities: Float32Array;
  targets: Float32Array;
  baseColors: Float32Array;
  phases: Float32Array;
  t: number;
};

function makeGlowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

export class FireworksEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-50, 50, 50, -50, -100, 100);
  private texture: THREE.Texture;
  private fireworks: Firework[] = [];
  private chainIndex = 0;
  private spawnTimer = 1.2;
  private elapsed = 0;
  private raf = 0;
  private lastTime = 0;
  private paused = false;
  private halfWidth = 50;
  private worldPerPx = 0.1;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      // 배경 장식이라 통합 GPU로 충분하다 — 노트북 배터리를 아낀다
      powerPreference: "low-power"
    });
    // 배경 장식이라 1.5배 픽셀 밀도면 충분하다 — 레티나에서 필레이트를 크게 아낀다
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.texture = makeGlowTexture();
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.lastTime = performance.now();
    this.loop();
  }

  // 탭이 안 보이는 동안은 완전히 멈춘다 (보이는 화면은 그대로, GPU·배터리만 절약)
  private onVisibility = () => {
    if (document.hidden) {
      this.paused = true;
      cancelAnimationFrame(this.raf);
    } else if (this.paused) {
      this.paused = false;
      // 멈춰 있던 시간만큼 dt가 튀지 않도록 시계를 다시 맞춘다
      this.lastTime = performance.now();
      this.loop();
    }
  };

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.halfWidth = 50 * (w / h);
    this.worldPerPx = (this.halfWidth * 2) / w;
    this.camera.left = -this.halfWidth;
    this.camera.right = this.halfWidth;
    this.camera.updateProjectionMatrix();
  };

  /** 콘텐츠에 가려지지 않는 빈 하늘(양옆 또는 콘텐츠 아래)에서 터질 위치를 고른다 */
  private pickSpawnSpot(): { x: number; y: number; scale: number } {
    const columnHalf = 330 * this.worldPerPx; // 콘텐츠 최대 폭(560px)의 절반 + 여유
    const margin = LOGO_SCALE + 3;
    const bandWidth = this.halfWidth - columnHalf - margin * 2;

    if (bandWidth >= 2) {
      // 넓은 화면: 콘텐츠 양옆 빈 하늘
      const side = Math.random() < 0.5 ? -1 : 1;
      return {
        x: side * (columnHalf + margin + Math.random() * bandWidth),
        y: 4 + Math.random() * 24,
        scale: LOGO_SCALE
      };
    }

    // 좁은 화면(모바일 등): 콘텐츠 카드 아래 빈 공간을 실측해서 사용
    const main = document.querySelector("main");
    const viewH = window.innerHeight;
    const bottomPx = main
      ? Math.min(Math.max(main.getBoundingClientRect().bottom, 0), viewH)
      : viewH * 0.6;
    const topWorld = 50 - (bottomPx / viewH) * 100 - 2;
    const bottomWorld = -46;
    const avail = topWorld - bottomWorld;
    const scale = Math.min(LOGO_SCALE, avail / 2 - 2, this.halfWidth * 0.72);

    if (scale >= 6) {
      const yMin = bottomWorld + scale + 1;
      const yMax = topWorld - scale - 1;
      return {
        x: (Math.random() * 2 - 1) * Math.max(0, this.halfWidth - scale - 2) * 0.6,
        y: yMin + Math.random() * Math.max(0, yMax - yMin),
        scale
      };
    }

    // 아래 공간마저 없으면 화면 상단 뒤편에서라도 은은하게
    return {
      x: (Math.random() * 2 - 1) * this.halfWidth * 0.5,
      y: 10 + Math.random() * 24,
      scale: Math.min(LOGO_SCALE, this.halfWidth * 0.7)
    };
  }

  private spawn() {
    const chain = CHAINS[this.chainIndex];
    this.chainIndex = (this.chainIndex + 1) % CHAINS.length;

    const sample = sampleChainPoints(chain, PARTICLES);
    const logo = sample.points;
    const { x: cx, y: cy, scale } = this.pickSpawnSpot();
    const speedScale = scale / LOGO_SCALE;

    const positions = new Float32Array(PARTICLES * 3);
    const colors = new Float32Array(PARTICLES * 3);
    const velocities = new Float32Array(PARTICLES * 3);
    const targets = new Float32Array(PARTICLES * 3);
    const baseColors = new Float32Array(PARTICLES * 3);
    const phases = new Float32Array(PARTICLES);
    const palette = chain.colors.map((hex) => new THREE.Color(hex));

    for (let i = 0; i < PARTICLES; i++) {
      positions[i * 3] = cx;
      positions[i * 3 + 1] = cy;
      positions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed =
        (6 + Math.random() * 22) * (0.55 + 0.45 * Math.sqrt(Math.random())) * speedScale;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = Math.sin(angle) * speed + 3 * speedScale;
      velocities[i * 3 + 2] = 0;

      targets[i * 3] = cx + logo[i * 2] * scale + (Math.random() - 0.5) * 0.5;
      targets[i * 3 + 1] = cy + logo[i * 2 + 1] * scale + (Math.random() - 0.5) * 0.5;
      targets[i * 3 + 2] = 0;

      if (sample.colors) {
        baseColors[i * 3] = sample.colors[i * 3];
        baseColors[i * 3 + 1] = sample.colors[i * 3 + 1];
        baseColors[i * 3 + 2] = sample.colors[i * 3 + 2];
      } else {
        const color = palette[Math.floor(Math.random() * palette.length)];
        baseColors[i * 3] = color.r;
        baseColors[i * 3 + 1] = color.g;
        baseColors[i * 3 + 2] = color.b;
      }
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 5,
      map: this.texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.fireworks.push({
      points,
      geometry,
      material,
      velocities,
      targets,
      baseColors,
      phases,
      t: 0
    });
  }

  private updateFirework(fw: Firework, dt: number) {
    fw.t += dt;
    const { t } = fw;
    const pos = fw.geometry.getAttribute("position").array as Float32Array;
    const col = fw.geometry.getAttribute("color").array as Float32Array;

    let alpha = 1;
    if (t <= BURST_END) {
      alpha = Math.min(1, t * 10);
      const drag = Math.max(0, 1 - 2.6 * dt);
      for (let i = 0; i < PARTICLES; i++) {
        pos[i * 3] += fw.velocities[i * 3] * dt;
        pos[i * 3 + 1] += fw.velocities[i * 3 + 1] * dt;
        fw.velocities[i * 3] *= drag;
        fw.velocities[i * 3 + 1] = fw.velocities[i * 3 + 1] * drag - 8 * dt;
      }
    } else if (t <= MORPH_END) {
      const k = easeOut((t - BURST_END) / (MORPH_END - BURST_END));
      const pull = Math.min(1, dt * (2 + 10 * k));
      for (let i = 0; i < PARTICLES; i++) {
        pos[i * 3] += (fw.targets[i * 3] - pos[i * 3]) * pull;
        pos[i * 3 + 1] += (fw.targets[i * 3 + 1] - pos[i * 3 + 1]) * pull;
      }
    } else if (t <= HOLD_END) {
      for (let i = 0; i < PARTICLES; i++) {
        const wobble = Math.sin(this.elapsed * 2.4 + fw.phases[i]) * 0.14;
        pos[i * 3] = fw.targets[i * 3] + wobble;
        pos[i * 3 + 1] = fw.targets[i * 3 + 1] + Math.cos(this.elapsed * 2 + fw.phases[i]) * 0.14;
      }
      alpha = 0.85 + 0.15 * Math.sin(this.elapsed * 8);
    } else {
      const k = (t - HOLD_END) / (LIFE_END - HOLD_END);
      alpha = Math.max(0, 1 - k);
      for (let i = 0; i < PARTICLES; i++) {
        pos[i * 3] += Math.sin(fw.phases[i]) * dt * 2;
        pos[i * 3 + 1] -= (2 + 6 * k) * dt;
      }
    }

    // 반짝임: additive 블렌딩이라 색 밝기가 곧 불투명도 역할을 한다
    for (let i = 0; i < PARTICLES; i++) {
      const twinkle = 0.75 + 0.25 * Math.sin(this.elapsed * 6 + fw.phases[i] * 3);
      const a = alpha * twinkle;
      col[i * 3] = fw.baseColors[i * 3] * a;
      col[i * 3 + 1] = fw.baseColors[i * 3 + 1] * a;
      col[i * 3 + 2] = fw.baseColors[i * 3 + 2] * a;
    }

    fw.geometry.getAttribute("position").needsUpdate = true;
    fw.geometry.getAttribute("color").needsUpdate = true;
    return t < LIFE_END;
  }

  private loop = () => {
    if (this.paused) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += dt;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = SPAWN_INTERVAL;
    }

    const hadFireworks = this.fireworks.length > 0;
    this.fireworks = this.fireworks.filter((fw) => {
      const alive = this.updateFirework(fw, dt);
      if (!alive) {
        this.scene.remove(fw.points);
        fw.geometry.dispose();
        fw.material.dispose();
      }
      return alive;
    });

    // 불꽃이 없으면 렌더링을 쉰다 (마지막 프레임만 한 번 지워준다)
    if (this.fireworks.length > 0 || hadFireworks) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    for (const fw of this.fireworks) {
      this.scene.remove(fw.points);
      fw.geometry.dispose();
      fw.material.dispose();
    }
    this.texture.dispose();
    this.renderer.dispose();
  }
}
