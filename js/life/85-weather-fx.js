/* ============================================================
 *  85-weather-fx.js
 *  天气粒子特效、抽签与应用天气
 * 声明：ks 特效画布, os 粒子池, Bx() 切天气, zx()/kx() 绘制, Lc() 按季抽天气, ba() 应用天气
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var ks = document.getElementById("weatherFx"),
  du = ks.getContext("2d"),
  os = [],
  bc = "sunny";

function pu() {
  ks.width = window.innerWidth, ks.height = window.innerHeight
}
pu();

function Bx(n) {
  bc = n, os.length = 0, document.body.className = document.body.className.replace(/\bwx-\S+/g, "").trim(), document.body.classList.add("wx-" + n)
}

function zx(n, t) {
  let e = du;
  if (t && n.v > 55) {
    let s = e.createLinearGradient(n.x, n.y - n.r * 5, n.x, n.y);
    s.addColorStop(0, "rgba(212,234,250,0)"), s.addColorStop(1, "rgba(216,238,252,0.26)"), e.strokeStyle = s, e.lineWidth = n.r * .5, e.lineCap = "round", e.beginPath(), e.moveTo(n.x, n.y - n.r * 5), e.lineTo(n.x, n.y), e.stroke()
  }
  let i = e.createRadialGradient(n.x - n.r * .35, n.y - n.r * .4, n.r * .12, n.x, n.y, n.r * 1.25);
  i.addColorStop(0, "rgba(255,255,255,0.82)"), i.addColorStop(.55, "rgba(204,229,248,0.38)"), i.addColorStop(1, "rgba(172,200,226,0.1)"), e.fillStyle = i, e.beginPath(), e.ellipse(n.x, n.y, n.r, n.r * 1.25, 0, 0, Math.PI * 2), e.fill(), e.fillStyle = "rgba(255,255,255,0.5)", e.beginPath(), e.arc(n.x - n.r * .32, n.y - n.r * .42, n.r * .18, 0, Math.PI * 2), e.fill()
}

function kx(n) {
  if (Ei) return;
  let t = ks.width,
    e = ks.height;
  du.clearRect(0, 0, t, e);
  let i = bc === "storm";
  if (bc !== "rain" && !i) return;
  let s = i ? 52 : 26;
  os.length < s && Math.random() < .8 && os.push({
    x: Math.random() * t,
    y: Math.random() < .55 ? -20 - Math.random() * 70 : Math.random() * e,
    r: (i ? 3.6 : 2.9) + Math.random() * (i ? 4.6 : 3.4),
    v: 24 + Math.random() * (i ? 95 : 26),
    life: 8 + Math.random() * 8,
    wob: Math.random() * 6.28
  });
  for (let r = os.length - 1; r >= 0; r--) {
    let o = os[r];
    if (o.y += o.v * n, o.life -= n, o.x += Math.sin(Nn * 1.3 + o.wob) * 8 * n, o.y > e + 40 || o.life <= 0) {
      os.splice(r, 1);
      continue
    }
    zx(o, i)
  }
}

function Lc() {
  let n = fn[C.season].weights,
    t = 0;
  for (let i in n) t += n[i];
  let e = Math.random() * t;
  for (let i in n)
    if (e -= n[i], e <= 0) return i;
  return "sunny"
}

function ba() {
  let n = C.weather;
  Bx(n);
  let t = n === "rain" || n === "storm",
    e = n === "snow";
  bi.visible = t, cu.opacity = n === "storm" ? .75 : .5, Si.visible = e;
  let s = {
    sunny: 62,
    cloudy: 54,
    rain: 40,
    storm: 28,
    hot: 66,
    snow: 26,
    cold: 38,
    fog: 15
  } [n] || 55;
  ce.fog.near = Math.max(3, s * .16), ce.fog.far = s;
  let r = au(n);
  zs.forEach(o => {
    o.material.map = r, o.material.needsUpdate = !0
  }), zs.forEach((o, a) => {
    o.visible = a % 3 === 0
  }), fu.textContent = pa[n][Math.floor(Math.random() * pa[n].length)], document.body.classList.toggle("weather-night", Ze.isNight)
}
