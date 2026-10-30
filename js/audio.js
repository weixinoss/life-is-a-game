/* ============================================================
 *  幽冥氛围音（WebAudio 实时合成，无外部音频文件）
 * ============================================================ */
window.MJ = window.MJ || {};

MJ.Audio = (function () {
  let ctx = null, master = null, nodes = [], timer = null, on = false;

  function noiseBuffer(c) {
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function start() {
    if (on) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);

    // 低频地脉嗡鸣
    [46, 46.7, 69].forEach(function (f, i) {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 190; lp.Q.value = 3;
      const g = ctx.createGain(); g.gain.value = i === 2 ? 0.05 : 0.09;
      // 缓慢起伏
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = 0.04;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      o.connect(lp); lp.connect(g); g.connect(master); o.start();
      nodes.push(o, lfo);
    });

    // 阴风
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.8;
    const wg = ctx.createGain(); wg.gain.value = 0.10;
    const wlfo = ctx.createOscillator(); wlfo.frequency.value = 0.07;
    const wlg = ctx.createGain(); wlg.gain.value = 0.07;
    wlfo.connect(wlg); wlg.connect(wg.gain); wlfo.start();
    src.connect(bp); bp.connect(wg); wg.connect(master); src.start();
    nodes.push(src, wlfo);

    on = true;
    schedule();
  }

  function bell(freq, dur, gain) {
    if (!on || !ctx) return;
    const t = ctx.currentTime;
    [1, 2.01, 2.98].forEach(function (m, i) {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = freq * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain / (i + 1.4), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.1);
    });
  }

  function drip() {
    if (!on || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.10, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.6);
  }

  function schedule() {
    clearTimeout(timer);
    const next = 5000 + Math.random() * 11000;
    timer = setTimeout(function () {
      if (!on) return;
      if (Math.random() < 0.45) bell(96 + Math.random() * 40, 5.5, 0.16);
      else drip();
      schedule();
    }, next);
  }

  function stop() {
    if (!on) return;
    on = false;
    clearTimeout(timer);
    try {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(function () {
        nodes.forEach(function (n) { try { n.stop(); } catch (e) { } });
        try { ctx.close(); } catch (e) { }
        nodes = []; ctx = null;
      }, 700);
    } catch (e) { }
  }

  return {
    start: start, stop: stop, bell: bell, drip: drip,
    get on() { return on; }
  };
})();
