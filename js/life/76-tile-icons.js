/* ============================================================
 *  js/life/76-tile-icons.js
 *  棋盘意外事件图标 + 特效
 *  ------------------------------------------------------------
 *  在 90 个格子里，凡是"会触发事件"的格子（Bn[i].ev）都会浮起一枚
 *  圆形徽章图标，按事件性质分六种颜色与符号：
 *      ?  未知遭遇    !  突发变故    ¥  金钱机会
 *      ⚡ 风险/体力   ♥  人情往来    ★  稀有好事
 *
 *  特效（全部在独立 rAF 里做，不侵入 92-loop.js）：
 *    · 上下浮动 + 缓慢自转 + 呼吸式缩放
 *    · 地面一圈同色光环，随呼吸明暗
 *    · 入场时从 0 弹到 1，带一点回弹
 *    · 棋子走到这一格时徽章抬升放大，离开后回落
 *    · 已经走过的格子，徽章整体变暗缩小，表示"这一格的故事已经过去了"
 * ============================================================ */
(function (global) {
  'use strict';

  var L = global.LIFE && global.LIFE.THREE;
  if (!L || typeof global.Bn === 'undefined' || !global.Bn || !global.Bn.length) {
    return;
  }
  var Bn = global.Bn;
  var scene = global.ce;
  if (!scene) { return; }

  // ------------------------------------------------------------
  // 图标规格
  // ------------------------------------------------------------
  var KINDS = {
    mystery: { color: '#5b7fc7', glyph: '?', glow: 'rgba(91,127,199,' },
    event:   { color: '#d2604f', glyph: '!', glow: 'rgba(210,96,79,' },
    money:   { color: '#d99b28', glyph: '¥', glow: 'rgba(217,155,40,' },
    risk:    { color: '#c9433c', glyph: 'bolt', glow: 'rgba(201,67,60,' },
    heart:   { color: '#c2607e', glyph: 'heart', glow: 'rgba(194,96,126,' },
    star:    { color: '#3f9b6b', glyph: 'star', glow: 'rgba(63,155,107,' }
  };

  // 按格子序号确定性分配，保证每次开局一样，玩家能记住"哪一格是坑"
  function kindOf(idx) {
    var seed = Math.abs(Math.sin(idx * 12.9898) * 43758.5453) % 1;
    var r = seed * 100;
    if (r < 30) { return 'mystery'; }
    if (r < 55) { return 'money'; }
    if (r < 72) { return 'event'; }
    if (r < 85) { return 'risk'; }
    if (r < 95) { return 'heart'; }
    return 'star';
  }

  // ------------------------------------------------------------
  // 画徽章纹理（缓存）
  // ------------------------------------------------------------
  var texCache = {};

  function glyphPath(g, kind, cx, cy, r) {
    g.save();
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#ffffff';
    g.lineCap = 'round';
    g.lineJoin = 'round';

    if (kind === '?' || kind === '!' || kind === '¥') {
      g.font = '900 ' + Math.round(r * 1.55) + 'px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(kind, cx, cy + r * 0.04);
    } else if (kind === 'bolt') {
      var w = r * 0.52, h = r * 1.15;
      g.beginPath();
      g.moveTo(cx + w * 0.35, cy - h * 0.55);
      g.lineTo(cx - w * 0.75, cy + h * 0.08);
      g.lineTo(cx - w * 0.05, cy + h * 0.08);
      g.lineTo(cx - w * 0.35, cy + h * 0.55);
      g.lineTo(cx + w * 0.75, cy - h * 0.10);
      g.lineTo(cx + w * 0.05, cy - h * 0.10);
      g.closePath();
      g.fill();
    } else if (kind === 'heart') {
      var s = r * 0.62;
      g.beginPath();
      g.moveTo(cx, cy + s * 0.82);
      g.bezierCurveTo(cx - s * 1.5, cy - s * 0.16, cx - s * 0.62, cy - s * 1.05, cx, cy - s * 0.36);
      g.bezierCurveTo(cx + s * 0.62, cy - s * 1.05, cx + s * 1.5, cy - s * 0.16, cx, cy + s * 0.82);
      g.closePath();
      g.fill();
    } else if (kind === 'star') {
      var R = r * 0.72, rr = R * 0.44;
      g.beginPath();
      for (var i = 0; i < 10; i++) {
        var ang = -Math.PI / 2 + i * Math.PI / 5;
        var rad = i % 2 === 0 ? R : rr;
        var px = cx + Math.cos(ang) * rad;
        var py = cy + Math.sin(ang) * rad;
        if (i === 0) { g.moveTo(px, py); } else { g.lineTo(px, py); }
      }
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  function makeTexture(kind, color) {
    var key = kind + '|' + color;
    if (texCache[key]) { return texCache[key]; }

    var S = 256;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');
    var cx = S / 2, cy = S / 2;
    var R = 96;

    // 外光晕
    var halo = g.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.28);
    halo.addColorStop(0, color + 'cc');
    halo.addColorStop(1, color + '00');
    g.fillStyle = halo;
    g.beginPath();
    g.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
    g.fill();

    // 主体圆
    var body = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.18, color);
    body.addColorStop(1, shade(color, -0.28));
    g.fillStyle = body;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();

    // 描边
    g.strokeStyle = 'rgba(255,255,255,.92)';
    g.lineWidth = 9;
    g.beginPath();
    g.arc(cx, cy, R - 5, 0, Math.PI * 2);
    g.stroke();

    // 内环
    g.strokeStyle = 'rgba(255,255,255,.28)';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
    g.stroke();

    glyphPath(g, (KINDS[kind] && KINDS[kind].glyph) || '?', cx, cy, R);

    var tex = new L.CanvasTexture(cv);
    if (L.SRGBColorSpace) { tex.colorSpace = L.SRGBColorSpace; }
    tex.anisotropy = 4;
    texCache[key] = tex;
    return tex;
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    var f = function (v) {
      var x = Math.round(v + 255 * amt);
      return Math.max(0, Math.min(255, x));
    };
    return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(b) + ')';
  }

  function hexToInt(hex) {
    return parseInt(hex.slice(1), 16);
  }

  // ------------------------------------------------------------
  // 建图标
  // ------------------------------------------------------------
  var group = new L.Group();
  group.name = 'tileIcons';
  scene.add(group);

  var items = [];
  var idx;

  for (idx = 0; idx < Bn.length; idx++) {
    var tile = Bn[idx];
    if (!tile || !tile.ev) { continue; }

    var kind = kindOf(idx);
    var spec = KINDS[kind];
    var x = tile.group.position.x;
    var z = tile.group.position.z;

    // 徽章
    var mat = new L.SpriteMaterial({
      map: makeTexture(kind, spec.color),
      transparent: true,
      depthWrite: false,
      opacity: 0,
      toneMapped: false,
      sizeAttenuation: true
    });
    var sp = new L.Sprite(mat);
    sp.scale.set(0.001, 0.001, 1);
    sp.position.set(x, 2.02, z);
    sp.renderOrder = 3;
    group.add(sp);

    // 地面光环
    var ringMat = new L.MeshBasicMaterial({
      color: new L.Color(spec.color),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      side: L.DoubleSide
    });
    var ring = new L.Mesh(new L.RingGeometry(0.50, 0.66, 36), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.29, z);
    ring.renderOrder = 2;
    group.add(ring);

    items.push({
      idx: idx,
      sprite: sp,
      ring: ring,
      ringMat: ringMat,
      base: 0.50,
      phase: idx * 0.83,
      born: 0.18 + (idx % 17) * 0.035,   // 依次弹出的延迟
      cur: 0,                            // 当前放大系数（用于平滑）
      kind: kind
    });
  }

  // ------------------------------------------------------------
  // 动画
  // ------------------------------------------------------------
  var clock = new L.Clock();
  var elapsed = 0;

  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function tick() {
    var dt = Math.min(0.06, clock.getDelta());
    elapsed += dt;

    var C = global.C || {};
    var curPos = typeof C.pos === 'number' ? C.pos : -1;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];

      // 入场
      var age = elapsed - it.born;
      var intro = age <= 0 ? 0 : Math.min(1, age / 0.55);
      if (intro <= 0) {
        it.sprite.material.opacity = 0;
        it.ringMat.opacity = 0;
        continue;
      }
      var pop = easeOutBack(intro);

      // 是否已被走过 / 是否是当前格
      var passed = !!(Bn[it.idx] && Bn[it.idx].passed);
      var isCur = it.idx === curPos;

      // 呼吸
      var breathe = 1 + Math.sin(elapsed * 1.9 + it.phase) * 0.055;
      var targetScale = it.base * breathe * (isCur ? 1.18 : 1) * (passed ? 0.55 : 1) * pop;

      // 浮动
      var floatY = 2.02 + Math.sin(elapsed * 1.45 + it.phase) * 0.09 + (isCur ? 0.16 : 0);

      it.sprite.scale.set(targetScale, targetScale, 1);
      it.sprite.position.y = floatY;

      // 自转（轻微摆动，避免完全像贴图）
      it.sprite.material.rotation = Math.sin(elapsed * 0.9 + it.phase) * 0.10;

      // 透明度：走过就淡下去
      var targetOp = passed ? 0.22 : (isCur ? 1 : 0.95);
      it.sprite.material.opacity += (targetOp - it.sprite.material.opacity) * Math.min(1, dt * 7);

      // 光环：呼吸 + 当前格加强
      var ringPulse = 0.30 + Math.sin(elapsed * 1.9 + it.phase) * 0.16;
      var ringTarget = passed ? 0.05 : (isCur ? 0.72 : ringPulse);
      it.ringMat.opacity += (ringTarget - it.ringMat.opacity) * Math.min(1, dt * 6);
      var rs = 1 + Math.sin(elapsed * 1.9 + it.phase) * 0.06 + (isCur ? 0.18 : 0);
      it.ring.scale.set(rs, rs, 1);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  /** 供其它模块查某一格是什么类型（比如事件面板上加个角标） */
  global.TileIcons = {
    kindOf: kindOf,
    spec: function (idx) { return KINDS[kindOf(idx)]; },
    count: items.length
  };
})(typeof window !== 'undefined' ? window : this);
