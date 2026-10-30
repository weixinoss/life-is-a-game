/* ============================================================
 *  js/net/api.js
 *  网络层：统一请求、令牌、超时、离线降级
 *  ------------------------------------------------------------
 *  设计原则：
 *   1. 后端不可达时绝不抛给玩家看 —— 自动进入「游客模式」，游戏照常玩，
 *      只是存档与联网玩法不可用。
 *   2. 所有请求 8 秒超时，避免弱网把界面卡住。
 *   3. 只暴露 window.NET 一个全局，不与游戏内部的短名冲突。
 * ============================================================ */
(function (global) {
  'use strict';

  // 同域相对路径；服务端在别的域名时改成完整地址（如 https://api.xxx.com/index.php）
  var BASE = 'server/api/index.php';
  var TOKEN_KEY = 'life_token';
  var USER_KEY = 'life_user';

  var token = '';
  var user = null;
  try {
    token = localStorage.getItem(TOKEN_KEY) || '';
    var u = localStorage.getItem(USER_KEY);
    if (u) { user = JSON.parse(u); }
  } catch (e) { /* 隐私模式下 localStorage 可能不可用 */ }

  var status = {
    online: null,      // null 未知 / true 在线 / false 离线
    checked: false,    // 是否已探测过
    lastError: ''
  };

  function isFile() {
    return global.location && global.location.protocol === 'file:';
  }

  function setToken(t) {
    token = t || '';
    try {
      if (token) { localStorage.setItem(TOKEN_KEY, token); }
      else { localStorage.removeItem(TOKEN_KEY); }
    } catch (e) {}
  }

  function setUser(u) {
    user = u || null;
    try {
      if (u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
      else { localStorage.removeItem(USER_KEY); }
    } catch (e) {}
  }

  function markOffline(msg) {
    status.online = false;
    status.checked = true;
    status.lastError = msg || 'offline';
  }

  function markOnline() {
    status.online = true;
    status.checked = true;
    status.lastError = '';
  }

  /**
   * 发一个请求
   * @param {string} action  接口名，如 'world.state'
   * @param {object} params  参数
   * @param {object} opt     {method:'POST'|'GET', timeout:ms, silent:bool}
   */
  function req(action, params, opt) {
    opt = opt || {};
    if (isFile()) {
      markOffline('file:// 协议下无法访问接口');
      return Promise.reject(new Error('offline'));
    }
    var method = opt.method || 'POST';

    var ctrl = null;
    var timer = null;
    var init = { method: method, headers: { 'Accept': 'application/json' } };
    if (token) { init.headers['Authorization'] = 'Bearer ' + token; }

    var target = BASE + '?action=' + encodeURIComponent(action);

    if (method === 'POST') {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(params || {});
      init.credentials = 'same-origin';
    } else {
      var qs = [];
      var p = params || {};
      for (var k in p) {
        if (Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined && p[k] !== null) {
          qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(p[k]));
        }
      }
      if (qs.length) { target += '&' + qs.join('&'); }
    }

    try {
      ctrl = new AbortController();
      init.signal = ctrl.signal;
      timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, opt.timeout || 9000);
    } catch (e) { /* 老浏览器不支持 AbortController 就直连 */ }

    return fetch(target, init).then(function (res) {
      if (timer) { clearTimeout(timer); }
      return res.json().catch(function () {
        throw new Error('接口返回的不是 JSON（HTTP ' + res.status + '）');
      }).then(function (json) {
        if (!json || json.ok !== true) {
          var err = new Error((json && json.error && json.error.msg) || '请求失败');
          err.code = (json && json.error && json.error.code) || 'unknown';
          err.httpStatus = res.status;
          throw err;
        }
        markOnline();
        return json.data;
      });
    }).catch(function (e) {
      if (timer) { clearTimeout(timer); }
      var msg = e && e.message ? e.message : '网络异常';
      if (e && (e.name === 'AbortError')) { msg = '请求超时'; }
      // 只有网络层失败才判定离线；业务错误（如 need_login）不清在线状态
      if (!e || !e.code || e.code === 'unknown') {
        markOffline(msg);
      }
      if (!opt.silent) { console.warn('[NET]', action, msg); }
      throw e;
    });
  }

  /** 探测一次后端是否可用 */
  function probe() {
    if (status.checked) { return Promise.resolve(status.online); }
    return req('ping', {}, { timeout: 4000, silent: true })
      .then(function () { markOnline(); return true; })
      .catch(function () { markOffline('后端不可达'); return false; });
  }

  // ---------------- 账号 ----------------
  function login(username, password) {
    return req('auth.login', { username: username, password: password }).then(function (d) {
      setToken(d.token);
      setUser(d.user);
      markOnline();
      return d;
    });
  }

  function register(username, password, nickname) {
    return req('auth.register', { username: username, password: password, nickname: nickname || username })
      .then(function (d) {
        setToken(d.token);
        setUser(d.user);
        markOnline();
        return d;
      });
  }

  function logout() {
    var p = token ? req('auth.logout', {}).catch(function () {}) : Promise.resolve();
    return p.then(function () {
      setToken('');
      setUser(null);
    });
  }

  function me() {
    if (!token) { return Promise.reject(new Error('未登录')); }
    return req('auth.me').then(function (d) {
      setUser(d.user);
      return d;
    });
  }

  /** 带自动重登的调用：令牌过期时清掉本地态，由 UI 引导重新登录 */
  function authed(action, params, opt) {
    return req(action, params, opt).catch(function (e) {
      if (e && (e.code === 'need_login' || e.httpStatus === 401)) {
        setToken('');
        setUser(null);
      }
      throw e;
    });
  }

  global.NET = {
    BASE: BASE,
    req: req,
    get: function (a, p, o) { return req(a, p, Object.assign({}, o, { method: 'GET' })); },
    authed: authed,
    probe: probe,
    login: login,
    register: register,
    logout: logout,
    me: me,
    status: status,
    isFile: isFile,
    getToken: function () { return token; },
    getUser: function () { return user; },
    setUser: setUser,
    isLoggedIn: function () { return !!token; }
  };
})(typeof window !== 'undefined' ? window : this);
