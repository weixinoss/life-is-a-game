/* ============================================================
 *  88-minimap.js
 *  小地图绘制与显隐
 * 声明：yu/wc 小地图, Fs 尺寸, Mu() 自适应, bu() 绘制, Ic() 显隐
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var yu = ct("minimap"),
  wc = ct("mmCanvas"),
  vu = wc.getContext("2d"),
  vi = !1,
  Fs = 176;

function Mu() {
  Fs = window.innerWidth < 760 ? 142 : 176;
  let t = Math.min(window.devicePixelRatio || 1, 2);
  wc.width = Fs * t, wc.height = Fs * t, vu.setTransform(t, 0, 0, t, 0, 0)
}
Mu();
window.addEventListener("resize", Mu);
var Vs = 17;
for (let n = 0; n < nn; n++) {
  let t = dn(n);
  Vs = Math.max(Vs, Math.abs(t.x), Math.abs(t.z))
}
Vs += 1.2;

function bu() {
  if (!vi || !C.started) return;
  let n = Fs,
    t = Fs,
    e = vu;
  e.clearRect(0, 0, n, t);
  let i = (n / 2 - 7) / Vs,
    s = typeof $t < "u" ? $t.yaw : 0;
  e.save(), e.translate(n / 2, t / 2), e.rotate(s);
  let r = Math.max(3, Math.round(3.1 * i / 1));
  for (let f = 0; f < nn; f++) {
    let d = dn(f),
      m = d.x * i,
      g = d.z * i,
      x = f === C.pos,
      p = Bn[f] ? Bn[f].passed : !1,
      u = f % 2 === 1;
    x || (e.fillStyle = p ? "rgba(30,60,90,.20)" : u ? "rgba(239,159,39,.9)" : "rgba(22,50,74,.46)", e.fillRect(m - r / 2, g - r / 2, r, r))
  }
  if (typeof cs < "u" && !Ei)
    for (let f = 0; f < cs.length; f++) {
      let d = f / cs.length * Math.PI * 2,
        m = Vs * i,
        g = Math.cos(d) * m,
        x = Math.sin(d) * m;
      e.beginPath(), e.arc(g, x, 1.9, 0, Math.PI * 2), e.fillStyle = cs[f].c, e.globalAlpha = .85, e.fill(), e.globalAlpha = 1
    }
  e.restore();
  let o = fn[C.season];
  e.font = '900 34px "PingFang SC","Microsoft YaHei",system-ui,sans-serif', e.textAlign = "center", e.textBaseline = "middle", e.fillStyle = "rgba(22,50,74,.10)", e.fillText(o.n, n / 2, t / 2);
  let a = dn(0);
  e.save(), e.translate(n / 2, t / 2), e.rotate(s), e.beginPath(), e.arc(a.x * i, a.z * i, 3.4, 0, Math.PI * 2), e.fillStyle = "rgba(109,166,108,.9)", e.fill(), e.restore();
  let c = Date.now() % 1500 / 1500,
    l = 1 + Math.sin(c * Math.PI * 2) * .22;
  e.beginPath(), e.arc(n / 2, t / 2, 8.5 * l, 0, Math.PI * 2), e.fillStyle = "rgba(234,88,12,.22)", e.fill(), e.beginPath(), e.arc(n / 2, t / 2, 4.6, 0, Math.PI * 2), e.fillStyle = "#f97316", e.fill(), e.lineWidth = 2, e.strokeStyle = "rgba(255,255,255,.95)", e.stroke(), e.beginPath(), e.moveTo(n / 2, t / 2 - 11), e.lineTo(n / 2 - 4.6, t / 2 - 4.6), e.lineTo(n / 2 + 4.6, t / 2 - 4.6), e.closePath(), e.fillStyle = "#9a3412", e.fill();
  let h = fn[C.season];
  ct("mmSeason").textContent = h.n, ct("mmSeason").style.background = h.c, ct("mmDay").textContent = "\u7B2C " + C.day + " \u5929", ct("mmLeft").textContent = "\u5269 " + Math.max(0, nn - C.day) + " \u5929"
}

function Ic(n) {
  vi = n === void 0 ? !vi : n, yu.classList.toggle("show", vi), ct("mapBtn").classList.toggle("on", vi), vi && bu()
}
ct("mapBtn").addEventListener("click", () => Ic());
yu.addEventListener("click", () => Ic(!1));
window.addEventListener("keydown", n => {
  !C.started || C.over || (n.key === "m" || n.key === "M") && (n.preventDefault(), Ic())
});
