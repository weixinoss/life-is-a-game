/* ============================================================
 *  87-turn.js
 *  回合推进、踩格结算、事件面板与键盘/按钮绑定
 * 声明：Wx() 标记已过格, _u() 重置, us() 工资系数, Xx() 推进一天, qx() 到达格子, Yx() 挑事件, Sc() 收入修正, Zx() 开面板, Jx() 选选项
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

function Wx(n) {
  let t = Bn[n];
  !t || t.passed || (t.passed = !0, t.topMatI.color.copy(t.baseTop).multiplyScalar(.62), t.sideMatI.color.copy(t.baseSide).multiplyScalar(.62))
}

function _u() {
  Bn.forEach(n => {
    n.passed = !1, n.topMatI.color.copy(n.baseTop), n.sideMatI.color.copy(n.baseSide), n.target = 0
  })
}

function us() {
  return C.job && C.job.wage || 1
}

function Xx() {
  if (C.day++, Wx(C.pos), C.pos = (C.pos + 1) % nn, C.money -= Math.round(60 * us()), C.day % 3 === 0) {
    let n = Lc();
    n !== C.weather && (C.weather = n, ba())
  }
}

function qx() {
  C.busy = !1, ni.removeAttribute("disabled"), Hx(C.pos);
  let n = Math.max(1, C.day - (C.runStart || C.day - 1)),
    t = Ti[C.weather],
    e = Math.round(n * 46 * (t.inc || 1) * (C.job && C.job.income || 1) * us());
  if (C.money += e, en(["money"]), Mc((C.runStart || C.day - n) + 1, C.day, e, Math.round(n * 60 * us()), C.money), C.day > nn) {
    Eu();
    return
  }
  ds() || $x(s => {
    if (s) {
      en();
      return
    }
    if (ou(C.pos)) Zx(Yx(), C.pos, !1);
    else {
      let r = Ti[C.weather];
      en();
      let o = pa[C.weather] || [r.tip],
        a = o[Math.floor(Math.random() * o.length)];
      zn("\u7B2C " + C.day + " \u5929 \xB7 " + r.n + "\u3000" + a, "moon"), ni.removeAttribute("disabled")
    }
  })
}

/* ------------------------------------------------------------
 *  事件抽签
 *  ------------------------------------------------------------
 *  原来是把所有事件堆成一个长数组直接抽，事件越多、堆越大的那一类越容易
 *  出现。加了命运牌堆（好事 / 坏事 / 职业专属）以后，改成两段式：
 *  先按权重抽一个牌堆，再在牌堆里均匀抽一条。这样每类事件的"出镜率"
 *  由权重决定，不受这一堆里塞了多少条影响，调平衡只改一个数字。
 *
 *  权重：职业日常 24 · 本季 15 · 通用 17 · 天气 13
 *        好事 9 · 坏事 9 · 职业好事 3 · 职业坏事 3
 *  合计 93，命运牌堆占 24 —— 大约每四个事件里有一个是"真正的好事或坏事"。
 *  （因为"最近出现过"要重抽，实际出镜率会略高于权重比，约 30%。）
 *
 *  这套数字是用模拟器跑出来的：把 400 局从头玩到死，命运牌堆从 0% 加到 24%，
 *  平均存活天数只掉两成左右；再往上加，一场车祸接一场住院，人活不过一个月。
 * ------------------------------------------------------------ */
var YW = {
  job: 24, season: 15, common: 17, weather: 13,
  good: 9, bad: 9, jobGood: 3, jobBad: 3
};

/** 记一次"最近出现过"，避免短期重复；返回事件本身，方便串写 */
function markUsed(ev) {
  C.usedEv.push(ev.t), C.usedEv.length > 26 && C.usedEv.shift();
  C.seen = C.seen || [], C.seen.indexOf(ev.t) < 0 && C.seen.push(ev.t);
  return ev;
}

/** 选完一个选项后，把链式后续排进队列 */
function fateQueue(spec) {
  if (!spec || !ha.fate || !ha.fate.chain) return;
  var id = spec.id;
  if (spec.roll && spec.roll.length) {
    var r = Math.random(), acc = 0;
    id = spec.roll[spec.roll.length - 1][0];
    for (var i = 0; i < spec.roll.length; i++) {
      acc += spec.roll[i][1];
      if (r <= acc) { id = spec.roll[i][0]; break; }
    }
  }
  if (!id || !ha.fate.chain[id]) return;
  C.chain = C.chain || [], C.chain.push({ id: id, after: spec.after == null ? 2 : spec.after }),
    C.chain.length > 4 && C.chain.shift();
}

/** 每次踩到事件格先问一句：有没有到期的后续事件 */
function takeChain() {
  if (!C.chain || !C.chain.length) return null;
  for (var i = 0; i < C.chain.length; i++) {
    if (--C.chain[i].after <= 0) {
      var q = C.chain.splice(i, 1)[0];
      return ha.fate.chain[q.id] || null;
    }
  }
  return null;
}

/** 选项上的善业 / 恶业记账 */
function karm(n, evTitle) {
  n.good && (C.good = (C.good || 0) + n.good),
    n.evil && (C.evil = (C.evil || 0) + n.evil),
    (n.good || n.evil) && (C.deeds = C.deeds || [], C.deeds.push({
      t: evTitle || "", x: n.x || "", good: n.good || 0, evil: n.evil || 0, d: C.day
    }), C.deeds.length > 40 && C.deeds.shift()),
    n.chain && fateQueue(n.chain);
}

function Yx() {
  let q = takeChain();
  if (q) return markUsed(q);

  let F = ha.fate || {},
    job = C.job && C.job.id,
    evilN = C.evil || 0,
    /* 恶业会压住好运：每一点恶业让「好事」牌堆少一格权重，最低留 2。
       同时从第 3 点恶业起开「报应」牌堆，越作恶越常撞见。 */
    goodW = Math.max(2, YW.good - evilN),
    retW = evilN >= 3 && F.retribution && F.retribution.length
      ? Math.min(14, 2 + (evilN - 3) * 2) : 0,
    bands = [
      [ha.job[job] || [], YW.job],
      [ha[fn[C.season].id] || [], YW.season],
      [ha.common || [], YW.common],
      [ha.weather[C.weather] || [], YW.weather],
      [F.good || [], goodW],
      [F.bad || [], YW.bad],
      [(F.jobGood || {})[job] || [], YW.jobGood],
      [(F.jobBad || {})[job] || [], YW.jobBad],
      [F.retribution || [], retW]
    ],
    live = [],
    total = 0;

  bands.forEach(b => {
    b[0] && b[0].length && b[1] > 0 && (live.push(b), total += b[1]);
  });
  if (!live.length) return markUsed(ha.common[0]);

  for (let k = 0; k < 26; k++) {
    let r = Math.random() * total,
      acc = 0,
      deck = live[0];
    for (let j = 0; j < live.length; j++) {
      if ((acc += live[j][1]) >= r) {
        deck = live[j];
        break;
      }
    }
    let ev = deck[0][Math.floor(Math.random() * deck[0].length)];
    if (!C.usedEv.includes(ev.t)) return markUsed(ev);
  }
  return markUsed(ha.common[Math.floor(Math.random() * ha.common.length)]);
}

function Sc(n) {
  return n > 0 ? Math.round(n * (C.job && C.job.id === "factory" ? 1.1 : 1.25)) : n
}

function Zx(n, t, e) {
  C.pending = !0;
  let i = fn[C.season],
    s = Ti[C.weather];
  Ux.textContent = i.name + " \xB7 \u7B2C " + C.day + " \u5929", Zh.textContent = s.n, Zh.style.background = s.col, Nx.style.background = i.c, Ix.textContent = n.t, Dx.textContent = n.d, ga.textContent = "", ga.classList.remove("show"), Jh.innerHTML = "", n.o.forEach((r, o) => {
    let a = document.createElement("button");
    a.className = "opt", a.style.animationDelay = o * 60 + "ms";
    let c = [],
      l = (s.inc || 1) * (C.job && C.job.income || 1),
      h = typeof r.amt === "number" ? r.amt
        : typeof r.pct === "number" ? Math.round((Math.max(0, C.money || 0) + 800) * r.pct)
          : Math.round(r.m * (r.m > 0 ? l : 1) * (r.abs ? 1 : us())) || 0;
    typeof r.pct === "number"
      ? c.push('<i class="' + (r.pct > 0 ? "up" : "dn") + '">' + (r.pct > 0 ? "+" : "-") + Math.round(Math.abs(r.pct) * 100) + "% \u79EF\u84C4</i>")
      : h && c.push('<i class="' + (h > 0 ? "up" : "dn") + '">' + (h > 0 ? "+" : "") + ei(h) + "</i>");
    let f = Sc(r.st);
    f && c.push('<i class="' + (f > 0 ? "up" : "dn") + '">\u4F53\u529B' + (f > 0 ? "+" : "") + f + "</i>"), r.sp && c.push('<i class="' + (r.sp > 0 ? "up" : "dn") + '">\u7CBE\u795E' + (r.sp > 0 ? "+" : "") + r.sp + "</i>"), r.fc && c.push('<i class="' + (r.fc > 0 ? "up" : "dn") + '">\u4F53\u9762' + (r.fc > 0 ? "+" : "") + r.fc + "</i>"),
      r.good && c.push('<i class="up">\u5584\u4E1A +' + r.good + "</i>"),
      r.evil && c.push('<i class="dn">\u6076\u4E1A +' + r.evil + "</i>"), (r.st || 0) < -12 && C.stamina < 24 ? (a.classList.add("tired"), a.innerHTML = '<span class="ot">' + r.x + '</span><span class="oc">' + c.join("") + '<i class="warn">\u4F53\u529B\u4E0D\u652F</i></span>', a.disabled = !0) : (a.innerHTML = '<span class="ot">' + r.x + '</span><span class="oc">' + c.join("") + "</span>", a.onclick = () => Jx(r, a, h, n.t)), Jh.appendChild(a)
  }), Gs.classList.add("show"), document.body.classList.add("phone-open"), $t.phoneTarget = -.16
}

function Jx(n, t, e, evTitle) {
  if (!C.pending || C.chosen) return;
  C.chosen = !0;
  let i = Ti[C.weather];
  C.money += e, C.stamina = Math.min(C.staminaMax, C.stamina + Sc(n.st || 0) + (i.sta < 0 ? 1 : 0)), C.spirit = Math.min(C.spiritMax, C.spirit + (n.sp || 0)), C.face = Math.max(0, Math.min(100, C.face + (n.fc || 0))), C.rating = Math.max(0, Math.min(100, C.rating + (n.rt || 0))), (n.fc || 0) <= -6 && C.dignity++, karm(n, evTitle), document.querySelectorAll(".opt").forEach(r => {
    r.disabled = !0, r.classList.add("dim")
  }), t.classList.remove("dim"), t.classList.add("picked"), ga.textContent = n.n, ga.classList.add("show"), en(["money", "stamina", "spirit", "face"]), e && Mi("money", (e > 0 ? "+" : "") + ei(e), e > 0);
  let s = Sc(n.st || 0);
  s && Mi("stamina", (s > 0 ? "+" : "") + s, s > 0), n.sp && Mi("spirit", (n.sp > 0 ? "+" : "") + n.sp, n.sp > 0), n.fc && Mi("face", (n.fc > 0 ? "+" : "") + n.fc, n.fc > 0), setTimeout(() => {
    Gs.classList.remove("show"), document.body.classList.remove("phone-open"), $t.phoneTarget = 0, C.pending = !1, C.chosen = !1, !ds() && C.day > nn && Eu()
  }, 1500)
}
yc.onclick = () => {
  if (!C.started || C.busy || C.pending || C.over || C.moonUsed) return;
  let n = Ze.isNight;
  C.moonUsed = !0, C.stamina -= 4, C.spirit = Math.min(C.spiritMax, C.spirit + (n ? 18 : 8)), C.day++, en(["stamina", "spirit"]), Mi("spirit", n ? "+18" : "+8", !0), yc.classList.add("used"), zn(n ? "\u4F60\u5750\u5728\u697C\u4E0B\u770B\u4E86\u4F1A\u513F\u6708\u4EAE\u3002\u591C\u91CC\u5F88\u9759\uFF0C\u4F60\u597D\u50CF\u677E\u4E86\u4E00\u70B9\u3002" : "\u4F60\u62AC\u5934\u770B\u4E86\u770B\u5929\u3002\u6CA1\u4EC0\u4E48\u7279\u522B\u7684\uFF0C\u4F46\u4F60\u7F13\u8FC7\u6765\u4E86\u3002", "moon"), ds()
};
ni.onclick = xu;
window.addEventListener("keydown", n => {
  n.code === "Space" && !C.pending && C.started && (n.preventDefault(), xu())
});
