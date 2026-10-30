/* ============================================================
 *  75-board.js
 *  棋盘 3D 构建：地面、盘面贴图、格子网格、雨滴与雪花粒子系统
 * 声明：dn() 格中心坐标, nu() 格朝向, Bn 格子数组, au()/Sx()/wx() 盘面贴图, bi 雨, Si 雪
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

function dn(n) {
  let [t, e] = fs[n];
  return {
    x: (t - (xa - 1) / 2) * Hh,
    z: (e - (_a - 1) / 2) * Hh
  }
}

function nu(n) {
  let [, , t, e] = fs[n];
  return {
    ox: t,
    oz: e
  }
}
var iu = new L.MeshStandardMaterial({
    color: new L.Color("#cfe8bd"),
    roughness: 1
  }),
  su = new L.MeshStandardMaterial({
    color: new L.Color("#a8cf94"),
    roughness: 1
  }),
  Cc = new L.Mesh(new L.CylinderGeometry(28.6, 27.8, .8, 64), su);
Cc.position.y = -.36;
Cc.receiveShadow = !0;
ce.add(Cc);
var ya = new L.Mesh(new L.CircleGeometry(28.6, 64), iu);
ya.rotation.x = -Math.PI / 2;
ya.position.y = -.005;
ya.receiveShadow = !0;
ce.add(ya);
var bx = new L.MeshStandardMaterial({
    color: new L.Color("#f7f3e6"),
    roughness: .95
  }),
  va = new L.Mesh(new L.CircleGeometry(12.4, 48), bx);
va.rotation.x = -Math.PI / 2;
/* 只比草地高 0.025 米时，深度缓冲精度不够，圆盘会被草地盖住（实测整块变绿）。
   抬高到 0.06 米，人眼这个高度察觉不到，但层级就干净了。 */
va.position.y = .06;
va.receiveShadow = !0;
ce.add(va);
var ma = document.createElement("canvas");
ma.width = ma.height = 1024;
/* 中央圆盘的地纹。原来三行文字挤在圆心，现在圆心立了社会时钟塔
   （js/life/77-plaza.js），会被塔身整个压住。
   改成「四季方位盘」：春夏秋冬四个字分别摆在正北/正东/正南/正西，
   每个字各自朝外可读 —— 不管玩家从哪一侧看，总有一个字是正的，
   也不会像弧排上下两条那样出现半圈倒着的字。 */
(function() {
  let t = ma.getContext("2d"),
    e = 512,
    i = 512,
    F = '"PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';

  // 外圈虚线
  t.beginPath(), t.arc(e, i, 472, 0, Math.PI * 2), t.lineWidth = 10,
    t.strokeStyle = "rgba(249,115,22,0.45)", t.setLineDash([26, 20]), t.stroke(), t.setLineDash([]);

  // 刻度环：每 5° 一格，每 90° 一根长刻度
  for (let k = 0; k < 72; k++) {
    let a = k / 72 * Math.PI * 2,
      big = k % 18 === 0;
    t.beginPath();
    t.moveTo(e + Math.cos(a) * 442, i + Math.sin(a) * 442);
    t.lineTo(e + Math.cos(a) * (big ? 420 : 430), i + Math.sin(a) * (big ? 420 : 430));
    t.lineWidth = big ? 5 : 2.5;
    t.strokeStyle = big ? "rgba(30,90,134,0.32)" : "rgba(30,90,134,0.16)";
    t.stroke();
  }

  // 四季方位：a 是画布角度（画布 y 向下即世界 +Z）
  let seasons = [
    { ch: "\u6625", a: -Math.PI / 2, c: "#6fbf5a" },
    { ch: "\u590F", a: 0, c: "#e0a33f" },
    { ch: "\u79CB", a: Math.PI / 2, c: "#d9743f" },
    { ch: "\u51AC", a: Math.PI, c: "#6aa6c8" }
  ];
  t.textAlign = "center";
  t.textBaseline = "middle";
  t.font = "900 104px " + F;
  seasons.forEach(s => {
    t.save();
    t.translate(e + Math.cos(s.a) * 356, i + Math.sin(s.a) * 356);
    // 让字的「上」指向圆心：站在外侧的人看过来正好是正的
    t.rotate(s.a - Math.PI / 2);
    t.fillStyle = s.c;
    t.fillText(s.ch, 0, 0);
    t.restore();
  });
})();
var ru = new L.CanvasTexture(ma);
ru.colorSpace = L.SRGBColorSpace;
var Rc = new L.Mesh(new L.CircleGeometry(11.2, 64), new L.MeshBasicMaterial({
  map: ru,
  transparent: !0,
  depthWrite: !1
}));
Rc.rotation.x = -Math.PI / 2;
Rc.position.y = .10;   // 必须高于圆盘的 0.06，否则被圆盘挡住
ce.add(Rc);
var fc = [],
  zs = [],
  dc = [],
  ic = {};

function au(n) {
  if (ic[n]) return ic[n];
  let t = document.createElement("canvas");
  t.width = t.height = 128;
  let e = t.getContext("2d"),
    i = 64;
  e.beginPath(), e.arc(i, i, 52, 0, Math.PI * 2), e.fillStyle = "rgba(248,252,255,0.97)", e.fill(), e.lineWidth = 5, e.strokeStyle = "rgba(110,145,175,0.45)", e.stroke();
  let s = (l, h, f, d, m) => {
      if (e.fillStyle = d, e.beginPath(), e.arc(l, h, f, 0, Math.PI * 2), e.fill(), m) {
        e.strokeStyle = d, e.lineWidth = 4, e.lineCap = "round";
        for (let g = 0; g < 8; g++) {
          let x = g / 8 * Math.PI * 2;
          e.beginPath(), e.moveTo(l + Math.cos(x) * (f + 5), h + Math.sin(x) * (f + 5)), e.lineTo(l + Math.cos(x) * (f + 13), h + Math.sin(x) * (f + 13)), e.stroke()
        }
      }
    },
    r = (l, h, f, d) => {
      e.fillStyle = d, [
        [-16, 4, 13],
        [0, -4, 17],
        [16, 4, 12],
        [-6, 8, 12],
        [10, 8, 11]
      ].forEach(g => {
        e.beginPath(), e.arc(l + g[0] * f, h + g[1] * f, g[2] * f, 0, Math.PI * 2), e.fill()
      })
    },
    o = (l, h, f, d) => {
      e.strokeStyle = f, e.lineWidth = 4.5, e.lineCap = "round";
      for (let m = 0; m < d; m++) {
        let g = l - 14 + m * 14;
        e.beginPath(), e.moveTo(g, h), e.lineTo(g - 4, h + 16), e.stroke()
      }
    },
    a = (l, h, f, d) => {
      e.strokeStyle = f, e.lineWidth = 3.4, e.lineCap = "round";
      for (let m = 0; m < d; m++) {
        let g = l - 16 + m * 16;
        for (let x = 0; x < 3; x++) {
          let p = x / 3 * Math.PI;
          e.beginPath(), e.moveTo(g - Math.cos(p) * 7, h - Math.sin(p) * 7), e.lineTo(g + Math.cos(p) * 7, h + Math.sin(p) * 7), e.stroke()
        }
      }
    };
  if (n === "sunny") s(i, i, 22, "#f9b93a", !0);
  else if (n === "cloudy") s(i - 16, i - 20, 14, "#f9cf6a", !0), r(i + 4, i + 8, 1, "#dbe6ef");
  else if (n === "rain") r(i, i - 12, 1, "#cbd9e6"), o(i, i + 12, "#4a9fd8", 4);
  else if (n === "storm") r(i, i - 14, 1, "#9fb3c6"), e.fillStyle = "#f5b731", e.beginPath(), e.moveTo(i + 2, i + 8), e.lineTo(i - 10, i + 26), e.lineTo(i, i + 26), e.lineTo(i - 6, i + 42), e.lineTo(i + 12, i + 18), e.lineTo(i + 2, i + 18), e.closePath(), e.fill();
  else if (n === "hot") {
    s(i, i, 22, "#ef4444", !0), e.strokeStyle = "#f59e0b", e.lineWidth = 4, e.lineCap = "round";
    for (let l = 0; l < 3; l++) e.beginPath(), e.moveTo(i - 18, i + 30 + l * 5), e.quadraticCurveTo(i, i + 25 + l * 5, i + 18, i + 30 + l * 5), e.stroke()
  } else if (n === "snow") r(i, i - 14, 1, "#e8f1f8"), a(i, i + 18, "#5aa9d6", 4);
  else if (n === "cold") {
    e.strokeStyle = "#4a86b8", e.lineWidth = 5, e.lineCap = "round";
    for (let l = 0; l < 3; l++) {
      let h = l / 3 * Math.PI;
      e.beginPath(), e.moveTo(i - Math.cos(h) * 26, i - Math.sin(h) * 26), e.lineTo(i + Math.cos(h) * 26, i + Math.sin(h) * 26), e.stroke()
    }
    e.strokeStyle = "#7fb8dd", e.lineWidth = 3;
    for (let l = 0; l < 3; l++) {
      let h = l / 3 * Math.PI + Math.PI / 6;
      e.beginPath(), e.moveTo(i - Math.cos(h) * 14, i - Math.sin(h) * 14), e.lineTo(i + Math.cos(h) * 14, i + Math.sin(h) * 14), e.stroke()
    }
  } else {
    e.strokeStyle = "#93a8b8", e.lineWidth = 5, e.lineCap = "round";
    for (let l = 0; l < 3; l++) e.beginPath(), e.moveTo(i - 22, i - 10 + l * 12), e.bezierCurveTo(i - 8, i - 16 + l * 12, i + 8, i - 4 + l * 12, i + 22, i - 10 + l * 12), e.stroke()
  }
  let c = new L.CanvasTexture(t);
  return c.colorSpace = L.SRGBColorSpace, ic[n] = c, c
}
cs.forEach((n, t) => {
  let e = Math.round((t + .5) * nn / cs.length) % nn,
    {
      x: i,
      z: s
    } = dn(e),
    {
      ox: r,
      oz: o
    } = nu(e),
    a = t % 2 === 0 ? 5.2 : 9,
    c = i + r * a,
    l = s + o * a,
    h = new L.Group,
    f = n.bf();
  f.scale.setScalar(t % 2 === 0 ? 2.05 : 1.85), h.add(f), h.position.set(c, 0, l);
  let d = Math.atan2(-r, -o);
  h.rotation.y = d + (t % 2 === 0 ? -.22 : .26), ce.add(h), fc.push({
    obj: h,
    idx: t,
    cellIdx: e
  });
  let m = wx(n.n, c, l, r, o);
  m && ce.add(m);
  let g = Sx(n.n, n.l, n.c);
  g.position.set(c - r * 2, 2.75, l - o * 2), g.scale.set(.52 * 512 / 168, .52, 1), ce.add(g), dc.push(g);
  let x = new L.Sprite(new L.SpriteMaterial({
    map: au("sunny"),
    transparent: !0,
    depthWrite: !1
  }));
  x.scale.set(.55, .55, 1), x.position.set(c - r * 2, 3.5, l - o * 2), ce.add(x), zs.push(x)
});

function Sx(n, t, e) {
  let r = document.createElement("canvas");
  r.width = 512, r.height = 168;
  let o = r.getContext("2d"),
    a = 30;
  o.beginPath(), o.moveTo(10 + a, 10), o.lineTo(502 - a, 10), o.quadraticCurveTo(502, 10, 502, 10 + a), o.lineTo(502, 158 - a), o.quadraticCurveTo(502, 158, 502 - a, 158), o.lineTo(10 + a, 158), o.quadraticCurveTo(10, 158, 10, 158 - a), o.lineTo(10, 10 + a), o.quadraticCurveTo(10, 10, 10 + a, 10), o.closePath(), o.fillStyle = "rgba(255,255,255,0.95)", o.fill(), o.lineWidth = 6, o.strokeStyle = e, o.stroke(), o.textAlign = "center", o.textBaseline = "middle", o.fillStyle = e, o.font = '900 66px "PingFang SC","Microsoft YaHei",system-ui,sans-serif', o.fillText(n, 512 / 2, 60), o.fillStyle = "#5d7285", o.font = '700 42px "PingFang SC","Microsoft YaHei",system-ui,sans-serif', o.fillText(t, 512 / 2, 126);
  let c = new L.CanvasTexture(r);
  c.colorSpace = L.SRGBColorSpace, c.anisotropy = 4;
  let l = new L.Sprite(new L.SpriteMaterial({
    map: c,
    transparent: !0,
    depthWrite: !1
  }));
  return l.scale.set(.95 * 512 / 168, .95, 1), l
}

function wx(n, t, e, i, s) {
  let r = new L.Group,
    o = g => Math.sin(n.length * 12.9898 + g * 78.233) * 43758.5453 % 1,
    a = g => Math.abs(Math.sin(n.length * 7.13 + g * 3.7) * 1e4 % 1),
    c = Math.atan2(s, i),
    l = (g, x) => {
      let p = c + (a(g) - .5) * 2,
        u = 1.6 + a(g + 9) * 2.8;
      x(t + Math.cos(p) * u, e + Math.sin(p) * u, g)
    },
    h = ["\u9ED1\u9F99\u6C5F", "\u5409\u6797", "\u5185\u8499\u53E4", "\u8FBD\u5B81"],
    f = ["\u65B0\u7586", "\u7518\u8083", "\u5B81\u590F", "\u9752\u6D77", "\u897F\u85CF"],
    d = ["\u6D77\u5357", "\u5E7F\u4E1C", "\u5E7F\u897F", "\u798F\u5EFA", "\u53F0\u6E7E", "\u4E91\u5357"],
    m = ["\u6C5F\u82CF", "\u6D59\u6C5F", "\u5B89\u5FBD", "\u6C5F\u897F", "\u6E56\u5357", "\u6E56\u5317", "\u4E0A\u6D77"];
  if (h.includes(n))
    for (let g = 0; g < 4; g++) l(g, (x, p) => wi(r, x, p, .75 + a(g) * .4, "#2f6f4a"));
  else if (f.includes(n))
    for (let g = 0; g < 3; g++) l(g, (x, p, u) => {
      let y = new L.Mesh(new L.DodecahedronGeometry(.35 + a(u) * .3, 0), Zt("#b0a58c"));
      y.position.set(x, .2, p), y.rotation.set(a(u) * 3, a(u + 1) * 3, 0), y.castShadow = !0, y.receiveShadow = !0, r.add(y)
    });
  else if (d.includes(n))
    for (let g = 0; g < 3; g++) l(g, (x, p, u) => {
      dt(r, .03, .055, .8 + a(u) * .5, "#a1744a", x, 0, p, 6);
      for (let y = 0; y < 4; y++) {
        let _ = y / 4 * Math.PI * 2 + a(u) * 2,
          E = G(r, .62, .03, .16, "#3f9f5e", x + Math.cos(_) * .26, .76 + a(u) * .5, p + Math.sin(_) * .26);
        E.rotation.y = -_, E.rotation.z = -.55
      }
    });
  else if (m.includes(n))
    for (let g = 0; g < 3; g++) l(g, (x, p, u) => {
      dt(r, .02, .03, .9 + a(u) * .6, "#7fae62", x, 0, p, 5);
      for (let y = 1; y <= 3; y++) {
        let _ = G(r, .34, .02, .09, "#7fae62", x + .16, y * .26, p);
        _.rotation.y = a(u + y) * 3, _.rotation.z = -.3
      }
    });
  else
    for (let g = 0; g < 3; g++) l(g, (x, p) => hs(r, x, p, .6 + a(g) * .35, "#4a9c5e"));
  for (let g = 0; g < 3; g++) l(g + 20, (x, p, u) => {
    let y = new L.Mesh(new L.IcosahedronGeometry(.16 + a(u) * .14, 0), Zt("#bfc4bd"));
    y.position.set(x, .08, p), y.rotation.set(a(u) * 2, a(u) * 3, 0), y.castShadow = !0, r.add(y)
  });
  return r
}
var Bn = [],
  Gh = [],
  ou = n => n > 0 && n % 2 === 0,
  __ = new L.MeshStandardMaterial({
    color: new L.Color("#fbfaf2"),
    roughness: .88
  }),
  y_ = new L.MeshStandardMaterial({
    color: new L.Color("#d7d2bd"),
    roughness: .92
  }),
  v_ = new L.MeshStandardMaterial({
    color: new L.Color("#ffc44d"),
    roughness: .78
  });
for (let n = 0; n < nn; n++) {
  let {
    x: t,
    z: e
  } = dn(n), {
    ox: i,
    oz: s
  } = nu(n), r = new L.Group;
  r.position.set(t, 0, e), ce.add(r);
  let o = ou(n),
    a = o ? new L.Color("#f3cf8e") : new L.Color("#f7f5ec"),
    c = o ? new L.Color("#d9b478") : new L.Color("#d7d2bd"),
    l = new L.MeshStandardMaterial({
      color: a.clone(),
      roughness: .88
    }),
    h = new L.MeshStandardMaterial({
      color: c.clone(),
      roughness: .92
    }),
    f = new L.Mesh(Bs(ua, .24, ua, .12), h);
  f.position.y = .1, f.receiveShadow = !0, f.userData.index = n, r.add(f), Gh.push(f);
  let d = new L.Mesh(Bs(ua - .1, .06, ua - .1, .08), l);
  d.position.y = .22, d.receiveShadow = !0, d.userData.index = n, r.add(d), Gh.push(d), Bn.push({
    group: r,
    side: f,
    top: d,
    lift: 0,
    target: 0,
    idx: n,
    ev: o,
    topMatI: l,
    sideMatI: h,
    baseTop: a,
    baseSide: c
  })
}(function() {
  let {
    x: t,
    z: e
  } = dn(0), i = document.createElement("canvas");
  i.width = 256, i.height = 128;
  let s = i.getContext("2d");
  s.fillStyle = "#16283c", s.beginPath(), s.roundRect(8, 8, 240, 112, 26), s.fill(), s.fillStyle = "#ffd166", s.font = '900 58px "PingFang SC",system-ui,sans-serif', s.textAlign = "center", s.textBaseline = "middle", s.fillText("\u7ACB\u6625", 128, 66);
  let r = new L.CanvasTexture(i);
  r.colorSpace = L.SRGBColorSpace;
  let o = new L.Sprite(new L.SpriteMaterial({
    map: r,
    transparent: !0,
    depthWrite: !1
  }));
  o.scale.set(1.7, .85, 1), o.position.set(t, 1.7, e - 1), ce.add(o)
})();
var pn = new L.Mesh(new L.TorusGeometry(.86, .04, 8, 40), new L.MeshBasicMaterial({
  color: 16777215,
  transparent: !0,
  opacity: .9,
  depthWrite: !1
}));
pn.rotation.x = -Math.PI / 2;
pn.position.y = .31;
pn.visible = !1;
ce.add(pn);
var Ex = new L.BoxGeometry(.035, .55, .035),
  cu = new L.MeshBasicMaterial({
    color: 12575999,
    transparent: !0,
    opacity: .55
  }),
  bi = new L.InstancedMesh(Ex, cu, 260);
bi.visible = !1;
bi.frustumCulled = !1;
ce.add(bi);
var pc = [];
for (let n = 0; n < 260; n++) pc.push({
  x: (Math.random() - .5) * 54,
  z: (Math.random() - .5) * 54,
  y: Math.random() * 26,
  v: 16 + Math.random() * 10
});
var ti = new L.Object3D,
  Tx = new L.SphereGeometry(.09, 6, 5),
  Ax = new L.MeshBasicMaterial({
    color: 16777215,
    transparent: !0,
    opacity: .9
  }),
  Si = new L.InstancedMesh(Tx, Ax, 220);
Si.visible = !1;
Si.frustumCulled = !1;
ce.add(Si);
var mc = [];
for (let n = 0; n < 220; n++) mc.push({
  x: (Math.random() - .5) * 54,
  z: (Math.random() - .5) * 54,
  y: Math.random() * 24,
  v: 1.6 + Math.random() * 1.6,
  ph: Math.random() * 6.28
});
