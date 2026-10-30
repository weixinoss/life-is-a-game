/* ============================================================
 *  js/net/session.js
 *  账号 UI：右上角胶囊、登录/注册浮层、游客模式提示
 *  ------------------------------------------------------------
 *  只负责「人与账号」的交互，不碰游戏逻辑。
 *  登录成功后广播 Session.onChange，其它模块据此开启联网玩法。
 * ============================================================ */
(function (global) {
  'use strict';

  var NET = global.NET;
  if (!NET) { return; }

  var listeners = [];
  var root = null;
  var modal = null;
  var mode = 'login';  // login | register
  var busy = false;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (html != null) { n.innerHTML = html; }
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, bad) {
    if (typeof global.zn === 'function') {
      try { global.zn(msg, bad ? 'rent' : 'moon'); return; } catch (e) {}
    }
    var t = document.getElementById('lnet-toast');
    if (!t) {
      t = el('div', 'lnet-toast');
      t.id = 'lnet-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'lnet-toast show' + (bad ? ' bad' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.className = 'lnet-toast'; }, 2600);
  }

  function emit() {
    var u = NET.getUser();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](u); } catch (e) { console.warn('[Session]', e); }
    }
  }

  // ------------------------------------------------------------
  // 右上角胶囊
  // ------------------------------------------------------------
  function buildBadge() {
    if (root) { return root; }
    root = el('div', 'lnet-acc');
    root.id = 'lnet-acc';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('.lnet-acc-login')) { open('login'); }
      else if (t.closest('.lnet-acc-logout')) {
        NET.logout().then(function () {
          renderBadge();
          emit();
          toast('已退出。现在玩的是游客存档。');
        });
      } else if (t.closest('.lnet-acc-body')) {
        togglePanel();
      }
    });
    return root;
  }

  function renderBadge() {
    buildBadge();
    var u = NET.getUser();
    if (!u) {
      root.innerHTML =
        '<button class="lnet-acc-login" type="button">登录 / 注册</button>' +
        '<span class="lnet-mode">游客</span>';
      return;
    }
    root.innerHTML =
      '<div class="lnet-acc-body">' +
        '<b>' + esc(u.nickname || u.username) + '</b>' +
        '<i>阴德 ' + (u.merit || 0) + '</i>' +
      '</div>' +
      '<div class="lnet-panel">' +
        '<div class="lnet-row"><span>阴德</span><b>' + (u.merit || 0) + '</b></div>' +
        '<div class="lnet-row"><span>可让阳寿</span><b>' + (u.lifespan || 0) + ' 天</b></div>' +
        '<div class="lnet-row"><span>明察声望</span><b>' + (u.judge_score || 0) + '</b></div>' +
        '<div class="lnet-row"><span>本赛季分</span><b>' + (u.season_score || 0) + '</b></div>' +
        (u.badge ? '<div class="lnet-badge">' + esc(u.badge) + '</div>' : '') +
        '<div class="lnet-links" id="lnet-links"></div>' +
        '<button class="lnet-acc-logout" type="button">退出登录</button>' +
      '</div>';
  }

  function togglePanel() {
    var p = root.querySelector('.lnet-panel');
    if (!p) { return; }
    p.classList.toggle('show');
  }

  // ------------------------------------------------------------
  // 登录 / 注册浮层
  // ------------------------------------------------------------
  function buildModal() {
    if (modal) { return modal; }
    modal = el('div', 'lnet-modal');
    modal.id = 'lnet-modal';
    modal.innerHTML =
      '<div class="lnet-card">' +
        '<button class="lnet-close" type="button" aria-label="关闭">×</button>' +
        '<h3 class="lnet-title">登录</h3>' +
        '<p class="lnet-sub">登录后，你这一世才会被记下来。</p>' +
        '<label>登录名</label>' +
        '<input class="lnet-user" type="text" autocomplete="username" maxlength="20" placeholder="3-20 位，中英文/数字/下划线">' +
        '<label>密码</label>' +
        '<input class="lnet-pass" type="password" autocomplete="current-password" maxlength="72" placeholder="至少 6 位">' +
        '<div class="lnet-nick-wrap" style="display:none">' +
          '<label>昵称（可选）</label>' +
          '<input class="lnet-nick" type="text" maxlength="20" placeholder="别人在榜上看到的名字">' +
        '</div>' +
        '<div class="lnet-err" style="display:none"></div>' +
        '<button class="lnet-submit" type="button">登录</button>' +
        '<div class="lnet-switch">还没有账号？<a href="#" class="lnet-tog">去注册</a></div>' +
        '<div class="lnet-tip">不登录也能玩，但存档只存在这台设备上。</div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) { close(); }
      if (e.target.closest('.lnet-close')) { close(); }
      if (e.target.closest('.lnet-tog')) {
        e.preventDefault();
        setMode(mode === 'login' ? 'register' : 'login');
      }
      if (e.target.closest('.lnet-submit')) { submit(); }
    });
    modal.querySelector('.lnet-pass').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { submit(); }
    });
    return modal;
  }

  function setMode(m) {
    mode = m;
    buildModal();
    var isReg = m === 'register';
    modal.querySelector('.lnet-title').textContent = isReg ? '注册' : '登录';
    modal.querySelector('.lnet-sub').textContent = isReg
      ? '注册后，你这一世才会被记下来。'
      : '登录后，你这一世才会被记下来。';
    modal.querySelector('.lnet-submit').textContent = isReg ? '注册并进入' : '登录';
    modal.querySelector('.lnet-nick-wrap').style.display = isReg ? '' : 'none';
    modal.querySelector('.lnet-switch').innerHTML = isReg
      ? '已有账号？<a href="#" class="lnet-tog">去登录</a>'
      : '还没有账号？<a href="#" class="lnet-tog">去注册</a>';
    err('');
  }

  function err(msg) {
    var box = modal.querySelector('.lnet-err');
    box.style.display = msg ? '' : 'none';
    box.textContent = msg || '';
  }

  function submit() {
    if (busy) { return; }
    buildModal();
    var u = modal.querySelector('.lnet-user').value.trim();
    var p = modal.querySelector('.lnet-pass').value;
    var n = modal.querySelector('.lnet-nick').value.trim();
    if (!u || !p) { err('登录名和密码都要填。'); return; }

    busy = true;
    var btn = modal.querySelector('.lnet-submit');
    btn.disabled = true;
    btn.textContent = '请稍候…';

    var p2 = mode === 'register' ? NET.register(u, p, n || u) : NET.login(u, p);
    p2.then(function () {
      close();
      renderBadge();
      emit();
      toast('欢迎回来，' + ((NET.getUser() || {}).nickname || u) + '。');
    }).catch(function (e) {
      err(e && e.message ? e.message : '失败了，再试一次。');
    }).then(function () {
      busy = false;
      btn.disabled = false;
      btn.textContent = mode === 'register' ? '注册并进入' : '登录';
    });
  }

  function open(m) {
    setMode(m || 'login');
    buildModal();
    modal.classList.add('show');
    setTimeout(function () {
      modal.querySelector('.lnet-user').focus();
    }, 60);
  }

  function close() {
    if (modal) { modal.classList.remove('show'); }
  }

  // ------------------------------------------------------------
  // 初始化
  // ------------------------------------------------------------
  function init() {
    renderBadge();
    // 已有令牌则静默校验一次
    if (NET.isLoggedIn()) {
      NET.me().then(function () {
        renderBadge();
        emit();
      }).catch(function () {
        renderBadge();
        emit();
      });
    }
    // 探测后端
    NET.probe().then(function (ok) {
      if (!ok) {
        var badge = document.getElementById('lnet-acc');
        if (badge) {
          var m = badge.querySelector('.lnet-mode');
          if (m) { m.textContent = '单机'; m.title = '后端未连接，存档仅存本地'; }
        }
      }
    });
  }

  global.Session = {
    init: init,
    open: open,
    close: close,
    refresh: function () { renderBadge(); emit(); },
    onChange: function (fn) { if (typeof fn === 'function') { listeners.push(fn); } },
    toast: toast,
    status: function () { return NET.status; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
