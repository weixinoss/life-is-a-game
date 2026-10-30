/* ============================================================
 *  20-env.js
 *  运行环境探测：挂载容器、lite 精简模式、UA 与 WebGL 可用性检测
 * 声明：zg 挂载容器, Ei 是否精简模式
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var zg = document.getElementById("app"),
  Ei = (function() {
    if (/[?&]lite=1/.test(location.search)) return !0;
    try {
      var n = navigator.hardwareConcurrency || 8,
        t = navigator.deviceMemory || 8,
        e = Math.min(window.innerWidth, window.innerHeight) < 500;
      return n <= 4 && e || t <= 2 && e
    } catch {
      return !1
    }
  })();
Ei && document.documentElement.classList.add("lite");
(function() {
  let t = navigator.userAgent || "",
    e = !1,
    i = "";

  function s(r) {
    try {
      let o = document.createElement("canvas"),
        a = o.getContext("webgl2", r) || o.getContext("webgl", r) || o.getContext("experimental-webgl", r);
      return a ? (a.getExtension("WEBGL_lose_context") && a.getExtension("WEBGL_lose_context").loseContext(), !0) : !1
    } catch (o) {
      return i = o.message || "", !1
    }
  }
  if (e = s() || s({
      failIfMajorPerformanceCaveat: !1,
      antialias: !1,
      alpha: !0
    }), !e) {
    window.__LOAD_FAIL = "webgl";
    let r = document.getElementById("loadErr");
    if (r) {
      r.innerHTML = '<div class="failbox"><b>\u8FD9\u4E2A\u9875\u9762\u9700\u8981 3D \u6E32\u67D3</b><p>\u5F53\u524D\u73AF\u5883\u6CA1\u6709\u53EF\u7528\u7684 WebGL\uFF0C\u6CA1\u6CD5\u628A\u68CB\u76D8\u642D\u8D77\u6765\u3002<br>\u5E38\u89C1\u4E8E\uFF1AApp \u5185\u7F6E\u9884\u89C8\u3001\u5FAE\u4FE1 / QQ \u5185\u7F6E\u6D4F\u89C8\u5668\u3001\u5173\u95ED\u4E86\u786C\u4EF6\u52A0\u901F\u3002</p><p class="how">\u8BF7\u628A\u6587\u4EF6\u4E0B\u8F7D\u4E0B\u6765\uFF0C\u7528 <b>Chrome / Edge / Safari</b> \u6253\u5F00</p><small id="uaInfo"></small></div>';
      let c = document.getElementById("uaInfo");
      if (c) {
        let l = /MicroMessenger|QQ\/|Weibo|DingTalk|WorkBuddy|Electron/i.test(t);
        c.textContent = "\u73AF\u5883\uFF1A" + (l ? "\u5185\u7F6E\u6D4F\u89C8\u5668" : "\u672A\u77E5") + "\u3000WebGL\uFF1A\u4E0D\u53EF\u7528" + (i ? "\uFF08" + i.slice(0, 40) + "\uFF09" : "")
      }
    }
    let o = document.querySelector("#loading .ring");
    o && (o.style.animation = "none");
    let a = document.querySelector("#loading p");
    throw a && (a.textContent = "\u65E0\u6CD5\u542F\u52A8 3D \u5F15\u64CE"), new Error("WebGL unsupported")
  }
})();
