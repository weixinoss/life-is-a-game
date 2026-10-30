/* ============================================================
 *  89-phone.js
 *  来电弹窗事件
 * 声明：Ec 回调暂存, $x() 触发来电, Su() 接听/拒接结算
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var Ec = null;

function $x(n) {
  if (C.over) {
    n(!1);
    return
  }
  let t = C.callDone || 0;
  if (t >= 2 || Math.random() > .18) {
    n(!1);
    return
  }
  C.callDone = t + 1, Ec = n, ct("call").classList.add("show"), $t.phoneTarget = -.1
}

function Su(n) {
  ct("call").classList.remove("show"), $t.phoneTarget = 0;
  let t = Ec;
  if (Ec = null, n) {
    let e = Math.round(320 * us());
    C.money += e, C.stamina = Math.max(0, C.stamina - 18), C.spirit = Math.max(0, C.spirit - 14), C.face = Math.max(0, C.face - 2), en(["money", "stamina", "spirit", "face"]), Mi("money", "+\xA5" + e.toLocaleString("en-US"), !0), zn("\u300C\u65B9\u6848\u4ECA\u665A\u8981\uFF0C\u4F60\u5148\u5F04\u4E00\u4E0B\u3002\u300D\u4F60\u7B54\u5E94\u4E86\u3002\u8FD9\u4E2A\u70B9\u5DF2\u7ECF\u6CA1\u6709\u73ED\u8F66\u4E86\u3002", "rent")
  } else C.spirit = Math.max(0, C.spirit - 8), C.face = Math.max(0, C.face - 4), C.rating = Math.max(0, C.rating - 3), en(["spirit", "face"]), Mi("spirit", "-8", !1), zn("\u4F60\u6309\u4E86\u62D2\u63A5\u3002\u624B\u673A\u5B89\u9759\u4E0B\u6765\uFF0C\u4F60\u7684\u5FC3\u8DF3\u6CA1\u6709\u3002", "moon");
  setTimeout(() => {
    ds() || t && t(n)
  }, 1e3)
}
ct("callAccept").onclick = () => Su(!0);
ct("callReject").onclick = () => Su(!1);
