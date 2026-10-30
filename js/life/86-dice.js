/* ============================================================
 *  86-dice.js
 *  骰子与棋子移动状态机
 * 声明：Yt 移动状态, ls() 格坐标, Vx 骰面点位, gu() 显示点数, Hx() 高亮, Gx() 掷骰, xu() 掷骰入口
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var Yt = {
  active: !1,
  from: 0,
  to: 0,
  t: 0,
  left: 0,
  dur: .2,
  onEnd: null
};

function ls(n) {
  let {
    x: t,
    z: e
  } = dn(n);
  return new L.Vector3(t, .3, e)
}
xe.position.copy(ls(0));
var Vx = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  },
  fa = ct("diceBox"),
  mu = [];
for (let n = 0; n < 9; n++) {
  let t = document.createElement("div");
  t.className = "pip", fa.appendChild(t), mu.push(t)
}

function gu(n) {
  mu.forEach((t, e) => t.classList.toggle("on", Vx[n].includes(e)))
}
gu(5);

function Hx(n) {
  Bn.forEach(i => {
    i.target = 0
  }), Bn[n] && (Bn[n].target = .3);
  let {
    x: t,
    z: e
  } = dn(n);
  pn.position.set(t, .32, e), pn.visible = !0
}

function Gx() {
  let n = 1 + Math.floor(Math.random() * 6),
    t = Ti[C.weather];
  return n += t.dice, Ze.isNight && (n -= 1), C.job && C.job.id === "rider" && (C.weather === "rain" || C.weather === "storm") && (n += 1), Math.max(1, Math.min(6, n))
}

function xu() {
  if (!C.started || C.busy || C.pending || C.over) return;
  C.busy = !0, Gs.classList.remove("show"), pn.visible = !1;
  let n = Ti[C.weather],
    t = n.dice + (Ze.isNight ? -1 : 0) + (C.job && C.job.id === "rider" && (C.weather === "rain" || C.weather === "storm") ? 1 : 0);
  t !== 0 && zn((Ze.isNight && !n.dice ? "\u5929\u9ED1\u4E86\u770B\u4E0D\u6E05\u8DEF" : n.n + "\u5929") + "\uFF0C\u9AB0\u5B50 " + (t > 0 ? "+" : "") + t, "moon");
  let e = Gx();
  gu(e), fa.classList.remove("roll"), fa.offsetWidth, fa.classList.add("roll"), C.runStart = C.day, Yt.active = !0, Yt.left = e, Yt.from = C.pos, Yt.to = (C.pos + 1) % nn, Yt.t = 0, Yt.onEnd = qx, ni.setAttribute("disabled", "true")
}
