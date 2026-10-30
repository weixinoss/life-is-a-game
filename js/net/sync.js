/* ============================================================
 *  js/net/sync.js
 *  云端存档与对局生命周期
 *  ------------------------------------------------------------
 *  - 每 5 天自动上传一次存档（断点续命）
 *  - 开局上报 life.start，结局上报 life.end（含每日流水与案卷片段）
 *  - 断网/未登录时全部静默降级，只写 localStorage
 * ============================================================ */
(function (global) {
  'use strict';

  var NET = global.NET;

  var S = {
    lifeId: 0,
    seasonNo: 1,
    logs: [],          // 每日流水
    frags: [],         // 案卷片段候选
    altruistic: 0,     // 善举计数
    lastSaveDay: 0,
    started: false,
    dirty: false
  };

  var LOCAL_KEY = 'life_offline_save';

  function nowDay() {
    return (global.C && global.C.day) || 1;
  }

  function jobId() {
    return global.C && global.C.job ? global.C.job.id : '';
  }

  function jobName() {
    return global.C && global.C.job ? global.C.job.n : '';
  }

  /** 生成可上传的状态快照（只取纯数据字段） */
  function snapshot() {
    var C = global.C;
    if (!C) { return null; }
    return {
      jobId: jobId(),
      jobName: jobName(),
      started: !!C.started,
      season: C.season || 0,
      day: C.day || 1,
      money: C.money || 0,
      stamina: C.stamina || 0,
      staminaMax: C.staminaMax || 100,
      spirit: C.spirit || 0,
      spiritMax: C.spiritMax || 100,
      face: C.face || 0,
      rating: C.rating || 0,
      pos: C.pos || 0,
      weather: C.weather || 'sunny',
      weatherTmr: C.weatherTmr || 0,
      dignity: C.dignity || 0,
      over: !!C.over,
      usedEv: Array.isArray(C.usedEv) ? C.usedEv.slice(-26) : [],
      runStart: C.runStart || 1,
      moonUsed: C.moonUsed || false,
      at: Date.now()
    };
  }

  function toLocal(snap) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(snap)); } catch (e) {}
  }

  function fromLocal() {
    try {
      var s = localStorage.getItem(LOCAL_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  // ------------------------------------------------------------
  // 开局
  // ------------------------------------------------------------
  function startLife() {
    S.lifeId = 0;
    S.logs = [];
    S.frags = [];
    S.altruistic = 0;
    S.lastSaveDay = 0;
    S.started = true;
    S.dirty = false;

    if (!NET || !NET.isLoggedIn() || NET.status.online === false) {
      return Promise.resolve(null);
    }
    return NET.req('life.start', { job: jobId(), job_name: jobName() }).then(function (d) {
      S.lifeId = d.life_id;
      S.seasonNo = d.season_no;
      // 三世账本：把前世因果分加进开局资金
      if (d.inherit_money > 0 && global.C) {
        global.C.money += d.inherit_money;
        if (typeof global.en === 'function') { global.en(['money']); }
        if (global.Session) { global.Session.toast(d.inherit_note, false); }
      }
      return d;
    }).catch(function () {
      return null;
    });
  }

  // ------------------------------------------------------------
  // 每日流水
  // ------------------------------------------------------------
  function pushDay(entry) {
    if (!S.started) { return; }
    var C = global.C || {};
    var rec = {
      day: entry.day != null ? entry.day : C.day || 0,
      season: C.season || 0,
      weather: C.weather || '',
      pos: C.pos || 0,
      money: C.money || 0,
      stamina: C.stamina || 0,
      spirit: C.spirit || 0,
      face: C.face || 0,
      card_id: entry.cardId || '',
      opt_idx: entry.optIdx != null ? entry.optIdx : -1
    };
    // 同一天先记"到达格子"、再记"选了哪个选项"，合并成一条
    var last = S.logs[S.logs.length - 1];
    if (last && last.day === rec.day) {
      last.card_id = rec.card_id || last.card_id;
      last.opt_idx = rec.opt_idx >= 0 ? rec.opt_idx : last.opt_idx;
      last.money = rec.money;
      last.stamina = rec.stamina;
      last.spirit = rec.spirit;
      last.face = rec.face;
      last.pos = rec.pos;
    } else {
      S.logs.push(rec);
      if (S.logs.length > 400) { S.logs.shift(); }
    }

    var delta = entry.moneyDelta || 0;
    if (entry.cardId && Math.abs(delta) >= 200) {
      S.frags.push({
        w: Math.abs(delta),
        text: '第 ' + (entry.day || C.day) + ' 天，' + entry.cardId +
              (entry.optText ? ' —— 你选择了「' + entry.optText + '」。' : '')
      });
      S.frags.sort(function (a, b) { return b.w - a.w; });
      if (S.frags.length > 12) { S.frags.length = 12; }
    }
    S.dirty = true;
  }

  function markAltruistic() {
    S.altruistic++;
  }

  // ------------------------------------------------------------
  // 存档
  // ------------------------------------------------------------
  function saveNow(force) {
    var C = global.C;
    if (!C || !C.started || !S.started) { return Promise.resolve(false); }
    var day = nowDay();
    if (!force && day - S.lastSaveDay < 5) { return Promise.resolve(false); }
    S.lastSaveDay = day;

    var snap = snapshot();
    if (!snap) { return Promise.resolve(false); }
    toLocal(snap);

    if (!NET || !NET.isLoggedIn() || NET.status.online === false) {
      return Promise.resolve(false);
    }
    return NET.req('save.put', { state: snap, day: day }, { timeout: 6000, silent: true })
      .then(function () { S.dirty = false; return true; })
      .catch(function () { return false; });
  }

  // ------------------------------------------------------------
  // 结局
  // ------------------------------------------------------------
  function endLife(score, ending) {
    var C = global.C;
    if (!C || !S.started) { return Promise.resolve(null); }
    S.started = false;

    var snap = snapshot();
    if (snap) { toLocal(snap); }

    if (!NET || !NET.isLoggedIn() || NET.status.online === false || !S.lifeId) {
      return Promise.resolve(null);
    }

    var frags = S.frags.slice(0, 6).map(function (f) { return f.text; });
    var payload = {
      life_id: S.lifeId,
      day: C.day || 0,
      money: Math.round(C.money || 0),
      rating: C.rating || 0,
      score: Math.max(0, Math.round(score || 0)),
      ending: ending || '',
      dignity_low: C.dignity || 0,
      karma_cnt: S.altruistic,
      relic_key: pickRelicKey(),
      province: currentProvince(),
      logs: S.logs.slice(-400),
      fragments: frags
    };
    return NET.req('life.end', payload, { timeout: 12000 }).catch(function () { return null; });
  }

  /** 结局时按"最常做的事"挑一件遗物 */
  function pickRelicKey() {
    var C = global.C || {};
    var keys = ['thermos', 'gloves', 'receipt', 'key', 'photos', 'phone', 'notebook', 'uniform',
      'candy', 'umbrella', 'card', 'lighter', 'letter', 'shoes', 'coin', 'pillbox',
      'menu', 'ticket', 'tape', 'mirror', 'chair', 'alarm', 'cup', 'blanket'];
    var idx = Math.abs(Math.round((C.money || 0) + (C.day || 1) * 7 + (C.dignity || 0) * 13)) % keys.length;
    return keys[idx];
  }

  /** 当前停留地标所属省份（用于省份榜），取不到就留空 */
  function currentProvince() {
    try {
      var C = global.C || {};
      if (typeof global.cs !== 'undefined' && global.cs && global.cs.length) {
        var hit = global.cs[Math.round((C.pos || 0) * global.cs.length / 90) % global.cs.length];
        if (hit && hit.l) { return String(hit.l); }
      }
    } catch (e) {}
    return '';
  }

  // ------------------------------------------------------------
  // 恢复（断点续命）
  // ------------------------------------------------------------
  function hasLocalSave() {
    var s = fromLocal();
    return !!(s && s.started && !s.over && (s.day || 1) > 1);
  }

  function localSaveInfo() {
    var s = fromLocal();
    if (!s) { return null; }
    return { day: s.day, jobName: s.jobName, money: s.money, season: s.season };
  }

  /**
   * 把快照写回游戏状态并跳过选身份。
   * 用 try/catch 包住所有游戏内部调用 —— 版本不一致时宁可从新开一局，也不能白屏。
   */
  function restore(snap) {
    if (!snap) { return false; }
    var C = global.C;
    if (!C) { return false; }
    try {
      var jobs = global.vn || [];
      var job = null;
      for (var i = 0; i < jobs.length; i++) {
        if (jobs[i].id === snap.jobId) { job = jobs[i]; break; }
      }
      if (!job) { return false; }

      C.job = job;
      C.money = snap.money;
      C.stamina = snap.stamina;
      C.staminaMax = snap.staminaMax;
      C.spirit = snap.spirit;
      C.spiritMax = snap.spiritMax;
      C.face = snap.face;
      C.rating = snap.rating;
      C.day = snap.day;
      C.season = snap.season;
      C.pos = snap.pos;
      C.weather = snap.weather;
      C.weatherTmr = snap.weatherTmr || 0;
      C.dignity = snap.dignity || 0;
      C.usedEv = snap.usedEv || [];
      C.runStart = snap.runStart || snap.day;
      C.moonUsed = snap.moonUsed || false;
      C.busy = false;
      C.pending = false;
      C.chosen = false;
      C.over = false;
      C.started = true;

      if (typeof global.wu === 'function') { global.wu(); }
      if (typeof global.ba === 'function') { global.ba(); }
      if (typeof global.en === 'function') { global.en(); }
      if (typeof global._u === 'function') { global._u(); }
      if (typeof global.ls === 'function' && global.xe) {
        global.xe.position.copy(global.ls(C.pos));
      }
      var pick = document.getElementById('pick');
      if (pick) {
        pick.classList.add('hide');
        pick.style.display = 'none';
      }
      var roll = document.getElementById('rollBtn');
      if (roll) { roll.removeAttribute('disabled'); }
      S.started = true;
      S.lifeId = 0;
      S.lastSaveDay = C.day;
      return true;
    } catch (e) {
      console.warn('[Sync] 恢复存档失败，将从新开始', e);
      return false;
    }
  }

  /** 登录后尝试拉云端存档 */
  function pullCloud() {
    if (!NET || !NET.isLoggedIn()) { return Promise.resolve(null); }
    return NET.req('save.get', {}, { timeout: 6000, silent: true })
      .then(function (d) {
        if (d && d.state && d.state.started && !d.state.over && (d.state.day || 1) > 1) {
          return d.state;
        }
        return null;
      })
      .catch(function () { return null; });
  }

  global.Sync = {
    S: S,
    startLife: startLife,
    pushDay: pushDay,
    markAltruistic: markAltruistic,
    saveNow: saveNow,
    endLife: endLife,
    restore: restore,
    hasLocalSave: hasLocalSave,
    localSaveInfo: localSaveInfo,
    fromLocal: fromLocal,
    pullCloud: pullCloud,
    snapshot: snapshot
  };
})(typeof window !== 'undefined' ? window : this);
