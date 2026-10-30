/* ============================================================
 *  92-loop.js
 *  主渲染循环、棋子移动插值、窗口自适应
 * 声明：s_ 时钟, r_() 棋子移动, a_() 粒子更新, Cu() 主循环, o_() 竖屏判定, Ru() 相机自适应, c_() 尺寸自适应
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var s_ = new L.Clock,
  Nn = 0,
  hc = 0,
  b_ = new L.Vector3;

function r_(n) {
  if (!Yt.active) return;
  Yt.t += n / Yt.dur;
  let t = Math.min(1, Yt.t),
    e = ls(Yt.from),
    i = ls(Yt.to);
  xe.position.lerpVectors(e, i, t), xe.position.y = .3 + Math.sin(t * Math.PI) * .5;
  let s = new L.Vector3().subVectors(i, e);
  if (s.lengthSq() > .001 && (xe.rotation.y = Math.atan2(s.x, s.z)), Yt.t >= 1) {
    if (Xx(), en(), ds()) {
      Yt.active = !1;
      return
    }
    Yt.left--, Yt.left > 0 ? (Yt.from = Yt.to, Yt.to = (Yt.to + 1) % nn, Yt.t = 0) : (Yt.active = !1, xe.position.copy(ls(Yt.to)), xe.rotation.y = 0, Yt.onEnd && Yt.onEnd())
  }
  if (sc) {
    let r = xe.position.y - .3;
    sc.scale.setScalar(1 + r * .6), sc.material.opacity = .16 / (1 + r * 2.2)
  }
}

function a_(n) {
  if (bi.visible) {
    for (let t = 0; t < pc.length; t++) {
      let e = pc[t];
      e.y -= e.v * n, e.y < 0 && (e.y = 24 + Math.random() * 6, e.x = (Math.random() - .5) * 54, e.z = (Math.random() - .5) * 54), ti.position.set(e.x, e.y, e.z), ti.rotation.set(0, 0, .08), ti.updateMatrix(), bi.setMatrixAt(t, ti.matrix)
    }
    bi.instanceMatrix.needsUpdate = !0
  }
  if (Si.visible) {
    for (let t = 0; t < mc.length; t++) {
      let e = mc[t];
      e.y -= e.v * n, e.y < 0 && (e.y = 22 + Math.random() * 5, e.x = (Math.random() - .5) * 54, e.z = (Math.random() - .5) * 54), ti.position.set(e.x + Math.sin(Nn * .8 + e.ph) * .6, e.y, e.z + Math.cos(Nn * .6 + e.ph) * .6), ti.rotation.set(0, 0, 0), ti.updateMatrix(), Si.setMatrixAt(t, ti.matrix)
    }
    Si.instanceMatrix.needsUpdate = !0
  }
}

function Cu() {
  requestAnimationFrame(Cu);
  let n = Math.min(s_.getDelta(), .1);
  Nn += n, hc += n, hc > 15 && (hc = 0, Pc());
  for (let i of Bn) Math.abs(i.lift - i.target) > .001 && (i.lift += (i.target - i.lift) * (1 - Math.pow(8e-4, n)), i.group.position.y = i.lift);
  if (pn.visible) {
    let i = 1 + Math.sin(Nn * 3.2) * .05;
    pn.scale.set(i, i, 1), pn.material.opacity = .7 + Math.sin(Nn * 3.2) * .2
  }
  for (let i = 0; i < fc.length; i++) {
    let s = fc[i];
    s.obj.position.y = Math.sin(Nn * .9 + i) * .06
  }
  for (let i = 0; i < zs.length; i++) {
    let s = zs[i];
    s.visible && (s.position.y = 6.3 + Math.sin(Nn * 1.4 + i) * .16)
  }
  let t = -Math.sin(Ve.rotation.y),
    e = -Math.cos(Ve.rotation.y);
  for (let i = 0; i < dc.length; i++) {
    let s = dc[i],
      r = s.position.x - Ve.position.x,
      o = s.position.z - Ve.position.z,
      a = Math.hypot(r, o) || 1,
      c = r / a * t + o / a * e,
      l = Math.max(0, Math.min(1, (c + .15) / .8));
    a > 16 && (l *= Math.max(0, 1 - (a - 16) / 16)), s.material.opacity = .08 + .92 * l, s.visible = l > .05
  }
  Yt.active || (xe.position.y = .3 + Math.sin(Nn * 2.4) * .035), r_(n), Px(n), vi && bu(), a_(n), kx(n), We.render(ce, Ve)
}

function o_() {
  return window.innerWidth / window.innerHeight < .98
}

function Ru() {
  Ve.aspect = window.innerWidth / window.innerHeight;
  let n = o_();
  Ve.fov = n ? 76 : 72, typeof $t < "u" && ($t.pitch = n ? -.17 : -.1), Ve.updateProjectionMatrix()
}
Ru();

function c_() {
  We.setSize(window.innerWidth, window.innerHeight), We.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)), Ru()
}
window.addEventListener("resize", () => {
  c_(), pu()
});
