/* ============================================================
 *  82-state-hud.js
 *  游戏状态对象 C、DOM 引用缓存、数值格式化与 HUD 刷新
 * 声明：C 游戏状态, ct() 取 DOM, vc/ei/Kh 数字格式化, Ox() 飘字, en() 刷新 HUD, Mi() 数值动画, Mc() 流水账, zn() toast
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var C = {
    started: !1,
    job: null,
    season: 0,
    day: 1,
    money: 0,
    stamina: 100,
    staminaMax: 100,
    spirit: 100,
    spiritMax: 100,
    face: 60,
    rating: 70,
    pos: 0,
    weather: "sunny",
    weatherTmr: 0,
    dignity: 0,
    good: 0,
    evil: 0,
    chain: [],
    deeds: [],
    seen: [],
    deck: [],
    alterLeft: 0,
    saved: !1,
    omen: null,
    omenAt: 0,
    mem: 0,
    realm6: "",
    seed: 0,
    daily: !1,
    debt: null,
    karma: 0,
    busy: !1,
    pending: !1,
    chosen: !1,
    over: !1,
    usedEv: []
  },
  ct = n => document.getElementById(n),
  _c = ct("vMoney"),
  lu = ct("vStamina"),
  hu = ct("vSpirit"),
  uu = ct("vFace"),
  Wh = ct("bStamina"),
  Xh = ct("bSpirit"),
  qh = ct("bFace"),
  Lx = ct("dayNum"),
  Yh = ct("seasonTag"),
  rc = ct("weatherTag"),
  fu = ct("weatherTip"),
  Gs = ct("panel"),
  Ix = ct("pTitle"),
  Dx = ct("pDesc"),
  Ux = ct("pSite"),
  Zh = ct("pJob"),
  Jh = ct("pOpts"),
  ga = ct("pFeed"),
  Nx = ct("pBar"),
  Fx = ct("over"),
  $h = ct("pick"),
  M_ = ct("seasonCard"),
  ni = ct("rollBtn"),
  yc = ct("moonBtn"),
  ac = ct("toast");

function vc(n, t) {
  let e = n.toFixed(t);
  return e.indexOf(".") >= 0 && (e = e.replace(/0+$/, "").replace(/\.$/, "")), e
}

function ei(n) {
  let t = n < 0,
    e = Math.abs(Math.round(n)),
    i;
  return e >= 1e8 ? i = vc(e / 1e8, 2) + "\u4EBF" : e >= 1e4 ? i = vc(e / 1e4, e >= 1e6 ? 0 : 1) + "\u4E07" : i = e.toLocaleString("en-US"), (t ? "-\xA5" : "\xA5") + i
}

function Kh(n) {
  let t = Math.abs(Math.round(n));
  return t >= 1e8 ? vc(t / 1e8, 1) + "\u4EBF" : t >= 1e4 ? Math.round(t / 1e4) + "\u4E07" : t.toLocaleString("en-US")
}

function Ox(n) {
  let t = {
    money: _c,
    stamina: lu,
    spirit: hu,
    face: uu
  } [n];
  t && (t.classList.remove("bump"), t.offsetWidth, t.classList.add("bump"))
}

function en(n) {
  _c.textContent = ei(C.money), _c.classList.toggle("neg", C.money < 0), lu.textContent = Math.max(0, Math.round(C.stamina)), hu.textContent = Math.max(0, Math.round(C.spirit)), uu.textContent = Math.max(0, Math.round(C.face)), Lx.textContent = C.day;
  let t = us(),
    e = Math.floor((C.money + 3e3 * t) / (60 * t)),
    i = ct("moneyDays");
  i && (i.textContent = "\u8FD8\u80FD\u6491 " + Math.max(0, e) + " \u5929", i.className = "left" + (e < 8 ? " warn" : ""));
  let s = fn[C.season];
  Yh.textContent = s.n, Yh.style.background = s.c;
  ct("pClock").textContent = fn[C.season].n + " \xB7 " + String(C.day || 1).padStart(2, "0"), ct("pBat").textContent = "\u25AE \u4F53\u529B " + Math.round(Math.max(0, C.stamina) / Math.max(1, C.staminaMax) * 100) + "%";
  let r = Ti[C.weather];
  rc.textContent = r.n, rc.style.color = r.col, rc.style.background = r.col + "1a", Wh.style.width = Math.max(0, Math.min(100, C.stamina / C.staminaMax * 100)) + "%", Xh.style.width = Math.max(0, Math.min(100, C.spirit / C.spiritMax * 100)) + "%", qh.style.width = Math.max(0, Math.min(100, C.face)) + "%", Wh.className = "fill sta" + (C.stamina < 30 ? " low" : ""), Xh.className = "fill spirit" + (C.spirit < 30 ? " low" : ""), qh.className = "fill face" + (C.face < 25 ? " low" : ""), document.body.classList.toggle("low-stamina", C.stamina < 25), document.body.classList.toggle("low-spirit", C.spirit < 25), uiDeg(), n && n.forEach(Ox)
}

/* 界面会累：三档退化。用比例判断，避免卡组改上限后阈值失准 */
function uiDeg() {
  var b = document.body,
    a = Math.max(0, C.stamina) / Math.max(1, C.staminaMax),
    p = Math.max(0, C.spirit) / Math.max(1, C.spiritMax),
    blank = a < .15 && p < .15,
    frayed = a < .2 || p < .3,
    tired = a < .35 || p < .45;
  b.classList.toggle("ui-blank", blank);
  b.classList.toggle("ui-frayed", !blank && frayed);
  b.classList.toggle("ui-tired", !blank && !frayed && tired);
}

function Mi(n, t, e) {
  let i = document.querySelector('.stat[data-k="' + n + '"]');
  if (!i) return;
  let s = document.createElement("span");
  s.className = "float " + (e ? "good" : "bad"), s.textContent = t, i.appendChild(s), setTimeout(() => s.remove(), 1200)
}

function Mc(n, t, e, i, s) {
  /* 界面都撑不住了：连流水都记不清 */
  if (document.body.classList.contains("ui-blank")) return;
  let r = ct("ticket");
  ct("tkSub").textContent = "\u7B2C " + n + " - " + t + " \u5929", ct("tkIn").textContent = ei(e), ct("tkOut").textContent = ei(-i);
  let o = e - i,
    a = ct("tkNet");
  a.textContent = (o >= 0 ? "+" : "-") + ei(Math.abs(o)).slice(1), a.style.color = o >= 0 ? "#1a7a44" : "#b4451f", ct("tkTotal").textContent = ei(s), r.classList.add("show"), clearTimeout(Mc._t), Mc._t = setTimeout(() => r.classList.remove("show"), 3400)
}

function zn(n, t) {
  ac.textContent = n, ac.className = "show " + (t || ""), clearTimeout(zn._t), zn._t = setTimeout(() => {
    ac.className = ""
  }, 2600)
}
