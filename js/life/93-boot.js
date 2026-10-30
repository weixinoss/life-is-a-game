/* ============================================================
 *  93-boot.js
 *  启动：首帧渲染、__READY__ 标记、页面可见性恢复
 * 声明：tu 首帧标记, Ea() 首帧渲染, window.__READY__, window.__forceRender
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

Pc();
ba();
en();
Cu();
var tu = !1;

function Ea() {
  tu || (tu = !0, window.__READY__ = !0, document.getElementById("loading").classList.add("hide"))
}
requestAnimationFrame(() => {
  requestAnimationFrame(Ea)
});
setTimeout(Ea, 900);
window.__forceRender = Ea;
document.addEventListener("visibilitychange", () => {
  document.hidden || (Ea(), We.render(ce, Ve))
})
