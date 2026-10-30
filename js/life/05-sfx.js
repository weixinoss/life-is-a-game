/* ============================================================
 *  js/life/05-sfx.js
 *  音效引擎 —— 全部用 WebAudio 现场合成，不加载任何音频文件
 *  ------------------------------------------------------------
 *  为什么不用 mp3：
 *   1. 开箱即用，不会因为音频路径不对而 404；
 *   2. 体积为 0，且每一声都能带随机扰动，听一百次也不会腻；
 *   3. 移动端不需要处理自动播放策略之外的额外兼容。
 *
 *  用法：
 *    SFX.play('dice')          // 掷骰
 *    SFX.play('coin', {v:.5})  // 音量减半
 *    SFX.loop('rain', true)    // 开雨声底噪
 *    SFX.setEnabled(false)     // 全局静音（记在 localStorage）
 * ============================================================ */
(function (global) {
  'use strict';

  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var enabled = true;
  var volume = 0.7;
  var loops = {};
  var unlocked = false;

  try {
    var e0 = localStorage.getItem('life_sfx');
    if (e0 === '0') { enabled = false; }
    var v0 = parseFloat(localStorage.getItem('life_sfx_vol'));
    if (v0 > 0 && v0 <= 1) { volume = v0; }
  } catch (e) {}

  function ensureCtx() {
    if (ctx) { return ctx; }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) { return null; }
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? volume : 0;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  /** 白噪声缓冲（雨声、纸声、骰子声共用） */
  function noise() {
    if (noiseBuf) { return noiseBuf; }
    var c = ensureCtx();
    if (!c) { return null; }
    var len = Math.floor(c.sampleRate * 1.2);
    noiseBuf = c.createBuffer(1, len, c.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function t0() {
    return ctx ? ctx.currentTime : 0;
  }

  /** 单音：波形 + 频率滑移 + 包络 */
  function tone(o) {
    var c = ensureCtx();
    if (!c || !enabled) { return; }
    var t = t0() + (o.delay || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.dur || 0.2));
    }
    var peak = (o.gain != null ? o.gain : 0.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.2));
    if (o.filter) {
      var f = c.createBiquadFilter();
      f.type = o.filter;
      f.frequency.value = o.fc || 800;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(master);
    osc.start(t);
    osc.stop(t + (o.dur || 0.2) + 0.05);
  }

  /** 噪声爆发：用于撞击、摩擦、雨 */
  function burst(o) {
    var c = ensureCtx();
    var buf = noise();
    if (!c || !buf || !enabled) { return; }
    var t = t0() + (o.delay || 0);
    var src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    var f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.fc || 1200, t);
    if (o.fc2) { f.frequency.exponentialRampToValueAtTime(Math.max(60, o.fc2), t + (o.dur || 0.15)); }
    f.Q.value = o.q != null ? o.q : 1;
    var g = c.createGain();
    var peak = o.gain != null ? o.gain : 0.16;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.15));
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
    src.stop(t + (o.dur || 0.15) + 0.05);
  }

  // ------------------------------------------------------------
  // 音色库
  // ------------------------------------------------------------
  var LIB = {

    /* 掷骰：木头在桌面上翻滚 —— 几声短促撞击 + 一次落定 */
    dice: function () {
      var n = 4 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) {
        burst({ delay: i * (0.055 + Math.random() * 0.03), fc: 1800 + Math.random() * 1200, fc2: 500,
                dur: 0.045 + Math.random() * 0.03, gain: 0.10 + Math.random() * 0.06, q: 0.9 });
      }
      burst({ delay: n * 0.07, fc: 420, fc2: 180, dur: 0.11, gain: 0.16, filter: 'lowpass', q: 1.4 });
    },

    /* 走一步：布料摩擦 + 轻落地 */
    step: function () {
      burst({ fc: 900, fc2: 300, dur: 0.06, gain: 0.055, q: 0.7 });
      tone({ f: 120, f2: 70, dur: 0.08, gain: 0.05, type: 'sine' });
    },

    /* 钱进来：清脆的两声金属 */
    coin: function () {
      tone({ f: 1320, f2: 1760, dur: 0.10, gain: 0.10, type: 'triangle' });
      tone({ f: 1760, f2: 2100, dur: 0.13, gain: 0.07, type: 'triangle', delay: 0.055 });
      burst({ fc: 5200, dur: 0.05, gain: 0.03, filter: 'highpass' });
    },

    /* 钱出去：闷一点 */
    spend: function () {
      tone({ f: 820, f2: 520, dur: 0.14, gain: 0.085, type: 'triangle' });
      burst({ fc: 600, fc2: 200, dur: 0.09, gain: 0.05, filter: 'lowpass' });
    },

    /* 翻牌 / 选项出现：纸张 */
    paper: function () {
      burst({ fc: 2600, fc2: 1400, dur: 0.09, gain: 0.055, q: 0.6, filter: 'bandpass' });
    },

    /* 选中：短促的木鱼感 */
    pick: function () {
      tone({ f: 640, f2: 380, dur: 0.10, gain: 0.12, type: 'sine' });
      burst({ fc: 1500, dur: 0.04, gain: 0.05 });
    },

    /* 来电：老式铃声，两声一组 */
    phone: function () {
      var base = 0.42;
      for (var k = 0; k < 2; k++) {
        for (var i = 0; i < 2; i++) {
          tone({ f: 880, dur: base * 0.36, gain: 0.09, type: 'sine', delay: k * base + i * 0.09 });
          tone({ f: 1180, dur: base * 0.36, gain: 0.055, type: 'sine', delay: k * base + i * 0.09 });
        }
      }
    },

    /* 接听：上行三度 */
    accept: function () {
      tone({ f: 520, dur: 0.09, gain: 0.10 });
      tone({ f: 780, dur: 0.12, gain: 0.09, delay: 0.07 });
    },

    /* 拒接：下行 */
    reject: function () {
      tone({ f: 420, f2: 240, dur: 0.18, gain: 0.10, type: 'triangle' });
    },

    /* 季末体检：打印机走纸 */
    report: function () {
      for (var i = 0; i < 5; i++) {
        burst({ delay: i * 0.075, fc: 1800 + Math.random() * 900, dur: 0.05, gain: 0.04, q: 0.5 });
      }
      tone({ f: 300, f2: 200, dur: 0.3, gain: 0.05, delay: 0.36 });
    },

    /* 警告 / 体力不支 */
    warn: function () {
      tone({ f: 220, dur: 0.14, gain: 0.11, type: 'square' });
      tone({ f: 180, dur: 0.16, gain: 0.09, type: 'square', delay: 0.13 });
    },

    /* 结局：三个下行长音，带一点混响感 */
    ending: function () {
      var seq = [[392, 0], [329.6, 0.42], [261.6, 0.86], [196, 1.36]];
      for (var i = 0; i < seq.length; i++) {
        tone({ f: seq[i][0], dur: 1.6, gain: 0.075, type: 'sine', delay: seq[i][1], attack: 0.05 });
        tone({ f: seq[i][0] * 2, dur: 1.2, gain: 0.022, type: 'sine', delay: seq[i][1], attack: 0.06 });
      }
    },

    /* 开局：一声清亮的钟 */
    start: function () {
      tone({ f: 523.3, dur: 0.9, gain: 0.10, type: 'sine', attack: 0.01 });
      tone({ f: 784, dur: 0.7, gain: 0.05, type: 'sine', delay: 0.02 });
      tone({ f: 1046, dur: 0.5, gain: 0.03, type: 'sine', delay: 0.04 });
    },

    /* 天命 / 业力：一声低沉的钟鼓 */
    fate: function () {
      tone({ f: 146.8, f2: 98, dur: 1.4, gain: 0.13, type: 'sine', attack: 0.02 });
      burst({ fc: 320, fc2: 120, dur: 0.5, gain: 0.06, filter: 'lowpass', q: 1.2 });
    },

    /* 香火 / 祈愿：细碎的铃 */
    bell: function () {
      for (var i = 0; i < 3; i++) {
        tone({ f: 2100 + i * 260, dur: 0.42, gain: 0.028, type: 'sine', delay: i * 0.055 });
      }
    },

    /* 翻页 / 榜单：短风 */
    whoosh: function () {
      burst({ fc: 700, fc2: 3000, dur: 0.20, gain: 0.05, q: 0.5 });
    }
  };

  // ------------------------------------------------------------
  // 循环底噪（雨声 / 雪声 / 夜虫）
  // ------------------------------------------------------------
  function startLoop(name) {
    var c = ensureCtx();
    var buf = noise();
    if (!c || !buf || loops[name]) { return; }
    var src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    var f = c.createBiquadFilter();
    var g = c.createGain();
    g.gain.value = 0;

    if (name === 'rain') {
      f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.35;
      g.gain.linearRampToValueAtTime(0.030, c.currentTime + 1.2);
    } else if (name === 'storm') {
      f.type = 'lowpass'; f.frequency.value = 1400;
      g.gain.linearRampToValueAtTime(0.055, c.currentTime + 1.2);
    } else if (name === 'snow') {
      f.type = 'lowpass'; f.frequency.value = 500;
      g.gain.linearRampToValueAtTime(0.028, c.currentTime + 2.0);
    } else {
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.linearRampToValueAtTime(0.02, c.currentTime + 1.0);
    }
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
    loops[name] = { src: src, gain: g, filter: f };
  }

  function stopLoop(name) {
    var l = loops[name];
    if (!l || !ctx) { return; }
    try {
      l.gain.gain.cancelScheduledValues(ctx.currentTime);
      l.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      l.src.stop(ctx.currentTime + 0.7);
    } catch (e) {}
    delete loops[name];
  }

  // ------------------------------------------------------------
  // 对外
  // ------------------------------------------------------------
  function unlock() {
    if (unlocked) { return; }
    var c = ensureCtx();
    if (!c) { return; }
    if (c.state === 'suspended') {
      c.resume().catch(function () {});
    }
    unlocked = true;
  }

  function play(name, opt) {
    if (!enabled) { return; }
    opt = opt || {};
    unlock();
    var fn = LIB[name];
    if (!fn) { return; }
    try {
      if (opt.v != null && ctx && master) {
        // 临时改总音量会让并发音重叠，这里用单独的一次性增益更稳
        var old = master.gain.value;
        master.gain.value = Math.max(0.0001, old * opt.v);
        fn();
        setTimeout(function () { if (master) { master.gain.value = old; } }, (opt.hold || 900));
      } else {
        fn();
      }
    } catch (e) {}
  }

  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem('life_sfx', enabled ? '1' : '0'); } catch (e) {}
    if (master && ctx) {
      master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.05);
    }
    if (!enabled) {
      for (var k in loops) { stopLoop(k); }
    }
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem('life_sfx_vol', String(volume)); } catch (e) {}
    if (master && ctx && enabled) {
      master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }

  /** 按天气切底噪 */
  function ambience(weather, isNight) {
    if (!enabled) { return; }
    unlock();
    var want = weather === 'rain' ? 'rain'
      : weather === 'storm' ? 'storm'
      : weather === 'snow' ? 'snow'
      : (isNight ? 'night' : '');
    for (var k in loops) {
      if (k !== want) { stopLoop(k); }
    }
    if (want) { startLoop(want); }
  }

  // 首次交互解锁
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    global.addEventListener(ev, unlock, { once: true, passive: true });
  });

  global.SFX = {
    play: play,
    loop: function (name, on) { if (on) { startLoop(name); } else { stopLoop(name); } },
    ambience: ambience,
    setEnabled: setEnabled,
    setVolume: setVolume,
    isEnabled: function () { return enabled; },
    volume: function () { return volume; },
    unlock: unlock
  };
})(typeof window !== 'undefined' ? window : this);
