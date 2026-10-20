export type PoemPhase = 'dawn' | 'day' | 'dusk' | 'blue' | 'night';

export interface Poem {
  lines: string;
  phase: PoemPhase | 'any';
}

const POEMS: Poem[] = [
  { phase: 'dawn', lines: '潮水把光推到门前，\n白墙比海先醒。' },
  { phase: 'dawn', lines: '雾还没有散，\n钟声先落下来了。' },
  { phase: 'dawn', lines: '天与海之间，\n只留下一道很淡的粉。' },
  { phase: 'dawn', lines: '沙是凉的，\n光正在变暖。' },
  { phase: 'dawn', lines: '第一班潮退去时，\n台阶上多了一层光。' },

  { phase: 'day', lines: '海平线拉直了时间，\n我们只站了一小会儿。' },
  { phase: 'day', lines: '风把影子擦过台阶，\n又擦回来。' },
  { phase: 'day', lines: '白得发亮，却不刺眼，\n像一句话说到一半。' },
  { phase: 'day', lines: '正午很轻，\n轻得能听见盐。' },
  { phase: 'day', lines: '云从屋顶走过，\n没有停留。' },

  { phase: 'dusk', lines: '落日把墙烧成杏色，\n又慢慢熄灭。' },
  { phase: 'dusk', lines: '今天的海，\n是琥珀做的。' },
  { phase: 'dusk', lines: '影子被拉得很长，\n长过了回去的路。' },
  { phase: 'dusk', lines: '光退到门框上，\n坐了一会儿。' },
  { phase: 'dusk', lines: '海把一整天收起来，\n只留一条金线。' },

  { phase: 'blue', lines: '蓝调时分，\n窗里亮起一盏灯。' },
  { phase: 'blue', lines: '海把最后一点暖色\n收进口袋。' },
  { phase: 'blue', lines: '世界正在变蓝，\n只有木门是暖的。' },
  { phase: 'blue', lines: '风停了，\n潮声才显出来。' },
  { phase: 'blue', lines: '天色低垂，\n像要说什么。' },

  { phase: 'night', lines: '月亮在海面写字，\n写到岸就停了。' },
  { phase: 'night', lines: '星光很轻，\n落在尖顶上。' },
  { phase: 'night', lines: '夜把海翻了过去，\n露出背面。' },
  { phase: 'night', lines: '灯还亮着，\n像有人在等。' },
  { phase: 'night', lines: '潮声比白天更近，\n也更慢。' },

  { phase: 'any', lines: '来时是沙，走时是潮。' },
  { phase: 'any', lines: '教堂不说话，\n海替它说。' },
  { phase: 'any', lines: '把此刻折好，\n放进纸里。' },
  { phase: 'any', lines: '每一次退潮，\n都留下一点光。' },
];

export function phaseOf(hour: number): PoemPhase {
  const h = ((hour % 24) + 24) % 24;
  if (h < 4.9 || h >= 20.6) return 'night';
  if (h < 6.6) return 'dawn';
  if (h < 16.8) return 'day';
  if (h < 19.2) return 'dusk';
  return 'blue';
}

export function pickPoem(hour: number, avoid?: string): string {
  const phase = phaseOf(hour);
  const pool = POEMS.filter((p) => p.phase === phase);
  const universal = POEMS.filter((p) => p.phase === 'any');
  const source = Math.random() < 0.22 ? universal : pool;
  const candidates = source.filter((p) => p.lines !== avoid);
  const chosen = candidates[Math.floor(Math.random() * candidates.length)] || source[0];
  return chosen.lines;
}
