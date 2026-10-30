/* ============================================================
 *  主控：渲染 / 漫游 / 拾取问典 / 仪式互动
 * ============================================================ */
(function () {
  const T = window.THREE;
  const D = MJ.DATA;

  /* ---------- 区域视点 ---------- */
  const VIEWS = {
    gate: { pos: [0, 7, 82], look: [0, 9, 0] },
    road: { pos: [0, 5, -230], look: [0, 4, -340] },
    bridge: { pos: [0, 8, -556], look: [0, 3, -664] },
    mirror: { pos: [2, 10, -888], look: [6, 9, -950] },
    yama: { pos: [0, 12, -1188], look: [0, 9, -1256] },
    hell: { pos: [0, 16, -1486], look: [0, -46, -1580] },
    samsara: { pos: [0, 15, -1826], look: [0, 27, -1900] }
  };
  const ORDER = ['gate', 'road', 'bridge', 'mirror', 'yama', 'hell', 'samsara'];

  /* ---------- 渲染器 ---------- */
  const canvas = document.getElementById('scene');
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    document.getElementById('loading').innerHTML =
      '<span style="letter-spacing:2px;line-height:2;text-align:center">' +
      '此浏览器未能开启 WebGL，鬼门不开。<br>请更换较新的浏览器，或在设置中开启硬件加速后重试。</span>';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.25 : 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x0b0709, 0.0026);
  const camera = new T.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 3200);
  camera.rotation.order = 'YXZ';

  scene.add(new T.AmbientLight(0x2b2438, 1.1));
  scene.add(new T.HemisphereLight(0x48161e, 0x07060a, 1.05));
  const moon = new T.DirectionalLight(0x8a7a9a, 0.5);
  moon.position.set(-120, 220, 140);
  scene.add(moon);
  const camLight = new T.PointLight(0xffb982, 6, 70, 2);
  scene.add(camLight);

  /* ---------- 世界 ---------- */
  let world = null;
  MJ.__scene = scene; MJ.__camera = camera;   // 调试入口

  /* ---------- 相机状态 ---------- */
  const cam = {
    pos: new T.Vector3(0, 7, 130),
    yaw: 0, pitch: -0.04,
    vel: new T.Vector3(),
    moving: false
  };
  let tween = null;

  function applyCam() {
    camera.position.copy(cam.pos);
    camera.rotation.set(cam.pitch, cam.yaw, 0);
    camLight.position.copy(cam.pos);
  }

  function dirVectors() {
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const fwd = new T.Vector3(-Math.sin(cam.yaw) * cp, sp, -Math.cos(cam.yaw) * cp);
    const flat = new T.Vector3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
    const right = new T.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
    return { fwd: fwd, flat: flat, right: right };
  }

  function lookFrom(pos, look) {
    const dx = look[0] - pos[0], dy = look[1] - pos[1], dz = look[2] - pos[2];
    const len = Math.hypot(dx, dy, dz);
    return { yaw: Math.atan2(-dx, -dz), pitch: Math.asin(dy / len) };
  }

  function flyTo(id, dur) {
    const v = VIEWS[id];
    if (!v) return;
    const l = lookFrom(v.pos, v.look);
    let y0 = cam.yaw;
    // 取最短角差
    while (l.yaw - y0 > Math.PI) l.yaw -= Math.PI * 2;
    while (l.yaw - y0 < -Math.PI) l.yaw += Math.PI * 2;
    tween = {
      t: 0, d: dur || 1.7,
      p0: cam.pos.clone(), p1: new T.Vector3(v.pos[0], v.pos[1], v.pos[2]),
      y0: y0, y1: l.yaw, x0: cam.pitch, x1: l.pitch
    };
    setActive(id);
  }

  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  function updateTween(dt) {
    if (!tween) return;
    tween.t += dt;
    const k = Math.min(1, tween.t / tween.d), e = ease(k);
    cam.pos.lerpVectors(tween.p0, tween.p1, e);
    cam.yaw = tween.y0 + (tween.y1 - tween.y0) * e;
    cam.pitch = tween.x0 + (tween.x1 - tween.x0) * e;
    if (k >= 1) { tween = null; if (tour.on) tour.wait = TOUR_HOLD; }
  }

  /* ---------- 输入 ---------- */
  const keys = {};
  const ptrs = new Map();          // 多点触控：1 指转视，2 指前后
  let twoBase = 0;
  let dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0, downT = 0, moved = 0;

  function ptrAvg() {
    let y = 0;
    ptrs.forEach(function (p) { y += p.y; });
    return y / ptrs.size;
  }

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.active = true;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) {
      dragging = true; moved = 0;
      lastX = downX = e.clientX; lastY = downY = e.clientY;
      downT = performance.now();
      canvas.classList.add('dragging');
    } else {
      dragging = false;
      twoBase = ptrAvg();
      moved = 99; // 双指视为拖动，不触发点击
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size >= 2) {
      const a = ptrAvg();
      const d = dirVectors();
      cam.pos.addScaledVector(d.fwd, (twoBase - a.y) * 0.16);
      twoBase = a;
      clampY();
      moved += 2;
    } else if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      cam.yaw -= dx * 0.0032;
      cam.pitch -= dy * 0.0032;
      cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch));
    }
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.active = true;
  });
  function ptrEnd(e) {
    ptrs.delete(e.pointerId);
    if (ptrs.size === 1) {
      // 从双指回到单指，重置旋转基准
      let p = null; ptrs.forEach(function (v) { p = v; });
      if (p) { lastX = p.x; lastY = p.y; }
      dragging = true;
    }
    if (ptrs.size === 0) {
      dragging = false;
      canvas.classList.remove('dragging');
      const dt = performance.now() - downT;
      if (moved < 8 && dt < 500) { pick(); }
    }
  }
  canvas.addEventListener('pointerup', ptrEnd);
  canvas.addEventListener('pointercancel', ptrEnd);
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    const d = dirVectors();
    const s = e.deltaY > 0 ? -1 : 1;
    cam.pos.addScaledVector(d.fwd, s * 6);
    clampY();
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k >= '1' && k <= '7') { const id = ORDER[+k - 1]; if (id) { stopTour(); flyTo(id); } }
    if (k === 'h') document.body.classList.toggle('bare');
    if (k === 'escape') { closePanel(); closeRitual(); closeHelp(); }
    if (k === ' ') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { for (const k in keys) keys[k] = false; });

  function clampY() {
    const h = world ? world.terrainH(cam.pos.x, cam.pos.z) : 0;
    const min = Math.min(h + 1.6, 26);
    if (cam.pos.y < min) cam.pos.y = min;
  }

  /* ---------- 拾取 ---------- */
  const ray = new T.Raycaster();
  const pointer = { x: 0, y: 0, active: false };
  let hovered = null;
  const seen = new Set();

  function castAt(x, y) {
    if (!world) return null;
    const ndc = new T.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(world.picks, false);
    for (let i = 0; i < hits.length; i++) { if (hits[i].object.visible) return hits[i].object; }
    return null;
  }

  function hoverTick() {
    if (!world || !pointer.active || tween) { setHover(null); return; }
    if (panelOpen) { setHover(null); return; }
    const o = castAt(pointer.x, pointer.y);
    setHover(o);
  }

  function setHover(o) {
    if (hovered === o) return;
    hovered = o;
    const tip = document.getElementById('hoverTip');
    const ch = document.getElementById('crosshair');
    if (o && o.userData.pick) {
      tip.textContent = o.userData.pick.title;
      tip.classList.add('on');
      ch.classList.add('hot');
      canvas.style.cursor = 'pointer';
    } else {
      tip.classList.remove('on');
      ch.classList.remove('hot');
      canvas.style.cursor = '';
    }
  }

  function pick() {
    const o = castAt(pointer.x, pointer.y);
    if (!o || !o.userData.pick) return;
    openPanel(o.userData.pick);
    seen.add(o.userData.pick);
    document.getElementById('seenCount').textContent = seen.size;
    MJ.Audio.bell(180, 2.2, 0.1);
  }

  /* ---------- 面板 ---------- */
  let panelOpen = false;
  const panel = document.getElementById('panel');

  function openPanel(d) {
    panelOpen = true;
    panel.classList.remove('hidden');
    document.getElementById('pTitle').textContent = d.title;
    document.getElementById('pSub').textContent = d.sub || '';
    const body = document.getElementById('pBody');
    body.innerHTML = '';
    const lines = (d.body || '').split('\n').filter(function (s) { return s.trim(); });
    const isList = lines.length > 3 && lines[0].indexOf('：') > -1;
    if (isList) {
      lines.forEach(function (ln) {
        const i = ln.indexOf('：');
        const row = document.createElement('div');
        row.className = 'li';
        const b = document.createElement('b'); b.textContent = i > 0 ? ln.slice(0, i + 1) : '';
        const s = document.createElement('span'); s.textContent = i > 0 ? ln.slice(i + 1) : ln;
        row.appendChild(b); row.appendChild(s);
        body.appendChild(row);
      });
    } else {
      lines.forEach(function (ln) {
        const p = document.createElement('p'); p.textContent = ln; body.appendChild(p);
      });
    }
    const q = document.getElementById('pQuote');
    q.textContent = d.quote || '';
    q.style.display = d.quote ? '' : 'none';

    const acts = document.getElementById('pActions');
    acts.innerHTML = '';
    const A = {
      mirror: ['照 孽 镜', '孽镜台前，自见其心'],
      soup: ['饮孟婆汤', '一碗忘情水，前尘尽成灰'],
      stone: ['问 三 生', '前世今生，来世重逢'],
      wheel: ['转 轮 盘', '轮推磨转，业力自召'],
      wangxiang: ['登台望乡', '最后一眼阳世']
    };
    if (d.action && A[d.action]) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = A[d.action][0];
      btn.onclick = function () { openRitual(d.action); };
      acts.appendChild(btn);
    }
    // 前往该处的按钮
    const areaBtn = document.createElement('button');
    areaBtn.className = 'btn ghost';
    areaBtn.textContent = '继续前行';
    areaBtn.onclick = function () { closePanel(); nextArea(); };
    acts.appendChild(areaBtn);
  }

  function closePanel() { panel.classList.add('hidden'); panelOpen = false; }
  document.getElementById('pClose').onclick = closePanel;

  /* ---------- 仪式互动 ---------- */
  const ritual = document.getElementById('ritual');
  let ritualAction = null;

  function openRitual(action) {
    ritualAction = action;
    ritual.classList.remove('hidden');
    document.getElementById('rResult').classList.add('hidden');
    const inp = document.getElementById('rInputWrap');
    const btn = document.getElementById('rBtn');
    const cfg = {
      mirror: ['孽 镜 台', '台高一丈，镜大十围，向东悬挂，上横七字：孽镜台前无好人。<br>写下姓名，镜中自见一生善恶。', '照　镜', true],
      soup: ['孟 婆 汤', '孟婆以忘川水熬成此汤，饮之则忘却前世今生。<br>你确定要饮下这一碗么？', '饮　下', false],
      stone: ['三 生 石', '石上字红如血，刻「早登彼岸」。它记载每个人的前世、今生与来世。', '问　缘', false],
      wheel: ['六道轮回', '轮分六道，随业自转。转动轮盘，看你此番业力落在哪一道。', '转　轮', false],
      wangxiang: ['望 乡 台', '「一天不吃人间饭，两天就过阴阳界，三天到达望乡台。」<br>登台一望，最后看一眼阳世。', '登　台', false]
    }[action];
    document.getElementById('rTitle').textContent = cfg[0];
    document.getElementById('rDesc').innerHTML = cfg[1];
    btn.textContent = cfg[2];
    inp.classList.toggle('hidden', !cfg[3]);
    if (cfg[3]) setTimeout(function () { document.getElementById('rInput').focus(); }, 100);
  }

  function closeRitual() { ritual.classList.add('hidden'); ritualAction = null; }
  document.getElementById('rBtn').onclick = doRitual;
  MJ.__ritual = openRitual;   // 调试入口

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619); }
    return h >>> 0;
  }

  function showResult(title, html, poem) {
    const r = document.getElementById('rResult');
    r.classList.remove('hidden');
    r.innerHTML = '<h4>' + title + '</h4><div>' + html + '</div>' + (poem ? '<div class="poem">' + poem + '</div>' : '');
  }

  const PREV = [
    '你曾是江南雨巷里撑伞的人，欠了一世的回眸。',
    '你曾是边城戍卒，望断烽火十八年。',
    '你曾是一株老梅，看过十三场大雪。',
    '你曾是账簿上的一笔朱砂，也是他人心头的一根刺。',
    '你曾是渡口的船夫，摆渡过三千个不肯忘的人。'
  ];
  const NOW = [
    '今生你行于人间，忙忙碌碌，多半是为他人。',
    '今生你有一张不肯认输的嘴，和一颗很软的心。',
    '今生你爱过一个人，也负过一个人，两不相欠。',
    '今生你走过的路，恰是前世发愿要走的。',
    '今生你常觉似曾相识，那不是错觉。'
  ];
  const NEXT = [
    '来世你若能记得一句诗，便不算全忘。',
    '来世相逢于陌上，你先开口，便是你了。',
    '来世仍有旧债未清，须还一碗茶、一句话。',
    '来世或为人，或为风，皆在这一念之间。',
    '来世不必寻我，风起时我便在。'
  ];
  const WANG = [
    '你看见堂前灵位已撤，儿孙正分你的旧物，为一个铜炉争得面红耳赤。',
    '你看见老妻独坐灯下，把你未写完的信又读了一遍，然后添了柴。',
    '你看见故友来过一次，坐了半刻便走，出门时抹了把脸。',
    '你看见院中那棵树还在，只是再无人替你浇水。',
    '你看见账本被翻出，欠你的都成了糊涂账，你欠的却记得分明。'
  ];

  function doRitual() {
    if (!ritualAction) return;
    const a = ritualAction;
    if (a === 'mirror') {
      const name = (document.getElementById('rInput').value || '无名').trim() || '无名';
      const h = hashStr(name + '幽冥');
      const score = h % 100;
      let v;
      if (score >= 78) v = D.verdicts.good[0];
      else if (score >= 55) v = D.verdicts.good[1];
      else if (score >= 34) v = D.verdicts.good[2];
      else if (score >= 18) v = D.verdicts.bad[0];
      else if (score >= 7) v = D.verdicts.bad[1];
      else v = D.verdicts.bad[2];
      showResult(v.title,
        '镜中显形——<b>' + name + '</b>，业秤之上，善恶之数为 <b>' + score + '</b> / 100。<br>' + v.text,
        '孽镜台前无好人，万两黄金带不来。');
      flash('mirror', 900);
      if (world && world.refs.mirMat) {
        world.refs.mirMat.uniforms.uOn.value = 1;
        setTimeout(function () { if (world) world.refs.mirMat.uniforms.uOn.value = 0; }, 3200);
      }
      MJ.Audio.bell(72, 6, 0.2);
    } else if (a === 'soup') {
      showResult('一碗忘情水',
        '汤入喉，先是苦，后是淡，最后什么味道也没有了。<br>你忘了来路，忘了名字，忘了那个一直等着你的人。<br>桥那头，有人在喊你——你回头，却不认识。',
        '今生牵挂之人，来生相见不识。');
      flash('soup', 2200);
      MJ.Audio.drip();
    } else if (a === 'stone') {
      const r = hashStr(String(Date.now()));
      showResult('三生石上',
        '<b>前世</b>：' + PREV[r % PREV.length] + '<br><br>' +
        '<b>今生</b>：' + NOW[(r >> 3) % NOW.length] + '<br><br>' +
        '<b>来世</b>：' + NEXT[(r >> 7) % NEXT.length],
        '三生石上旧精魂，赏月吟风莫要论。');
      MJ.Audio.bell(320, 3, 0.12);
    } else if (a === 'wheel') {
      const w = world && world.refs.wheel;
      showResult('轮盘转动…', '业力自召，轮盘不止。', '');
      if (w && !w.userData.spinning) {
        w.userData.spinning = true;
        w.userData.speed = 7 + Math.random() * 5;
        w.userData.boost = 2.4;
        w.userData.onStop = function () {
          const local = ((Math.PI / 2 - w.rotation.z) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const idx = Math.floor(local / (Math.PI / 3)) % 6;
          const p = D.sixPaths[idx];
          showResult('落于 ' + p.name, p.d,
            (p.type === '善' ? '善业所感，' : '恶业所牵，') + '此道非阎王所能私与人情。');
          flash('wheel', 600);
          MJ.Audio.bell(140, 3.5, 0.16);
        };
      }
    } else if (a === 'wangxiang') {
      const r = hashStr(String(Date.now() >> 10));
      showResult('望乡台上', WANG[r % WANG.length] + '<br><br>你大哭一声，才死心塌地前往阴曹。',
        '望乡台上鬼仓皇，望眼睁睁泪两行。');
      MJ.Audio.bell(88, 4, 0.14);
    }
  }

  function flash(cls, ms) {
    const f = document.getElementById('flash');
    f.className = cls;
    f.style.opacity = '1';
    setTimeout(function () { f.style.opacity = '0'; }, ms || 700);
    setTimeout(function () { f.className = ''; }, (ms || 700) + 1600);
  }

  /* ---------- 浮层关闭 ---------- */
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.onclick = function () {
      const id = b.getAttribute('data-close');
      if (id === 'help') closeHelp(); else closeRitual();
    };
  });
  ritual.addEventListener('click', function (e) { if (e.target === ritual) closeRitual(); });
  document.getElementById('help').addEventListener('click', function (e) {
    if (e.target === document.getElementById('help')) closeHelp();
  });
  function closeHelp() { document.getElementById('help').classList.add('hidden'); }
  document.getElementById('btnHelp').onclick = function () {
    document.getElementById('help').classList.toggle('hidden');
  };

  /* ---------- 导航 ---------- */
  const navList = document.getElementById('navList');
  let activeId = 'gate';

  function buildNav() {
    navList.innerHTML = '';
    const SHORT = { gate: '鬼门关', road: '黄泉路', bridge: '忘川', mirror: '孽镜', yama: '阎罗殿', hell: '地狱', samsara: '轮回' };
    const narrow = window.innerWidth < 820;
    D.areas.forEach(function (a, i) {
      const li = document.createElement('li');
      li.innerHTML = '<i>' + (i + 1) + '</i><span>' + (narrow ? SHORT[a.id] : a.name) + '</span>';
      li.onclick = function () { stopTour(); flyTo(a.id); };
      li.dataset.id = a.id;
      navList.appendChild(li);
    });
    setActive('gate');
  }

  function setActive(id) {
    activeId = id;
    navList.querySelectorAll('li').forEach(function (li) {
      li.classList.toggle('active', li.dataset.id === id);
    });
    const a = D.areas.find(function (x) { return x.id === id; });
    document.getElementById('crumb').textContent = a ? (a.name + ' · ' + a.sub) : '';
  }

  function nextArea() {
    const i = ORDER.indexOf(activeId);
    const n = ORDER[(i + 1) % ORDER.length];
    flyTo(n);
  }

  /* ---------- 自动引路 ---------- */
  const TOUR_HOLD = 7.5;
  const tour = { on: false, wait: 0 };
  document.getElementById('btnTour').onclick = function () {
    if (tour.on) stopTour();
    else {
      tour.on = true;
      this.classList.add('on');
      this.textContent = '止步';
      flyTo(ORDER[0]);
    }
  };
  function stopTour() {
    tour.on = false; tour.wait = 0;
    const b = document.getElementById('btnTour');
    b.classList.remove('on'); b.textContent = '自动引路';
  }

  /* ---------- 明暗 / 阴气 ---------- */
  document.getElementById('litRange').addEventListener('input', function () {
    renderer.toneMappingExposure = this.value / 100;
  });
  document.getElementById('fogRange').addEventListener('input', function () {
    scene.fog.density = this.value / 10000;
  });

  /* ---------- 声音 ---------- */
  const btnSound = document.getElementById('btnSound');  btnSound.onclick = function () {
    if (MJ.Audio.on) { MJ.Audio.stop(); this.classList.remove('on'); this.textContent = '幽冥之声'; }
    else { MJ.Audio.start(); this.classList.add('on'); this.textContent = '止　声'; }
  };

  /* ---------- 触摸行走键 ---------- */
  document.querySelectorAll('#touchPad button').forEach(function (b) {
    const k = b.dataset.k;
    const on = function (e) { e.preventDefault(); keys[k] = true; };
    const off = function (e) { e.preventDefault(); keys[k] = false; };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  });

  /* ---------- 主循环 ---------- */
  let last = performance.now(), tAcc = 0, frame = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.06, (now - last) / 1000);
    last = now;
    tAcc += dt;
    frame++;

    updateTween(dt);

    if (!tween && !panelOpen) {
      const d = dirVectors();
      const speed = (keys['shift'] ? 46 : 17) * dt;
      let mv = false;
      if (keys['w'] || keys['arrowup']) { cam.pos.addScaledVector(d.flat, speed); mv = true; }
      if (keys['s'] || keys['arrowdown']) { cam.pos.addScaledVector(d.flat, -speed); mv = true; }
      if (keys['a'] || keys['arrowleft']) { cam.pos.addScaledVector(d.right, -speed * 0.85); mv = true; }
      if (keys['d'] || keys['arrowright']) { cam.pos.addScaledVector(d.right, speed * 0.85); mv = true; }
      if (keys[' ']) { cam.pos.y += speed * 0.9; mv = true; }
      if (keys['c'] || keys['control']) { cam.pos.y -= speed * 0.9; mv = true; }
      if (mv) {
        clampY();
        tween = null;
        // 判定当前所处区域
        let best = activeId, bd = 1e9;
        for (const id of ORDER) {
          const dd = Math.abs(cam.pos.z - world.Z[id]);
          if (dd < bd) { bd = dd; best = id; }
        }
        if (best !== activeId) setActive(best);
      }
    }

    if (tour.on && !tween) {
      tour.wait -= dt;
      if (tour.wait <= 0) {
        const i = ORDER.indexOf(activeId);
        flyTo(ORDER[(i + 1) % ORDER.length], 2.6);
      }
    }

    applyCam();
    if (world) world.update(tAcc, dt);
    if (frame % 3 === 0) hoverTick();

    renderer.render(scene, camera);
  }

  /* ---------- 尺寸 ---------- */
  let wasNarrow = window.innerWidth < 820;
  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const narrow = window.innerWidth < 820;
    if (narrow !== wasNarrow) { wasNarrow = narrow; buildNav(); }
  }
  window.addEventListener('resize', resize);

  /* ---------- 轻提示 ---------- */
  let toastTimer = null;
  function toast(msg, ms) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, ms || 3600);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    world = MJ.World.build(scene);
    document.getElementById('seenTotal').textContent = world.picks.length;
    buildNav();
    applyCam();
    document.getElementById('loading').classList.add('out');
    setTimeout(function () { document.getElementById('loading').style.display = 'none'; }, 900);
    requestAnimationFrame(loop);

    // 可分享至指定区域：?area=hell
    const q = new URLSearchParams(location.search).get('area');
    if (q && VIEWS[q]) { pendingArea = q; }
  }

  let pendingArea = null;

  document.getElementById('enter').onclick = function () {
    document.getElementById('intro').classList.add('out');
    setTimeout(function () { document.getElementById('intro').style.display = 'none'; }, 1300);
    MJ.Audio.start();
    btnSound.classList.add('on');
    btnSound.textContent = '止　声';
    // 入场：自远处推入鬼门关
    cam.pos.set(0, 9, 190);
    cam.yaw = 0; cam.pitch = -0.05;
    setTimeout(function () {
      if (pendingArea) { cam.pos.set(0, 9, 190); flyTo(pendingArea, 2.2); }
      else flyTo('gate', 3.4);
    }, 200);
    setTimeout(function () { toast('拖动转视 · WASD 行走 · 点击场景中的事物可问典', 5200); }, 4200);
  };

  // 延迟一帧构建，先让载入页显示
  setTimeout(boot, 60);
})();
