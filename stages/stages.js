// Build animation of the stages section, copied from prototypes/etapy-lineyka by site/tools/port-stages.py. Do not edit here.
/* Блок «Этапы и сроки» на доме Алексино (выставочный дом в Forest Club). Те же этапы и тот же рисунок, что в прототипе
   etapy-i-sroki, но дом настоящий: 34 детали с марками и монолит из IFC Максима (alexino-data.js, копия данных теста
   «Из чертежа в дом»). Порядок монтажа как в том тесте: север и запад, внутренние стены, фасад, плиты, стенки перепада, парапеты.
   Камера (вариант c4 с правкой Максима 26.10): проект сверху планом, дальше изометрия с юго-юго-запада, когда уходит завод,
   небольшой разворот на юго-восток и сборка с другой стороны, в конце фасад, как в лоадере Димы (Фигма, «12-2 Концепция 1»).
   Единица рисунка 50 мм, 20 единиц на метр. x вдоль осей 1 → 4, y на север от оси А, z вверх от чистого пола.
   28.10: тот же сюжет, темп и рисунок, что в etapy-alexino (принят 26.10), в новом дизайне блока (Фигма, кадр 219:896)
   с линейкой недель по StoryCarousel с leftcoast.refractweb.com/about. */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
// один изинг на все движения: квадратичный in-out, мягкий старт и финиш без рывка (вариант e3, выбрал Максим 26.10).
// Были кубический in-out с рывком посередине и easeOut с резким стартом
const ease = t => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
function seq(t, k, n, d) { const a = n <= 1 ? 0 : k * (1 - d) / (n - 1); return ramp(a, a + d, t); }

const qs = new URLSearchParams(location.search);
let FORCE = qs.has('p') ? clamp(+qs.get('p') || 0, 0, 1) : null;   // ?p=0.4 рисует кадр на 40% без прокрутки
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?zk=2 — пробный вариант Максима 28.10: закладные (рентген сетей) не на монтаже, а в начале перекрытия, чтобы монтаж шёл
// быстрее: на монтаже только стены краном и разворот камеры, перекрытие начинается со схемы сетей, потом плита в прежнем темпе
const ZK2 = qs.get('zk') !== '1';   // Максим 28.10: «пока оставляем этот» — вариант 2 по умолчанию, ?zk=1 — как было

/* ---------- этапы по наброску Максима Липатникова 16.10, недели стройки из 26 ---------- */
// Новый дизайн (Фигма, кадр 219:896): справа список этапов с неделями, внизу слева линейка недель с меткой текущей
// недели. Названия и недели этапов наши, принятые 26.10: на них собрана анимация. В макете стоят заглушки
const WEEKS = ['00-04', '03-13', '12-14', '14-22', '21-26'];
const WEEK_END = [4, 13, 14, 22, 26];
const STAGES = ['Проект фундамента и панелей', 'Фундамент и завод', 'Монтаж', 'Перекрытие', 'Окна и кровля'];
const ANIMATED = STAGES.length;
// этап по сюжету; на самой остановке (конец этапа) — ещё этот этап, следующий загорается, когда тронулись
const stageAt = p => clamp(Math.floor(p * ANIMATED - 1e-6), 0, ANIMATED - 1);
// неделя стройки без округления. Максим 28.10: «чтобы всё равномерно шло, таймер плавнее относительно анимации».
// Раньше неделя шла по сюжету этапа и стояла в его паузах. Теперь каждый этап — свой шаг прокрутки, и внутри шага
// неделя идёт ровно по времени от конца прошлого этапа до конца этого (0 → 4 → 13 → 14 → 22 → 26)
const WEEKS_N = WEEK_END[ANIMATED - 1];
const lerpBy = (xs, ys, x) => { for (let i = 1; i < xs.length; i++) if (x <= xs[i] || i === xs.length - 1) return lerp(ys[i - 1], ys[i], clamp((x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1), 0, 1)); return ys[0]; };
const weekNow = () => lerpBy(STOP_Q, STOP_W, pr.q);
const qOfWeek = w => lerpBy(STOP_W, STOP_Q, clamp(w, 0, WEEKS_N));

const list = $('etList');
WEEKS.forEach((t, i) => { const el = document.createElement('p'); el.className = 'et-li-w mono-s'; el.textContent = t; el.style.gridRow = i + 1; list.appendChild(el); });
const stageEls = STAGES.map((t, i) => {
  const el = document.createElement('p'); el.className = 'et-li text-s-medium'; el.style.gridRow = i + 1;
  el.innerHTML = '<span></span>'; el.firstChild.textContent = t; list.appendChild(el); return el;
});
// этап по щелчку (Максим 30.10: «этапы справа кликабельные — нажимаешь, открывается этот этап»): название и недели этапа
const stageHit = i => [list.children[i], stageEls[i]];
const markEls = [];
let shownRow = -1;
function syncRows(p) {
  // пока стройка не тронулась (неделя 00), все этапы серые, как остальные; «Проект фундамента и панелей» загорается
  // с первой прокруткой (Максим 28.10)
  const row = p > 0 ? stageAt(p) : -1;
  if (row === shownRow) return;
  shownRow = row;
  stageEls.forEach((el, i) => el.classList.toggle('on', i === row));
  markEls.forEach((el, i) => el.classList.toggle('on', i === row));
}
/* ---------- счётчик недель: лента цифр, как в Number Odometer из Osmo ---------- */
// Ленты считаются прямо от недели, без догона, поэтому счётчик и стебель на линейке всегда вместе и идут ровно:
// на каждой неделе цифра стоит, а когда стебель проходит середину между неделями, за 0,4 недели плавно перекатывается
// в следующую (тот же квадратичный in-out). Все перекаты одинаковые, через равное время. Десятки едут, только пока
// единицы идут с 9 на 0, как в механическом счётчике. Два счётчика на одной ленте: в шапке и над стеблем
const ROLL = 0.4;   // доля недели на перекат цифры
let wkTarget = 0, wkShown = -1;
function odometer(el) {
  const strips = [0, 1].map(k => {   // десятки 0…9, единицы 0…9 и снова 0, чтобы 9 уезжал в 0
    const mask = document.createElement('span'), roller = document.createElement('span');
    mask.setAttribute('data-odometer-part', 'mask'); mask.setAttribute('aria-hidden', 'true'); mask.style.height = '1em'; mask.style.lineHeight = 1;
    roller.setAttribute('data-odometer-part', 'roller'); roller.style.lineHeight = 1;
    roller.textContent = Array.from({ length: k ? 11 : 10 }, (_, i) => i % 10).join('\n');
    mask.appendChild(roller); return { mask, roller };
  });
  const text = document.createElement('span');   // число для экранного диктора
  text.className = 'sr-only'; text.textContent = '00';
  el.replaceChildren(...strips.map(s => s.mask), text);
  return { strips, text };
}
const ODOS = [odometer($('etNum'))];
function rollWeek() {
  const w = weekNow(), n = Math.floor(w), r = Math.round(w);
  if (r !== wkTarget) { wkTarget = r; for (const o of ODOS) o.text.textContent = String(r).padStart(2, '0'); }
  const shown = Math.min(WEEKS_N, n + ease(ramp(0.5 - ROLL / 2, 0.5 + ROLL / 2, w - n)));
  if (Math.abs(shown - wkShown) < 1e-4) return;
  wkShown = shown;
  const ones = shown % 10, tens = Math.floor(shown / 10) + clamp(ones - 9, 0, 1);
  for (const o of ODOS) {
    o.strips[0].roller.style.transform = `translate3d(0, ${-tens}em, 0)`;
    o.strips[1].roller.style.transform = `translate3d(0, ${-ones}em, 0)`;
  }
}

/* ---------- линейка недель по Left Coast (StoryCarousel, leftcoast.refractweb.com/about) ---------- */
// У них 85 делений; под курсором деления вытягиваются волной: высота × (1 + 1,4·cos(d / 160 · π/2)) при d < 160 px,
// и каждое догоняет свою высоту на 0,1 за кадр, поэтому волна мягко тянется за мышью. У вехи — высокая линия с годом
// и подписью, подпись меняется прозрачностью и сдвигом 800 мс по cubic-bezier(.22, 1, .36, 1).
// У нас вместо мыши — текущая неделя стройки: волна стоит вокруг неё и едет по ходу прокрутки, на неделе стоит стебель
// с номером недели и этапом. Под мышью волна идёт за курсором, как у них; щелчок и протяжка по линейке ведут стройку
// к этой неделе. Деления и подписи из макета: 53 через полнедели от x 20 до 705,2 (до линии ячейки 14,8).
// Когда окно шире макета, ячейка и линейка растягиваются на половину окна, деления реже, волна в тех же делениях
const R_X0 = 16, R_N = 53, R_PAD = 18.8;
// Радиус волны как у Left Coast: 160 px при шаге делений 25 px — 6,4 деления в каждую сторону. Волна широкая и пологая,
// в ней 13 делений; в макете нарисована узкая (2,7 деления), Максим 28.10: «там сильно приятнее для глаз» — берём их
const WAVE_A = 1.4, WAVE_STEPS = 160 / 25, BAR_K = 0.1;
let R_X1 = 705.2, R_STEP = (R_X1 - R_X0) / (R_N - 1), WAVE_R = 35;
const xOfWeek = w => R_X0 + w * 2 * R_STEP;
const ruler = $('etRuler');
const ticks = Array.from({ length: R_N }, () => { const el = document.createElement('div'); el.className = 'et-tick'; ruler.appendChild(el); return el; });
const tickS = new Float32Array(R_N).fill(1), tickFut = new Uint8Array(R_N), tickO = new Float32Array(R_N).fill(1);
const labels = Array.from({ length: 14 }, (_, k) => {
  const el = document.createElement('div'); el.className = 'et-wl mono-scale' + (k ? (k === 13 ? ' last' : '') : ' first'); el.textContent = String(k * 2).padStart(2, '0');
  ruler.appendChild(el); return { el, w: k * 2, o: 1 };
});
const stem = document.createElement('div'); stem.className = 'et-stem'; ruler.appendChild(stem);
let hoverX = null, markOff = 0, nameW = STAGES.map(() => 120), rFirst = true;
function measureNames() { nameW = markEls.map(s => s.offsetWidth / U); }
function layoutRuler() {   // деления и подписи по ширине ячейки
  R_X1 = CELL_W - R_PAD; R_STEP = (R_X1 - R_X0) / (R_N - 1); WAVE_R = WAVE_STEPS * R_STEP;
  ticks.forEach((el, i) => { el.style.left = `calc(${(R_X0 + i * R_STEP).toFixed(2)} * var(--u))`; });
  for (const l of labels) l.el.style.left = `calc(${xOfWeek(l.w).toFixed(2)} * var(--u))`;
  rFirst = true;
}
function rulerFrame(dt) {
  const w = weekNow(), sx = xOfWeek(w), now = RM || FORCE !== null || rFirst;   // первый кадр сразу на месте, без въезда
  rFirst = false;
  const k = now ? 1 : 1 - Math.pow(1 - BAR_K, dt * 60);   // 0,1 за кадр при 60 кадрах в секунду, на любой частоте экрана
  const cx = hoverX === null ? sx : hoverX;
  for (let i = 0; i < R_N; i++) {
    const x = R_X0 + i * R_STEP, d = Math.abs(cx - x);
    const n = d < WAVE_R ? 1 + WAVE_A * Math.cos(d / WAVE_R * Math.PI / 2) : 1, a = (n - tickS[i]) * k;
    if (Math.abs(a) > 0.001 || (now && tickS[i] !== n)) { tickS[i] = now ? n : tickS[i] + a; ticks[i].style.transform = `scaleY(${tickS[i].toFixed(3)})`; }
    const fut = x > sx + 0.5 ? 1 : 0;   // впереди стебля недели ещё не прошли
    if (fut !== tickFut[i]) { tickFut[i] = fut; ticks[i].classList.toggle('fut', fut === 1); }
    // стебель сам вершина волны: деление, над которым он проходит, уступает ему место, иначе между делениями
    // рядом со стеблем стоит второе высокое деление и линия двоится. На целой неделе всё как в макете
    const o = ramp(0.25 * R_STEP, 0.9 * R_STEP, Math.abs(x - sx));
    if (Math.abs(o - tickO[i]) > 0.01 || (o !== tickO[i] && (o === 0 || o === 1))) { tickO[i] = o; ticks[i].style.opacity = o.toFixed(2); }
  }
  for (const l of labels) {   // подпись прячется под стеблем и там, где волна вытянула деления до подписей
    const o = Math.min(ramp(0.55, 0.95, Math.abs(l.w - w)), 1 - ramp(1.3, 1.55, tickS[l.w * 2]));
    if (Math.abs(o - l.o) > 0.004) { l.o = o; l.el.style.opacity = o.toFixed(2); }
  }
  stem.style.transform = `translateX(${(sx * U).toFixed(2)}px)`;
}

/* ---------- холст и камера ---------- */
// Камера ортогональная: азимут phi (куда смотрим в плане) и высота eps. При phi 45° и eps 35,26° это прежняя изометрия:
// x и y под 30°, высота в натуральную величину. При eps 0 фасад, при eps 90° план
const cv = $('cv'), ctx = cv.getContext('2d');
const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
const INK = tok('--drawing-line'), GHOST = tok('--drawing-line-light'), CELL = tok('--bg-page');
// ячейка с домом по макету 720 × 521 (в окне шире макета — половина окна); дом вписывается в прямоугольник
// рисунка-заглушки из макета (89, 33, 540 × 460) по центру ячейки, сцена с заводом и участком — шире, с полями
// как в прошлой ячейке
let CELL_W = 720, CELL_H = 521, FIT = [36, 33, CELL_W - 72, 460], FIT_H = [89, 33, 542, 460];
const S = Math.sqrt(1.5), ISO = Math.atan(Math.SQRT1_2), DEG = Math.PI / 180;
const PIV = [141, 147, 30];   // центр дома, вокруг него облетает камера
let FX = 1, FY = 0, RX = 0, RY = -1, SE = 0, CE = 1;
let CAM = { k: 1, ox: 0, oy: 0 }, U = 1, DPR = 1, LW = 1, DASH = [3, 3];
function setView(v) { FX = Math.cos(v.phi); FY = Math.sin(v.phi); RX = FY; RY = -FX; SE = Math.sin(v.eps); CE = Math.cos(v.eps); }
const P = (x, y, z) => { const dx = x - PIV[0], dy = y - PIV[1]; return [CAM.ox + CAM.k * S * (RX * dx + RY * dy), CAM.oy - CAM.k * S * (SE * (FX * dx + FY * dy) + CE * (z - PIV[2]))]; };
const mixCam = (a, b, t) => ({ k: lerp(a.k, b.k, t), ox: lerp(a.ox, b.ox, t), oy: lerp(a.oy, b.oy, t) });
const corners = b => { const o = []; for (const x of [b[0], b[1]]) for (const y of [b[2], b[3]]) for (const z of [b[4], b[5]]) o.push([x, y, z]); return o; };
function fitCam(pts, r) {   // вписать точки в прямоугольник ячейки при текущем направлении взгляда
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [x, y, z] of pts) {
    const dx = x - PIV[0], dy = y - PIV[1], px = S * (RX * dx + RY * dy), py = -S * (SE * (FX * dx + FY * dy) + CE * (z - PIV[2]));
    a = Math.min(a, px); c = Math.max(c, px); b = Math.min(b, py); d = Math.max(d, py);
  }
  const k = Math.min(r[2] / (c - a), r[3] / (d - b));
  return { k, ox: r[0] + r[2] / 2 - k * (a + c) / 2, oy: r[1] + r[3] / 2 - k * (b + d) / 2 };
}
// точки обзора камеры и путь по сюжету: этап i идёт с i/5 до (i + 0,8)/5. Разворот на юго-восток на монтаже,
// когда встали стены и уходит завод: закладные уже видны с той стороны
const VW = {
  top: { phi: 90 * DEG, eps: 89.5 * DEG },    // план, север вверх
  sw: { phi: 62 * DEG, eps: ISO },            // изометрия с юго-юго-запада: южный фасад, как в лоадере, виден лучше западного
  se: { phi: 118 * DEG, eps: 34 * DEG },      // разворот после завода: юго-восток, вход, навес над террасой, восточный фасад
  front: { phi: 90 * DEG, eps: 0 }            // фасад с юга, как в лоадере
};
const PATH = [[0, VW.top], [0.16, VW.top], [0.2, VW.sw], [ZK2 ? 0.528 : 0.48, VW.sw], [ZK2 ? 0.56 : 0.5, VW.se], [0.96, VW.se], [1, VW.front]];
const depthAt = (v, c) => Math.cos(v.eps) * (Math.cos(v.phi) * (c[0] - PIV[0]) + Math.sin(v.phi) * (c[1] - PIV[1])) - Math.sin(v.eps) * (c[2] - PIV[2]);   // больше — дальше от зрителя
const centre = b => [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2];
function viewAt(p) {
  const K = PATH;
  if (p <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (p <= K[i][0]) {
    const [p0, a] = K[i - 1], [p1, b] = K[i], t = ease(ramp(p0, p1, p));
    return { phi: lerp(a.phi, b.phi, t), eps: lerp(a.eps, b.eps, t) };
  }
  return K[K.length - 1][1];
}

/* ---------- дом Алексино из IFC ---------- */
const HS = window.HOUSE, SC = 1 / 50, EPS = 0.01, T = 7;
const GZ = -470 * SC;   // низ фундаментной плиты, уровень земли на рисунке
function ifcBox(l) {   // слой или деталь из IFC в коробку рисунка [x0, x1, y0, y1, z0, z1]
  if (l.W === 'x') return [l.w[0] * SC, l.w[1] * SC, -l.u[1] * SC, -l.u[0] * SC, l.v[0] * SC, l.v[1] * SC];
  if (l.W === 'z') return [l.u[0] * SC, l.u[1] * SC, -l.w[1] * SC, -l.w[0] * SC, l.v[0] * SC, l.v[1] * SC];
  return [l.u[0] * SC, l.u[1] * SC, -l.v[1] * SC, -l.v[0] * SC, l.w[0] * SC, l.w[1] * SC];   // плита
}
const holeRect = o => [o[0] * SC, o[1] * SC, -o[3] * SC, -o[2] * SC];
function rectsMinus(R, holes) {   // прямоугольник без вырезов как набор прямоугольников
  const xs = [...new Set([R[0], R[1], ...holes.flatMap(h => [h[0], h[1]])])].filter(x => x >= R[0] && x <= R[1]).sort((a, b) => a - b);
  const ys = [...new Set([R[2], R[3], ...holes.flatMap(h => [h[2], h[3]])])].filter(y => y >= R[2] && y <= R[3]).sort((a, b) => a - b);
  const filled = (x, y) => !holes.some(h => x > h[0] && x < h[1] && y > h[2] && y < h[3]);
  let rows = [];
  for (let j = 0; j < ys.length - 1; j++) {
    const cy = (ys[j] + ys[j + 1]) / 2, runs = [];
    for (let i = 0; i < xs.length - 1; i++) {
      if (!filled((xs[i] + xs[i + 1]) / 2, cy)) continue;
      const last = runs[runs.length - 1];
      if (last && Math.abs(last[1] - xs[i]) < EPS) last[1] = xs[i + 1]; else runs.push([xs[i], xs[i + 1]]);
    }
    rows.push({ y0: ys[j], y1: ys[j + 1], runs });
  }
  const out = [];
  for (const r of rows) for (const [a, b] of r.runs) {
    const prev = out.find(q => Math.abs(q[0] - a) < EPS && Math.abs(q[1] - b) < EPS && Math.abs(q[3] - r.y0) < EPS);
    if (prev) prev[3] = r.y1; else out.push([a, b, r.y0, r.y1]);
  }
  return out;
}
function outline(rects) {   // наружный контур объединения прямоугольников одной петлёй точек
  const xs = [...new Set(rects.flatMap(r => [r[0], r[1]]))].sort((a, b) => a - b), ys = [...new Set(rects.flatMap(r => [r[2], r[3]]))].sort((a, b) => a - b);
  const inside = (x, y) => rects.some(r => x > r[0] && x < r[1] && y > r[2] && y < r[3]);
  const segs = [];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2; if (!inside(cx, cy)) continue;
    if (!inside(cx, ys[j] - 0.01)) segs.push({ a: [xs[i], ys[j]], b: [xs[i + 1], ys[j]], n: [0, -1] });
    if (!inside(cx, ys[j + 1] + 0.01)) segs.push({ a: [xs[i + 1], ys[j + 1]], b: [xs[i], ys[j + 1]], n: [0, 1] });
    if (!inside(xs[i] - 0.01, cy)) segs.push({ a: [xs[i], ys[j + 1]], b: [xs[i], ys[j]], n: [-1, 0] });
    if (!inside(xs[i + 1] + 0.01, cy)) segs.push({ a: [xs[i + 1], ys[j]], b: [xs[i + 1], ys[j + 1]], n: [1, 0] });
  }
  // обход против часовой: из конца отрезка в начало следующего, на прямых участках точки не повторяем.
  // Кусков может быть несколько (крыльцо отдельно от плиты), у каждого своя петля
  const loops = [], sides = [], used = new Array(segs.length).fill(false);
  for (let st = used.indexOf(false); st >= 0; st = used.indexOf(false)) {
    const loop = [segs[st].a]; let cur = st; used[st] = true;
    for (;;) {
      const end = segs[cur].b, nx = segs.findIndex((s, i) => !used[i] && Math.abs(s.a[0] - end[0]) < EPS && Math.abs(s.a[1] - end[1]) < EPS);
      if (nx < 0) break;
      if (segs[nx].n[0] !== segs[cur].n[0] || segs[nx].n[1] !== segs[cur].n[1]) loop.push(end);
      used[nx] = true; cur = nx;
    }
    loops.push(loop);
    for (let i = 0; i < loop.length; i++) {   // прямые участки с наружной нормалью, для бортов опалубки
      const a = loop[i], b = loop[(i + 1) % loop.length];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < EPS) continue;
      sides.push({ a, b, n: Math.abs(a[1] - b[1]) < EPS ? [0, b[0] > a[0] ? -1 : 1] : [b[1] > a[1] ? 1 : -1, 0] });
    }
  }
  return { loops, sides };
}

const els = [];
function box(kind, b, o = {}) { const e = Object.assign({ id: els.length, kind, b }, o); els.push(e); return e; }
const rawSlabs = list => {   // плиты разбиты на прямоугольники по вырезам, рёбра перепада отдельными коробками
  const out = [];
  for (const d of list) {
    const b = ifcBox(d);
    if (d.W !== 'y') { out.push({ b, beam: true }); continue; }
    for (const r of rectsMinus(b, d.o.map(holeRect))) out.push({ b: [r[0], r[1], r[2], r[3], b[4], b[5]], holes: [] });
  }
  return out;
};
let fnd = rawSlabs(HS.mono['Фундамент']), flr = rawSlabs(HS.mono['Пол']), roof = rawSlabs(HS.mono['Перекрытие']);

const PAN = {};
for (const [m, p] of Object.entries(HS.panels)) {
  const B = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9];
  for (const l of p.l) { const b = ifcBox(l); for (let i = 0; i < 6; i += 2) { B[i] = Math.min(B[i], b[i]); B[i + 1] = Math.max(B[i + 1], b[i + 1]); } }
  const ax = p.l[0].W === 'x' ? 'x' : 'y', out = p.l.find(l => l.k === 'e') || p.l[0];
  const kind = m.startsWith('ПП') ? 'para' : m.startsWith('ВС') ? 'inner' : 'wall';
  if (kind !== 'para') B[4] = Math.max(B[4], 0);   // панель стоит на чистом полу, нижние 150 мм в плите не рисуем
  // наружная стена, под которой нет пола, стоит на фундаменте: иначе между ними щель 170 мм и стена висит в воздухе
  const ov = r => r.b[0] < B[1] - EPS && B[0] < r.b[1] - EPS && r.b[2] < B[3] - EPS && B[2] < r.b[3] - EPS;
  if (kind === 'wall' && !flr.some(ov)) B[4] = Math.max(...fnd.filter(ov).map(r => r.b[5]), B[4] - 3.4);
  const ops = out.o.filter(o => o[3] < out.v[1] - 10)   // вырезы под плиту у верха панели не проёмы
    .map(o => ax === 'x' ? [-o[1] * SC, -o[0] * SC, Math.max(0, o[2] * SC), o[3] * SC] : [o[0] * SC, o[1] * SC, Math.max(0, o[2] * SC), o[3] * SC]);
  PAN[m] = box('panel', B, { m, part: kind, ax, ops });
}
const PANELS = Object.values(PAN), PARAS = PANELS.filter(e => e.part === 'para');

// стыки: в IFC тела заходят друг в друга, а порядок отрисовки нужен однозначный
const over3 = (a, b) => a[0] < b[1] - EPS && b[0] < a[1] - EPS && a[2] < b[3] - EPS && b[2] < a[3] - EPS && a[4] < b[5] - EPS && b[4] < a[5] - EPS;
const overXY = (a, b) => a[0] < b[1] - EPS && b[0] < a[1] - EPS && a[2] < b[3] - EPS && b[2] < a[3] - EPS;
function trimAlong(a, i, b) {   // убрать из a часть, которую занимает b, вдоль оси i (0: x, 2: y)
  if (a[i] >= b[i] - EPS && a[i] < b[i + 1]) a[i] = b[i + 1];
  else if (a[i + 1] <= b[i + 1] + EPS && a[i + 1] > b[i]) a[i + 1] = b[i];
  else if (b[i] - a[i] > a[i + 1] - b[i + 1]) a[i + 1] = b[i]; else a[i] = b[i + 1];
}
const tang = e => e.ax === 'x' ? 2 : 0;
const area = r => (r[1] - r[0]) * (r[3] - r[2]);
fnd = fnd.filter(A => !fnd.some(B => B !== A && A.b[0] >= B.b[0] - EPS && A.b[1] <= B.b[1] + EPS && A.b[2] >= B.b[2] - EPS && A.b[3] <= B.b[3] + EPS && area(A.b) < area(B.b)));   // кусок внутри другого
for (const A of PANELS) for (const B of PANELS) {   // угол отдаём стене, которая идёт поперёк
  if (A === B || A.ax !== 'y' || B.ax !== 'x' || A.part === 'para' || B.part === 'para' || !over3(A.b, B.b)) continue;
  const a = A.b, b = B.b;
  if (a[0] >= b[0] - 0.5 && a[0] < b[1]) a[0] = b[1]; else if (a[1] <= b[1] + 0.5 && a[1] > b[0]) a[1] = b[0];
}
const flat = () => roof.filter(s => !s.beam);
for (const A of PANELS) {   // стена под плитой обрезается по её низу; стена, которая идёт выше плиты, проходит вырезом в плите
  if (A.part === 'para' || A.b[4] > 30) continue;
  for (const s of flat()) if (over3(A.b, s.b)) { if (A.b[5] <= s.b[5] + 1) A.b[5] = s.b[4]; else s.holes.push(A.b.slice(0, 4)); }
}
roof = roof.flatMap(s => s.beam || !s.holes.length ? [s] : rectsMinus(s.b, s.holes).map(r => ({ b: [r[0], r[1], r[2], r[3], s.b[4], s.b[5]], holes: [] })));
for (const s of roof.filter(s => s.beam)) {   // рёбра перепада между плитами и до стен
  for (const f of flat()) if (over3(s.b, f.b)) { if (f.b[5] - s.b[4] < 1) s.b[4] = f.b[5]; else if (s.b[5] - f.b[4] < 1) s.b[5] = f.b[4]; }
  for (const A of PANELS) if (A.part !== 'para' && A.b[4] <= 30 && over3(s.b, A.b)) trimAlong(s.b, s.b[1] - s.b[0] > s.b[3] - s.b[2] ? 0 : 2, A.b);
}
roof = roof.filter(s => s.b[1] - s.b[0] > 1 && s.b[3] - s.b[2] > 1);
for (const A of PANELS) {   // стенки перепада стоят на нижней плите у края верхней
  if (A.part === 'para' || A.b[4] <= 30) continue;
  for (const s of roof) if (over3(A.b, s.b)) trimAlong(A.b, A.ax === 'x' ? 0 : 2, s.b);
}
for (const A of PARAS) {   // парапет стоит на своей плите и не заходит в соседнюю
  const a = A.b; let z = a[4];
  for (const s of flat()) if (overXY(a, s.b) && s.b[5] < a[5] - 6) z = Math.max(z, s.b[5]);
  a[4] = z;
  for (const s of roof) if (over3(a, s.b)) trimAlong(a, tang(A), s.b);
}
for (const A of PARAS) for (const B of [...PARAS, ...PANELS.filter(e => e.part !== 'para' && e.b[4] > 30)]) if (A !== B && A.b[5] <= B.b[5] && over3(A.b, B.b)) trimAlong(A.b, tang(A), B.b);
const FOUND = fnd.map(s => box('found', s.b, { flat: true }));
const FLOOR = flr.map(s => box('floor', s.b, { flat: true }));
const ROOF = roof.map(s => box(s.beam ? 'beam' : 'slab', s.b, { flat: !s.beam }));
const LOW = ROOF.filter(e => e.kind === 'slab' && e.b[5] < 65), HIGH = ROOF.filter(e => e.kind === 'slab' && e.b[5] >= 65), BEAMS = ROOF.filter(e => e.kind === 'beam');
const HB = [-30, 312, -22, 316, GZ, 85];   // охват дома
const HC = [(HB[0] + HB[1]) / 2, (HB[2] + HB[3]) / 2];
for (const e of PANELS) e.ext = e.ax === 'x' ? Math.sign((e.b[0] + e.b[1]) / 2 - HC[0]) || 1 : Math.sign((e.b[2] + e.b[3]) / 2 - HC[1]) || 1;   // где улица
// окна и двери: рамы из IFC, каждая в проёме своей наружной панели
const WINS = HS.rings.map(r => {
  const b = ifcBox({ W: r.W, w: r.w, u: r.u, v: r.v }), ib = ifcBox({ W: r.W, w: r.w, u: r.iu, v: r.iv });
  b[4] = Math.max(0, b[4]); ib[4] = Math.max(0, ib[4]);
  const cx = (b[0] + b[1]) / 2, cy = (b[2] + b[3]) / 2, cz = (b[4] + b[5]) / 2;
  const pan = PANELS.find(e => e.part === 'wall' && cx > e.b[0] - 1 && cx < e.b[1] + 1 && cy > e.b[2] - 1 && cy < e.b[3] + 1 && cz > e.b[4] && cz < e.b[5]);
  return { b, ib, ax: r.W === 'x' ? 'x' : 'y', pan, done: false };
});
for (const e of PANELS) e.rings = WINS.filter(w => w.pan === e);
// проём, который после разбора угла вылез за торец стены, поджимаем внутрь вместе с рамой: у торца простенок 150 мм.
// Так у НС-110 на южном фасаде: проём в IFC до x 285, а угол забрала восточная НС-109, и стена кончается на 280
for (const e of PANELS) {
  if (e.part === 'para') continue;
  const i = e.ax === 'x' ? 2 : 0, lo = e.b[i] + 3, hi = e.b[i + 1] - 3;
  for (const o of e.ops) {
    const dh = o[1] - hi, dl = lo - o[0];
    for (const w of e.rings) if (w.b[i] < o[1] && w.b[i + 1] > o[0]) {
      if (dh > 0) { w.b[i + 1] -= dh; w.ib[i + 1] -= dh; }
      if (dl > 0) { w.b[i] += dl; w.ib[i] += dl; }
    }
    if (dh > 0) o[1] = hi;
    if (dl > 0) o[0] = lo;
  }
}
// рама окна меньше проёма на 50 мм с каждой стороны, у двери низ на полу: в IFC рама размером с проём, а местами шире,
// и на подлёте её контур ложился на контур проёма. Ширина рамы прежняя
for (const e of PANELS) for (const w of e.rings) {
  const i = e.ax === 'x' ? 2 : 0, ov = o => Math.max(0, Math.min(o[1], w.b[i + 1]) - Math.max(o[0], w.b[i])) * Math.max(0, Math.min(o[3], w.b[5]) - Math.max(o[2], w.b[4]));
  const o = e.ops.reduce((a, c) => ov(c) > ov(a) ? c : a, e.ops[0]); if (!o || ov(o) <= 0) continue;
  const g = 1, door = o[2] < 0.5, fw = [w.ib[i] - w.b[i], w.b[i + 1] - w.ib[i + 1], w.ib[4] - w.b[4], w.b[5] - w.ib[5]];
  w.b[i] = o[0] + g; w.b[i + 1] = o[1] - g; w.b[4] = door ? o[2] : o[2] + g; w.b[5] = o[3] - g;
  w.ib[i] = w.b[i] + fw[0]; w.ib[i + 1] = w.b[i + 1] - fw[1]; w.ib[4] = w.b[4] + fw[2]; w.ib[5] = w.b[5] - fw[3];
}
// Летящие детали не проходят сквозь друг друга (Максим 26.10). Стены опускают краном сверху прямо на место, почти разом,
// сначала дальние от зрителя: сверху они друг друга не задевают. Стены из теста «Из чертежа в дом»
const MONT0 = ['НС-104', 'НС-103', 'НС-105', 'НС-102', 'НС-106', 'НС-101', 'НС-107', 'НС-108', 'ВС-101', 'ВС-102', 'ВС-104', 'ВС-103', 'НС-113', 'НС-112', 'НС-111', 'НС-110', 'НС-109'].map(m => PAN[m]);
// окантовка кровли: парапеты и стенки перепада опускают сверху на место вместе с окнами, сначала дальние от зрителя
const EDGE = [...PARAS, PAN['НС-114'], PAN['НС-115']].sort((a, b) => depthAt(VW.se, centre(b.b)) - depthAt(VW.se, centre(a.b)));
const WSEQ = WINS.slice().sort((a, b) => depthAt(VW.se, centre(b.b)) - depthAt(VW.se, centre(a.b)));   // окна тоже от дальних
const EDGES = new Set(EDGE);
const PLOT = [-62, 344, -54, 348];

/* ---------- завод: конвейер ---------- */
const L1 = 4, L2 = 5, L3 = 5, PT = L1 + L2 + L3;   // слои на рисунке завода утрированы: бетон, утеплитель, бетон
const NB = 7, PER = 5;                               // в стеллаже 7 пачек по 5 панелей дома
const FO = -100;                                     // завод сдвинут к дому: Алексино уже прежней модели
const PAD = [458 + FO, 782 + FO, -14, 214];
const slotY = s => 112 + (NB - 1 - s) * 14;
const RACK = s => [719 + FO, 769 + FO, slotY(s), slotY(s) + 10, GZ, GZ + 50];
const SX = [496, 558, 620, 682, 744].map(x => x + FO);   // посты: борт, бетон, утеплитель, бетон, выход
const SCENE = [...corners(HB), ...corners([PAD[0], PAD[1], PAD[2], PAD[3], GZ, GZ + 52]), ...corners([PLOT[0], PLOT[1], PLOT[2], PLOT[3], GZ, GZ])];
const HOUSE_PTS = corners(HB);
const MONT = MONT0.slice().sort((a, b) => depthAt(VW.sw, centre(b.b)) - depthAt(VW.sw, centre(a.b)));
const PSEQ = [...MONT, ...EDGE], PIDX = new Map(PSEQ.map((e, k) => [e, k]));

/* ---------- время ---------- */
const HOLD = 0.8;
// Прокрутка по отрезкам сюжета: [конец отрезка по p, доля]. Щелчок колеса около 100 px. Паузы, где ничего не движется, 0.
// Сохранённый вариант на 30 щелчков: backups/etapy-variants/saved-alexino-30. Здесь проект, фундамент с заводом и монтаж
// короче (Максим 26.10: «половина анимации на первые два пункта»), остальное как там. Доли — px из варианта на 2390 px
const SEGS_RAW_TOTAL = 2390;   // сумма долей варианта 1: от неё секунды шага, чтобы остальные этапы шли как были
const SEGS = ZK2 ? [
  [0.16, 250], [0.2, 100], [0.36, 350], [0.4, 0],
  [0.528, 250],    // монтаж: стены краном (вся доля этапа, что раньше была до закладных)
  [0.56, 120],     // завод уходит, разворот камеры
  [0.6, 0],
  [0.648, 178],    // перекрытие: сначала закладные рентгеном (тот же темп, что был на монтаже)
  [0.76, 390],     // плита: стойки, контур, сетка и бетон внахлёст
  [0.8, 0], [0.896, 360], [0.944, 150], [0.96, 30], [1, 120]
] : [
  [0.16, 250],     // проект: оси и дом чертежом
  [0.2, 100],      // камера сверху в изометрию
  [0.36, 350],     // фундамент контуром и бетоном, завод
  [0.4, 0],        // пауза
  [0.48, 250],     // монтаж: стены краном сверху почти разом
  [0.5, 120],      // завод уходит, камера подъезжает и разворачивается на юго-восток
  [0.56, 270],     // закладные рентгеном
  [0.6, 0],        // пауза
  [0.76, 390],     // плита перекрытия: стойки, контур, сетка и бетон внахлёст
  [0.8, 0],        // пауза
  [0.896, 360],    // окна и окантовка кровли разом
  [0.944, 150],    // мембрана
  [0.96, 30],      // фановая труба
  [1, 120]         // фасад
];
// весь блок 4000 px, около 40 щелчков (Максим 26.10 выбрал из 40 и 45); доли растягиваются пропорционально
const SEGS_SUM = SEGS.reduce((a, g) => a + g[1], 0); for (const g of SEGS) g[1] *= 4000 / SEGS_SUM;
const WARP = []; { let x = 0, a = 0; for (const g of SEGS) { WARP.push([a, g[0], x, x + g[1]]); x += g[1]; a = g[0]; } }
const SCROLL_PX = WARP[WARP.length - 1][3];
function storyP(q) {   // доля прокрутки → время сюжета
  const x = q * SCROLL_PX;
  for (const [a, b, x0, x1] of WARP) if (x1 > x0 && x <= x1) return lerp(a, b, (x - x0) / (x1 - x0));
  return 1;
}
const FLY = ease;
const stageT = (p, i) => ramp(i / ANIMATED, (i + HOLD) / ANIMATED, p);

/* ---------- кадр: что рисуем ---------- */
let ITEMS = [], GROUND = [], OVER = [];
let POST = null;   // правка всех тел кадра после сборки: прозрачность на рентгене
function item(b, o) { const it = Object.assign({ cb: b, mode: 'solid', a: 1, fillA: 1 }, o); ITEMS.push(it); return it; }
function prism(C, o) {
  const a = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9];
  for (const p of C) { a[0] = Math.min(a[0], p[0]); a[1] = Math.max(a[1], p[0]); a[2] = Math.min(a[2], p[1]); a[3] = Math.max(a[3], p[1]); a[4] = Math.min(a[4], p[2]); a[5] = Math.max(a[5], p[2]); }
  return item(a, Object.assign({ prism: C }, o));
}
const ground = g => GROUND.push(Object.assign({ color: GHOST, dash: false, a: 1, close: true }, g));
const line = (from, to, o = {}) => OVER.push(Object.assign({ from, to, color: INK, a: 1, dash: false }, o));
const over = (pts, o) => OVER.push(Object.assign({ pts, color: INK, a: 1, dash: false }, o));
const rectZ = (b, z) => [[b[0], b[2], z], [b[1], b[2], z], [b[1], b[3], z], [b[0], b[3], z]];
const boxPts = b => [[b[0], b[2], b[4]], [b[1], b[2], b[4]], [b[1], b[3], b[4]], [b[0], b[3], b[4]], [b[0], b[2], b[5]], [b[1], b[2], b[5]], [b[1], b[3], b[5]], [b[0], b[3], b[5]]];
function rotX(pts, hy, hz, ang) { const c = Math.cos(ang), s = Math.sin(ang); return pts.map(([x, y, z]) => { const dy = y - hy, dz = z - hz; return [x, hy + dy * c - dz * s, hz + dy * s + dz * c]; }); }
function discPts(p, r = 3, n = 16) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([p[0] + r * Math.cos(a), p[1] + r * Math.sin(a), p[2]]); } return o; }

let LIFT = 0;   // монтаж: доля волны стен. Пачки стеллажа кран поднимает вверх той же волной, а стены в это время опускаются на дом
function rack(stored, a) {   // стеллаж: пачки встают с завода, на монтаже улетают вверх и растворяются, первой сделанная последней
  for (let s = 0; s < NB; s++) {
    const al = clamp(stored - s, 0, 1), L = seq(LIFT, NB - 1 - s, NB, 0.6); if (al <= 0 || L >= 1) continue;
    const r = RACK(s), dz = 90 * ease(L) + 6 * (1 - ease(al));   // появляясь, пачка мягко оседает на место
    item([r[0], r[1], r[2], r[3], r[4] + dz, r[5] + dz], { a: a * al * (1 - ramp(0.4, 1, L)) });
  }
}
function gate(x, a, busy, pourZ) {
  item([x - 2, x + 2, 9, 12, GZ, GZ + 44], { a }); item([x - 2, x + 2, 84, 87, GZ, GZ + 44], { a });
  item([x - 3, x + 3, 9, 87, GZ + 44, GZ + 48], { a });
  if (pourZ !== null) { item([x - 6, x + 6, 38, 58, GZ + 30, GZ + 44], { a }); if (busy) line([x, 48, GZ + 30], [x, 48, pourZ], { a }); }
}
function factory(f, A) {   // один поддон едет по линии ровно, без остановок, у каждого поста панель прибавляет слой.
  // На выходе встаёт и одним плавным движением уезжает в дальний слот стеллажа, следом стеллаж добирает остальные пачки.
  // Поддон и панель одинарными линиями: одна плоскость и одна коробка, без бортов, плит утеплителя и точек (Максим 26.10)
  item([464 + FO, 778 + FO, 18, 21, GZ, GZ + 3], { a: A }); item([464 + FO, 778 + FO, 75, 78, GZ, GZ + 3], { a: A });
  const x = lerp(SX[0], SX[4], ease(ramp(0, 0.6, f))), pos = (x - SX[0]) / (SX[1] - SX[0]);   // pos: 0 у борта, 4 на выходе
  const b1 = ramp(0.7, 1.3, pos), b2 = ramp(1.7, 2.3, pos), b3 = ramp(2.7, 3.3, pos), h = L1 * b1 + L2 * b2 + L3 * b3;
  gate(SX[0], A, false, null); gate(SX[1], A, b1 > 0 && b1 < 1, GZ + 3 + h); gate(SX[2], A, false, null); gate(SX[3], A, b3 > 0 && b3 < 1, GZ + 3 + h);
  const k = ramp(0.6, 0.85, f), fill = ramp(0.85, 1, f);
  if (f > 0) item([x - 29, x + 29, 20, 76, GZ + 3, GZ + 3], { a: A, top: true });   // поддон: плоскость без толщины, шире панели на 4 с боков, чтобы линии не слипались
  if (f > 0 && k <= 0) item([x - 25, x + 25, 23, 73, GZ + 3, GZ + 3 + h], { a: A, top: h < 0.01 });   // панель одной коробкой
  else if (k > 0 && k < 1) {   // встаёт и едет в слот: поворот и переезд внахлёст, к концу толщина как у пачки, подмены не видно
    const th = lerp(PT, 10, ease(ramp(0.3, 1, k))), m = ease(ramp(0.25, 1, k));
    const C = rotX(boxPts([x - 25, x + 25, 23, 73, GZ + 3, GZ + 3 + th]), 73, GZ + 3, -Math.PI / 2 * ease(ramp(0, 0.6, k)));
    prism(C.map(q => [q[0], q[1] + (slotY(0) - 73) * m, q[2] - 3 * m]), { a: A });
  }
  rack(f >= 1 ? NB : (k >= 1 ? 1 : 0) + (NB - 1) * fill, A);   // панель стала первой пачкой, остальные появляются по очереди
}

/* ---------- этап «Проект фундамента и панелей»: оси и дом чертежом ---------- */
// По осям 1–4 и А–Г из IFC пунктиром проступает весь дом снизу вверх по кадру: фундамент, панели с проёмами, плиты, парапеты
const AXN = Object.values(HS.axes).map(l => ({ a: [l[0][0] * SC, l[0][1] * SC], b: [l[1][0] * SC, l[1][1] * SC] }));
let SCAN = [0, 0];   // низ и верх дома на экране, для проявления чертежа
function project(t, fade) {
  const a = 1 - fade, k = ramp(0, 0.4, t);
  AXN.forEach((x, i) => {
    const w = seq(k, i, AXN.length, 0.3); if (w <= 0) return;
    ground({ pts: [[x.b[0], x.b[1], GZ], [x.a[0], x.a[1], GZ]], close: false, dash: true, part: ease(w), a });
    if (w >= 1) { const dx = x.a[0] - x.b[0], dy = x.a[1] - x.b[1], L = Math.hypot(dx, dy); ground({ pts: discPts([x.a[0] + dx / L * 6, x.a[1] + dy / L * 6, GZ], 6, 20), a }); }   // кружок оси
  });
  const sy = ease(ramp(0.3, 1, t)); if (sy <= 0) return;
  const o = { mode: 'ghost', fillA: 0, a, scan: lerp(SCAN[0], SCAN[1], sy) };
  for (const e of els) item(e.b, Object.assign({ e: e.kind === 'panel' ? e : null }, o));
}

/* ---------- фундамент: опалубка по контуру, сетка, бетон идёт фронтом через всю плиту, опалубку снимают ---------- */
const FOUT = outline(FOUND.map(e => e.b));
// фронт бетона — прямая x = s поперёк дома, от западного края к восточному, как ложится мембрана кровли (Максим 28.10: «не из
// угла, а от одного края, ровным слоем»). Было по диагонали x + y = s, из угла
const sweepRange = rs => { let a = 1e9, b = -1e9; for (const r of rs) { a = Math.min(a, r[0]); b = Math.max(b, r[1]); } return [a - 2, b + 2]; };
function boards(sides, z0, z1, a) {   // борта опалубки снаружи контура
  for (const { a: p, b: q, n } of sides) {
    const x0 = Math.min(p[0], q[0]), x1 = Math.max(p[0], q[0]), y0 = Math.min(p[1], q[1]), y1 = Math.max(p[1], q[1]);
    if (n[1]) item([x0 - 4, x1 + 4, n[1] < 0 ? y0 - 4 : y0, n[1] < 0 ? y0 : y0 + 4, z0, z1], { a });
    else item([n[0] < 0 ? x0 - 4 : x0, n[0] < 0 ? x0 : x0 + 4, y0, y1, z0, z1], { a });
  }
}
function meshOn(rects, z, k, front) {   // сетка через 16: прутки вдоль и поперёк растут одновременно, у плиты один путь
  if (k <= 0) return;
  const f = ease(k);
  for (const r of rects) {
    const segs = [];
    for (let y = Math.ceil((r[2] - 8) / 16) * 16 + 8; y < r[3]; y += 16) segs.push([[r[0], y, z], [lerp(r[0], r[1], f), y, z]]);
    for (let x = Math.ceil((r[0] - 8) / 16) * 16 + 8; x < r[1]; x += 16) segs.push([[x, r[2], z], [x, lerp(r[2], r[3], f), z]]);
    if (segs.length) item([r[0], r[1], r[2], r[3], z, z], { a: 1, draw: drawMesh, segs, front });
  }
}
function frontLine(rects, s, z) { for (const r of rects) if (s > r[0] && s < r[1]) line([s, r[2], z], [s, r[3], z]); }
function foundation(t) {   // появляется контур и сразу идёт бетон фронтом, без бортов и сетки; после заливки контур растворяется
  const tr = ramp(0, 0.3, t), rs = FOUND.map(e => e.b), pw = ramp(0.15, 0.9, t), [s0, s1] = sweepRange(rs), s = lerp(s0, s1, ease(pw));
  const ca = 1 - ramp(0.9, 1, t);   // после заливки контур растворяется
  if (tr > 0 && ca > 0) for (const l of FOUT.loops) ground({ pts: l.map(p => [p[0], p[1], GZ]), color: INK, part: tr, a: ca });
  if (pw > 0) {
    for (const e of [...FOUND, ...FLOOR]) { e.s.on = true; if (pw < 1) e.s.cut = s; }
    if (pw < 1) frontLine(FLOOR.map(e => e.b), s, 0);
  }
}

/* ---------- этап «Перекрытие»: две монолитные плиты на разных высотах и рёбра перепада ---------- */
// Под навес над террасой ставят стойки и щит, сетка, бетон идёт фронтом, стойки снимают. Бортов по краю плит нет:
// окантовка крыши появляется один раз, парапетами на окнах и кровле (Максим 26.10)
// В конце видны закладные внутри коробки
const LOUT = outline(LOW.map(e => e.b)), HOUT = outline(HIGH.map(e => e.b));
const ROOF_RS = [...LOW, ...HIGH].map(e => e.b);
const PROPS = []; for (const y of [20, 64, 108, 152, 196]) PROPS.push([295, y]);
function slab(t) {
  const st = ramp(0, 0.2, t) * (1 - ramp(0.88, 1, t));   // стойки и щит под навесом
  if (st > 0) { for (const [x, y] of PROPS) item([x - 1, x + 1, y - 1, y + 1, GZ, 66], { a: st }); item([288, 301.2, 8.8, 217.4, 66, 68], { a: st }); }
  const tr = ramp(0, 0.3, t), m = ramp(0.05, 0.5, t), pw = ramp(0.25, 0.85, t), [s0, s1] = sweepRange(ROOF_RS), s = lerp(s0, s1, ease(pw));   // внахлёст
  // контур плиты держим до конца заливки: бортов нет, и без него сетка у края висит обрывками; потом он растворяется
  const ca = 1 - ramp(0.85, 1, t);   // после заливки контур растворяется, а не пропадает разом
  if (tr > 0 && ca > 0) { for (const l of LOUT.loops) ground({ pts: l.map(p => [p[0], p[1], 68]), color: INK, part: tr, a: ca }); for (const l of HOUT.loops) ground({ pts: l.map(p => [p[0], p[1], 78]), color: INK, part: tr, a: ca }); }
  if (m > 0 && pw < 1) { meshOn(LOW.map(e => e.b), 62.5, m, pw > 0 ? s : null); meshOn(HIGH.map(e => e.b), 72.5, m, pw > 0 ? s : null); }
  if (pw > 0) {
    for (const e of ROOF) { e.s.on = true; if (pw < 1) e.s.cut = s; }
    if (pw < 1) { frontLine(LOW.map(e => e.b), s, 62); frontLine(HIGH.map(e => e.b), s, 72); }
  }
}

/* ---------- закладные под коммуникации (вариант З2), в конце перекрытия: коробка становится пунктиром, как схема сетей ---------- */
// Канализация и вода выходят через фундамент с запада, кабель с юга, выпуски с заглушками. Трассы условные: плана сетей нет
const dist3 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
const len3 = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += dist3(pts[i - 1], pts[i]); return L; };
function cut3(pts, f) {
  if (f >= 1) return pts;
  let need = len3(pts) * f; const out = [pts[0]];
  for (let i = 1; i < pts.length && need > 0; i++) {
    const a = pts[i - 1], b = pts[i], d = dist3(a, b);
    if (d <= need) { out.push(b); need -= d; } else { const k = need / d; out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]); need = 0; }
  }
  return out;
}
function along(pts, q) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist3(pts[i - 1], pts[i]), e = dist3(pts[i - 1], q);
    if (Math.abs(e + dist3(q, pts[i]) - d) < 1e-6) return (s + e) / len3(pts);
    s += d;
  }
  return 1;
}
function net(list, w, pts, t0, dur, end) { const n = { w, pts, t: [t0, t0 + dur], end }; list.push(n); return n; }
function branch(list, from, pts, dur, end) { return net(list, from.w, pts, lerp(from.t[0], from.t[1], along(from.pts, pts[0])), dur, end); }
function norm(list) { const m = Math.max(...list.map(n => n.t[1])); for (const n of list) n.t = [n.t[0] / m, n.t[1] / m]; }
const NETS = [], BOARD = [32, 48, 0, 4, 30, 50], FAN = [100, 150];   // щит на южной стене, фановая труба через низкую кровлю
let INP_T = 0;
{
  const sew = net(NETS, 2.4, [[-2.8, 150, -6.4], [8, 150, -6.4], [8, 150, 1], [100, 150, 1]], 0.06, 0.2);
  branch(NETS, sew, [[60, 150, 1], [60, 232, 1], [60, 232, 8]], 0.08, 'dot');
  net(NETS, 2.4, [[100, 150, 1], [230, 150, 1], [230, 150, 8]], sew.t[1], 0.16, 'dot');
  net(NETS, 2.4, [[100, 150, 1], [100, 150, 58]], sew.t[1], 0.12);   // стояк к кровле
  const wat = net(NETS, 1.6, [[-2.8, 130, -6.4], [8, 130, -6.4], [8, 130, 1], [110, 130, 1]], 0.09, 0.2);
  branch(NETS, wat, [[70, 130, 1], [70, 222, 1], [70, 222, 14]], 0.08, 'dot');
  net(NETS, 1.6, [[110, 130, 1], [220, 130, 1], [220, 130, 14]], wat.t[1], 0.14, 'dot');
  const inp = net(NETS, 1, [[40, -6.4, -5], [40, 2, -5], [40, 2, 30]], 0.04, 0.1);
  const r1 = net(NETS, 1, [[40, 2, 50], [40, 2, 56], [116, 2, 56], [116, 282, 56], [4, 282, 56], [4, 2, 56], [40, 2, 56]], inp.t[1] + 0.03, 0.36);
  for (const [x, y, s] of [[80, 2, 'y'], [4, 60, 'x'], [4, 230, 'x'], [60, 282, 'y'], [116, 240, 'x']]) branch(NETS, r1, [[x, y, 56], [x, y, 14]], 0.05, s);
  const link = branch(NETS, r1, [[116, 100, 56], [126, 100, 56]], 0.03);
  const r2 = net(NETS, 1, [[126, 100, 56], [126, 34, 56], [276, 34, 56], [276, 192, 56], [126, 192, 56], [126, 100, 56]], link.t[1], 0.3);
  for (const [x, y, s] of [[200, 34, 'y'], [276, 120, 'x'], [200, 192, 'y'], [126, 160, 'x']]) branch(NETS, r2, [[x, y, 56], [x, y, 14]], 0.05, s);
  norm(NETS); INP_T = inp.t[1];
}
function sockPts(p, s, r = 2.6) {
  const [x, y, z] = p;
  return s === 'x' ? [[x, y - r, z - r], [x, y + r, z - r], [x, y + r, z + r], [x, y - r, z + r]] : [[x - r, y, z - r], [x + r, y, z - r], [x + r, y, z + r], [x - r, y, z + r]];
}
function lay(list, f) {
  const lines = [], marks = [];
  for (const n of list) {
    const k = ramp(n.t[0], n.t[1], f); if (k <= 0) continue;
    lines.push({ pts: cut3(n.pts, ease(k)), w: n.w });
    if (k >= 1 && n.end) { const p = n.pts[n.pts.length - 1]; marks.push({ p, pts: n.end === 'dot' ? discPts(p) : sockPts(p, n.end) }); }
  }
  return { lines, marks };
}
function stubs(k) {   // выпуски из фундамента с заглушками: канализация и вода с запада, кабель с юга
  if (k <= 0) return;
  const e = ease(k), zc = -6.4;
  for (const [y, r, L] of [[150, 3, 10], [130, 1.6, 8]]) {
    const x = -2.8 - L * e;
    item([x, -2.8, y - r, y + r, zc - r, zc + r], { util: true });
    item([x - 1.2, x, y - r - 0.6, y + r + 0.6, zc - r - 0.6, zc + r + 0.6], { util: true });
  }
  const y = -6.4 - 8 * e;
  item([38.4, 41.6, y, -6.4, -6.6, -3.4], { util: true }); item([37.8, 42.2, y - 1.2, y, -7.2, -2.8], { util: true });
}
function fanPipe(k) {   // фановая труба над низкой кровлей
  if (k <= 0) return;
  const z = 62 + 14 * ease(k);
  item([FAN[0] - 3, FAN[0] + 3, FAN[1] - 3, FAN[1] + 3, 62, z], { util: true });
  if (k >= 1) item([FAN[0] - 4.5, FAN[0] + 4.5, FAN[1] - 4.5, FAN[1] + 4.5, z, z + 1.6], { util: true });
}
function zaklXray(t, back = 0) {
  const g = ramp(0, 0.35, t) * (1 - back), na = 1 - back;   // Максим 30.10: наплыв 0,33 с туда и 0,65 с обратно (было 0,13 и 0,26 с)
  // наплыв, а не переключение (Максим 30.10: «стены появляются резко — пк-пк-пк»): тело рисуется целым × (1 − g) и схемой × g
  if (g > 0) { const gg = ease(g); POST = it => { if (it.util) return; it.ghost = gg; }; }
  const f = ramp(0.1, 0.97, t);
  stubs(ramp(0, 0.08, f));
  if (na > 0) {
    const { lines, marks } = lay(NETS, f);
    for (const l of lines) over(l.pts, { w: l.w, a: na });
    const ba = ramp(INP_T - 0.03, INP_T, f) * na;
    if (ba > 0) for (const F of [FACE.top(BOARD), FACE.front(BOARD), FACE.side(BOARD)]) over(F, { close: true, fill: true, a: ba });
    for (const m of marks) over(m.pts, { close: true, fill: true, a: na });
  }
}

/* ---------- этап «Окна и кровля»: окна подлетают к проёмам, встают парапеты, по плитам раскатывается мембрана ---------- */
function flyWindow(w, k) {   // окно подлетает к проёму с улицы по пунктиру
  const out = 46 * (1 - FLY(k)) * (w.pan ? w.pan.ext : 1), off = w.ax === 'x' ? [out, 0, 0] : [0, out, 0];
  const sh = b => [b[0] + off[0], b[1] + off[0], b[2] + off[1], b[3] + off[1], b[4], b[5]];
  item(sh(w.b), { w, cur: sh(w.b), inner: sh(w.ib), target: w.b, a: ramp(0, 0.15, k), draw: drawWinFly });
}
// мембрана внутри парапетов: по наружному краю плиты отступаем, чтобы не зайти под парапет
function membraneRects(parts, out) {
  const onEdge = (x0, y0, x1, y1) => out.sides.some(({ a, b }) => Math.abs(a[0] - b[0]) < EPS ? Math.abs(x0 - a[0]) < EPS && Math.abs(x1 - a[0]) < EPS && Math.max(y0, Math.min(a[1], b[1])) < Math.min(y1, Math.max(a[1], b[1])) : Math.abs(y0 - a[1]) < EPS && Math.abs(y1 - a[1]) < EPS && Math.max(x0, Math.min(a[0], b[0])) < Math.min(x1, Math.max(a[0], b[0])));
  return parts.map(e => {
    const r = e.b.slice(0, 4), d = 3.6;
    return [onEdge(r[0], r[2], r[0], r[3]) ? r[0] + d : r[0], onEdge(r[1], r[2], r[1], r[3]) ? r[1] - d : r[1], onEdge(r[0], r[2], r[1], r[2]) ? r[2] + d : r[2], onEdge(r[0], r[3], r[1], r[3]) ? r[3] - d : r[3], e.b[5] + 0.3];
  });
}
const MEMB = [...membraneRects(LOW, LOUT), ...membraneRects(HIGH, HOUT)];

/* ---------- сюжет ---------- */
function state(p) {
  const t1 = stageT(p, 0), t2 = stageT(p, 1), t3r = stageT(p, 2), t4r = stageT(p, 3), t5 = stageT(p, 4);
  // ?zk=2: монтаж без закладных — его прежняя доля 0…0,625 растянута на весь этап; перекрытие: закладные 0…0,3, плита 0,3…1
  const t3 = ZK2 ? t3r * 0.625 : t3r, xr = ZK2 ? ramp(0, 0.3, t4r) : ramp(0.625, 1, t3r), t4 = ZK2 ? ramp(0.3, 1, t4r) : t4r;
  setView(viewAt(p));
  CAM = mixCam(fitCam(SCENE, FIT), fitCam(HOUSE_PTS, FIT_H), ease(ramp(0.5, 0.625, t3)));   // встали стены: камера подъезжает к дому и разворачивается
  { let a = 1e9, b = -1e9; for (const q of HOUSE_PTS) { const y = P(q[0], q[1], q[2])[1]; a = Math.min(a, y); b = Math.max(b, y); } SCAN = [b + 2, a - 2]; }
  const facA = 1 - ramp(0.45, 0.6, t3);
  const fade = ramp(0, 0.2, t2);   // чертёж гаснет, когда начинают фундамент
  if (t1 > 0 && fade < 1) project(t1, fade);
  foundation(t2);   // фундамент и завод идут одновременно, весь этап
  LIFT = ramp(0, 0.5, t3);
  MONT.forEach((e, k) => { e.u = seq(LIFT, k, MONT.length, 0.6); });   // стены краном сверху почти разом
  const roofK = ramp(0, 0.6, t5);   // окна и окантовка кровли встают одновременно
  EDGE.forEach((e, k) => { e.u = seq(roofK, k, EDGE.length, 0.6); });   // окантовка почти разом, от дальних
  if (facA > 0) {
    ground({ pts: rectZ(PAD, GZ), dash: true, a: facA });
    ground({ pts: rectZ(PLOT, GZ), dash: true, a: facA });
    factory(ramp(0.04, 0.96, t2), facA);
  }
  for (const e of PSEQ) {   // стены и окантовку опускают краном сверху на место
    const u = e.u; if (u <= 0) continue;
    const s = e.s; s.on = true;
    if (u < 1) { s.off = [0, 0, (EDGES.has(e) ? 40 : 70) * (1 - FLY(u))]; s.a = ramp(0, 0.3, u); }
  }
  if (xr > 0) zaklXray(xr, ramp(0, 0.3, t4));   // закладные, когда встали стены (вариант 2 — в начале перекрытия); схема уходит с плитой
  if (t4 > 0) slab(t4);
  WSEQ.forEach((w, k) => {
    const kk = seq(roofK, k, WSEQ.length, 0.6);
    w.done = kk >= 1; if (kk > 0 && kk < 1) flyWindow(w, kk);
  });
  const mb = ramp(0.6, 0.9, t5);
  if (mb > 0) for (const r of MEMB) item([r[0], lerp(r[0] + 0.6, r[1], ease(mb)), r[2], r[3], r[4], r[4]], { top: true });
  fanPipe(ramp(0.9, 1, t5));
}

/* ---------- геометрия экрана ---------- */
function hull(pts) {
  const Q = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (Q.length < 3) return Q;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of Q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = Q.length - 1; i >= 0; i--) { const p = Q[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
}
function overlap(A, B, tol = 0.5) {
  for (const poly of [A, B]) for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], nx = b[1] - a[1], ny = a[0] - b[0], L = Math.hypot(nx, ny);
    if (L < 1e-9) continue;
    let p0 = 1e18, p1 = -1e18, q0 = 1e18, q1 = -1e18;
    for (const p of A) { const d = (p[0] * nx + p[1] * ny) / L; if (d < p0) p0 = d; if (d > p1) p1 = d; }
    for (const q of B) { const d = (q[0] * nx + q[1] * ny) / L; if (d < q0) q0 = d; if (d > q1) q1 = d; }
    if (p1 < q0 + tol || q1 < p0 + tol) return false;
  }
  return true;
}
function rel(A, B) {   // -1: A дальше и рисуется раньше, 1: B раньше, 0: не ясно. Дальше значит дальше по направлению взгляда
  let r = 0;
  const vote = v => { if (!v || r === 2) return; r = r && r !== v ? 2 : v; };
  if (Math.abs(FX) > 1e-3) vote(A[0] >= B[1] - EPS ? (FX > 0 ? -1 : 1) : B[0] >= A[1] - EPS ? (FX > 0 ? 1 : -1) : 0);
  if (Math.abs(FY) > 1e-3) vote(A[2] >= B[3] - EPS ? (FY > 0 ? -1 : 1) : B[2] >= A[3] - EPS ? (FY > 0 ? 1 : -1) : 0);
  if (SE > 1e-3) vote(A[5] <= B[4] + EPS ? -1 : B[5] <= A[4] + EPS ? 1 : 0);
  return r === 2 ? 0 : r;
}
function order(items) {
  const n = items.length;
  const hp = items.map(e => hull(corners(e.cb).map(q => P(q[0], q[1], q[2]))));
  const bb = hp.map(h => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of h) { a = Math.min(a, p[0]); c = Math.max(c, p[0]); b = Math.min(b, p[1]); d = Math.max(d, p[1]); } return [a, b, c, d]; });
  const adj = items.map(() => []), indeg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = bb[i], c = bb[j];
    if (a[2] <= c[0] || c[2] <= a[0] || a[3] <= c[1] || c[3] <= a[1]) continue;
    if (!overlap(hp[i], hp[j])) continue;
    const r = rel(items[i].cb, items[j].cb);
    if (r < 0) { adj[i].push(j); indeg[j]++; } else if (r > 0) { adj[j].push(i); indeg[i]++; }
  }
  const depth = items.map(e => { const b = e.cb; return CE * (FX * (b[0] + b[1]) + FY * (b[2] + b[3])) / 2 - SE * (b[4] + b[5]) / 2; });
  const out = [], used = new Array(n).fill(false);
  let ready = []; for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
  while (out.length < n) {
    if (!ready.length) { let best = -1; for (let i = 0; i < n; i++) if (!used[i] && (best < 0 || indeg[i] < indeg[best] || (indeg[i] === indeg[best] && depth[i] > depth[best]))) best = i; ready.push(best); }
    ready.sort((p, q) => depth[q] - depth[p]);
    const i = ready.shift(); if (used[i]) continue; used[i] = true; out.push(items[i]);
    for (const j of adj[i]) if (!used[j] && --indeg[j] === 0) ready.push(j);
  }
  return out;
}

/* ---------- рисование ---------- */
// видимые грани коробки зависят от стороны, с которой смотрим
const xf = b => FX > 0 ? b[0] : b[1], yf = b => FY > 0 ? b[2] : b[3];
const FACE = {
  top: b => [[b[0], b[2], b[5]], [b[1], b[2], b[5]], [b[1], b[3], b[5]], [b[0], b[3], b[5]]],
  front: b => { const y = yf(b); return [[b[0], y, b[4]], [b[1], y, b[4]], [b[1], y, b[5]], [b[0], y, b[5]]]; },
  side: b => { const x = xf(b); return [[x, b[2], b[4]], [x, b[3], b[4]], [x, b[3], b[5]], [x, b[2], b[5]]]; }
};
const PFACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
function path(pts, close = true) { const q = pts.map(v => P(v[0], v[1], v[2])); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]); if (close) ctx.closePath(); }
function seg(a, b) { const p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
function part(pts, f, close = true) {
  const Q = close ? pts.concat([pts[0]]) : pts;
  if (f >= 0.999) return Q;
  let L = 0; for (let i = 1; i < Q.length; i++) L += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]);
  let need = L * f; const out = [Q[0]];
  for (let i = 1; i < Q.length && need > 0; i++) {
    const d = Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]);
    if (d <= need) { out.push(Q[i]); need -= d; } else { const t = need / d; out.push([Q[i - 1][0] + (Q[i][0] - Q[i - 1][0]) * t, Q[i - 1][1] + (Q[i][1] - Q[i - 1][1]) * t]); need = 0; }
  }
  return out;
}
const cur = e => { const b = e.b, o = e.s.off; return [b[0] + o[0], b[1] + o[0], b[2] + o[1], b[3] + o[1], b[4] + o[2], b[5] + o[2]]; };
function clipHalf(s, z, ahead) {   // полуплоскость x ≤ s (залито) или ≥ s (впереди фронта) на высоте z
  const L = 3000, A = P(s, -L, z), B = P(s, L, z), C = ahead ? P(s + L, 0, z) : P(s - L, 0, z);
  const vx = C[0] - (A[0] + B[0]) / 2, vy = C[1] - (A[1] + B[1]) / 2;
  ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B[0] + vx, B[1] + vy); ctx.lineTo(A[0] + vx, A[1] + vy); ctx.closePath(); ctx.clip();
}
const add3 = (a, n) => [a[0] + n[0], a[1] + n[1], a[2] + n[2]];
function fillStroke(pts, fa, a) { ctx.beginPath(); path(pts); ctx.globalAlpha = fa; ctx.fill(); ctx.globalAlpha = a; ctx.stroke(); }
function rectOn(ax, plane, r) {   // прямоугольник в плоскости стены: r = [вдоль0, вдоль1, низ, верх]
  return ax === 'x' ? [[plane, r[0], r[2]], [plane, r[1], r[2]], [plane, r[1], r[3]], [plane, r[0], r[3]]] : [[r[0], plane, r[2]], [r[1], plane, r[2]], [r[1], plane, r[3]], [r[0], plane, r[3]]];
}
function drawOpenings(e, b, it) {   // проёмы на видимой грани панели: откосы и окно видны только в границах проёма
  const ax = e.ax, plane = ax === 'x' ? xf(b) : yf(b), th = ax === 'x' ? b[1] - b[0] : b[3] - b[2];
  const into = ax === 'x' ? [FX > 0 ? th : -th, 0, 0] : [0, FY > 0 ? th : -th, 0];
  const dx = b[0] - e.b[0], dy = b[2] - e.b[2], dz = b[4] - e.b[4], dt = ax === 'x' ? dy : dx;
  const jambHi = ax === 'x' ? FY > 0 : FX > 0;   // какой откос смотрит на нас
  const fa = it.a * it.fillA, col = it.mode === 'solid' ? INK : GHOST;
  for (const o of e.ops) {
    const R = rectOn(ax, plane, [o[0] + dt, o[1] + dt, o[2] + dz, o[3] + dz]);
    ctx.save(); ctx.beginPath(); path(R); ctx.clip();
    ctx.fillStyle = CELL; ctx.beginPath(); path(R); ctx.globalAlpha = fa; ctx.fill(); ctx.globalAlpha = it.a;
    if (SE > 0.02) fillStroke([R[0], R[1], add3(R[1], into), add3(R[0], into)], fa, it.a);   // подоконник
    fillStroke(jambHi ? [R[1], R[2], add3(R[2], into), add3(R[1], into)] : [R[0], R[3], add3(R[3], into), add3(R[0], into)], fa, it.a);
    for (const w of e.rings) if (w.done) {   // окно в проёме: рама и стекло
      const wb = w.b, ib = w.ib, wp = ax === 'x' ? xf(wb) + dx : yf(wb) + dy;
      ctx.strokeStyle = col; ctx.beginPath();
      path(rectOn(ax, wp, ax === 'x' ? [wb[2] + dy, wb[3] + dy, wb[4] + dz, wb[5] + dz] : [wb[0] + dx, wb[1] + dx, wb[4] + dz, wb[5] + dz]));
      path(rectOn(ax, wp, ax === 'x' ? [ib[2] + dy, ib[3] + dy, ib[4] + dz, ib[5] + dz] : [ib[0] + dx, ib[1] + dx, ib[4] + dz, ib[5] + dz]));
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); path(R); ctx.stroke();
  }
}
// окно на подлёте (Максим 28.10: «очень чёрные, как будто не отсюда»): прозрачное — без заливки и без штриховки стекла;
// рама одной плоскостью, наружный и внутренний контур, линия тоньше линий дома (WIN_LW); пунктир к проёму как был
const WIN_LW = 0.6;
function drawWinFly(it) {
  const w = it.w, b = it.cur, ib = it.inner, t = it.target, ax = w.ax;
  ctx.save(); ctx.globalAlpha = it.a; ctx.lineWidth = LW * WIN_LW;
  ctx.setLineDash(DASH); ctx.strokeStyle = GHOST; ctx.beginPath();
  for (const [x, y, z] of [[t[0], t[2], t[4]], [t[1], t[3], t[4]]]) seg([x, y, z], [x + b[0] - t[0], y + b[2] - t[2], z]);
  ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = INK;
  const plane = ax === 'x' ? xf(b) : yf(b);
  const O = ax === 'x' ? [b[2], b[3], b[4], b[5]] : [b[0], b[1], b[4], b[5]], r = ax === 'x' ? [ib[2], ib[3], ib[4], ib[5]] : [ib[0], ib[1], ib[4], ib[5]];
  ctx.beginPath(); path(rectOn(ax, plane, O)); path(rectOn(ax, plane, r)); ctx.stroke();
  ctx.restore();
}
function drawMesh(it) {   // прутки сетки одним путём, видны только впереди фронта бетона
  ctx.save(); ctx.globalAlpha = it.a; ctx.strokeStyle = GHOST; ctx.setLineDash([]); ctx.lineWidth = LW;
  if (it.front != null) clipHalf(it.front, it.segs[0][0][2], true);
  ctx.beginPath(); for (const [a, b] of it.segs) seg(a, b); ctx.stroke(); ctx.restore();
}
function drawDots(b, [nx, ny, a]) {
  ctx.fillStyle = INK; ctx.globalAlpha *= a;
  const r = 0.8 / U;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const q = P(lerp(b[0], b[1], (i + 0.5) / nx), lerp(b[2], b[3], (j + 0.5) / ny), b[5]);
    ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill();
  }
}
function drawItem(it) {
  if (it.draw) { it.draw(it); return; }
  if (it.ghost > 0) {   // рентген закладных: целое тело гаснет, схема (пунктир, без заливки) проступает — и обратно
    const g = it.ghost;
    if (g < 1) drawItem(Object.assign({}, it, { ghost: 0, a: it.a * (1 - g) }));
    drawItem(Object.assign({}, it, { ghost: 0, mode: 'ghost', fillA: 0, a: it.a * g }));
    return;
  }
  const col = it.mode === 'solid' ? INK : GHOST;
  ctx.save();
  if (it.cut != null) clipHalf(it.cut, it.cb[5], false);
  if (it.scan != null) { ctx.beginPath(); ctx.rect(-1e4, it.scan, 3e4, 3e4); ctx.clip(); }
  ctx.lineWidth = LW; ctx.setLineDash(it.mode === 'ghost' ? DASH : []); ctx.strokeStyle = col; ctx.fillStyle = CELL; ctx.globalAlpha = it.a;
  if (it.prism) {
    const C = it.prism, cen = C.reduce((a, p) => [a[0] + p[0] / 8, a[1] + p[1] / 8, a[2] + p[2] / 8], [0, 0, 0]);
    for (const f of PFACES) {
      const q = f.map(i => C[i]), fc = q.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]);
      if (-(fc[0] - cen[0]) * FX * CE - (fc[1] - cen[1]) * FY * CE + (fc[2] - cen[2]) * SE <= 1e-6) continue;   // грань смотрит от нас
      fillStroke(q, it.a * it.fillA, it.a);
    }
  } else {
    const faces = it.top ? ['top'] : ['top', 'front', 'side'];
    for (const f of faces) fillStroke(FACE[f](it.cb), it.a * it.fillA, it.a);
  }
  if (it.e && it.e.ops && it.e.ops.length) drawOpenings(it.e, it.cb, it);
  if (it.dots) drawDots(it.cb, it.dots);
  ctx.restore();
}
function drawGround() {
  for (const g of GROUND) {
    if (g.a <= 0.001) continue;
    const scr = g.pts.map(q => P(q[0], q[1], q[2]));
    const pp = g.part !== undefined ? part(scr, g.part, g.close) : (g.close ? scr.concat([scr[0]]) : scr);
    ctx.globalAlpha = g.a; ctx.strokeStyle = g.color; ctx.setLineDash(g.dash ? DASH : []);
    ctx.beginPath(); ctx.moveTo(pp[0][0], pp[0][1]); for (let i = 1; i < pp.length; i++) ctx.lineTo(pp[i][0], pp[i][1]); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}
function drawOver() {
  for (const l of OVER) {
    if (l.a <= 0.001) continue;
    ctx.globalAlpha = l.a; ctx.strokeStyle = l.color; ctx.setLineDash(l.dash ? DASH : []); ctx.lineWidth = LW * (l.w || 1);
    ctx.beginPath(); if (l.pts) path(l.pts, !!l.close); else seg(l.from, l.to);
    if (l.fill) { ctx.fillStyle = CELL; ctx.fill(); }
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.lineWidth = LW;
}

let P_now = 0, dirty = true;
function render() {
  dirty = false;
  const p = RM ? Math.min(1, (Math.min(ANIMATED - 1, Math.floor(P_now * ANIMATED)) + HOLD + 0.01) / ANIMATED) : P_now;
  ITEMS = []; GROUND = []; OVER = []; POST = null;
  for (const e of els) e.s = { on: false, mode: 'solid', a: 1, fillA: 1, off: [0, 0, 0], cut: null };
  state(p);
  for (const e of els) if (e.s.on && e.s.a > 0.001) item(cur(e), { e: e.kind === 'panel' ? e : null, mode: e.s.mode, a: e.s.a, fillA: e.s.fillA, cut: e.s.cut });
  if (POST) for (const it of ITEMS) POST(it);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = CELL; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(U * DPR, 0, 0, U * DPR, 0, 0);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = LW;
  drawGround();
  for (const it of order(ITEMS)) drawItem(it);
  drawOver();
  syncRows(P_now);
}
function setP(p) { if (p !== P_now) { P_now = p; dirty = true; } }

function sizeAll() {   // site: 1em = 16 px of the layout, the cell is 720 x 521 of them; narrower on a phone
  const cell = cv.parentElement;
  U = parseFloat(getComputedStyle(cell).fontSize) / 16;
  CELL_W = cell.clientWidth / U; CELL_H = cell.clientHeight / U;
  const wide = CELL_W >= 700;
  FIT = wide ? [36, 33, CELL_W - 72, 460] : [12, 12, CELL_W - 24, CELL_H - 24];
  FIT_H = wide ? [(CELL_W - 542) / 2, 33, 542, 460] : FIT;
  document.documentElement.style.setProperty('--u', U.toFixed(4) + 'px');
  DPR = Math.min(2, window.devicePixelRatio || 1);
  LW = 1 / U; DASH = [3 / U, 3 / U];
  const w = Math.round(CELL_W * U * DPR), h = Math.round(CELL_H * U * DPR);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  layoutRuler();
  measureNames();
  dirty = true;
}

/* ---------- одна прокрутка — вся стройка ---------- */
// Максим 28.10: «чтобы одним скроллом она проходила», блок стоит на экране, страница не едет. Одна прокрутка колеса
// вниз, свайп или клавиша — стройка проходит сама до конца, вверх — сама обратно к началу; пока идёт, колесо её не
// перебивает. Сюжет идёт по тем же отрезкам SEGS, что прокрутка 4000 px: доля отрезка во времени та же, что была в px,
// паузы по-прежнему 0. Ход ровный, с мягким разгоном и остановкой
// Максим 28.10, вечер: «скролл на каждый этап, можно чуть подускорить». Одна прокрутка — один этап: проект,
// фундамент и завод, монтаж, перекрытие, окна и кровля. Остановки на концах этапов; внутри шага всё как было, вся
// стройка 13 с вместо 15. Новый жест — только после паузы 220 мс между событиями колеса, как в аниматике: хвост
// инерции трекпада не шагает дальше
const PLAY_S = clamp(+qs.get('t') || 13, 3, 60);   // вся стройка, секунды; ?t=11 — быстрее, ?t=15 — как было
const RAMP_S = 0.45;                               // разгон и остановка шага, секунды
const GAP_MS = 220;
const qOfP = p => { for (const [a, b, x0, x1] of WARP) if (p <= b) return (b > a ? lerp(x0, x1, (p - a) / (b - a)) : x1) / SCROLL_PX; return 1; };
const STOP_Q = [0, ...WEEK_END.map((_, i) => qOfP((i + 1) / ANIMATED))];   // доля времени на концах этапов
const STOP_W = [0, ...WEEK_END];                                           // неделя на остановке
// Максим 28.10, ночь: «монтаж — анимация долгая, а недель в нём одна, он не вписывается; ползунок прилипает на 14-й
// неделе». Длительность шага теперь задана по этапам, монтаж короче: ?m=1 — 1,4 с, 2 — 1,8 с, 3 — 2,3 с (выбран, по умолчанию);
// было 3,5 с. Внутри монтажа доли прежние: стены краном, разворот камеры, закладные = 250 : 120 : 270
const MONT_S = { 1: 1.4, 2: 1.8, 3: 2.3 }[qs.get('m')] || 2.3;   // Максим выбрал 3
// секунды этапа — по прежним долям варианта 1 (PLAY_S на SEGS_RAW_TOTAL); вариант 2: монтаж без закладных (370 из 640 его долей),
// закладные переехали в перекрытие в темпе монтажа
const STEP_S = STOP_Q.slice(1).map((q, k) => {
  if (k === 2) return ZK2 ? MONT_S * 370 / 640 : MONT_S;
  if (k === 3 && ZK2) return PLAY_S * 390 / SEGS_RAW_TOTAL + MONT_S * 270 / 640;
  return PLAY_S * (q - STOP_Q[k]) * SEGS_SUM / SEGS_RAW_TOTAL;
});
const TAU = STEP_S.reduce((a, d) => (a.push(a[a.length - 1] + d), a), [0]);   // секунды стройки на остановках
const glide = a => t => {   // скорость растёт за долю a, держится и спадает за a; без рывка на стыках
  if (a <= 0) return t;
  const v = 1 / (1 - a);
  if (t < a) return v * t * t / (2 * a);
  if (t > 1 - a) { const s = 1 - t; return 1 - v * s * s / (2 * a); }
  return v * (t - a / 2);
};
const pr = { q: 0 };
let tw = null, playing = false, chaseW = null, wCur = 0;
// по чему вести переход: 'q' — доля сюжета (внутри одного этапа), 't' — секунды стройки (пропуск: монтаж занимает в нём
// свою долю 1,8 с, а не прежнюю 3,5), 'w' — недели (щелчок по линейке: стебель едет ровно, монтаж проходит за свою неделю)
const SPACE = {
  q: { of: q => q, to: v => v },
  t: { of: q => lerpBy(STOP_Q, TAU, q), to: v => lerpBy(TAU, STOP_Q, v) },
  w: { of: q => lerpBy(STOP_Q, STOP_W, q), to: v => qOfWeek(v) }
};
function playTo(q1, dur, ez, lock, space = 'q') {
  if (tw) tw.kill();
  chaseW = null; playing = false;
  if (RM) { pr.q = q1; setP(storyP(q1)); return; }
  playing = lock;
  // твин по времени 0 → 1, долю считаем сами: GSAP округляет значения до 5 знаков, и шаг проскакивал остановку на 1e-5 —
  // этап в списке загорался следующий. Так в конце ровно q1
  const S = SPACE[space], a0 = S.of(pr.q), a1 = S.of(q1), k = { t: 0 };
  tw = gsap.to(k, { t: 1, duration: dur, ease: 'none', onUpdate: () => { pr.q = k.t >= 1 ? q1 : S.to(lerp(a0, a1, ez(k.t))); setP(storyP(pr.q)); }, onComplete: () => { tw = null; playing = false; } });
}
function go(dir) {   // жест: следующий этап или назад к концу прошлого; длительность — по этапу (STEP_S)
  if (playing || FORCE !== null || dragId !== null) return;
  const q = pr.q, n = STOP_Q.length - 1;
  let k = -1;
  for (let i = 0; i < n; i++) if (dir > 0 ? q >= STOP_Q[i] - 1e-6 && q < STOP_Q[i + 1] - 1e-6 : q > STOP_Q[i] + 1e-6 && q <= STOP_Q[i + 1] + 1e-6) { k = i; break; }
  if (k < 0) return;
  const q1 = dir > 0 ? STOP_Q[k + 1] : STOP_Q[k];
  const dur = STEP_S[k] * Math.abs(q1 - q) / (STOP_Q[k + 1] - STOP_Q[k]);
  playTo(q1, dur, glide(Math.min(0.25, RAMP_S / dur)), true);
}
// щелчок по этапу (Максим 30.10: «не начинать этап, а просто перемещаться на него»): стройка едет к остановке этапа
// (его конец — как после шага прокрутки), по секундам стройки: 26 недель за 2,5 с, как «Пропустить», не короче 0,6 с
function goStage(i) {
  if (FORCE !== null) return;
  const q1 = STOP_Q[i + 1];
  if (RM) { pr.q = q1; setP(storyP(q1)); return; }
  if (Math.abs(pr.q - q1) < 1e-6) return;
  const T0 = lerpBy(STOP_Q, TAU, pr.q), T1 = TAU[i + 1];
  playTo(q1, Math.max(0.6, 2.5 * Math.abs(T1 - T0) / TAU[TAU.length - 1]), ease, true, 't');
}
STAGES.forEach((_, i) => stageHit(i).forEach(el => {
  el.classList.add('et-hit'); el.setAttribute('role', 'button'); el.tabIndex = 0;
  el.setAttribute('aria-label', 'Показать этап: ' + STAGES[i]);
  el.addEventListener('click', () => goStage(i));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); goStage(i); } });
}));
sizeAll();
$('etBody').classList.add('et-init');
setTimeout(() => $('etBody').classList.remove('et-init'), 300);
if (document.fonts) document.fonts.ready.then(measureNames);
if (FORCE !== null) { pr.q = qOfP(FORCE); setP(FORCE); }
gsap.ticker.add((time, dtMs) => {
  const dt = Math.min(0.1, dtMs / 1000);
  if (chaseW !== null) {   // протяжка по линейке: неделя догоняет мышь на 0,1 за кадр, как трек у Left Coast; догон по
    // неделям, а не по доле сюжета — иначе на монтаже (одна неделя, много сюжета) стебель прилипал к 13–14-й неделе
    wCur += (chaseW - wCur) * (1 - Math.pow(1 - BAR_K, dt * 60));
    if (Math.abs(chaseW - wCur) < 1e-4 && dragId === null) { wCur = chaseW; chaseW = null; }
    pr.q = qOfWeek(wCur); setP(storyP(pr.q));
  }
  if (dirty) render();
  rollWeek();
  rulerFrame(dt);
  skip.firstElementChild.setAttribute('aria-disabled', skip.classList.toggle('off', P_now >= 1));
});
gsap.ticker.lagSmoothing(0);
// пропуск анимации: дом быстро собирается до конца и встаёт в фасад, блок остаётся на экране (2,5 с, как было)
const skip = $('etSkip');
if (FORCE !== null) skip.hidden = true;
skip.addEventListener('click', () => { if (P_now < 1) playTo(1, 2.5, ease, true, 't'); });

/* ---------- линейка под мышью: волна за курсором, щелчок и протяжка ведут стройку к неделе ---------- */
const weekOfX = clientX => { const r = ruler.getBoundingClientRect(); return clamp(((clientX - r.left) / U - R_X0) / (2 * R_STEP), 0, 26); };
function goWeek(w, drag) {
  const q = qOfWeek(w);
  if (FORCE !== null || RM) { pr.q = q; setP(storyP(q)); return; }
  // протяжка: догон 0,1 за кадр по неделям; щелчок: изинг пропуска, 26 недель за 2,5 с, но не короче 0,6 с
  if (drag) { if (tw) { tw.kill(); tw = null; } if (chaseW === null) wCur = weekNow(); playing = false; chaseW = clamp(w, 0, WEEKS_N); }
  else playTo(q, Math.max(0.6, 2.5 * Math.abs(w - weekNow()) / WEEKS_N), ease, false, 'w');
}
let dragId = null, dragged = false, downX = 0, downY = 0;
ruler.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') hoverX = clamp((e.clientX - ruler.getBoundingClientRect().left) / U, R_X0, R_X1);
  if (dragId === e.pointerId && e.pointerType !== 'mouse' && !dragged && Math.abs(e.clientY - downY) > 8 && Math.abs(e.clientX - downX) <= 8) dragId = null;
  if (dragId === e.pointerId && (e.pointerType === 'mouse' || dragged || Math.abs(e.clientX - downX) > 8)) { dragged = true; goWeek(weekOfX(e.clientX), true); }
});
ruler.addEventListener('pointerleave', () => { hoverX = null; });
ruler.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  dragId = e.pointerId; dragged = false; downX = e.clientX; downY = e.clientY; ruler.setPointerCapture(e.pointerId); e.preventDefault();
});
const endDrag = e => {
  if (dragId !== e.pointerId) return;
  dragId = null;
  if (!dragged) goWeek(weekOfX(e.clientX), false);
  if (e.pointerType !== 'mouse') hoverX = null;
};
ruler.addEventListener('pointerup', endDrag);
ruler.addEventListener('pointercancel', e => { if (dragId === e.pointerId) dragId = null; hoverX = null; });

let rsT = 0;
addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(sizeAll, 120); });

window.__stagesEngine = { seek: t => { if (tw) { tw.kill(); tw = null; } chaseW = null; playing = false; pr.q = SPACE.t.to(t); setP(storyP(pr.q)); }, setP: p => { setP(p); render(); }, get p() { return P_now; }, get q() { return pr.q; }, get playing() { return playing; }, get week() { return wkTarget; }, STEP_S, TAU, get weekShown() { return wkShown; }, weekNow, qOfP, goWeek, go, els, WINS, storyP, SCROLL_PX, PLAY_S };
})();
