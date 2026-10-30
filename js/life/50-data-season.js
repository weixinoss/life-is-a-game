/* ============================================================
 *  50-data-season.js
 *  四季配置与天气表
 * 声明：fn 四季配置, Ti 天气表（dice/sta/inc 三项修正）
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var 
  fn = [{
    id: "spring",
    n: "\u6625",
    name: "\u6625\u5B63",
    sub: "\u7ACB\u6625 \xB7 \u8C37\u96E8 \xB7 90 \u5929",
    c: "#6fbf5a",
    ground: "#b4d99a",
    groundSide: "#8fbd78",
    sky: ["#63b8ec", "#b6e3ff", "#e9f6ff"],
    weights: {
      sunny: 26,
      cloudy: 28,
      rain: 28,
      fog: 12,
      storm: 6
    },
    intro: "\u6625\u5929\u6765\u4E86\u3002\u6D3B\u5F00\u59CB\u591A\u8D77\u6765\uFF0C\u4F46\u96E8\u4E5F\u591A\u8D77\u6765\u3002"
  }, {
    id: "summer",
    n: "\u590F",
    name: "\u590F\u5B63",
    sub: "\u7ACB\u590F \xB7 \u5927\u6691 \xB7 90 \u5929",
    c: "#efb100",
    ground: "#dcd08d",
    groundSide: "#c2b671",
    sky: ["#3f9fe0", "#a2d8ff", "#fdf3d6"],
    weights: {
      sunny: 28,
      hot: 30,
      storm: 18,
      rain: 16,
      cloudy: 8
    },
    intro: "\u590F\u5929\u3002\u592A\u9633\u628A\u5730\u9762\u70E4\u5F97\u53D1\u767D\uFF0C\u98CE\u6247\u5439\u51FA\u6765\u7684\u4E5F\u662F\u70ED\u98CE\u3002"
  }, {
    id: "autumn",
    n: "\u79CB",
    name: "\u79CB\u5B63",
    sub: "\u7ACB\u79CB \xB7 \u971C\u964D \xB7 90 \u5929",
    c: "#e07b39",
    ground: "#e2c79b",
    groundSide: "#c8ac7e",
    sky: ["#4f9fd6", "#bedeef", "#fdf0da"],
    weights: {
      sunny: 40,
      cloudy: 28,
      fog: 14,
      rain: 12,
      cold: 6
    },
    intro: "\u79CB\u5929\u3002\u5929\u5F88\u9AD8\uFF0C\u98CE\u5F88\u5E72\u51C0\uFF0C\u662F\u4E00\u5E74\u91CC\u6700\u597D\u8FC7\u7684\u4E5D\u5341\u5929\u3002"
  }, {
    id: "winter",
    n: "\u51AC",
    name: "\u51AC\u5B63",
    sub: "\u7ACB\u51AC \xB7 \u5927\u5BD2 \xB7 90 \u5929",
    c: "#6f9fc4",
    ground: "#d6e6f0",
    groundSide: "#b6cbdb",
    sky: ["#5b8dbd", "#b4d3e8", "#eef7ff"],
    weights: {
      snow: 30,
      cold: 30,
      cloudy: 18,
      sunny: 16,
      fog: 6
    },
    intro: "\u51AC\u5929\u3002\u624B\u4E00\u4F38\u51FA\u6765\u5C31\u51BB\u50F5\uFF0C\u5E74\u5173\u4E5F\u8D8A\u6765\u8D8A\u8FD1\u3002"
  }],
  Ti = {
    sunny: {
      n: "\u6674",
      ic: "\u6674",
      col: "#e0a800",
      dice: 0,
      sta: 0,
      inc: 1,
      tip: "\u5929\u6C14\u4E0D\u9519\uFF0C\u9002\u5408\u591A\u5E72\u4E00\u70B9\u3002"
    },
    cloudy: {
      n: "\u591A\u4E91",
      ic: "\u4E91",
      col: "#7a8fa0",
      dice: 0,
      sta: 0,
      inc: 1,
      tip: "\u4E0D\u51B7\u4E0D\u70ED\uFF0C\u666E\u901A\u7684\u4E00\u5929\u3002"
    },
    rain: {
      n: "\u5C0F\u96E8",
      ic: "\u96E8",
      col: "#3d8fd1",
      dice: -1,
      sta: -1,
      inc: 1.1,
      tip: "\u8DEF\u9762\u6E7F\u6ED1\uFF0C\u8D70\u8DEF\u6162\u4E00\u70B9\u3002\u5355\u5B50\u4F1A\u53D8\u591A\u3002"
    },
    storm: {
      n: "\u66B4\u96E8",
      ic: "\u66B4",
      col: "#2f6fa8",
      dice: -2,
      sta: -2,
      inc: 1.05,
      tip: "\u96E8\u592A\u5927\u5C31\u522B\u901E\u5F3A\uFF0C\u5B89\u5168\u7B2C\u4E00\u3002"
    },
    hot: {
      n: "\u9AD8\u6E29",
      ic: "\u70ED",
      col: "#dc2626",
      dice: -1,
      sta: -3,
      inc: .95,
      tip: "\u4E09\u5341\u4E03\u5EA6\uFF0C\u591A\u559D\u6C34\uFF0C\u522B\u786C\u6491\u3002"
    },
    snow: {
      n: "\u5927\u96EA",
      ic: "\u96EA",
      col: "#5aa9d6",
      dice: -2,
      sta: -2,
      inc: .88,
      tip: "\u5730\u4E0A\u90FD\u662F\u51B0\uFF0C\u8D70\u4E00\u6B65\u770B\u4E00\u6B65\u3002"
    },
    cold: {
      n: "\u5BD2\u6F6E",
      ic: "\u5BD2",
      col: "#4a86b8",
      dice: -1,
      sta: -2,
      inc: .92,
      tip: "\u96F6\u4E0B\u5341\u5EA6\uFF0C\u624B\u5957\u548C\u5E3D\u5B50\u90FD\u6234\u4E0A\u3002"
    },
    fog: {
      n: "\u5927\u96FE",
      ic: "\u96FE",
      col: "#8a9aa8",
      dice: -1,
      sta: 0,
      inc: 1,
      tip: "\u80FD\u89C1\u5EA6\u4F4E\uFF0C\u8FC7\u9A6C\u8DEF\u591A\u770B\u4E00\u773C\u3002"
    }
  }
