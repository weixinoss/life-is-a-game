/* ============================================================
 *  81-pawn.js
 *  棋子模型、相机跟随与拖拽转视
 * 声明：xe 棋子, $t 相机状态, Rx() 角度插值, Px() 相机跟随
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var xe = new L.Group;
(function() {
  let t = new L.MeshStandardMaterial({
      color: new L.Color("#ff6b35"),
      roughness: .55
    }),
    e = new L.MeshStandardMaterial({
      color: new L.Color("#2b3a4a"),
      roughness: .6
    }),
    i = new L.Mesh(new L.ConeGeometry(.3, .55, 18), t);
  i.position.y = .3, i.castShadow = !0, xe.add(i);
  let s = new L.Mesh(new L.SphereGeometry(.23, 18, 14), new L.MeshStandardMaterial({
    color: new L.Color("#ffd9c2"),
    roughness: .6
  }));
  s.position.y = .74, s.castShadow = !0, xe.add(s);
  let r = new L.Mesh(new L.SphereGeometry(.235, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), t);
  r.position.y = .77, r.castShadow = !0, xe.add(r);
  let o = new L.Mesh(new L.CylinderGeometry(.31, .31, .035, 18), t);
  o.position.y = .79, xe.add(o);
  for (let c of [-1, 1]) {
    let l = new L.Mesh(new L.SphereGeometry(.035, 8, 8), e);
    l.position.set(c * .08, .75, .2), xe.add(l)
  }
  let a = new L.Mesh(new L.CircleGeometry(.28, 18), new L.MeshBasicMaterial({
    color: 2832970,
    transparent: !0,
    opacity: .16,
    depthWrite: !1
  }));
  a.rotation.x = -Math.PI / 2, a.position.y = .02, a.name = "shadow", xe.add(a)
})();
xe.scale.setScalar(1);
xe.visible = !1;
ce.add(xe);
var sc = xe.getObjectByName("shadow"),
  Cx = 1.05,
  $t = {
    yaw: 0,
    pitch: -.1,
    lookYaw: 0,
    lookPitch: 0,
    bob: 0,
    ready: !1,
    phone: 0,
    phoneTarget: 0
  },
  Ma = !1,
  gc = 0,
  xc = 0;

function Rx(n, t, e) {
  let i = ((t - n + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return n + i * e
}
We.domElement.addEventListener("pointerdown", n => {
  Ma = !0, gc = n.clientX, xc = n.clientY, We.domElement.style.cursor = "grabbing"
});
window.addEventListener("pointermove", n => {
  Ma && ($t.lookYaw -= (n.clientX - gc) * .0042, $t.lookPitch -= (n.clientY - xc) * .0032, $t.lookYaw = Math.max(-1.25, Math.min(1.25, $t.lookYaw)), $t.lookPitch = Math.max(-.55, Math.min(.72, $t.lookPitch)), gc = n.clientX, xc = n.clientY)
});
window.addEventListener("pointerup", () => {
  Ma = !1, We.domElement.style.cursor = "grab"
});
We.domElement.style.cursor = "grab";

function Px(n) {
  let t = Yt.active ? Yt.from : C.pos,
    e = Yt.active ? Yt.to : C.pos,
    i = Yt.active ? Math.min(1, Yt.t) : 0,
    s = dn(t),
    r = dn(e),
    o = s.x + (r.x - s.x) * i,
    a = s.z + (r.z - s.z) * i,
    c = r.x - s.x,
    l = r.z - s.z;
  if (Math.abs(c) + Math.abs(l) < .001) {
    let m = dn((t + 1) % nn);
    c = m.x - s.x, l = m.z - s.z
  }
  let h = Math.atan2(-c, -l);
  $t.ready || ($t.yaw = h, $t.ready = !0), $t.yaw = Rx($t.yaw, h, 1 - Math.pow(4e-4, n)), Yt.active && !Ma && ($t.lookYaw *= Math.pow(.08, n), $t.lookPitch *= Math.pow(.25, n)), $t.bob += n * (Yt.active ? 8.5 : 1.6);
  let f = Yt.active ? Math.sin($t.bob) * .042 : Math.sin($t.bob) * .01,
    d = Yt.active ? Math.cos($t.bob * .5) * .02 : 0;
  Ve.position.set(o + d, Cx + f, a), Ve.rotation.order = "YXZ", Ve.rotation.y = $t.yaw + $t.lookYaw, $t.phone += ($t.phoneTarget - $t.phone) * (1 - Math.pow(.002, n)), Ve.rotation.x = $t.pitch + $t.lookPitch + $t.phone, Ve.rotation.z = Yt.active ? Math.sin($t.bob * .5) * .012 : 0
}
