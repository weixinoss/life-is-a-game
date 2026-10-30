/* ============================================================
 *  js/net/realm-gate.js
 *  三界接引牌：地府 / 天庭页面上的一块「我从哪儿来」的浮牌
 *  ------------------------------------------------------------
 *  人生走到结局时，90-season-end.js 会把这一世的履历拼进地址：
 *    difu.html?from=life&e=sick&d=187&j=程序员&g=5&k=2&m=8400&s=34
 *  这个脚本只做三件事：
 *    1. 认得 from=life，把死因、天数、职业、善恶念成人话；
 *    2. 在页面顶上放一块接引牌，说明你为什么在这儿；
 *    3. 给一个「回阳世」的出口，不让玩家困在这两个场景里。
 *
 *  独立成文件、不依赖两个场景各自的代码，两边都能直接引。
 * ============================================================ */
(function () {
  'use strict';

  var q;
  try {
    q = new URLSearchParams(location.search);
  } catch (e) {
    return;
  }
  if (q.get('from') !== 'life') {
    return;
  }

  var ENDING = {
    bankrupt: '撑不住了',
    sick: '身体先垮了',
    collapse: '不想动了',
    complete: '走满了一年'
  };

  var area = (location.pathname.split('/').pop() || '').toLowerCase();
  var isDifu = area.indexOf('difu') >= 0;

  var e = q.get('e') || '',
    d = parseInt(q.get('d') || '0', 10) || 0,
    j = q.get('j') || '',
    g = parseInt(q.get('g') || '0', 10) || 0,
    k = parseInt(q.get('k') || '0', 10) || 0,
    m = parseInt(q.get('m') || '0', 10) || 0,
    s = parseInt(q.get('s') || '0', 10) || 0;

  function money(n) {
    var neg = n < 0,
      v = Math.abs(n);
    var t = v >= 1e8 ? (v / 1e8).toFixed(2).replace(/\.?0+$/, '') + ' 亿'
      : v >= 1e4 ? (v / 1e4).toFixed(1).replace(/\.0$/, '') + ' 万'
        : v.toLocaleString('en-US');
    return (neg ? '-¥' : '¥') + t;
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var rows = [];
  if (d) {
    rows.push(['阳寿', '第 ' + d + ' 天' + (ENDING[e] ? ' · ' + ENDING[e] : '')]);
  }
  if (j) {
    rows.push(['身份', j]);
  }
  rows.push(['善业', g + ' 件']);
  rows.push(['恶业', k + ' 件']);
  if (m) {
    rows.push(['余财', money(m)]);
  }
  if (s) {
    rows.push(['精气', s + '%']);
  }

  var head = isDifu ? '魂归幽冥' : '位列仙班';
  var sub = isDifu
    ? (k > 0 ? '你这一世做过 ' + k + ' 件恶事，孽镜台照得出。' : '你这一世一件恶事也没做，可这地方也不是谁想来就能来的。')
    : (g > 0 ? '你这一世做过 ' + g + ' 件好事。簿上有名，且上去坐坐。' : '你这一世什么都没做。没做过坏事，也算一种干净。');

  var css = ''
    + '#rgCard{position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:1200;'
    + 'width:min(340px,calc(100vw - 28px));padding:13px 15px 12px;border-radius:14px;'
    + 'background:linear-gradient(180deg,rgba(20,14,14,.93),rgba(12,9,11,.95));'
    + 'border:1px solid rgba(212,175,55,.34);box-shadow:0 18px 44px rgba(0,0,0,.55),inset 0 0 26px rgba(180,60,30,.08);'
    + 'color:#e6dac4;font-family:"Songti SC","STSong","SimSun","Noto Serif SC",serif;'
    + 'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);'
    + 'animation:rgIn .7s cubic-bezier(.2,.9,.3,1.1) both;box-sizing:border-box}'
    + '#rgCard.tg{border-color:rgba(150,200,240,.34);box-shadow:0 18px 44px rgba(0,0,0,.5),inset 0 0 26px rgba(80,150,220,.12)}'
    + '@keyframes rgIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}'
    + '#rgCard .rg-h{display:flex;align-items:center;gap:8px;font-size:12px;letter-spacing:3px;color:#f0e2c8}'
    + '#rgCard .rg-h .rg-seal{width:20px;height:20px;line-height:20px;text-align:center;font-size:11px;color:#ffe9c8;'
    + 'background:linear-gradient(145deg,#8e1a12,#5c0d08);border:1px solid rgba(212,175,55,.45);border-radius:4px}'
    + '#rgCard.tg .rg-h .rg-seal{background:linear-gradient(145deg,#2f6e9e,#1a4568);color:#eaf6ff;border-color:rgba(150,200,240,.5)}'
    + '#rgCard .rg-x{margin-left:auto;color:rgba(230,218,196,.5);font-size:15px;line-height:1;padding:0 2px;background:none;border:none;cursor:pointer}'
    + '#rgCard .rg-x:hover{color:#e6dac4}'
    + '#rgCard .rg-sub{margin-top:8px;font-size:11.5px;line-height:1.8;color:rgba(230,218,196,.8)}'
    + '#rgCard .rg-rows{margin-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:3px 10px}'
    + '#rgCard .rg-rows div{display:flex;justify-content:space-between;font-size:11px;color:rgba(230,218,196,.68);'
    + 'border-bottom:1px dotted rgba(230,218,196,.14);padding:3px 0}'
    + '#rgCard .rg-rows b{color:#e6dac4;font-weight:600;letter-spacing:.5px}'
    + '#rgCard .rg-go{margin-top:11px;width:100%;padding:9px;font-size:12px;letter-spacing:3px;cursor:pointer;'
    + 'color:#ffeede;background:linear-gradient(180deg,#8e2b22,#5e1712);border:1px solid rgba(212,175,55,.3);border-radius:9px;'
    + 'font-family:inherit}'
    + '#rgCard.tg .rg-go{background:linear-gradient(180deg,#2f6e9e,#1b4a6d);color:#eaf6ff;border-color:rgba(150,200,240,.35)}'
    + '#rgCard .rg-go:hover{filter:brightness(1.12)}'
    + '#rgCard.rg-hide{display:none}'
    + '@media(max-width:560px){#rgCard{top:66px;width:calc(100vw - 20px);padding:11px 12px 10px}'
    + '#rgCard .rg-rows{grid-template-columns:1fr}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.id = 'rgCard';
  if (!isDifu) {
    el.className = 'tg';
  }
  el.innerHTML =
    '<div class="rg-h"><span class="rg-seal">' + (isDifu ? '冥' : '仙') + '</span>' + head +
    '<button class="rg-x" id="rgX" title="收起">×</button></div>' +
    '<div class="rg-sub">' + esc(sub) + '</div>' +
    '<div class="rg-rows">' + rows.map(function (r) {
      return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
    }).join('') + '</div>' +
    '<button class="rg-go" id="rgGo">回　阳　世</button>';

  // 入场页 / 载入页还在的时候先不弹牌，只在入场页底部补一行小字说明来历。
  // 等玩家真的进了场景再浮出来，免得挡住「入幽冥」这种主按钮。
  function introHint() {
    var desc = document.querySelector('#intro .intro-desc') || document.querySelector('#intro .intro-sub');
    if (!desc || document.getElementById('rgIntroHint')) { return; }
    var p = document.createElement('p');
    p.id = 'rgIntroHint';
    p.style.cssText = 'margin-top:14px;font-size:12px;line-height:1.9;color:rgba(230,218,196,.5);letter-spacing:1px';
    p.textContent = (d ? '第 ' + d + ' 天 · ' + (ENDING[e] || '走完这一世') : '你从人间来') +
      (j ? ' · ' + j : '') + ' · 善 ' + g + ' 恶 ' + k;
    desc.parentNode.insertBefore(p, desc.nextSibling);
  }

  function blocked() {
    var t = document.getElementById('intro');
    if (t && !t.classList.contains('out') && getComputedStyle(t).display !== 'none') { return t; }
    var l = document.getElementById('loading');
    if (l && !l.classList.contains('hidden') && getComputedStyle(l).display !== 'none'
      && getComputedStyle(l).opacity !== '0') { return l; }
    return null;
  }

  // 载入页（三维场景还没起来）最多等这么久；入场页则愿意一直等，玩家想看多久看多久。
  var LOADING_WAIT = 15000;

  function mount() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', mount); return; }

    // 先挂进 DOM 再说。哪怕场景一直起不来，这块牌子也得在，
    // 否则玩家会困在一个没有出口的页面里。
    document.body.appendChild(el);
    introHint();

    if (!blocked()) { return; }

    el.classList.add('rg-hide');
    var t0 = Date.now();
    var timer = setInterval(function () {
      var b = blocked();
      var giveUp = b && b.id === 'loading' && Date.now() - t0 > LOADING_WAIT;
      if (!b || giveUp) { clearInterval(timer); el.classList.remove('rg-hide'); }
    }, 200);
  }
  mount();

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.id) {
      return;
    }
    if (t.id === 'rgX') {
      el.classList.add('rg-hide');
    } else if (t.id === 'rgGo') {
      location.href = 'index.html';
    }
  });
})();
