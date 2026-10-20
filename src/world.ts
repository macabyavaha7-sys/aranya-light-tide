import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ------------------------------------------------------------------ palettes */

export type PhaseKey = 'night' | 'dawn' | 'day' | 'dusk' | 'blue';

export interface Palette {
  hour: number;
  phase: PhaseKey;
  label: string;
  zenith: number;
  horizon: number;
  ground: number;
  sun: number;
  sunI: number;
  hemi: number;
  ambient: number;
  fog: number;
  fogD: number;
  deep: number;
  shallow: number;
  foam: number;
  exposure: number;
  lamp: number;
  star: number;
  cloud: number;
  cloudColor: number;
  glow: number;
}

const P = (p: Palette): Palette => p;

const KEYS: Palette[] = [
  P({ hour: 0, phase: 'night', label: '月夜', zenith: 0x101a2b, horizon: 0x243448, ground: 0x0a111a, sun: 0xb9c8dd, sunI: 0.22, hemi: 0.18, ambient: 0.06, fog: 0x131f2c, fogD: 0.0042, deep: 0x0a141f, shallow: 0x1a2b3b, foam: 0x8fa2b6, exposure: 1.22, lamp: 1.35, star: 1.0, cloud: 0.16, cloudColor: 0x2a3648, glow: 0.0 }),
  P({ hour: 4.2, phase: 'night', label: '将晓', zenith: 0x1a2840, horizon: 0x3a4256, ground: 0x111a24, sun: 0xc3ccdd, sunI: 0.2, hemi: 0.22, ambient: 0.08, fog: 0x1d2a39, fogD: 0.004, deep: 0x10202c, shallow: 0x27384a, foam: 0x9fb0c0, exposure: 1.2, lamp: 1.1, star: 0.72, cloud: 0.22, cloudColor: 0x3a4356, glow: 0.02 }),
  P({ hour: 5.35, phase: 'dawn', label: '晨曦', zenith: 0x8ea4c2, horizon: 0xf0cdc2, ground: 0x8f9aa6, sun: 0xffd9c4, sunI: 0.55, hemi: 0.55, ambient: 0.16, fog: 0xd9cdc9, fogD: 0.0036, deep: 0x4b6470, shallow: 0x8da6ab, foam: 0xf1e4de, exposure: 1.02, lamp: 0.35, star: 0.05, cloud: 0.6, cloudColor: 0xf2d9d2, glow: 0.55 }),
  P({ hour: 6.7, phase: 'dawn', label: '日出', zenith: 0x7c9cbe, horizon: 0xf0d5b8, ground: 0x97a1a8, sun: 0xffd5ae, sunI: 1.5, hemi: 0.62, ambient: 0.18, fog: 0xe0d3c8, fogD: 0.0034, deep: 0x3f6070, shallow: 0x7fa1ac, foam: 0xf5eadd, exposure: 1.0, lamp: 0.18, star: 0, cloud: 0.5, cloudColor: 0xf6ddc6, glow: 0.8 }),
  P({ hour: 9.0, phase: 'day', label: '晨光', zenith: 0x7fa7c8, horizon: 0xdfe9ee, ground: 0xb9c3c8, sun: 0xfff2dc, sunI: 2.35, hemi: 0.75, ambient: 0.2, fog: 0xdde7ec, fogD: 0.0028, deep: 0x2f5a6b, shallow: 0x6d99a7, foam: 0xf7f4ec, exposure: 0.94, lamp: 0, star: 0, cloud: 0.36, cloudColor: 0xfbf7f0, glow: 0.5 }),
  P({ hour: 12.0, phase: 'day', label: '日光', zenith: 0x77a3c9, horizon: 0xdce9ef, ground: 0xc2cbcd, sun: 0xfff8ea, sunI: 2.6, hemi: 0.8, ambient: 0.2, fog: 0xdae6ec, fogD: 0.0026, deep: 0x3a5c68, shallow: 0x7b9da5, foam: 0xf9f6ef, exposure: 0.92, lamp: 0, star: 0, cloud: 0.3, cloudColor: 0xfdfaf4, glow: 0.55 }),
  P({ hour: 15.0, phase: 'day', label: '午后', zenith: 0x82a7c6, horizon: 0xe6e4da, ground: 0xc6c6bf, sun: 0xfff0d4, sunI: 2.35, hemi: 0.72, ambient: 0.19, fog: 0xe2e2d9, fogD: 0.0029, deep: 0x315a6b, shallow: 0x7199a4, foam: 0xf6f1e6, exposure: 0.95, lamp: 0.05, star: 0, cloud: 0.34, cloudColor: 0xfbf2e2, glow: 0.6 }),
  P({ hour: 17.6, phase: 'dusk', label: '余晖', zenith: 0xa2a8c2, horizon: 0xe9c3a9, ground: 0xb3a49b, sun: 0xffc489, sunI: 1.6, hemi: 0.58, ambient: 0.17, fog: 0xdfc6b6, fogD: 0.0032, deep: 0x44606a, shallow: 0x8c9a9c, foam: 0xf4e2cd, exposure: 0.97, lamp: 0.45, star: 0, cloud: 0.46, cloudColor: 0xf7d3a8, glow: 1.0 }),
  P({ hour: 18.55, phase: 'dusk', label: '日落', zenith: 0x8089a9, horizon: 0xdfa98f, ground: 0x9d8f88, sun: 0xffb373, sunI: 1.05, hemi: 0.44, ambient: 0.15, fog: 0xcdb0a0, fogD: 0.0034, deep: 0x3a4f5c, shallow: 0x7e8b8d, foam: 0xefdac4, exposure: 1.0, lamp: 0.75, star: 0.02, cloud: 0.5, cloudColor: 0xf0bd92, glow: 1.35 }),
  P({ hour: 19.7, phase: 'blue', label: '蓝调', zenith: 0x4d5f80, horizon: 0xb7a6a2, ground: 0x59606a, sun: 0xffb87a, sunI: 0.3, hemi: 0.34, ambient: 0.12, fog: 0x8b94a4, fogD: 0.0038, deep: 0x2c3f52, shallow: 0x667a8c, foam: 0xc8ced8, exposure: 1.12, lamp: 1.0, star: 0.16, cloud: 0.34, cloudColor: 0x8b91a6, glow: 0.7 }),
  P({ hour: 21.2, phase: 'night', label: '入夜', zenith: 0x1a2740, horizon: 0x34435a, ground: 0x1a222d, sun: 0xb5c4d8, sunI: 0.24, hemi: 0.2, ambient: 0.08, fog: 0x1c2a39, fogD: 0.0041, deep: 0x0e1a27, shallow: 0x213245, foam: 0x93a5b8, exposure: 1.2, lamp: 1.3, star: 0.9, cloud: 0.18, cloudColor: 0x2f3b4d, glow: 0.05 }),
  P({ hour: 24, phase: 'night', label: '月夜', zenith: 0x101a2b, horizon: 0x243448, ground: 0x0a111a, sun: 0xb9c8dd, sunI: 0.22, hemi: 0.18, ambient: 0.06, fog: 0x131f2c, fogD: 0.0042, deep: 0x0a141f, shallow: 0x1a2b3b, foam: 0x8fa2b6, exposure: 1.22, lamp: 1.35, star: 1.0, cloud: 0.16, cloudColor: 0x2a3648, glow: 0.0 }),
];

const cA = new THREE.Color();
const cB = new THREE.Color();

export interface DayState {
  hour: number;
  label: string;
  phase: PhaseKey;
  sunDir: THREE.Vector3;
  moonDir: THREE.Vector3;
  sunColor: THREE.Color;
  zenith: THREE.Color;
  horizon: THREE.Color;
  ground: THREE.Color;
  fog: THREE.Color;
  deep: THREE.Color;
  shallow: THREE.Color;
  foam: THREE.Color;
  cloudColor: THREE.Color;
  sunI: number;
  hemi: number;
  ambient: number;
  fogD: number;
  exposure: number;
  lamp: number;
  star: number;
  cloud: number;
  glow: number;
  night: number;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function samplePalette(hour: number): Palette {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].hour <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smoothstep(0, 1, (h - a.hour) / Math.max(0.0001, b.hour - a.hour));
  const mixHex = (x: number, y: number) => {
    cA.setHex(x);
    cB.setHex(y);
    return cA.clone().lerp(cB, t);
  };
  const num = (x: number, y: number) => x + (y - x) * t;
  return {
    hour: h,
    phase: (t < 0.5 ? a.phase : b.phase) as PhaseKey,
    label: t < 0.5 ? a.label : b.label,
    zenith: mixHex(a.zenith, b.zenith).getHex(),
    horizon: mixHex(a.horizon, b.horizon).getHex(),
    ground: mixHex(a.ground, b.ground).getHex(),
    sun: mixHex(a.sun, b.sun).getHex(),
    sunI: num(a.sunI, b.sunI),
    hemi: num(a.hemi, b.hemi),
    ambient: num(a.ambient, b.ambient),
    fog: mixHex(a.fog, b.fog).getHex(),
    fogD: num(a.fogD, b.fogD),
    deep: mixHex(a.deep, b.deep).getHex(),
    shallow: mixHex(a.shallow, b.shallow).getHex(),
    foam: mixHex(a.foam, b.foam).getHex(),
    exposure: num(a.exposure, b.exposure),
    lamp: num(a.lamp, b.lamp),
    star: num(a.star, b.star),
    cloud: num(a.cloud, b.cloud),
    cloudColor: mixHex(a.cloudColor, b.cloudColor).getHex(),
    glow: num(a.glow, b.glow),
  };
}

function sunDirection(hour: number): THREE.Vector3 {
  // sea is -Z: the sun rises over the water and sets behind the land
  const az = THREE.MathUtils.degToRad(6 + ((hour - 6) / 12) * 186);
  const el = THREE.MathUtils.degToRad(Math.sin(((hour - 6) / 12) * Math.PI) * 58);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

function moonDirection(hour: number): THREE.Vector3 {
  const az = THREE.MathUtils.degToRad(150 + Math.sin((hour / 24) * Math.PI * 2) * 30);
  const el = THREE.MathUtils.degToRad(34 + Math.cos((hour / 24) * Math.PI * 2) * 10);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

export function dayState(hour: number): DayState {
  const p = samplePalette(hour);
  const sunDir = sunDirection(hour);
  const moonDir = moonDirection(hour);
  const night = 1 - Math.max(smoothstep(4.4, 6.2, p.hour), 1 - smoothstep(18.9, 21.0, p.hour));
  // just below the horizon the sky is nearly the horizon colour, so the
  // ocean's far edge dissolves instead of drawing a dark line
  const ground = new THREE.Color(p.ground).lerp(new THREE.Color(p.horizon), 0.72);
  return {
    hour: p.hour,
    label: p.label,
    phase: p.phase,
    sunDir,
    moonDir,
    sunColor: new THREE.Color(p.sun),
    zenith: new THREE.Color(p.zenith),
    horizon: new THREE.Color(p.horizon),
    ground,
    fog: new THREE.Color(p.fog),
    deep: new THREE.Color(p.deep),
    shallow: new THREE.Color(p.shallow),
    foam: new THREE.Color(p.foam),
    cloudColor: new THREE.Color(p.cloudColor),
    sunI: p.sunI,
    hemi: p.hemi,
    ambient: p.ambient,
    fogD: p.fogD,
    exposure: p.exposure,
    lamp: p.lamp,
    star: p.star,
    cloud: p.cloud,
    glow: p.glow,
    night,
  };
}

/* ------------------------------------------------------------------ shaders */

const NOISE = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(11.7, 5.3);
      a *= 0.5;
    }
    return v;
  }
`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w;
  }
`;

const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunColor;
  uniform vec3 uCloudColor;
  uniform vec3 uSunDir;
  uniform vec3 uMoonDir;
  uniform float uStar;
  uniform float uCloud;
  uniform float uGlow;
  uniform float uMoon;
  uniform float uTime;
  ${NOISE}

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;
    float up = pow(clamp(h, 0.0, 1.0), 0.55);
    vec3 col = mix(uHorizon, uZenith, up);
    col = mix(uGround, col, smoothstep(-0.10, 0.02, h));

    // low warm band around the sun azimuth
    vec3 flatDir = normalize(vec3(dir.x, 0.001, dir.z));
    vec3 flatSun = normalize(vec3(uSunDir.x, 0.001, uSunDir.z));
    float az = max(dot(flatDir, flatSun), 0.0);
    float band = exp(-pow(h * 7.0, 2.0)) * pow(az, 5.0);
    col += uSunColor * band * uGlow * 0.42;

    // sun disc + halo
    float sd = max(dot(dir, uSunDir), 0.0);
    float disc = smoothstep(0.99965, 0.99988, sd);
    col += uSunColor * disc * uGlow * 9.0;
    col += uSunColor * (pow(sd, 220.0) * 0.55 + pow(sd, 12.0) * 0.10) * uGlow;

    // moon + halo
    float md = max(dot(dir, uMoonDir), 0.0);
    col += vec3(0.93, 0.95, 0.92) * smoothstep(0.99955, 0.99985, md) * uMoon * 2.4;
    col += vec3(0.55, 0.66, 0.82) * pow(md, 160.0) * 0.35 * uMoon;

    // clouds
    float horizonFade = smoothstep(0.0, 0.16, h) * (1.0 - smoothstep(0.55, 0.95, h) * 0.5);
    vec2 cp = dir.xz / max(abs(h) + 0.16, 0.12);
    float n = fbm(cp * 1.15 + vec2(uTime * 0.0045, uTime * 0.0022));
    float n2 = fbm(cp * 2.7 - vec2(uTime * 0.006, 0.0) + n * 1.4);
    float cover = smoothstep(0.55 - uCloud * 0.42, 0.92 - uCloud * 0.3, n * 0.72 + n2 * 0.34);
    cover *= horizonFade;
    float lit = smoothstep(0.0, 0.5, dot(dir, uSunDir) * 0.5 + 0.5);
    vec3 cloudCol = mix(uCloudColor * 0.82, uCloudColor, lit);
    col = mix(col, cloudCol, clamp(cover, 0.0, 1.0) * 0.72);

    // stars
    if (uStar > 0.002) {
      vec3 sd3 = normalize(dir) * 340.0;
      vec3 cell = floor(sd3);
      vec3 f = fract(sd3) - 0.5;
      float r = hash21(cell.xy + cell.z * 17.17);
      if (r > 0.991) {
        float tw = 0.65 + 0.35 * sin(uTime * 1.7 + r * 61.0);
        float s = smoothstep(0.30, 0.02, length(f)) * tw;
        col += vec3(0.82, 0.88, 1.0) * s * uStar * smoothstep(0.03, 0.25, h) * 1.5;
      }
    }

    // dithering keeps the gradient from banding
    col += (hash21(gl_FragCoord.xy + uTime) - 0.5) * 0.004;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const OCEAN_VERT = /* glsl */ `
  precision highp float;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  uniform float uTime;
  ${NOISE}

  float waveH(vec2 p, float t) {
    float amp = 0.55 + 0.85 * vnoise(p * 0.035 + vec2(t * 0.02, 0.0));
    float h = 0.0;
    h += 0.130 * sin(dot(p, vec2(0.18, 0.98)) * 0.33 + t * 0.52);
    h += 0.075 * sin(dot(p, vec2(-0.52, 0.85)) * 0.67 + t * 0.74 + 1.3);
    h += 0.034 * sin(dot(p, vec2(0.86, 0.51)) * 1.31 + t * 1.10 + 2.1);
    h += 0.016 * sin(dot(p, vec2(-0.30, 0.95)) * 2.90 + t * 1.45 + 4.0);
    h += 0.009 * sin(dot(p, vec2(0.98, -0.20)) * 4.20 + t * 1.90 + 0.7);
    return h * amp;
  }

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float e = 1.2;
    float h = waveH(wp.xz, uTime);

    // fade the waves out over the last stretch so the shoreline stays quiet
    float shoreFade = smoothstep(-70.0, -26.0, wp.z);
    wp.y += h * (1.0 - shoreFade * 0.35);

    float hx = waveH(wp.xz + vec2(e, 0.0), uTime);
    float hz = waveH(wp.xz + vec2(0.0, e), uTime);
    vNormalW = normalize(vec3((h - hx) * 2.2, e, (h - hz) * 2.2));

    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const OCEAN_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform vec3 uFog;
  uniform float uTime;
  uniform float uSunI;
  uniform float uNight;
  ${NOISE}

  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vNormalW);

    // detail ripples
    float d1 = fbm(vWorldPos.xz * 0.42 + vec2(uTime * 0.05, -uTime * 0.035));
    float d2 = fbm(vWorldPos.xz * 1.7 - vec2(uTime * 0.10, uTime * 0.06));
    float d3 = fbm(vWorldPos.xz * 0.11 + vec2(-uTime * 0.02, uTime * 0.015));
    N = normalize(N + vec3((d1 - 0.5) * 0.34, 0.0, (d2 - 0.5) * 0.24 + (d3 - 0.5) * 0.22));

    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 R = reflect(-V, N);
    vec3 skyRef = mix(uHorizon, uZenith, smoothstep(0.0, 0.45, R.y));
    float sunFacing = pow(max(dot(normalize(vec3(R.x, 0.0, R.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0), 8.0);
    skyRef += uSunColor * sunFacing * 0.05 * clamp(uSunI, 0.0, 1.0);
    float depthMix = smoothstep(-260.0, -26.0, vWorldPos.z);
    vec3 col = mix(uDeep, uShallow, depthMix * 0.7 + 0.08);
    col = mix(col, skyRef, clamp(fres * 0.55 + 0.08, 0.0, 0.62));

    // low sun path
    vec3 H = normalize(uSunDir + V);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 420.0) * 2.6 + pow(ndh, 60.0) * 0.18;
    col += uSunColor * spec * uSunI * 0.55;

    // glitter
    float glint = pow(ndh, 1400.0);
    col += uSunColor * glint * 9.0 * uSunI * smoothstep(0.35, 0.85, d2);

    // foam: a broken lace along the waterline, ribbons rolling shoreward,
    // and a little crest foam.  It never climbs into open water.
    float dshore = -23.0 - vWorldPos.z;              // 0 at the waterline, positive seaward
    float wob = fbm(vWorldPos.xz * 0.16 + vec2(uTime * 0.03, 0.0)) * 2.6;
    float ripple = sin(dshore * 1.05 + uTime * 1.15 + wob);
    float foamRibbon = smoothstep(0.42, 0.86, ripple) * (1.0 - smoothstep(0.0, 17.0, dshore));
    float foamEdge = (1.0 - smoothstep(0.0, 4.2, dshore)) * smoothstep(0.28, 0.72, fbm(vWorldPos.xz * 1.1 + uTime * 0.18));
    float crest = smoothstep(0.13, 0.24, vWorldPos.y) * (1.0 - smoothstep(0.0, 30.0, dshore)) * 0.28;
    float foam = clamp(foamRibbon * 0.55 + foamEdge * 1.1 + crest, 0.0, 1.0);
    col = mix(col, uFoam, foam * 0.95);

    // distance haze, ending exactly on the sky's horizon colour
    float dist = length(vWorldPos.xz - cameraPosition.xz);
    col = mix(col, uFog, smoothstep(50.0, 200.0, dist) * 0.55);
    col = mix(col, uHorizon, smoothstep(140.0, 400.0, dist) * 0.92);

    // subtle night cooling
    col = mix(col, col * vec3(0.82, 0.9, 1.06), uNight * 0.35);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ------------------------------------------------------------------ textures */

function sandTextures(): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d8c8a6';
  ctx.fillRect(0, 0, S, S);
  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.95));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.8));
  }
  ctx.putImageData(img, 0, 0);

  // wind ripples
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#8c7857';
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * S;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= S; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3.2);
    }
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(26, 26);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const nc = document.createElement('canvas');
  nc.width = nc.height = 256;
  const nctx = nc.getContext('2d')!;
  const nimg = nctx.createImageData(256, 256);
  const nd = nimg.data;
  const hgt = new Float32Array(256 * 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      hgt[y * 256 + x] =
        Math.sin(x * 0.35 + Math.sin(y * 0.12) * 2.0) * 0.5 +
        Math.sin(y * 0.5 + x * 0.08) * 0.35 +
        (Math.random() - 0.5) * 0.25;
    }
  }
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const hx = hgt[y * 256 + ((x + 1) % 256)] - hgt[y * 256 + ((x + 255) % 256)];
      const hy = hgt[((y + 1) % 256) * 256 + x] - hgt[((y + 255) % 256) * 256 + x];
      const nx = -hx * 1.6;
      const ny = -hy * 1.6;
      const l = Math.hypot(nx, ny, 1);
      nd[i] = ((nx / l) * 0.5 + 0.5) * 255;
      nd[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      nd[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      nd[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  const normalMap = new THREE.CanvasTexture(nc);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(26, 26);
  normalMap.anisotropy = 4;

  return { map, normalMap };
}

function grassTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 256);
  for (let i = 0; i < 34; i++) {
    const x = 16 + Math.random() * 96;
    const lean = (Math.random() - 0.5) * 34;
    const h = 130 + Math.random() * 110;
    const w = 1.2 + Math.random() * 2.2;
    const g = ctx.createLinearGradient(x, 256, x + lean, 256 - h);
    g.addColorStop(0, 'rgba(96,92,58,0.0)');
    g.addColorStop(0.25, 'rgba(112,106,66,0.9)');
    g.addColorStop(1, 'rgba(168,158,112,0.95)');
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.quadraticCurveTo(x + lean * 0.4, 256 - h * 0.55, x + lean, 256 - h);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function shadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(20,14,8,0.55)');
  g.addColorStop(0.55, 'rgba(20,14,8,0.24)');
  g.addColorStop(1, 'rgba(20,14,8,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ world */

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  mobile: boolean;
}

export class World {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly clock = new THREE.Clock();
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly ambient: THREE.AmbientLight;

  hour = 5.33;
  state: DayState;
  ready = false;

  private sky: THREE.Mesh;
  private skyUniforms: Record<string, THREE.IUniform>;
  private ocean: THREE.Mesh;
  private oceanUniforms: Record<string, THREE.IUniform>;
  private sand!: THREE.Mesh;
  private sandShader: any = null;
  private chapel: THREE.Group | null = null;
  private doors: { left: THREE.Object3D | null; right: THREE.Object3D | null } = { left: null, right: null };
  private bell: THREE.Object3D | null = null;
  private lampMaterials: THREE.MeshStandardMaterial[] = [];
  private slotGlow: THREE.MeshBasicMaterial | null = null;
  private interiorLights: THREE.PointLight[] = [];
  private exteriorLights: THREE.PointLight[] = [];
  private envCanvas: HTMLCanvasElement;
  private envTex: THREE.Texture | null = null;
  private envDirty = true;
  private envTimer = 0;
  private doorOpen = 0;
  private doorTarget = 0;
  private elapsed = 0;
  private mobile: boolean;

  constructor(opts: WorldOptions) {
    this.mobile = opts.mobile;
    this.state = dayState(this.hour);

    this.scene.fog = new THREE.FogExp2(this.state.fog.getHex(), this.state.fogD);

    const portrait = window.innerWidth / window.innerHeight < 0.95;
    this.camera = new THREE.PerspectiveCamera(portrait ? 54 : 45, 1, 0.1, 2400);
    this.camera.position.set(13.4, 5.15, 21.2);
    if (portrait) this.camera.position.sub(new THREE.Vector3(0, 5.5, 1.0)).multiplyScalar(1.5).add(new THREE.Vector3(0, 5.5, 1.0));

    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.75 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.state.exposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(this.state.horizon.getHex(), 1);

    this.skyUniforms = {
      uZenith: { value: this.state.zenith.clone() },
      uHorizon: { value: this.state.horizon.clone() },
      uGround: { value: this.state.ground.clone() },
      uSunColor: { value: this.state.sunColor.clone() },
      uCloudColor: { value: this.state.cloudColor.clone() },
      uSunDir: { value: this.state.sunDir.clone() },
      uMoonDir: { value: this.state.moonDir.clone() },
      uStar: { value: this.state.star },
      uCloud: { value: this.state.cloud },
      uGlow: { value: this.state.glow },
      uMoon: { value: this.state.night },
      uTime: { value: 0 },
    };
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(760, 48, 32),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: this.skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      })
    );
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    this.hemi = new THREE.HemisphereLight(this.state.horizon.getHex(), 0x8a7a60, this.state.hemi);
    this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0xffffff, this.state.ambient);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(this.state.sunColor.getHex(), 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.camera.left = -34;
    this.sun.shadow.camera.right = 34;
    this.sun.shadow.camera.top = 34;
    this.sun.shadow.camera.bottom = -34;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.035;
    this.sun.target.position.set(0, 4, 0);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.oceanUniforms = {
      uTime: { value: 0 },
      uSunDir: { value: this.state.sunDir.clone() },
      uSunColor: { value: this.state.sunColor.clone() },
      uZenith: { value: this.state.zenith.clone() },
      uHorizon: { value: this.state.horizon.clone() },
      uDeep: { value: this.state.deep.clone() },
      uShallow: { value: this.state.shallow.clone() },
      uFoam: { value: this.state.foam.clone() },
      uFog: { value: this.state.fog.clone() },
      uSunI: { value: 1 },
      uNight: { value: this.state.night },
    };
    this.ocean = new THREE.Mesh(this.makeOceanGeometry(), new THREE.ShaderMaterial({
      vertexShader: OCEAN_VERT,
      fragmentShader: OCEAN_FRAG,
      uniforms: this.oceanUniforms,
      fog: false,
    }));
    this.ocean.frustumCulled = false;
    this.scene.add(this.ocean);

    this.buildSand();
    this.buildDunes();
    this.envCanvas = document.createElement('canvas');
    this.envCanvas.width = 256;
    this.envCanvas.height = 128;
    this.updateEnv();

    this.applyState();
    this.resize();
  }

  private makeOceanGeometry() {
    const w = 900;
    const d = 430;
    const segX = this.mobile ? 120 : 200;
    const segZ = this.mobile ? 80 : 130;
    const geo = new THREE.PlaneGeometry(w, d, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    // waterline at z = -23, sea stretches away from the shore
    geo.translate(0, 0, -23 - d / 2);
    return geo;
  }

  private heightAt(x: number, z: number) {
    const d = z + 23;
    let h = Math.max(0, d) * 0.045;
    const flat = 1 - smoothstep(16, 46, Math.hypot(x * 0.9, z * 1.25));
    h = h * (1 - flat) + 0.14 * flat;
    const duneMask = smoothstep(24, 58, z) * (1 - smoothstep(120, 190, z));
    const ridge = (Math.sin(x * 0.045) + Math.sin(x * 0.11 + 1.7) * 0.6 + Math.sin(x * 0.021 + 4.2) * 0.8) * 0.9 + 1.4;
    h += duneMask * ridge * 1.25;
    h += smoothstep(110, 190, z) * (Math.sin(x * 0.02 + 2.0) * 1.5 + 2.4);
    h += Math.sin(x * 0.75 + z * 0.55) * 0.016 + Math.sin(x * 0.2 - z * 0.3) * 0.03;
    return Math.max(0.005, h);
  }

  private buildSand() {
    const geo = new THREE.PlaneGeometry(820, 520, this.mobile ? 140 : 220, this.mobile ? 90 : 150);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, 236);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.heightAt(x, z));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const { map, normalMap } = sandTextures();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xefe6d2,
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.96,
      metalness: 0.0,
      envMapIntensity: 0.35,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vSandPos;'
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvSandPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vSandPos;
        uniform float uTime;
        float sHash(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
        float sNoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          float a = sHash(i); float b = sHash(i + vec2(1.0, 0.0));
          float c = sHash(i + vec2(0.0, 1.0)); float d = sHash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float mott = sNoise(vSandPos.xz * 0.055) * 0.62 + sNoise(vSandPos.xz * 0.23) * 0.38;
        diffuseColor.rgb *= 0.90 + 0.17 * mott;
        float shoreD = vSandPos.z + 23.0;
        float wash = sin(vSandPos.x * 0.11 + uTime * 0.22) * 0.35 + sin(uTime * 0.31) * 0.2;
        float wet = 1.0 - smoothstep(-0.5, 9.0, shoreD + wash);
        wet = clamp(wet, 0.0, 1.0);
        diffuseColor.rgb *= mix(1.0, 0.62, wet);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.8, 0.87, 1.0), wet * 0.7);`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.24, wet);`
      );
      this.sandShader = shader;
    };
    mat.customProgramCacheKey = () => 'sand-wet-v1';
    this.sand = new THREE.Mesh(geo, mat);
    this.sand.receiveShadow = true;
    this.scene.add(this.sand);

    // fake contact shadow beneath the elevated volume
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 19),
      new THREE.MeshBasicMaterial({
        map: shadowTexture(),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        color: 0x1a1208,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.2, -0.6);
    this.scene.add(shadow);
  }

  private buildDunes() {
    const tex = grassTexture();
    const geo = new THREE.PlaneGeometry(0.85, 0.85);
    geo.translate(0, 0.42, 0);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      alphaTest: 0.42,
      transparent: false,
      side: THREE.DoubleSide,
      roughness: 0.95,
      metalness: 0,
    });
    const count = this.mobile ? 240 : 620;
    const inst = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    let n = 0;
    let guard = 0;
    while (n < count && guard < count * 6) {
      guard++;
      const x = (Math.random() - 0.5) * 240;
      const z = 20 + Math.random() * 100;
      if (Math.hypot(x, z) < 22) continue;
      p.set(x, this.heightAt(x, z) - 0.03, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
      const sc = 0.55 + Math.random() * 1.15;
      s.set(sc, sc * (0.8 + Math.random() * 0.5), sc);
      m.compose(p, q, s);
      inst.setMatrixAt(n++, m);
    }
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
    inst.castShadow = false;
    inst.receiveShadow = true;
    this.scene.add(inst);
  }

  async load(onProgress?: (p: number) => void) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/chapel.glb`, (e) => {
      if (onProgress && e.total) onProgress(Math.min(1, e.loaded / e.total));
    });
    const root = gltf.scene;
    root.position.y = 0.02;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const tuned = mats.map((m) => this.tuneMaterial(m as THREE.MeshStandardMaterial));
        mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0];
      }
      if (o.name === 'Door_L') this.doors.left = o;
      if (o.name === 'Door_R') this.doors.right = o;
      if (o.name === 'Bell') this.bell = o;
    });

    this.chapel = root;
    this.scene.add(root);

    // warm interior lights (positions mirror the pendant lamps in the .blend)
    const pendant: [number, number, number][] = [
      [0, 9.32, 2.6],
      [0, 9.32, -0.4],
      [0, 9.32, -3.2],
    ];
    for (const [x, y, z] of pendant) {
      const l = new THREE.PointLight(0xffc98c, 0, 11, 2);
      l.position.set(x, y, z);
      this.scene.add(l);
      this.interiorLights.push(l);
    }
    const porch = new THREE.PointLight(0xffbe84, 0, 7, 2);
    porch.position.set(0, 6.1, 5.1);
    this.scene.add(porch);
    this.interiorLights.push(porch);

    // soft bounce inside the hall so the plaster reads even at blue hour
    const seatGlow = new THREE.PointLight(0xffd2a4, 0, 8, 2);
    seatGlow.position.set(0, 4.35, 3.6);
    this.scene.add(seatGlow);
    this.interiorLights.push(seatGlow);

    const seaGlow = new THREE.PointLight(0xbcd4da, 0, 10, 2);
    seaGlow.position.set(0, 5.4, -4.6);
    this.scene.add(seaGlow);
    this.interiorLights.push(seaGlow);

    // the ridge slot glows with daylight; it dims after sunset
    const slot = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 6.2),
      new THREE.MeshBasicMaterial({
        color: 0xfff1dc,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    slot.rotation.x = -Math.PI / 2;
    slot.position.set(0, 11.86, 0);
    this.scene.add(slot);
    this.slotGlow = slot.material as THREE.MeshBasicMaterial;

    for (const [x, z] of [[1.9, 8.6], [-1.9, 6.2], [1.9, 3.9]]) {
      const l = new THREE.PointLight(0xffb877, 0, 5.5, 2);
      l.position.set(x, 0.7, z);
      this.scene.add(l);
      this.exteriorLights.push(l);
    }

    this.ready = true;
  }

  private tuneMaterial(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    if (!mat) return mat;
    const name = mat.name || '';
    if (name.includes('Glass')) {
      return new THREE.MeshStandardMaterial({
        color: 0xbfd3d6,
        roughness: 0.06,
        metalness: 0.02,
        transparent: true,
        opacity: 0.18,
        envMapIntensity: 1.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    }
    if (name.includes('Lamp') || name.includes('Glow')) {
      mat.emissive = new THREE.Color(0xffc286);
      mat.emissiveIntensity = 2.4;
      mat.roughness = 0.5;
      if (!this.lampMaterials.includes(mat)) this.lampMaterials.push(mat);
      return mat;
    }
    mat.envMapIntensity = 0.55;
    if (name.includes('Stucco') || name.includes('Concrete')) {
      mat.roughness = Math.min(1, (mat.roughness ?? 0.9) * 0.98);
      mat.normalScale?.set(1.15, 1.15);
    }
    if (name.includes('Oak') || name.includes('Teak')) {
      mat.roughness = 0.62;
      mat.envMapIntensity = 0.40;
      mat.color.setScalar(name.includes('Teak') ? 1.5 : 1.95);
    }
    if (name.includes('Steel') || name.includes('Bronze') || name.includes('Brass')) {
      mat.envMapIntensity = 0.9;
    }
    return mat;
  }

  /* -------------------------------------------------------------- time */

  setHour(hour: number, force = false) {
    const h = ((hour % 24) + 24) % 24;
    if (!force && Math.abs(h - this.hour) < 0.0005) return;
    this.hour = h;
    this.state = dayState(h);
    this.applyState();
    if (force) {
      this.envDirty = true;
      this.updateEnv();
    } else {
      this.envDirty = true;
    }
  }

  private applyState() {
    const s = this.state;
    this.skyUniforms.uZenith.value.copy(s.zenith);
    this.skyUniforms.uHorizon.value.copy(s.horizon);
    this.skyUniforms.uGround.value.copy(s.ground);
    this.skyUniforms.uSunColor.value.copy(s.sunColor);
    this.skyUniforms.uCloudColor.value.copy(s.cloudColor);
    this.skyUniforms.uSunDir.value.copy(s.sunDir);
    this.skyUniforms.uMoonDir.value.copy(s.moonDir);
    this.skyUniforms.uStar.value = s.star;
    this.skyUniforms.uCloud.value = s.cloud;
    this.skyUniforms.uGlow.value = s.glow;
    this.skyUniforms.uMoon.value = s.night;

    this.oceanUniforms.uSunDir.value.copy(s.sunDir);
    this.oceanUniforms.uSunColor.value.copy(s.sunColor);
    this.oceanUniforms.uZenith.value.copy(s.zenith);
    this.oceanUniforms.uHorizon.value.copy(s.horizon);
    this.oceanUniforms.uDeep.value.copy(s.deep);
    this.oceanUniforms.uShallow.value.copy(s.shallow);
    this.oceanUniforms.uFoam.value.copy(s.foam);
    this.oceanUniforms.uFog.value.copy(s.fog);
    this.oceanUniforms.uNight.value = s.night;

    const lightDir = (s.night > 0.5 ? s.moonDir : s.sunDir).clone();
    if (s.night <= 0.5 && lightDir.y < 0.05) {
      lightDir.y = 0.05;
      lightDir.normalize();
    }
    this.sun.position.copy(lightDir).multiplyScalar(90);
    this.sun.position.y = Math.max(this.sun.position.y, 6);
    this.sun.target.position.set(0, 3.5, 0);
    this.sun.target.updateMatrixWorld();
    this.sun.color.copy(s.night > 0.5 ? new THREE.Color(0xaebfd8) : s.sunColor);
    this.sun.intensity = s.night > 0.5 ? 0.55 * (1 - s.night * 0.35) : s.sunI * 1.15;

    this.hemi.color.copy(s.horizon);
    this.hemi.groundColor.setHex(0x8a7a60);
    this.hemi.intensity = s.hemi;

    this.ambient.intensity = s.ambient;
    this.ambient.color.copy(s.zenith).lerp(new THREE.Color(0xffffff), 0.5);

    (this.scene.fog as THREE.FogExp2).color.copy(s.fog);
    (this.scene.fog as THREE.FogExp2).density = s.fogD;
    this.renderer.toneMappingExposure = s.exposure;
    this.renderer.setClearColor(s.horizon.getHex(), 1);

    for (const m of this.lampMaterials) {
      m.emissiveIntensity = 0.15 + s.lamp * 2.6;
    }
    for (const l of this.interiorLights) {
      l.intensity = s.lamp * 26;
    }
    for (const l of this.exteriorLights) {
      l.intensity = s.lamp * 10;
    }
    if (this.slotGlow) {
      this.slotGlow.opacity = 0.06 + (1 - s.night) * 0.28;
    }
  }

  private updateEnv() {
    const s = this.state;
    const c = this.envCanvas;
    const ctx = c.getContext('2d')!;
    const w = c.width;
    const h = c.height;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#' + s.zenith.getHexString());
    grad.addColorStop(0.5, '#' + s.horizon.getHexString());
    grad.addColorStop(0.54, '#' + s.fog.getHexString());
    grad.addColorStop(1, '#' + s.ground.getHexString());
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // sun / moon blob, roughly positioned by azimuth
    const az = Math.atan2(s.sunDir.x, -s.sunDir.z);
    const u = ((az / (Math.PI * 2)) % 1 + 1) % 1;
    const el = Math.asin(THREE.MathUtils.clamp(s.sunDir.y, -1, 1));
    const v = 0.5 - el / Math.PI;
    const x = u * w;
    const y = v * h;
    const r = 26;
    const g2 = ctx.createRadialGradient(x, y, 1, x, y, r);
    const col = '#' + (s.night > 0.5 ? new THREE.Color(0xdfe8f5) : s.sunColor).getHexString();
    g2.addColorStop(0, col);
    g2.addColorStop(0.12, col);
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = s.night > 0.5 ? 0.55 : 0.85;
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (this.envTex) this.envTex.dispose();
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.envTex = tex;
    this.scene.environment = tex;
    this.envDirty = false;
  }

  /* -------------------------------------------------------------- update */

  setDoorOpen(v: number) {
    this.doorTarget = THREE.MathUtils.clamp(v, 0, 1);
  }

  update(dt: number) {
    this.elapsed += dt;
    const t = this.elapsed;
    this.skyUniforms.uTime.value = t;
    this.oceanUniforms.uTime.value = t;
    if (this.sandShader) {
      (this.sandShader.uniforms as any).uTime.value = t;
    }

    // doors ease open / shut
    this.doorOpen += (this.doorTarget - this.doorOpen) * Math.min(1, dt * 2.2);
    if (this.doors.left) this.doors.left.rotation.y = -1.72 * this.doorOpen;
    if (this.doors.right) this.doors.right.rotation.y = 1.72 * this.doorOpen;

    // faint bell sway
    if (this.bell) {
      this.bell.rotation.z = Math.sin(t * 0.55) * 0.02;
      this.bell.rotation.x = Math.sin(t * 0.37 + 1.0) * 0.012;
    }

    if (this.envDirty) {
      this.envTimer += dt;
      if (this.envTimer > 0.28) {
        this.envTimer = 0;
        this.updateEnv();
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    const wantFov = w / h < 0.95 ? 54 : 45;
    if (Math.abs(this.camera.fov - wantFov) > 0.01) {
      this.camera.fov = wantFov;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  /* -------------------------------------------------------------- helpers */

  get cameraDirection() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mm) => mm.dispose());
      }
    });
  }
}
