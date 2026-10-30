/* ============================================================
 *  js/life/94-online.js
 *  联网玩法总装：把后端、音效、职业来电、存档、结局结算接进游戏
 *  ------------------------------------------------------------
 *  设计原则：只做「运行时包装」，不改动前面 24 个已还原的模块。
 *  所有 hook 都包了 try/catch —— 联网出任何问题都不影响单机可玩。
 * ============================================================ */
(function (global) {
  'use strict';

  var NET = global.NET;
  var Sync = global.Sync;
  var SFX = global.SFX;
  var Session = global.Session;

  // ============================================================
  // 小工具
  // ============================================================
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) {
    if (typeof global.ei === 'function') {
      try { return global.ei(n); } catch (e) {}
    }
    return '¥' + Number(n || 0).toLocaleString('en-US');
  }

  function loggedIn() {
    return !!(NET && NET.isLoggedIn() && NET.status.online !== false);
  }

  function needLogin() {
    sheet({
      title: '需要先登录',
      sub: '这个玩法要把你这一世记在服务器上，才玩得起来。',
      html: '<p class="lnet-muted">不登录也能玩本体，只是存档只在这台设备上。</p>',
      buttons: [
        { t: '去登录', pri: true, fn: function () { Session && Session.open('login'); } },
        { t: '算了' }
      ]
    });
  }

  function toast(m, bad) {
    if (Session) { Session.toast(m, bad); }
  }

  // ============================================================
  // 通用弹层
  // ============================================================
  var sheetEl = null;

  function closeSheet() {
    if (sheetEl && sheetEl.parentNode) { sheetEl.parentNode.removeChild(sheetEl); }
    sheetEl = null;
  }

  function sheet(opt) {
    closeSheet();
    var el = document.createElement('div');
    el.className = 'lnet-sheet show';
    el.innerHTML =
      '<div class="lnet-sheet-card">' +
        '<h3>' + esc(opt.title || '') + '</h3>' +
        (opt.sub ? '<p class="lnet-sheet-sub">' + esc(opt.sub) + '</p>' : '') +
        '<div class="lnet-sheet-body">' + (opt.html || '') + '</div>' +
        '<div class="lnet-sheet-foot"></div>' +
      '</div>';
    document.body.appendChild(el);

    var foot = el.querySelector('.lnet-sheet-foot');
    var btns = opt.buttons || [{ t: '知道了', pri: true }];
    btns.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = b.t;
      if (b.pri) { btn.className = 'pri'; }
      btn.onclick = function () {
        if (b.fn) { try { b.fn(el); } catch (e) { console.warn(e); } }
        if (b.keep !== true) { closeSheet(); }
      };
      foot.appendChild(btn);
    });

    el.addEventListener('click', function (e) {
      if (e.target === el && opt.maskClose !== false) { closeSheet(); }
    });
    sheetEl = el;
    if (SFX) { SFX.play('whoosh'); }
    return el;
  }

  function loading(title, sub) {
    return sheet({
      title: title || '稍等',
      sub: sub || '正在从服务器取…',
      html: '<p class="lnet-muted">这一下可能要几百毫秒。</p>',
      buttons: []
    });
  }

  // ============================================================
  // 音效：开关按钮 + 天气氛围
  // ============================================================
  function mountSfxButton() {
    if ($('lnet-sfx')) { return; }
    var b = document.createElement('button');
    b.id = 'lnet-sfx';
    b.type = 'button';
    b.className = 'lnet-sfx-btn';
    b.title = '音效开关';
    b.textContent = SFX && SFX.isEnabled() ? '♪' : '×';
    b.onclick = function () {
      if (!SFX) { return; }
      SFX.setEnabled(!SFX.isEnabled());
      b.textContent = SFX.isEnabled() ? '♪' : '×';
      b.classList.toggle('off', !SFX.isEnabled());
      if (SFX.isEnabled()) { SFX.play('bell'); }
    };
    if (SFX && !SFX.isEnabled()) { b.classList.add('off'); }
    document.body.appendChild(b);
  }

  var lastWeather = null;
  var lastNight = null;

  function pollAmbience() {
    var C = global.C;
    if (!C || !SFX) { return; }
    var night = global.Ze ? !!global.Ze.isNight : false;
    if (C.weather !== lastWeather || night !== lastNight) {
      lastWeather = C.weather;
      lastNight = night;
      try { SFX.ambience(C.weather, night); } catch (e) {}
    }
  }

  // ============================================================
  // 职业来电
  // ============================================================
  var curCall = null;
  var curCallback = null;
  var callTimer = null;
  var lastCallKey = '';

  function pickCall() {
    var C = global.C;
    var db = global.CALL_DB || {};
    var list = (C && C.job && db[C.job.id]) || db.idle || [];
    if (!list.length) { return null; }
    var i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && (list[i].from + list[i].tag) === lastCallKey) {
      i = (i + 1) % list.length;
    }
    lastCallKey = list[i].from + list[i].tag;
    return list[i];
  }

  function installPhone() {
    if (!global.CALL_DB) { return false; }

    global.$x = function (n) {
      var C = global.C;
      if (!C) { n(false); return; }
      if (C.over) { n(false); return; }

      var done = C.callDone || 0;
      // 原来 18% 触发、最多两次；这里稍提高一点，让职业来电更容易被听到
      if (done >= 2 || Math.random() > 0.24) { n(false); return; }

      var call = pickCall();
      if (!call) { n(false); return; }

      C.callDone = done + 1;
      curCall = call;
      curCallback = n;

      var box = $('call');
      if (box) {
        var av = box.querySelector('.call-avatar');
        var from = box.querySelector('.call-from');
        var sub = box.querySelector('.call-sub');
        if (av) { av.textContent = call.av; }
        if (from) { from.textContent = call.from; }
        if (sub) { sub.textContent = '来 电 · ' + call.tag; }
        box.classList.add('show');
      }
      if (global.$t) { global.$t.phoneTarget = -0.1; }
      if (SFX) { SFX.play('phone'); }

      clearTimeout(callTimer);
      callTimer = setTimeout(function () {
        if (curCall) { hangup(true); }
      }, 14000);
    };

    global.Su = function (accept) {
      clearTimeout(callTimer);
      var box = $('call');
      if (box) { box.classList.remove('show'); }
      if (global.$t) { global.$t.phoneTarget = 0; }

      var call = curCall;
      var cb = curCallback;
      curCall = null;
      curCallback = null;
      if (global.Ec) { global.Ec = null; }

      if (!call) {
        if (cb) { cb(false); }
        return;
      }

      var C = global.C || {};
      var eff = accept ? call.acc : call.rej;
      var wage = (typeof global.us === 'function' ? global.us() : 1) || 1;
      var m = eff.m || 0;
      if (accept && m > 0) { m = Math.round(m * wage); }

      C.money = (C.money || 0) + m;
      C.stamina = Math.max(0, Math.min(C.staminaMax || 100, (C.stamina || 0) + (eff.st || 0)));
      C.spirit = Math.max(0, Math.min(C.spiritMax || 100, (C.spirit || 0) + (eff.sp || 0)));
      C.face = Math.max(0, Math.min(100, (C.face || 0) + (eff.fc || 0)));
      C.rating = Math.max(0, Math.min(100, (C.rating || 0) + (eff.rt || 0)));
      if ((eff.fc || 0) <= -6) { C.dignity = (C.dignity || 0) + 1; }

      if (typeof global.en === 'function') { global.en(['money', 'stamina', 'spirit', 'face']); }
      if (m && typeof global.Mi === 'function') {
        global.Mi('money', (m > 0 ? '+' : '') + money(m), m > 0);
      }
      if (m && SFX) { SFX.play(m > 0 ? 'coin' : 'spend'); }
      if (SFX) { SFX.play(accept ? 'accept' : 'reject'); }

      if (typeof global.zn === 'function') {
        global.zn(accept ? call.accT : call.rejT, accept ? 'moon' : 'rent');
      }

      // 接了"照顾别人"的电话，记一次善举 —— 这是业力遗产的来源
      if (accept && /借|陪|还|替|帮|让|照顾/.test(call.tag)) {
        if (Sync) { Sync.markAltruistic(); }
      }

      setTimeout(function () {
        var over = typeof global.ds === 'function' ? global.ds() : false;
        if (!over && cb) { cb(accept); }
      }, 1000);
    };

    // 超时自动挂断
    function hangup() {
      var box = $('call');
      if (box) { box.classList.remove('show'); }
      if (global.$t) { global.$t.phoneTarget = 0; }
      var cb = curCallback;
      curCall = null;
      curCallback = null;
      if (SFX) { SFX.play('reject'); }
      toast('响太久了，对面挂了。', true);
      setTimeout(function () {
        var over = typeof global.ds === 'function' ? global.ds() : false;
        if (!over && cb) { cb(false); }
      }, 600);
    }

    return true;
  }

  // ============================================================
  // 包装已有函数（只加副作用，不改行为）
  // ============================================================
  function wrap(name, after) {
    var orig = global[name];
    if (typeof orig !== 'function') { return false; }
    global[name] = function () {
      var r;
      try { r = orig.apply(this, arguments); }
      catch (e) { console.warn('[hook]' + name, e); throw e; }
      try { after.apply(this, arguments); } catch (e2) { console.warn('[after]' + name, e2); }
      return r;
    };
    return true;
  }

  var ENDING_NAME = {
    bankrupt: '撑不住了',
    sick: '身体先垮了',
    collapse: '不想动了',
    complete: '一年过去了'
  };

  function installHooks() {
    // 开局
    wrap('Dc', function () {
      if (SFX) { SFX.play('start'); }
      if (Sync) {
        Sync.startLife().then(function () {
          if (loggedIn()) { drawKarmaAtStart(); }
        });
      }
    });

    // 掷骰
    var origXu = global.xu;
    if (typeof origXu === 'function') {
      global.xu = function () {
        if (SFX) { SFX.play('dice'); }
        return origXu.apply(this, arguments);
      };
      var rb = $('rollBtn');
      if (rb) {
        rb.onclick = function () { global.xu(); };
      }
    }

    // 走到一格：记流水
    wrap('qx', function () {
      if (SFX) { SFX.play('step'); }
      if (Sync) { Sync.pushDay({ cardId: '', optIdx: -1 }); }
      if (Sync) { Sync.saveNow(false); }
    });

    // 事件面板出现
    wrap('Zx', function () { if (SFX) { SFX.play('paper'); } });

    // 选了某个选项
    wrap('Jx', function (opt, btn, delta) {
      if (SFX) { SFX.play('pick'); }
      var C = global.C || {};
      var title = '';
      try {
        var h = $('pTitle');
        title = h ? h.textContent : '';
      } catch (e) {}
      var optText = '';
      try {
        var span = btn && btn.querySelector ? btn.querySelector('.ot') : null;
        optText = span ? span.textContent : (opt && opt.x) || '';
      } catch (e) {}

      if (Sync) {
        Sync.pushDay({ cardId: title, optIdx: 0, optText: optText, moneyDelta: delta || 0 });
      }
      // 上报事件卡埋点（用于"事件卡体检"）
      if (NET && title) {
        NET.req('card.stat', { card_id: String(title).slice(0, 80), opt_idx: 0, season: C.season || 0 },
          { timeout: 4000, silent: true }).catch(function () {});
      }
      // 大幅降价的选择可能算"低头"
      if ((opt && opt.fc || 0) <= -6 && Sync) { Sync.markAltruistic(); }
    });

    // 季末体检
    wrap('Eu', function () {
      if (SFX) { SFX.play('report'); }
      if (Sync) { Sync.saveNow(true); }
    });

    // 结局
    wrap('da', function (kind) {
      if (SFX) { SFX.play('ending'); }
      onEnd(kind);
    });

    // 看会儿月亮
    var moon = $('moonBtn');
    if (moon) {
      var oldMoon = moon.onclick;
      moon.onclick = function (e) {
        if (SFX) { SFX.play('whoosh'); }
        if (oldMoon) { return oldMoon.call(this, e); }
      };
    }
  }

  // ============================================================
  // 结局结算：往结局卡里塞一块联网战报
  // ============================================================
  function onEnd(kind) {
    var card = $('ovCard');
    if (!card) { return; }
    var old = $('lnet-end');
    if (old && old.parentNode) { old.parentNode.removeChild(old); }

    var box = document.createElement('div');
    box.id = 'lnet-end';
    box.className = 'lnet-end';
    box.innerHTML = '<div class="lnet-muted">正在结算这一世…</div>';
    var again = $('againBtn');
    if (again && again.parentNode === card) {
      card.insertBefore(box, again);
    } else {
      card.appendChild(box);
    }

    var C = global.C || {};
    var score = Math.round(C.rating || 0);
    var ending = ENDING_NAME[kind] || String(kind || '');

    if (!loggedIn()) {
      box.innerHTML =
        '<div class="lnet-end-title">这一世没有上传</div>' +
        '<div class="lnet-muted">游客模式下，你活过的这些只留在本机。<br>登录之后，下一世会接着这一世算。</div>' +
        '<button type="button" class="lnet-end-btn" id="lnet-end-login">登录并保存</button>';
      var b = $('lnet-end-login');
      if (b) { b.onclick = function () { Session && Session.open('login'); }; }
      return;
    }

    var report = Sync ? Sync.endLife(score, ending) : Promise.resolve(null);
    box.innerHTML = '<div class="lnet-muted">正在结算…</div>';

    Promise.all([
      report,
      NET.req('report.summary', {}, { silent: true }).catch(function () { return null; })
    ]).then(function (arr) {
      var d = arr[0];
      var rep = arr[1] || {};
      var karmaMade = d ? (d.karma_made || 0) : 0;
      var rank = d ? (d.rank || 0) : 0;

      box.innerHTML =
        '<div class="lnet-end-title">这一世 · ' + esc(ending) + '</div>' +
        '<div class="lnet-end-grid">' +
          '<div><span>评分</span><b>' + score + '</b></div>' +
          '<div><span>全服第</span><b>' + (rank || '—') + '</b></div>' +
          '<div><span>留下的业力</span><b>' + karmaMade + '</b></div>' +
          '<div><span>体面低头</span><b>' + (C.dignity || 0) + '</b></div>' +
        '</div>' +
        '<div class="lnet-muted">' +
          (karmaMade > 0
            ? '你的 ' + karmaMade + ' 次善举，会变成别人的开局第一次选择。'
            : '这一世没有留下业力。有些账只能自己认。') +
          (rep.lives ? '<br>目前已经有 ' + rep.lives + ' 个人走完了一辈子。' : '') +
        '</div>' +
        '<div class="lnet-end-links">' +
          '<button type="button" class="lnet-end-btn" data-open="rank">看排行榜</button>' +
          '<button type="button" class="lnet-end-btn" data-open="jury">去当判官</button>' +
          '<button type="button" class="lnet-end-btn" data-open="karma">看别人的业力</button>' +
        '</div>';
      bindEndLinks(box);
    }).catch(function () {
      box.innerHTML =
        '<div class="lnet-end-title">这一世 · ' + esc(ending) + '</div>' +
        '<div class="lnet-muted">服务器没连上，这次结算没能上传。<br>不过你玩过的东西还在。</div>';
    });
  }

  function bindEndLinks(box) {
    var btns = box.querySelectorAll('[data-open]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function () {
        var k = this.getAttribute('data-open');
        closeSheet();
        openGame(k);
      };
    }
  }

  // ============================================================
  // 开局：抽一张业力 / 一件遗物
  // ============================================================
  function drawKarmaAtStart() {
    if (!loggedIn()) { return; }
    NET.req('karma.draw', {}, { timeout: 6000, silent: true }).then(function (d) {
      if (!d || !d.karma) { return; }
      var k = d.karma;
      if (SFX) { SFX.play('fate'); }
      var el = sheet({
        title: '承 ' + esc(k.from || '某个人') + ' 之因果',
        sub: '这是上一个活过的人留下的',
        html:
          '<div class="lnet-quote">' + esc(k.text) + '</div>' +
          '<p class="lnet-muted">他做这件事的时候，并不知道会被谁记住。</p>',
        buttons: [
          { t: esc(k.optA), pri: true, fn: function () { applyKarma(k.effA, '你还了这份人情。'); } },
          { t: esc(k.optB), fn: function () { applyKarma(k.effB, '你装作不知道。'); } }
        ],
        maskClose: false
      });
      return el;
    }).catch(function () {});
  }

  function applyKarma(eff, msg) {
    if (!eff) { return; }
    var C = global.C || {};
    C.money = (C.money || 0) + (eff.money || 0);
    C.stamina = Math.max(0, Math.min(C.staminaMax || 100, (C.stamina || 0) + (eff.st || 0)));
    C.spirit = Math.max(0, Math.min(C.spiritMax || 100, (C.spirit || 0) + (eff.sp || 0)));
    C.face = Math.max(0, Math.min(100, (C.face || 0) + (eff.fc || 0)));
    C.rating = Math.max(0, Math.min(100, (C.rating || 0) + (eff.rt || 0)));
    if (typeof global.en === 'function') { global.en(['money', 'stamina', 'spirit', 'face']); }
    if (SFX) { SFX.play(eff.money > 0 ? 'coin' : 'bell'); }
    toast(msg);
  }

  function drawRelic() {
    if (!loggedIn()) { return needLogin(); }
    loading('在旧物堆里翻找', '看看上一个活过的人留下了什么');
    NET.req('relic.draw', {}, { timeout: 6000 }).then(function (d) {
      if (!d || !d.relic) {
        return sheet({
          title: '还没有遗物',
          sub: '等更多人走完一辈子，这里就会有东西了。',
          html: '<p class="lnet-muted">遗物来自别人的结局。你自己走后也会留下一件。</p>'
        });
      }
      var r = d.relic;
      var eff = r.effect || {};
      var lines = [];
      var names = { money: '钱', stamina: '体力', staminaMax: '体力上限', spirit: '精神', face: '体面' };
      for (var k in eff) {
        if (eff[k]) { lines.push((names[k] || k) + ' ' + (eff[k] > 0 ? '+' : '') + eff[k]); }
      }
      sheet({
        title: r.name,
        sub: '别人的遗物',
        html:
          '<div class="lnet-quote">' + esc(r.text) + '</div>' +
          (lines.length ? '<p class="lnet-muted">带上它：' + esc(lines.join('、')) + '</p>' : ''),
        buttons: [
          { t: '带上', pri: true, fn: function () {
            var C = global.C || {};
            C.money = (C.money || 0) + (eff.money || 0);
            C.staminaMax = (C.staminaMax || 100) + (eff.staminaMax || 0);
            C.stamina = Math.min(C.staminaMax, (C.stamina || 0) + (eff.stamina || 0));
            C.spirit = Math.max(0, Math.min(C.spiritMax || 100, (C.spirit || 0) + (eff.spirit || 0)));
            C.face = Math.max(0, Math.min(100, (C.face || 0) + (eff.face || 0)));
            if (typeof global.en === 'function') { global.en(); }
            if (SFX) { SFX.play('bell'); }
          } },
          { t: '放回去' }
        ]
      });
    }).catch(function (e) { toast((e && e.message) || '没取到', true); });
  }

  // ============================================================
  // 各个玩法的面板
  // ============================================================
  function openKarma() {
    if (!loggedIn()) { return needLogin(); }
    NET.req('karma.draw', {}, { timeout: 6000 }).then(function (d) {
      if (!d || !d.karma) {
        return sheet({ title: '暂时没有业力', sub: '等更多人走完一辈子', html: '<p class="lnet-muted">业力来自别人的选择。池子空了，就等一等。</p>' });
      }
      var k = d.karma;
      sheet({
        title: '承 ' + esc(k.from || '某个人') + ' 之因果',
        sub: '你与一个陌生人之间的账',
        html: '<div class="lnet-quote">' + esc(k.text) + '</div>',
        buttons: [
          { t: esc(k.optA), pri: true, fn: function () { applyKarma(k.effA, '你还了这份人情。'); } },
          { t: esc(k.optB), fn: function () { applyKarma(k.effB, '你装作不知道。'); } }
        ]
      });
    }).catch(function (e) { toast((e && e.message) || '取不到', true); });
  }

  function openJury() {
    if (!loggedIn()) { return needLogin(); }
    loading('调阅案卷', '地府正在翻找一份还没人审的');
    NET.req('case.next', {}, { timeout: 8000 }).then(function (d) {
      if (!d || !d.case) {
        return sheet({
          title: '暂时没有案卷',
          sub: '所有案子都审完了',
          html: '<p class="lnet-muted">案卷来自别人走完的一生。每一世只能被审三次，等新的灵魂下来吧。</p>'
        });
      }
      var c = d.case;
      var frags = c.fragments || [];
      var html = '<p class="lnet-muted">' + esc(c.job) + ' · 这是他一生的六个片段</p><ol class="lnet-frags">';
      frags.forEach(function (f) { html += '<li>' + esc(f) + '</li>'; });
      html += '</ol>';
      if (c.votes > 0) {
        html += '<p class="lnet-muted">已经有 ' + c.votes + ' 位判官看过这份案卷。</p>';
      }
      sheet({
        title: '判 官 陪 审',
        sub: '他不认识你，你也不知道他是谁',
        html: html,
        buttons: [
          { t: '判 善', pri: true, fn: function () { vote(c.id, 2); } },
          { t: '判 平', fn: function () { vote(c.id, 1); } },
          { t: '判 恶', fn: function () { vote(c.id, 0); } }
        ],
        maskClose: false
      });
    }).catch(function (e) { toast((e && e.message) || '取不到案卷', true); });
  }

  function vote(caseId, verdict) {
    NET.req('case.vote', { case_id: caseId, verdict: verdict, speech_key: '' }, { timeout: 8000 })
      .then(function (d) {
        if (SFX) { SFX.play('fate'); }
        if (d && d.closed) {
          var ok = d.correct;
          sheet({
            title: ok ? '明 察' : '判 错 了',
            sub: '这一份已经凑够三票',
            html:
              '<p>三官合议的结果是：<b style="font-size:17px">' +
              esc(d.final === 2 ? '善' : d.final === 1 ? '平' : '恶') + '</b></p>' +
              '<p class="lnet-muted">' + (ok
                ? '你和他想的一样。明察声望 +2。'
                : '你和另外两位意见不同。没关系，判官本来就是三种人。') + '</p>',
            buttons: [
              { t: '再审一份', pri: true, fn: function () { setTimeout(openJury, 120); } },
              { t: '知道了' }
            ]
          });
        } else {
          var need = (d && d.need) || 2;
          toast('记下了。还差 ' + need + ' 位判官。');
          if (Session) { Session.refresh(); }
        }
      })
      .catch(function (e) { toast((e && e.message) || '投票失败', true); });
  }

  function openRank() {
    if (!NET || NET.status.online === false) { return needLogin(); }
    var types = [
      ['score', '最高分'], ['low', '最低分'], ['job', '身份'],
      ['province', '省份'], ['merit', '阴德'], ['judge', '明察']
    ];
    var html = '<div class="lnet-tabs">' + types.map(function (t, i) {
      return '<button type="button" data-t="' + t[0] + '" class="' + (i === 0 ? 'on' : '') + '">' + t[1] + '</button>';
    }).join('') + '</div><div id="lnet-rank-body"><p class="lnet-muted">读取中…</p></div>';

    var el = sheet({ title: '排 行 榜', sub: '活过的人留下的痕迹', html: html });

    function load(t) {
      var body = el.querySelector('#lnet-rank-body');
      body.innerHTML = '<p class="lnet-muted">读取中…</p>';
      NET.req('rank.list', { type: t, limit: 20 }, { silent: true }).then(function (d) {
        var rows = (d && d.rows) || [];
        if (!rows.length) {
          body.innerHTML = '<p class="lnet-muted">这个榜还是空的。你可以是第一个。</p>';
          return;
        }
        var out = '<ul class="lnet-list">';
        rows.forEach(function (r, i) {
          var name = r.nickname || r.username || '匿名';
          var right = '';
          if (t === 'score' || t === 'low') {
            right = (r.score || 0) + ' 分';
            name = name + ' · ' + (r.job_name || r.job || '');
          } else if (t === 'job') {
            name = r.job_name;
            right = r.plays + ' 局 / 均 ' + (r.avg_score || 0);
          } else if (t === 'province') {
            name = r.province;
            right = '均 ' + money(r.avg_money);
          } else if (t === 'merit') {
            right = (r.merit || 0) + ' 阴德';
          } else if (t === 'judge') {
            right = (r.judge_score || 0) + ' 明察';
          }
          out += '<li><span><b>' + (i + 1) + '.</b> ' + esc(name) + '</span><span>' + esc(right) + '</span></li>';
        });
        out += '</ul>';
        body.innerHTML = out;
      }).catch(function () {
        body.innerHTML = '<p class="lnet-muted">读取失败。</p>';
      });
    }

    el.querySelectorAll('.lnet-tabs button').forEach(function (b) {
      b.onclick = function () {
        el.querySelectorAll('.lnet-tabs button').forEach(function (x) { x.classList.remove('on'); });
        this.classList.add('on');
        load(this.getAttribute('data-t'));
      };
    });
    load('score');
  }

  function openReport() {
    NET.req('report.summary', {}, { silent: true }).then(function (d) {
      d = d || {};
      sheet({
        title: '全 服 人 生 报 告',
        sub: '这个服务器上的人是怎么活的',
        html:
          '<div class="lnet-end-grid">' +
            '<div><span>注册</span><b>' + (d.users || 0) + '</b></div>' +
            '<div><span>走完一生</span><b>' + (d.lives || 0) + '</b></div>' +
            '<div><span>破产率</span><b>' + (d.broke_rate || 0) + '%</b></div>' +
            '<div><span>平均天数</span><b>' + (d.avg_day || 0) + '</b></div>' +
            '<div><span>平均资产</span><b>' + money(d.avg_money) + '</b></div>' +
            '<div><span>平均分</span><b>' + (d.avg_score || 0) + '</b></div>' +
          '</div>' +
          '<p class="lnet-muted">' + esc(d.note || ('最常见的结局是「' + (d.top_ending || '—') + '」。')) + '</p>'
      });
    }).catch(function (e) { toast((e && e.message) || '读取失败', true); });
  }

  function openMarket() {
    if (!loggedIn()) { return needLogin(); }
    loading('进 交 易 所', '阴德与阳寿在这里换手');
    NET.req('market.list', {}, { timeout: 8000 }).then(function (d) {
      var orders = (d && d.orders) || [];
      var mine = (d && d.mine) || [];
      var html = '<p class="lnet-muted">这里交易的是「阳寿天数」和「阴德」。' +
        '阳寿只有在你死后才真正结算，所以卖阳寿的人，是在提前花自己的日子。</p>';

      if (orders.length) {
        html += '<ul class="lnet-list">';
        orders.slice(0, 12).forEach(function (o) {
          html += '<li><span>' + esc(o.nickname) + ' ' +
            (o.side === 'sell' ? '出让' : '求购') + ' ' + o.qty + ' 天</span>' +
            '<span>' + o.price + ' 阴德/天</span></li>';
        });
        html += '</ul>';
      } else {
        html += '<p class="lnet-muted">现在没有挂单。</p>';
      }

      if (mine.length) {
        html += '<p class="lnet-muted" style="margin-top:14px">我的挂单</p><ul class="lnet-list">';
        mine.slice(0, 6).forEach(function (o) {
          html += '<li><span>' + (o.side === 'sell' ? '出让' : '求购') + ' ' + o.qty + ' 天 × ' + o.price +
            '</span><span>' + (o.status === 0 ? '挂单中' : o.status === 1 ? '已成交' : '已撤销') + '</span></li>';
        });
        html += '</ul>';
      }

      sheet({
        title: '阴 德 交 易 所',
        sub: '阳寿换阴德，阴德换阳寿',
        html: html,
        buttons: [
          { t: '出让阳寿', pri: true, fn: function () { placeOrder('sell'); } },
          { t: '买入阳寿', fn: function () { placeOrder('buy'); } },
          { t: '关闭' }
        ]
      });
    }).catch(function (e) { toast((e && e.message) || '读取失败', true); });
  }

  function placeOrder(side) {
    var el = sheet({
      title: side === 'sell' ? '出让阳寿' : '买入阳寿',
      sub: side === 'sell' ? '你会失去这些天，换来阴德' : '用阴德买下别人的日子',
      html:
        '<label class="lnet-fld">天数（1-30）<input id="lnet-qty" type="number" min="1" max="30" value="3"></label>' +
        '<label class="lnet-fld">单价（1-500 阴德/天）<input id="lnet-price" type="number" min="1" max="500" value="10"></label>',
      buttons: [
        { t: '挂出去', pri: true, keep: true, fn: function () {
          var qty = parseInt(el.querySelector('#lnet-qty').value, 10) || 0;
          var price = parseInt(el.querySelector('#lnet-price').value, 10) || 0;
          NET.req('market.place', { side: side, qty: qty, price: price }, { timeout: 8000 })
            .then(function () {
              toast('挂上了。等一个愿意换的人。');
              if (Session) { Session.refresh(); }
              closeSheet();
              setTimeout(openMarket, 200);
            })
            .catch(function (e) { toast((e && e.message) || '挂单失败', true); });
        } },
        { t: '算了' }
      ]
    });
  }

  function openPledge() {
    if (!loggedIn()) { return needLogin(); }
    var el = sheet({
      title: '典 当 行',
      sub: '把未来的某一天，提前换成今天能用的东西',
      html:
        '<p class="lnet-muted">每抵押 1 天阳寿，立刻得到 8 点阴德。<br>' +
        '到期不赎回，那一天就真的没了。</p>' +
        '<label class="lnet-fld">抵押天数（1-20）<input id="lnet-days" type="number" min="1" max="20" value="3"></label>',
      buttons: [
        { t: '当 掉', pri: true, keep: true, fn: function () {
          var days = parseInt(el.querySelector('#lnet-days').value, 10) || 0;
          NET.req('pledge.create', { days: days }, { timeout: 8000 }).then(function (d) {
            if (SFX) { SFX.play('spend'); }
            toast('当掉了 ' + (d.days || days) + ' 天，拿到 ' + (d.cash || 0) + ' 阴德。');
            if (Session) { Session.refresh(); }
            closeSheet();
          }).catch(function (e) { toast((e && e.message) || '当不掉', true); });
        } },
        { t: '看看我的当票', fn: function () { setTimeout(showPledges, 120); } },
        { t: '算了' }
      ]
    });
  }

  function showPledges() {
    NET.req('pledge.list', {}, { silent: true }).then(function (rows) {
      rows = rows || [];
      if (!rows.length) {
        return sheet({ title: '没有当票', sub: '你还没有抵押过任何一天', html: '<p class="lnet-muted">挺好的。</p>' });
      }
      var html = '<ul class="lnet-list">';
      rows.forEach(function (p) {
        html += '<li><span>' + p.days + ' 天 · ' + p.cash + ' 阴德' +
          '</span><span>' + (p.status === 0 ? '未赎回（第 ' + p.due_day + ' 天到期）' : p.status === 1 ? '已赎回' : '已清算') + '</span></li>';
      });
      html += '</ul>';
      sheet({
        title: '我 的 当 票',
        sub: '赎回要付 1.2 倍的阴德',
        html: html,
        buttons: [{ t: '知道了', pri: true }]
      });
    }).catch(function () {});
  }

  function openWish() {
    if (!loggedIn()) { return needLogin(); }
    loading('上 一 炷 香', '给此刻也在这里的某个人');
    NET.req('wish.send', {}, { timeout: 8000 }).then(function (d) {
      if (SFX) { SFX.play('bell'); }
      var bless = { spirit: '精神', stamina: '体力', face: '体面' }[d.bless] || '精神';
      sheet({
        title: '香 火 已 上',
        sub: '给 ' + (d.to || '一个陌生人'),
        html:
          '<div class="lnet-quote">你给「' + esc(d.to) + '」上了一炷香。<br>' +
          '他这会儿正在自己的第几天，你不知道。<br>但你们两个都多了一点' + bless + '。</div>',
        buttons: [{ t: '好', pri: true }]
      });
      var C = global.C;
      if (C) {
        if (d.bless === 'stamina') { C.stamina = Math.min(C.staminaMax, C.stamina + 6); }
        else if (d.bless === 'face') { C.face = Math.min(100, C.face + 4); }
        else { C.spirit = Math.min(C.spiritMax, C.spirit + 6); }
        if (typeof global.en === 'function') { global.en(); }
      }
    }).catch(function (e) {
      toast((e && e.message) || '此刻没有别人在这里', true);
    });
  }

  function openBottle() {
    if (!loggedIn()) { return needLogin(); }
    NET.req('bottle.draw', {}, { timeout: 6000 }).then(function (d) {
      if (!d || !d.bottle) { return sheet({ title: '河里什么也没有', html: '<p class="lnet-muted">等有人喝过孟婆汤，河上就会有东西漂过来。</p>' }); }
      if (SFX) { SFX.play('fate'); }
      sheet({
        title: '孟 婆 汤',
        sub: d.bottle.fresh ? '这是某个人真正留下的' : '这是一句流传很久的话',
        html: '<div class="lnet-quote">' + esc(d.bottle.text) + '</div>' +
              '<p class="lnet-muted">他不认识你。他只是想说一句。</p>'
      });
    }).catch(function (e) { toast((e && e.message) || '取不到', true); });
  }

  function openLetter() {
    if (!loggedIn()) { return needLogin(); }
    var C = global.C || {};
    NET.req('letter.draw', {
      job: (C.job && C.job.id) || '',
      day: C.day || 1,
      weather: C.weather || 'sunny',
      season: C.season || 0
    }, { timeout: 6000 }).then(function (d) {
      if (!d || !d.letter) { return sheet({ title: '三生石上没有字', html: '<p class="lnet-muted">还没有人写过。</p>' }); }
      if (SFX) { SFX.play('fate'); }
      sheet({
        title: '三 生 石',
        sub: d.letter.fresh ? '这封信是写给你的' : '这是一段很久以前的话',
        html: '<div class="lnet-quote">' + esc(d.letter.text) + '</div>' +
              '<p class="lnet-muted">写信的人只说了条件，没说名字。</p>'
      });
    }).catch(function (e) { toast((e && e.message) || '取不到', true); });
  }

  function openHome() {
    if (!loggedIn()) { return needLogin(); }
    sheet({
      title: '望 乡 台',
      sub: '你还惦记着什么',
      html:
        '<p class="lnet-muted">在世的时候可以留一个牵挂。你走了以后，别人会来这里看一眼。</p>' +
        '<label class="lnet-fld">是什么<select id="lnet-home-kind">' +
          '<option value="person">一个人</option><option value="place">一个地方</option><option value="thing">一件东西</option>' +
        '</select></label>' +
        '<label class="lnet-fld">具体是<select id="lnet-home-name">' +
          ['妈妈', '父亲', '女儿', '儿子', '妻子', '丈夫', '弟弟', '妹妹', '那条街', '那家店', '老房子', '我的猫', '那棵树', '那辆旧车', '工位', '楼下的路灯']
            .map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') +
        '</select></label>',
      buttons: [
        { t: '记下来', pri: true, keep: true, fn: function () {
          var el = sheetEl;
          var kind = el.querySelector('#lnet-home-kind').value;
          var name = el.querySelector('#lnet-home-name').value;
          NET.req('home.put', { kind: kind, name: name, life_id: (Sync && Sync.S.lifeId) || 0 }, { timeout: 6000 })
            .then(function () { toast('记下了。'); closeSheet(); })
            .catch(function (e) { toast((e && e.message) || '没记成', true); });
        } },
        { t: '去看看别人的', fn: function () { setTimeout(visitHome, 120); } },
        { t: '我的牵挂', fn: function () { setTimeout(myHomes, 120); } }
      ]
    });
  }

  function visitHome() {
    NET.req('home.visit', {}, { timeout: 6000 }).then(function (d) {
      var v = d && d.visit;
      if (!v) { return toast('台上没有人。', true); }
      if (SFX) { SFX.play('bell'); }
      sheet({
        title: '望 乡 台 · ' + esc(v.name),
        sub: '有 ' + v.visits + ' 个人来看过',
        html: '<div class="lnet-quote">' + esc(v.note || '……') + '</div>' +
              '<p class="lnet-muted">你留下的话，会传到他那里。</p>'
      });
    }).catch(function (e) { toast((e && e.message) || '去不了', true); });
  }

  function myHomes() {
    NET.req('home.mine', {}, { silent: true }).then(function (d) {
      var homes = (d && d.homes) || [];
      if (!homes.length) { return sheet({ title: '还没有牵挂', html: '<p class="lnet-muted">还没有记下任何牵挂。</p>' }); }
      var html = '';
      homes.forEach(function (h) {
        html += '<div class="lnet-end-title" style="margin-top:10px">' + esc(h.name) +
          ' <span class="lnet-muted">被看过 ' + h.visits + ' 次</span></div>';
        if (h.notes && h.notes.length) {
          html += '<div class="lnet-quote">' + h.notes.map(esc).join('<br>') + '</div>';
        } else {
          html += '<p class="lnet-muted">还没有人来过。</p>';
        }
      });
      sheet({ title: '我 的 牵 挂', sub: '有人替你去看过', html: html });
    }).catch(function () {});
  }

  function openGhost() {
    if (!NET || NET.status.online === false) { return needLogin(); }
    NET.req('ghost.hot', { area: 'gate' }, { silent: true }).then(function (d) {
      var pts = (d && d.points) || [];
      var html = '<p class="lnet-muted">鬼火是别人在地府里停下过的地方。密集处说明那里发生过故事。</p>';
      if (!pts.length) {
        html += '<p class="lnet-muted">现在还没有鬼火。</p>';
      } else {
        html += '<ul class="lnet-list">';
        pts.slice(0, 12).forEach(function (p) {
          html += '<li><span>(' + p.x + ', ' + p.z + ')</span><span>' + p.cnt + ' 处</span></li>';
        });
        html += '</ul>';
      }
      sheet({ title: '鬼 火 指 路', sub: '幽冥第一关 · 鬼门关', html: html });
    }).catch(function () {});
  }

  function openTimeline() {
    if (!loggedIn()) { return needLogin(); }
    NET.req('life.list', {}, { silent: true }).then(function (rows) {
      rows = rows || [];
      if (!rows.length) { return sheet({ title: '还没有前世', html: '<p class="lnet-muted">这是你的第一世。</p>' }); }
      var html = '<ul class="lnet-list">';
      rows.slice(0, 12).forEach(function (r) {
        html += '<li><span>第 ' + r.season_no + ' 世 · ' + esc(r.job_name) + '</span><span>' +
          (r.closed ? (r.score + ' 分 · ' + esc(r.ending || '')) : '进行中') + '</span></li>';
      });
      html += '</ul>';
      sheet({ title: '三 世 账 本', sub: '你活过的这些', html: html });
    }).catch(function () {});
  }

  // ============================================================
  // 玩法中枢
  // ============================================================
  var GAMES = [
    { k: 'jury', n: '判官陪审', d: '审别人的一生' },
    { k: 'rank', n: '排行榜', d: '谁活得最好' },
    { k: 'report', n: '全服报告', d: '大家怎么活的' },
    { k: 'karma', n: '业力遗产', d: '承别人的因果' },
    { k: 'relic', n: '遗物', d: '捡一件旧东西' },
    { k: 'market', n: '阴德交易所', d: '阳寿换阴德' },
    { k: 'pledge', n: '典当行', d: '抵押未来的一天' },
    { k: 'wish', n: '香火祈愿', d: '给陌生人上香' },
    { k: 'bottle', n: '孟婆汤', d: '捞一句遗言' },
    { k: 'letter', n: '三生石', d: '收一封隔世信' },
    { k: 'home', n: '望乡台', d: '你的牵挂' },
    { k: 'ghost', n: '鬼火指路', d: '地府热点' },
    { k: 'timeline', n: '三世账本', d: '你活过几辈子' }
  ];

  function openGame(k) {
    var map = {
      jury: openJury, rank: openRank, report: openReport, karma: openKarma,
      relic: drawRelic, market: openMarket, pledge: openPledge, wish: openWish,
      bottle: openBottle, letter: openLetter, home: openHome, ghost: openGhost,
      timeline: openTimeline
    };
    var fn = map[k];
    if (fn) { fn(); }
  }

  function openHub() {
    var u = NET && NET.getUser();
    var html = '<p class="lnet-muted">' +
      (loggedIn()
        ? '已登录：' + esc(u.nickname || u.username) + '　阴德 ' + (u.merit || 0) + '　可让阳寿 ' + (u.lifespan || 0) + ' 天'
        : '未登录 —— 只能玩本体，联网玩法要登录后才开') + '</p>';
    html += '<div class="lnet-grid">';
    GAMES.forEach(function (g) {
      html += '<button type="button" class="lnet-grid-item" data-g="' + g.k + '">' +
        '<b>' + g.n + '</b><span>' + g.d + '</span></button>';
    });
    html += '</div>';

    var el = sheet({
      title: '三 界 玩 法',
      sub: '这里的东西，都是别人也在这里留下的',
      html: html,
      buttons: loggedIn()
        ? [{ t: '关闭', pri: true }]
        : [{ t: '去登录', pri: true, fn: function () { Session && Session.open('login'); } }, { t: '先不登' }]
    });

    el.querySelectorAll('.lnet-grid-item').forEach(function (b) {
      b.onclick = function () {
        closeSheet();
        openGame(this.getAttribute('data-g'));
      };
    });
  }

  /** 往账号面板里塞"玩法"按钮 */
  function injectPanelLinks() {
    var box = $('lnet-links');
    if (!box) { return; }
    box.innerHTML = '';
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = '三界玩法';
    b.style.flex = '1 1 100%';
    b.onclick = function () { openHub(); };
    box.appendChild(b);
  }

  // ============================================================
  // 三界判定：把后台的概率规则拉下来
  // ------------------------------------------------------------
  //  90-season-end.js 里有一套默认值（全 100%），这里拿到后台配置就覆盖掉。
  //  拉不到、没登录、后端挂了，都保持默认，单机玩法不受影响。
  // ============================================================
  function fetchRealm(tryN) {
    tryN = tryN || 0;
    // 脚本顺序理论上 api.js 在前，但 CDN / 缓存 / 异步注入都可能打乱，给三次机会再放弃
    if (!global.NET || typeof global.NET.req !== 'function') {
      if (tryN < 3) { setTimeout(function () { fetchRealm(tryN + 1); }, 500); }
      return;
    }
    global.NET.req('realm.config', {}, { timeout: 6000, silent: true }).then(function (d) {
      if (!d || typeof d !== 'object') { return; }
      var R = global.LIFE_REALM || (global.LIFE_REALM = {});
      if (d.enabled !== undefined) { R.enabled = !!d.enabled; }
      if (d.p_hell !== undefined) { R.pHell = Number(d.p_hell) || 0; }
      if (d.p_heaven !== undefined) { R.pHeaven = Number(d.p_heaven) || 0; }
      if (d.evil_need !== undefined) { R.evilNeed = Number(d.evil_need) || 1; }
      if (d.mercy !== undefined) { R.mercy = Number(d.mercy) || 0; }
    }).catch(function () { });
  }

  // ============================================================
  // 启动
  // ============================================================
  function init() {
    mountSfxButton();
    installPhone();
    installHooks();
    fetchRealm();

    if (Session) {
      Session.onChange(function () { injectPanelLinks(); });
      injectPanelLinks();
    }

    setInterval(pollAmbience, 2500);
    setTimeout(pollAmbience, 1200);

    // 有本地存档就提示续命
    setTimeout(tryResume, 2600);

    console.log('[online] 已接入：音效 / 职业来电 / 云存档 / 13 个联网玩法');
  }

  function tryResume() {
    if (!Sync) { return; }
    var info = Sync.localSaveInfo();
    if (!info || !info.day || info.day <= 1) { return; }
    if (!global.C || global.C.started) { return; }

    sheet({
      title: '你上一世还没走完',
      sub: '第 ' + info.day + ' 天 · ' + (info.jobName || '') + (info.money != null ? ' · ' + money(info.money) : ''),
      html: '<p class="lnet-muted">这是这台设备上留下的存档。要继续吗？</p>',
      buttons: [
        { t: '继续那一世', pri: true, fn: function () {
          var snap = Sync.fromLocal();
          if (snap && Sync.restore(snap)) { toast('接着上次的走。'); }
          else { toast('存档对不上，只能重开了。', true); }
        } },
        { t: '重新开始', fn: function () {
          try { localStorage.removeItem('life_offline_save'); } catch (e) {}
        } }
      ]
    });
  }

  global.Online = {
    hub: openHub,
    open: openGame,
    sheet: sheet,
    close: closeSheet,
    karma: openKarma,
    jury: openJury,
    rank: openRank,
    report: openReport,
    market: openMarket,
    pledge: openPledge,
    wish: openWish,
    relic: drawRelic
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
