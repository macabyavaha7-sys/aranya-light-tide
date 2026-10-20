export interface CardInput {
  image: HTMLImageElement;
  time: string;
  phase: string;
  date: string;
  bearing: string;
  recipient: string;
  message: string;
}

const SERIF = '"Songti SC", "Source Han Serif SC", "Noto Serif SC", "STSong", "SimSun", serif';
const SANS = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif';

const W = 1800;
const H = 1200;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const chars = [...text.replace(/\s+/g, ' ').trim()];
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    const joined = [...lines.join('')].length;
    if (joined < chars.length) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
  }
  return lines;
}

export async function drawPostcard(canvas: HTMLCanvasElement, input: CardInput): Promise<void> {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // paper
  ctx.fillStyle = '#f4efe5';
  ctx.fillRect(0, 0, W, H);

  // faint paper tooth
  ctx.save();
  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = `rgba(120,104,80,${Math.random() * 0.035 + 0.008})`;
    ctx.fillRect(x, y, 1.1, 1.1);
  }
  ctx.restore();

  // frame
  ctx.strokeStyle = 'rgba(33,31,27,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(48.5, 48.5, W - 97, H - 97);

  // image, whole frame preserved
  const areaX = 96;
  const areaY = 96;
  const areaW = W - areaX * 2;
  const areaH = 700;
  const img = input.image;
  const scale = Math.min(areaW / img.width, areaH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = areaX + (areaW - dw) / 2;
  const dy = areaY + (areaH - dh) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(40,32,22,0.18)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(dx, dy, dw, dh);
  ctx.restore();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

  // hairline under the picture
  ctx.strokeStyle = 'rgba(33,31,27,0.20)';
  ctx.beginPath();
  ctx.moveTo(96, 852.5);
  ctx.lineTo(W - 96, 852.5);
  ctx.stroke();

  // small caption above the rule
  ctx.fillStyle = 'rgba(33,31,27,0.52)';
  ctx.font = `400 15px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('A R A N Y A   ·   光 与 潮 汐', 96, 838);

  // recipient + message
  ctx.fillStyle = '#2b2823';
  ctx.font = `400 42px ${SERIF}`;
  const to = (input.recipient || '').trim();
  ctx.fillText(to ? `致 ${to}` : '致  你', 96, 930);

  ctx.fillStyle = '#3a362f';
  const lines = wrap(ctx, input.message || '这一刻的海，替我留在纸上。', 980, 3);
  // drop the sample line if the message is empty so the card stays quiet
  if (!input.message.trim()) lines.length = 0;
  ctx.font = `400 28px ${SERIF}`;
  let ly = 984;
  for (const line of lines) {
    ctx.fillText(line, 96, ly);
    ly += 46;
  }

  // time block, right aligned
  ctx.textAlign = 'right';
  ctx.fillStyle = '#2b2823';
  ctx.font = `400 54px ${SERIF}`;
  ctx.fillText(input.time, W - 96, 928);
  ctx.font = `400 20px ${SERIF}`;
  ctx.fillStyle = 'rgba(33,31,27,0.62)';
  ctx.fillText(`${input.phase} · ${input.date}`, W - 96, 964);

  ctx.font = `400 16px ${SANS}`;
  ctx.fillStyle = 'rgba(33,31,27,0.48)';
  ctx.fillText('39°48′N   119°31′E   ·   秦皇岛 · 阿那亚', W - 96, 996);
  ctx.fillText(input.bearing, W - 96, 1024);

  // footer
  ctx.textAlign = 'left';
  ctx.font = `400 14px ${SANS}`;
  ctx.fillStyle = 'rgba(33,31,27,0.45)';
  ctx.fillText('A MOMENT ON THE SHORE', 96, 1104);
  ctx.textAlign = 'right';
  ctx.fillText('印于本地 · 不上传', W - 96, 1104);

  // a single hand-drawn line: the horizon
  ctx.strokeStyle = 'rgba(109,85,54,0.35)';
  ctx.beginPath();
  ctx.moveTo(96, 1140.5);
  ctx.lineTo(W - 96, 1140.5);
  ctx.stroke();

  // seal
  ctx.save();
  ctx.translate(W - 140, 1120);
  ctx.strokeStyle = 'rgba(109,85,54,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(109,85,54,0.72)';
  ctx.font = `400 18px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('潮', 0, 1);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export function formatTime(hour: number): { time: string; date: string } {
  const total = Math.round(hour * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return {
    time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    date: `${yyyy}.${mm}.${dd}`,
  };
}

export function bearingLabel(dir: { x: number; y: number; z: number }): string {
  const elev = Math.round(Math.asin(Math.max(-1, Math.min(1, dir.y))) * (180 / Math.PI));
  let head = '望 海';
  if (dir.z > 0.55) head = '望 岸';
  else if (Math.abs(dir.z) <= 0.55) head = '侧 望';
  const tilt = elev > 6 ? '仰' : elev < -8 ? '俯' : '平';
  return `视角 ${head} · ${tilt} ${Math.abs(elev)}°`;
}
