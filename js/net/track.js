/* ============================================================
 *  js/net/track.js
 *  访问统计埋点 —— 只报「页面被打开」这一件事
 *  ------------------------------------------------------------
 *  设计原则：
 *   1. 独立文件、零依赖：三套场景（index / difu / tiangong）都能引。
 *   2. 绝不拖慢首屏：等 load 之后再发，失败静默，不弹任何提示。
 *   3. 不上报任何游戏内容，只报设备/浏览器/时区这些环境信息。
 *   4. 关掉统计：服务端 feature.track = false，前端不用改。
 * ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  if (!doc || !global.fetch) { return; }
  if (!global.location || global.location.protocol === 'file:') { return; }

  // 与 api.js 一致：同域相对路径
  var BASE = 'server/api/index.php';
  var KEY = 'life_vid';
  var SENT = false;

  /** 访客指纹：32 位十六进制，存 30 天；清掉浏览器数据就是新访客 */
  function vid() {
    var now = Date.now();
    try {
      var raw = JSON.parse(global.localStorage.getItem(KEY) || 'null');
      if (raw && raw.v && raw.e > now && /^[a-f0-9]{32}$/.test(raw.v)) {
        return raw.v;
      }
    } catch (e) { /* 隐私模式 */ }

    var v = '';
    try {
      var buf = new Uint8Array(16);
      (global.crypto || global.msCrypto).getRandomValues(buf);
      for (var i = 0; i < buf.length; i++) {
        v += ('0' + buf[i].toString(16)).slice(-2);
      }
    } catch (e) { v = ''; }
    if (!/^[a-f0-9]{32}$/.test(v)) {
      var r = '';
      for (var j = 0; j < 4; j++) {
        r += ('0000000' + Math.floor(Math.random() * 0x100000000).toString(16)).slice(-8);
      }
      v = (now.toString(16) + r).slice(0, 32);
    }
    try {
      global.localStorage.setItem(KEY, JSON.stringify({ v: v, e: now + 30 * 86400000 }));
    } catch (e) { }
    return v;
  }

  /** 当前是哪套场景 */
  function pathKey() {
    var f = (global.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (f.indexOf('difu') === 0) { return 'difu'; }
    if (f.indexOf('tiangong') === 0) { return 'tiangong'; }
    if (f === '' || f.indexOf('index') === 0) { return 'index'; }
    return 'other';
  }

  function env() {
    var tz = '';
    var lang = '';
    var screen = '';
    try {
      tz = global.Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) { }
    try {
      lang = global.navigator.language || '';
    } catch (e) { }
    try {
      screen = (global.screen.width || 0) + 'x' + (global.screen.height || 0);
    } catch (e) { }
    var ref = '';
    try {
      if (doc.referrer) {
        var a = doc.createElement('a');
        a.href = doc.referrer;
        ref = a.hostname || '';
      }
    } catch (e) { }
    return { tz: tz, lang: lang, screen: screen, ref: ref };
  }

  function send(force) {
    if (SENT && !force) { return; }
    SENT = true;
    var e = env();
    var body = {
      vid: vid(),
      path: pathKey(),
      tz: e.tz,
      lang: e.lang,
      screen: e.screen,
      ref: e.ref
    };
    try {
      global.fetch(BASE + '?action=visit.hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify(body)
      }).catch(function () { });
    } catch (err) { }
  }

  function boot() {
    // 等首屏与 three.js 解析完再报，不抢带宽
    setTimeout(send, 800);
  }

  if (doc.readyState === 'complete') {
    boot();
  } else {
    global.addEventListener('load', boot);
  }

  global.TRACK = { hit: function () { send(true); }, vid: vid };
})(typeof window !== 'undefined' ? window : this);
