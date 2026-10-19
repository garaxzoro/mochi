/**
 * 麻糬健康冒險 後端（Google Apps Script）
 *
 * 使用方式：
 * 1. 在 Google 試算表中選「擴充功能 > Apps Script」，把這整份貼上取代原本內容。
 * 2. 左側「專案設定」最下面的「指令碼屬性」新增兩個屬性：
 *      PASSCODE    你的通行碼
 *      GEMINI_KEY  你在 Google AI Studio 申請的 API 金鑰
 *    （選填）GEMINI_MODEL  想指定的模型名稱，不填會自動使用 Flash 系列
 * 3. 右上角「部署 > 新增部署作業 > 網頁應用程式」，
 *    執行身分選「我」，存取權選「所有人」，部署後複製網址貼到 App。
 */

var SHEET_RECORDS = '紀錄';
var SHEET_FAVS = '常用餐點';
var SHEET_SETTINGS = '設定';
var TYPE_NAME = { water: '喝水', exercise: '運動', meal: '餐點', weight: '體重', fast: '斷食' };

function doGet() {
  return ContentService.createTextOutput('麻糬後端運作中，請從 App 連線。');
}

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var pass = PropertiesService.getScriptProperties().getProperty('PASSCODE');
    if (!pass) throw err_('還沒設定通行碼（指令碼屬性 PASSCODE）', 'setup');
    if (String(req.pass) !== String(pass)) throw err_('通行碼不對', 'auth');
    out = route_(req);
    out.ok = true;
  } catch (x) {
    out = { ok: false, error: x.message || String(x), code: x.code || 'error' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function err_(msg, code) { var e = new Error(msg); e.code = code; return e; }

function route_(req) {
  switch (req.action) {
    case 'load': return { settings: getSettings_(), records: getRecords_(), favorites: getFavs_() };
    case 'save': return withLock_(function () { return { record: saveRecord_(req.record) }; });
    case 'del': return withLock_(function () { deleteRow_(SHEET_RECORDS, req.id); return {}; });
    case 'setSettings': return withLock_(function () { setSettings_(req.settings || {}); return {}; });
    case 'saveFav': return withLock_(function () { saveFav_(req.fav); return {}; });
    case 'delFav': return withLock_(function () { deleteRow_(SHEET_FAVS, req.id); return {}; });
    case 'analyze': return { result: analyzeMeal_(req.text || '', req.image || '', req.mime || 'image/jpeg') };
    default: throw err_('未知的動作：' + req.action, 'bad');
  }
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- 試算表 ---------- */
function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (name === SHEET_RECORDS) sh.appendRow(['id', '類型', '時間', '摘要', '資料', '更新時間']);
    if (name === SHEET_FAVS) sh.appendRow(['id', '名稱', '店家', '熱量', '資料']);
    if (name === SHEET_SETTINGS) sh.appendRow(['key', 'value']);
    sh.setFrozenRows(1);
    if (name === SHEET_RECORDS) { sh.setColumnWidth(4, 260); sh.setColumnWidth(5, 120); }
  }
  return sh;
}

/** 第一次可以手動執行這個函式，建立三個工作表並授權 */
function setup() {
  sheet_(SHEET_RECORDS); sheet_(SHEET_FAVS); sheet_(SHEET_SETTINGS);
  var p = PropertiesService.getScriptProperties();
  Logger.log('PASSCODE ' + (p.getProperty('PASSCODE') ? '已設定' : '尚未設定'));
  Logger.log('GEMINI_KEY ' + (p.getProperty('GEMINI_KEY') ? '已設定' : '尚未設定'));
}

function getRecords_() {
  var sh = sheet_(SHEET_RECORDS);
  var n = sh.getLastRow(); if (n < 2) return [];
  var rows = sh.getRange(2, 1, n - 1, 5).getValues();
  var out = [];
  rows.forEach(function (r) {
    if (!r[0]) return;
    var data = {}; try { data = JSON.parse(r[4] || '{}'); } catch (x) { }
    out.push({ id: String(r[0]), type: String(r[1]), at: atString_(r[2]), data: data });
  });
  return out;
}

function atString_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm");
  }
  return String(v).slice(0, 16);
}

function findRow_(sh, id) {
  var n = sh.getLastRow(); if (n < 2) return 0;
  var f = sh.getRange(2, 1, n - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}

function saveRecord_(rec) {
  if (!rec || !rec.id || !rec.type || !rec.at) throw err_('紀錄資料不完整', 'bad');
  var sh = sheet_(SHEET_RECORDS);
  // 時間前面加 ' 讓試算表保持文字，避免時區自動轉換
  var row = [String(rec.id), TYPE_NAME[rec.type] ? rec.type : rec.type, "'" + rec.at, summary_(rec), JSON.stringify(rec.data || {}), new Date()];
  var r = findRow_(sh, rec.id);
  if (r) sh.getRange(r, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return rec;
}

function summary_(rec) {
  var d = rec.data || {};
  switch (rec.type) {
    case 'water': return '喝水 ' + d.ml + ' mL';
    case 'weight': return '體重 ' + d.kg + ' kg';
    case 'exercise': return (d.label || '運動') + ' ' + d.minutes + ' 分鐘，約 ' + d.kcal + ' 大卡';
    case 'fast': return '斷食 ' + d.hours + ' 小時';
    case 'meal':
      var k = 0; (d.items || []).forEach(function (i) { k += (Number(i.kcal) || 0) * (i.mult == null ? 1 : Number(i.mult)); });
      return (d.meal || '') + ' ' + (d.name || '') + (d.store ? '（' + d.store + '）' : '') + ' 約 ' + Math.round(k) + ' 大卡';
  }
  return rec.type;
}

function deleteRow_(name, id) {
  var sh = sheet_(name); var r = findRow_(sh, id);
  if (r) sh.deleteRow(r);
}

function getSettings_() {
  var sh = sheet_(SHEET_SETTINGS); var n = sh.getLastRow(); if (n < 2) return {};
  var rows = sh.getRange(2, 1, n - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) if (rows[i][0] === 'settings') { try { return JSON.parse(rows[i][1]); } catch (x) { return {}; } }
  return {};
}

function setSettings_(s) {
  var sh = sheet_(SHEET_SETTINGS); var r = findRow_(sh, 'settings');
  var v = JSON.stringify(s);
  if (r) sh.getRange(r, 2).setValue(v); else sh.appendRow(['settings', v]);
}

function getFavs_() {
  var sh = sheet_(SHEET_FAVS); var n = sh.getLastRow(); if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 5).getValues().filter(function (r) { return r[0]; }).map(function (r) {
    var items = []; try { items = JSON.parse(r[4] || '[]'); } catch (x) { }
    return { id: String(r[0]), name: String(r[1]), store: String(r[2] || ''), items: items };
  });
}

function saveFav_(f) {
  if (!f || !f.id) throw err_('常用餐點資料不完整', 'bad');
  var sh = sheet_(SHEET_FAVS);
  var k = 0; (f.items || []).forEach(function (i) { k += (Number(i.kcal) || 0) * (i.mult == null ? 1 : Number(i.mult)); });
  var row = [String(f.id), f.name || '', f.store || '', Math.round(k), JSON.stringify(f.items || [])];
  var r = findRow_(sh, f.id);
  if (r) sh.getRange(r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}

/* ---------- Gemini 餐點估算 ---------- */
function analyzeMeal_(text, image, mime) {
  var p = PropertiesService.getScriptProperties();
  var key = p.getProperty('GEMINI_KEY');
  if (!key) throw err_('還沒設定 Gemini 金鑰（指令碼屬性 GEMINI_KEY）', 'setup');
  if (!text && !image) throw err_('沒有收到照片或文字', 'bad');

  var prompt = [
    '你是台灣的營養師助理，請估算使用者這一餐的熱量與營養素。',
    '使用者在台灣，常見外食如便當、自助餐、超商、早餐店、手搖飲、小吃，請依台灣常見份量估算。',
    image ? '請根據照片判斷食物品項與份量。' : '請根據文字描述判斷。',
    text ? '使用者補充說明：「' + text + '」，請優先採用這些資訊（例如只吃一半）。' : '',
    '把一餐拆成幾個主要品項，每個品項給出：name（繁體中文品名）、portion（份量描述，例如 1 碗、1 支、半份）、',
    'kcal（大卡）、protein（蛋白質 g）、carbs（碳水 g）、fat（脂肪 g）、fiber（膳食纖維 g）、sodium（鈉 mg）、sugar（糖 g），數字只填數值。',
    '另外給 name（整餐的簡短名稱，例如 雞腿便當）與 comment：用台灣繁體中文，以溫柔陪伴的語氣說一句 40 字以內的話，',
    '可以肯定優點，或溫和提醒鈉、糖、蛋白質，不要責備、不要說教、不要提到減重失敗。',
    '如果照片不是食物，items 回傳空陣列，comment 說明看不出是食物。',
    '只回傳 JSON，格式：{"name":"","items":[{"name":"","portion":"","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sodium":0,"sugar":0}],"comment":""}'
  ].join('\n');

  var parts = [{ text: prompt }];
  if (image) parts.push({ inline_data: { mime_type: mime, data: image } });
  var body = { contents: [{ role: 'user', parts: parts }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } };

  var models = [p.getProperty('GEMINI_MODEL'), 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'].filter(function (m, i, a) { return m && a.indexOf(m) === i; });
  var lastErr = '';
  for (var i = 0; i < models.length; i++) {
    var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent', {
      method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key },
      payload: JSON.stringify(body), muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 200) {
      var j = JSON.parse(res.getContentText());
      var txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function (x) { return x.text || ''; }).join('');
      txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      try { return JSON.parse(txt); } catch (x) { lastErr = 'AI 回覆格式不正確'; continue; }
    }
    if (code === 429) throw err_('今天的免費額度用完了，明天再試或改用常用清單', 'quota');
    if (code === 400 || code === 403) {
      var t = res.getContentText();
      if (/API key/i.test(t)) throw err_('Gemini 金鑰不正確，請檢查 GEMINI_KEY', 'setup');
    }
    lastErr = 'Gemini 錯誤代碼 ' + code;
  }
  throw err_(lastErr || 'AI 暫時無法使用', 'ai');
}

/** 測試 Gemini 金鑰：在編輯器選這個函式按「執行」，看執行記錄 */
function testGemini() {
  var r = analyzeMeal_('一個超商飯糰和一瓶無糖豆漿', '', '');
  Logger.log(JSON.stringify(r, null, 2));
}
