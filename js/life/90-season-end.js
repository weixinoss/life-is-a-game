/* ============================================================
 *  90-season-end.js
 *  体检报告、季末结算、失败判定与结局
 * 声明：Kx() 体检报告, wu() 季节换色, Tc 结算锁, Eu() 季末结算, jx() 关闭报告, ds() 失败判定, jh 结局表, da() 结束游戏
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

function Kx() {
  let n = C.season,
    t = 27 + n,
    e = C.staminaMax - C.stamina,
    i = 100 - C.spirit,
    s = Math.round(116 + n * 8 + e * .22 + i * .14),
    r = Math.round(74 + n * 5 + i * .1),
    o = Math.round(70 + n * 5 + i * .18),
    a = Math.max(3.2, 7.4 - n * .95 - i * .022),
    c = (5 - n * .14).toFixed(1),
    l = (65 - n * 1.7).toFixed(1),
    h = ["\u751F\u7406\u66F2\u5EA6\u5B58\u5728", "\u751F\u7406\u66F2\u5EA6\u53D8\u76F4", "\u66F2\u5EA6\u53CD\u5F13", "\u660E\u663E\u9000\u53D8\u4F34\u589E\u751F"][Math.min(3, n)],
    f = [
      ["\u8840\u538B", s + "/" + r + " mmHg", "90-120 / 60-80", s > 126 || r > 84],
      ["\u9759\u606F\u5FC3\u7387", o + " \u6B21/\u5206", "60-100", o > 92],
      ["\u7761\u7720\u65F6\u957F", a.toFixed(1) + " \u5C0F\u65F6/\u5929", "7-8 \u5C0F\u65F6", a < 6.2],
      ["\u9888\u690E", h, "\u751F\u7406\u66F2\u5EA6\u5B58\u5728", n >= 1],
      ["\u5DE6\u773C\u89C6\u529B", c, "\u2265 5.0", Number(c) < 5],
      ["\u4F53\u91CD", l + " kg", "60-70 kg", Number(l) < 61],
      ["\u4F53\u8102\u7387", (17 + n * 1.2).toFixed(1) + " %", "15-20 %", !1]
    ],
    d = ct("rpBody");
  d.innerHTML = "", f.forEach(([u, y, _, E]) => {
    let R = document.createElement("tr");
    E && (R.className = "bad"), R.innerHTML = "<td>" + u + "</td><td>" + y + "</td><td>" + _ + "</td>", d.appendChild(R)
  });
  let m = ["\u5404\u9879\u6307\u6807\u57FA\u672C\u6B63\u5E38\u3002\u6CE8\u610F\u4F11\u606F\uFF0C\u5C11\u71AC\u591C\uFF0C\u591A\u559D\u6C34\u3002", "\u9888\u690E\u66F2\u5EA6\u5DF2\u51FA\u73B0\u6539\u53D8\uFF0C\u5EFA\u8BAE\u51CF\u5C11\u4F4E\u5934\u65F6\u95F4\uFF0C\u89C4\u5F8B\u4F5C\u606F\uFF0C\u4E24\u5468\u540E\u590D\u67E5\u3002", "\u591A\u9879\u6307\u6807\u504F\u79BB\u6B63\u5E38\u8303\u56F4\uFF0C\u5EFA\u8BAE\u5C3D\u5FEB\u5230\u4E13\u79D1\u95E8\u8BCA\u590D\u67E5\uFF0C\u5E76\u9002\u5F53\u8C03\u6574\u5DE5\u4F5C\u5F3A\u5EA6\u3002", ""][n];
  ct("rpAdvice").textContent = m || "\uFF08\u672C\u680F\u7A7A\u767D\uFF0C\u672A\u89C1\u533B\u5E08\u7B7E\u540D\uFF09";
  let g = new Date,
    x = u => String(u).padStart(2, "0");
  ct("rpDate").textContent = g.getFullYear() + "-" + x(g.getMonth() + 1) + "-" + x(g.getDate()), ct("rpNo").textContent = "TJ" + g.getFullYear() + x(g.getMonth() + 1) + "0" + (n + 1) + Math.floor(Math.random() * 90 + 10), ct("rpAge").textContent = t;
  let p = ["\u6625", "\u590F", "\u79CB", "\u51AC"];
  ct("rpNext").innerHTML = n < 3 ? "\u4E0B\u4E00\u5B63 <b>" + p[n + 1] + '</b> \xB7 \u623F\u79DF\u5DF2\u4ECE\u8D26\u6237\u6263\u9664\u3000<span style="opacity:.6">\uFF08\u70B9\u51FB\u7EE7\u7EED\uFF09</span>' : '\u5168\u5E74\u4F53\u68C0\u7ED3\u675F\u3000<span style="opacity:.6">\uFF08\u70B9\u51FB\u67E5\u770B\u7ED3\u5C40\uFF09</span>', ct("seasonCard").classList.add("show")
}

function wu() {
  let n = fn[C.season];
  iu.color.set(n.ground), su.color.set(n.groundSide), Pc()
}
var Tc = !1;

function Eu() {
  if (!C.over) {
    if (C.busy = !0, C.pending = !1, Gs.classList.remove("show"), document.body.classList.remove("phone-open"), ni.setAttribute("disabled", "true"), C.season < 3) {
      let n = Math.round((2200 + C.season * 500) * (C.job && C.job.wage || 1));
      if (C.money -= n, en(), ds()) return
    }
    Kx(), Tc = !1, setTimeout(() => {
      Tc = !0
    }, 1200)
  }
}

function jx() {
  if (ct("seasonCard").classList.remove("show"), C.season >= 3) {
    da("complete");
    return
  }
  C.season++, C.day = 1, C.pos = 0, C.moonUsed = !1, C.callDone = 0, yc.classList.remove("used"), _u(), C.weather = Lc(), C.runStart = 1, wu(), ba(), xe.position.copy(ls(0)), pn.visible = !1, $t.ready = !1, en(), C.busy = !1, ni.removeAttribute("disabled"), zn(fn[C.season].intro, "moon")
}
ct("seasonCard").onclick = () => {
  !Tc || C.over || jx()
};

function ds() {
  return C.over ? !0 : C.stamina <= 0 ? (da("sick"), !0) : C.spirit <= 0 ? (da("collapse"), !0) : C.money < -3e3 * (C.job && C.job.wage || 1) ? (da("bankrupt"), !0) : !1
}
var jh = {
  bankrupt: {
    tag: "\u7ED3\u5C40 \xB7 \u6491\u4E0D\u4F4F\u4E86",
    title: "\u623F\u4E1C\u6362\u4E86\u9501",
    text: "\u4F60\u7684\u4E1C\u897F\u88AB\u6574\u9F50\u5730\u7801\u5728\u697C\u9053\u91CC\uFF0C\u4E24\u4E2A\u7EB8\u7BB1\uFF0C\u4E00\u4E2A\u7F16\u7EC7\u888B\u3002\u4F60\u8E72\u4E0B\u6765\u7CFB\u7D27\u888B\u53E3\uFF0C\u53D1\u73B0\u624B\u5728\u6296\u3002",
    cls: "bad",
    comment: "\u94B1\u662F\u552F\u4E00\u4F1A\u7528\u300C\u4E0D\u591F\u300D\u6765\u56DE\u7B54\u4F60\u7684\u4E1C\u897F\u3002"
  },
  sick: {
    tag: "\u7ED3\u5C40 \xB7 \u8EAB\u4F53\u5148\u57AE\u4E86",
    title: "\u533B\u9662\u7684\u8D70\u5ECA\u5F88\u957F",
    text: "\u4F60\u8EBA\u5728\u63A8\u8F66\u4E0A\u770B\u7740\u5929\u82B1\u677F\uFF0C\u4E00\u76CF\u4E00\u76CF\u7684\u706F\u4ECE\u5934\u9876\u6ED1\u8FC7\u53BB\u3002\u4F60\u60F3\u8BF4\u300C\u6211\u6CA1\u4E8B\u300D\uFF0C\u4F46\u6CA1\u529B\u6C14\u5F20\u53E3\u3002",
    cls: "bad",
    comment: "\u8EAB\u4F53\u662F\u552F\u4E00\u4E0D\u4F1A\u8DDF\u4F60\u5546\u91CF\u7684\u5408\u4F19\u4EBA\u3002"
  },
  collapse: {
    tag: "\u7ED3\u5C40 \xB7 \u4E0D\u60F3\u52A8\u4E86",
    title: "\u624B\u673A\u54CD\u4E86\u5341\u4E03\u6B21",
    text: "\u4F60\u4E00\u6B21\u90FD\u6CA1\u63A5\u3002\u7A97\u5E18\u6CA1\u62C9\uFF0C\u5149\u4ECE\u7F1D\u91CC\u8FDB\u6765\uFF0C\u843D\u5728\u5899\u4E0A\uFF0C\u6162\u6162\u79FB\u8FC7\u53BB\uFF0C\u53C8\u6162\u6162\u6D88\u5931\u3002",
    cls: "bad",
    comment: "\u6709\u4E9B\u4E1C\u897F\u65AD\u4E86\uFF0C\u4E0D\u75BC\uFF0C\u4F46\u5C31\u662F\u63A5\u4E0D\u4E0A\u4E86\u3002"
  },
  complete: {
    tag: "\u7ED3\u5C40 \xB7 \u4E00\u5E74\u8FC7\u53BB\u4E86",
    title: "\u7B2C\u4E09\u767E\u516D\u5341\u5929",
    text: "\u6625\u5929\u4F60\u8FD8\u5728\u627E\u6D3B\uFF0C\u590F\u5929\u4F60\u5DEE\u70B9\u4E2D\u6691\uFF0C\u79CB\u5929\u4F60\u88AB\u4F18\u5316\u4E86\u4E00\u6B21\uFF0C\u51AC\u5929\u4F60\u628A\u5E74\u8FC7\u5B8C\u4E86\u3002\u4F60\u8FD8\u7AD9\u5728\u8FD9\u91CC\u3002",
    cls: "good",
    comment: ""
  }
};

/* ============================================================
 *  三界判定
 *  ------------------------------------------------------------
 *  这一世过完（无论是撑不住、病倒、还是走满三百六十天），都要问一句：
 *  这个人该往哪儿去。
 *
 *  规则（默认，后台「系统设置 → 三界判定」可改）：
 *    · 恶行次数 >= evilNeed      → 入地府（difu.html）
 *    · 恶行次数 <  evilNeed      → 入天庭（tiangong.html）
 *    · mercy > 0 时，善行减恶行 >= mercy 可以抵过，改判天庭
 *    · pHell / pHeaven 是「真的走成」的概率，调低就有人卡在结局页
 *
 *  概率从后端读（realm.config），读不到就用这里的默认值，单机也不会断。
 * ============================================================ */
var REALM = { enabled: !0, pHell: 100, pHeaven: 100, evilNeed: 1, mercy: 0 };
window.LIFE_REALM = window.LIFE_REALM || REALM;

/** 判一次归宿：返回 "difu" / "tiangong" / null（不走） */
function realmJudge() {
  var R = window.LIFE_REALM || REALM;
  if (!R || R.enabled === false) {
    return null;
  }
  var evil = C.evil || 0,
    good = C.good || 0,
    need = +R.evilNeed || 1,
    isEvil = evil >= need;
  if (isEvil && +R.mercy > 0 && good - evil >= +R.mercy) {
    isEvil = !1;
  }
  var p = isEvil ? +R.pHell || 0 : +R.pHeaven || 0;
  if (!p || Math.random() * 100 >= p) {
    return null;
  }
  return isEvil ? "difu" : "tiangong";
}

/** 拼目的地地址，把这一世的履历带过去 */
function realmUrl(dest, kind) {
  var q = ["from=life", "e=" + encodeURIComponent(kind || ""),
    "d=" + Math.min(360, 90 * C.season + C.day),
    "j=" + encodeURIComponent(C.job ? C.job.n : ""),
    "g=" + (C.good || 0), "k=" + (C.evil || 0),
    "m=" + Math.round(C.money || 0), "s=" + Math.round(Math.max(0, C.spirit))
  ];
  if (dest === "difu") {
    q.push("area=gate");
  }
  return (dest === "difu" ? "difu.html" : "tiangong.html") + "?" + q.join("&");
}

/** 在结局卡里插一块「三界判定」，带倒计时自动前往 */
function realmGate(kind) {
  var card = ct("ovCard"),
    old = ct("ovRealm");
  old && old.parentNode && old.parentNode.removeChild(old);
  if (!card) {
    return;
  }
  var dest = realmJudge();
  if (!dest) {
    return;
  }

  var isDifu = dest === "difu",
    evil = C.evil || 0,
    good = C.good || 0,
    box = document.createElement("div");
  box.id = "ovRealm";
  box.className = "ov-realm " + (isDifu ? "difu" : "tiangong");

  var line;
  if (isDifu) {
    line = "你这一世做过 " + evil + " 件恶事" + (good ? "、" + good + " 件善事" : "") + "。孽镜台前，账是平的。";
  } else if (good > 0) {
    line = "你这一世做过 " + good + " 件好事，一件恶事也没有。簿上有名。";
  } else {
    line = "你这一世没做过什么大事，也没做过坏事。这已经不容易了。";
  }

  var list = (C.deeds || []).filter(function (d) {
    return isDifu ? d.evil : d.good;
  }).slice(-3).reverse();

  box.innerHTML = '<div class="ov-realm-h"><span class="dot"></span><b>' + (isDifu ? "\u4E09\u754C\u5224\u5B9A \xB7 \u9B42\u5F52\u5E7D\u51A5" : "\u4E09\u754C\u5224\u5B9A \xB7 \u4F4D\u5217\u4ED9\u73ED") + '</b><i id="ovCd"></i></div>' +
    "<p>" + line + "</p>" +
    (list.length ? "<ul>" + list.map(function (d) {
      return '<li class="' + (isDifu ? "evil" : "good") + '">' + d.t + " \xB7 " + d.x + "</li>";
    }).join("") + "</ul>" : "") +
    '<div class="ov-realm-btns"><button class="btn ' + (isDifu ? "go-difu" : "go-tiangong") + '" id="realmGo">' + (isDifu ? "\u5165\u5E7D\u51A5" : "\u4E0A\u5929\u5EAD") + "</button>" +
    '<button class="btn ghost stay" id="realmStay">\u7559\u5728\u8FD9\u4E00\u4E16</button></div>';

  card.insertBefore(box, ct("againBtn"));

  var target = realmUrl(dest, kind),
    left = 8,
    cd = box.querySelector("#ovCd"),
    tick = null,
    go = function () {
      location.href = target;
    };

  cd.textContent = left + " \u79D2\u540E\u81EA\u52A8\u524D\u5F80";
  tick = setInterval(function () {
    if ((left -= 1) <= 0) {
      clearInterval(tick), go();
      return;
    }
    cd.textContent = left + " \u79D2\u540E\u81EA\u52A8\u524D\u5F80";
  }, 1000);

  box.querySelector("#realmGo").onclick = function () {
    clearInterval(tick), go();
  };
  box.querySelector("#realmStay").onclick = function () {
    clearInterval(tick), cd.textContent = "\u4F60\u9009\u62E9\u7559\u5728\u8FD9\u4E00\u4E16", box.classList.add("stay-put");
  };
}

function da(n) {
  if (C.over) return;
  C.over = !0, C.busy = !1, C.pending = !1, Gs.classList.remove("show"), ni.setAttribute("disabled", "true");
  let t = jh[n] || jh.complete;
  ct("ovTag").textContent = t.tag, ct("ovTitle").textContent = t.title, ct("ovText").textContent = t.text, ct("ovDays").textContent = Math.min(360, 90 * C.season + C.day), ct("ovMoney").textContent = ei(C.money), ct("ovSpirit").textContent = Math.max(0, Math.round(C.spirit)) + "%", ct("ovDignity").textContent = C.dignity + " \u6B21", ct("ovCard").className = "ov-card " + t.cls;
  let e = t.comment;
  n === "complete" && (C.money < 0 ? e = "\u4F60\u6491\u8FC7\u4E86\u8FD9\u4E00\u5E74\uFF0C\u4EE3\u4EF7\u662F\u6B20\u4E86\u4E00\u5C41\u80A1\u503A\u3002\u660E\u5E74\u8FD8\u5F97\u7EE7\u7EED\u3002" : C.face >= 72 ? e = "\u4F60\u51E0\u4E4E\u6CA1\u4F4E\u8FC7\u5934\u3002\u4EE3\u4EF7\u662F\u8D26\u6237\u91CC\u6CA1\u5269\u4E0B\u591A\u5C11\u3002" : C.spirit >= 65 ? e = "\u4F60\u8FD8\u7559\u7740\u4E00\u70B9\u81EA\u5DF1\u3002\u6491\u8FC7\u4E00\u6574\u5E74\uFF0C\u8FD9\u5DF2\u7ECF\u4E0D\u5BB9\u6613\u4E86\u3002" : C.money >= 12e3 * (C.job && C.job.wage || 1) ? e = "\u4F60\u6512\u4E0B\u4E86\u94B1\uFF0C\u4E5F\u6512\u4E0B\u4E86\u4E00\u8EAB\u6BDB\u75C5\u3002" : e = "\u4F60\u6CA1\u6709\u8D62\uFF0C\u4F46\u4F60\u4E5F\u6CA1\u6709\u8F93\u5F97\u592A\u96BE\u770B\u3002"), ct("ovComment").textContent = e, realmGate(n), setTimeout(() => Fx.classList.add("show"), 400)
}
ct("againBtn").onclick = () => location.reload();
