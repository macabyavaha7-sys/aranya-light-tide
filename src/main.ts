import './styles.css';
import { World } from './world';
import { CameraDirector, STAGES } from './camera';
import { SeaAudio } from './audio';
import { pickPoem } from './poems';
import { bearingLabel, drawPostcard, formatTime, loadImage } from './postcard';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

const canvas = $('#scene') as unknown as HTMLCanvasElement;
const mobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;

const world = new World({ canvas, mobile });
const director = new CameraDirector(world, world.camera, canvas);
const audio = new SeaAudio();

const PRESETS = [5.33, 11.67, 18.33, 19.67, 23.33];

/* ------------------------------------------------------------------ loading */
const loading = $('#loading');
const loadingFill = $('#loading-fill');
const loadingStatus = $('#loading-status');
let progress = 0;

function setProgress(p: number, label?: string) {
  progress = Math.max(progress, Math.min(1, p));
  loadingFill.style.width = `${(progress * 100).toFixed(1)}%`;
  loadingStatus.textContent = label ?? `正在装配光线与潮汐 · ${Math.round(progress * 100)}%`;
}

async function boot() {
  try {
    setProgress(0.08);
    await world.load((p) => setProgress(0.12 + p * 0.72));
    setProgress(0.94);
    world.setHour(5.33, true);
    world.render();
    setProgress(1);
    setTimeout(() => {
      loading.classList.add('is-done');
      setTimeout(() => {
        loading.hidden = true;
      }, 1300);
    }, 260);
  } catch (err) {
    console.error(err);
    loadingStatus.textContent = '模型加载失败 · 请刷新页面重试';
    loadingFill.style.width = '100%';
    loadingFill.style.background = 'rgba(200,120,90,0.8)';
    return;
  }
  startLoop();
  startUI();
}

/* ------------------------------------------------------------------ loop */
let last = performance.now();

function startLoop() {
  world.renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    stepTween(dt);
    director.update(dt);
    world.update(dt);
    world.render();
  });
}

/* ------------------------------------------------------------------ time */
let displayHour = 5.33;
let tween: { from: number; to: number; t: number; dur: number } | null = null;

function wrapDelta(from: number, to: number) {
  let d = to - from;
  if (d > 12) d -= 24;
  if (d < -12) d += 24;
  return d;
}

function setTime(hour: number, instant = false) {
  displayHour = ((hour % 24) + 24) % 24;
  world.setHour(displayHour, instant);
  const { time } = formatTime(displayHour);
  clockEl.textContent = time;
  phaseEl.textContent = world.state.label;
  slider.value = String(displayHour);
  sliderFill.style.width = `${(displayHour / 24) * 100}%`;
  chips.forEach((chip) => {
    const v = Number(chip.dataset.hour);
    const near = Math.abs(wrapDelta(displayHour, v)) < 0.32;
    chip.classList.toggle('is-active', near);
  });
  updatePoemForTime(displayHour);
}

function animateTime(to: number, dur = 1.9) {
  const target = ((to % 24) + 24) % 24;
  tween = { from: displayHour, to: target, t: 0, dur };
}

function stepTween(dt: number) {
  if (!tween) return;
  tween.t = Math.min(1, tween.t + dt / tween.dur);
  const e = tween.t < 0.5 ? 2 * tween.t * tween.t : 1 - Math.pow(-2 * tween.t + 2, 2) / 2;
  const h = tween.from + wrapDelta(tween.from, tween.to) * e;
  setTime(h);
  if (tween.t >= 1) tween = null;
}

/* ------------------------------------------------------------------ elements */
const clockEl = $('#clock');
const phaseEl = $('#phase');
const slider = $('#time-slider') as HTMLInputElement;
const sliderFill = $('#slider-fill');
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.chips button'));
const route = $('#route');
const routeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.route__steps button'));
const soundBtn = $('#btn-sound') as HTMLButtonElement;
const poemEl = $('#poem');
const poemText = $('#poem-text');
const toastEl = $('#toast');
const revealBtn = $('#btn-reveal') as HTMLButtonElement;
const hintEl = $('#hint');

let lastPoem = '';
let poemPhase = '';

function applyPoem(text: string) {
  poemText.classList.add('is-fading');
  setTimeout(() => {
    poemText.textContent = text;
    poemText.classList.remove('is-fading');
  }, 380);
}

function updatePoemForTime(hour: number) {
  const { phase } = { phase: world.state.phase };
  if (phase !== poemPhase) {
    poemPhase = phase;
    lastPoem = pickPoem(hour, lastPoem);
    applyPoem(lastPoem);
  }
}

/* ------------------------------------------------------------------ toast */
let toastTimer = 0;
function showToast(text: string, ms = 2400) {
  toastEl.textContent = text;
  toastEl.classList.add('is-on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), ms);
}

/* ------------------------------------------------------------------ ui */
function startUI() {
  setTime(5.33, true);
  poemText.textContent = pickPoem(5.33);
  lastPoem = poemText.textContent || '';
  poemPhase = world.state.phase;
  window.setTimeout(() => hintEl.classList.add('is-gone'), 9000);
  loadHiResAssets();
}

function loadHiResAssets() {
  // only the GLB matters; the rest of the scene is procedural
  setProgress(0.99);
}

/* time controls */
slider.addEventListener('input', () => {
  tween = null;
  setTime(Number(slider.value));
});
slider.addEventListener('pointerdown', () => {
  tween = null;
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    animateTime(Number(chip.dataset.hour));
  });
});

/* camera + route */
const enterBtn = $('#btn-enter') as HTMLButtonElement;
const resetBtn = $('#btn-reset') as HTMLButtonElement;

enterBtn.addEventListener('click', () => {
  director.goTo(Math.min(director.stage + 1, 3));
  route.hidden = false;
});

resetBtn.addEventListener('click', () => {
  director.reset();
  if (director.stage === 0) showToast('视角已恢复');
});

director.setListener((stage, mode) => {
  routeButtons.forEach((b) => b.classList.toggle('is-active', Number(b.dataset.stage) === stage));
  audio.setSpace(stage >= 2);
  if (stage === 0 && mode === 'orbit') {
    route.hidden = true;
  } else {
    route.hidden = false;
  }
  enterBtn.textContent = stage === 0 ? '进入教堂' : '继续深入';
});

routeButtons.forEach((b) => {
  b.addEventListener('click', () => director.goTo(Number(b.dataset.stage)));
});

($('#btn-back') as HTMLButtonElement).addEventListener('click', () => {
  if (director.stage <= 0) return;
  director.goTo(director.stage - 1);
});

($('#btn-skip') as HTMLButtonElement).addEventListener('click', () => director.skip());

($('#btn-leave') as HTMLButtonElement).addEventListener('click', () => {
  director.leave();
  showToast('回到海边');
});

/* sound */
soundBtn.addEventListener('click', async () => {
  const on = await audio.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  showToast(on ? '潮声已开启 · 进入礼堂会变轻' : '潮声已关闭');
  if (on) audio.setSpace(director.stage >= 2);
});

document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));

/* hide ui */
function setUiHidden(hidden: boolean) {
  document.body.classList.toggle('ui-hidden', hidden);
  revealBtn.hidden = true;
  if (hidden) {
    showToast('界面已隐藏 · 轻点画面或按 H 恢复', 2600);
  }
}

($('#btn-hide') as HTMLButtonElement).addEventListener('click', () => setUiHidden(true));
revealBtn.addEventListener('click', () => setUiHidden(false));

let pointerStart: { x: number; y: number; t: number } | null = null;
canvas.addEventListener('pointerdown', (e) => {
  pointerStart = { x: e.clientX, y: e.clientY, t: performance.now() };
});
canvas.addEventListener('pointerup', (e) => {
  if (!pointerStart) return;
  const dist = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
  const dt = performance.now() - pointerStart.t;
  pointerStart = null;
  if (dist < 7 && dt < 380 && document.body.classList.contains('ui-hidden')) {
    setUiHidden(false);
  }
});

/* ------------------------------------------------------------------ modal */
const notesModal = $('#modal-notes');
const cardModal = $('#modal-card');

function openModal(el: HTMLElement) {
  el.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal(el: HTMLElement) {
  el.hidden = true;
  document.body.classList.remove('modal-open');
}

document.querySelectorAll<HTMLElement>('.modal').forEach((modal) => {
  modal.querySelectorAll<HTMLElement>('[data-close]').forEach((el) => {
    el.addEventListener('click', () => closeModal(modal));
  });
});

($('#btn-notes') as HTMLButtonElement).addEventListener('click', () => openModal(notesModal));

/* ------------------------------------------------------------------ postcard */
const cardCanvas = $('#card-canvas') as unknown as HTMLCanvasElement;
const cardMeta = $('#card-meta');
const cardForm = $('#card-form') as HTMLFormElement;
const cardTo = $('#card-to') as HTMLInputElement;
const cardMsg = $('#card-msg') as HTMLTextAreaElement;
let cardImageUrl = '';

async function captureFrame(): Promise<string> {
  const renderer = world.renderer;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const prevRatio = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(2, Math.max(1.6, window.devicePixelRatio || 1)));
  renderer.setSize(w, h, false);
  world.render();
  const url = renderer.domElement.toDataURL('image/png');
  renderer.setPixelRatio(prevRatio);
  renderer.setSize(w, h, false);
  return url;
}

let cardImg: HTMLImageElement | null = null;

async function composeCard(url: string) {
  cardImageUrl = url;
  const img = await loadImage(url);
  cardImg = img;
  const dir = world.cameraDirection;
  const { time, date } = formatTime(displayHour);
  const bearing = bearingLabel(dir);
  await drawPostcard(cardCanvas, {
    image: img,
    time,
    date,
    phase: world.state.label,
    bearing,
    recipient: cardTo.value.trim(),
    message: cardMsg.value.trim(),
  });
  cardMeta.textContent = `${time} · ${world.state.label} · ${bearing} · 完整画面，本地合成`;
}

async function openCard() {
  openModal(cardModal);
  if (!cardImageUrl) {
    try {
      const url = await captureFrame();
      await composeCard(url);
    } catch (err) {
      console.error(err);
      showToast('取景失败，请重试');
    }
  } else {
    await composeCard(cardImageUrl);
  }
}

($('#btn-card') as HTMLButtonElement).addEventListener('click', openCard);

cardTo.addEventListener('input', () => {
  if (cardImg) composeCard(cardImg.src).catch(() => {});
});
cardMsg.addEventListener('input', () => {
  if (cardImg) composeCard(cardImg.src).catch(() => {});
});

($('#btn-recapture') as HTMLButtonElement).addEventListener('click', async () => {
  closeModal(cardModal);
  await new Promise((r) => setTimeout(r, 380));
  try {
    const url = await captureFrame();
    await composeCard(url);
    openModal(cardModal);
    showToast('已记录新的取景');
  } catch {
    showToast('取景失败，请重试');
  }
});

cardForm.addEventListener('submit', (e) => {
  e.preventDefault();
  cardCanvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    const { date, time } = formatTime(displayHour);
    a.href = URL.createObjectURL(blob);
    a.download = `阿那亚-光与潮汐-${date.replace(/\./g, '')}-${time.replace(':', '')}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    showToast('纪念卡已保存 · 未上传');
  }, 'image/png');
});

/* ------------------------------------------------------------------ keyboard */
window.addEventListener('keydown', (e) => {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'Escape') {
    document.querySelectorAll<HTMLElement>('.modal:not([hidden])').forEach((m) => closeModal(m));
    return;
  }
  if (e.key === 'h' || e.key === 'H') {
    setUiHidden(!document.body.classList.contains('ui-hidden'));
    return;
  }
  const idx = Number(e.key) - 1;
  if (idx >= 0 && idx < PRESETS.length) {
    animateTime(PRESETS[idx]);
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    director.skip();
  }
});

/* ------------------------------------------------------------------ resize */
let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => world.resize(), 120);
});

/* ------------------------------------------------------------------ boot */
boot();

// keep the note about available stages reachable from the console for debugging
(window as any).__aranya = { world, director, setTime, stages: STAGES };
