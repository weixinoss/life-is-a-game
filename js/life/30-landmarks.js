/* ============================================================
 *  30-landmarks.js
 *  24 座地标建筑的程序化建模函数 + 省份地标配置表
 * 声明：Vg..Mx 各地标建造函数, Hg 缓存, cs 省份配置表（bf 指向建造函数）
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

function Vg() {
  let n = Jt();
  G(n, 2.5, .56, 1.06, "#c0392b", 0, 0, 0), G(n, 2.62, .09, 1.18, "#ece3d2", 0, .56, 0);
  for (let t = -1; t <= 1; t++) G(n, .3, .4, .14, "#6d1c17", t * .62, .01, .49);
  G(n, 1.86, .4, .76, "#d94b3a", 0, .65, 0);
  for (let t = -2; t <= 2; t++) dt(n, .04, .045, .4, "#f6e7c8", t * .36, .65, .37, 6);
  return G(n, 2.12, .08, .98, "#f2c14e", 0, 1.05, 0), On(n, 2.2, .3, "#e8a72e", 1.12), G(n, 1.5, .26, .6, "#d94b3a", 0, 1.34, 0), G(n, 1.74, .07, .8, "#f2c14e", 0, 1.6, 0), On(n, 1.82, .32, "#e8a72e", 1.67), dt(n, .018, .022, .66, "#cbd5e1", 0, .66, .44, 6), G(n, .26, .16, .02, "#e11d48", .13, 1.08, .44), n
}
var Hg = [];

function Gg() {
  let n = Jt();
  G(n, 1.6, .14, 1, "#cfd8dc", 0, 0, 0), G(n, 1.9, .06, .3, "#4fc3f7", 0, 0, .3, 0, .02);
  let t = G(n, .1, 1.55, .1, "#90a4ae", -.52, .14, 0);
  t.rotation.z = .3;
  let e = G(n, .1, 1.55, .1, "#90a4ae", .52, .14, 0);
  e.rotation.z = -.3;
  let i = new L.Group;
  i.position.set(0, 1.72, 0);
  let s = new L.Mesh(new L.TorusGeometry(.86, .05, 8, 40), Zt("#f06292"));
  s.castShadow = !0, i.add(s);
  let r = new L.Mesh(new L.TorusGeometry(.55, .028, 6, 32), Zt("#f8bbd0"));
  i.add(r);
  for (let o = 0; o < 8; o++) {
    let a = o / 8 * Math.PI * 2,
      c = new L.Mesh(Bs(.88, .022, .022, .01), Zt("#eceff1"));
    c.position.set(Math.cos(a) * .44, Math.sin(a) * .44, 0), c.rotation.z = a, i.add(c)
  }
  for (let o = 0; o < 12; o++) {
    let a = o / 12 * Math.PI * 2,
      c = new L.Mesh(new L.SphereGeometry(.1, 10, 8), Zt(o % 2 ? "#ffd54f" : "#4fc3f7"));
    c.position.set(Math.cos(a) * .9, Math.sin(a) * .9, 0), c.castShadow = !0, i.add(c)
  }
  return n.add(i), Hg.push({
    obj: i,
    axis: "z",
    speed: .28
  }), G(n, 1.9, .05, .22, "#b0bec5", 0, 1.66, 0), n
}

function Wg() {
  let n = Jt(),
    t = .8;
  for (let e = 0; e <= 16; e++) {
    let i = Math.PI * e / 16,
      s = new L.Mesh(Bs(.3, .12, .56, .03), Zt("#dbe3e9"));
    s.position.set(Math.cos(i) * t, Math.sin(i) * t * .92, 0), s.rotation.z = i + Math.PI / 2, s.castShadow = !0, s.receiveShadow = !0, n.add(s)
  }
  G(n, 2.4, .11, .68, "#eef3f6", 0, .7, 0), G(n, .5, .7, .72, "#b9c6d0", -1.05, 0, 0), G(n, .5, .7, .72, "#b9c6d0", 1.05, 0, 0);
  for (let e = 0; e < 10; e++) G(n, .05, .16, .05, "#cbd5e1", -1.05 + e * .234, .81, .3), G(n, .05, .16, .05, "#cbd5e1", -1.05 + e * .234, .81, -.3);
  return G(n, 2.2, .05, .04, "#cbd5e1", 0, .95, .3), G(n, 2.2, .05, .04, "#cbd5e1", 0, .95, -.3), n
}

function Xg() {
  let n = Jt();
  return G(n, 1.5, .14, 1.5, "#b99d78", 0, 0, 0), G(n, .5, .1, .4, "#a58a68", 0, 0, .95), Ns(n, {
    y: .14,
    w: 1.45,
    floors: 5,
    seg: 8,
    wall: "#c9a06b",
    roof: "#6d4c33",
    shrink: .9,
    fh: .26,
    base: .1
  }), dt(n, .02, .03, .4, "#d4af37", 0, 1.85, 0, 6), n
}

function qg() {
  let n = Jt();
  return dt(n, .6, .68, .5, "#f7f2e7", 0, 0, 0, 22), Qt(n, .7, .52, "#ece2cd", 0, .5, 0, 22), dt(n, .1, .1, .06, "#c9a227", 0, 1, 0, 12), G(n, .16, .3, .06, "#d94b3a", 0, .02, .62), G(n, .3, .04, .06, "#c0392b", 0, .32, .62), G(n, .7, .05, .9, "#a5d6a7", .75, 0, .55, .3), wi(n, -.85, .6, .42, "#3f8f5c"), dt(n, .02, .02, .55, "#c9a227", -.7, 0, -.7, 5), G(n, .16, .1, .01, "#42a5f5", -.61, .45, -.7), n
}

function Yg() {
  let n = Jt();
  return G(n, 1.9, .16, 1.6, "#d7cdbb", 0, 0, 0), dt(n, .62, .66, .55, "#c0392b", 0, .16, 0, 8, Math.PI / 8), dt(n, 1.02, 1.04, .09, "#f2c14e", 0, .71, 0, 8, Math.PI / 8), Qt(n, 1.02, .34, "#e8a72e", 0, .8, .08, 8, Math.PI / 8), dt(n, .44, .46, .26, "#c0392b", 0, 1.1, 0, 8, Math.PI / 8), dt(n, .7, .72, .08, "#f2c14e", 0, 1.36, 0, 8, Math.PI / 8), Qt(n, .72, .3, "#e8a72e", 0, 1.44, 0, 8, Math.PI / 8), dt(n, .05, .06, .3, "#d4af37", 0, 1.72, 0, 8), G(n, .5, .24, .5, "#d94b3a", -.62, .16, .45), On(n, .6, .16, "#e8a72e", .4), G(n, .5, .24, .5, "#d94b3a", .62, .16, .45), On(n, .6, .16, "#e8a72e", .4), n
}

function Zg() {
  let n = Jt(),
    t = new L.Mesh(new L.CylinderGeometry(.82, 1.15, .78, 14, 1, !0), Zt("#c3ced8", !0));
  t.position.y = .39, t.castShadow = !0, t.receiveShadow = !0, n.add(t);
  let e = new L.Mesh(new L.TorusGeometry(.82, .09, 6, 20), Zt("#dde6ee"));
  e.rotation.x = Math.PI / 2, e.position.y = .78, e.castShadow = !0, n.add(e);
  let i = new L.Mesh(new L.CylinderGeometry(.82, .5, .7, 14, 1, !0), Zt("#93a7b6", !0));
  i.position.y = .38, i.receiveShadow = !0, n.add(i);
  let s = new L.Mesh(new L.CircleGeometry(.74, 22), Zt("#2fa8e0"));
  return s.rotation.x = -Math.PI / 2, s.position.y = .5, n.add(s), Vt(n, .2, "#f5fbff", 0, .92, 0, 1, .55, 1), Vt(n, .14, "#f5fbff", -.8, .8, .3, 1, .6, 1), Vt(n, .15, "#f5fbff", .78, .82, -.25, 1, .6, 1), n
}

function Jg() {
  let n = Jt();
  return G(n, 1, .62, 1, "#b0663f", 0, 0, 0), G(n, 1.06, .06, 1.06, "#8d4b2e", 0, .62, 0), dt(n, .34, .36, .3, "#c47a52", 0, .68, 0, 8, Math.PI / 8), Vt(n, .34, "#3fa06b", 0, 1.12, 0, 1, 1.15, 1), Qt(n, .16, .34, "#35915f", 0, 1.3, 0, 12), dt(n, .016, .016, .2, "#d4af37", 0, 1.6, 0, 5), G(n, .16, .02, .02, "#d4af37", 0, 1.72, 0), dt(n, .16, .17, .42, "#c47a52", -.55, .68, .15, 6), Vt(n, .16, "#3fa06b", -.55, .99, .15, 1, 1.2, 1), dt(n, .14, .15, .34, "#c47a52", .55, .68, .15, 6), Vt(n, .14, "#3fa06b", .55, .94, .15, 1, 1.2, 1), G(n, .24, .34, .06, "#7b3f22", 0, .02, .5), n
}

function $g() {
  let n = Jt();
  dt(n, .5, .62, .1, "#cfd8dc", 0, 0, 0, 14);
  for (let t = 0; t < 3; t++) {
    let e = t / 3 * Math.PI * 2,
      i = G(n, .09, 1.25, .09, "#7986a0", Math.cos(e) * .24, .1, Math.sin(e) * .24);
    i.rotation.z = -Math.cos(e) * .09, i.rotation.x = Math.sin(e) * .09
  }
  return dt(n, .2, .24, .9, "#8fa0bb", 0, .1, 0, 12), Vt(n, .4, "#e0455e", 0, 1.35, 0, 1, .96, 1), dt(n, .11, .13, .62, "#8fa0bb", 0, 1.5, 0, 10), Vt(n, .24, "#e0455e", 0, 2.28, 0, 1, .95, 1), dt(n, .05, .09, .62, "#8fa0bb", 0, 2.4, 0, 8), dt(n, .012, .03, .34, "#cfd8dc", 0, 3, 0, 6), n
}

function Kg() {
  let n = Jt();
  G(n, 1.9, .62, .16, "#fbf7ee", 0, 0, -.5), G(n, 2.02, .09, .4, "#5c6f7d", 0, .62, -.5), G(n, 2.06, .05, .14, "#455663", 0, .71, -.5);
  let t = new L.Mesh(new L.TorusGeometry(.2, .05, 8, 22), Zt("#8aa0ae"));
  t.position.set(.5, .32, -.41), t.castShadow = !0, n.add(t);
  let e = new L.Mesh(new L.TorusGeometry(.13, .035, 8, 18), Zt("#8aa0ae"));
  e.position.set(-.55, .28, -.41), n.add(e), G(n, .7, .06, .7, "#e8ded0", -.3, .02, .4);
  for (let i = 0; i < 4; i++) {
    let s = i / 4 * Math.PI * 2 + Math.PI / 4;
    dt(n, .035, .04, .4, "#a94b3a", -.3 + Math.cos(s) * .24, .08, .4 + Math.sin(s) * .24, 6)
  }
  return On(n, .9, .26, "#5c6f7d", .48), Qt(n, .05, .12, "#c9a227", -.3, .74, .4, 6), Vt(n, .16, "#8fa3b3", .75, .16, .6, 1.2, .8, 1), Vt(n, .11, "#a8bcc9", .5, .12, .72, 1, .8, 1), n
}

function jg() {
  let n = Jt();
  return G(n, 1.35, .14, 1.35, "#cfc3ae", 0, 0, 0), Ns(n, {
    y: .14,
    w: 1.3,
    floors: 5,
    seg: 8,
    wall: "#d8c9a8",
    roof: "#c8873a",
    shrink: .87,
    fh: .24,
    base: .09
  }), dt(n, .035, .06, .4, "#e0b64a", 0, 1.5, 0, 8), Vt(n, .09, "#e0b64a", 0, 1.92, 0), n
}

function Qg() {
  let n = Jt();
  return dt(n, .5, .78, .95, "#8c9aa8", 0, 0, -.2, 6), dt(n, .32, .5, .7, "#9babb9", .62, 0, .32, 5), dt(n, .24, .4, .5, "#a8b7c4", -.66, 0, .26, 5), Vt(n, .3, "#f2f7fb", 0, .95, -.2, 1.1, .5, 1.1), dt(n, .03, .045, .42, "#6d4c41", .02, .82, -.2, 6), Qt(n, .3, .16, "#2f7d4f", .02, 1.2, -.2, 8), Qt(n, .24, .14, "#377f52", .26, 1.08, -.2, 8), Qt(n, .2, .12, "#2f7d4f", -.22, 1.1, -.2, 8), wi(n, -.55, .55, .5, "#3c8f5f"), n
}

function tx() {
  let n = Jt(),
    t = new L.Mesh(new L.CylinderGeometry(.92, .95, .6, 26, 1, !0), Zt("#d3ad78", !0));
  t.position.y = .3, t.castShadow = !0, t.receiveShadow = !0, n.add(t);
  let e = new L.Mesh(new L.CylinderGeometry(.48, .99, .26, 26, 1, !0), Zt("#5d4037", !0));
  e.position.y = .72, e.castShadow = !0, n.add(e);
  let i = new L.Mesh(new L.CircleGeometry(.47, 24), Zt("#c49a6c"));
  i.rotation.x = -Math.PI / 2, i.position.y = .06, i.receiveShadow = !0, n.add(i);
  let s = new L.Mesh(new L.TorusGeometry(.94, .05, 6, 28), Zt("#e0c9a0"));
  s.rotation.x = Math.PI / 2, s.position.y = .6, n.add(s);
  for (let r = 0; r < 8; r++) {
    let o = r / 8 * Math.PI * 2 + .2;
    G(n, .09, .14, .04, "#5d4037", Math.cos(o) * .93, .28, Math.sin(o) * .93, -o + Math.PI / 2)
  }
  return G(n, .2, .26, .06, "#8d6e63", 0, .02, .93), wi(n, -1.1, .75, .45, "#3f8f5c"), n
}

function ex() {
  let n = Jt();
  G(n, 1.9, .18, 1.5, "#d8cdb8", 0, 0, 0);
  let t = .18,
    e = 1.6,
    i = ["#c0392b", "#c0392b", "#b5342a"],
    s = ["#2e7d6b", "#2e7d6b", "#276b5c"];
  for (let r = 0; r < 3; r++) {
    G(n, e, .36, e * .72, i[r], 0, t, 0);
    for (let o = -1; o <= 1; o++) dt(n, .035, .04, .36, "#f2e3c8", o * e * .28, t, e * .36 - .02, 6);
    G(n, e * 1.16, .07, e * .86, s[r], 0, t + .36, 0), r < 2 && Qt(n, e * .62, .16, s[r], 0, t + .42, 0, 4, Math.PI / 4), t += .5, e *= .82
  }
  return Qt(n, e * 1.2, .4, "#276b5c", 0, t - .06, 0, 4, Math.PI / 4), G(n, .05, .24, .05, "#e0b64a", 0, t + .32, 0), n
}

function nx() {
  let n = Jt();
  dt(n, .5, 1.02, 1.05, "#8e9aa8", 0, 0, 0, 6), dt(n, .58, .62, .12, "#a6b2be", 0, .6, 0, 6), dt(n, .3, .34, .08, "#b7c2cd", 0, .95, 0, 6);
  for (let t = 0; t < 7; t++) G(n, .3, .09, .1, "#cfd8e0", 0, .06 + t * .13, .62 + t * .09, 0, .02);
  return G(n, .7, .2, .24, "#c0392b", 0, 1.05, 0), G(n, .78, .06, .3, "#f2c14e", 0, 1.25, 0), On(n, .8, .16, "#e8a72e", 1.31), G(n, .14, .22, .1, "#8e2b23", 0, 1.05, .14), Vt(n, .16, "#f2f7fb", .72, .1, -.3, 1.2, .7, 1), wi(n, -.8, .5, .46, "#357f55"), n
}

function ix() {
  let n = Jt(),
    t = "#a8a29a",
    e = "#9b958c";
  G(n, 1.5, .1, 1.3, "#cfc8ba", 0, 0, 0);

  function i(s, r, o, a) {
    dt(n, a * .42, a * .5, o, t, s, .1, r, 8, Math.PI / 8), dt(n, a * .62, a * .62, .05, e, s, .1 + o, r, 8, Math.PI / 8), Qt(n, a * .68, a * .55, e, s, .15 + o, r, 8, Math.PI / 8)
  }
  return i(0, 0, 1.05, .42), i(-.58, .24, .7, .32), i(.56, .3, .82, .34), i(.42, -.5, .55, .28), i(-.48, -.48, .62, .3), G(n, .62, .3, .1, "#8d2a22", 0, .1, .62), G(n, .72, .05, .2, "#e0b64a", 0, .4, .62), n
}

function sx() {
  let n = Jt();
  G(n, 1.8, .22, 1.6, "#d9d0be", 0, 0, 0);
  let t = .22,
    e = 1.5;
  for (let i = 0; i < 5; i++) {
    G(n, e, .28, e * .78, "#c0392b", 0, t, 0);
    for (let s = -1; s <= 1; s += 2) dt(n, .03, .035, .28, "#f2e3c8", s * e * .3, t, e * .38, 5);
    G(n, e * 1.2, .06, e * .94, "#f2c14e", 0, t + .28, 0), Qt(n, e * .66, .16, "#e8a72e", 0, t + .34, 0, 4, Math.PI / 4), t += .42, e *= .84
  }
  return Qt(n, e * 1.35, .42, "#e8a72e", 0, t - .04, 0, 4, Math.PI / 4), dt(n, .04, .05, .32, "#e0b64a", 0, t + .3, 0, 6), hs(n, .72, .6, .4, "#4a9c5e"), n
}

function rx() {
  let n = Jt();
  G(n, 1.7, .2, 1.5, "#d4cbb8", 0, 0, 0), G(n, 1.45, .34, 1.15, "#c0392b", 0, .2, 0);
  for (let t = -1; t <= 1; t += 2) dt(n, .032, .038, .34, "#f2e3c8", t * .5, .2, .55, 5);
  return G(n, 1.78, .08, 1.45, "#3d7a6a", 0, .54, 0), Qt(n, 1.05, .3, "#357f6f", 0, .62, 0, 4, Math.PI / 4), G(n, 1.05, .26, .82, "#c0392b", 0, .78, 0), G(n, 1.32, .07, 1.05, "#3d7a6a", 0, 1.04, 0), Qt(n, .8, .26, "#357f6f", 0, 1.11, 0, 4, Math.PI / 4), Qt(n, .42, .24, "#357f6f", 0, 1.34, 0, 4, Math.PI / 4), dt(n, .035, .04, .2, "#e0b64a", 0, 1.5, 0, 6), G(n, 1.45, .05, .05, "#b0bec5", 0, .2, .62), n
}

function ax() {
  let n = Jt(),
    e = [
      [0, .46],
      [.05, .41],
      [.14, .33],
      [.26, .255],
      [.38, .205],
      [.48, .185],
      [.58, .205],
      [.7, .215],
      [.8, .195],
      [.9, .135],
      [1, .055]
    ].map(o => new L.Vector2(o[1], o[0] * 2.55)),
    i = new L.LatheGeometry(e, 14),
    s = new L.Mesh(i, Zt("#dbe3ea"));
  s.castShadow = !0, s.receiveShadow = !0, n.add(s);
  let r = new L.Mesh(new L.TorusGeometry(.24, .03, 6, 18), Zt("#ef7f9e"));
  return r.rotation.x = Math.PI / 2, r.position.y = 1.35, n.add(r), dt(n, .44, .56, .1, "#b8c5d0", 0, 0, 0, 14), dt(n, .012, .028, .6, "#cfd8dc", 0, 2.55, 0, 6), Vt(n, .035, "#e0455e", 0, 3.18, 0), n
}

function ox() {
  let n = Jt(),
    t = new L.Mesh(new L.CircleGeometry(1.25, 26), Zt("#5fc9e8"));
  t.rotation.x = -Math.PI / 2, t.position.y = .06, t.receiveShadow = !0, n.add(t);
  let e = (i, s, r, o, a) => {
    let c = Qt(n, o, r, a, i, .05, s, 6);
    c.rotation.y = Math.random() * 3, Vt(n, o * .55, "#5f7d68", i, .05 + r * .4, s, 1, .55, 1)
  };
  return e(-.5, -.35, 1.55, .42, "#8d9c8c"), e(.15, -.55, 1.2, .38, "#7e8f80"), e(.55, -.15, 1.75, .36, "#75877a"), e(-.85, .35, 1, .3, "#94a394"), G(n, .42, .06, .16, "#8d6e63", .35, .1, .5, .3), G(n, .3, .1, .14, "#e0e0e0", .35, .14, .5, .3), dt(n, .02, .02, .16, "#a1887f", .2, .14, .5, 5), n
}

function cx() {
  let n = Jt(),
    t = new L.Mesh(new L.CircleGeometry(1.2, 24), Zt("#f7e6b8"));
  t.rotation.x = -Math.PI / 2, t.position.y = .04, t.receiveShadow = !0, n.add(t);
  let e = new L.Mesh(new L.CircleGeometry(1.25, 26), Zt("#59cbe8"));
  e.rotation.x = -Math.PI / 2, e.position.y = .02, n.add(e);

  function i(r, o, a, c) {
    let l = dt(n, .035, .06, a, "#a1744a", r, .06, o, 6);
    l.rotation.z = c;
    let h = r - Math.sin(c) * a * .5,
      f = .06 + Math.cos(c) * a;
    for (let d = 0; d < 5; d++) {
      let m = d / 5 * Math.PI * 2,
        g = G(n, .55, .035, .14, "#3f9f5e", h + Math.cos(m) * .24, f - .03, o + Math.sin(m) * .24);
      g.rotation.y = -m, g.rotation.z = -.5
    }
    Vt(n, .07, "#8d6e3f", h, f - .04, o)
  }
  i(-.55, -.3, 1.15, .16), i(.4, -.55, .95, -.12), i(.62, .28, .78, -.2);
  let s = new L.Mesh(new L.ConeGeometry(.36, .2, 8), Zt("#ff7a59"));
  return s.position.set(-.35, .55, .5), s.castShadow = !0, n.add(s), dt(n, .02, .02, .5, "#e0e0e0", -.35, .06, .5, 6), G(n, .4, .03, .28, "#ffd166", -.35, .06, .75, .2, .02), n
}

function lx() {
  let n = Jt();
  G(n, 1.7, .12, 1.5, "#c9b8a0", 0, 0, 0);
  let t = [{
    w: 1.5,
    d: 1.2,
    y: .12,
    c: "#8d5a3b"
  }, {
    w: 1.35,
    d: 1.05,
    y: .42,
    c: "#9c6544"
  }, {
    w: 1.18,
    d: .9,
    y: .7,
    c: "#8d5a3b"
  }, {
    w: 1,
    d: .75,
    y: .96,
    c: "#a06a48"
  }, {
    w: .8,
    d: .6,
    y: 1.2,
    c: "#8d5a3b"
  }];
  for (let e of t) {
    G(n, e.w, .24, e.d, e.c, 0, e.y, 0), G(n, e.w * 1.06, .07, e.d * 1.1, "#5d3a26", 0, e.y + .24, 0);
    let i = Math.max(2, Math.round(e.w / .32));
    for (let s = 0; s < i; s++) G(n, .13, .1, .02, "#ffd97a", -e.w / 2 + .18 + s * (e.w - .36) / Math.max(1, i - 1), e.y + .06, e.d / 2 + .005)
  }
  return Qt(n, .62, .2, "#4e3322", 0, 1.44, 0, 4, Math.PI / 4), wi(n, -.95, .65, .45, "#3f8f5c"), wi(n, 1, .5, .38, "#3f8f5c"), n
}

function hx() {
  let n = Jt();
  G(n, 1.4, .1, 1.2, "#a8d5a2", 0, 0, 0);
  let t = 0,
    e = 0;
  Vt(n, .52, "#fdfdfd", t, .5, e, 1, 1.08, .92), Vt(n, .19, "#2f2f2f", t - .3, .98, e, 1, 1, .6), Vt(n, .19, "#2f2f2f", t + .3, .98, e, 1, 1, .6), Vt(n, .31, "#fdfdfd", t, .92, e + .06, 1, .94, .9), Vt(n, .1, "#2b2b2b", t - .13, .97, e + .24, 1.15, 1.3, .7), Vt(n, .1, "#2b2b2b", t + .13, .97, e + .24, 1.15, 1.3, .7), Vt(n, .035, "#ffffff", t - .13, .99, e + .31), Vt(n, .035, "#ffffff", t + .13, .99, e + .31), Vt(n, .045, "#2b2b2b", t, .88, e + .32), Vt(n, .12, "#2b2b2b", t - .42, .34, e + .14, .8, 1.5, .8), Vt(n, .12, "#2b2b2b", t + .42, .34, e + .14, .8, 1.5, .8), Vt(n, .13, "#2b2b2b", t - .26, .12, e + .2, 1.5, .7, 1), Vt(n, .13, "#2b2b2b", t + .26, .12, e + .2, 1.5, .7, 1);
  let i = G(n, .05, 1, .05, "#5aa860", .42, .1, .3);
  i.rotation.z = -.22;
  for (let s = 0; s < 3; s++) {
    let r = G(n, .24, .02, .09, "#4a9c55", .52 + s * .05, .55 + s * .18, .3);
    r.rotation.y = s * .9, r.rotation.z = -.3
  }
  return n
}

function ux() {
  let n = Jt();
  G(n, .86, .85, .62, "#93a2ac", -.82, 0, -.36), G(n, .86, .85, .62, "#93a2ac", .82, 0, -.36), G(n, 2.1, .22, .7, "#7d8b96", 0, .85, -.36), G(n, 1.92, .12, .58, "#6d7a85", 0, 1.07, -.36);
  let t = G(n, .62, 1.02, .07, "#f2fbff", 0, .02, -.24);
  t.material = Zt("#e8f8ff"), G(n, .7, .09, .1, "#ffffff", 0, .98, -.24);
  let e = new L.Mesh(new L.CircleGeometry(.7, 22), Zt("#63cdea"));
  e.rotation.x = -Math.PI / 2, e.position.set(0, .1, .34), e.receiveShadow = !0, n.add(e);
  for (let i = 0; i < 6; i++) Vt(n, .1 + i % 3 * .04, "#ffffff", -.36 + i * .15, .16, .18 + i % 2 * .16, 1, .55, 1);
  return hs(n, -.95, .5, .4, "#4a9c5e"), hs(n, .96, .46, .34, "#57a866"), n
}

function fx() {
  let n = Jt();
  G(n, 1.8, .12, 1.2, "#cdc3b0", 0, 0, 0), dt(n, .34, .4, .42, "#f5f1e6", 0, .12, 0, 8, Math.PI / 8), Ns(n, {
    y: .54,
    w: .62,
    floors: 6,
    seg: 8,
    wall: "#f5f1e6",
    roof: "#e8e0cc",
    shrink: .87,
    fh: .15,
    base: .05
  });
  let t = Jt();
  t.position.set(-.62, 0, .26), n.add(t), dt(t, .19, .23, .22, "#f5f1e6", 0, .12, 0, 8, Math.PI / 8), Ns(t, {
    y: .34,
    w: .34,
    floors: 4,
    seg: 8,
    wall: "#f5f1e6",
    roof: "#e8e0cc",
    shrink: .86,
    fh: .11,
    base: .035
  });
  let e = Jt();
  return e.position.set(.62, 0, .26), n.add(e), dt(e, .19, .23, .22, "#f5f1e6", 0, .12, 0, 8, Math.PI / 8), Ns(e, {
    y: .34,
    w: .34,
    floors: 4,
    seg: 8,
    wall: "#f5f1e6",
    roof: "#e8e0cc",
    shrink: .86,
    fh: .11,
    base: .035
  }), dt(n, .02, .03, .28, "#e0b64a", 0, 1.66, 0, 6), n
}

function dx() {
  let n = Jt();
  G(n, 2, .16, 1.5, "#c2b49a", 0, 0, 0), G(n, 1.7, .5, 1.15, "#faf6ec", 0, .16, -.05), G(n, 1.5, .46, 1, "#faf6ec", 0, .66, -.12), G(n, 1.85, .1, 1.28, "#8d3b2e", 0, 1.12, -.08), G(n, .72, .6, .72, "#a8392c", 0, 1.14, -.1), G(n, .8, .08, .8, "#f2c14e", 0, 1.74, -.1), Qt(n, .42, .2, "#e8a72e", 0, 1.82, -.1, 4, Math.PI / 4);
  for (let t = 0; t < 4; t++) G(n, .11, .12, .02, "#5d4a33", -.6 + t * .4, .3, .53), G(n, .1, .11, .02, "#5d4a33", -.42 + t * .28, .78, .4);
  return G(n, .16, .2, .03, "#4a3a26", 0, .16, .53), G(n, .9, .16, .3, "#b8a888", 0, 0, .72), n
}

function px() {
  let n = Jt();
  G(n, 1.7, .16, 1.5, "#cfc3a8", 0, 0, 0), G(n, 1.2, .14, 1.2, "#d9cfb8", 0, 0, .02);
  let t = .3,
    e = 1;
  for (let i = 0; i < 7; i++) {
    G(n, e, .19, e, "#c9b58c", 0, t, 0), G(n, e * 1.18, .05, e * 1.18, "#a8916a", 0, t + .19, 0);
    for (let s = -1; s <= 1; s += 2) G(n, .07, .09, .02, "#7a6647", s * e * .2, t + .05, e / 2 + .005);
    t += .245, e *= .9
  }
  return Qt(n, e * 1.3, .22, "#a8916a", 0, t - .02, 0, 4, Math.PI / 4), dt(n, .02, .03, .22, "#d4af37", 0, t + .16, 0, 5), n
}

function mx() {
  let n = Jt();
  return G(n, 2, .36, .34, "#c8a978", 0, 0, 0), G(n, 2.06, .06, .4, "#b09263", 0, .36, 0), G(n, .68, .44, .5, "#d8bb8c", 0, .36, 0), G(n, .78, .06, .6, "#5d4037", 0, .8, 0), On(n, .8, .24, "#6d4c33", .86), G(n, .4, .14, .3, "#d8bb8c", -.88, .42, 0), On(n, .46, .16, "#6d4c33", .56), G(n, .4, .14, .3, "#d8bb8c", .88, .42, 0), On(n, .46, .16, "#6d4c33", .56), G(n, .14, .2, .06, "#6d4c33", 0, .36, .26), hs(n, -.6, .55, .34, "#7d9c58"), Vt(n, .26, "#e8d5a8", 1.05, .06, .62, 1.4, .5, 1.2), n
}

function gx() {
  let n = Jt(),
    t = new L.Mesh(new L.CircleGeometry(1.25, 30), Zt("#2f9fd6"));
  t.rotation.x = -Math.PI / 2, t.position.y = .12, t.receiveShadow = !0, n.add(t);
  let e = new L.Mesh(new L.RingGeometry(1.05, 1.45, 30), Zt("#e8dcb5"));
  return e.rotation.x = -Math.PI / 2, e.position.y = .08, n.add(e), Qt(n, .55, 1, "#8fa4b5", -.75, .1, -.62, 5), Vt(n, .28, "#ffffff", -.75, .92, -.62, 1, .8, 1), Qt(n, .4, .72, "#9db1c0", -.18, .1, -.85, 5), Vt(n, .2, "#ffffff", -.18, .68, -.85, 1, .8, 1), dt(n, .03, .03, .5, "#8d6e63", .55, .1, .55, 5), G(n, .1, .06, .06, "#e53935", .4, .42, .55), G(n, .1, .06, .06, "#fdd835", .5, .36, .55), G(n, .1, .06, .06, "#1e88e5", .4, .3, .55), G(n, .34, .04, .2, "#f5f5f5", .62, .35, .42, .4, .02), n
}

function xx() {
  let n = Jt();
  G(n, 1.9, .08, 1.6, "#dcc9a2", 0, 0, 0), dt(n, .22, .52, 1, "#c9a97a", -.1, .08, -.15, 8), dt(n, .16, .36, .55, "#d4b68a", -.62, .08, .42, 8), dt(n, .14, .3, .42, "#c9a97a", .55, .08, .45, 8), dt(n, .1, .22, .3, "#d4b68a", .62, .08, -.5, 8), Vt(n, .12, "#b99a6d", -.1, 1.14, -.15, 1, .7, 1);
  for (let t = 0; t < 3; t++) G(n, .16, .06, .16, "#a8916a", -.8 + t * .7, .1, .62 + t * .05);
  return hs(n, .9, -.6, .3, "#8a9c5e"), n
}

function _x() {
  let n = Jt();
  return G(n, 1.9, .16, 1.4, "#e0d3b4", 0, 0, 0), G(n, 1.3, .55, .9, "#f2e6c8", 0, .16, -.1), Vt(n, .52, "#3fa08a", 0, .82, -.1, 1, .86, 1), Qt(n, .2, .26, "#35917c", 0, .98, -.1, 12), dt(n, .02, .02, .18, "#d4af37", 0, 1.42, -.1, 5), G(n, .18, .26, .02, "#5d8a7a", 0, .3, .36), dt(n, .11, .14, .95, "#f2e6c8", -.75, .16, .28, 8), Vt(n, .15, "#3fa08a", -.75, 1.18, .28, 1, 1.1, 1), Qt(n, .09, .2, "#35917c", -.75, 1.26, .28, 10), dt(n, .11, .14, .95, "#f2e6c8", .75, .16, .28, 8), Vt(n, .15, "#3fa08a", .75, 1.18, .28, 1, 1.1, 1), Qt(n, .09, .2, "#35917c", .75, 1.26, .28, 10), n
}

function yx() {
  let n = Jt();
  G(n, 1.8, .1, 1.5, "#cfd8dc", 0, 0, 0);
  let t = new L.Mesh(new L.CylinderGeometry(.26, .46, 1.85, 4), Zt("#6f8fa8"));
  t.position.set(0, 1.02, 0), t.rotation.y = Math.PI / 4, t.castShadow = !0, t.receiveShadow = !0, n.add(t);
  let e = new L.Mesh(new L.ConeGeometry(.26, .22, 4), Zt("#5b7a92"));
  e.position.set(0, 2.05, 0), e.rotation.y = Math.PI / 4, e.castShadow = !0, n.add(e), G(n, .05, .42, .05, "#b0bec5", 0, 2.14, 0);
  let i = new L.Mesh(new L.CylinderGeometry(.16, .22, 1.05, 4), Zt("#8aa7bb"));
  i.position.set(-.6, .62, .3), i.rotation.y = Math.PI / 4, i.castShadow = !0, n.add(i);
  let s = new L.Mesh(new L.CylinderGeometry(.14, .2, .78, 4), Zt("#9db8c9"));
  return s.position.set(.58, .5, -.32), s.rotation.y = Math.PI / 4, s.castShadow = !0, n.add(s), Vt(n, .1, "#7fc6c0", .6, .9, .4, 1, .4, 1), n
}

function vx() {
  let n = Jt();
  G(n, 1.5, .1, 1.2, "#ddd2bc", 0, 0, 0);
  for (let e = 0; e < 3; e++) G(n, 1.5 - e * .06, .06, 1.2 - e * .2, "#cfc3ab", 0, .1 + e * .06, .52 - e * .1);
  G(n, 1.15, 1, .16, "#e6d8bb", 0, .28, -.1), G(n, .9, .34, .14, "#e6d8bb", 0, 1.28, -.1), G(n, .62, .26, .12, "#e6d8bb", 0, 1.62, -.1), G(n, .3, .2, .1, "#e6d8bb", 0, 1.88, -.1), Qt(n, .22, .24, "#d8c9a8", 0, 2.06, -.1, 4, Math.PI / 4), G(n, .24, .38, .04, "#8d6e63", 0, .28, .02);
  let t = new L.Mesh(new L.TorusGeometry(.1, .035, 6, 14, Math.PI), Zt("#8d6e63"));
  t.position.set(0, .66, .02), n.add(t);
  for (let e = -1; e <= 1; e += 2) dt(n, .045, .05, .62, "#d8c9a8", e * .4, .28, .02, 6), G(n, .13, .1, .03, "#7d6a52", e * .4, .8, .02);
  for (let e = 0; e < 3; e++) G(n, .1, .14, .03, "#7d6a52", -.24 + e * .24, 1.42, 0);
  return G(n, .04, .18, .02, "#7d6a52", 0, 1.9, 0), n
}

function Mx() {
  let n = Jt();
  G(n, 1.7, .12, 1.5, "#d4dae0", 0, 0, 0), G(n, .9, .34, .9, "#b9c4cd", 0, .12, 0);
  let t = .46;
  for (let e = 0; e < 8; e++) dt(n, .3, .34, .18, e % 2 ? "#8fb8ad" : "#9cc4b8", 0, t, 0, 4, Math.PI / 4), G(n, .56, .035, .56, "#dfe9e4", 0, t + .18, 0, Math.PI / 4), t += .215;
  return dt(n, .18, .3, .18, "#7fa89d", 0, t, 0, 4, Math.PI / 4), dt(n, .06, .12, .34, "#8fb8ad", 0, t + .18, 0, 4, Math.PI / 4), dt(n, .012, .03, .3, "#cfd8dc", 0, t + .5, 0, 6), G(n, .16, .34, .16, "#9cc4b8", -.62, .12, .42, .4), n
}
var cs = [{
    n: "\u5317\u4EAC",
    l: "\u5929\u5B89\u95E8",
    c: "#dc3b2f",
    bf: Vg
  }, {
    n: "\u5929\u6D25",
    l: "\u5929\u6D25\u4E4B\u773C",
    c: "#3d8fd1",
    bf: Gg
  }, {
    n: "\u6CB3\u5317",
    l: "\u8D75\u5DDE\u6865",
    c: "#5f7d95",
    bf: Wg
  }, {
    n: "\u5C71\u897F",
    l: "\u5E94\u53BF\u6728\u5854",
    c: "#b07b3c",
    bf: Xg
  }, {
    n: "\u5185\u8499\u53E4",
    l: "\u8349\u539F\u6BE1\u623F",
    c: "#4f9d5d",
    bf: qg
  }, {
    n: "\u8FBD\u5B81",
    l: "\u6C88\u9633\u6545\u5BAB",
    c: "#c0392b",
    bf: Yg
  }, {
    n: "\u5409\u6797",
    l: "\u957F\u767D\u5929\u6C60",
    c: "#4a90b8",
    bf: Zg
  }, {
    n: "\u9ED1\u9F99\u6C5F",
    l: "\u5723\u7D22\u83F2\u4E9A",
    c: "#2f8f63",
    bf: Jg
  }, {
    n: "\u4E0A\u6D77",
    l: "\u4E1C\u65B9\u660E\u73E0",
    c: "#d63a5a",
    bf: $g
  }, {
    n: "\u6C5F\u82CF",
    l: "\u82CF\u5DDE\u56ED\u6797",
    c: "#5c7a8a",
    bf: Kg
  }, {
    n: "\u6D59\u6C5F",
    l: "\u96F7\u5CF0\u5854",
    c: "#b9812f",
    bf: jg
  }, {
    n: "\u5B89\u5FBD",
    l: "\u9EC4\u5C71\u8FCE\u5BA2\u677E",
    c: "#4a7f5f",
    bf: Qg
  }, {
    n: "\u798F\u5EFA",
    l: "\u5BA2\u5BB6\u571F\u697C",
    c: "#b9763f",
    bf: tx
  }, {
    n: "\u6C5F\u897F",
    l: "\u6ED5\u738B\u9601",
    c: "#2e7d6b",
    bf: ex
  }, {
    n: "\u5C71\u4E1C",
    l: "\u6CF0\u5C71\u5357\u5929\u95E8",
    c: "#7a8794",
    bf: nx
  }, {
    n: "\u6CB3\u5357",
    l: "\u5C11\u6797\u5854\u6797",
    c: "#9a9284",
    bf: ix
  }, {
    n: "\u6E56\u5317",
    l: "\u9EC4\u9E64\u697C",
    c: "#c0392b",
    bf: sx
  }, {
    n: "\u6E56\u5357",
    l: "\u5CB3\u9633\u697C",
    c: "#357f6f",
    bf: rx
  }, {
    n: "\u5E7F\u4E1C",
    l: "\u5E7F\u5DDE\u5854",
    c: "#d1567e",
    bf: ax
  }, {
    n: "\u5E7F\u897F",
    l: "\u6842\u6797\u5C71\u6C34",
    c: "#3f8f6a",
    bf: ox
  }, {
    n: "\u6D77\u5357",
    l: "\u6930\u98CE\u6D77\u97F5",
    c: "#e08b3a",
    bf: cx
  }, {
    n: "\u91CD\u5E86",
    l: "\u6D2A\u5D16\u6D1E",
    c: "#a8562f",
    bf: lx
  }, {
    n: "\u56DB\u5DDD",
    l: "\u5927\u718A\u732B",
    c: "#4a8f5a",
    bf: hx
  }, {
    n: "\u8D35\u5DDE",
    l: "\u9EC4\u679C\u6811\u7011\u5E03",
    c: "#4fa3c7",
    bf: ux
  }, {
    n: "\u4E91\u5357",
    l: "\u5927\u7406\u4E09\u5854",
    c: "#a88f6a",
    bf: fx
  }, {
    n: "\u897F\u85CF",
    l: "\u5E03\u8FBE\u62C9\u5BAB",
    c: "#a8392c",
    bf: dx
  }, {
    n: "\u9655\u897F",
    l: "\u5927\u96C1\u5854",
    c: "#b09367",
    bf: px
  }, {
    n: "\u7518\u8083",
    l: "\u5609\u5CEA\u5173",
    c: "#b09263",
    bf: mx
  }, {
    n: "\u9752\u6D77",
    l: "\u9752\u6D77\u6E56",
    c: "#2f9fd6",
    bf: gx
  }, {
    n: "\u5B81\u590F",
    l: "\u897F\u590F\u738B\u9675",
    c: "#c9a97a",
    bf: xx
  }, {
    n: "\u65B0\u7586",
    l: "\u827E\u63D0\u5C15\u5C14",
    c: "#3fa08a",
    bf: _x
  }, {
    n: "\u9999\u6E2F",
    l: "\u4E2D\u94F6\u5927\u53A6",
    c: "#5b7a92",
    bf: yx
  }, {
    n: "\u6FB3\u95E8",
    l: "\u5927\u4E09\u5DF4\u724C\u574A",
    c: "#b78a5a",
    bf: vx
  }, {
    n: "\u53F0\u6E7E",
    l: "\u53F0\u5317 101",
    c: "#4c9e8f",
    bf: Mx
  }]
