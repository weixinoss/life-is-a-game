/* ============================================================
 *  js/life/96-run-mod.js
 *  局外与全局：命运卡组 / 每日一命 / 全服善恶天平 / 因果债
 *  ------------------------------------------------------------
 *  四条玩法都在"一局"的边界上：
 *    命运卡组   —— 开局前，给这一世定个基调
 *    每日一命   —— 全服同一副牌，比谁活得久
 *    善恶天平   —— 全服所有人的善恶加起来，决定天道偏向哪边
 *    因果债     —— 你欠下的事，会落到另一个真实玩家头上
 *
 *  同样只用包装，不改原模块。
 * ============================================================ */

(function (global) {
  'use strict';

  var C = global.C;
  if (!C) { return; }
  var doc = document;
  function el(id) { return doc.getElementById(id); }
  function txt(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }

  /* ============================================================
   *  一、命运卡组
   *  ------------------------------------------------------------
   *  出门前挑三张，这一世的底色就定了。
   *  设计原则：每张"吉"都要配一张"险" —— 没有免费的横财。
   * ============================================================ */

  var CARDS = [
    { id: 'windfall', n: '横财', t: '吉', d: '开局多 ¥8,000', e: '一笔来路不明的钱，先用着。' },
    { id: 'iron', n: '铁打的身板', t: '吉', d: '体力上限 +25', e: '你从没生过病，也不知道为什么。' },
    { id: 'numb', n: '钝感', t: '吉', d: '精神上限 +25', e: '骂你的话你得反应两秒才听懂。' },
    { id: 'patron', n: '贵人', t: '吉', d: '前 3 次事件必是好事', e: '有人一直在暗处替你铺路。' },
    { id: 'net', n: '人脉', t: '吉', d: '每天多进 ¥40', e: '你手机里有三百个能帮上忙的人。' },
    { id: 'jinx', n: '煞星', t: '险', d: '开局 +¥15,000，但前 3 次事件必是坏事', e: '钱来了，事也跟着来了。' },
    { id: 'sin', n: '孽债', t: '险', d: '开局 +¥20,000，恶业 +4', e: '这钱不是你的。你知道，也不在乎。' },
    { id: 'desperate', n: '搏命', t: '险', d: '开局 +¥12,000，体力上限 −20', e: '你把身体当成了抵押品。' },
    { id: 'reroll', n: '命数', t: '中', d: '改命白送 3 次', e: '你总觉得，有些事能重来一遍。' },
    { id: 'spare', n: '替身', t: '中', d: '一次免死', e: '有人在某个地方替你站着。' },
    { id: 'thrift', n: '抠门', t: '中', d: '日常开销减半，体面 −8', e: '你算得很细，细到别人看着难受。' },
    { id: 'memory', n: '前世记忆', t: '中', d: '继承上局 25% 存款，恶业 +1', e: '你记得一些不该记得的事。' }
  ];

  var picked = [], dkBox = null, pendingJob = -1, deckDone = false;

  var DK_CSS = [
    '.dk-box{position:fixed;inset:0;z-index:1500;display:none;align-items:center;justify-content:center;background:rgba(10,16,24,.62);backdrop-filter:blur(5px);padding:20px}',
    '.dk-box.show{display:flex}',
    '.dk-in{width:min(760px,96vw);max-height:88vh;display:flex;flex-direction:column;background:#fbf7ee;border-radius:16px;overflow:hidden;color:#3a2f24}',
    '.dk-hd{padding:16px 20px 12px;border-bottom:1px solid rgba(120,90,50,.14)}',
    '.dk-hd b{display:block;font-size:15px;font-weight:500;letter-spacing:.1em}',
    '.dk-hd span{display:block;margin-top:4px;font-size:12px;color:#8b7a63}',
    '.dk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:9px;padding:14px 18px;overflow:auto}',
    '.dk-c{position:relative;padding:11px 12px;border-radius:10px;border:1px solid rgba(130,100,60,.22);background:#fffdf7;cursor:pointer;text-align:left;font:inherit;color:#3a2f24;transition:border-color .16s,background .16s,transform .16s}',
    '.dk-c:hover{transform:translateY(-2px);border-color:rgba(160,110,50,.5)}',
    '.dk-c.on{border-color:#b5762e;background:#fff4dd;box-shadow:inset 0 0 0 1px rgba(181,118,46,.4)}',
    '.dk-c .t{display:inline-block;font-size:10px;letter-spacing:.12em;padding:1px 5px;border-radius:4px;margin-bottom:5px}',
    '.dk-c .t.g{background:rgba(80,150,110,.14);color:#2f6b4a}',
    '.dk-c .t.x{background:rgba(180,70,50,.13);color:#9a3a24}',
    '.dk-c .t.m{background:rgba(120,110,160,.14);color:#4f4470}',
    '.dk-c .nm{display:block;font-size:13.5px;font-weight:500;margin-bottom:3px}',
    '.dk-c .ds{display:block;font-size:11.5px;color:#6b5c48;line-height:1.5}',
    '.dk-c .ex{display:block;margin-top:6px;font-size:11px;color:#a0907a;font-style:italic;line-height:1.5}',
    '.dk-ft{display:flex;align-items:center;gap:12px;padding:12px 20px 16px;border-top:1px solid rgba(120,90,50,.14)}',
    '.dk-ft .cnt{font-size:12.5px;color:#8b7a63}',
    '.dk-ft .cnt b{color:#8a4f13;font-weight:500}',
    '.dk-ft button{margin-left:auto;padding:10px 26px;border-radius:9px;border:1px solid rgba(160,110,50,.4);background:#b5762e;color:#fffaf0;font:inherit;font-size:13px;cursor:pointer}',
    '.dk-ft button:disabled{opacity:.4;cursor:not-allowed}',
    '@media (max-width:600px){.dk-grid{grid-template-columns:1fr 1fr;padding:12px}.dk-c .ex{display:none}}'
  ].join('\n');

  function injectCss(id, css) {
    if (el(id)) { return; }
    var s = doc.createElement('style');
    s.id = id; s.textContent = css;
    doc.head.appendChild(s);
  }

  function buildDeckBox() {
    if (dkBox) { return dkBox; }
    dkBox = doc.createElement('div');
    dkBox.id = 'dkBox';
    dkBox.className = 'dk-box';
    dkBox.innerHTML =
      '<div class="dk-in">' +
      '<div class="dk-hd"><b>出门前，挑三张命</b><span>这一世的底色。吉与险可以随便配，但捡到的每一样，都得从别处扣。</span></div>' +
      '<div class="dk-grid" id="dkGrid"></div>' +
      '<div class="dk-ft"><span class="cnt" id="dkCnt"></span><button id="dkGo" disabled>就这样走</button></div>' +
      '</div>';
    doc.body.appendChild(dkBox);
    el('dkGo').onclick = function () {
      if (picked.length !== 3) { return; }
      dkBox.classList.remove('show');
      deckDone = true;
      var list = picked.slice();
      picked = [];
      global.Dc(pendingJob, list);
    };
    return dkBox;
  }

  function renderDeck() {
    var grid = el('dkGrid');
    if (!grid) { return; }
    grid.innerHTML = '';
    CARDS.forEach(function (c) {
      var b = doc.createElement('button');
      b.className = 'dk-c' + (picked.indexOf(c.id) >= 0 ? ' on' : '');
      var cls = c.t === '吉' ? 'g' : c.t === '险' ? 'x' : 'm';
      b.innerHTML = '<span class="t ' + cls + '">' + c.t + '</span>' +
        '<span class="nm">' + txt(c.n) + '</span>' +
        '<span class="ds">' + txt(c.d) + '</span>' +
        '<span class="ex">' + txt(c.e) + '</span>';
      b.onclick = function () {
        var i = picked.indexOf(c.id);
        if (i >= 0) { picked.splice(i, 1); }
        else if (picked.length < 3) { picked.push(c.id); }
        else { return; }
        renderDeck();
      };
      grid.appendChild(b);
    });
    var cnt = el('dkCnt');
    if (cnt) { cnt.innerHTML = '已选 <b>' + picked.length + '</b> / 3'; }
    var go = el('dkGo');
    if (go) { go.disabled = picked.length !== 3; }
  }

  function showDeckPick(jobIndex) {
    pendingJob = jobIndex;
    injectCss('dkStyle', DK_CSS);
    buildDeckBox();
    picked = [];
    renderDeck();
    dkBox.classList.add('show');
  }

  function hasCard(id) {
    return (C.deck || []).indexOf(id) >= 0;
  }

  function applyDeck(list) {
    C.deck = list;
    list.forEach(function (id) {
      switch (id) {
        case 'windfall':
          C.money += 8000; break;
        case 'iron':
          C.staminaMax += 25; C.stamina += 25; break;
        case 'numb':
          C.spiritMax += 25; C.spirit += 25; break;
        case 'patron':
          C.forceLeft = 3; C.forceKind = 'good'; break;
        case 'jinx':
          C.money += 15000; C.forceLeft = 3; C.forceKind = 'bad'; break;
        case 'sin':
          C.money += 20000; C.evil = (C.evil || 0) + 4; break;
        case 'desperate':
          C.money += 12000; C.staminaMax = Math.max(40, C.staminaMax - 20);
          C.stamina = Math.min(C.stamina, C.staminaMax); break;
        case 'reroll':
          C.freeAlter = (C.freeAlter || 0) + 3; break;
        case 'spare':
          C.spare = (C.spare || 0) + 1; break;
        case 'thrift':
          C.cardThrift = !0; C.face = Math.max(0, C.face - 8); break;
        case 'net':
          C.cardNet = !0; break;
        case 'memory':
          try {
            var m = Number(localStorage.getItem('life_last_money') || 0);
            if (m > 0) { C.money += Math.round(m * 0.25); }
          } catch (e) { }
          C.evil = (C.evil || 0) + 1; break;
      }
    });
    if (C.evil) { C.evil = C.evil; }
    /* 贵人与煞星同时带会互相抵消：既不算好事也不算坏事 */
    if (hasCard('patron') && hasCard('jinx')) { C.forceLeft = 0; C.forceKind = null; }
    try { global.en(['money', 'stamina', 'spirit', 'face']); } catch (e) { }
    var names = list.map(function (id) {
      var c = CARDS.filter(function (x) { return x.id === id; })[0];
      return c ? c.n : id;
    }).join(' \u00b7 ');
    try { global.zn('\u8FD9\u4E00\u4E16\uFF1A' + names, 'moon'); } catch (e) { }
  }

  /* 包装 Dc：第一次点"就这样走"时先弹卡组 */
  (function () {
    var orig = global.Dc;
    if (typeof orig !== 'function') { return; }
    global.Dc = function (i, list) {
      if (!deckDone && !list) {
        showDeckPick(i);
        return;
      }
      deckDone = true;
      var r = orig.apply(this, [i]);
      try { if (list && list.length) { applyDeck(list); } } catch (e) { }
      return r;
    };
  })();

  /* 包装 Xx：每天结算时补人脉收入 / 退抠门的钱 */
  (function () {
    var orig = global.Xx;
    if (typeof orig !== 'function') { return; }
    global.Xx = function () {
      var before = C.money;
      var r = orig.apply(this, arguments);
      try {
        if (hasCard('net')) { C.money += 40; }
        if (hasCard('thrift')) { C.money += Math.round((before - C.money) * 0.5); }
      } catch (e) { }
      return r;
    };
  })();

  /* ============================================================
   *  二、每日一命
   *  ------------------------------------------------------------
   *  URL 带 ?daily=1 就进挑战模式：种子 = 当天日期，
   *  骰点、天气、事件抽取全部由这一个种子决定。
   *  牌序固定，抽到第几张取决于你走了多少步 —— 这就是 Roguelike 的日赛。
   * ============================================================ */

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var dailyRng = null;

  function seedWrap(name) {
    var f = global[name];
    if (typeof f !== 'function') { return; }
    global[name] = function () {
      var o = Math.random;
      Math.random = dailyRng;
      try { return f.apply(this, arguments); }
      finally { Math.random = o; }
    };
  }

  function todaySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function initDaily() {
    if (!/[?&]daily/.test(location.search)) { return; }
    C.daily = !0;
    C.seed = todaySeed();
    dailyRng = mulberry32(C.seed);
    ['Gx', 'Yx', 'Lc'].forEach(seedWrap);

    var top = doc.querySelector('#hud .topline');
    if (top && !el('dailyBadge')) {
      var s = doc.createElement('span');
      s.id = 'dailyBadge';
      s.className = 'days';
      s.style.cssText = 'color:#8a4f13;letter-spacing:.04em';
      s.textContent = '\u6BCF\u65E5 ' + C.seed;
      top.appendChild(s);
    }
  }

  /* ============================================================
   *  三、全服善恶天平
   *  ------------------------------------------------------------
   *  一个人做坏事，全服的好运都会薄一点。
   *  这不是惩罚，是让"这个世界"有重量。
   * ============================================================ */

  var BAL = { goodMul: 1, badMul: 1, state: '', good: 0, evil: 0, total: 0 };

  function applyBalance(d) {
    if (!d) { return; }
    BAL.good = d.good || 0;
    BAL.evil = d.evil || 0;
    BAL.total = d.total || (BAL.good + BAL.evil);
    BAL.state = d.state || '';
    if (BAL.state === 'yin') { BAL.goodMul = 0.78; BAL.badMul = 1.22; }
    else if (BAL.state === 'yang') { BAL.goodMul = 1.22; BAL.badMul = 0.82; }
    else { BAL.goodMul = 1; BAL.badMul = 1; }
    showBalanceBadge();
  }

  function showBalanceBadge() {
    var top = doc.querySelector('#hud .topline');
    if (!top) { return; }
    var s = el('balBadge');
    if (!s) {
      s = doc.createElement('span');
      s.id = 'balBadge';
      s.className = 'days';
      s.style.cssText = 'cursor:pointer';
      top.appendChild(s);
    }
    if (!BAL.total) { s.textContent = ''; s.style.display = 'none'; return; }
    s.style.display = '';
    if (BAL.state === 'yin') {
      s.textContent = '\u5929\u9053 \u00b7 \u9634\u76DB';
      s.style.color = '#7a3b52';
      s.title = '\u5168\u670D\u6076\u4E1A ' + BAL.evil + ' \u00b7 \u5584\u4E1A ' + BAL.good + '\u3002\u574F\u4E8B\u66F4\u5BB9\u6613\u627E\u4E0A\u95E8\u3002';
    } else if (BAL.state === 'yang') {
      s.textContent = '\u5929\u9053 \u00b7 \u9633\u76DB';
      s.style.color = '#2f6b4a';
      s.title = '\u5168\u670D\u5584\u4E1A ' + BAL.good + ' \u00b7 \u6076\u4E1A ' + BAL.evil + '\u3002\u8FD9\u4E00\u9635\u8DEF\u6BD4\u8F83\u987A\u3002';
    } else {
      s.textContent = '\u5929\u9053 \u00b7 \u4E2D\u5E73';
      s.style.color = '#8b7a63';
      s.title = '\u5584 ' + BAL.good + ' \u00b7 \u6076 ' + BAL.evil;
    }
  }

  function loadBalance() {
    if (!global.NET || typeof NET.req !== 'function') { return; }
    try {
      NET.req('world.balance', {}, { timeout: 7000, silent: true })
        .then(function (d) { applyBalance(d); })
        .catch(function () { });
    } catch (e) { }
  }

  /* 包装 Yx：把天平的倍率临时叠到权重上；顺便处理贵人 / 煞星 */
  (function () {
    var orig = global.Yx;
    if (typeof orig !== 'function') { return; }
    global.Yx = function () {
      try {
        /* 贵人 / 煞星：前三次事件定向 */
        if (C.forceLeft > 0 && C.forceKind) {
          var F = (global.ha && global.ha.fate) || {},
            job = C.job && C.job.id,
            pool = C.forceKind === 'good'
              ? ((F.jobGood || {})[job] || []).concat(F.good || [])
              : ((F.jobBad || {})[job] || []).concat(F.bad || []);
          C.forceLeft -= 1;
          if (pool.length) {
            var ev = pool[Math.floor(Math.random() * pool.length)];
            C.usedEv.push(ev.t), C.usedEv.length > 26 && C.usedEv.shift();
            return ev;
          }
        }
        var YW = global.YW;
        if (!YW || (BAL.goodMul === 1 && BAL.badMul === 1)) {
          return orig.apply(this, arguments);
        }
        var og = YW.good, ob = YW.bad;
        YW.good = Math.max(1, Math.round(og * BAL.goodMul));
        YW.bad = Math.max(1, Math.round(ob * BAL.badMul));
        try { return orig.apply(this, arguments); }
        finally { YW.good = og; YW.bad = ob; }
      } catch (e) {
        return orig.apply(this, arguments);
      }
    };
  })();

  /* ============================================================
   *  四、因果债
   *  ------------------------------------------------------------
   *  做了恶事，会有一个真实玩家成为"债主"。
   *  他下次开局时，会在第 2 个事件格撞见一条「讨债」。
   *  接不到后端就静默降级，不影响本体。
   * ============================================================ */

  function oweDebt(title) {
    if (!global.NET || typeof NET.req !== 'function') { return; }
    try {
      NET.req('debt.owe', { t: title || '' }, { timeout: 5000, silent: true })
        .then(function (d) {
          if (!d || !d.to) { return; }
          C.debt = { to: d.to, t: title };
          try { global.zn('\u8FD9\u7B14\u8D26\uFF0C' + d.to + ' \u66FF\u4F60\u8BB0\u7740\u3002', 'moon'); } catch (e) { }
        }).catch(function () { });
    } catch (e) { }
  }

  (function () {
    var orig = global.karm;
    if (typeof orig !== 'function') { return; }
    global.karm = function (n, t) {
      var r = orig.apply(this, arguments);
      try {
        if (n && (n.good || n.evil)) {
          /* 全服天平的原料。挂了也不影响本局，静默失败。 */
          if (global.NET && typeof NET.req === 'function') {
            NET.req('karma.log', { g: n.good || 0, k: n.evil || 0, t: t || '' },
              { timeout: 4000, silent: true }).catch(function () { });
          }
        }
        if (n && n.evil) { oweDebt(t); }
      } catch (e) { }
      return r;
    };
  })();

  /* 开局拉一次：有没有人欠我；顺便把上一世带过来的东西装上 */
  (function () {
    var orig = global.Dc;
    if (typeof orig !== 'function') { return; }
    global.Dc = function (i, list) {
      var r = orig.apply(this, arguments);
      /* 只在真正开局（原始 Dc 已经把职业属性铺好）之后才继承，
         否则那笔钱会被 Dc 里的初始化直接覆盖掉。 */
      if (!C.started) { return r; }
      try { applyInherit(); } catch (e) { }
      try {
        if (global.NET && NET.req) {
          NET.req('debt.pull', {}, { timeout: 6000, silent: true })
            .then(function (d) {
              if (!d || !d.from) { return; }
              C.chain = C.chain || [];
              C.chain.push({ id: 'debt_collect', after: 2 });
              C.debtFrom = d.from;
              try { global.zn(d.from + ' \u6B20\u4F60\u4E00\u7B14\u3002\u8FC7\u4E24\u5929\u4F1A\u6709\u4EBA\u6765\u8BF4\u3002', 'moon'); } catch (e) { }
            }).catch(function () { });
        }
      } catch (e) { }
      return r;
    };
  })();

  /* ============================================================
   *  六、两世之间：把地府/天庭那边选的继承下来
   *  ------------------------------------------------------------
   *  realm-trial.js 在另一个页面写 life_next_v1，这里读。
   *  只生效一次，读完就删 —— 否则一个孟婆汤能喝一辈子。
   * ============================================================ */

  function applyInherit() {
    var raw = null;
    try { raw = localStorage.getItem('life_next_v1'); } catch (e) { return; }
    if (!raw) { return; }
    var d = null;
    try { d = JSON.parse(raw); } catch (e) { d = null; }
    if (!d) { return; }
    try { localStorage.removeItem('life_next_v1'); } catch (e) { }

    /* 超过一天就作废：这是"上一世"的东西，不该无限期挂着 */
    if (d.at && Date.now() - d.at > 86400000) { return; }

    if (d.good) { C.good = (C.good || 0) + d.good; }
    if (d.evil) { C.evil = (C.evil || 0) + d.evil; }

    var b = d.bonus || {};
    if (b.money) { C.money += b.money; }
    if (b.sta) {
      C.staminaMax = Math.max(30, C.staminaMax + b.sta);
      C.stamina = Math.min(C.staminaMax, Math.max(10, C.stamina + b.sta));
    }
    if (b.sp) {
      C.spiritMax = Math.max(30, C.spiritMax + b.sp);
      C.spirit = Math.min(C.spiritMax, Math.max(10, C.spirit + b.sp));
    }

    var six = { human: '\u4EBA\u9053', animal: '\u755C\u751F\u9053', hungry: '\u997F\u9B3C\u9053', asura: '\u4FEE\u7F57\u9053' };
    var bits = [];
    if (d.mem === 0) { bits.push('\u524D\u5C18\u5C3D\u5FD8'); }
    else if (d.mem === 0.3) { bits.push('\u8FD8\u8BB0\u5F97\u4E00\u70B9'); }
    else if (d.mem === 1) { bits.push('\u4EC0\u4E48\u90FD\u8BB0\u5F97'); }
    if (d.realm6 && six[d.realm6]) { bits.push('\u6295\u5F80' + six[d.realm6]); }
    if (d.good) { bits.push('\u5584\u4E1A ' + d.good); }
    if (d.evil) { bits.push('\u6076\u4E1A ' + d.evil); }

    try { global.en(['money', 'stamina', 'spirit']); } catch (e) { }
    if (bits.length) {
      try {
        setTimeout(function () {
          global.zn('\u4F60\u4ECE\u4E0A\u4E00\u4E16\u5E26\u4E86\u4E9B\u4E1C\u897F\u56DE\u6765\uFF1A' + bits.join(' \u00B7 '), 'moon');
        }, 1600);
      } catch (e) { }
    }
  }

  /* ============================================================
   *  五、问卦面板补一个「今日」页
   * ============================================================ */

  function dailyPanel() {
    var seed = todaySeed();
    var isOn = C.daily;
    var html =
      '<p>每天全服同一副牌。骰子、天气、事件顺序都由今天的日期决定 —— 谁活得久，看的是选择，不是运气。</p>' +
      '<div class="fg-row"><span>今日种子</span><b>' + seed + '</b></div>' +
      '<div class="fg-row"><span>当前模式</span><b>' + (isOn ? '每日一命' : '自由模式') + '</b></div>' +
      (isOn ? '<div class="fg-row"><span>本局已走</span><b>' + C.day + ' 天</b></div>' : '') +
      '<div class="fg-sep"></div>' +
      (isOn
        ? '<p style="margin:0;font-size:11.5px;color:#9a8a72">这一局的牌序已经锁死。今天重开也是同一副牌。</p>'
        : '<button class="fg-act" id="fgDaily">以今日之命，重开一局</button>' +
        '<p style="margin:10px 0 0;font-size:11.5px;color:#9a8a72">会离开当前这局。今日只能开一次，认真点。</p>');
    return html;
  }

  /* 把「今日」页塞进 95 建好的问卦面板 */
  (function () {
    var box = el('fgBox');
    if (!box) { return; }
    var tabs = box.querySelector('.fg-tabs');
    if (!tabs || tabs.querySelector('[data-t="daily"]')) { return; }
    var b = doc.createElement('button');
    b.dataset.t = 'daily';
    b.textContent = '\u4ECA\u65E5';
    tabs.appendChild(b);

    b.onclick = function () {
      tabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var body = el('fgBody');
      if (body) { body.innerHTML = dailyPanel(); }
      var go = el('fgDaily');
      if (go) {
        go.onclick = function () {
          try {
            var last = localStorage.getItem('life_daily_' + todaySeed());
            if (last) { global.zn('今天已经走过一次了。', 'moon'); return; }
            localStorage.setItem('life_daily_' + todaySeed(), '1');
          } catch (e) { }
          location.href = 'index.html?daily=1';
        };
      }
    };
  })();

  /* ============================================================
   *  启动
   * ============================================================ */

  injectCss('dkStyle', DK_CSS);
  try { loadBalance(); } catch (e) { }
  try { initDaily(); } catch (e) { }

  global.RUNMOD = {
    cards: CARDS,
    balance: BAL,
    reload: loadBalance,
    seed: todaySeed
  };

})(window);
