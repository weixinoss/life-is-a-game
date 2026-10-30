/* ============================================================
 *  js/life/77-plaza.js
 *  棋盘中央广场：社会时钟塔 + 四柱灯箱 + 地面地贴
 *  ------------------------------------------------------------
 *  为什么放在中央：这块圆盘直径 24.8 米，占内圈一半以上，原来是空的。
 *  相机装在棋子眼睛高度（1.05 米），所以真正被看见的是 0~3 米这一段，
 *  于是三个广告位都压在视线高度上，而不是挂到天上去。
 *
 *    · 社会时钟塔  塔身 3.4 米，四面各一块 2.15×2.35 米灯箱；
 *                  塔顶四面钟表，表盘按「本季第几天」走针，四季色环高亮当前季
 *    · 四柱灯箱    对角线四个方向，2.9 米高，双面发光，夜里会呼吸
 *    · 地面地贴    四块 3×3 米，压在圆盘上方 0.078 米（避开 z-fighting）
 *
 *  广告内容从后台读（action=ads.list），拿不到就用内置文案，
 *  所以单机、断网、后台没配都能正常看到一个像样的广场。
 * ============================================================ */
(function (global) {
  'use strict';

  var L = global.LIFE && global.LIFE.THREE;
  if (!L || !global.ce) { return; }
  var scene = global.ce;

  var FONT = '"PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';

  var COL = {
    stone: '#efe7d6',
    stone2: '#ddd1b8',
    trim: '#c9b795',
    roof: '#c96a3d',
    metal: '#5d5548',
    accent: '#f97316',
    ink: '#241f1a'
  };

  // 广场尺度（米）：所有半径都在这里，改一处就整体协调
  var R = {
    plinth: 2.4,     // 塔基石台半径
    body: 1.1,       // 塔身半宽（窄一点才像塔，宽了就成电话亭）
    bodyH: 4.4,      // 塔身高度
    panelW: 2.0,     // 广告牌宽
    panelH: 2.5,     // 广告牌高
    clockW: 1.2,     // 钟室高度
    pillarR: 10.4,   // 灯箱离圆心距离
    decalR: 5.0,     // 地贴离圆心距离
    decalS: 3.4      // 地贴边长
  };

  // ------------------------------------------------------------
  // 内置文案：后台没配 / 请求失败时用这套。
  // 全部是「人生剧本」式的反讽广告，不接真实品牌，零审核风险。
  // ------------------------------------------------------------
  var NOTE = '游戏内虚构 · 与现实品牌无关';

  var DEFAULT_ADS = {
    tower: [
      { brand: '人生剧本', title: '30 岁还没买房？', subtitle: '同龄人已经年薪百万了', accent: '#c9433c' },
      { brand: '人生剧本', title: '再不考公，就晚了', subtitle: '35 岁前最后一次机会', accent: '#2f6f8f' },
      { brand: '人生剧本', title: '贷款 3 分钟到账', subtitle: '先上车，再想怎么还', accent: '#d99b28' },
      { brand: '人生剧本', title: '你已被同龄人超越', subtitle: '成功学大师 · 限时 9.9', accent: '#7a5cc4' }
    ],
    pillar: [
      { brand: '相亲角', title: '有房有车优先', subtitle: '父母替你排队的第三年', accent: '#c2607e' },
      { brand: '狼性文化', title: '今天不拼命', subtitle: '明天拼命找工作', accent: '#c9433c' },
      { brand: '分期商城', title: '先享受，后付款', subtitle: '12 期免息 · 年化 23.9%', accent: '#d99b28' },
      { brand: '学区房', title: '别输在起跑线', subtitle: '起跑线在哪，我们说了算', accent: '#2f6f8f' }
    ],
    ground: [
      { brand: '一年四季', title: '春 夏 秋 冬', subtitle: '各 90 天，各一条命', accent: '#6fbf5a' },
      { brand: '没有回头路', title: '每一步都算数', subtitle: '走错的那一步，也会被记住', accent: '#d9743f' },
      { brand: '低头也行', title: '体面不是唯一答案', subtitle: '活下去，才是', accent: '#2f6f8f' },
      { brand: '广场公告', title: '这里可以停下', subtitle: '看看钟，再决定往哪走', accent: '#f97316' }
    ]
  };

  // ============================================================
  //  画布工具
  // ============================================================
  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  /** 按宽度逐字折行（中文没有空格，只能按字符量） */
  function wrap(g, text, maxW) {
    var out = [], cur = '';
    text = String(text == null ? '' : text);
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '\n') { out.push(cur); cur = ''; continue; }
      var test = cur + ch;
      if (cur && g.measureText(test).width > maxW) { out.push(cur); cur = ch; }
      else { cur = test; }
    }
    if (cur) { out.push(cur); }
    return out;
  }

  /** 折行后按可用高度自动缩字号，最多 maxLines 行 */
  function fitBlock(g, text, maxW, maxH, sizes, lineRatio, weight, family) {
    for (var s = 0; s < sizes.length; s++) {
      var size = sizes[s];
      g.font = weight + ' ' + size + 'px ' + (family || FONT);
      var lines = wrap(g, text, maxW);
      var lh = Math.round(size * (lineRatio || 1.24));
      if (lines.length * lh <= maxH && lines.length <= 4) {
        return { size: size, lines: lines, lh: lh, font: g.font };
      }
    }
    g.font = weight + ' ' + sizes[sizes.length - 1] + 'px ' + (family || FONT);
    return {
      size: sizes[sizes.length - 1],
      lines: wrap(g, text, maxW).slice(0, 4),
      lh: Math.round(sizes[sizes.length - 1] * (lineRatio || 1.24)),
      font: g.font
    };
  }

  function withAlpha(hex, a) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    var n = parseInt(h, 16);
    if (isNaN(n)) { return 'rgba(0,0,0,' + a + ')'; }
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ============================================================
  //  广告画面：灯箱 / 塔身 / 地贴三种版式
  // ============================================================
  var texCache = {};

  function panelTexture(ad, kind) {
    var key = kind + '|' + (ad.id || 'x') + '|' + ad.title + '|' + ad.subtitle + '|' +
      ad.brand + '|' + ad.bg + '|' + ad.fg + '|' + ad.accent + '|' + ad.note;
    if (texCache[key]) { return texCache[key]; }

    var W = 512;
    var H = kind === 'pillar' ? 768 : (kind === 'ground' ? 512 : 640);
    var cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    var g = cv.getContext('2d');

    var bg = ad.bg || '#fdf8ee';
    var fg = ad.fg || COL.ink;
    var ac = ad.accent || COL.accent;

    // 底色 + 顶部柔光，模拟灯箱内打光
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, W * 0.4, H);
    grd.addColorStop(0, 'rgba(255,255,255,0.55)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    grd.addColorStop(1, 'rgba(0,0,0,0.07)');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);

    // 边框
    g.strokeStyle = withAlpha(ac, 0.55);
    g.lineWidth = 6;
    g.strokeRect(3, 3, W - 6, H - 6);
    g.strokeStyle = withAlpha(fg, 0.10);
    g.lineWidth = 2;
    g.strokeRect(14, 14, W - 28, H - 28);

    if (kind === 'ground') {
      drawGround(g, W, H, ad, bg, fg, ac);
    } else {
      drawPoster(g, W, H, ad, bg, fg, ac, kind);
    }

    var tex = new L.CanvasTexture(cv);
    tex.colorSpace = L.SRGBColorSpace;
    tex.anisotropy = 4;
    texCache[key] = tex;
    return tex;
  }

  /** 竖版海报：灯箱与塔身共用，只是字号比例不同 */
  function drawPoster(g, W, H, ad, bg, fg, ac, kind) {
    var pad = 34;
    var big = kind === 'pillar';

    // 角标
    var brand = String(ad.brand || '');
    if (brand) {
      g.font = '700 24px ' + FONT;
      var bw = g.measureText(brand).width + 34;
      g.fillStyle = ac;
      roundRect(g, pad, pad, bw, 42, 21);
      g.fill();
      g.fillStyle = '#ffffff';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(brand, pad + 17, pad + 22);
    }

    var top = pad + 78;

    // 主标题
    var tb = fitBlock(g, ad.title || '', W - pad * 2, big ? 250 : 210,
      big ? [84, 76, 66, 58] : [70, 62, 54, 48], 1.18, '900');
    g.font = tb.font;
    g.textAlign = 'left';
    g.textBaseline = 'top';
    g.fillStyle = fg;
    for (var i = 0; i < tb.lines.length; i++) {
      g.fillText(tb.lines[i], pad, top + i * tb.lh);
    }
    top += tb.lines.length * tb.lh + 22;

    // 强调短线
    g.fillStyle = ac;
    g.fillRect(pad, top, 92, 9);
    top += 30;

    // 副标题
    var sb = fitBlock(g, ad.subtitle || '', W - pad * 2, H - top - 110,
      [30, 27, 24, 21], 1.5, '500');
    g.font = sb.font;
    g.fillStyle = withAlpha(fg, 0.72);
    for (var j = 0; j < sb.lines.length; j++) {
      g.fillText(sb.lines[j], pad, top + j * sb.lh);
    }

    // 底部说明条
    var note = ad.note || NOTE;
    var bandH = 62;
    g.fillStyle = withAlpha(ac, 0.13);
    g.fillRect(0, H - bandH, W, bandH);
    g.fillStyle = withAlpha(fg, 0.62);
    g.font = '600 19px ' + FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(note, W / 2, H - bandH / 2);
  }

  /** 地贴：方正、居中、带虚线框，像一块刷在地上的喷绘 */
  function drawGround(g, W, H, ad, bg, fg, ac) {
    // 圆盘本身是米色的，地贴底色也是米白，直接铺上去会「糊」成一片。
    // 这里压一层强调色薄纱 + 双线边框，远看才有块状存在感。
    g.fillStyle = withAlpha(ac, 0.13);
    g.fillRect(0, 0, W, H);

    g.strokeStyle = withAlpha(ac, 0.9);
    g.lineWidth = 9;
    g.strokeRect(13, 13, W - 26, H - 26);

    g.strokeStyle = withAlpha(ac, 0.45);
    g.lineWidth = 4;
    g.setLineDash([16, 13]);
    g.strokeRect(38, 38, W - 76, H - 76);
    g.setLineDash([]);

    var cx = W / 2;

    // 角标
    g.font = '700 22px ' + FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (ad.brand) {
      var bw = g.measureText(ad.brand).width + 34;
      g.fillStyle = ac;
      roundRect(g, cx - bw / 2, 52, bw, 38, 19);
      g.fill();
      g.fillStyle = '#ffffff';
      g.fillText(ad.brand, cx, 72);
    }

    // 标题
    var tb = fitBlock(g, ad.title || '', W - 92, 160, [84, 74, 64, 56], 1.16, '900');
    g.font = tb.font;
    g.fillStyle = fg;
    g.textBaseline = 'top';
    var ty = 132;
    for (var i = 0; i < tb.lines.length; i++) {
      g.fillText(tb.lines[i], cx, ty + i * tb.lh);
    }
    ty += tb.lines.length * tb.lh + 16;

    g.fillStyle = ac;
    g.fillRect(cx - 50, ty, 100, 8);
    ty += 26;

    // 副标题
    var sb = fitBlock(g, ad.subtitle || '', W - 104, H - ty - 78, [29, 26, 23], 1.45, '600');
    g.font = sb.font;
    g.fillStyle = withAlpha(fg, 0.78);
    for (var j = 0; j < sb.lines.length; j++) {
      g.fillText(sb.lines[j], cx, ty + j * sb.lh);
    }

    // 底部说明
    g.fillStyle = withAlpha(fg, 0.45);
    g.font = '600 17px ' + FONT;
    g.textBaseline = 'bottom';
    g.fillText(ad.note || NOTE, cx, H - 52);
  }

  /** 空位：后台把某个位关掉了，也要体面 */
  function placeholderAd(kind) {
    return {
      id: 'empty', brand: '', title: '虚位以待', subtitle: '此广告位招租中',
      accent: '#c9b795', bg: '#fdf8ee', note: '登录后台 · 广告位管理',
      _empty: true
    };
  }

  // ============================================================
  //  贴图 → 网格
  // ============================================================
  function litPanel(w, h) {
    var mat = new L.MeshBasicMaterial({ map: null, side: L.FrontSide });
    var mesh = new L.Mesh(new L.PlaneGeometry(w, h), mat);
    mesh.userData.mat = mat;
    return mesh;
  }

  var FACES = { tower: [], pillar: [], ground: [] };
  var shownIds = [];

  function paint(slot, i, ad) {
    var f = FACES[slot][i];
    if (!f) { return; }
    var tex = panelTexture(ad, f.kind);
    var had = !!f.mat.map;
    f.mat.map = tex;
    if (!had) { f.mat.needsUpdate = true; }
    f.ad = ad;                 // 点击跳转要按位取当前的广告
    if (ad.id && !ad._empty) { shownIds.push(ad.id); }
  }

  // ============================================================
  //  一、社会时钟塔
  // ============================================================
  var tower = new L.Group();
  var clockMat = null;
  var orbMat = null;
  var baseRingMat = null;

  (function buildTower() {
    var stoneMat = new L.MeshStandardMaterial({ color: new L.Color(COL.stone), roughness: 0.88, metalness: 0.02 });
    var stone2Mat = new L.MeshStandardMaterial({ color: new L.Color(COL.stone2), roughness: 0.92 });
    var trimMat = new L.MeshStandardMaterial({ color: new L.Color(COL.trim), roughness: 0.8 });
    var roofMat = new L.MeshStandardMaterial({ color: new L.Color(COL.roof), roughness: 0.72, metalness: 0.08 });

    // 基座
    var plinth = new L.Mesh(new L.CylinderGeometry(R.plinth - 0.08, R.plinth, 0.42, 32), stone2Mat);
    plinth.position.y = 0.21;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    tower.add(plinth);

    // 基座灯圈
    baseRingMat = new L.MeshBasicMaterial({
      color: new L.Color(COL.accent), transparent: true, opacity: 0.32,
      side: L.DoubleSide, depthWrite: false
    });
    var baseRing = new L.Mesh(new L.RingGeometry(R.plinth, R.plinth + 0.26, 44), baseRingMat);
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.435;
    baseRing.renderOrder = 3;
    tower.add(baseRing);

    // 塔身
    var bodyH = R.bodyH;
    var body = new L.Mesh(new L.BoxGeometry(R.body * 2, bodyH, R.body * 2), stoneMat);
    body.position.y = 0.42 + bodyH / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    tower.add(body);

    // 塔身腰线
    var belt = new L.Mesh(new L.BoxGeometry(R.body * 2 + 0.12, 0.16, R.body * 2 + 0.12), trimMat);
    belt.position.y = 0.42 + bodyH - 0.12;
    tower.add(belt);

    // 四面广告牌
    var faceY = 0.42 + bodyH / 2;
    var dirs = [
      { ax: 'z', sign: 1, ry: 0 },
      { ax: 'x', sign: 1, ry: Math.PI / 2 },
      { ax: 'z', sign: -1, ry: Math.PI },
      { ax: 'x', sign: -1, ry: -Math.PI / 2 }
    ];
    var edge = R.body + 0.002;

    dirs.forEach(function (d, i) {
      var g2 = new L.Group();
      if (d.ax === 'z') { g2.position.set(0, faceY, edge * d.sign); }
      else { g2.position.set(edge * d.sign, faceY, 0); }
      g2.rotation.y = d.ry;

      // 深色底框，让灯箱边缘有厚度感
      var frame = new L.Mesh(
        new L.PlaneGeometry(R.panelW + 0.2, R.panelH + 0.2),
        new L.MeshStandardMaterial({ color: new L.Color('#6d6558'), roughness: 0.65, metalness: 0.25 })
      );
      frame.position.z = 0.004;
      g2.add(frame);

      var p = litPanel(R.panelW, R.panelH);
      p.position.z = 0.012;
      g2.add(p);

      FACES.tower.push({ mat: p.userData.mat, kind: 'tower', mesh: p });
      tower.add(g2);
    });

    // 钟室
    var clockY0 = 0.42 + bodyH;
    var clockH = R.clockW;
    var clockBoxW = R.body * 2 + 0.34;
    var clockBox = new L.Mesh(new L.BoxGeometry(clockBoxW, clockH, clockBoxW), stone2Mat);
    clockBox.position.y = clockY0 + clockH / 2;
    clockBox.castShadow = true;
    tower.add(clockBox);

    clockMat = new L.MeshBasicMaterial({ map: null, transparent: false });
    var faceEdge = clockBoxW / 2 + 0.004;
    dirs.forEach(function (d) {
      var g3 = new L.Group();
      if (d.ax === 'z') { g3.position.set(0, clockY0 + clockH / 2, faceEdge * d.sign); }
      else { g3.position.set(faceEdge * d.sign, clockY0 + clockH / 2, 0); }
      g3.rotation.y = d.ry;

      var ring = new L.Mesh(new L.RingGeometry(0.475, 0.55, 44),
        new L.MeshStandardMaterial({ color: new L.Color(COL.trim), roughness: 0.6, metalness: 0.35 }));
      ring.position.z = 0.006;
      g3.add(ring);

      var face = new L.Mesh(new L.CircleGeometry(0.478, 44), clockMat);
      face.position.z = 0.012;
      g3.add(face);
      tower.add(g3);
    });

    // 四角尖顶
    var roofH = 1.45;
    // 四棱锥顶点朝上、旋转 45° 让四个斜面正对塔身四面。
    // 半径要略大于「钟室半宽 × √2」，屋顶才会压住箱子边角而不是小小一个帽。
    var roof = new L.Mesh(new L.ConeGeometry(clockBoxW * 0.75, roofH, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = clockY0 + clockH + roofH / 2;
    roof.castShadow = true;
    tower.add(roof);

    // 尖顶上的灯
    var spire = new L.Mesh(new L.CylinderGeometry(0.035, 0.05, 0.42, 8), trimMat);
    spire.position.y = clockY0 + clockH + roofH + 0.2;
    tower.add(spire);

    orbMat = new L.MeshBasicMaterial({ color: new L.Color(COL.accent) });
    var orb = new L.Mesh(new L.SphereGeometry(0.13, 16, 12), orbMat);
    orb.position.y = clockY0 + clockH + roofH + 0.52;
    tower.add(orb);

    tower.position.set(0, 0, 0);
    scene.add(tower);
  })();

  // ---- 钟面贴图：按「本季第几天」走针 ----
  var clockDay = -1;
  var clockSeason = -1;
  var SEASON_COL = ['#6fbf5a', '#e0a33f', '#d9743f', '#6aa6c8'];

  function drawClock(day, season) {
    var S = 256;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');
    var cx = S / 2, cy = S / 2, rr = S / 2 - 4;

    g.beginPath();
    g.arc(cx, cy, rr, 0, Math.PI * 2);
    g.fillStyle = '#fdfaf2';
    g.fill();

    // 四季色环
    for (var i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(cx, cy, rr - 7, -Math.PI / 2 + i * Math.PI / 2, -Math.PI / 2 + (i + 1) * Math.PI / 2);
      g.lineWidth = 11;
      g.strokeStyle = SEASON_COL[i];
      g.globalAlpha = (i === season) ? 1 : 0.28;
      g.stroke();
      g.globalAlpha = 1;
    }

    // 刻度：每 5 天一根，每 15 天加粗
    g.strokeStyle = 'rgba(60,50,40,0.30)';
    for (var k = 0; k < 90; k += 5) {
      var a = -Math.PI / 2 + (k / 90) * Math.PI * 2;
      var r1 = rr - 24, r2 = rr - (k % 15 === 0 ? 15 : 19);
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      g.lineWidth = (k % 15 === 0) ? 2.6 : 1.2;
      g.stroke();
    }

    // 天数
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(36,31,26,0.42)';
    g.font = '700 16px ' + FONT;
    g.fillText('本季第', cx, cy + 44);
    g.fillStyle = COL.ink;
    g.font = '900 46px ' + FONT;
    g.fillText(String(day), cx, cy + 76);

    // 指针
    var frac = Math.max(0, Math.min(1, (day - 1) / 90));
    var an = -Math.PI / 2 + frac * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx - Math.cos(an) * 10, cy - Math.sin(an) * 10);
    g.lineTo(cx + Math.cos(an) * (rr - 34), cy + Math.sin(an) * (rr - 34));
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.strokeStyle = '#c9433c';
    g.stroke();

    g.beginPath();
    g.arc(cx, cy, 7, 0, Math.PI * 2);
    g.fillStyle = COL.ink;
    g.fill();

    var tex = new L.CanvasTexture(cv);
    tex.colorSpace = L.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function syncClock() {
    var C = global.C;
    // 还没开局也要先画一张「第 1 天」，否则钟面是四个白圆片
    var day = (C && C.started) ? Math.max(1, C.day || 1) : 1;
    var season = (C && C.started) ? Math.max(0, Math.min(3, C.season || 0)) : 0;
    if (day === clockDay && season === clockSeason) { return; }
    clockDay = day;
    clockSeason = season;
    var old = clockMat.map;
    clockMat.map = drawClock(day, season);
    // 只有第一次从「无贴图」变成「有贴图」才需要重编译着色器，
    // 换天时反复置 needsUpdate 会天天重编译，掉帧
    if (!old) { clockMat.needsUpdate = true; }
    else { old.dispose(); }
  }

  // ============================================================
  //  二、四柱灯箱
  // ============================================================
  var pillarGlows = [];

  (function buildPillars() {
    var postMat = new L.MeshStandardMaterial({ color: new L.Color(COL.metal), roughness: 0.55, metalness: 0.55 });
    var capMat = new L.MeshStandardMaterial({ color: new L.Color(COL.trim), roughness: 0.5, metalness: 0.45 });

    for (var i = 0; i < 4; i++) {
      var a = Math.PI / 4 + i * Math.PI / 2;
      var px = Math.sin(a) * R.pillarR;
      var pz = Math.cos(a) * R.pillarR;

      var g = new L.Group();
      g.position.set(px, 0, pz);
      g.rotation.y = a;   // 画面朝外（朝棋盘那侧）

      // 底座
      var foot = new L.Mesh(new L.CylinderGeometry(0.40, 0.46, 0.14, 20), postMat);
      foot.position.y = 0.07;
      foot.castShadow = true;
      foot.receiveShadow = true;
      g.add(foot);

      // 立柱
      var post = new L.Mesh(new L.CylinderGeometry(0.085, 0.105, 0.95, 12), postMat);
      post.position.y = 0.14 + 0.475;
      post.castShadow = true;
      g.add(post);

      // 灯箱主体（前后各一块画面）
      var boxY = 0.14 + 0.95 + 0.95;
      var frame = new L.Mesh(
        new L.BoxGeometry(1.34, 1.9, 0.14),
        new L.MeshStandardMaterial({ color: new L.Color('#7a7164'), roughness: 0.55, metalness: 0.3 })
      );
      frame.position.y = boxY;
      frame.castShadow = true;
      g.add(frame);

      var front = litPanel(1.16, 1.72);
      front.position.set(0, boxY, 0.076);
      g.add(front);

      var back = litPanel(1.16, 1.72);
      back.position.set(0, boxY, -0.076);
      back.rotation.y = Math.PI;
      g.add(back);

      FACES.pillar.push({ mat: front.userData.mat, kind: 'pillar', mesh: front });
      FACES.pillar.push({ mat: back.userData.mat, kind: 'pillar', mesh: back });

      // 顶盖
      var cap = new L.Mesh(new L.BoxGeometry(1.42, 0.09, 0.2), capMat);
      cap.position.y = boxY + 0.965;
      g.add(cap);

      // 光晕：白天很淡，夜里明显
      // 注意：bundle 里没有导出 AdditiveBlending，这里用普通混合 + 径向渐变，
      // 观感差别很小，但不能写 L.AdditiveBlending，否则整个模块会抛错停摆。
      var glow = new L.Sprite(new L.SpriteMaterial({
        map: glowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.28
      }));
      glow.scale.set(2.6, 3.0, 1);
      glow.position.set(0, boxY, 0);
      g.add(glow);
      pillarGlows.push(glow);

      scene.add(g);
    }
  })();

  var glowTex = null;
  function glowTexture() {
    if (glowTex) { return glowTex; }
    var S = 128;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
    grd.addColorStop(0, 'rgba(255,236,196,0.85)');
    grd.addColorStop(0.45, 'rgba(255,206,120,0.32)');
    grd.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    glowTex = new L.CanvasTexture(cv);
    glowTex.colorSpace = L.SRGBColorSpace;
    return glowTex;
  }

  // ============================================================
  //  三、地面地贴
  // ============================================================
  var decalMats = [];

  (function buildDecals() {
    for (var i = 0; i < 4; i++) {
      var a = Math.PI / 4 + i * Math.PI / 2;
      var px = Math.sin(a) * R.decalR;
      var pz = Math.cos(a) * R.decalR;

      var mat = new L.MeshBasicMaterial({
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        side: L.DoubleSide
      });
      // 用 Group 包一层：外层只绕 Y 转，内层只绕 X 铺平，
      // 免得欧拉角顺序把地贴转歪（Direct 设 rotation.z 是不对的）
      var holder = new L.Group();
      holder.position.set(px, 0.13, pz);   // 高于盘面地纹（0.10），避免叠在一起闪
      holder.rotation.y = -a;        // 让文字朝向站在外侧的读者

      var mesh = new L.Mesh(new L.PlaneGeometry(R.decalS, R.decalS), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 6;
      holder.add(mesh);
      scene.add(holder);

      decalMats.push(mat);
      FACES.ground.push({ mat: mat, kind: 'ground', mesh: mesh });
    }
  })();

  // 盘面原有的「一年四季」地纹排在下面一层
  if (global.Rc) { global.Rc.renderOrder = 2; }

  // ============================================================
  //  四、广告数据：后台优先，失败回落内置
  // ============================================================
  var ADS = { tower: [], pillar: [], ground: [] };
  var rot = { tower: 0, pillar: 0, ground: 0 };

  function normalize(list) {
    return list.map(function (a) {
      return {
        id: a.id,
        brand: a.brand || '',
        title: a.title || '',
        subtitle: a.subtitle || '',
        note: a.note || '',
        bg: a.bg || '',
        fg: a.fg || '',
        accent: a.accent || '',
        link: a.link || '',
        pos: a.pos == null ? 0 : (a.pos | 0),
        weight: a.weight == null ? 10 : (a.weight | 0)
      };
    }).sort(function (x, y) {
      if (x.pos !== y.pos) { return x.pos - y.pos; }
      if (x.weight !== y.weight) { return y.weight - x.weight; }
      return (x.id || 0) - (y.id || 0);
    });
  }

  function applyAds() {
    shownIds = [];
    ['tower', 'pillar', 'ground'].forEach(function (slot) {
      var list = ADS[slot];
      var faces = FACES[slot];
      if (!list.length) {
        for (var e = 0; e < faces.length; e++) { paint(slot, e, placeholderAd(slot)); }
        return;
      }
      var base = list.length > faces.length ? (rot[slot] % list.length) : 0;
      for (var i = 0; i < faces.length; i++) {
        paint(slot, i, list[(base + i) % list.length]);
      }
    });

    // 曝光回传（一次会话只报一次，避免刷接口）
    if (shownIds.length) { reportImpression(); }
  }

  var reported = false;
  function reportImpression() {
    if (reported) { return; }
    var NET = global.NET;
    if (!NET || !NET.req) { return; }
    reported = true;
    var ids = [];
    var seen = {};
    for (var i = 0; i < shownIds.length; i++) {
      var id = shownIds[i];
      if (!seen[id]) { seen[id] = 1; ids.push(id); }
    }
    NET.req('ads.hit', { ids: ids.join(',') }, { silent: true, method: 'GET' }).catch(function () {});
  }

  function useDefaults() {
    ADS.tower = DEFAULT_ADS.tower.map(function (a, i) {
      var o = {}; for (var k in a) { o[k] = a[k]; } o.pos = i; return o;
    });
    ADS.pillar = DEFAULT_ADS.pillar.map(function (a, i) {
      var o = {}; for (var k in a) { o[k] = a[k]; } o.pos = i; return o;
    });
    ADS.ground = DEFAULT_ADS.ground.map(function (a, i) {
      var o = {}; for (var k in a) { o[k] = a[k]; } o.pos = i; return o;
    });
    applyAds();
  }

  var loadTries = 0;
  function loadAds() {
    var NET = global.NET;
    // js/net/api.js 排在本模块后面加载，第一次进来时可能还没有 NET，
    // 这里等一小会儿再试，最多重试 20 次（约 6 秒），之后就一直用内置文案。
    if (!NET || !NET.req) {
      if (loadTries++ < 20) { setTimeout(loadAds, 300); }
      return;
    }
    NET.req('ads.list', {}, { silent: true, method: 'GET', timeout: 6000 })
      .then(function (d) {
        clearTimeout(fallbackTimer);
        var list = (d && d.ads) || [];
        if (!list.length) {
          // 后台确实一个都没配：显示招租位，别拿内置文案冒充真实广告
          ADS.tower = ADS.pillar = ADS.ground = [];
          applyAds();
          return;
        }
        var grouped = { tower: [], pillar: [], ground: [] };
        for (var i = 0; i < list.length; i++) {
          var a = list[i];
          var slot = grouped[a.slot] ? a.slot : 'pillar';
          grouped[slot].push(a);
        }
        ADS.tower = normalize(grouped.tower);
        ADS.pillar = normalize(grouped.pillar);
        ADS.ground = normalize(grouped.ground);
        applyAds();
      })
      .catch(function () { /* 后端不可达：保留开局铺的内置文案 */ });
  }

  // ============================================================
  //  六、广告牌点击
  //  ------------------------------------------------------------
  //  three.js 的打包产物里没有导出 Raycaster，所以这里用投影近似：
  //  把面板中心投到屏幕上，按「米 → 像素」比例算出一个命中半径。
  //  只有后台填了 link 的广告才可点，空链接的位子点了什么也不会发生。
  // ============================================================
  var v3 = new L.Vector3();
  var downPt = null;
  var lastHover = 0;

  function panelAt(cx, cy) {
    var Ve = global.Ve;
    if (!Ve) { return null; }
    var W = global.innerWidth || 1280;
    var H = global.innerHeight || 800;
    var best = null;
    var bestD = 1e9;
    var slots = [FACES.tower, FACES.pillar];   // 地贴贴地，投影近似不可靠，不参与点击

    for (var s = 0; s < slots.length; s++) {
      var list = slots[s];
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (!it.ad || !it.ad.link || !it.mesh) { continue; }
        it.mesh.updateWorldMatrix(true, false);
        v3.setFromMatrixPosition(it.mesh.matrixWorld);
        var dist = v3.distanceTo(Ve.position);
        if (dist < 0.3) { continue; }
        v3.project(Ve);
        if (v3.z > 1 || v3.z < -1) { continue; }
        var sx = (v3.x * 0.5 + 0.5) * W;
        var sy = (-v3.y * 0.5 + 0.5) * H;
        var halfH = (it.mesh.geometry.parameters && it.mesh.geometry.parameters.height) || 1;
        halfH /= 2;
        var pxPerM = (H * 0.5) / (dist * Math.tan(Ve.fov * Math.PI / 360));
        var rad = Math.max(16, halfH * pxPerM * 0.85);
        var dx = cx - sx;
        var dy = cy - sy;
        if (dx * dx + dy * dy <= rad * rad && dist < bestD) {
          best = it;
          bestD = dist;
        }
      }
    }
    return best;
  }

  /** 只认落在 3D 画布上的点击。UI 按钮浮在画布上面，
      如果不管 target，点「掷骰子」时背后正好有广告牌就会被误开 */
  function onCanvas(e) {
    var cv = global.We && global.We.domElement;
    return !!cv && e.target === cv;
  }

  function onDown(e) {
    downPt = onCanvas(e) ? { x: e.clientX, y: e.clientY } : null;
  }

  function onUp(e) {
    if (!downPt) { return; }
    var moved = Math.abs(e.clientX - downPt.x) + Math.abs(e.clientY - downPt.y);
    downPt = null;
    // 拖着视角转的时候不算点击
    if (moved > 10) { return; }
    var it = panelAt(e.clientX, e.clientY);
    if (!it) { return; }
    var NET = global.NET;
    if (NET && NET.req && it.ad.id) {
      NET.req('ads.click', { id: it.ad.id }, { silent: true, method: 'GET' }).catch(function () {});
    }
    try { global.open(it.ad.link, '_blank', 'noopener'); } catch (err) {}
  }

  function onMove(e) {
    var canvas = global.We && global.We.domElement;
    if (!canvas) { return; }
    if (!onCanvas(e)) {
      if (canvas.style.cursor) { canvas.style.cursor = ''; }
      return;
    }
    var now = Date.now();
    if (now - lastHover < 80) { return; }
    lastHover = now;
    canvas.style.cursor = panelAt(e.clientX, e.clientY) ? 'pointer' : '';
  }

  if (global.addEventListener) {
    global.addEventListener('pointerdown', onDown, { passive: true });
    global.addEventListener('pointerup', onUp, { passive: true });
    global.addEventListener('pointermove', onMove, { passive: true });
  }

  // ============================================================
  //  七、动画
  // ============================================================
  var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  var lastRotate = 0;

  function tick() {
    requestAnimationFrame(tick);
    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var el = (now - t0) / 1000;

    syncClock();

    // 基座灯圈与塔顶灯呼吸
    if (baseRingMat) { baseRingMat.opacity = 0.22 + Math.sin(el * 1.1) * 0.10; }
    if (orbMat) {
      var k = 0.82 + Math.sin(el * 2.2) * 0.18;
      orbMat.color.setRGB(0.98 * k + 0.02, 0.45 * k + 0.06, 0.09 * k);
    }

    // 灯箱光晕：轻微呼吸，形成「有电」的观感
    for (var i = 0; i < pillarGlows.length; i++) {
      pillarGlows[i].material.opacity = 0.22 + Math.sin(el * 1.3 + i * 1.7) * 0.07;
    }

    // 地贴：极轻微的明暗浮动，避免看起来像死图
    for (var j = 0; j < decalMats.length; j++) {
      decalMats[j].opacity = 0.94 + Math.sin(el * 0.9 + j * 2.1) * 0.04;
    }

    // 广告轮播：某个位排了 4 条以上时，每 22 秒换一轮
    if (el - lastRotate > 22) {
      lastRotate = el;
      var changed = false;
      for (var s in rot) {
        if (ADS[s].length > 4) { rot[s]++; changed = true; }
      }
      if (changed) { applyAds(); }
    }
  }

  /* 启动顺序很关键：
     如果一上来就把内置文案铺上去，等后台数据回来又要重画一遍，
     白白生成 12 张 512×768 的贴图（约 15MB 显存）并且永远留在缓存里。
     所以先给接口 2.6 秒。这个数不是拍脑袋来的：js/net/api.js 排在所有
     游戏模块之后，three.js 那 488KB 解析完才轮到它（实测集成环境约 1.9 秒），
     请求在此之前发不出去。2.6 秒既够脚本加载完，也远早于玩家选完身份看到广场。
     拿不到（单机 / 断网 / 后台没装）再由定时器铺内置文案，画面不会空着。 */
  var fallbackTimer = setTimeout(function () { useDefaults(); }, 2600);
  loadAds();
  requestAnimationFrame(tick);

  global.Plaza = {
    apply: applyAds,
    reload: loadAds,
    textures: texCache,
    faces: FACES,
    group: tower
  };
})(typeof window !== 'undefined' ? window : this);
