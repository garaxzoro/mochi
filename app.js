/* 麻糬健康冒險 主程式 */
(function () {
'use strict';

/* ========== 基本工具 ========== */
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const round = (n, d) => { const p = Math.pow(10, d || 0); return Math.round((Number(n) || 0) * p) / p; };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function toLocal(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function parseLocal(s) { if (!s) return new Date(NaN); const [d, t] = s.split('T'); const [y, m, dd] = d.split('-').map(Number); const [h, mi] = (t || '00:00').split(':').map(Number); return new Date(y, m - 1, dd, h || 0, mi || 0); }
function dayKey(x) { const d = typeof x === 'string' ? parseLocal(x) : x; return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function nowLocal() { return toLocal(new Date()); }
function todayKey() { return dayKey(new Date()); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function hm(s) { const d = parseLocal(s); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function mdLabel(s) { const d = parseLocal(s); return (d.getMonth() + 1) + '/' + d.getDate() + ' 週' + WEEK[d.getDay()]; }
function whenLabel(s) { const k = dayKey(s); if (k === todayKey()) return '今天 ' + hm(s); if (k === dayKey(addDays(new Date(), -1))) return '昨天 ' + hm(s); return mdLabel(s) + ' ' + hm(s); }
function durText(ms) { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60); return h + ' 小時 ' + (m % 60) + ' 分'; }

/* ========== 圖示 ========== */
const I = {
  home: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/></svg>',
  water: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 01-11 0c0-3 2.5-6 5.5-10z"/></svg>',
  run: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4.5" r="1.8"/><path d="M9 21l2.5-6.5L14 17v4M7 12l3-4h4l2 3h3M11.5 14.5L10 8"/></svg>',
  chart: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/></svg>',
  paw: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 10V4.5a1.5 1.5 0 013 0V10M12 10V5a1.5 1.5 0 013 0v5"/><ellipse cx="12" cy="15" rx="6" ry="5"/></svg>',
  gear: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  back: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  cam: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  scale: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9.5a4 4 0 016 0M12 9.5l1.2-1.5"/></svg>',
  x: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/* ========== 設定與連線 ========== */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('mochi_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mochi_' + k, JSON.stringify(v)); } catch (e) { /* 空間不足時略過 */ } },
  del(k) { try { localStorage.removeItem('mochi_' + k); } catch (e) { } }
};
const CFG = window.MOCHI_CONFIG || {};
function apiUrl() { return LS.get('api', '') || CFG.API_URL || ''; }
function passcode() { return LS.get('pass', ''); }
function isDemo() { return apiUrl() === 'demo'; }

class OfflineError extends Error { }

async function api(action, payload) {
  if (isDemo()) return demoApi(action, payload || {});
  if (!navigator.onLine) throw new OfflineError('offline');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), action === 'analyze' ? 60000 : 25000);
  let res;
  try {
    res = await fetch(apiUrl(), { method: 'POST', body: JSON.stringify(Object.assign({ action, pass: passcode() }, payload || {})), signal: ctrl.signal, redirect: 'follow' });
  } catch (e) {
    throw new OfflineError('network');
  } finally { clearTimeout(timer); }
  let data;
  try { data = await res.json(); } catch (e) { throw new Error('伺服器回應看不懂，請確認 Apps Script 網址是否正確'); }
  if (!data.ok) {
    const err = new Error(data.error || '發生錯誤'); err.code = data.code; throw err;
  }
  return data;
}

/* 試玩模式：資料只存在這支手機 */
function demoApi(action, p) {
  const db = LS.get('demo_db', null) || seedDemo();
  const save = () => LS.set('demo_db', db);
  return new Promise(resolve => setTimeout(() => {
    if (action === 'load') return resolve({ ok: true, settings: db.settings, records: db.records, favorites: db.favorites });
    if (action === 'save') { const i = db.records.findIndex(r => r.id === p.record.id); if (i >= 0) db.records[i] = p.record; else db.records.push(p.record); save(); return resolve({ ok: true, record: p.record }); }
    if (action === 'del') { db.records = db.records.filter(r => r.id !== p.id); save(); return resolve({ ok: true }); }
    if (action === 'setSettings') { db.settings = p.settings; save(); return resolve({ ok: true }); }
    if (action === 'saveFav') { const i = db.favorites.findIndex(f => f.id === p.fav.id); if (i >= 0) db.favorites[i] = p.fav; else db.favorites.push(p.fav); save(); return resolve({ ok: true }); }
    if (action === 'delFav') { db.favorites = db.favorites.filter(f => f.id !== p.id); save(); return resolve({ ok: true }); }
    if (action === 'analyze') return resolve({ ok: true, result: demoMeal(p.text) });
    resolve({ ok: false, error: '未知的動作' });
  }, action === 'analyze' ? 1200 : 200));
}
function demoMeal(text) {
  return {
    name: text ? text.slice(0, 12) : '雞腿便當',
    items: [
      { name: '白飯', portion: '1 碗', kcal: 280, protein: 5, carbs: 62, fat: 0.5, fiber: 0.6, sodium: 2, sugar: 0 },
      { name: '滷雞腿', portion: '1 支', kcal: 310, protein: 28, carbs: 3, fat: 21, fiber: 0, sodium: 780, sugar: 3 },
      { name: '配菜三樣', portion: '1 份', kcal: 150, protein: 4, carbs: 10, fat: 10, fiber: 4, sodium: 420, sugar: 3 },
      { name: '滷蛋', portion: '1 顆', kcal: 90, protein: 7, carbs: 1, fat: 6, fiber: 0, sodium: 240, sugar: 1 }
    ],
    comment: '（試玩模式的範例結果）蛋白質很充足！便當比較鹹，下午多喝一杯水就好。'
  };
}
function seedDemo() {
  const recs = []; const now = new Date();
  for (let i = 13; i >= 1; i--) {
    const d = addDays(now, -i); const base = dayKey(d);
    if (i % 3 !== 0) recs.push({ id: uid(), type: 'weight', at: base + 'T07:30', data: { kg: round(69.4 - (13 - i) * 0.07 + (i % 2 ? 0.3 : -0.1), 1) } });
    recs.push({ id: uid(), type: 'water', at: base + 'T09:00', data: { ml: 800 } });
    recs.push({ id: uid(), type: 'water', at: base + 'T14:00', data: { ml: i % 4 ? 800 : 500 } });
    if (i % 2) recs.push({ id: uid(), type: 'exercise', at: base + 'T19:00', data: { kind: 'walk', label: '散步', minutes: 20 + (i % 3) * 10, level: 2, kcal: 100 } });
    recs.push({ id: uid(), type: 'meal', at: base + 'T12:30', data: { meal: '午餐', name: '雞腿便當', store: '', items: demoMeal().items.map(x => Object.assign({ mult: 1 }, x)), comment: '' } });
    recs.push({ id: uid(), type: 'meal', at: base + 'T19:30', data: { meal: '晚餐', name: '代餐奶昔', store: '', items: [{ name: '代餐奶昔', portion: '1 瓶', kcal: 220, protein: 20, carbs: 22, fat: 6, fiber: 5, sodium: 200, sugar: 10, mult: 1 }], comment: '' } });
  }
  return { settings: {}, records: recs, favorites: [] };
}

/* ========== 狀態 ========== */
const S = { settings: {}, records: [], favs: [], loaded: false, justSaved: 0, celebrate: null };
let V = {};          // 目前頁面的暫存狀態
let route = '';

function applyData(d) {
  S.settings = d.settings || {};
  S.records = (d.records || []).filter(r => r && r.id && r.at).sort((a, b) => a.at < b.at ? -1 : 1);
  S.favs = d.favorites || [];
  S.loaded = true;
  LS.set('cache', { settings: S.settings, records: S.records, favorites: S.favs });
}
function cacheNow() { LS.set('cache', { settings: S.settings, records: S.records, favorites: S.favs }); }

/* ========== 計算 ========== */
const ACT_FACTOR = { sit: 1.2, light: 1.375, mid: 1.55 };
function latestWeight() {
  for (let i = S.records.length - 1; i >= 0; i--) if (S.records[i].type === 'weight') return Number(S.records[i].data.kg);
  return Number(S.settings.weight) || 0;
}
function profileReady() { const s = S.settings; return s.height && s.birthYear && (s.weight || latestWeight()) && s.sex; }
function calcTargets() {
  const s = S.settings; const o = s.override || {};
  const w = latestWeight() || 60;
  let kcal = 1500, protein = 70, water = 2000, exercise = 30;
  if (profileReady()) {
    const age = new Date().getFullYear() - Number(s.birthYear);
    const bmr = 10 * w + 6.25 * Number(s.height) - 5 * age + (s.sex === 'male' ? 5 : -161);
    const tdee = bmr * (ACT_FACTOR[s.activity || 'sit'] || 1.2);
    const deficit = Number(s.speed) === 0.25 ? 275 : 550;
    kcal = Math.max(s.sex === 'male' ? 1500 : 1200, Math.round((tdee - deficit) / 10) * 10);
    protein = Math.round(w * 1.1);
    water = clamp(Math.round(w * 30 / 100) * 100, 1500, 3000);
  }
  return {
    kcal: Number(o.kcal) || kcal, protein: Number(o.protein) || protein,
    water: Number(o.water) || water, exercise: Number(o.exercise) || exercise,
    auto: { kcal, protein, water, exercise }
  };
}
function recsOn(key, type) { return S.records.filter(r => dayKey(r.at) === key && (!type || r.type === type)); }
function mealTotals(items) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 };
  (items || []).forEach(it => { const m = it.mult == null ? 1 : Number(it.mult); Object.keys(t).forEach(k => { t[k] += (Number(it[k]) || 0) * m; }); });
  Object.keys(t).forEach(k => { t[k] = round(t[k], k === 'kcal' || k === 'sodium' ? 0 : 1); });
  return t;
}
function dayStats(key) {
  const rs = recsOn(key);
  const st = { kcal: 0, protein: 0, water: 0, exMin: 0, exKcal: 0, meals: 0 };
  rs.forEach(r => {
    if (r.type === 'meal') { const t = mealTotals(r.data.items); st.kcal += t.kcal; st.protein += t.protein; st.meals++; }
    if (r.type === 'water') st.water += Number(r.data.ml) || 0;
    if (r.type === 'exercise') { st.exMin += Number(r.data.minutes) || 0; st.exKcal += Number(r.data.kcal) || 0; }
  });
  st.kcal = Math.round(st.kcal); st.protein = round(st.protein, 0);
  return st;
}

/* 運動 */
const EX = {
  walk: { label: '散步', met: [2.8, 3.5, 4.3] },
  aerobic: { label: '有氧', met: [4.0, 5.5, 7.5] },
  yoga: { label: '瑜伽', met: [2.5, 3.0, 4.0] },
  bike: { label: '騎腳踏車', met: [4.0, 6.8, 8.5] },
  stairs: { label: '爬樓梯', met: [4.0, 7.0, 8.8] },
  weights: { label: '重訓', met: [3.5, 5.0, 6.0] },
  swim: { label: '游泳', met: [5.0, 7.0, 9.8] },
  chores: { label: '做家事', met: [2.5, 3.3, 4.5] },
  custom: { label: '其他', met: [3.0, 4.5, 6.5] }
};
const LEVELS = [
  { b: '輕鬆', s: '可以聊天甚至唱歌' },
  { b: '有點喘', s: '能說完整句子，但唱不了歌' },
  { b: '很喘', s: '講幾個字就要換氣' }
];
function exKcal(kind, level, minutes) { const m = (EX[kind] || EX.custom).met[clamp(level, 1, 3) - 1]; return Math.round(m * (latestWeight() || 60) * minutes / 60); }

/* 經驗值與等級 */
const XP_RULE = { meal: [10, 6], water: [5, 6], exercise: [15, 3], weight: [10, 1], fast: [10, 1] };
function xpInfo() {
  const byDay = {};
  S.records.forEach(r => { const k = dayKey(r.at); (byDay[k] = byDay[k] || []).push(r); });
  const days = Object.keys(byDay).sort();
  let xp = 0, streak = 0, prev = null, best = 0;
  days.forEach(k => {
    const cnt = {};
    byDay[k].forEach(r => { const rule = XP_RULE[r.type]; if (!rule) return; cnt[r.type] = (cnt[r.type] || 0) + 1; if (cnt[r.type] <= rule[1]) xp += rule[0]; });
    if (prev && dayKey(addDays(parseLocal(prev + 'T12:00'), 1)) === k) streak++; else streak = 1;
    if (streak % 3 === 0) xp += 20;
    best = Math.max(best, streak); prev = k;
  });
  // 目前連續天數（今天或昨天有紀錄才算延續）
  let cur = 0;
  if (prev && (prev === todayKey() || prev === dayKey(addDays(new Date(), -1)))) cur = streak;
  let lv = 1, rest = xp;
  while (rest >= need(lv)) { rest -= need(lv); lv++; }
  return { xp, lv, cur: rest, need: need(lv), streak: cur, best, lastDay: prev };
}
function need(l) { return 80 + 20 * l; }
const STAGES = [
  { n: 1, name: '見習兔', from: 1, to: 5 },
  { n: 2, name: '草原旅人', from: 6, to: 15 },
  { n: 3, name: '森林騎士', from: 16, to: 30 },
  { n: 4, name: '星光守護者', from: 31, to: 999 }
];
function stageOf(lv) { return STAGES.find(s => lv >= s.from && lv <= s.to) || STAGES[3]; }
function daysAway() {
  const xi = xpInfo(); if (!xi.lastDay) return 0;
  const a = parseLocal(xi.lastDay + 'T00:00'), b = parseLocal(todayKey() + 'T00:00');
  return Math.round((b - a) / 86400000);
}
function mood() {
  if (Date.now() - S.justSaved < 15000) return 'happy';
  const away = daysAway();
  if (away >= 2) return 'worried';
  const h = new Date().getHours();
  if (h >= 23 || h < 6) return 'sleepy';
  const t = calcTargets(), d = dayStats(todayKey());
  if (d.water >= t.water && d.exMin >= t.exercise) return 'happy';
  return 'normal';
}
function petImg(m, scene) { const st = stageOf(xpInfo().lv).n; return 'img/lv' + st + '_' + (m || mood()) + (scene ? '_scene.jpg' : '.webp'); }

/* 麻糬的話 */
function greeting() {
  const away = daysAway(); const h = new Date().getHours();
  const t = calcTargets(); const d = dayStats(todayKey());
  if (S.records.length === 0) return '你好，我是麻糬！我們一起慢慢養成好習慣吧。先從喝一杯水開始好嗎？';
  if (away >= 7) return '好久不見，我一直在這裡等你喔。不用補很多，今天記一杯水就很棒了。';
  if (away >= 2) return pick(['你' + away + '天沒來了，我有一點點想你。記一杯水就好，好嗎？', '歡迎回來！不用急著補，從現在開始就好。', '我有乖乖等你喔，今天想從哪裡開始呢？']);
  if (h >= 23 || h < 6) return pick(['夜深了，早點休息吧，睡飽也是減重的一部分喔。', '呼…好睏。今天辛苦了，記得好好睡。']);
  if (d.water >= t.water && d.exMin >= t.exercise) return pick(['今天喝水和運動都達標了！你好厲害，我的耳朵都豎起來了。', '全部完成！今天的你閃閃發亮。']);
  if (h < 11) return pick(['早安！今天也慢慢來就好喔。', '早安～先喝一杯水，讓身體醒過來吧。', '新的一天開始了，我陪你一起。']);
  if (d.water < t.water * 0.4 && h >= 14) return pick(['下午了，水喝得有點少，來一杯吧？', '我口渴了…你也一起喝杯水好嗎？']);
  if (d.exMin === 0 && h >= 17) return pick(['晚上要不要一起散步十分鐘？一點點也很好。', '今天還沒動一動，伸展一下也算數喔。']);
  return pick(['你今天也很努力喔！', '有記錄就是進步，我都看到了。', '一步一步來，我們一起冒險。', '慢慢來沒關係，重要的是不放棄。']);
}
function cheer(type, extra) {
  const bank = {
    water: ['咕嘟咕嘟，好喝！', '喝水很棒，身體會謝謝你的。', '水分補充完成！'],
    exercise: ['動一動好舒服！你好棒。', '每一分鐘都算數，辛苦了！', '運動完記得喝點水喔。'],
    meal: ['記好了！誠實記錄最勇敢。', '有記錄就能看見自己，很棒喔。', '吃飯也要開開心心的。'],
    weight: ['量體重很勇敢！看趨勢就好，不用在意單日。', '記下來了，我們看長期的變化。'],
    fast: ['斷食完成，好有毅力！', '撐過來了！開動前先喝杯水吧。'],
    fastStart: ['好的，開始斷食計時！', '收到，麻糬幫你計時。']
  };
  return (extra ? extra + ' ' : '') + pick(bank[type] || ['記好了！']);
}

/* ========== 畫面骨架 ========== */
function render() {
  const view = $('#view');
  if (!apiUrl() || (!isDemo() && !passcode())) { view.innerHTML = vSetup(); $('#tabbar').innerHTML = ''; return; }
  if (!S.loaded) { view.innerHTML = '<div class="loading"><div class="spin"></div>麻糬正在整理背包…</div>'; renderTabs(); return; }
  const r = route || 'home';
  const map = { home: vHome, meal: vMeal, water: vWater, exercise: vExercise, report: vReport, pet: vPet, settings: vSettings };
  view.innerHTML = (map[r] || vHome)();
  renderTabs();
  if (S.celebrate) showCelebrate();
}
function renderTabs() {
  const r = route || 'home';
  const tabs = [['home', '今天', I.home], ['water', '喝水', I.water], ['exercise', '運動', I.run], ['report', '報表', I.chart], ['pet', '麻糬', I.paw]];
  $('#tabbar').innerHTML = tabs.map(t => '<a href="#' + t[0] + '" class="t-' + t[0] + (r === t[0] ? ' on' : '') + '"' + (r === t[0] ? ' aria-current="page"' : '') + '>' + t[2] + t[1] + '</a>').join('');
}
function go(r) { if (('#' + r) === location.hash) { V = {}; route = r; render(); window.scrollTo(0, 0); } else location.hash = r; }
let pendingV = null;
function nav(r, initV) { pendingV = initV || null; if (('#' + r) === location.hash) { route = r; V = pendingV || {}; pendingV = null; render(); window.scrollTo(0, 0); } else location.hash = r; }
window.addEventListener('hashchange', () => { route = location.hash.slice(1); V = pendingV || {}; pendingV = null; closeSheet(); render(); window.scrollTo(0, 0); });

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800); }
function backBar(title, to) { return '<div class="back"><a class="icon-btn" href="#' + (to || 'home') + '" aria-label="返回">' + I.back + '</a><h1 class="h1" style="font-size:22px">' + title + '</h1></div>'; }

/* 時間選擇（補記用） */
function timePicker(key) {
  const v = V[key] || nowLocal();
  const isNow = Math.abs(parseLocal(v) - new Date()) < 90000;
  const y = toLocal(addDays(parseLocal(nowLocal()), -1));
  const isY = dayKey(v) === dayKey(y);
  return '<div class="row wrap"><span class="small">時間</span>' +
    '<button class="chip' + (isNow ? ' on' : '') + '" data-act="tp-now" data-k="' + key + '">現在</button>' +
    '<button class="chip' + (!isNow && isY ? ' on' : '') + '" data-act="tp-yday" data-k="' + key + '">昨天</button>' +
    '<label class="chip' + (!isNow && !isY ? ' on' : '') + '" style="position:relative">' + (isNow ? '選日期時間' : whenLabel(v)) +
    '<input type="datetime-local" data-change="tp-set" data-k="' + key + '" value="' + v + '" max="' + nowLocal() + '" aria-label="選擇日期與時間" style="position:absolute;inset:0;opacity:0;width:100%"></label></div>';
}

/* ========== 設定連線 ========== */
function vSetup() {
  return '<div class="pet-hero" style="margin-top:20px"><img src="img/lv1_happy.webp" alt="麻糬揮手"></div>' +
    '<h1 class="h1 center">歡迎來到麻糬健康冒險</h1><p class="sub center" style="margin:8px 0 20px">第一次使用，請貼上你的 Apps Script 網址和通行碼。</p>' +
    '<div class="stack"><label class="small" for="su-url">Apps Script 網址</label><input id="su-url" class="input" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(LS.get('api', '') && !isDemo() ? LS.get('api', '') : (CFG.API_URL || '')) + '" autocomplete="off">' +
    '<label class="small" for="su-pass">通行碼</label><input id="su-pass" class="input" type="password" inputmode="numeric" autocomplete="off">' +
    '<button class="btn btn-rose btn-big" data-act="setup-go">連線</button>' +
    '<button class="btn btn-ghost" data-act="setup-demo">先用試玩模式看看</button>' +
    '<p class="small center">試玩模式的資料只存在這支手機，不會上傳。</p></div>';
}

/* ========== 首頁 ========== */
function vHome() {
  const t = calcTargets(), d = dayStats(todayKey()), xi = xpInfo(), st = stageOf(xi.lv), m = mood();
  const now = new Date();
  let html = '<div class="hd"><div><div class="sub">' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + WEEK[now.getDay()] + '</div><h1 class="h1">今天的冒險</h1></div>' +
    '<a class="icon-btn round" href="#settings" aria-label="設定">' + I.gear + '</a></div>';
  html += '<div class="scene' + (st.n === 1 ? ' paper' : '') + '"><div class="pic"><img src="' + petImg(m, true) + '" alt="麻糬"></div>' +
    '<div class="info"><div class="bubble">' + esc(V.greet || (V.greet = greeting())) + '</div>' +
    '<a class="xp" href="#pet"><div class="between small" style="color:var(--ink2)"><span>Lv ' + xi.lv + ' ' + st.name + '</span><span>EXP ' + xi.cur + ' / ' + xi.need + '</span></div><div class="bar" style="height:6px;margin-top:4px"><i style="width:' + Math.round(xi.cur / xi.need * 100) + '%"></i></div></a></div></div>';
  if (!profileReady()) html += '<a href="#settings" class="card mt row" style="text-decoration:none;color:inherit"><div class="stack" style="gap:2px"><b style="font-size:14px">先告訴麻糬你的基本資料</b><span class="small">填好身高體重，才能幫你算每日目標</span></div></a>';
  html += '<div class="rings">' +
    ring(d.kcal, t.kcal, '#C2554D', '#F4DEDA', '熱量 大卡', 'meal') +
    ring(d.water, t.water, '#3E77A3', '#DCE8F1', '喝水 mL', 'water') +
    ring(d.exMin, t.exercise, '#4E7F4A', '#DDEADB', '運動 分', 'exercise') + '</div>';
  if (S.settings.fastOff !== true) html += fastCard();
  html += '<div class="sec">快速記錄</div><div class="grid3">' +
    '<a href="#meal" class="btn btn-rose">' + I.cam + '記餐點</a>' +
    '<a href="#exercise" class="btn btn-green">' + I.run + '記運動</a>' +
    '<button class="btn btn-dashed" data-act="weight-open">量體重</button>' +
    '<button class="btn btn-wsoft" data-act="water-quick" data-ml="500">+ 500 mL</button>' +
    '<button class="btn btn-wsoft" data-act="water-quick" data-ml="800">+ 800 mL</button>' +
    '<a href="#water" class="btn btn-wsoft">自填水量</a></div>';
  const meals = recsOn(todayKey(), 'meal');
  html += '<div class="sec">今天吃了什麼</div>' + (meals.length ? '<div class="list">' + meals.map(r => '<button class="li" data-act="edit-meal" data-id="' + r.id + '"><span>' + esc(r.data.meal || '') + '　' + esc(r.data.name || '餐點') + '</span><span class="r">' + hm(r.at) + '　' + mealTotals(r.data.items).kcal + ' 大卡</span></button>').join('') + '</div>' : '<div class="list"><div class="empty">還沒有記錄，點「記餐點」開始吧</div></div>');
  return html;
}
function ring(v, goal, c, bg, label, to) {
  const C = 213.6, p = goal ? clamp(v / goal, 0, 1) : 0;
  return '<a class="ring" href="#' + to + '"><div class="rv"><svg aria-hidden="true" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="' + bg + '" stroke-width="9"/>' +
    '<circle cx="40" cy="40" r="34" fill="none" stroke="' + c + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (p * C).toFixed(1) + ' ' + C + '" transform="rotate(-90 40 40)"/></svg>' +
    '<div class="rt"><b>' + Math.round(v) + '</b><span>/' + goal + '</span></div></div><div class="rl">' + label + '</div></a>';
}

/* 168 斷食 */
function fastState() { return S.settings.fastState || null; }
function windowHours() { return Number(S.settings.windowHours) || 8; }
function fastCard() {
  const fs = fastState(); const now = new Date();
  const fastH = 24 - windowHours();
  if (!fs) {
    return '<div class="fast dark between"><div><div class="small">168 斷食</div><div class="big">還沒開始</div><div class="small">吃完最後一餐後按右邊開始計時</div></div><button class="btn btn-light" data-act="fast-start">開始斷食</button></div>';
  }
  const since = parseLocal(fs.since);
  if (fs.mode === 'fasting') {
    const el = now - since, left = since.getTime() + fastH * 3600000 - now;
    return '<div class="fast dark between"><div><div class="small">' + (24 - windowHours()) + ':' + windowHours() + ' 斷食中</div><div class="big">' + durText(el) + '</div><div class="small">從' + whenLabel(fs.since) + '開始，' + (left > 0 ? '再撐 ' + durText(left) : '已達標，可以進食了') + '</div></div>' +
      '<button class="btn btn-light" data-act="fast-eat">開始進食</button></div>';
  }
  // 進食中
  const end = since.getTime() + windowHours() * 3600000;
  if (now > end + 2 * 3600000) {
    const sug = suggestFastStart(fs.since);
    return '<div class="card mt say" style="align-items:center"><img src="' + petImg('sleepy') + '" alt="麻糬" style="width:72px;height:72px"><div class="stack" style="flex:1"><div class="bubble">' + (dayKey(sug) === todayKey() ? '今天' : '昨天') + '最後一口是 ' + hm(sug) + ' 嗎？</div>' +
      '<div class="grid2"><button class="btn btn-rose" data-act="fast-confirm" data-at="' + sug + '">對</button><button class="btn btn-ghost" data-act="fast-done">改時間</button></div></div></div>';
  }
  const left = end - now;
  return '<div class="fast eat stack"><div class="between" style="align-items:flex-start"><div><div class="small">進食窗口中，' + hm(fs.since) + ' 開始</div><div class="big">還剩 ' + durText(left) + '</div><div class="small">' + hm(toLocal(new Date(end))) + ' 窗口關閉</div></div><img src="' + petImg('normal') + '" alt="" style="width:56px;height:56px;object-fit:contain"></div>' +
    '<div class="bar"><i style="width:' + Math.round(clamp((now - since) / (windowHours() * 3600000), 0, 1) * 100) + '%"></i></div>' +
    '<button class="btn btn-dark" data-act="fast-done">吃完了，開始斷食</button><div class="small">忘了按也沒關係，會用最後一筆餐點的時間當起點</div></div>';
}
function suggestFastStart(sinceStr) {
  const meals = S.records.filter(r => r.type === 'meal' && r.at >= sinceStr);
  if (meals.length) return meals[meals.length - 1].at;
  return toLocal(new Date(parseLocal(sinceStr).getTime() + windowHours() * 3600000));
}
async function setFast(state, record) {
  const s = Object.assign({}, S.settings, { fastState: state });
  try {
    if (record) await api('save', { record });
    await api('setSettings', { settings: s });
  } catch (e) { return failSave(e); }
  S.settings = s; if (record) S.records.push(record), sortRecs();
  cacheNow();
  return true;
}

/* ========== 儲存共用 ========== */
function sortRecs() { S.records.sort((a, b) => a.at < b.at ? -1 : 1); }
function failSave(e) {
  if (e instanceof OfflineError) toast('沒有網路，稍後再記喔');
  else if (e.code === 'auth') { toast('通行碼不對，請到設定重新連線'); }
  else toast(e.message || '儲存失敗，稍後再試');
  return false;
}
async function saveRecord(rec, kind) {
  const before = xpInfo();
  try { await api('save', { record: rec }); } catch (e) { return failSave(e); }
  const i = S.records.findIndex(r => r.id === rec.id);
  if (i >= 0) S.records[i] = rec; else S.records.push(rec);
  sortRecs(); cacheNow();
  if (i < 0) {
    S.justSaved = Date.now();
    const after = xpInfo();
    const gained = after.xp - before.xp;
    if (after.lv > before.lv) S.celebrate = { lv: after.lv, stageUp: stageOf(after.lv).n > stageOf(before.lv).n };
    toast(cheer(kind || rec.type) + (gained > 0 ? '　+' + gained + ' EXP' : ''));
  } else toast('已更新');
  return true;
}
async function deleteRecord(id) {
  try { await api('del', { id }); } catch (e) { return failSave(e); }
  S.records = S.records.filter(r => r.id !== id); cacheNow(); toast('已刪除'); return true;
}

/* ========== 餐點 ========== */
function mealTypeFor(at) { const d = parseLocal(at); const h = d.getHours() + d.getMinutes() / 60; if (h < 10.5) return '早餐'; if (h < 14.5) return '午餐'; if (h < 17) return '點心'; if (h < 21) return '晚餐'; return '點心'; }
function vMeal() {
  if (!V.init) {
    V.init = true; V.mode = V.mode || 'photo'; V.at = V.at || nowLocal(); V.addFav = V.addFav !== false;
    if (V.editId) {
      const r = S.records.find(x => x.id === V.editId);
      if (r) { V.at = r.at; V.meal = r.data.meal; V.store = r.data.store || ''; V.result = JSON.parse(JSON.stringify({ name: r.data.name, items: r.data.items, comment: r.data.comment })); V.addFav = false; }
    }
  }
  if (!V.meal) V.meal = mealTypeFor(V.at);
  let h = backBar(V.editId ? '修改餐點' : '記錄餐點');
  if (!V.result && !V.busy) {
    h += '<div class="seg">' + [['photo', '拍照'], ['text', '打字描述'], ['fav', '常用清單']].map(x => '<button class="' + (V.mode === x[0] ? 'on' : '') + '" data-act="meal-mode" data-m="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
    if (V.mode === 'photo') {
      h += '<div class="mt">' + (V.img ? '<img class="photo" src="' + V.img + '" alt="餐點照片">' : '') +
        '<label class="photo-ph' + (V.img ? ' mt' : '') + '" style="' + (V.img ? 'height:52px;flex-direction:row' : '') + '">' + I.cam + (V.img ? '換一張' : '拍照或選一張照片') +
        '<input type="file" accept="image/*" data-change="meal-file" style="display:none"></label></div>' +
        '<label class="small mt" style="display:block" for="m-note">補充說明（可不填，例如：飯只吃一半）</label><input id="m-note" class="input mt" style="margin-top:6px" data-change="meal-note" value="' + esc(V.note || '') + '">' +
        '<button class="btn btn-rose btn-big btn-block mt" data-act="meal-analyze"' + (V.img ? '' : ' disabled') + '>請 AI 幫我估算</button>';
    } else if (V.mode === 'text') {
      h += '<textarea class="input mt" data-change="meal-text" placeholder="例如：7-11 雞胸肉沙拉一盒、無糖豆漿一瓶" aria-label="描述你吃了什麼">' + esc(V.text || '') + '</textarea>' +
        '<button class="btn btn-rose btn-big btn-block mt" data-act="meal-analyze">請 AI 幫我估算</button>';
    } else {
      h += S.favs.length ? '<div class="list mt">' + S.favs.map(f => '<div class="li" style="padding-right:6px"><button style="flex:1;border:0;background:transparent;text-align:left;font-size:14px;padding:6px 0" data-act="fav-use" data-id="' + f.id + '">' + esc(f.name) + (f.store ? ' <span class="pill">' + esc(f.store) + '</span>' : '') + '<div class="small">' + mealTotals(f.items).kcal + ' 大卡</div></button><button class="icon-btn" aria-label="刪除 ' + esc(f.name) + '" data-act="fav-del" data-id="' + f.id + '">' + I.x + '</button></div>').join('') + '</div>' : '<div class="list mt"><div class="empty">還沒有常用餐點。記錄餐點時勾選「加入常用清單」就會出現在這裡。</div></div>';
    }
    return h;
  }
  if (V.busy) return h + '<div class="loading"><img src="' + petImg('normal') + '" alt="" style="width:120px;height:120px;object-fit:contain"><div class="spin"></div>麻糬正在仔細看你的餐點…</div>';
  // 結果
  const R = V.result; const tot = mealTotals(R.items);
  if (V.img && !V.editId) h += '<img class="photo" src="' + V.img + '" alt="餐點照片" style="max-height:140px">';
  h += '<div class="stack mt">' + timePicker('at') +
    '<div class="row wrap"><span class="small">餐別</span>' + ['早餐', '午餐', '晚餐', '點心'].map(x => '<button class="chip rose' + (V.meal === x ? ' on' : '') + '" data-act="meal-type" data-v="' + x + '">' + x + '</button>').join('') + '</div>' +
    '<div class="row"><span class="small" style="white-space:nowrap">店家</span><input class="input" style="padding:8px 12px" data-change="meal-store" value="' + esc(V.store || '') + '" placeholder="可不填"></div></div>';
  h += '<div class="card mt stack"><div class="between" style="align-items:baseline"><input data-change="meal-name" value="' + esc(R.name || '') + '" aria-label="餐點名稱" style="border:0;font-size:15px;font-weight:700;background:transparent;min-width:0;flex:1"><div style="font-family:Huninn;font-size:24px;color:var(--rose-d);white-space:nowrap">約 ' + tot.kcal + ' 大卡</div></div>';
  h += '<div>' + R.items.map((it, i) => {
    const m = it.mult == null ? 1 : it.mult;
    return '<div class="item"><div class="between"><input data-change="item-name" data-i="' + i + '" value="' + esc(it.name) + '" aria-label="品項名稱" style="border:0;background:transparent;font-size:14px;min-width:0;flex:1"><span class="row" style="gap:4px"><input type="number" inputmode="numeric" data-change="item-kcal" data-i="' + i + '" value="' + Math.round(it.kcal * m) + '" aria-label="' + esc(it.name) + ' 熱量" style="width:64px;text-align:right;border:1px solid var(--line);border-radius:8px;padding:4px 6px;font-size:14px"><span class="small">大卡</span><button class="icon-btn" style="width:36px;height:36px" aria-label="移除 ' + esc(it.name) + '" data-act="item-del" data-i="' + i + '">' + I.x + '</button></span></div>' +
      '<div class="row wrap"><span class="small">' + esc(it.portion || '') + '</span><div class="portion">' + [[0.25, '1/4'], [0.5, '1/2'], [0.75, '3/4'], [1, '1'], [1.5, '1.5'], [2, '2']].map(p => '<button class="' + (m === p[0] ? 'on' : '') + '" data-act="item-mult" data-i="' + i + '" data-v="' + p[0] + '">' + p[1] + '</button>').join('') + '</div></div></div>';
  }).join('') + '</div><button class="btn btn-ghost" data-act="item-add">＋ 自己加一項</button>';
  h += '<div class="nut">' + [['蛋白質', tot.protein, 'g'], ['碳水', tot.carbs, 'g'], ['脂肪', tot.fat, 'g'], ['纖維', tot.fiber, 'g'], ['鈉', tot.sodium, 'mg'], ['糖', tot.sugar, 'g']].map(n => '<div>' + n[0] + '<b>' + n[1] + ' ' + n[2] + '</b></div>').join('') + '</div></div>';
  if (R.comment) h += '<div class="say mt"><img src="' + petImg('normal') + '" alt="麻糬"><div class="bubble" style="font-size:13px">' + esc(R.comment) + '</div></div>';
  if (!V.editId) h += '<label class="row mt" style="min-height:44px;font-size:14px"><input type="checkbox" data-change="meal-fav"' + (V.addFav ? ' checked' : '') + ' style="width:22px;height:22px;accent-color:var(--rose)">存檔後加入常用清單</label>';
  h += '<button class="btn btn-rose btn-big btn-block mt" data-act="meal-save">' + (V.editId ? '儲存修改' : '存檔') + '</button>';
  if (V.editId) h += '<button class="btn btn-ghost btn-block mt danger" data-act="meal-delete">刪除這一餐</button>';
  else h += '<button class="btn btn-ghost btn-block mt" data-act="meal-reset">重新來過</button>';
  return h;
}
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const max = 1024; let w = img.naturalWidth, h = img.naturalHeight; const s = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * s); h = Math.round(h * s);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('照片讀不到，換一張試試')); };
    img.src = url;
  });
}
function cleanResult(r) {
  const num = v => { const n = Number(v); return isFinite(n) && n >= 0 ? n : 0; };
  const items = (Array.isArray(r && r.items) ? r.items : []).map(it => ({
    name: String(it.name || '品項'), portion: String(it.portion || ''), kcal: num(it.kcal), protein: num(it.protein), carbs: num(it.carbs), fat: num(it.fat), fiber: num(it.fiber), sodium: num(it.sodium), sugar: num(it.sugar), mult: 1
  }));
  return { name: String((r && r.name) || (items[0] && items[0].name) || '餐點'), items: items.length ? items : [{ name: '餐點', portion: '', kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, mult: 1 }], comment: String((r && r.comment) || '') };
}

/* ========== 喝水 ========== */
function vWater() {
  if (!V.at) V.at = nowLocal();
  const t = calcTargets(), d = dayStats(todayKey()); const p = clamp(d.water / t.water, 0, 1);
  const left = t.water - d.water;
  let h = '<div class="hd"><h1 class="h1">喝水</h1><span class="sub">只算白開水</span></div>';
  h += '<div class="card water-box"><div class="bottle" role="img" aria-label="今日喝水進度 ' + Math.round(p * 100) + '%"><i style="height:' + Math.round(p * 100) + '%"></i></div><div class="stack" style="gap:4px"><div class="sub">今天已喝</div><div class="big-num">' + d.water + ' <span style="font-size:16px">mL</span></div><div class="sub">目標 ' + t.water + ' mL' + (left > 0 ? '，還差 ' + left : '') + '</div><div style="font-size:13px;color:var(--blue-d)">' + (left <= 0 ? '今天達標了！' : left <= 800 ? '再一壺 800 就達標了' : '慢慢喝，一口一口來') + '</div></div></div>';
  h += '<div class="mt">' + timePicker('at') + '</div>';
  h += '<div class="grid2 mt"><button class="btn btn-blue tall" data-act="water-add" data-ml="500"><span class="num">500</span><small>mL 水杯</small></button><button class="btn btn-blue tall" data-act="water-add" data-ml="800"><span class="num">800</span><small>mL 水壺</small></button></div>';
  h += '<div class="row mt"><label class="row" style="flex:1;min-width:0;min-height:52px;border-radius:16px;border:1px dashed var(--blue-l);background:var(--blue-bg);padding:0 14px;color:var(--blue-d);font-size:14px">自填<input type="number" inputmode="numeric" id="w-custom" placeholder="例如 300" style="flex:1;min-width:0;width:60px;border:0;background:transparent;font-size:16px;color:var(--blue-d)">mL</label><button class="btn" style="background:var(--blue-d);color:#fff;white-space:nowrap;min-width:72px" data-act="water-custom">加入</button></div>';
  const list = recsOn(todayKey(), 'water').slice().reverse();
  h += '<div class="sec">今天的紀錄</div>' + recList(list, r => r.data.ml + ' mL');
  return h;
}
function recList(list, right) {
  if (!list.length) return '<div class="list"><div class="empty">還沒有紀錄</div></div>';
  return '<div class="list">' + list.map(r => '<button class="li" data-act="rec-edit" data-id="' + r.id + '"><span>' + hm(r.at) + '</span><span>' + right(r) + '　<span class="r">修改</span></span></button>').join('') + '</div>';
}

/* ========== 運動 ========== */
function vExercise() {
  if (!V.init) { V.init = true; V.at = nowLocal(); V.kind = V.kind || 'walk'; V.min = V.min || 30; V.level = V.level || 2; }
  const k = EX[V.kind] || EX.custom; const label = V.kind === 'custom' ? (V.custom || '其他') : k.label;
  const kcal = exKcal(V.kind, V.level, V.min);
  const weekCount = new Set(S.records.filter(r => r.type === 'exercise' && parseLocal(r.at) >= addDays(parseLocal(todayKey() + 'T00:00'), -6)).map(r => dayKey(r.at))).size;
  let h = '<div class="hd"><h1 class="h1">運動</h1><span class="sub">這 7 天動了 ' + weekCount + ' 天</span></div>';
  h += timePicker('at');
  h += '<div class="sec">做了什麼？</div><div class="grid2">' + ['walk', 'aerobic', 'yoga'].map(x => '<button class="btn ' + (V.kind === x ? 'btn-green' : 'btn-gsoft') + '" style="min-height:60px;font-size:16px" data-act="ex-kind" data-v="' + x + '">' + EX[x].label + '</button>').join('') +
    '<button class="btn ' + (['walk', 'aerobic', 'yoga'].indexOf(V.kind) < 0 ? 'btn-green' : 'btn-dashed') + '" style="min-height:60px;font-size:16px" data-act="ex-other">' + (['walk', 'aerobic', 'yoga'].indexOf(V.kind) < 0 ? esc(label) : '其他 ＋') + '</button></div>';
  h += '<div class="sec">做了多久？</div><div class="grid5">' + [10, 20, 30, 45].map(x => '<button class="chip' + (V.min === x && !V.minCustom ? ' on' : '') + '" data-act="ex-min" data-v="' + x + '">' + x + ' 分</button>').join('') +
    '<label class="chip' + (V.minCustom ? ' on' : '') + '" style="padding:0 4px"><input type="number" inputmode="numeric" data-change="ex-min-custom" placeholder="自填" value="' + (V.minCustom ? V.min : '') + '" aria-label="自填分鐘數" style="width:100%;border:0;background:transparent;text-align:center;font-size:14px;color:inherit"></label></div>';
  h += '<div class="sec">累不累？</div><div class="stack" style="gap:8px">' + LEVELS.map((l, i) => '<button class="opt' + (V.level === i + 1 ? ' on' : '') + '" data-act="ex-level" data-v="' + (i + 1) + '"><b>' + l.b + '</b><span>' + l.s + '</span></button>').join('') + '</div>';
  h += '<div class="between mt2"><div class="sub">' + esc(label) + ' ' + V.min + ' 分，' + LEVELS[V.level - 1].b + '<div style="font-size:18px;font-weight:700;color:var(--ink)">約消耗 ' + kcal + ' 大卡</div></div><button class="btn btn-green btn-big" data-act="ex-save">存檔 +15 EXP</button></div>';
  const list = recsOn(todayKey(), 'exercise').slice().reverse();
  h += '<div class="sec">今天的紀錄</div>' + recList(list, r => esc(r.data.label) + ' ' + r.data.minutes + ' 分');
  return h;
}

/* ========== 報表 ========== */
function vReport() {
  if (!V.range) V.range = 7;
  if (!V.day) V.day = todayKey();
  const t = calcTargets(); const N = V.range;
  const days = []; for (let i = N - 1; i >= 0; i--) days.push(dayKey(addDays(new Date(), -i)));
  const stats = days.map(dayStats);
  let h = '<div class="hd"><h1 class="h1">冒險日誌</h1><div class="seg" style="width:150px"><button class="' + (N === 7 ? 'on' : '') + '" data-act="rep-range" data-v="7">本週</button><button class="' + (N === 30 ? 'on' : '') + '" data-act="rep-range" data-v="30">本月</button></div></div>';
  h += weightCard(N === 7 ? 14 : 60);
  // 喝水與運動
  const wDone = stats.filter(s => s.water >= t.water).length;
  const exTot = stats.reduce((a, s) => a + s.exMin, 0), exDays = stats.filter(s => s.exMin > 0).length;
  h += '<div class="grid2 mt" style="gap:10px">' +
    barCard('喝水', '達標 ' + wDone + ' 天', 'var(--blue-d)', stats.map(s => s.water), t.water, '#3E77A3', days) +
    barCard('運動', '共 ' + exTot + ' 分・' + exDays + ' 天', 'var(--green-d)', stats.map(s => s.exMin), t.exercise, '#4E7F4A', days) + '</div>';
  const eat = stats.filter(s => s.meals > 0);
  const avgK = eat.length ? Math.round(eat.reduce((a, s) => a + s.kcal, 0) / eat.length) : 0;
  const avgP = eat.length ? Math.round(eat.reduce((a, s) => a + s.protein, 0) / eat.length) : 0;
  h += '<div class="card mt stack"><div class="h2">熱量與蛋白質　' + (N === 7 ? '本週' : '本月') + '平均</div>' + (eat.length ? '<span class="small">以有記錄餐點的 ' + eat.length + ' 天計算</span>' : '') +
    meter('熱量', avgK + ' / ' + t.kcal + ' 大卡', avgK / t.kcal, '#C2554D', '#F4DEDA') + meter('蛋白質', avgP + ' / ' + t.protein + ' g', avgP / t.protein, '#D9A441', '#F1E8DE') + '</div>';
  h += '<div class="say mt"><img src="' + petImg('happy') + '" alt="麻糬"><div class="bubble" style="font-size:13px">' + esc(weekTalk(stats, t)) + '</div></div>';
  // 單日紀錄
  h += '<div class="sec between"><span>查看某一天</span><input type="date" data-change="rep-day" value="' + V.day + '" max="' + todayKey() + '" aria-label="選擇日期" style="border:1px solid var(--line);border-radius:10px;padding:6px 8px;background:#fff;font-size:15px"></div>';
  const recs = recsOn(V.day).slice().reverse();
  h += recs.length ? '<div class="list">' + recs.map(r => '<button class="li" data-act="' + (r.type === 'meal' ? 'edit-meal' : 'rec-edit') + '" data-id="' + r.id + '"><span>' + hm(r.at) + '　' + recDesc(r) + '</span><span class="r">修改</span></button>').join('') + '</div>' : '<div class="list"><div class="empty">這天沒有紀錄</div></div>';
  return h;
}
function recDesc(r) {
  const d = r.data || {};
  if (r.type === 'water') return '喝水 ' + d.ml + ' mL';
  if (r.type === 'exercise') return esc(d.label) + ' ' + d.minutes + ' 分';
  if (r.type === 'weight') return '體重 ' + d.kg + ' kg';
  if (r.type === 'meal') return esc(d.meal || '') + ' ' + esc(d.name || '') + ' ' + mealTotals(d.items).kcal + ' 大卡';
  if (r.type === 'fast') return '斷食 ' + d.hours + ' 小時';
  return r.type;
}
function meter(l, v, p, c, bg) { return '<div class="stack" style="gap:4px"><div class="between small"><span>' + l + '</span><span>' + v + '</span></div><div class="bar" style="height:10px;background:' + bg + '"><i style="width:' + Math.round(clamp(p, 0, 1) * 100) + '%;background:' + c + '"></i></div></div>'; }
function barCard(title, note, color, vals, goal, fill, days) {
  const max = Math.max(goal * 1.15, ...vals, 1);
  const show = days.length <= 7;
  return '<div class="card" style="padding:12px"><div style="font-size:14px;font-weight:700;color:' + color + '">' + title + '</div><div class="small" style="margin-bottom:8px">' + note + '</div>' +
    '<div class="bars" role="img" aria-label="' + title + '每日長條圖">' + '<div class="goal" style="bottom:' + Math.round(goal / max * 96) + 'px"></div>' + vals.map(v => '<i style="height:' + Math.max(2, Math.round(v / max * 96)) + 'px;background:' + (v ? fill : '#E5DBD0') + ';opacity:' + (v >= goal ? 1 : 0.6) + '"></i>').join('') + '</div>' +
    '<div class="blabels">' + (show ? days.map((d, i) => '<span>' + (i === days.length - 1 ? '今' : WEEK[parseLocal(d + 'T12:00').getDay()]) + '</span>').join('') : '<span style="text-align:left">' + mdLabel(days[0] + 'T00:00').split(' ')[0] + '</span><span style="text-align:right">今天</span>') + '</div></div>';
}
function weightCard(span) {
  const from = dayKey(addDays(new Date(), -(span - 1)));
  const ws = S.records.filter(r => r.type === 'weight' && dayKey(r.at) >= from);
  let h = '<div class="card stack"><div class="between"><div class="h2">體重</div><button class="chip" data-act="weight-open">' + I.scale + '記錄體重</button></div>';
  if (ws.length < 2) return h + '<div class="empty">量兩次以上就會畫出趨勢線喔</div></div>';
  // 每日取最後一筆
  const per = {}; ws.forEach(r => { per[dayKey(r.at)] = Number(r.data.kg); });
  const keys = Object.keys(per).sort();
  const allW = S.records.filter(r => r.type === 'weight');
  const avgAt = k => { const lo = dayKey(addDays(parseLocal(k + 'T12:00'), -6)); const arr = allW.filter(r => { const d = dayKey(r.at); return d >= lo && d <= k; }).map(r => Number(r.data.kg)); return arr.reduce((a, b) => a + b, 0) / arr.length; };
  const avgs = keys.map(avgAt);
  const vals = keys.map(k => per[k]).concat(avgs);
  const goal = Number(S.settings.goalWeight) || 0;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const W = 300, H = 120, px = k => 8 + (parseLocal(k + 'T12:00') - parseLocal(from + 'T12:00')) / ((span - 1) * 86400000) * (W - 16), py = v => 10 + (hi - v) / (hi - lo) * (H - 20);
  const last = avgs[avgs.length - 1], first = avgs[0];
  h = '<div class="card stack"><div class="between"><div class="h2">體重</div><button class="chip" data-act="weight-open">' + I.scale + '記錄體重</button></div>' +
    '<div class="small">7 日平均 <b style="font-size:18px;color:var(--ink)">' + round(last, 1) + '</b> kg　' + (span === 14 ? '兩週' : '兩個月') + ' ' + (last - first <= 0 ? '−' : '+') + Math.abs(round(last - first, 1)) + (goal ? '　離目標 ' + round(Math.max(0, last - goal), 1) + ' kg' : '') + '</div>' +
    '<svg class="chart" role="img" aria-label="體重趨勢，點為實際量測，紅線為七日平均" viewBox="0 0 ' + W + ' ' + H + '"><line x1="0" y1="' + (H - 6) + '" x2="' + W + '" y2="' + (H - 6) + '" stroke="#EADFD3"/>' +
    '<polyline points="' + keys.map((k, i) => px(k).toFixed(1) + ',' + py(avgs[i]).toFixed(1)).join(' ') + '" fill="none" stroke="#C2554D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    keys.map(k => '<circle cx="' + px(k).toFixed(1) + '" cy="' + py(per[k]).toFixed(1) + '" r="3.6" fill="#fff" stroke="#7A6358" stroke-width="1.6"/>').join('') + '</svg>' +
    '<div class="small">圓點是有量的那天，紅線是七日平均，單日上下跳動不用在意</div></div>';
  return h;
}
function weekTalk(stats, t) {
  const ex = stats.filter(s => s.exMin > 0).length, w = stats.filter(s => s.water >= t.water).length;
  const eat = stats.filter(s => s.meals > 0); const avgP = eat.length ? eat.reduce((a, s) => a + s.protein, 0) / eat.length : 0;
  const parts = [];
  if (ex) parts.push('這段時間動了 ' + ex + ' 天，很棒！'); else parts.push('最近還沒運動，散步十分鐘就是好的開始。');
  if (w) parts.push('喝水達標 ' + w + ' 天。');
  if (eat.length && avgP < t.protein * 0.85) parts.push('蛋白質再多一顆蛋或一杯豆漿就更剛好囉。');
  return parts.join('');
}

/* ========== 麻糬 ========== */
function vPet() {
  const xi = xpInfo(), st = stageOf(xi.lv), m = mood(), nxt = STAGES[st.n] || null;
  let h = '<div class="hd"><h1 class="h1">麻糬的冒險</h1><span class="sub">連續記錄 ' + xi.streak + ' 天</span></div>';
  h += '<div class="card pet-hero"><div class="bubble" style="align-self:stretch;text-align:center">' + esc(V.greet || (V.greet = greeting())) + '</div><img src="' + petImg(m) + '" alt="麻糬">' +
    '<div style="font-family:Huninn;font-size:18px">Lv ' + xi.lv + ' ' + st.name + '</div><div class="stack" style="align-self:stretch;gap:4px"><div class="bar" style="height:10px"><i style="width:' + Math.round(xi.cur / xi.need * 100) + '%"></i></div>' +
    '<div class="between small"><span>EXP ' + xi.cur + ' / ' + xi.need + '</span><span>' + (nxt ? 'Lv ' + nxt.from + ' 成為' + nxt.name : '已是最高階段') + '</span></div></div></div>';
  h += '<div class="sec">升級之路</div><div class="grid4" style="gap:6px">' + STAGES.map(s => '<div class="stage' + (s.n === st.n ? ' on' : '') + (s.n > st.n ? ' lock' : '') + '">' + s.name + '<div>' + (s.to > 900 ? 'Lv ' + s.from + ' 以上' : 'Lv ' + s.from + ' 到 ' + s.to) + '</div></div>').join('') + '</div>';
  h += '<div class="card mt grid2" style="gap:6px 12px;font-size:13px"><span>記錄一餐　+10</span><span>喝一次水　+5</span><span>運動一次　+15</span><span>量體重　+10</span><span>斷食完成　+10</span><span>每連續 3 天　+20</span></div>';
  h += '<p class="small center mt">累積經驗值 ' + xi.xp + '　最長連續 ' + xi.best + ' 天</p>';
  return h;
}

/* ========== 設定 ========== */
function vSettings() {
  const s = S.settings; const t = calcTargets(); const o = s.override || {};
  let h = backBar('個人設定');
  h += '<div class="card" style="padding:4px 16px">' +
    '<div class="field"><span>性別</span><span class="row"><button class="chip' + (s.sex === 'female' ? ' on' : '') + '" data-act="set" data-k="sex" data-v="female">女</button><button class="chip' + (s.sex === 'male' ? ' on' : '') + '" data-act="set" data-k="sex" data-v="male">男</button></span></div>' +
    fieldNum('birthYear', '出生年（西元）', s.birthYear, '例如 1990') + fieldNum('height', '身高 cm', s.height, '身高') + fieldNum('weight', '起始體重 kg', s.weight, '體重') + fieldNum('goalWeight', '目標體重 kg', s.goalWeight, '目標') + '</div>';
  h += '<div class="sec">平常的活動量</div><div class="grid3">' + [['sit', '久坐', '大多坐著'], ['light', '輕度', '常走動'], ['mid', '中度', '站立工作']].map(a => '<button class="btn ' + ((s.activity || 'sit') === a[0] ? 'btn-dark' : 'btn-ghost') + ' tall" style="min-height:56px;font-size:14px" data-act="set" data-k="activity" data-v="' + a[0] + '">' + a[1] + '<small>' + a[2] + '</small></button>').join('') + '</div>';
  h += '<div class="sec">減重速度</div><div class="grid2">' + [[0.25, '慢慢來　每週 0.25 kg'], [0.5, '穩穩的　每週 0.5 kg']].map(a => '<button class="btn ' + ((Number(s.speed) || 0.5) === a[0] ? 'btn-dark' : 'btn-ghost') + '" style="font-size:13px" data-act="set" data-k="speed" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
  h += '<div class="sec">每日目標（自動算出，想改可以直接填）</div><div class="card" style="padding:4px 16px">' +
    fieldNum('o.kcal', '熱量 大卡', o.kcal, String(t.auto.kcal)) + fieldNum('o.protein', '蛋白質 g', o.protein, String(t.auto.protein)) + fieldNum('o.water', '喝水 mL', o.water, String(t.auto.water)) + fieldNum('o.exercise', '運動 分鐘', o.exercise, String(t.auto.exercise)) + '</div>';
  if (!profileReady()) h += '<p class="small">填完性別、出生年、身高與體重後，熱量會依你的狀況計算。</p>';
  h += '<div class="sec">168 斷食</div><div class="card" style="padding:4px 16px"><div class="field"><span>使用斷食計時</span><span class="row"><button class="chip' + (s.fastOff ? '' : ' on') + '" data-act="set" data-k="fastOff" data-v="0">開</button><button class="chip' + (s.fastOff ? ' on' : '') + '" data-act="set" data-k="fastOff" data-v="1">關</button></span></div>' +
    '<div class="field"><span>進食窗口長度</span><select data-change="set-sel" data-k="windowHours" aria-label="進食窗口長度">' + [6, 8, 10].map(x => '<option value="' + x + '"' + (windowHours() === x ? ' selected' : '') + '>' + x + ' 小時（' + (24 - x) + ':' + x + '）</option>').join('') + '</select></div></div>';
  h += '<div class="sec">連線</div><div class="card stack"><div class="small">' + (isDemo() ? '目前是試玩模式，資料只存在這支手機。' : '已連到你的 Google 試算表。') + '</div><button class="btn btn-ghost" data-act="reconnect">' + (isDemo() ? '改成正式連線' : '重新設定網址或通行碼') + '</button></div>';
  h += '<p class="small center mt2">麻糬健康冒險 v1.0</p>';
  return h;
}
function fieldNum(k, label, v, ph) { return '<label class="field"><span>' + label + '</span><input type="number" inputmode="decimal" data-change="set-num" data-k="' + k + '" value="' + (v == null ? '' : esc(v)) + '" placeholder="' + esc(ph) + '"></label>'; }
async function saveSettings(patch) {
  const s = JSON.parse(JSON.stringify(S.settings));
  Object.keys(patch).forEach(k => { if (k.indexOf('o.') === 0) { s.override = s.override || {}; const kk = k.slice(2); if (patch[k] === '' || patch[k] == null) delete s.override[kk]; else s.override[kk] = patch[k]; } else if (patch[k] === '' || patch[k] == null) delete s[k]; else s[k] = patch[k]; });
  try { await api('setSettings', { settings: s }); } catch (e) { failSave(e); render(); return; }
  S.settings = s; cacheNow(); render();
}

/* ========== 底部面板 ========== */
function openSheet(html) { $('#sheet-root').innerHTML = '<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div></div>'; }
function closeSheet() { $('#sheet-root').innerHTML = ''; V.sheet = null; }
function sheetTime(key) { return timePicker(key); }

function openWeight() {
  V.wAt = nowLocal();
  const last = latestWeight();
  openSheet('<div class="h2">記錄體重</div><p class="small">不一定每天量，看長期趨勢就好</p>' +
    '<div class="row mt"><input id="wt" class="input" type="number" inputmode="decimal" step="0.1" value="' + (last || '') + '" placeholder="體重" style="font-size:24px;text-align:center"><span>kg</span></div>' +
    '<div class="mt" id="wt-time">' + sheetTime('wAt') + '</div><button class="btn btn-rose btn-big btn-block mt" data-act="weight-save">存檔 +10 EXP</button>');
}
function openRecEdit(id) {
  const r = S.records.find(x => x.id === id); if (!r) return;
  V.sheet = { id }; V.eAt = r.at;
  let body = '';
  if (r.type === 'water') body = '<label class="small">水量 mL</label><input id="e-val" class="input" type="number" inputmode="numeric" value="' + r.data.ml + '">';
  if (r.type === 'weight') body = '<label class="small">體重 kg</label><input id="e-val" class="input" type="number" inputmode="decimal" step="0.1" value="' + r.data.kg + '">';
  if (r.type === 'exercise') body = '<div class="small">' + esc(r.data.label) + '，' + LEVELS[(r.data.level || 2) - 1].b + '</div><label class="small">分鐘</label><input id="e-val" class="input" type="number" inputmode="numeric" value="' + r.data.minutes + '">';
  if (r.type === 'fast') body = '<div class="small">斷食 ' + r.data.hours + ' 小時（' + whenLabel(r.data.start) + ' 到 ' + whenLabel(r.data.end) + '）</div>';
  openSheet('<div class="h2">修改紀錄</div><div class="stack mt">' + body + '<div id="e-time">' + (r.type === 'fast' ? '' : sheetTime('eAt')) + '</div></div>' +
    (r.type === 'fast' ? '' : '<button class="btn btn-rose btn-big btn-block mt" data-act="rec-save">儲存修改</button>') + '<button class="btn btn-ghost btn-block mt danger" data-act="rec-del">刪除這筆</button>');
}
function openOther() {
  openSheet('<div class="h2">其他運動</div><div class="grid2 mt">' + ['bike', 'stairs', 'weights', 'swim', 'chores'].map(k => '<button class="btn btn-gsoft" data-act="ex-pick" data-v="' + k + '">' + EX[k].label + '</button>').join('') + '</div>' +
    '<label class="small mt" style="display:block" for="ex-custom">都不是？自己輸入</label><div class="row" style="margin-top:6px"><input id="ex-custom" class="input" placeholder="例如：跳舞" value="' + esc(V.custom || '') + '"><button class="btn btn-green" data-act="ex-pick-custom">好</button></div>');
}
function openFastTime(mode) {
  V.fAt = nowLocal(); V.fMode = mode;
  openSheet('<div class="h2">' + (mode === 'eat' ? '什麼時候開始吃的？' : '最後一口是什麼時候？') + '</div><div class="mt" id="f-time">' + sheetTime('fAt') + '</div><button class="btn btn-dark btn-big btn-block mt" data-act="fast-sheet-ok">確定</button>');
}
function refreshSheetTime(key) {
  const map = { wAt: 'wt-time', eAt: 'e-time', fAt: 'f-time' };
  const el = map[key] && document.getElementById(map[key]);
  if (el) el.innerHTML = sheetTime(key); else render();
}

/* 升級慶祝 */
function showCelebrate() {
  const c = S.celebrate; S.celebrate = null;
  const st = stageOf(c.lv);
  const div = document.createElement('div'); div.className = 'celebrate'; div.setAttribute('role', 'dialog');
  div.innerHTML = '<div class="box"><img src="img/lv' + st.n + '_happy.webp" alt="開心的麻糬"><h2 class="h1">' + (c.stageUp ? '麻糬變成' + st.name + '了！' : '升級了！Lv ' + c.lv) + '</h2><p class="sub">' + (c.stageUp ? '換上新裝備，冒險進入新的地圖' : '謝謝你一直陪著我') + '</p><button class="btn btn-rose btn-big" style="min-width:160px">太好了</button></div>';
  div.addEventListener('click', () => div.remove());
  document.body.appendChild(div);
}

/* ========== 互動事件 ========== */
const A = {};
A['setup-go'] = async () => {
  const url = $('#su-url').value.trim(), pass = $('#su-pass').value.trim();
  if (!/^https:\/\/script\.google\.com\//.test(url)) return toast('網址要是 https://script.google.com/ 開頭喔');
  if (!pass) return toast('請輸入通行碼');
  LS.set('api', url); LS.set('pass', pass);
  try { const d = await api('load'); applyData(d); go('home'); render(); toast('連線成功！'); }
  catch (e) { LS.del('pass'); toast(e.code === 'auth' ? '通行碼不對' : (e instanceof OfflineError ? '連不上，請確認網址和網路' : e.message)); }
};
A['setup-demo'] = async () => { LS.set('api', 'demo'); const d = await api('load'); applyData(d); go('home'); render(); };
A['reconnect'] = () => { if (!confirm('要重新設定連線嗎？')) return; LS.del('pass'); LS.del('cache'); if (isDemo()) LS.del('api'); S.loaded = false; render(); };
A['tp-now'] = el => { V[el.dataset.k] = nowLocal(); refreshSheetTime(el.dataset.k); };
A['tp-yday'] = el => { const cur = parseLocal(V[el.dataset.k] || nowLocal()); const y = addDays(new Date(), -1); y.setHours(cur.getHours(), cur.getMinutes(), 0, 0); V[el.dataset.k] = toLocal(y); refreshSheetTime(el.dataset.k); };
A['sheet-bg'] = (el, e) => { if (e.target === el) closeSheet(); };

A['water-quick'] = async el => { const at = nowLocal(); await saveRecord({ id: uid(), type: 'water', at, data: { ml: Number(el.dataset.ml) } }); V.greet = null; render(); };
A['water-add'] = async el => { await saveRecord({ id: uid(), type: 'water', at: V.at || nowLocal(), data: { ml: Number(el.dataset.ml) } }); render(); };
A['water-custom'] = async () => { const v = Number($('#w-custom').value); if (!(v > 0 && v < 5000)) return toast('請輸入水量'); await saveRecord({ id: uid(), type: 'water', at: V.at || nowLocal(), data: { ml: Math.round(v) } }); render(); };

A['weight-open'] = () => openWeight();
A['weight-save'] = async () => { const v = Number($('#wt').value); if (!(v > 20 && v < 300)) return toast('請輸入體重'); const ok = await saveRecord({ id: uid(), type: 'weight', at: V.wAt || nowLocal(), data: { kg: round(v, 1) } }); if (ok) { closeSheet(); render(); } };

A['rec-edit'] = el => openRecEdit(el.dataset.id);
A['rec-save'] = async () => {
  const r = S.records.find(x => x.id === V.sheet.id); if (!r) return closeSheet();
  const n = JSON.parse(JSON.stringify(r)); n.at = V.eAt || r.at; const v = Number($('#e-val').value);
  if (r.type === 'water') { if (!(v > 0)) return toast('請輸入水量'); n.data.ml = Math.round(v); }
  if (r.type === 'weight') { if (!(v > 20)) return toast('請輸入體重'); n.data.kg = round(v, 1); }
  if (r.type === 'exercise') { if (!(v > 0)) return toast('請輸入分鐘'); n.data.minutes = Math.round(v); n.data.kcal = exKcal(n.data.kind, n.data.level || 2, n.data.minutes); }
  if (await saveRecord(n)) { closeSheet(); render(); }
};
A['rec-del'] = async () => { if (!confirm('確定刪除這筆紀錄？')) return; if (await deleteRecord(V.sheet.id)) { closeSheet(); render(); } };

A['ex-kind'] = el => { V.kind = el.dataset.v; render(); };
A['ex-other'] = () => openOther();
A['ex-pick'] = el => { V.kind = el.dataset.v; closeSheet(); render(); };
A['ex-pick-custom'] = () => { const v = $('#ex-custom').value.trim(); if (!v) return toast('請輸入運動名稱'); V.kind = 'custom'; V.custom = v.slice(0, 20); closeSheet(); render(); };
A['ex-min'] = el => { V.min = Number(el.dataset.v); V.minCustom = false; render(); };
A['ex-level'] = el => { V.level = Number(el.dataset.v); render(); };
A['ex-save'] = async () => {
  if (!(V.min > 0 && V.min <= 600)) return toast('請選擇運動時間');
  const label = V.kind === 'custom' ? (V.custom || '其他運動') : EX[V.kind].label;
  if (await saveRecord({ id: uid(), type: 'exercise', at: V.at || nowLocal(), data: { kind: V.kind, label, minutes: V.min, level: V.level, kcal: exKcal(V.kind, V.level, V.min) } })) { V.at = nowLocal(); render(); }
};

A['meal-mode'] = el => { V.mode = el.dataset.m; render(); };
A['meal-analyze'] = async () => {
  const txt = V.mode === 'text' ? (V.text || '').trim() : (V.note || '').trim();
  if (V.mode === 'text' && !txt) return toast('先描述一下吃了什麼喔');
  if (V.mode === 'photo' && !V.img) return toast('先拍一張照片喔');
  V.busy = true; render();
  try {
    const payload = { text: txt };
    if (V.mode === 'photo') { payload.image = V.img.split(',')[1]; payload.mime = 'image/jpeg'; }
    const d = await api('analyze', payload);
    V.result = cleanResult(d.result); V.at = V.at || nowLocal();
  } catch (e) {
    toast(e instanceof OfflineError ? '沒有網路，稍後再記喔' : ('AI 估算失敗：' + (e.message || '請稍後再試')));
  }
  V.busy = false; render();
};
A['meal-type'] = el => { V.meal = el.dataset.v; render(); };
A['item-mult'] = el => { V.result.items[Number(el.dataset.i)].mult = Number(el.dataset.v); render(); };
A['item-del'] = el => { V.result.items.splice(Number(el.dataset.i), 1); if (!V.result.items.length) V.result.items.push({ name: '餐點', portion: '', kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, mult: 1 }); render(); };
A['item-add'] = () => { V.result.items.push({ name: '新品項', portion: '', kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, mult: 1 }); render(); };
A['meal-reset'] = () => { V = { init: true, mode: V.mode, at: nowLocal(), addFav: true }; render(); };
A['meal-save'] = async () => {
  const R = V.result; if (!R) return;
  const data = { meal: V.meal, name: R.name || '餐點', store: V.store || '', items: R.items, comment: R.comment || '' };
  const rec = { id: V.editId || uid(), type: 'meal', at: V.at || nowLocal(), data };
  const ok = await saveRecord(rec);
  if (!ok) return;
  if (V.addFav && !V.editId) {
    const fav = { id: uid(), name: data.name, store: data.store, items: data.items.map(i => Object.assign({}, i)) };
    try { await api('saveFav', { fav }); S.favs.push(fav); cacheNow(); } catch (e) { /* 常用清單失敗不影響紀錄 */ }
  }
  go('home');
};
A['meal-delete'] = async () => { if (!confirm('確定刪除這一餐？')) return; if (await deleteRecord(V.editId)) go('home'); };
A['edit-meal'] = el => nav('meal', { editId: el.dataset.id });
A['fav-use'] = el => { const f = S.favs.find(x => x.id === el.dataset.id); if (!f) return; V.result = { name: f.name, items: JSON.parse(JSON.stringify(f.items)), comment: '' }; V.store = f.store || ''; V.addFav = false; V.at = nowLocal(); V.meal = mealTypeFor(V.at); render(); };
A['fav-del'] = async el => { if (!confirm('從常用清單移除？')) return; try { await api('delFav', { id: el.dataset.id }); } catch (e) { return failSave(e); } S.favs = S.favs.filter(f => f.id !== el.dataset.id); cacheNow(); render(); };

A['fast-start'] = () => openFastTime('fast');
A['fast-done'] = () => openFastTime('fast');
A['fast-eat'] = () => openFastTime('eat');
A['fast-confirm'] = async el => { if (await setFast({ mode: 'fasting', since: el.dataset.at })) { toast(cheer('fastStart')); render(); } };
A['fast-sheet-ok'] = async () => {
  const at = V.fAt || nowLocal();
  if (V.fMode === 'eat') {
    const fs = fastState(); let rec = null;
    if (fs && fs.mode === 'fasting') {
      if (at <= fs.since) return toast('開始吃的時間要在斷食開始之後喔');
      const hours = round((parseLocal(at) - parseLocal(fs.since)) / 3600000, 1);
      rec = { id: uid(), type: 'fast', at, data: { start: fs.since, end: at, hours } };
      if (hours < 12) rec = null; // 太短不算一次斷食
    }
    const before = xpInfo();
    if (await setFast({ mode: 'eating', since: at }, rec)) {
      closeSheet();
      if (rec) { S.justSaved = Date.now(); const after = xpInfo(); if (after.lv > before.lv) S.celebrate = { lv: after.lv, stageUp: stageOf(after.lv).n > stageOf(before.lv).n }; toast(cheer('fast', '斷食 ' + rec.data.hours + ' 小時！') + '　+' + (after.xp - before.xp) + ' EXP'); }
      else toast('開始進食，記得細嚼慢嚥喔');
      render();
    }
  } else {
    if (await setFast({ mode: 'fasting', since: at })) { closeSheet(); toast(cheer('fastStart')); render(); }
  }
};

A['rep-range'] = el => { V.range = Number(el.dataset.v); render(); };
A['set'] = el => { const k = el.dataset.k; let v = el.dataset.v; if (k === 'speed') v = Number(v); if (k === 'fastOff') v = v === '1'; saveSettings({ [k]: v }); };

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const f = A[el.dataset.act]; if (!f) return;
  if (el.tagName === 'A') e.preventDefault();
  f(el, e);
});

/* 輸入變更 */
const C = {};
C['tp-set'] = el => { if (!el.value) return; let v = el.value.slice(0, 16); if (v > nowLocal()) v = nowLocal(); V[el.dataset.k] = v; refreshSheetTime(el.dataset.k); };
C['meal-file'] = async el => { const f = el.files && el.files[0]; if (!f) return; try { V.img = await compressImage(f); } catch (e) { toast(e.message); } render(); };
C['meal-note'] = el => { V.note = el.value; };
C['meal-text'] = el => { V.text = el.value; };
C['meal-store'] = el => { V.store = el.value.trim(); };
C['meal-name'] = el => { V.result.name = el.value.trim(); };
C['meal-fav'] = el => { V.addFav = el.checked; };
C['item-name'] = el => { V.result.items[Number(el.dataset.i)].name = el.value.trim() || '品項'; };
C['item-kcal'] = el => {
  const it = V.result.items[Number(el.dataset.i)]; const m = it.mult == null ? 1 : it.mult; const v = Math.max(0, Number(el.value) || 0);
  const old = it.kcal * m;
  if (old > 0) { const ratio = v / old; ['protein', 'carbs', 'fat', 'fiber', 'sodium', 'sugar'].forEach(k => { it[k] = (Number(it[k]) || 0) * ratio; }); }
  it.kcal = m ? v / m : v; render();
};
C['ex-min-custom'] = el => { const v = Math.round(Number(el.value)); if (v > 0) { V.min = v; V.minCustom = true; render(); } };
C['rep-day'] = el => { if (el.value) { V.day = el.value; render(); } };
C['set-num'] = el => { const v = el.value === '' ? '' : Number(el.value); saveSettings({ [el.dataset.k]: v }); };
C['set-sel'] = el => { saveSettings({ [el.dataset.k]: Number(el.value) }); };
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (!el) return; const f = C[el.dataset.change]; if (f) f(el, e); });
// 文字輸入即時記住（避免重畫時遺失）
document.addEventListener('input', e => { const el = e.target; if (el.dataset && (el.dataset.change === 'meal-text' || el.dataset.change === 'meal-note')) C[el.dataset.change](el); });

/* 每分鐘更新首頁時間 */
setInterval(() => { if ((route || 'home') === 'home' && S.loaded && !$('#sheet-root').innerHTML && document.activeElement === document.body) render(); }, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.loaded && !isDemo()) refresh(); });

/* ========== 啟動 ========== */
async function refresh() {
  try { const d = await api('load'); applyData(d); if (!$('#sheet-root').innerHTML) render(); }
  catch (e) { if (e.code === 'auth') { LS.del('pass'); S.loaded = false; render(); toast('通行碼不對，請重新輸入'); } else if (!S.loaded) { toast(e instanceof OfflineError ? '目前沒有網路，先顯示上次的資料' : e.message); } }
}
function boot() {
  route = location.hash.slice(1);
  if (apiUrl() && (isDemo() || passcode())) {
    const c = LS.get('cache', null);
    if (c) applyData(c);
    render(); refresh();
  } else render();
}
window.__mochi = { S, xpInfo, calcTargets, dayStats, mealTotals, exKcal, stageOf };
boot();
})();
