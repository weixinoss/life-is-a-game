/* ============================================================
 *  10-gfx-utils.js
 *  材质缓存与基础图元构造器（盒/柱/锥/球/斜顶/楼/树）
 * 声明：zh 材质缓存, Zt() 取材质, kh/ Bs() 几何缓存, Jt() 建组, G() 盒, dt() 柱, Qt() 锥, Vt() 球, On() 斜顶, Ns() 楼, wi()/hs() 树
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var L = window.LIFE.THREE;
var la = window.LIFE.RoundedBoxGeometry;   /* 圆角盒子几何体，原项目自带，随 three 一同打包 */

var  zh = new Map;

function Zt(n, t) {
  let e = n + (t ? "|2" : ""),
    i = zh.get(e);
  return i || (i = new L.MeshStandardMaterial({
    color: new L.Color(n),
    roughness: .88,
    metalness: 0,
    side: t ? L.DoubleSide : L.FrontSide
  }), zh.set(e, i)), i
}
var kh = new Map;

function Bs(n, t, e, i = .05) {
  let s = n.toFixed(3) + "," + t.toFixed(3) + "," + e.toFixed(3) + "," + i.toFixed(3),
    r = kh.get(s);
  if (!r) {
    let o = Math.max(.008, Math.min(i, Math.min(n, t, e) * .44));
    r = new la(n, t, e, 2, o), kh.set(s, r)
  }
  return r
}
var Jt = () => new L.Group;

function G(n, t, e, i, s, r = 0, o = 0, a = 0, c = 0, l = .05) {
  let h = new L.Mesh(Bs(t, e, i, l), Zt(s));
  return h.position.set(r, o + e / 2, a), h.rotation.y = c, h.castShadow = !0, h.receiveShadow = !0, n.add(h), h
}

function dt(n, t, e, i, s, r = 0, o = 0, a = 0, c = 16, l = 0) {
  let h = new L.Mesh(new L.CylinderGeometry(t, e, i, c), Zt(s));
  return h.position.set(r, o + i / 2, a), h.rotation.y = l, h.castShadow = !0, h.receiveShadow = !0, n.add(h), h
}

function Qt(n, t, e, i, s = 0, r = 0, o = 0, a = 12, c = 0) {
  let l = new L.Mesh(new L.ConeGeometry(t, e, a), Zt(i));
  return l.position.set(s, r + e / 2, o), l.rotation.y = c, l.castShadow = !0, l.receiveShadow = !0, n.add(l), l
}

function Vt(n, t, e, i = 0, s = 0, r = 0, o = 1, a = 1, c = 1) {
  let l = new L.Mesh(new L.SphereGeometry(t, 18, 12), Zt(e));
  return l.position.set(i, s, r), l.scale.set(o, a, c), l.castShadow = !0, l.receiveShadow = !0, n.add(l), l
}

function On(n, t, e, i, s, r = Math.PI / 4) {
  let o = new L.Mesh(new L.ConeGeometry(t * .712, e, 4), Zt(i));
  return o.position.set(0, s + e / 2, 0), o.rotation.y = r, o.castShadow = !0, o.receiveShadow = !0, n.add(o), o
}

function Ns(n, t) {
  let {
    y: e = 0,
    w: i = 1.2,
    floors: s = 5,
    seg: r = 8,
    wall: o = "#c9a06b",
    roof: a = "#6d4c33",
    shrink: c = .88,
    fh: l = .28,
    base: h = .1
  } = t || {}, f = e, d = i, m = Math.PI / r;
  for (let g = 0; g < s; g++) dt(n, d * .42, d * .46, l, o, 0, f, 0, r, m), dt(n, d * .64, d * .66, h * .7, a, 0, f + l, 0, r, m), Qt(n, d * .74, h * 1.6, a, 0, f + l + h * .6, 0, r, m), f += l + h * 1.5, d *= c;
  return f
}

function wi(n, t, e, i = .5, s = "#2f7d4f") {
  dt(n, .026, .04, i * .4, "#7a5230", t, 0, e, 6), Qt(n, i * .34, i * .5, s, t, i * .3, e, 7), Qt(n, i * .27, i * .42, s, t, i * .58, e, 7), Qt(n, i * .19, i * .34, s, t, i * .82, e, 7)
}

function hs(n, t, e, i = .5, s = "#4caf50") {
  dt(n, .03, .045, i * .45, "#8d6e4f", t, 0, e, 6), Vt(n, i * .3, s, t, i * .6, e, 1, .95, 1)
}
