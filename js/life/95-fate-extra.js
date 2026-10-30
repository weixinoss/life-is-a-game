/* ============================================================
 *  js/life/95-fate-extra.js
 *  命运扩展层：改命 / 卜卦 / 图鉴 / 墓志铭 / 善业挡灾 / 头顶气象
 *  ------------------------------------------------------------
 *  这个文件不改任何原始模块的代码，全部用"运行时包装"接在原函数前面：
 *    ds()   失败判定  → 先问一句「善业够不够挡灾」
 *    xu()   掷骰      → 支持指定点数（改命用）
 *    Zx()   开面板    → 顺手记一条图鉴
 *    da()   收尾      → 补一段墓志铭
 *
 *  为什么这么做：原 24 个模块是压缩代码机械还原出来的，短变量名一动就
 *  可能踩到语义。包装层只加副作用，出问题最多是新玩法失效，本体照常跑。
 *  所有 hook 都包了 try/catch。
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

  /* ------------------------------------------------------------
   *  常量
   * ---------------------------------------------------------- */

  var ALTER_COST = 1;      /* 一次改命消耗的恶业 */
  var SAVE_NEED = 10;      /* 善业挡灾的门槛 */
  var READ_COST = 500;     /* 卜一卦的钱 */
  var CODEX_KEY = 'life_codex_v1';

  /* ------------------------------------------------------------
   *  样式（一次性注入，避免动 index.html 的样式表）
   * ---------------------------------------------------------- */

  var CSS = [
    '#fgBtn.ready{color:#8a4f13;border-color:rgba(190,120,40,.5);background:rgba(255,214,150,.16)}',
    '#fgBtn b{font-weight:500}',
    '.fg-box{position:fixed;inset:0;z-index:1400;display:none;align-items:center;justify-content:center;background:rgba(12,20,28,.42);backdrop-filter:blur(3px)}',
    '.fg-box.show{display:flex}',
    '.fg-in{width:min(520px,92vw);max-height:84vh;display:flex;flex-direction:column;border-radius:14px;background:#fbf6ea;border:1px solid rgba(120,90,50,.22);box-shadow:0 18px 50px rgba(20,20,30,.22);overflow:hidden;color:#3a2f24;font-size:13px}',
    '.fg-head{display:flex;align-items:center;gap:10px;padding:13px 16px 11px;border-bottom:1px solid rgba(120,90,50,.14)}',
    '.fg-head b{font-size:14px;font-weight:500;letter-spacing:.22em}',
    '.fg-head span{margin-left:auto;font-size:11.5px;color:#8b7a63}',
    '.fg-x{width:26px;height:26px;border:none;background:none;font-size:17px;color:#9a8a72;cursor:pointer;line-height:1}',
    '.fg-tabs{display:flex;gap:2px;padding:9px 14px 0;border-bottom:1px solid rgba(120,90,50,.14)}',
    '.fg-tabs button{flex:1;padding:7px 4px 9px;border:none;background:none;font:inherit;font-size:12.5px;color:#8b7a63;cursor:pointer;border-bottom:2px solid transparent}',
    '.fg-tabs button.on{color:#5a3f1e;border-bottom-color:#b5762e}',
    '.fg-body{padding:15px 16px 18px;overflow:auto;line-height:1.75}',
    '.fg-body p{margin:0 0 10px;color:#6b5c48;font-size:12.5px}',
    '.fg-kv{display:flex;gap:16px;margin-bottom:12px;font-size:12.5px;color:#5a4a36}',
    '.fg-kv b{font-weight:500;color:#8a4f13}',
    '.fg-act{display:block;width:100%;padding:10px;margin-top:4px;border-radius:9px;border:1px solid rgba(160,110,50,.32);background:rgba(255,238,208,.62);color:#6b3f10;font:inherit;font-size:13px;cursor:pointer}',
    '.fg-act:hover{background:rgba(255,232,192,.9)}',
    '.fg-act:disabled{opacity:.42;cursor:not-allowed}',
    '.fg-pick{display:flex;gap:10px;margin-top:13px}',
    '.fg-die{flex:1;padding:15px 0;border-radius:11px;border:1px solid rgba(160,110,50,.3);background:#fffdf7;color:#3a2f24;font:inherit;font-size:23px;cursor:pointer;transition:transform .16s,background .16s}',
    '.fg-die:hover{background:#fff4dd;transform:translateY(-2px)}',
    '.fg-die i{display:block;font-size:10.5px;font-style:normal;color:#9a8a72;letter-spacing:.1em;margin-top:3px}',
    '.fg-sep{height:1px;background:rgba(120,90,50,.12);margin:14px 0}',
    '.fg-row{display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0;color:#5a4a36}',
    '.fg-row b{font-weight:500;color:#8a4f13}',
    '.fg-bar{height:5px;border-radius:3px;background:rgba(120,90,50,.13);overflow:hidden;margin:5px 0 12px}',
    '.fg-bar i{display:block;height:100%;background:linear-gradient(90deg,#c98a3e,#8a4f13);border-radius:3px}',
    '.fg-list{margin:0;padding:0;list-style:none}',
    '.fg-list li{font-size:12px;color:#6b5c48;padding:3px 0;border-bottom:1px dashed rgba(120,90,50,.1)}',
    '.fg-list li:last-child{border:none}',
    '.fg-empty{color:#a89a86;font-size:12px;text-align:center;padding:22px 0}',
    '.fg-read{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;margin-top:13px}',
    '.fg-read div{font-size:12.5px;color:#5a4a36;display:flex;justify-content:space-between}',
    '.fg-read div b{font-weight:500}',
    '.epitaph{margin:14px 0 4px;padding:11px 13px;border-radius:9px;border-left:2px solid rgba(150,110,60,.45);background:rgba(120,90,50,.055);font-size:12px;line-height:1.85;color:#6b5c48;font-style:normal}',
    '.epitaph em{display:block;font-style:normal;font-size:10.5px;letter-spacing:.2em;color:#a0907a;margin-bottom:5px}',
    '@media (max-width:640px){.fg-in{max-height:88vh}.fg-body{padding:13px 13px 16px}}'
  ].join('\n');

  function injectCss() {
    if (el('fgStyle')) { return; }
    var s = doc.createElement('style');
    s.id = 'fgStyle';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  /* ------------------------------------------------------------
   *  图鉴：把 ha 里所有事件摊平成 { 标题: 分类 }
   * ---------------------------------------------------------- */

  var CODEX = null;

  function buildCodex() {
    var out = {}, cnt = {};
    var ha = global.ha;
    if (!ha) { return { map: out, cnt: cnt, total: 0 }; }

    function put(list, group) {
      if (!list || !list.length) { return; }
      cnt[group] = (cnt[group] || 0) + list.length;
      list.forEach(function (e) {
        if (e && e.t && !out[e.t]) { out[e.t] = group; }
      });
    }

    put(ha.common, 'common');
    ['spring', 'summer', 'autumn', 'winter'].forEach(function (k) { put(ha[k], 'season'); });
    if (ha.job) { Object.keys(ha.job).forEach(function (k) { put(ha.job[k], 'job'); }); }
    if (ha.weather) { Object.keys(ha.weather).forEach(function (k) { put(ha.weather[k], 'weather'); }); }

    var F = ha.fate || {};
    put(F.good, 'good');
    put(F.bad, 'bad');
    put(F.retribution, 'retribution');
    if (F.jobGood) { Object.keys(F.jobGood).forEach(function (k) { put(F.jobGood[k], 'jobGood'); }); }
    if (F.jobBad) { Object.keys(F.jobBad).forEach(function (k) { put(F.jobBad[k], 'jobBad'); }); }
    if (F.chain) { put(Object.keys(F.chain).map(function (k) { return F.chain[k]; }), 'chain'); }

    return { map: out, cnt: cnt, total: Object.keys(out).length };
  }

  function codexSeen() {
    try {
      var raw = localStorage.getItem(CODEX_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function codexSave(arr) {
    try { localStorage.setItem(CODEX_KEY, JSON.stringify(arr.slice(-4000))); } catch (e) { }
  }

  function codexAdd(title) {
    if (!title) { return; }
    var seen = codexSeen();
    if (seen.indexOf(title) >= 0) { return; }
    seen.push(title);
    codexSave(seen);
    if (global.NET && NET.req) {
      try { NET.req('codex.put', { t: title }, { timeout: 4000, silent: true }).catch(function () { }); } catch (e) { }
    }
  }

  /* ------------------------------------------------------------
   *  问卦面板
   * ---------------------------------------------------------- */

  var box = null, tab = 'alter', readOut = null, alterOut = null;

  function buildBox() {
    if (box) { return box; }
    box = doc.createElement('div');
    box.id = 'fgBox';
    box.className = 'fg-box';
    box.innerHTML =
      '<div class="fg-in">' +
      '<div class="fg-head"><b>问 卦</b><span id="fgKarma"></span><button class="fg-x" id="fgClose" aria-label="关闭">\u00d7</button></div>' +
      '<div class="fg-tabs">' +
      '<button data-t="alter" class="on">改命</button>' +
      '<button data-t="read">卜卦</button>' +
      '<button data-t="codex">图鉴</button>' +
      '</div><div class="fg-body" id="fgBody"></div></div>';
    doc.body.appendChild(box);

    box.addEventListener('click', function (e) {
      if (e.target === box) { closeBox(); }
    });
    el('fgClose').onclick = closeBox;
    box.querySelectorAll('.fg-tabs button').forEach(function (b) {
      b.onclick = function () {
        box.querySelectorAll('.fg-tabs button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        tab = b.dataset.t;
        render();
      };
    });
    return box;
  }

  function openBox(which) {
    buildBox();
    tab = which || 'alter';
    box.querySelectorAll('.fg-tabs button').forEach(function (x) {
      x.classList.toggle('on', x.dataset.t === tab);
    });
    render();
    box.classList.add('show');
  }

  function closeBox() { if (box) { box.classList.remove('show'); } }

  function render() {
    var body = el('fgBody');
    if (!body) { return; }
    el('fgKarma').textContent = '善 ' + (C.good || 0) + ' \u00b7 恶 ' + (C.evil || 0);
    if (tab === 'alter') { renderAlter(body); }
    else if (tab === 'read') { renderRead(body); }
    else { renderCodex(body); }
  }

  /* ---------- 改命 ---------- */

  function renderAlter(body) {
    var evil = C.evil || 0;
    var free = C.freeAlter || 0;
    var can = (evil >= ALTER_COST || free > 0) && C.started && !C.busy && !C.pending && !C.over;
    body.innerHTML =
      '<p>骰子是死的，人是活的。掐指改一次道，要拿一点恶业去换 —— 这点账，地府记着。</p>' +
      '<div class="fg-kv"><span>当前恶业 <b>' + evil + '</b></span>' +
      (free > 0 ? '<span>白送的次数 <b>' + free + '</b></span>' : '<span>一次改命 <b>\u2212' + ALTER_COST + '</b></span>') +
      '<span>本局已改 <b>' + (C.alterUsed || 0) + '</b> 次</span></div>' +
      '<button class="fg-act" id="fgAlter"' + (can ? '' : ' disabled') + '>掐指改道（掷两次，挑一个走）</button>' +
      '<div id="fgAlterOut"></div>' +
      '<div class="fg-sep"></div>' +
      '<p style="margin:0;font-size:11.5px;color:#9a8a72">恶业还会压住往后的运气：每一点恶业，好事出现的机会少一分；攒到三点，报应就自己找上门了。</p>';
    alterOut = el('fgAlterOut');
    var btn = el('fgAlter');
    if (btn) {
      btn.onclick = function () {
        if (C.busy || C.pending || C.over) { return; }
        if ((C.freeAlter || 0) > 0) { C.freeAlter -= 1; }
        else if ((C.evil || 0) >= ALTER_COST) { C.evil -= ALTER_COST; }
        else { return; }
        C.alterUsed = (C.alterUsed || 0) + 1;
        var a = global.Gx(), b = global.Gx();
        while (b === a) { b = global.Gx(); }
        alterOut.innerHTML =
          '<div class="fg-pick">' +
          '<button class="fg-die" data-v="' + a + '">' + a + '<i>走这一步</i></button>' +
          '<button class="fg-die" data-v="' + b + '">' + b + '<i>走这一步</i></button>' +
          '</div>';
        alterOut.querySelectorAll('.fg-die').forEach(function (d) {
          d.onclick = function () {
            var v = Number(d.dataset.v);
            closeBox();
            setTimeout(function () {
              try { global.xu(v); } catch (e) { }
            }, 120);
          };
        });
        btn.disabled = true;
        el('fgKarma').textContent = '善 ' + (C.good || 0) + ' \u00b7 恶 ' + (C.evil || 0);
      };
    }
  }

  /* ---------- 卜卦 ---------- */

  function renderRead(body) {
    body.innerHTML =
      '<p>算一卦，看看接下来的天时。五百块，问完不退。</p>' +
      '<button class="fg-act" id="fgRead"' + (C.money >= READ_COST && !C.over ? '' : ' disabled') + '>卜一卦（\u00a5' + READ_COST + '）</button>' +
      '<div id="fgReadOut"></div>';
    readOut = el('fgReadOut');
    var prev = C.omen;
    if (prev) { showOmen(prev); }
    var btn = el('fgRead');
    if (btn) {
      btn.onclick = function () {
        if (C.money < READ_COST) { return; }
        C.money -= READ_COST;
        try { global.en(['money']); } catch (e) { }
        var o = forecast();
        C.omen = o;
        btn.disabled = true;
        showOmen(o);
      };
    }
  }

  function showOmen(o) {
    if (!readOut || !o) { return; }
    var rows = o.parts.map(function (p) {
      return '<div><span>' + p[0] + '</span><b>' + p[1] + '%</b></div>';
    }).join('');
    readOut.innerHTML =
      '<div class="fg-read">' + rows + '</div>' +
      '<p style="margin:12px 0 0;font-size:11.5px;color:#9a8a72">' + o.tip + '</p>';
  }

  /* 按当前权重跑 600 次，统计牌堆构成 —— 不消耗真实牌堆，不会打乱顺序 */
  function forecast() {
    var F = (global.ha && global.ha.fate) || {},
      job = C.job && C.job.id,
      evilN = C.evil || 0,
      YW = global.YW || { job: 24, season: 15, common: 17, weather: 13, good: 9, bad: 9, jobGood: 3, jobBad: 3 },
      goodW = Math.max(2, YW.good - evilN),
      retW = evilN >= 3 && F.retribution ? Math.min(14, 2 + (evilN - 3) * 2) : 0;

    var decks = [
      ['职业日常', YW.job, (global.ha.job[job] || []).length],
      ['季节', YW.season, 1],
      ['杂事', YW.common, 1],
      ['天气', YW.weather, 1],
      ['好事', goodW, (F.good || []).length],
      ['坏事', YW.bad, (F.bad || []).length],
      ['职业好事', YW.jobGood, ((F.jobGood || {})[job] || []).length],
      ['职业坏事', YW.jobBad, ((F.jobBad || {})[job] || []).length],
      ['报应', retW, (F.retribution || []).length]
    ].filter(function (d) { return d[2] > 0 && d[1] > 0; });

    var total = 0;
    decks.forEach(function (d) { total += d[1]; });
    if (!total) { return { parts: [['天机', '—']], tip: '卦象模糊，什么也看不清。' }; }

    var parts = decks.map(function (d) {
      return [d[0], Math.round(d[1] / total * 1000) / 10];
    }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);

    var luck = (parts.filter(function (p) { return p[0] === '好事' || p[0] === '职业好事'; })
      .reduce(function (s, p) { return s + p[1]; }, 0));
    var ill = (parts.filter(function (p) { return p[0] === '坏事' || p[0] === '职业坏事' || p[0] === '报应'; })
      .reduce(function (s, p) { return s + p[1]; }, 0));

    var tip;
    if (ill > luck * 2.2) { tip = '卦面阴沉。这一阵出门小心，能不花的钱先别花。'; }
    else if (luck > ill * 1.6) { tip = '卦面见光。趁这段路顺，该做的事赶紧做。'; }
    else if (ill > luck) { tip = '阴晴不定。走一步看一步，别赌。'; }
    else if (luck > ill) { tip = '小吉。不会有什么大事，也不会有什么坏事。'; }
    else { tip = '卦面很平。平平淡淡，也是一种运气。'; }

    return { parts: parts, tip: tip, at: C.day };
  }

  /* ---------- 图鉴 ---------- */

  function renderCodex(body) {
    if (!CODEX) { CODEX = buildCodex(); }
    var seen = codexSeen();
    var local = C.seen || [];
    var all = {};
    seen.forEach(function (t) { all[t] = 1; });
    local.forEach(function (t) { all[t] = 1; });
    var got = Object.keys(all).filter(function (t) { return CODEX.map[t]; });
    var pct = CODEX.total ? Math.round(got.length / CODEX.total * 1000) / 10 : 0;

    var groups = [
      ['good', '好事'], ['bad', '坏事'], ['retribution', '报应'],
      ['jobGood', '职业 · 好'], ['jobBad', '职业 · 坏'],
      ['common', '杂事'], ['season', '季节'], ['job', '职业日常'], ['weather', '天气'], ['chain', '后续']
    ];
    var rows = groups.map(function (g) {
      var totalG = CODEX.cnt[g[0]] || 0;
      if (!totalG) { return ''; }
      var gotG = got.filter(function (t) { return CODEX.map[t] === g[0]; }).length;
      return '<div class="fg-row"><span>' + g[1] + '</span><b>' + gotG + ' / ' + totalG + '</b></div>';
    }).join('');

    var recent = got.slice(-10).reverse().map(function (t) {
      return '<li>' + txt(t) + '</li>';
    }).join('');

    body.innerHTML =
      '<div class="fg-row"><span>已收录</span><b>' + got.length + ' / ' + CODEX.total + '</b></div>' +
      '<div class="fg-bar"><i style="width:' + pct + '%"></i></div>' +
      rows +
      '<div class="fg-sep"></div>' +
      '<p style="margin:0 0 6px">最近见过</p>' +
      (recent ? '<ul class="fg-list">' + recent + '</ul>' : '<div class="fg-empty">还没见过什么。掷一次骰子开始吧。</div>');
  }

  /* ------------------------------------------------------------
   *  包装 1：掷骰支持指定点数（改命用）
   * ---------------------------------------------------------- */

  (function () {
    var orig = global.xu;
    if (typeof orig !== 'function') { return; }
    global.xu = function (force) {
      if (typeof force === 'number') {
        var og = global.Gx;
        global.Gx = function () { return force; };
        try { return orig.apply(this, arguments); }
        finally { global.Gx = og; }
      }
      return orig.apply(this, arguments);
    };
    /* 原文件里 ni.onclick 绑的是旧引用，这里重绑一次 */
    var btn = el('rollBtn');
    if (btn) { btn.onclick = function () { global.xu(); }; }
  })();

  /* ------------------------------------------------------------
   *  包装 2：善业挡灾
   *  ------------------------------------------------------------
   *  ds() 返回 true 就代表这一世结束了。在它前面拦一道：
   * 体力或精神见底、账户上还压着 10 点善业 —— 有人替你挡了一下。
   * ---------------------------------------------------------- */

  (function () {
    var orig = global.ds;
    if (typeof orig !== 'function') { return; }
    global.ds = function () {
      try {
        if (!C.over && (C.stamina <= 0 || C.spirit <= 0)) {
          var wasSta = C.stamina <= 0;
          /* 命运卡「替身」优先：不用掉善业，直接抵一次 */
          if ((C.spare || 0) > 0) {
            C.spare -= 1;
            if (wasSta) { C.stamina = Math.max(C.stamina, 45); } else { C.spirit = Math.max(C.spirit, 45); }
            if (wasSta && C.spirit <= 0) { C.spirit = 25; }
            if (global.en) { global.en(['stamina', 'spirit']); }
            if (global.zn) { global.zn('替身在后面拉了你一把。这一次，不算。', 'moon'); }
            return false;
          }
          if (!C.saved && (C.good || 0) >= SAVE_NEED) {
            C.saved = true;
            C.good -= SAVE_NEED;
            if (wasSta) { C.stamina = Math.max(C.stamina, 30); } else { C.spirit = Math.max(C.spirit, 30); }
            if (wasSta && C.spirit <= 0) { C.spirit = 20; }
            if (global.en) { global.en(['stamina', 'spirit', 'face']); }
            if (global.zn) {
              global.zn('\u4E00\u76F4\u90A3\u4E48\u786C\u6491\u7740\uFF0C\u7A81\u7136\u6709\u4EBA\u4ECE\u540E\u9762\u6276\u4E86\u4F60\u4E00\u628A\u3002\u4F60\u6CA1\u770B\u6E05\u662F\u8C01\u3002\u5584\u4E1A \u2212' + SAVE_NEED, 'moon');
            }
            return false;
          }
        }
      } catch (e) { }
      return orig.apply(this, arguments);
    };
  })();

  /* ------------------------------------------------------------
   *  包装 3：每次开事件面板，记一条图鉴
   * ---------------------------------------------------------- */

  (function () {
    var orig = global.Zx;
    if (typeof orig !== 'function') { return; }
    global.Zx = function (ev) {
      try { if (ev && ev.t) { codexAdd(ev.t); } } catch (e) { }
      return orig.apply(this, arguments);
    };
  })();

  /* ------------------------------------------------------------
   *  墓志铭
   *  ------------------------------------------------------------
   * 按职业、死因、善恶、体面、存款凑一句话。不是随机抽，是筛：
   * 先挑出条件对得上的那几条，再在里面随机 —— 否则墓志铭会和这一世无关。
   * ---------------------------------------------------------- */

  var EPI = [
    { k: ['sick'], w: 3, s: '他这辈子没跟身体商量过任何事。身体最后替他做了决定。' },
    { k: ['sick'], w: 3, s: '病历上有十一页。他说没事，一直说到不能说话。' },
    { k: ['collapse'], w: 3, s: '他不是撑不住，是不想再撑了。这两件事别人分不出来。' },
    { k: ['collapse'], w: 3, s: '最后那几天，手机一直在响。他把屏幕扣在了桌上。' },
    { k: ['bankrupt'], w: 3, s: '他算了一辈子账，最后算错的是自己这一天还能撑多久。' },
    { k: ['bankrupt'], w: 3, s: '东西都搬走了。楼道的声控灯还记得他上楼的脚步。' },
    { k: ['complete'], w: 2, s: '三百六十天，他没发财，没出事，也没求过人。这已经很难了。' },
    { k: ['complete'], w: 2, s: '一整年过完，他还站在原地。这大概就是他想要的全部。' },
    { w: 2, s: '他这一生没什么可说的，但也说不出什么不好。' },
    { w: 1, s: '认识他的人不多。记得他的那几个，都记得挺久。' },
    { g: 6, s: '他扶过很多人。有几个连名字都不知道，但都站起来了。' },
    { g: 4, s: '他做过一些没人看见的好事。这一条，是替那些事写的。' },
    { e: 3, s: '他做过的事，有几件别人已经忘了，他自己没忘。' },
    { e: 5, s: '后半辈子他一直在还。还不完，但一直在还。' },
    { m: 200000, s: '他留下了一笔钱。钱的来路，簿上写着。' },
    { m: -20000, s: '他走的时候还欠着钱。债主后来也没再提。' },
    { f: 80, s: '他这辈子没低过头。代价是很多人没跟他说上最后一句。' },
    { j: 'rider', s: '他跑了三万单。最后一单，是别人替他送的。' },
    { j: 'streamer', s: '他对着镜头笑了一辈子。关掉之后什么样，没人知道。' },
    { j: 'thief', s: '他伸过手，也收过手。收手那天，没人给他鼓掌。' },
    { j: 'gov', s: '他在一张桌子后面坐了半辈子。桌上的文件换了一茬又一茬。' },
    { j: 'boss', s: '他管过很多人。最后送他的，只有三个。' },
    { j: 'fact', s: '机器的声音他听了一辈子。走的时候，耳朵里还是那个声音。' }
  ];

  function epitaph(kind) {
    var list = EPI.filter(function (e) {
      if (e.k && e.k.indexOf(kind) < 0) { return false; }
      if (e.g && (C.good || 0) < e.g) { return false; }
      if (e.e && (C.evil || 0) < e.e) { return false; }
      if (e.m && (C.money || 0) < e.m) { return false; }
      if (e.f && (C.face || 0) < e.f) { return false; }
      if (e.j && (!C.job || C.job.id !== e.j)) { return false; }
      return true;
    });
    if (!list.length) { list = EPI.slice(8, 10); }
    var pool = [];
    list.forEach(function (e) { for (var i = 0; i < (e.w || 1); i++) { pool.push(e.s); } });
    return pool[Math.floor(Math.random() * pool.length)] || '';
  }

  (function () {
    var orig = global.da;
    if (typeof orig !== 'function') { return; }
    global.da = function (kind) {
      try {
        var card = el('ovCard');
        var old = el('fgEpi');
        if (old && old.parentNode) { old.parentNode.removeChild(old); }
        if (card && !C.over) {
          var line = epitaph(kind);
          if (line) {
            var d = doc.createElement('div');
            d.id = 'fgEpi';
            d.className = 'epitaph';
            d.innerHTML = '<em>\u5893 \u5FD7 \u94ED</em>' + txt(line);
            var anchor = el('ovComment');
            if (anchor && anchor.parentNode) { anchor.parentNode.insertBefore(d, anchor.nextSibling); }
            else { card.appendChild(d); }
          }
        }
        /* 把这一世的善恶明细存下来，孽镜台要读 */
        try {
          localStorage.setItem('life_deeds_v1', JSON.stringify({
            deeds: (C.deeds || []).slice(-40),
            good: C.good || 0, evil: C.evil || 0,
            job: C.job ? C.job.n : '', day: Math.min(360, 90 * C.season + C.day),
            kind: kind || 'complete'
          }));
          localStorage.setItem('life_last_money', String(Math.max(0, Math.round(C.money || 0))));
        } catch (e) { }
      } catch (e) { }
      return orig.apply(this, arguments);
    };
  })();

  /* ------------------------------------------------------------
   *  头顶气象：善业脚下有光，恶业身后有影
   * ------------------------------------------------------------
   * 数字玩家记不住，但"这个人身上发黑"一眼就懂。
   * 用最省的方式做：一个地面圆环 + 三团黑雾，随善恶比值改变透明度和大小。
   * ---------------------------------------------------------- */

  (function () {
    var L = global.L;
    var pawn = global.xe;
    if (!L || !pawn) { return; }

    var ring = null, smokes = [], glow = 0, glowT = 0;

    try {
      ring = new L.Mesh(
        new L.RingGeometry(0.46, 0.62, 36),
        new L.MeshBasicMaterial({ color: 0xffcf82, transparent: true, opacity: 0, depthWrite: false, side: L.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.018;
      ring.renderOrder = 2;
      pawn.add(ring);
    } catch (e) { ring = null; }

    try {
      for (var i = 0; i < 3; i++) {
        var m = new L.Mesh(
          new L.SphereGeometry(0.055 + i * 0.012, 7, 6),
          new L.MeshBasicMaterial({ color: 0x14161c, transparent: true, opacity: 0, depthWrite: false })
        );
        m.userData = { ph: i * 2.1, sp: 0.55 + i * 0.13, r: 0.24 + i * 0.05 };
        pawn.add(m);
        smokes.push(m);
      }
    } catch (e) { smokes = []; }

    if (!ring && !smokes.length) { return; }

    var t0 = performance.now();
    function tick(now) {
      requestAnimationFrame(tick);
      var t = (now - t0) / 1000;
      if (!C.started) {
        return;
      }
      var g = C.good || 0, e = C.evil || 0;
      var gv = Math.min(1, g / 8), ev = Math.min(1, Math.max(0, (e - 0)) / 6);

      if (ring) {
        ring.material.opacity = g * 0.075 * (0.75 + Math.sin(t * 1.6) * 0.25);
        var sc = 1 + gv * 0.55;
        ring.scale.set(sc, sc, 1);
        ring.rotation.z = t * 0.22;
        ring.visible = g > 0;
      }
      for (var i = 0; i < smokes.length; i++) {
        var m = smokes[i], d = m.userData;
        var ang = t * d.sp + d.ph;
        m.position.set(Math.cos(ang) * d.r, 0.35 + Math.abs(Math.sin(t * 0.9 + d.ph)) * 0.55, Math.sin(ang) * d.r);
        m.material.opacity = e > 0 ? Math.min(0.42, ev * 0.42) : 0;
        m.visible = e > 0;
        var s2 = 0.7 + ev * 0.9;
        m.scale.setScalar(s2);
      }
    }
    requestAnimationFrame(tick);
  })();

  /* ------------------------------------------------------------
   *  入口：dock 上加一个「问卦」按钮
   * ---------------------------------------------------------- */

  (function () {
    var dock = el('dock');
    if (!dock || el('fgBtn')) { return; }
    var b = doc.createElement('button');
    b.className = 'btn ghost';
    b.id = 'fgBtn';
    b.innerHTML = '\u95EE\u5366 <b id="fgDot"></b>';
    b.onclick = function () { openBox('alter'); };
    var moon = el('moonBtn');
    if (moon && moon.nextSibling) { dock.insertBefore(b, moon.nextSibling); }
    else { dock.appendChild(b); }
  })();

  /* 恶业攒够了，按钮亮一下，提示玩家这儿有东西可用 */
  function pulseBtn() {
    var b = el('fgBtn');
    if (!b) { return; }
    var ready = (C.evil || 0) >= ALTER_COST && !C.over;
    b.classList.toggle('ready', ready);
    var dot = el('fgDot');
    if (dot) { dot.textContent = (C.evil || 0) > 0 ? '(' + C.evil + ')' : ''; }
  }
  setInterval(pulseBtn, 900);
  try { pulseBtn(); } catch (e) { }

  /* ------------------------------------------------------------
   *  对外
   * ---------------------------------------------------------- */

  global.FATE = {
    open: openBox,
    close: closeBox,
    forecast: forecast,
    epitaph: epitaph,
    codex: function () { return CODEX || (CODEX = buildCodex()); },
    seen: codexSeen,
    add: codexAdd
  };

  injectCss();
  try { buildBox(); } catch (e) { }

})(window);
