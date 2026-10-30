/* ============================================================
 *  js/net/realm-trial.js
 *  三界审判：孽镜台 → 孟婆汤 → 六道轮回（地府）/ 受封（天庭）
 *  ------------------------------------------------------------
 *  原来地府和天庭只是两个"到了打个卡"的场景，玩家看一眼就回阳世了。
 *  现在把死后的这段路做成一次真正的结算：
 *
 *    地府  孽镜台   把这一世做过的恶事一件件照出来，能认，也能辩
 *          孟婆汤   喝几成，决定下一世继承多少
 *          六道轮回 挑下一世的出身
 *    天庭  受封     没有恶事可审，直接给个仙职，换下一世的加成
 *
 *  结果写进 localStorage 的 life_next_v1，index.html 开局时读。
 *  没走完就点"回阳世"也没关系 —— 默认值就是"全喝、投人道"。
 * ============================================================ */
(function () {
  'use strict';

  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (q.get('from') !== 'life') { return; }

  var isDifu = (location.pathname.split('/').pop() || '').toLowerCase().indexOf('difu') >= 0;

  var G = parseInt(q.get('g') || '0', 10) || 0,
    K = parseInt(q.get('k') || '0', 10) || 0,
    D = parseInt(q.get('d') || '0', 10) || 0,
    JOB = q.get('j') || '',
    KIND = q.get('e') || '';

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* 这一世的善恶明细：95-fate-extra.js 在收尾时写下来的 */
  function loadDeeds() {
    try {
      var raw = localStorage.getItem('life_deeds_v1');
      var d = raw ? JSON.parse(raw) : null;
      if (!d || !Array.isArray(d.deeds)) { return []; }
      return d.deeds;
    } catch (e) { return []; }
  }

  var DEEDS = loadDeeds();
  var EVIL_LIST = DEEDS.filter(function (d) { return d && d.evil; });
  var GOOD_LIST = DEEDS.filter(function (d) { return d && d.good; });

  /* 兜底：URL 里的 k 比明细多，说明明细丢了，用条数占位 */
  if (EVIL_LIST.length < K) {
    for (var i = EVIL_LIST.length; i < K; i++) {
      EVIL_LIST.push({ t: '第 ' + (i + 1) + ' 件', x: '你已经不太记得了', evil: 1, d: 0 });
    }
  }

  /* ------------------------------------------------------------
   *  状态
   * ---------------------------------------------------------- */

  var S = {
    evilLeft: K,      /* 净剩恶业 */
    argued: 0,        /* 辩掉几件 */
    goodLeft: G,      /* 剩余可用善业 */
    mem: 0,           /* 孟婆汤浓度 0 / .3 / 1 */
    realm6: 'human',  /* 六道 */
    post: '',         /* 天庭仙职 */
    stage: 0
  };

  var NEXT_KEY = 'life_next_v1';

  function saveNext() {
    var bonus = { money: 0, sta: 0, sp: 0 };
    /* 天庭没有孟婆汤这一关，善业全数带走；地府才按浓度折 */
    var mem = isDifu ? S.mem : 1;

    if (S.post === 'fu') { bonus.money += 10000; }
    if (S.post === 'shou') { bonus.sta += 20; }
    if (S.post === 'ming') { bonus.sp += 20; }

    if (isDifu) {
      if (S.realm6 === 'human') { bonus.money += 3000; }
      if (S.realm6 === 'animal') { bonus.sta += 30; bonus.money -= 3000; }
      if (S.realm6 === 'hungry') { bonus.money += 15000; bonus.sp -= 30; }
      if (S.realm6 === 'asura') { bonus.money += 8000; }
    }

    try {
      localStorage.setItem(NEXT_KEY, JSON.stringify({
        mem: mem,
        realm6: S.realm6,
        good: Math.round(G * mem),
        evil: Math.round(S.evilLeft * mem),
        bonus: bonus,
        at: Date.now()
      }));
    } catch (e) { }
  }

  /* ------------------------------------------------------------
   *  样式
   * ---------------------------------------------------------- */

  var RED = '#d8b45a', BG1 = 'rgba(18,12,14,.97)', BG2 = 'rgba(9,7,9,.98)';
  var BLUE = '#9fd0f5', TBG1 = 'rgba(12,20,28,.96)', TBG2 = 'rgba(8,14,20,.98)';

  var CSS = ''
    + '#rtBox{position:fixed;inset:0;z-index:1600;display:none;align-items:center;justify-content:center;'
    + 'background:rgba(4,4,6,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:18px;box-sizing:border-box}'
    + '#rtBox.show{display:flex}'
    + '#rtIn{width:min(560px,96vw);max-height:88vh;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;'
    + 'background:linear-gradient(180deg,' + BG1 + ',' + BG2 + ');border:1px solid rgba(212,175,55,.28);'
    + 'box-shadow:0 24px 70px rgba(0,0,0,.7),inset 0 0 40px rgba(150,40,20,.07);'
    + 'color:#e8dcc6;font-family:"Songti SC","STSong","SimSun","Noto Serif SC",serif}'
    + '#rtBox.tg #rtIn{background:linear-gradient(180deg,' + TBG1 + ',' + TBG2 + ');border-color:rgba(150,200,240,.3);'
    + 'box-shadow:0 24px 70px rgba(0,0,0,.65),inset 0 0 40px rgba(60,140,220,.09);color:#dceaf6}'
    + '#rtHd{display:flex;align-items:center;gap:9px;padding:15px 18px 12px;border-bottom:1px solid rgba(212,175,55,.16);font-size:12.5px;letter-spacing:3px}'
    + '#rtBox.tg #rtHd{border-bottom-color:rgba(150,200,240,.18)}'
    + '#rtHd .seal{width:22px;height:22px;line-height:22px;text-align:center;font-size:11px;border-radius:4px;'
    + 'background:linear-gradient(145deg,#8e1a12,#5c0d08);border:1px solid rgba(212,175,55,.45);color:#ffe9c8;letter-spacing:0}'
    + '#rtBox.tg #rtHd .seal{background:linear-gradient(145deg,#2f6e9e,#1a4568);color:#eaf6ff;border-color:rgba(150,200,240,.5)}'
    + '#rtHd .stp{margin-left:auto;font-size:10.5px;letter-spacing:2px;color:rgba(232,220,198,.42)}'
    + '#rtBd{padding:18px;overflow:auto;line-height:1.85;font-size:13px}'
    + '#rtBd h4{margin:0 0 8px;font-size:15px;font-weight:500;letter-spacing:2px;color:#f2e6cd}'
    + '#rtBox.tg #rtBd h4{color:#eaf6ff}'
    + '#rtBd p{margin:0 0 12px;color:rgba(232,220,198,.72);font-size:12.5px}'
    + '#rtBox.tg #rtBd p{color:rgba(220,234,246,.72)}'
    + '.rt-mirror{position:relative;margin:4px 0 14px;padding:16px 14px;border-radius:12px;'
    + 'background:radial-gradient(ellipse at 50% 20%,rgba(120,150,170,.16),rgba(10,10,14,.55));'
    + 'border:1px solid rgba(150,190,210,.2);text-align:center}'
    + '.rt-mirror .no{font-size:10.5px;letter-spacing:3px;color:rgba(180,210,230,.5)}'
    + '.rt-mirror .ti{margin-top:7px;font-size:16px;letter-spacing:1.5px;color:#eaf2f8}'
    + '.rt-mirror .xi{margin-top:8px;font-size:12px;color:rgba(200,220,235,.66);line-height:1.8}'
    + '.rt-mirror .by{margin-top:9px;font-size:10.5px;color:rgba(180,210,230,.38);letter-spacing:1px}'
    + '.rt-acts{display:flex;gap:10px;margin-top:6px}'
    + '.rt-acts button{flex:1;padding:11px 8px;font:inherit;font-size:13px;letter-spacing:2px;cursor:pointer;border-radius:9px;'
    + 'background:linear-gradient(180deg,rgba(120,30,22,.7),rgba(70,16,12,.85));color:#ffe6d4;border:1px solid rgba(212,175,55,.26)}'
    + '.rt-acts button:hover{filter:brightness(1.16)}'
    + '.rt-acts button.alt{background:linear-gradient(180deg,rgba(40,70,90,.6),rgba(20,36,50,.85));color:#dcecf8;border-color:rgba(150,200,240,.24)}'
    + '.rt-acts button:disabled{opacity:.36;cursor:not-allowed;filter:none}'
    + '#rtBox.tg .rt-acts button{background:linear-gradient(180deg,#2f6e9e,#1b4a6d);color:#eaf6ff;border-color:rgba(150,200,240,.3)}'
    + '.rt-meta{display:flex;gap:14px;font-size:11.5px;color:rgba(232,220,198,.55);margin-bottom:12px}'
    + '.rt-meta b{color:#e8c88a;font-weight:500}'
    + '#rtBox.tg .rt-meta b{color:#9fd0f5}'
    + '.rt-list{margin:0;padding:0;list-style:none;max-height:34vh;overflow:auto}'
    + '.rt-list li{padding:8px 10px;margin-bottom:6px;border-radius:8px;background:rgba(255,255,255,.03);'
    + 'border-left:2px solid rgba(180,70,50,.5);font-size:12px;color:rgba(232,220,198,.78)}'
    + '.rt-list li.ok{border-left-color:rgba(90,170,130,.6);color:rgba(190,225,205,.75);text-decoration:line-through;opacity:.62}'
    + '.rt-opts{display:grid;gap:9px}'
    + '.rt-opt{padding:12px 13px;text-align:left;font:inherit;font-size:12.5px;cursor:pointer;border-radius:10px;'
    + 'background:rgba(255,255,255,.035);border:1px solid rgba(212,175,55,.2);color:#e8dcc6;line-height:1.7}'
    + '.rt-opt:hover{background:rgba(255,255,255,.075);border-color:rgba(212,175,55,.4)}'
    + '.rt-opt b{display:block;font-size:13.5px;font-weight:500;letter-spacing:1.5px;margin-bottom:4px;color:#f2e6cd}'
    + '.rt-opt span{display:block;margin-top:5px;font-size:11.5px;color:rgba(232,220,198,.58);line-height:1.65}'
    + '#rtBox.tg .rt-opt{border-color:rgba(150,200,240,.2);color:#dceaf6}'
    + '#rtBox.tg .rt-opt:hover{background:rgba(150,200,240,.09);border-color:rgba(150,200,240,.4)}'
    + '#rtBox.tg .rt-opt b{color:#eaf6ff}'
    + '#rtBox.tg .rt-opt span{color:rgba(220,234,246,.6)}'
    + '.rt-ft{padding:0 18px 16px;display:flex;gap:10px}'
    + '.rt-ft button{flex:1;padding:10px;font:inherit;font-size:12.5px;letter-spacing:2px;cursor:pointer;border-radius:9px;'
    + 'background:transparent;border:1px solid rgba(212,175,55,.22);color:rgba(232,220,198,.62)}'
    + '.rt-ft button:hover{color:#e8dcc6;border-color:rgba(212,175,55,.4)}'
    + '.rt-big{font-size:26px;letter-spacing:4px;text-align:center;margin:10px 0 6px;color:#f2e6cd}'
    + '.rt-sub{text-align:center;font-size:12px;color:rgba(232,220,198,.55);margin-bottom:16px;letter-spacing:1px}'
    + '#rtTrial{width:100%;padding:9px;font-size:12px;letter-spacing:3px;cursor:pointer;margin-bottom:8px;'
    + 'color:#ffeede;background:linear-gradient(180deg,#a8561c,#6b2f0d);border:1px solid rgba(212,175,55,.3);border-radius:9px;font-family:inherit}'
    + '#rgCard.tg #rtTrial{background:linear-gradient(180deg,#2f6e9e,#1b4a6d);color:#eaf6ff;border-color:rgba(150,200,240,.35)}'
    + '#rtTrial:hover{filter:brightness(1.14)}'
    + '@media(max-width:560px){#rtBd{padding:14px}#rtIn{max-height:92vh}}';

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ------------------------------------------------------------
   *  DOM
   * ---------------------------------------------------------- */

  var box = document.createElement('div');
  box.id = 'rtBox';
  if (!isDifu) { box.className = 'tg'; }
  box.innerHTML = '<div id="rtIn">' +
    '<div id="rtHd"><span class="seal">' + (isDifu ? '冥' : '仙') + '</span>' +
    '<span id="rtTitle">孽 镜 台</span><span class="stp" id="rtStep"></span></div>' +
    '<div id="rtBd"></div>' +
    '<div class="rt-ft"><button id="rtSkip">跳过，直接回阳世</button></div>' +
    '</div>';

  function mount() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', mount); return; }
    document.body.appendChild(box);
    hookGate();
  }

  function hookGate() {
    var go = document.getElementById('rgGo');
    if (!go || document.getElementById('rtTrial')) { return; }
    var b = document.createElement('button');
    b.id = 'rtTrial';
    b.className = 'rg-go';
    b.style.marginTop = '8px';
    b.textContent = isDifu ? '受　审' : '受　封';
    go.parentNode.insertBefore(b, go);
    go.style.marginTop = '8px';
    b.onclick = function () {
      var card = document.getElementById('rgCard');
      if (card) { card.classList.add('rg-hide'); }
      box.classList.add('show');
      S.stage = 0;
      render();
    };
  }

  document.addEventListener('DOMContentLoaded', function () { /* 兜底，真正的挂载在 mount() */ });

  var BD = box.querySelector('#rtBd');
  var STEP = box.querySelector('#rtStep');
  var TT = box.querySelector('#rtTitle');

  box.querySelector('#rtSkip').onclick = function () {
    saveNext();
    location.href = 'index.html';
  };

  function head(title, step) {
    TT.textContent = title;
    STEP.textContent = step || '';
  }

  /* ------------------------------------------------------------
   *  一、孽镜台
   * ---------------------------------------------------------- */

  var mirrorIdx = 0;

  function renderMirror() {
    head('孽 镜 台', (mirrorIdx + 1) + ' / ' + EVIL_LIST.length);
    var d = EVIL_LIST[mirrorIdx];
    var canArgue = S.goodLeft > 0 && !d._ok;
    var done = EVIL_LIST.filter(function (x) { return x._ok; }).length;

    BD.innerHTML =
      '<div class="rt-meta"><span>净剩恶业 <b id="rtEvil">' + S.evilLeft + '</b></span>' +
      '<span>可用善业 <b>' + S.goodLeft + '</b></span>' +
      '<span>已辩掉 <b>' + done + '</b> 件</span></div>' +
      '<div class="rt-mirror">' +
      '<div class="no">第 ' + (mirrorIdx + 1) + ' 面</div>' +
      '<div class="ti">' + esc(d.t || '无名之事') + '</div>' +
      '<div class="xi">「' + esc(d.x || '你当时没有解释') + '」</div>' +
      '<div class="by">' + (d.d ? '第 ' + d.d + ' 天' : '具体哪天，记不清了') + '</div>' +
      '</div>' +
      '<div class="rt-acts">' +
      '<button id="rtAdmit">认</button>' +
      '<button class="alt" id="rtArgue"' + (canArgue ? '' : ' disabled') + '>辩（善业 \u22121）</button>' +
      '</div>';

    document.getElementById('rtAdmit').onclick = function () {
      d._admit = true;
      nextMirror();
    };
    document.getElementById('rtArgue').onclick = function () {
      if (S.goodLeft <= 0 || d._ok) { return; }
      d._ok = true;
      d._argued = true;
      S.goodLeft -= 1;
      S.evilLeft = Math.max(0, S.evilLeft - 1);
      S.argued += 1;
      flash('镜面晃了一下。这一件事，你辩过去了。');
      nextMirror();
    };
  }

  function flash(msg) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:1700;'
      + 'padding:9px 16px;border-radius:9px;background:rgba(20,14,14,.92);border:1px solid rgba(212,175,55,.28);'
      + 'color:#e8dcc6;font-size:12.5px;letter-spacing:1px;font-family:"Songti SC","STSong",serif';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .5s'; t.style.opacity = '0'; }, 1400);
    setTimeout(function () { t.remove(); }, 2000);
  }

  function nextMirror() {
    if (mirrorIdx < EVIL_LIST.length - 1) {
      mirrorIdx += 1;
      renderMirror();
      return;
    }
    /* 全部过完了 */
    if (S.evilLeft <= 0) {
      head('镜 面 全 白', '孽镜台 · 终');
      BD.innerHTML =
        '<div class="rt-big">白 光</div>' +
        '<p class="rt-sub">七面镜子同时亮到底，什么也照不出来了。</p>' +
        '<p>你这一世做过的事，被你一件一件辩了个干净。判官合上簿子，看了你很久，最后什么也没写。</p>' +
        '<div class="rt-acts"><button class="alt" id="rtNext">往下走</button></div>';
      document.getElementById('rtNext').onclick = function () { S.stage = 1; render(); };
      return;
    }
    head('孽 镜 台', '终');
    BD.innerHTML =
      '<div class="rt-big">' + S.evilLeft + ' 件</div>' +
      '<p class="rt-sub">镜子收了光。剩下的，都记在簿子上了。</p>' +
      '<p>' + (S.argued ? '你辩掉了 ' + S.argued + ' 件。' : '你一件也没辩。') +
      '剩下的这些，来世会跟着你走一段 —— 走多远，看你喝多少汤。</p>' +
      '<div class="rt-acts"><button id="rtNext">去孟婆桥</button></div>';
    document.getElementById('rtNext').onclick = function () { S.stage = 1; render(); };
  }

  /* ------------------------------------------------------------
   *  二、孟婆汤
   * ---------------------------------------------------------- */

  var SOUP = [
    { v: 0, n: '全 喝', d: '前尘尽忘，一点不带', e: '下一世干干净净，善业恶业都清零' },
    { v: 0.3, n: '喝 七 成', d: '记得一些，说不清是什么', e: '继承 30% 的善恶，也继承 30% 的因果' },
    { v: 1, n: '一 口 不 喝', d: '什么都记得', e: '全数继承，但带着恶名出世，坏事更爱找你' }
  ];

  function renderSoup() {
    head('孟 婆 桥', '第 二 关');
    BD.innerHTML =
      '<h4>碗在这儿</h4>' +
      '<p>「喝多少，自己定。」她把碗推过来，汤面很平，照不出人影。</p>' +
      '<div class="rt-meta"><span>现有善业 <b>' + S.goodLeft + '</b></span><span>净剩恶业 <b>' + S.evilLeft + '</b></span></div>' +
      '<div class="rt-opts">' + SOUP.map(function (s) {
        return '<button class="rt-opt" data-v="' + s.v + '"><b>' + s.n + '</b>' + s.e + '<span>' + s.d + '</span></button>';
      }).join('') + '</div>';

    BD.querySelectorAll('.rt-opt').forEach(function (b) {
      b.onclick = function () {
        S.mem = Number(b.dataset.v);
        S.stage = 2;
        render();
      };
    });
  }

  /* ------------------------------------------------------------
   *  三、六道轮回
   * ---------------------------------------------------------- */

  var SIX = [
    { id: 'human', n: '人 道', d: '苦乐参半，最能折腾', e: '开局多 ¥3,000，各项均衡' },
    { id: 'animal', n: '畜 生 道', d: '不问是非，只管活着', e: '体力上限 +30，但开局少 ¥3,000' },
    { id: 'hungry', n: '饿 鬼 道', d: '什么都想要，什么都吃不饱', e: '开局多 ¥15,000，精神上限 −30' },
    { id: 'asura', n: '修 罗 道', d: '有力气，也有火气', e: '开局多 ¥8,000，恶业更重' }
  ];

  function renderSix() {
    head('六 道 轮 回', '第 三 关');
    BD.innerHTML =
      '<h4>往哪道去</h4>' +
      '<p>轮盘转起来了。你不知道下一格停在哪，但你可以往某个方向推一把。</p>' +
      '<div class="rt-opts">' + SIX.map(function (s) {
        return '<button class="rt-opt" data-id="' + s.id + '"><b>' + s.n + '</b>' + s.e + '<span>' + s.d + '</span></button>';
      }).join('') + '</div>';

    BD.querySelectorAll('.rt-opt').forEach(function (b) {
      b.onclick = function () {
        S.realm6 = b.dataset.id;
        S.stage = 3;
        render();
      };
    });
  }

  /* ------------------------------------------------------------
   *  天庭：受封
   * ---------------------------------------------------------- */

  var POSTS = [
    { id: 'fu', n: '掌 福', d: '管人间那点运气', e: '下一世开局多 ¥10,000' },
    { id: 'shou', n: '掌 寿', d: '管人能撑多久', e: '下一世体力上限 +20' },
    { id: 'ming', n: '掌 明', d: '管人脑子清不清', e: '下一世精神上限 +20' }
  ];

  function renderSeal() {
    head('受 封', '天庭 · 一');
    BD.innerHTML =
      '<h4>挑一个差事</h4>' +
      '<p>「你在人间没做过恶事，」他说，「这在天庭不算常见。」他把三块牌子推到你面前。</p>' +
      '<div class="rt-meta"><span>善业 <b>' + G + '</b></span><span>阳寿 <b>' + D + ' 天</b></span></div>' +
      '<div class="rt-opts">' + POSTS.map(function (s) {
        return '<button class="rt-opt" data-id="' + s.id + '"><b>' + s.n + '</b>' + s.e + '<span>' + s.d + '</span></button>';
      }).join('') + '</div>';

    BD.querySelectorAll('.rt-opt').forEach(function (b) {
      b.onclick = function () {
        S.post = b.dataset.id;
        S.stage = 3;
        render();
      };
    });
  }

  /* ------------------------------------------------------------
   *  收尾
   * ---------------------------------------------------------- */

  function renderDone() {
    head('回 阳 世', '终');
    saveNext();
    var lines = [];
    if (isDifu) {
      lines.push('孟婆汤：' + (S.mem === 0 ? '全喝' : S.mem === 0.3 ? '喝了七成' : '一口没喝'));
      lines.push('投往：' + (SIX.filter(function (x) { return x.id === S.realm6; })[0] || SIX[0]).n.replace(/ /g, ''));
      lines.push('带走的恶业：' + Math.round(S.evilLeft * S.mem) + ' 件');
      lines.push('带走的善业：' + Math.round(G * S.mem) + ' 件');
    } else {
      lines.push('仙职：' + (POSTS.filter(function (x) { return x.id === S.post; })[0] || POSTS[0]).n.replace(/ /g, ''));
      lines.push('带走的善业：' + G + ' 件');
    }

    BD.innerHTML =
      '<div class="rt-big">' + (isDifu ? '可 以 走 了' : '下 去 吧') + '</div>' +
      '<p class="rt-sub">' + (isDifu ? '桥那头有光。' : '云散了一条路出来。') + '</p>' +
      '<ul class="rt-list">' + lines.map(function (l) {
        return '<li class="ok">' + esc(l) + '</li>';
      }).join('') + '</ul>' +
      '<div class="rt-acts"><button id="rtHome">' + (isDifu ? '投 胎' : '下 凡') + '</button></div>';

    document.getElementById('rtHome').onclick = function () {
      location.href = 'index.html';
    };
  }

  function render() {
    var ft = document.querySelector('.rt-ft');
    if (ft) { ft.style.display = S.stage >= 3 ? 'none' : ''; }
    if (!isDifu) {
      if (S.stage === 0) { renderSeal(); return; }
      renderDone();
      return;
    }
    if (S.stage === 0) {
      if (!EVIL_LIST.length) {
        head('孽 镜 台', '无 可 照');
        BD.innerHTML =
          '<div class="rt-big">空</div>' +
          '<p class="rt-sub">七面镜子亮着，什么也没照出来。</p>' +
          '<p>判官翻了三遍簿子，抬头看了你一眼。这一眼不太好懂。</p>' +
          '<div class="rt-acts"><button id="rtNext">去孟婆桥</button></div>';
        document.getElementById('rtNext').onclick = function () { S.stage = 1; render(); };
        return;
      }
      renderMirror();
      return;
    }
    if (S.stage === 1) { renderSoup(); return; }
    if (S.stage === 2) { renderSix(); return; }
    renderDone();
  }

  mount();
})();
