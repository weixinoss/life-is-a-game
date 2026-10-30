/* ============================================================
 *  91-jobpick.js
 *  开局身份选择轮盘（3D 卡片 + 拖拽 / 滚轮 / 键盘）
 * 声明：Fn/Qs/Hs 选择层, Me 当前索引, Ai 身份卡, t_() 身价条, cc()/e_() 卡片模板, lc() 建模, Tu() 布局, ii() 切换, Dc() 确认身份
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var Fn = ct("pick"),
  Qx = ct("jobList"),
  Hs = ct("pickStage"),
  oc = {
    stamina: 120,
    spirit: 100,
    face: 100
  };

function t_(n) {
  let t = (Math.log10(Math.max(1, n)) - 3) / 5 * 100;
  return Math.max(5, Math.min(100, Math.round(t)))
}
var Me = 0;

function cc(n, t, e, i) {
  let s = Math.round(Math.min(100, t / e * 100));
  return '<div class="st-row"><span>' + n + '</span><div class="st-bar"><i data-w="' + s + '"></i></div><b>' + i + "</b></div>"
}

function e_(n) {
  return '<div class="jc-front"><div class="jc-chroma"></div><div class="jc-shine"></div><div class="jc-sheen"></div><div class="jc-in"><div class="jc-top"><span class="ji">' + n.ic + '</span><span class="jc-money">\u8D77\u624B ' + Kh(n.money) + '</span></div><div class="jc-name">' + n.n + '</div><div class="jc-tag">' + n.tag + '</div><div class="jc-desc">' + n.desc + '</div><div class="jc-stats"><div class="st-row"><span>\u5B58\u6B3E</span><div class="st-bar"><i data-w="' + t_(n.money) + '"></i></div><b>' + Kh(n.money) + "</b></div>" + cc("\u4F53\u529B", n.stamina, oc.stamina, n.stamina) + cc("\u7CBE\u795E", n.spirit, oc.spirit, n.spirit) + cc("\u4F53\u9762", n.face, oc.face, n.face) + '</div><div class="jc-perk">' + n.perk + "</div></div></div>"
}

function lc(n) {
  let t = Ai[n];
  if (t._built) return t;
  t._built = !0;
  let e = vn[n];
  return t.style.setProperty("--g1", e.g[0]), t.style.setProperty("--g2", e.g[1]), t.style.setProperty("--g3", e.g[2]), t.style.setProperty("--glow", e.glow), t.innerHTML = e_(e), t
}
var Ai = vn.map((n, t) => {
    let e = document.createElement("button");
    return e.className = "jobcard", e.addEventListener("click", () => {
      wa || (t === Me ? Dc(t) : ii(t))
    }), Qx.appendChild(e), e
  }),
  n_ = vn.map((n, t) => {
    let e = document.createElement("i");
    return e.addEventListener("click", () => ii(t)), ct("pickDots").appendChild(e), e
  }),
  Sa = document.createElement("button");
Sa.className = "pick-go";
Sa.addEventListener("click", () => Dc(Me));
Fn.querySelector(".pick-in").appendChild(Sa);
var i_ = typeof Ei < "u" && Ei ? 0 : window.innerWidth < 760 ? 1 : 2;

function Tu() {
  Ai.forEach((t, e) => {
    let i = e - Me,
      s = Math.abs(i),
      r = i === 0 || i > 0 ? 1 : -1,
      o, a, c, l, h;
    if (s === 0 ? (o = 0, a = 90, c = 0, l = 1, h = 1) : s === 1 ? (o = 238, a = -172, c = 46, l = .86, h = .92) : (o = 396, a = -332, c = 54, l = .72, h = .58), s > i_) {
      t.style.display !== "none" && (t.style.display = "none"), t.style.opacity = 0, t.style.pointerEvents = "none", t.classList.remove("cur");
      return
    }
    lc(e);
    let f = "translate3d(" + o * r + "px,0," + a + "px) rotateY(" + -c * r + "deg) scale(" + l + ")";
    t.style.display === "none" ? (t.style.display = "", t.style.opacity = 0, requestAnimationFrame(() => {
      t.style.transform = f, t.style.opacity = h
    })) : (t.style.transform = f, t.style.opacity = h), t.style.pointerEvents = "auto", t.style.zIndex = 10 - s, t.classList.toggle("cur", i === 0), i !== 0 && (t.querySelector(".jc-front").style.transform = "")
  });
  let n = vn[Me];
  Fn.style.setProperty("--b1", n.g[0]), Fn.style.setProperty("--b2", n.g[1]), Fn.style.setProperty("--b3", n.g[2]), Fn.style.setProperty("--glow", n.glow), lc((Me + 1) % vn.length), lc((Me - 1 + vn.length) % vn.length), n_.forEach((t, e) => t.classList.toggle("on", e === Me)), Sa.innerHTML = "\u4EE5\u300C" + n.n + "\u300D\u7684\u8EAB\u4EFD\u51FA\u53D1<small>\u56DE\u8F66\u786E\u8BA4 \xB7 \u5DE6\u53F3\u65B9\u5411\u952E\u5207\u6362</small>", Ai[Me].querySelectorAll(".st-bar i").forEach(t => {
    t.style.width = t.dataset.w + "%"
  })
}

function ii(n) {
  Me = (n + vn.length) % vn.length, Tu()
}
ct("pickPrev").addEventListener("click", () => ii(Me - 1));
ct("pickNext").addEventListener("click", () => ii(Me + 1));
Hs.addEventListener("pointermove", n => {
  let t = Hs.getBoundingClientRect(),
    e = (n.clientX - t.left) / t.width - .5,
    i = (n.clientY - t.top) / t.height - .5,
    s = Ai[Me].querySelector(".jc-front");
  s.style.transform = "rotateY(" + (e * 13).toFixed(2) + "deg) rotateX(" + (-i * 10).toFixed(2) + "deg)", Ai[Me].style.setProperty("--sheen", (e * 95).toFixed(1) + "%")
});
Hs.addEventListener("pointerleave", () => {
  Ai[Me].querySelector(".jc-front").style.transform = ""
});
var Os = null,
  wa = !1;
Hs.addEventListener("pointerdown", n => {
  Os = n.clientX, wa = !1
});
window.addEventListener("pointermove", n => {
  if (Os === null) return;
  let t = n.clientX - Os;
  Math.abs(t) > 58 && (ii(Me + (t > 0 ? -1 : 1)), Os = n.clientX, wa = !0)
});
window.addEventListener("pointerup", () => {
  Os = null, setTimeout(() => {
    wa = !1
  }, 60)
});
var Qh = 0;
Hs.addEventListener("wheel", n => {
  n.preventDefault();
  let t = Date.now();
  t - Qh < 320 || (Qh = t, ii(Me + (n.deltaY > 0 ? 1 : -1)))
}, {
  passive: !1
});
window.addEventListener("keydown", n => {
  Fn.classList.contains("hide") || !Fn.isConnected || (n.key === "ArrowLeft" ? (n.preventDefault(), ii(Me - 1)) : n.key === "ArrowRight" ? (n.preventDefault(), ii(Me + 1)) : (n.key === "Enter" || n.code === "Space") && (n.preventDefault(), Dc(Me)))
});
ct("pkSwitch").addEventListener("click", n => {
  let t = n.target.closest("button");
  t && (Array.prototype.forEach.call(ct("pkSwitch").children, e => {
    e.classList.toggle("on", e === t)
  }), Fn.classList.remove("sk-flow", "sk-glass", "sk-neon"), Fn.classList.add(t.dataset.sk))
});

function Dc(n) {
  let t = vn[n];
  C.job = t, C.money = t.money, C.stamina = t.stamina, C.staminaMax = t.stamina, C.spirit = t.spirit, C.spiritMax = t.spirit, C.face = t.face, C.rating = t.rating, C.started = !0, C.season = 0, C.day = 1, C.pos = 0, C.weather = Lc(), C.runStart = 1, wu(), ba(), en(), _u(), xe.position.copy(ls(0)), $h.classList.add("hide"), setTimeout(() => {
    $h.style.display = "none"
  }, 520), ni.removeAttribute("disabled"), fu.textContent = (pa[C.weather] || [""])[0], zn("\u4F60\u662F\u300C" + t.n + "\u300D\u3002\u6625\u5929\u521A\u5F00\u59CB\uFF0C\u5148\u6491\u8FC7\u8FD9 90 \u5929\u3002", "moon")
}
Ai.forEach(n => {
  n.style.opacity = 0
});

function Au() {
  Tu()
}
requestAnimationFrame(() => {
  requestAnimationFrame(Au)
});
setTimeout(Au, 150);
