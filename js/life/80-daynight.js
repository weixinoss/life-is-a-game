/* ============================================================
 *  80-daynight.js
 *  昼夜状态与太阳/月亮光照方向
 * 声明：Ze 昼夜状态, Pc() 依真实时间更新光照
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var Ze = {
  hour: 12,
  sunDir: new L.Vector3(0, 1, 0),
  moonDir: new L.Vector3(0, -1, 0),
  isNight: !1
};

function Pc() {
  let n = new Date,
    t = n.getHours() + n.getMinutes() / 60;
  Ze.hour = t;
  let e = (t - 6) / 12 * Math.PI,
    i = t >= 6 && t < 18;
  Ze.sunDir.set(Math.cos(e) * .82, Math.sin(e) * .92 + .05, -.34).normalize();
  let r = (t >= 18 ? t - 18 : t + 6) / 12 * Math.PI;
  Ze.moonDir.set(Math.cos(r) * .82, Math.sin(r) * .92 + .05, .3).normalize(), Ze.isNight = !i, yn.sunDir.value.copy(Ze.sunDir), yn.moonDir.value.copy(Ze.moonDir), yn.sunIntensity.value = i ? 1 : 0, yn.moonIntensity.value = i ? 0 : 1, yn.nightMix.value = i ? 0 : 1;
  let o = new L.Color(fn[C.season].sky[0]),
    a = new L.Color(fn[C.season].sky[1]),
    c = new L.Color(fn[C.season].sky[2]),
    l = new L.Color("#1a3358"),
    h = new L.Color("#2b5178"),
    f = new L.Color("#4d7396"),
    d = Math.max(0, 1 - Math.min(Math.abs(t - 6), Math.abs(t - 18)) / 1.6),
    m = i ? 0 : Math.min(1, Math.max(0, (t < 6 ? 6 - t : t - 18) / .9));
  yn.topColor.value.copy(o).lerp(l, m), yn.midColor.value.copy(a).lerp(h, m), yn.botColor.value.copy(c).lerp(f, m).lerp(new L.Color("#ff9a5a"), d * .45);
  let g = i ? 1 : 0;
  Le.intensity = g ? 1.6 + Math.max(0, Math.sin(e)) * 1 : .95, Le.color.set(i ? d > .3 ? "#ffb677" : "#fff3da" : "#8fb4e8"), Le.position.copy(Ze.sunDir).multiplyScalar(60), i || Le.position.copy(Ze.moonDir).multiplyScalar(60), uc.intensity = i ? 1.15 : 1.02, uc.color.set(i ? "#dff2ff" : "#7f9cc8"), eu.intensity = i ? .22 : .42, Ac.intensity = i ? .5 : .34, ce.fog.color.copy(yn.botColor.value)
}
