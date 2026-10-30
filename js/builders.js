/* ============================================================
 *  冥界世界构建：地形 / 七大区域 / 可交互对象
 * ============================================================ */
window.MJ = window.MJ || {};

MJ.World = (function () {
  const T = window.THREE;
  const U = MJ.U;
  const D = MJ.DATA;

  /* ---------- 区域轴向位置（沿 -Z 铺开一条冥途） ---------- */
  const Z = {
    gate: 0, road: -300, bridge: -640, mirror: -960,
    yama: -1260, hell: -1580, samsara: -1900
  };
  const HELL_R = 78;      // 地狱井口半径
  const HELL_BOTTOM = -172;

  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  /* ---------- 地形高度场 ---------- */
  function terrainH(x, z) {
    let h = (U.fbm(x * 0.011 + 40, z * 0.011 + 40) - 0.46) * 34;
    const roadK = smoothstep(16, 90, Math.abs(x));
    h *= roadK;
    h += Math.max(0, Math.abs(x) - 110) * 0.42 * U.noise2(x * 0.02, z * 0.02);

    // 建筑广场平整（椭圆范围）
    const plazas = [[Z.gate, 66], [Z.mirror, 70], [Z.yama, 72], [Z.bridge, 62]];
    for (const pz of plazas) {
      const dx = x, dz = z - pz[0];
      const d = Math.sqrt(dx * dx + dz * dz * 0.55);
      if (d < pz[1]) {
        const k = 1 - smoothstep(pz[1] - 30, pz[1], d);
        h = h * (1 - k);
      }
    }

    // 忘川河道（横穿冥途）
    const rz = Math.abs(z - Z.bridge);
    if (rz < 46) {
      const k = 1 - smoothstep(16, 46, rz);
      h = h * (1 - k) + (-7.5) * k;
    }
    // 地狱漏斗井
    const hx = x, hz = z - Z.hell;
    const hr = Math.sqrt(hx * hx + hz * hz);
    if (hr < HELL_R + 30) {
      const k = 1 - smoothstep(26, HELL_R + 26, hr);
      h = h * (1 - k) + (HELL_BOTTOM - 12) * k;
      if (hr < 26) h = HELL_BOTTOM - 12;
    }
    // 轮回广场
    const sx = x, sz = z - Z.samsara;
    const sr = Math.sqrt(sx * sx + sz * sz);
    if (sr < 90) {
      const k = 1 - smoothstep(34, 90, sr);
      h = h * (1 - k) + 1.2 * k;
    }
    return h;
  }

  /* ---------- 主构建 ---------- */
  function build(scene) {
    const picks = [];        // 可交互目标
      const updaters = [];     // 每帧更新
      const lights = [];
      const refs = {};         // 供外部互动调用的对象
      const areaGroups = [];   // 按距离整组剔除，控制绘制批次

      function registerArea(g, cz) { g.userData.centerZ = cz; areaGroups.push(g); return g; }

    const root = new T.Group();
    scene.add(root);

    /* ===== 天空穹顶 ===== */
    const skyMat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false,
      uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}',
      fragmentShader: [
        'varying vec3 vP; uniform float uT;',
        'float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
        'float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);',
        ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
        'void main(){',
        ' vec3 d = normalize(vP);',
        ' float up = clamp(d.y*0.5+0.5, 0.0, 1.0);',
        ' vec3 top = vec3(0.02,0.015,0.035);',
        ' vec3 mid = vec3(0.09,0.03,0.06);',
        ' vec3 bot = vec3(0.16,0.045,0.03);',
        ' vec3 c = mix(bot, mid, smoothstep(0.0,0.42,up));',
        ' c = mix(c, top, smoothstep(0.35,0.85,up));',
        ' float cl = n(d.xz*3.0 + vec2(uT*0.012, uT*0.005));',
        ' cl = smoothstep(0.45,0.95,cl*0.6+0.35);',
        ' c += vec3(0.12,0.03,0.015)*cl*0.55*(1.0-up*0.6);',
        ' gl_FragColor = vec4(c,1.0);}'
      ].join('\n')
    });
    const sky = new T.Mesh(new T.SphereGeometry(1400, 32, 24), skyMat);
    root.add(sky);

    /* ===== 地形 ===== */
    const gGeo = new T.PlaneGeometry(1000, 2500, 190, 470);
    gGeo.rotateX(-Math.PI / 2);
    const gp = gGeo.attributes.position;
    const colors = new Float32Array(gp.count * 3);
    const cLow = new T.Color(0x1b1512), cMid = new T.Color(0x2e211c), cHi = new T.Color(0x453a34);
    const tmpC = new T.Color();
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i), z = gp.getZ(i) - 1000;
      gp.setY(i, terrainH(x, z));
      const hh = terrainH(x, z);
      const k = smoothstep(-40, 40, hh);
      tmpC.copy(cLow).lerp(cMid, smoothstep(-60, 5, hh)).lerp(cHi, k * 0.7);
      colors[i * 3] = tmpC.r; colors[i * 3 + 1] = tmpC.g; colors[i * 3 + 2] = tmpC.b;
    }
    gGeo.setAttribute('color', new T.BufferAttribute(colors, 3));
    gGeo.computeVertexNormals();
    const ground = new T.Mesh(gGeo, U.mat(0xffffff, { flat: true, roughness: 1 }));
    ground.material.vertexColors = true;
    ground.position.z = -1000;
    root.add(ground);

    /* ===== 黄泉路（石板道，跨河处断开） ===== */
    const roadMat = U.mat(0x141012, { roughness: 0.95 });
    function roadSeg(z0, z1) {
      const len = z0 - z1;
      const seg = new T.Mesh(new T.PlaneGeometry(14, len, 1, Math.ceil(len / 6)), roadMat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, 0.12, (z0 + z1) / 2);
      root.add(seg);
      // 路缘石（实例化，单次绘制）
      const n = Math.floor(len / 6);
      const im = new T.InstancedMesh(new T.BoxGeometry(0.7, 0.55, 1.6), U.mat(0x2a2422, { flat: true }), n * 2);
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(),
        v = new T.Vector3(), s = new T.Vector3(1, 1, 1);
      let k = 0;
      for (let i = 0; i < n; i++) {
        for (const sd of [-1, 1]) {
          e.set(0, (Math.random() - 0.5) * 0.2, 0);
          q.setFromEuler(e);
          v.set(sd * 7.3, 0.28, z0 - i * 6);
          m.compose(v, q, s);
          im.setMatrixAt(k++, m);
        }
      }
      im.instanceMatrix.needsUpdate = true;
      root.add(im);
    }
    roadSeg(220, Z.bridge + 46);
    roadSeg(Z.bridge - 46, Z.samsara - 60);

    /* =========================================================
     *  通用：注册可交互对象（透明代理盒 + 悬停提示）
     * ========================================================= */
    function pick(group, data, localBox) {
      group.updateWorldMatrix(true, true);
      let bbox;
      if (localBox) {
        bbox = localBox.clone().applyMatrix4(group.matrixWorld);
      } else {
        bbox = new T.Box3().setFromObject(group);
      }
      const size = new T.Vector3(), center = new T.Vector3();
      bbox.getSize(size); bbox.getCenter(center);
      size.x = Math.max(size.x, 1.2); size.z = Math.max(size.z, 1.2); size.y = Math.max(size.y, 1.2);
      const proxy = new T.Mesh(
        new T.BoxGeometry(size.x * 1.06, size.y * 1.06, size.z * 1.06),
        new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      proxy.position.copy(center);
      proxy.userData.pick = data;
      proxy.userData.owner = group;
      proxy.renderOrder = -1;
      root.add(proxy);
      picks.push(proxy);
      data._proxy = proxy;
      return proxy;
    }

    /* ---------- 鬼火 / 火星粒子 ---------- */
    function spirits3d(count, color, size, yMin, yMax, zA, zB, spread) {
      const pos = new Float32Array(count * 3);
      const seed = new Float32Array(count);
      const rnd = U.mulberry32(9182 + count);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (rnd() - 0.5) * spread;
        pos[i * 3 + 1] = yMin + rnd() * (yMax - yMin);
        pos[i * 3 + 2] = zA + rnd() * (zB - zA);
        seed[i] = rnd() * 6.283;
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({
        size: size, map: U.glowTexture('rgba(255,255,255,1)', color),
        transparent: true, blending: T.AdditiveBlending, depthWrite: false,
        sizeAttenuation: true, opacity: 0.9
      });
      const pts = new T.Points(geo, mat);
      root.add(pts);
      updaters.push(function (t) {
        const p = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
          p[i * 3 + 1] += Math.sin(t * 0.7 + seed[i]) * 0.012 + 0.006;
          p[i * 3] += Math.sin(t * 0.35 + seed[i] * 2.1) * 0.014;
          if (p[i * 3 + 1] > yMax) p[i * 3 + 1] = yMin;
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = 0.62 + Math.sin(t * 1.6) * 0.18;
      });
      return pts;
    }

    spirits3d(460, 'rgba(120,255,200,0.5)', 2.6, 0.5, 22, 180, -1980, 320);
    spirits3d(180, 'rgba(255,120,60,0.45)', 2.0, 0.5, 14, 180, -1980, 260);

    /* =========================================================
     *  一、鬼门关
     * ========================================================= */
    (function buildGate() {
      const g = new T.Group(); g.position.z = Z.gate; root.add(g);
      const stone = U.mat(0x39332e, { roughness: 0.95, flat: true });

      // 双阙石柱
      for (const s of [-1, 1]) {
        const p = new T.Mesh(new T.BoxGeometry(3.4, 20, 3.4), stone);
        p.position.set(s * 11, 10, 0); g.add(p);
        const base = new T.Mesh(new T.BoxGeometry(5.2, 1.6, 5.2), U.mat(0x2c2723, { flat: true }));
        base.position.set(s * 11, 0.8, 0); g.add(base);
        // 柱顶小兽（简化：蹲兽）
        const beast = new T.Mesh(new T.ConeGeometry(0.9, 1.8, 6), U.mat(0x4a3f36, { flat: true }));
        beast.position.set(s * 11, 21, 0); g.add(beast);
        // 灯笼
        const L = U.lantern(1.5, 0xff3a1a);
        L.position.set(s * 11, 15.5, 2.2); g.add(L);
        const pl = new T.PointLight(0xff5a24, 26, 40, 2);
        pl.position.set(s * 11, 15.5, 2.4); g.add(pl); lights.push({ l: pl, base: 26, s: s });
      }
      // 横梁
      const beam = new T.Mesh(new T.BoxGeometry(28, 3.2, 3.0), U.mat(0x4a1f18, { roughness: 0.8 }));
      beam.position.set(0, 18.2, 0); g.add(beam);
      const beam2 = new T.Mesh(new T.BoxGeometry(24, 1.4, 2.4), U.mat(0x5c2a1c, { roughness: 0.8 }));
      beam2.position.set(0, 20.4, 0); g.add(beam2);
      // 檐
      const eave = new T.Mesh(U.chineseRoof(30, 6, 2.4, 14), U.mat(0x3a1a14, { roughness: 0.85, flat: true }));
      eave.position.set(0, 21.4, 0); g.add(eave);
      // 匾额
      const plaq = U.plaque('鬼门关', 9, 4.2, { vertical: false });
      plaq.position.set(0, 16.4, 1.7); g.add(plaq);

      // 关墙
      for (const s of [-1, 1]) {
        for (let i = 0; i < 7; i++) {
          const w = new T.Mesh(new T.BoxGeometry(6, 11 + Math.random() * 2, 2.4), stone);
          w.position.set(s * (15 + i * 5.6), 5.5, -1 - i * 1.2);
          w.rotation.y = s * 0.06;
          g.add(w);
        }
      }
      // 火盆
      const fireMat = U.mat(0x120806, { emissive: 0xff4511, emissiveIntensity: 2.0, roughness: 1 });
      for (const s of [-1, 1]) {
        const bowl = new T.Mesh(new T.CylinderGeometry(1.5, 1.1, 1.2, 12), U.mat(0x2b211c, { flat: true }));
        bowl.position.set(s * 6.5, 1.4, 6); g.add(bowl);
        const fl = new T.Mesh(new T.ConeGeometry(1.1, 2.4, 8), fireMat);
        fl.position.set(s * 6.5, 2.7, 6); g.add(fl);
        const fl2 = new T.Mesh(new T.ConeGeometry(0.6, 1.6, 8), U.mat(0x000000, { emissive: 0xffdd66, emissiveIntensity: 2.4 }));
        fl2.position.set(s * 6.5, 2.5, 6); g.add(fl2);
        const pl = new T.PointLight(0xff6622, 22, 36, 2);
        pl.position.set(s * 6.5, 3.2, 6); g.add(pl);
        lights.push({ l: pl, base: 22, s: s * 2 });
        updaters.push(function (t) {
          const k = 1 + Math.sin(t * 7 + s) * 0.16 + Math.sin(t * 13.3) * 0.08;
          fl.scale.set(k, 1 / k * 1.05, k);
          fl2.scale.set(k * 0.9, 1 / k, k * 0.9);
          pl.intensity = 22 * k;
        });
      }

      // 鬼卒（持叉）
      function guard(x) {
        const gg = new T.Group();
        const body = new T.Mesh(new T.CylinderGeometry(0.55, 0.9, 2.6, 8), U.mat(0x1e2a2a, { flat: true }));
        body.position.y = 1.3; gg.add(body);
        const head = new T.Mesh(new T.SphereGeometry(0.42, 10, 8), U.mat(0x30403c, { flat: true }));
        head.position.y = 2.9; gg.add(head);
        const hat = new T.Mesh(new T.ConeGeometry(1.25, 0.7, 12), U.mat(0x2b2b22, { flat: true }));
        hat.position.y = 3.25; gg.add(hat);
        const fork = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 3.6, 6), U.mat(0x3a2f22, {}));
        fork.position.set(0.75, 1.9, 0.2); gg.add(fork);
        const tip = new T.Mesh(new T.ConeGeometry(0.28, 0.9, 6), U.mat(0x666666, { metalness: 0.7, roughness: 0.4 }));
        tip.position.set(0.75, 3.85, 0.2); gg.add(tip);
        gg.position.set(x, 0, 5);
        return gg;
      }
      g.add(guard(-5.4)); g.add(guard(5.4));

      // 路引碑
      const st = U.stele('路引\n过关文牒\n凭此入冥', 2.4, 5, 0.7);
      st.position.set(-21, 2.5, 17); st.rotation.y = 0.4; g.add(st);
      pick(st, {
        title: '路引', sub: '通关文牒',
        body: '民间以为，人死后须持「路引」方能顺利通过鬼门关。此引由阳间亲属焚化送达，上书本人生辰籍贯，盖城隍、土地之印。无引者徘徊关外荒野，成为孤魂野鬼。',
        quote: '一纸路引赴幽冥，五方鬼帝验分明。'
      });

      pick(g, {
        title: '鬼门关', sub: '阴阳交界 · 幽冥第一关',
        body: D.areas[0].desc, quote: D.areas[0].poem
      }, new T.Box3(new T.Vector3(-18, 0, -8), new T.Vector3(18, 24, 6)));

      // 幡
      for (const s of [-1, 1]) {
        const b = U.banner('幽冥交界　回头无路', 1.8, 7, '#f0d68a');
        b.position.set(s * 13.5, 7.5, 4.5); b.rotation.y = s * 0.35; g.add(b);
        updaters.push(function (t) { b.rotation.z = Math.sin(t * 1.1 + s) * 0.06; });
      }
      registerArea(g, Z.gate);
    })();

    /* =========================================================
     *  二、黄泉路 · 彼岸花海
     * ========================================================= */
    (function buildRoad() {
      const g = new T.Group(); root.add(g);
      const zA = Z.gate - 40, zB = Z.bridge + 60;
      const N = 620;
      const rnd = U.mulberry32(20241027);

      // 茎
      const stemGeo = new T.CylinderGeometry(0.035, 0.05, 1, 5);
      stemGeo.translate(0, 0.5, 0);
      const stems = new T.InstancedMesh(stemGeo, U.mat(0x2c4a2a, { roughness: 1 }), N);
      // 花瓣（每株 6 片）
      const petalGeo = new T.ConeGeometry(0.075, 0.72, 4);
      petalGeo.translate(0, 0.36, 0);
      const petals = new T.InstancedMesh(petalGeo,
        U.mat(0x8e0f14, { emissive: 0xd61018, emissiveIntensity: 0.85, roughness: 0.6 }), N * 6);
      // 花心
      const coreGeo = new T.SphereGeometry(0.075, 6, 5);
      const cores = new T.InstancedMesh(coreGeo, U.mat(0xff3344, { emissive: 0xff2233, emissiveIntensity: 1.6 }), N);

      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
      let pi = 0;
      for (let i = 0; i < N; i++) {
        const side = rnd() > 0.5 ? 1 : -1;
        const x = side * (8.5 + Math.pow(rnd(), 0.7) * 62);
        const z = zA + rnd() * (zB - zA);
        const y = terrainH(x, z) - 0.1;
        const hgt = 0.85 + rnd() * 0.75;
        const tilt = (rnd() - 0.5) * 0.22;
        e.set(tilt, rnd() * 6.28, (rnd() - 0.5) * 0.22);
        q.setFromEuler(e);
        v.set(x, y, z); sc.set(1, hgt, 1);
        m.compose(v, q, sc); stems.setMatrixAt(i, m);
        m.compose(new T.Vector3(x, y + hgt, z), q, new T.Vector3(1, 1, 1)); cores.setMatrixAt(i, m);
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * Math.PI * 2 + rnd() * 0.2;
          const spread = 0.62 + rnd() * 0.18;
          e.set(Math.cos(ang) * spread, ang + 0.0, Math.sin(ang) * spread);
          q.setFromEuler(e);
          m.compose(new T.Vector3(x, y + hgt, z), q, new T.Vector3(1, 0.9 + rnd() * 0.4, 1));
          petals.setMatrixAt(pi++, m);
        }
      }
      stems.instanceMatrix.needsUpdate = true;
      petals.instanceMatrix.needsUpdate = true;
      cores.instanceMatrix.needsUpdate = true;
      g.add(stems); g.add(petals); g.add(cores);

      // 微光：花海整体呼吸
      updaters.push(function (t) {
        const k = 0.72 + Math.sin(t * 0.9) * 0.22;
        petals.material.emissiveIntensity = k;
        cores.material.emissiveIntensity = 1.3 + Math.sin(t * 1.3) * 0.5;
      });

      // 孤魂野鬼（半透明人形）
      const ghosts = [];
      for (let i = 0; i < 14; i++) {
        const gh = new T.Group();
        const body = new T.Mesh(new T.CapsuleGeometry(0.34, 1.1, 4, 8),
          U.mat(0x88a8c0, { emissive: 0x2e5a66, emissiveIntensity: 0.8, transparent: true, opacity: 0.34, roughness: 1 }));
        body.position.y = 0.95; gh.add(body);
        const head = new T.Mesh(new T.SphereGeometry(0.27, 8, 7), body.material);
        head.position.y = 1.85; gh.add(head);
        const x = (rnd() - 0.5) * 60, z = zA + rnd() * (zB - zA);
        gh.position.set(x, terrainH(x, z), z);
        gh.userData.seed = rnd() * 6.28;
        gh.userData.baseX = x; gh.userData.baseZ = z;
        g.add(gh); ghosts.push(gh);
      }
      updaters.push(function (t) {
        for (const gh of ghosts) {
          const s = gh.userData.seed;
          gh.position.x = gh.userData.baseX + Math.sin(t * 0.22 + s) * 4;
          gh.position.z = gh.userData.baseZ + Math.cos(t * 0.17 + s * 1.7) * 5;
          gh.position.y = terrainH(gh.position.x, gh.position.z) + 0.35 + Math.sin(t * 0.8 + s) * 0.35;
          gh.rotation.y = Math.sin(t * 0.3 + s) * 1.2;
          gh.children[0].material.opacity = 0.24 + Math.abs(Math.sin(t * 0.6 + s)) * 0.22;
        }
      });

      // 里程碑
      const st = U.stele('黄泉路\n一走黄泉\n切莫回头', 2.6, 5.4, 0.8);
      st.position.set(-13, 2.7, Z.road + 40); st.rotation.y = 0.35; g.add(st);
      pick(st, { title: '黄泉路', sub: '火照之路', body: D.areas[1].desc, quote: D.areas[1].poem });

      // 彼岸花（可点击的近景特写株）
      const hero = new T.Group();
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * 6.283;
        const st2 = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 1.5, 5), U.mat(0x2c4a2a));
        st2.position.set(Math.cos(a) * 0.25, 0.75, Math.sin(a) * 0.25);
        st2.rotation.z = Math.cos(a) * 0.2; st2.rotation.x = Math.sin(a) * 0.2;
        hero.add(st2);
        const fl = new T.Mesh(new T.ConeGeometry(0.12, 1.0, 5),
          U.mat(0x9c1016, { emissive: 0xee1420, emissiveIntensity: 1.1 }));
        fl.position.set(Math.cos(a) * 0.55, 1.75, Math.sin(a) * 0.55);
        fl.rotation.z = -Math.cos(a) * 0.85; fl.rotation.x = Math.sin(a) * 0.85;
        hero.add(fl);
      }
      hero.position.set(12, terrainH(12, Z.road - 20), Z.road - 20);
      hero.scale.setScalar(1.5);
      g.add(hero);
      pick(hero, {
        title: '彼岸花', sub: '曼珠沙华 · 红花石蒜',
        body: '开在黄泉路上的接引之花。花开千年，花落千年，花叶永不相见——有花时无叶，有叶时无花，故曰「生生相错」。其色赤红如血，远望如血所铺成的地毯，是这长路上唯一的风景与色彩。民间亦传，不肯饮孟婆汤者跳入忘川，千年之后转世，脸上会留下酒窝或痣的记号，以便寻得前世之人。',
        quote: '花叶生生两不见，相念相惜永相失。'
      });
    })();

    /* =========================================================
     *  三、忘川河 · 奈何桥 · 孟婆 · 三生石
     * ========================================================= */
    (function buildBridge() {
      const g = new T.Group(); g.position.z = Z.bridge; root.add(g);

      /* --- 忘川河 --- */
      const riverMat = new T.ShaderMaterial({
        transparent: true,
        uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec2 vUv; varying vec3 vW; uniform float uT;' +
          'void main(){ vUv=uv; vec3 p=position;' +
          ' p.y += sin(p.x*0.35+uT*1.6)*0.28 + sin(p.y*0.4-uT*1.1)*0.3;' +
          ' vW=p; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
        fragmentShader: [
          'varying vec2 vUv; varying vec3 vW; uniform float uT;',
          'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
          'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
          'return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
          'void main(){',
          ' vec2 uv = vUv*vec2(6.0,14.0);',
          ' float w = n(uv+vec2(uT*0.25,-uT*0.5))*0.6 + n(uv*2.3-vec2(uT*0.4,0.0))*0.4;',
          ' vec3 dark = vec3(0.10,0.045,0.03);',
          ' vec3 blood = vec3(0.42,0.10,0.05);',
          ' vec3 foam = vec3(0.55,0.22,0.10);',
          ' float m = smoothstep(0.35,0.75,w);',
          ' vec3 c = mix(dark,blood,m);',
          ' c = mix(c, foam, smoothstep(0.72,0.95,w)*0.7);',
          ' float sh = sin(vUv.y*90.0 + uT*3.0 + w*8.0)*0.5+0.5;',
          ' c += vec3(0.10,0.03,0.0)*sh*0.35;',
          ' float edge = smoothstep(0.0,0.09,vUv.y)*smoothstep(1.0,0.91,vUv.y);',
          ' gl_FragColor = vec4(c, 0.93*edge+0.07);}'
        ].join('\n')
      });
      const river = new T.Mesh(new T.PlaneGeometry(420, 92, 60, 30), riverMat);
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, -4.4, 0);
      g.add(river);
      updaters.push(function (t) { riverMat.uniforms.uT.value = t; });

      // 河中沉魂（挣扎的手臂剪影）
      const handMat = U.mat(0x120a08, { emissive: 0x3a0d06, emissiveIntensity: 0.7, roughness: 1 });
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.283, r = 12 + Math.random() * 150;
        const hx = Math.cos(a) * r, hz = Math.sin(a) * r * 0.3;
        if (Math.abs(hx) < 16 && Math.abs(hz) < 26) continue;
        const hand = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, 1.5 + Math.random(), 5), handMat);
        hand.position.set(hx, -4.2 + Math.random() * 0.6, hz);
        hand.rotation.z = (Math.random() - 0.5) * 0.7;
        g.add(hand);
        const sd = Math.random() * 6.28, by = hand.position.y;
        updaters.push(function (t) {
          hand.position.y = by + Math.sin(t * 1.4 + sd) * 0.32;
          hand.rotation.x = Math.sin(t * 0.9 + sd) * 0.15;
        });
      }
      pick(river, {
        title: '忘川河', sub: '三途河 · 血黄之水',
        body: '横在黄泉路与冥府之间，河水呈血黄色，里面尽是不得投胎的孤魂野鬼，虫蛇满布，腥风扑面，波涛翻滚。若不饮孟婆汤，便须跳入忘川河，受水淹火炙之苦，等上千年方能投胎；千年之中，只能眼睁睁看着心爱之人一次次过桥、一碗碗饮汤，却言语不通、相见不识。',
        quote: '千年守候在忘川，看你过桥不敢言。'
      }, new T.Box3(new T.Vector3(-200, -0.8, -44), new T.Vector3(200, 0.8, 44)));

      /* --- 奈何桥（三道） --- */
      function archBridge(width, offsetX, color, label, info) {
        const bg = new T.Group();
        const steps = 15;
        const span = 92;
        for (let i = 0; i < steps; i++) {
          const t0 = i / steps;
          const z = -span / 2 + span * t0;
          const arc = 1 - Math.pow((t0 - 0.5) * 2, 2);
          const y = 0.6 + arc * 4.2;
          const deck = new T.Mesh(new T.BoxGeometry(width, 0.45, span / steps + 0.4),
            U.mat(color, { roughness: 0.85, flat: true }));
          deck.position.set(offsetX, y, z);
          deck.rotation.x = -Math.atan2(4.2 * (0.5 - t0) * 2 / (span / 2), 1) * 0.6;
          bg.add(deck);
        }
        // 栏杆
        for (const s of [-1, 1]) {
          for (let i = 0; i <= 12; i++) {
            const t0 = i / 12;
            const z = -span / 2 + span * t0;
            const arc = 1 - Math.pow((t0 - 0.5) * 2, 2);
            const y = 1.0 + arc * 4.2;
            const post = new T.Mesh(new T.BoxGeometry(0.32, 1.5, 0.32), U.mat(0x3a3029, { flat: true }));
            post.position.set(offsetX + s * width / 2, y + 0.7, z); bg.add(post);
            const hd = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), U.mat(0x6b4a22, { metalness: 0.5, roughness: 0.5 }));
            hd.position.set(offsetX + s * width / 2, y + 1.55, z); bg.add(hd);
          }
          const railN = new T.Mesh(new T.BoxGeometry(0.22, 0.22, span), U.mat(0x453a30, {}));
          railN.position.set(offsetX + s * width / 2, 2.9, 0); bg.add(railN);
        }
        // 桥头华表
        for (const zz of [-46, 46]) {
          const p = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 6.5, 8), U.mat(0x4a4038, { flat: true }));
          p.position.set(offsetX, 3.2, zz); bg.add(p);
          const l = U.lantern(0.85, color === 0xd9b54a ? 0xffcc55 : 0xff4a22);
          l.position.set(offsetX, 7.2, zz); bg.add(l);
        }
        const nm = U.plaque(label, width * 0.85, 1.5, { vertical: false, bg: '#180c08', fg: '#e8c86a' });
        nm.position.set(offsetX, 3.4, 46.6); bg.add(nm);
        g.add(bg);
        pick(bg, info);
        return bg;
      }

      archBridge(9, 0, 0x5a5148, '奈何桥', {
        title: '奈何桥', sub: '河上唯一之桥',
        body: '忘川河上唯一的桥。传说此桥分三层：上层金桥、中层银桥、下层石桥（奈何桥）。善人过金桥得富贵，平常人过银桥得平安，罪魂则由鬼卒押过下层石桥，桥面湿滑难行。又有传说：夫妻若想来世再续前缘，可同走中间一道。',
        quote: '奈何桥上奈何人，一步一忘一沾尘。'
      });
      archBridge(4.5, -13, 0xd9b54a, '金桥', {
        title: '金桥', sub: '善人由此过',
        body: '一生行善积德者由此桥过。金桥平坦宽阔，桥头有幢幡宝盖相迎，过桥即得富贵之家投生，或升忉利天享福。',
        quote: '善人一过金桥去，福报随身不落空。'
      });
      archBridge(4.5, 13, 0xb9c2cc, '银桥', {
        title: '银桥', sub: '平常人由此过',
        body: '功过相抵、生平无大过者由此桥过，来世平安康健、家宅安宁。民间亦有「回头走金桥得富贵，走银桥得平安」之说，两者只可取其一。',
        quote: '银桥安稳无惊惧，一世清平即是福。'
      });

      /* --- 孟婆庄 · 醧忘台 --- */
      const meng = new T.Group();
      meng.position.set(-26, 1.2, 30);
      // 亭
      const plat = new T.Mesh(new T.CylinderGeometry(6, 6.6, 1.2, 12), U.mat(0x332b25, { flat: true }));
      plat.position.y = -0.6; meng.add(plat);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283;
        const col = new T.Mesh(new T.CylinderGeometry(0.28, 0.32, 5.2, 8), U.mat(0x5c2118, {}));
        col.position.set(Math.cos(a) * 4.8, 2.6, Math.sin(a) * 4.8); meng.add(col);
      }
      const roof = new T.Mesh(U.chineseRoof(13, 13, 3.6, 16), U.mat(0x2e1a14, { flat: true, roughness: 0.9 }));
      roof.position.y = 5.2; meng.add(roof);
      const finial = new T.Mesh(new T.SphereGeometry(0.6, 10, 8), U.mat(0xc9a227, { metalness: 0.8, roughness: 0.3 }));
      finial.position.y = 9; meng.add(finial);
      // 孟婆
      const mp = new T.Group();
      const robe = new T.Mesh(new T.CylinderGeometry(0.62, 1.15, 2.5, 10), U.mat(0x2a2320, { flat: true }));
      robe.position.y = 1.25; mp.add(robe);
      const head = new T.Mesh(new T.SphereGeometry(0.42, 10, 8), U.mat(0x8d7a63, { flat: true }));
      head.position.y = 2.75; mp.add(head);
      const bun = new T.Mesh(new T.SphereGeometry(0.24, 8, 6), U.mat(0x9a9a92, {}));
      bun.position.set(0, 3.1, -0.2); mp.add(bun);
      const scarf = new T.Mesh(new T.CylinderGeometry(0.2, 0.3, 1.6, 8), U.mat(0x6b5a45, {}));
      scarf.position.set(0.5, 1.6, 0.3); scarf.rotation.z = 0.4; mp.add(scarf);
      mp.position.set(0, 0, 0); meng.add(mp);
      // 汤锅
      const pot = new T.Mesh(new T.CylinderGeometry(1.35, 1.1, 1.5, 14), U.mat(0x1e1a17, { metalness: 0.4, roughness: 0.6 }));
      pot.position.set(2.4, 0.9, 1.6); meng.add(pot);
      const soup = new T.Mesh(new T.CylinderGeometry(1.22, 1.22, 0.1, 14),
        U.mat(0x6b5a30, { emissive: 0xa88a3a, emissiveIntensity: 1.1, transparent: true, opacity: 0.9 }));
      soup.position.set(2.4, 1.62, 1.6); meng.add(soup);
      // 灶火
      const fire = new T.Mesh(new T.ConeGeometry(0.8, 1.2, 8), U.mat(0x000000, { emissive: 0xff6a1a, emissiveIntensity: 2.2 }));
      fire.position.set(2.4, 0.35, 2.9); meng.add(fire);
      const pl = new T.PointLight(0xffa040, 16, 26, 2); pl.position.set(2.4, 2.4, 1.6); meng.add(pl);
      // 蒸汽
      const steamMat = new T.PointsMaterial({
        size: 2.2, map: U.smokeTexture(), transparent: true, opacity: 0.28,
        depthWrite: false, color: 0xbfae86
      });
      const sN = 40, sPos = new Float32Array(sN * 3), sSeed = new Float32Array(sN);
      for (let i = 0; i < sN; i++) {
        sPos[i * 3] = 2.4 + (Math.random() - 0.5) * 2;
        sPos[i * 3 + 1] = 2 + Math.random() * 6;
        sPos[i * 3 + 2] = 1.6 + (Math.random() - 0.5) * 2;
        sSeed[i] = Math.random() * 6.28;
      }
      const sGeo = new T.BufferGeometry();
      sGeo.setAttribute('position', new T.BufferAttribute(sPos, 3));
      const steam = new T.Points(sGeo, steamMat); meng.add(steam);
      updaters.push(function (t) {
        const p = sGeo.attributes.position.array;
        for (let i = 0; i < sN; i++) {
          p[i * 3 + 1] += 0.024 + Math.sin(t + sSeed[i]) * 0.006;
          if (p[i * 3 + 1] > 9) p[i * 3 + 1] = 1.8;
        }
        sGeo.attributes.position.needsUpdate = true;
        fire.scale.y = 1 + Math.sin(t * 8) * 0.2;
        soup.material.emissiveIntensity = 0.9 + Math.sin(t * 2) * 0.3;
        mp.rotation.y = Math.sin(t * 0.4) * 0.25;
      });
      const mengPlaq = U.plaque('孟婆庄', 5, 2.2, { vertical: false });
      mengPlaq.position.set(0, 5.6, 5.6); meng.add(mengPlaq);
      g.add(meng);
      pick(meng, {
        title: '孟婆 · 孟婆汤', sub: '醧忘台 · 忘情水',
        body: '孟婆为轮回司主事，驻守奈何桥头，以忘川水熬成汤，又称忘情水、忘忧散。凡将投生之魂，皆须饮此一碗，忘却前生今生，一生爱恨情仇、一世浮沉得失尽归于无。来生再见时，纵然对面亦不相识。',
        quote: '一碗忘情水，前尘尽成灰。', action: 'soup'
      });

      /* --- 三生石 --- */
      const stone = new T.Group();
      const sBody = new T.Mesh(new T.DodecahedronGeometry(3.4, 0), U.mat(0x4a4a44, { flat: true, roughness: 1 }));
      sBody.scale.set(1, 1.35, 0.75); sBody.position.y = 3.6; stone.add(sBody);
      const sBase = new T.Mesh(new T.CylinderGeometry(3.2, 3.8, 1.2, 10), U.mat(0x2b2723, { flat: true }));
      sBase.position.y = 0.6; stone.add(sBase);
      const sTex = U.textTexture('早登彼岸', {
        w: 256, h: 512, vertical: true, bg: 'rgba(0,0,0,0)', fg: '#c0392b',
        glow: 'rgba(200,40,30,0.6)', grain: false
      });
      const sFace = new T.Mesh(new T.PlaneGeometry(4.4, 6.4),
        new T.MeshStandardMaterial({ map: sTex, transparent: true, emissive: 0x3a0a06, emissiveIntensity: 0.9, roughness: 0.9 }));
      sFace.position.set(0, 3.9, 2.75); stone.add(sFace);
      stone.position.set(24, 1, 26); stone.rotation.y = -0.5;
      g.add(stone);
      pick(stone, {
        title: '三生石', sub: '前世 · 今生 · 来世',
        body: '奈何桥边一块青石，石身上的字鲜红如血，最上刻「早登彼岸」。传说它记载着每个人的前世、今生与来世：前世的因，今生的果，宿命轮回，缘起缘灭，都重重刻在三生石上。千百年来，它见证了芸芸众生的苦乐悲欢，该了的债、该还的情，三生石前一笔勾销。',
        quote: '三生石上旧精魂，赏月吟风莫要论。', action: 'stone'
      });

      /* --- 望乡台（桥前小台） --- */
      const wx = new T.Group();
      const wxBase = new T.Mesh(new T.CylinderGeometry(5, 6, 1.4, 10), U.mat(0x2e2823, { flat: true }));
      wxBase.position.y = 0.7; wx.add(wxBase);
      const wxTop = new T.Mesh(new T.CylinderGeometry(4.2, 4.6, 6, 10), U.mat(0x3a332c, { flat: true }));
      wxTop.position.y = 4.4; wx.add(wxTop);
      const wxRail = new T.Mesh(new T.TorusGeometry(4.3, 0.16, 6, 20), U.mat(0x5c4a22, { metalness: 0.5, roughness: 0.5 }));
      wxRail.rotation.x = Math.PI / 2; wxRail.position.y = 7.5; wx.add(wxRail);
      const wxP = U.plaque('望乡台', 3.6, 1.6, { vertical: false });
      wxP.position.set(0, 6.2, 4.3); wx.add(wxP);
      wx.position.set(18, 0, -52);
      g.add(wx);
      pick(wx, {
        title: '望乡台', sub: '思乡岭',
        body: '又称思乡岭，是亡魂最后遥望阳世家中之地。「一天不吃人间饭，两天就过阴阳界，三天到达望乡台，望见亲人哭哀哀。」鬼魂去地府报到前对阳世亲人十分挂念，尽管鬼卒严催怒斥，仍强登望乡台，最后遥望家乡大哭一声，才死心塌地前往阴曹。善良之人，此台不登。',
        quote: '望乡台上鬼仓皇，望眼睁睁泪两行。'
      });
      registerArea(g, Z.bridge);
    })();

    /* =========================================================
     *  四、孽镜台 · 秦广殿（第一殿）
     * ========================================================= */
    (function buildMirror() {
      const g = new T.Group(); g.position.z = Z.mirror; root.add(g);

      /* --- 殿宇 --- */
      function hall(w, d, colH, roofH, plaqueText, plaqueSub) {
        const h = new T.Group();
        const podium = new T.Mesh(new T.BoxGeometry(w + 6, 1.8, d + 6), U.mat(0x332c26, { flat: true }));
        podium.position.y = 0.9; h.add(podium);
        const podium2 = new T.Mesh(new T.BoxGeometry(w + 3, 1.2, d + 3), U.mat(0x3b342c, { flat: true }));
        podium2.position.y = 2.3; h.add(podium2);
        // 柱
        const cols = Math.max(4, Math.round(w / 6));
        for (let i = 0; i <= cols; i++) {
          for (const s of [-1, 1]) {
            const x = -w / 2 + (w / cols) * i;
            const c = new T.Mesh(new T.CylinderGeometry(0.55, 0.62, colH, 10), U.mat(0x6b1f16, {}));
            c.position.set(x, 2.9 + colH / 2, s * d / 2); h.add(c);
            const cap = new T.Mesh(new T.BoxGeometry(1.6, 0.5, 1.6), U.mat(0x3a3029, { flat: true }));
            cap.position.set(x, 2.9 + colH + 0.25, s * d / 2); h.add(cap);
          }
        }
        // 墙体
        const wall = new T.Mesh(new T.BoxGeometry(w, colH * 0.8, 0.6), U.mat(0x241d18, { roughness: 1 }));
        wall.position.set(0, 2.9 + colH * 0.4, -d / 2); h.add(wall);
        // 屋顶
        const rf = new T.Mesh(U.chineseRoof(w + 9, d + 9, roofH, 20), U.mat(0x2a1610, { flat: true, roughness: 0.9 }));
        rf.position.y = 2.9 + colH + 0.6; h.add(rf);
        const rf2 = new T.Mesh(U.chineseRoof(w * 0.6 + 4, d * 0.6 + 4, roofH * 0.7, 14), U.mat(0x331a13, { flat: true }));
        rf2.position.y = 2.9 + colH + 0.6 + roofH * 0.72; h.add(rf2);
        const top = new T.Mesh(new T.SphereGeometry(0.55, 10, 8), U.mat(0xd4af37, { metalness: 0.85, roughness: 0.25 }));
        top.position.y = 2.9 + colH + 0.6 + roofH * 0.72 + roofH * 0.7; h.add(top);
        // 匾
        const pq = U.plaque(plaqueText, w * 0.42, w * 0.2, { vertical: false });
        pq.position.set(0, 2.9 + colH * 0.92, d / 2 + 0.5); h.add(pq);
        // 楹联
        for (const s of [-1, 1]) {
          const cp = U.banner(plaqueSub || '善恶到头终有报', 1.1, colH * 0.85, '#e8c86a');
          cp.position.set(s * (w / 2 + 1.2), 2.9 + colH * 0.5, d / 2 + 0.4);
          h.add(cp);
        }
        return h;
      }

      const palace = hall(30, 18, 11, 7, '秦广殿', '孽镜台前无好人');
      palace.position.set(-34, 0, -20); palace.rotation.y = 0.55;
      g.add(palace);
      pick(palace, {
        title: '秦广殿', sub: '第一殿 · 秦广王蒋',
        body: '鬼判殿位居大海之中、沃焦石之外，正西的黄泉黑路上。' + D.tenKings[0].sin + '　' + D.tenKings[0].d,
        quote: '善人寿终有接引，恶者照镜赴诸刑。'
      }, new T.Box3(new T.Vector3(-20, 0, -12), new T.Vector3(20, 26, 12)));

      /* --- 阎王坐像 --- */
      function kingFigure(crownColor) {
        const f = new T.Group();
        const seat = new T.Mesh(new T.BoxGeometry(4.2, 1.2, 3), U.mat(0x2a1c14, { flat: true }));
        seat.position.y = 0.6; f.add(seat);
        const robe = new T.Mesh(new T.CylinderGeometry(1.5, 2.4, 4.2, 12), U.mat(0x7a1c14, { flat: true }));
        robe.position.y = 3.1; f.add(robe);
        const sh = new T.Mesh(new T.BoxGeometry(4.4, 0.6, 1.2), U.mat(0x3a2a1c, {}));
        sh.position.set(0, 4.6, 0.4); f.add(sh);
        const head = new T.Mesh(new T.SphereGeometry(0.95, 14, 12), U.mat(0x3d2a1e, { flat: true }));
        head.position.y = 6.0; f.add(head);
        // 冕旒
        const crown = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, 0.5, 12), U.mat(crownColor, { metalness: 0.7, roughness: 0.35 }));
        crown.position.y = 6.75; f.add(crown);
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * 6.283;
          const bead = new T.Mesh(new T.SphereGeometry(0.09, 6, 5), U.mat(0xd4af37, { metalness: 0.9, roughness: 0.2 }));
          bead.position.set(Math.cos(a) * 1.0, 6.3, Math.sin(a) * 1.0); f.add(bead);
        }
        //  beard
        const bd = new T.Mesh(new T.ConeGeometry(0.5, 1.1, 8), U.mat(0x9a9a92, {}));
        bd.position.set(0, 5.3, 0.75); bd.rotation.x = 0.25; f.add(bd);
        return f;
      }
      const king = kingFigure(0xc9a227);
      king.position.set(-34, 3, -26); king.rotation.y = 0.55;
      king.scale.setScalar(1.15);
      g.add(king);
      pick(king, {
        title: '第一殿 · 秦广王', sub: '蒋子文 · 玄冥宫 · 二月初一诞辰',
        body: D.tenKings[0].sin + '　' + D.tenKings[0].d,
        quote: '专司人间寿夭生死，统管幽冥吉凶。'
      });

      /* --- 孽镜台（主体互动） --- */
      const mir = new T.Group();
      const mBase = new T.Mesh(new T.CylinderGeometry(7, 8.4, 2.4, 12), U.mat(0x2e2822, { flat: true }));
      mBase.position.y = 1.2; mir.add(mBase);
      const mStep = new T.Mesh(new T.CylinderGeometry(5.6, 6.6, 1.6, 12), U.mat(0x37302a, { flat: true }));
      mStep.position.y = 3.0; mir.add(mStep);
      // 镜架
      for (const s of [-1, 1]) {
        const p = new T.Mesh(new T.CylinderGeometry(0.4, 0.5, 10, 8), U.mat(0x5c2118, {}));
        p.position.set(s * 5.6, 8.4, 0); mir.add(p);
        const dr = new T.Mesh(new T.ConeGeometry(0.8, 1.6, 6), U.mat(0xd4af37, { metalness: 0.8, roughness: 0.3 }));
        dr.position.set(s * 5.6, 14, 0); mir.add(dr);
      }
      const beam = new T.Mesh(new T.BoxGeometry(13.5, 1.2, 1.2), U.mat(0x6b2418, {}));
      beam.position.y = 13.4; mir.add(beam);
      // 镜面
      const mirMat = new T.ShaderMaterial({        uniforms: { uT: { value: 0 }, uOn: { value: 0 } },
        transparent: true,
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: [
          'varying vec2 vUv; uniform float uT; uniform float uOn;',
          'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
          'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
          'return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
          'void main(){',
          ' vec2 p = vUv-0.5; float r = length(p);',
          ' float w = n(vUv*8.0+vec2(uT*0.15,-uT*0.22));',
          ' vec3 base = mix(vec3(0.05,0.06,0.08), vec3(0.16,0.18,0.22), w);',
          ' base += vec3(0.25,0.22,0.18)*smoothstep(0.35,0.0,r)*0.8;',
          ' float ring = smoothstep(0.48,0.44,r)*smoothstep(0.38,0.44,r);',
          ' base += vec3(0.6,0.45,0.2)*ring;',
          ' float face = smoothstep(0.62,0.2,length((vUv-vec2(0.5,0.55))*vec2(1.0,1.4)));',
          ' base += vec3(0.45,0.12,0.08)*face*uOn*(0.6+0.4*sin(uT*3.0));',
          ' gl_FragColor = vec4(base, 0.92);}'
        ].join('\n')
      });
      const mirFace = new T.Mesh(new T.CircleGeometry(5.6, 48), mirMat);
      mirFace.position.set(0, 8.6, 0.35); mir.add(mirFace);
      const rim = new T.Mesh(new T.TorusGeometry(5.7, 0.35, 8, 48), U.mat(0xb08030, { metalness: 0.85, roughness: 0.3 }));
      rim.position.set(0, 8.6, 0.35); mir.add(rim);
      // 横幅「孽镜台前无好人」
      const mBanner = U.plaque('孽镜台前无好人', 12, 2.6, { vertical: false, bg: '#150a08', fg: '#e05a3a' });
      mBanner.position.set(0, 15.6, 0.6); mir.add(mBanner);
      const mName = U.plaque('孽镜台', 5, 2.2, { vertical: false });
      mName.position.set(0, 4.4, 6.6); mir.add(mName);
      refs.mirMat = mirMat;
      mir.position.set(6, 0, 10);
      g.add(mir);
      updaters.push(function (t) { mirMat.uniforms.uT.value = t; });
      const mirLight = new T.PointLight(0xffc070, 14, 40, 2);
      mirLight.position.set(6, 9, 14); g.add(mirLight);
      pick(mir, {
        title: '孽镜台', sub: '秦广王殿右高台',
        body: '台高一丈，镜大十围，向东悬挂，上横七字：「孽镜台前无好人」。恶魂押赴台前，不必旁人举证，自见在世之心之险——万两黄金带不来，一生惟有孽随身。照过之后，批解第二殿，用刑发狱受苦。',
        quote: '孽镜台前无好人，一生惟有孽随身。', action: 'mirror'
      });

      /* --- 判官（崔珏） --- */
      function judge(x, z, ry) {
        const j = new T.Group();
        const robe = new T.Mesh(new T.CylinderGeometry(0.7, 1.2, 3.0, 10), U.mat(0x1f3a3a, { flat: true }));
        robe.position.y = 1.5; j.add(robe);
        const head = new T.Mesh(new T.SphereGeometry(0.45, 12, 10), U.mat(0x3d2a1e, { flat: true }));
        head.position.y = 3.4; j.add(head);
        const hat = new T.Mesh(new T.BoxGeometry(1.5, 0.6, 0.7), U.mat(0x141414, {}));
        hat.position.y = 3.95; j.add(hat);
        const wing = new T.Mesh(new T.BoxGeometry(2.4, 0.12, 0.5), U.mat(0x1a1a1a, {}));
        wing.position.y = 3.85; j.add(wing);
        // 生死簿 + 判官笔
        const book = new T.Mesh(new T.BoxGeometry(0.9, 1.2, 0.18), U.mat(0xd8cba8, {}));
        book.position.set(0.75, 2.3, 0.45); book.rotation.z = -0.3; j.add(book);
        const pen = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.1, 6), U.mat(0x111111, {}));
        pen.position.set(-0.7, 2.5, 0.4); pen.rotation.z = 0.6; j.add(pen);
        const tip = new T.Mesh(new T.ConeGeometry(0.09, 0.3, 6), U.mat(0xc0392b, { emissive: 0x5a0f08, emissiveIntensity: 0.8 }));
        tip.position.set(-0.45, 3.0, 0.4); tip.rotation.z = 0.6 + Math.PI; j.add(tip);
        j.position.set(x, 0, z); j.rotation.y = ry;
        return j;
      }
      const j1 = judge(-20, 12, 0.3); g.add(j1);
      pick(j1, {
        title: '崔判官', sub: '阴律司 · 生死簿',
        body: '阴律司首席判官崔珏，执生死簿与判官笔，核定寿夭，一笔定生死。另有赏善司魏征、罚恶司钟馗、察查司陆之道，合称四大判官，分掌记录善行、拟定刑罚与复查冤案。',
        quote: '判官笔落生死定，簿上何曾放过人。'
      });

      /* --- 十殿牌位（此处先立第一殿与十殿索引） --- */
      const gate2 = U.stele('十殿阎罗\n一二三四五\n六七八九十', 2.2, 4.4, 0.7);
      gate2.position.set(24, 2.2, 22); gate2.rotation.y = -0.4; g.add(gate2);
      pick(gate2, {
        title: '十殿阎罗', sub: '地府审判十宫',
        body: D.tenKings.map(k => k.n + '·' + k.king + '：' + k.sin).join('\n'),
        quote: '十殿次第审，业镜自分明。', list: 'kings'
      });
      registerArea(g, Z.mirror);
    })();

    /* =========================================================
     *  五、阎罗殿 · 望乡台（第五殿）
     * ========================================================= */
    (function buildYama() {
      const g = new T.Group(); g.position.z = Z.yama; root.add(g);

      /* --- 主殿 --- */
      const podium = new T.Mesh(new T.BoxGeometry(44, 2.4, 30), U.mat(0x332c26, { flat: true }));
      podium.position.set(0, 1.2, -26); g.add(podium);
      const podium2 = new T.Mesh(new T.BoxGeometry(38, 1.6, 25), U.mat(0x3b342c, { flat: true }));
      podium2.position.set(0, 3.4, -26); g.add(podium2);
      // 柱廊
      for (let i = 0; i <= 8; i++) {
        const x = -18 + (36 / 8) * i;
        const c = new T.Mesh(new T.CylinderGeometry(0.65, 0.72, 13, 10), U.mat(0x7a1c14, {}));
        c.position.set(x, 4.2 + 6.5, -13.5); g.add(c);
        const cp = new T.Mesh(new T.BoxGeometry(1.8, 0.6, 1.8), U.mat(0x3a3029, { flat: true }));
        cp.position.set(x, 4.2 + 13.3, -13.5); g.add(cp);
      }
      const wall = new T.Mesh(new T.BoxGeometry(38, 11, 0.8), U.mat(0x241d18, {}));
      wall.position.set(0, 4.2 + 5.5, -40); g.add(wall);
      // 重檐
      const rf1 = new T.Mesh(U.chineseRoof(52, 34, 8, 22), U.mat(0x2a1610, { flat: true }));
      rf1.position.set(0, 18.2, -26); g.add(rf1);
      const rf2 = new T.Mesh(U.chineseRoof(34, 22, 6.5, 18), U.mat(0x331a13, { flat: true }));
      rf2.position.set(0, 24.6, -26); g.add(rf2);
      const top = new T.Mesh(new T.SphereGeometry(0.8, 12, 10), U.mat(0xd4af37, { metalness: 0.9, roughness: 0.2 }));
      top.position.set(0, 31.4, -26); g.add(top);
      const pq = U.plaque('阎罗殿', 13, 5.4, { vertical: false });
      pq.position.set(0, 15.4, -12.6); g.add(pq);
      pick(pq, {
        title: '阎罗殿', sub: '第五殿 · 叫唤大地狱',
        body: D.tenKings[4].sin + '　' + D.tenKings[4].d,
        quote: '是是非非何日了，善善恶恶自分明。'
      }, new T.Box3(new T.Vector3(-30, 0, -42), new T.Vector3(30, 28, -10)));
      for (const s of [-1, 1]) {
        const cp = U.banner(s < 0 ? '是是非非　何日了' : '善善恶恶　自分明', 1.4, 9, '#f0d68a');
        cp.position.set(s * 15, 9.5, -12.8); g.add(cp);
      }
      // 殿内阎罗像
      const kg = new T.Group();
      const seat = new T.Mesh(new T.BoxGeometry(6, 1.6, 4), U.mat(0x2a1c14, { flat: true }));
      seat.position.y = 4.8; kg.add(seat);
      const robe = new T.Mesh(new T.CylinderGeometry(1.9, 3.0, 5.2, 12), U.mat(0x111111, { flat: true }));
      robe.position.y = 8.2; kg.add(robe);
      const face = new T.Mesh(new T.SphereGeometry(1.15, 14, 12), U.mat(0x2b1a12, { flat: true }));
      face.position.y = 11.6; kg.add(face);
      // 包拯：黑面月牙
      const moon = new T.Mesh(new T.TorusGeometry(0.34, 0.1, 6, 16, Math.PI * 1.2),
        U.mat(0xd8d8d0, { emissive: 0x999990, emissiveIntensity: 0.5 }));
      moon.position.set(0.25, 11.9, 1.05); moon.rotation.z = 0.6; kg.add(moon);
      const crown = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, 0.7, 12), U.mat(0xc9a227, { metalness: 0.75, roughness: 0.3 }));
      crown.position.y = 12.7; kg.add(crown);
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * 6.283;
        const bd = new T.Mesh(new T.SphereGeometry(0.1, 6, 5), U.mat(0xd4af37, { metalness: 0.9, roughness: 0.2 }));
        bd.position.set(Math.cos(a) * 1.2, 12.0, Math.sin(a) * 1.2); kg.add(bd);
      }
      kg.position.set(0, 0, -30);
      g.add(kg);
      const kl = new T.PointLight(0xff8a3a, 20, 50, 2); kl.position.set(0, 12, -24); g.add(kl);
      pick(kg, {
        title: '第五殿 · 阎罗天子', sub: '包拯 · 纠伦宫 · 正月初八诞辰',
        body: D.tenKings[4].sin + '　' + D.tenKings[4].d,
        quote: '阎罗本是包龙图，铁面无私断阴阳。'
      });

      /* --- 望乡台（主景） --- */
      const wx = new T.Group();
      const b1 = new T.Mesh(new T.CylinderGeometry(9, 11, 2.6, 14), U.mat(0x2e2823, { flat: true }));
      b1.position.y = 1.3; wx.add(b1);
      const b2 = new T.Mesh(new T.CylinderGeometry(7.4, 9, 2.2, 14), U.mat(0x37302a, { flat: true }));
      b2.position.y = 3.7; wx.add(b2);
      const b3 = new T.Mesh(new T.CylinderGeometry(6, 7.4, 14, 14), U.mat(0x40382f, { flat: true }));
      b3.position.y = 11.8; wx.add(b3);
      const rail = new T.Mesh(new T.TorusGeometry(6.2, 0.22, 6, 28), U.mat(0x8a6a22, { metalness: 0.6, roughness: 0.4 }));
      rail.rotation.x = Math.PI / 2; rail.position.y = 19; wx.add(rail);
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * 6.283;
        const p = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 1.4, 6), U.mat(0x5c4a22, { metalness: 0.5 }));
        p.position.set(Math.cos(a) * 6.2, 19.4, Math.sin(a) * 6.2); wx.add(p);
      }
      const wxP = U.plaque('望乡台', 6.4, 2.8, { vertical: false });
      wxP.position.set(0, 16.4, 6.2); wx.add(wxP);
      // 台上回望的鬼魂
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * 6.283;
        const gh = new T.Mesh(new T.CapsuleGeometry(0.4, 1.2, 4, 8),
          U.mat(0x9ab0c4, { emissive: 0x2e5a66, emissiveIntensity: 0.9, transparent: true, opacity: 0.42, roughness: 1 }));
        gh.position.set(Math.cos(a) * 4, 20.2, Math.sin(a) * 4);
        wx.add(gh);
        updaters.push(function (t) {
          gh.position.y = 20.2 + Math.sin(t * 0.9 + i) * 0.3;
          gh.rotation.y = a + Math.sin(t * 0.3 + i) * 0.4;
        });
      }
      wx.position.set(0, 0, 34);
      g.add(wx);
      const wl = new T.PointLight(0x6ad0ff, 10, 40, 2); wl.position.set(0, 22, 34); g.add(wl);
      pick(wx, {
        title: '望乡台', sub: '五殿阎罗设此台',
        body: '台面如弓背，朝东西南三向，湾直八十一里；后如弓弦，坐北剑树为城，台高四十九丈，刀山为坡，砌就六十三级。善良之人不登此台，功过两平者已发往生，唯有恶鬼望乡——男妇均能见能闻阳间家中言语动静：遗嘱不遵，教令不行，田产抽匿，帐目清揭复浊，儿女存私，朋友失信……见后方知万事皆空。',
        quote: '望乡台上鬼仓皇，望眼睁睁泪两行。', action: 'wangxiang'
      });

      /* --- 牛头马面 --- */
      function oxHead(x, z, ry) {
        const o = new T.Group();
        const body = new T.Mesh(new T.CylinderGeometry(0.8, 1.3, 3.4, 10), U.mat(0x2a2f36, { flat: true }));
        body.position.y = 1.7; o.add(body);
        const head = new T.Mesh(new T.BoxGeometry(1.3, 1.1, 1.2), U.mat(0x3a3f46, { flat: true }));
        head.position.y = 3.9; o.add(head);
        for (const s of [-1, 1]) {
          const horn = new T.Mesh(new T.ConeGeometry(0.22, 1.5, 6), U.mat(0x9a8a62, { flat: true }));
          horn.position.set(s * 0.6, 4.8, 0); horn.rotation.z = -s * 0.55; o.add(horn);
        }
        const axe = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 4.2, 6), U.mat(0x3a2f22, {}));
        axe.position.set(1.1, 2.2, 0.3); o.add(axe);
        const blade = new T.Mesh(new T.BoxGeometry(0.9, 0.12, 0.7), U.mat(0x777777, { metalness: 0.8, roughness: 0.35 }));
        blade.position.set(1.1, 4.3, 0.3); o.add(blade);
        o.position.set(x, 0, z); o.rotation.y = ry;
        return o;
      }
      function horseFace(x, z, ry) {
        const o = new T.Group();
        const body = new T.Mesh(new T.CylinderGeometry(0.75, 1.25, 3.4, 10), U.mat(0x36302c, { flat: true }));
        body.position.y = 1.7; o.add(body);
        const head = new T.Mesh(new T.BoxGeometry(0.9, 1.9, 0.9), U.mat(0x4a4038, { flat: true }));
        head.position.y = 4.1; o.add(head);
        const snout = new T.Mesh(new T.BoxGeometry(0.8, 0.7, 1.3), U.mat(0x504438, { flat: true }));
        snout.position.set(0, 3.9, 0.85); o.add(snout);
        for (const s of [-1, 1]) {
          const ear = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 5), U.mat(0x4a4038, {}));
          ear.position.set(s * 0.35, 5.1, -0.1); o.add(ear);
        }
        const fork = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 4, 6), U.mat(0x3a2f22, {}));
        fork.position.set(-1.1, 2.1, 0.3); o.add(fork);
        o.position.set(x, 0, z); o.rotation.y = ry;
        return o;
      }
      const ox = oxHead(-15, -10, 0.5), hf = horseFace(15, -10, -0.5);
      g.add(ox); g.add(hf);
      const oxInfo = {
        title: '牛头马面', sub: '十大阴帅',
        body: '牛头人身、马面人身，为地府押送罪魂、看守地狱的鬼卒。凡各殿罪魂解到，皆由其执叉执棒押赴受刑；阳间亦以「牛头马面」泛指一切凶恶之差役。',
        quote: '牛头执叉马面随，罪魂到此不由己。'
      };
      pick(ox, oxInfo); pick(hf, oxInfo);

      /* --- 诛心小地狱（展示） --- */
      const zx = new T.Group();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283;
        const r = 9;
        const post = new T.Mesh(new T.CylinderGeometry(0.3, 0.38, 5, 8), U.mat(0x2e2118, { flat: true }));
        post.position.set(Math.cos(a) * r, 2.5, Math.sin(a) * r); zx.add(post);
        // 受刑者剪影
        const vic = new T.Mesh(new T.CapsuleGeometry(0.4, 1.6, 4, 8), U.mat(0x2a1a16, { emissive: 0x5a1008, emissiveIntensity: 0.6 }));
        vic.position.set(Math.cos(a) * r, 3.4, Math.sin(a) * r); vic.rotation.z = Math.PI / 2; zx.add(vic);
        // 铜蛇
        const sn = new T.Mesh(new T.TorusKnotGeometry(0.7, 0.12, 48, 6, 2, 3),
          U.mat(0x6b5a20, { metalness: 0.7, roughness: 0.4, emissive: 0x2a1f00, emissiveIntensity: 0.6 }));
        sn.position.set(Math.cos(a) * r * 1.25, 0.6, Math.sin(a) * r * 1.25); zx.add(sn);
      }
      const zxFire = new T.Mesh(new T.CylinderGeometry(9.5, 9.5, 0.1, 24),
        U.mat(0x000000, { emissive: 0x5c1004, emissiveIntensity: 1.2, transparent: true, opacity: 0.5 }));
      zxFire.position.y = 0.2; zx.add(zxFire);
      zx.position.set(-38, 0, 20); g.add(zx);
      const zl = new T.PointLight(0xff3a10, 18, 40, 2); zl.position.set(-38, 4, 20); g.add(zl);
      pick(zx, {
        title: '十六诛心小地狱', sub: '五殿阎罗所辖',
        body: '小地狱内各埋木桩，铜蛇为链，铁犬作墩，捆压罪人手脚，以小刀开膛破腹，钩出其心，细细割下——心使蛇食，肠给狗吞。受苦满日，止痛完肤，再发别殿。此狱专为在世藏歹念、口善心恶者而设。',
        quote: '钩心使蛇食，剖腹见人心。'
      });

      /* --- 十殿索引碑 --- */
      const idx = U.stele('十八层地狱\n重重而下\n业火无尽', 2.4, 4.8, 0.8);
      idx.position.set(30, 2.4, 18); idx.rotation.y = -0.5; g.add(idx);
      pick(idx, {
        title: '十八层地狱', sub: '《水陆全图》名目',
        body: D.hells.map(h => h.lv + ' · ' + h.name + '：' + h.sin).join('\n'),
        quote: '层层皆业火，步步是人心。', list: 'hells'
      });
      registerArea(g, Z.yama);
    })();

    /* =========================================================
     *  六、十八层地狱（深渊）
     * ========================================================= */
    (function buildHell() {
      const g = new T.Group(); g.position.z = Z.hell; root.add(g);

      // 井壁
      const wallGeo = new T.CylinderGeometry(HELL_R + 2, HELL_R * 0.72, -HELL_BOTTOM + 20, 40, 6, true);
      const wallMat = U.mat(0x241a17, { roughness: 1, flat: true, side: T.BackSide });
      const shaft = new T.Mesh(wallGeo, wallMat);
      shaft.position.y = HELL_BOTTOM / 2 + 4;
      g.add(shaft);

      // 井口光晕
      const mouth = new T.Mesh(new T.RingGeometry(HELL_R - 6, HELL_R + 26, 48),
        U.mat(0x000000, { emissive: 0x6e1408, emissiveIntensity: 1.2, transparent: true, opacity: 0.55, side: T.DoubleSide }));
      mouth.rotation.x = -Math.PI / 2; mouth.position.y = 0.6; g.add(mouth);

      /* --- 刑具生成器 --- */
      function torture(kind) {
        const t = new T.Group();
        const dark = U.mat(0x1a1512, { flat: true });
        const steel = U.mat(0x777777, { metalness: 0.85, roughness: 0.35 });
        const hot = U.mat(0x2a0a04, { emissive: 0xff3a10, emissiveIntensity: 1.8 });
        const blood = U.mat(0x40060a, { emissive: 0x8e0a10, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 });
        switch (kind) {
          case 'tongue': // 拔舌
            {
              const frame = new T.Mesh(new T.BoxGeometry(0.4, 6, 0.4), dark); frame.position.y = 3; t.add(frame);
              const arm = new T.Mesh(new T.BoxGeometry(3.4, 0.3, 0.3), dark); arm.position.set(1.4, 5.6, 0); t.add(arm);
              for (let i = 0; i < 2; i++) {
                const jaw = new T.Mesh(new T.BoxGeometry(2.2, 0.22, 0.22), steel);
                jaw.position.set(2.4, 4.6 + i * 0.4, 0); jaw.rotation.z = (i ? 1 : -1) * 0.25; t.add(jaw);
              }
              const tongue = new T.Mesh(new T.CylinderGeometry(0.14, 0.05, 2.6, 6), U.mat(0x8e1010, { emissive: 0x6e0a08, emissiveIntensity: 0.7 }));
              tongue.position.set(2.6, 3.4, 0); t.add(tongue);
            } break;
          case 'scissor': // 剪刀
            {
              for (let i = 0; i < 2; i++) {
                const bl = new T.Mesh(new T.BoxGeometry(4.6, 0.36, 0.16), steel);
                bl.position.y = 3; bl.rotation.z = (i ? 1 : -1) * 0.42; bl.rotation.y = i ? 0.1 : -0.1; t.add(bl);
                const hd = new T.Mesh(new T.TorusGeometry(0.55, 0.14, 6, 12), steel);
                hd.position.set(i ? 1.9 : -1.9, 0.6, 0); t.add(hd);
              }
              const pin = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.5, 8), steel); pin.position.y = 3; t.add(pin);
            } break;
          case 'tree': // 铁树
            {
              const trunk = new T.Mesh(new T.CylinderGeometry(0.5, 1.1, 7, 8), U.mat(0x3a3029, { flat: true }));
              trunk.position.y = 3.5; t.add(trunk);
              for (let i = 0; i < 12; i++) {
                const a = Math.random() * 6.283, yy = 1.6 + Math.random() * 5.4;
                const sp = new T.Mesh(new T.ConeGeometry(0.14, 1.3, 5), steel);
                sp.position.set(Math.cos(a) * 1.1, yy, Math.sin(a) * 1.1);
                sp.rotation.z = Math.PI / 2 - 0.5; sp.rotation.y = -a; t.add(sp);
              }
            } break;
          case 'mirror': // 孽镜
            {
              const fr = new T.Mesh(new T.TorusGeometry(2.1, 0.22, 8, 24), U.mat(0xb08030, { metalness: 0.8, roughness: 0.35 }));
              fr.position.y = 3.6; t.add(fr);
              const fc = new T.Mesh(new T.CircleGeometry(2.05, 32),
                U.mat(0x2a3038, { metalness: 1, roughness: 0.12, emissive: 0x14181e, emissiveIntensity: 1 }));
              fc.position.y = 3.6; t.add(fc);
              const st = new T.Mesh(new T.BoxGeometry(0.5, 2.4, 0.5), dark); st.position.y = 1.2; t.add(st);
            } break;
          case 'steamer': // 蒸笼
            {
              for (let i = 0; i < 3; i++) {
                const bk = new T.Mesh(new T.CylinderGeometry(2.1, 2.1, 1.3, 16, 1, true),
                  U.mat(0x6b4a26, { roughness: 0.9, side: T.DoubleSide }));
                bk.position.y = 0.9 + i * 1.4; t.add(bk);
              }
              const lid = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 0.4, 16), U.mat(0x5c3f20, {}));
              lid.position.y = 5.4; t.add(lid);
              // 蒸汽
              const stm = new T.Mesh(new T.ConeGeometry(1.6, 3.4, 10),
                U.mat(0xbfae86, { transparent: true, opacity: 0.22, emissive: 0x554a30, emissiveIntensity: 0.5 }));
              stm.position.y = 7.4; t.add(stm);
            } break;
          case 'copper': // 铜柱
            {
              const col = new T.Mesh(new T.CylinderGeometry(1.0, 1.2, 8, 14), hot);
              col.position.y = 4; t.add(col);
              const base = new T.Mesh(new T.CylinderGeometry(2.2, 2.6, 1, 12), dark); base.position.y = 0.5; t.add(base);
            } break;
          case 'knife': // 刀山
            {
              const hill = new T.Mesh(new T.ConeGeometry(3.4, 6, 10), U.mat(0x2a1e18, { flat: true }));
              hill.position.y = 3; t.add(hill);
              for (let i = 0; i < 14; i++) {
                const a = Math.random() * 6.283, rr = Math.random() * 3;
                const hh2 = 6 * (1 - rr / 3.4);
                const bl = new T.Mesh(new T.BoxGeometry(0.14, 1.1, 0.5), steel);
                bl.position.set(Math.cos(a) * rr, 0.6 + hh2 * 0.92, Math.sin(a) * rr);
                bl.rotation.y = a; bl.rotation.x = -0.3; t.add(bl);
              }
            } break;
          case 'ice': // 冰山
            {
              for (let i = 0; i < 7; i++) {
                const cr = new T.Mesh(new T.IcosahedronGeometry(1 + Math.random() * 1.4, 0),
                  U.mat(0x8fd0e8, { transparent: true, opacity: 0.65, emissive: 0x1a4a5c, emissiveIntensity: 0.9, flat: true, roughness: 0.25 }));
                cr.position.set((Math.random() - 0.5) * 4, 0.6 + Math.random() * 4, (Math.random() - 0.5) * 4);
                cr.rotation.set(Math.random(), Math.random(), Math.random()); t.add(cr);
              }
            } break;
          case 'oil': // 油锅
            {
              const pot = new T.Mesh(new T.CylinderGeometry(2.6, 2.0, 3, 16, 1, true),
                U.mat(0x1e1a17, { metalness: 0.6, roughness: 0.5, side: T.DoubleSide }));
              pot.position.y = 1.7; t.add(pot);
              const liq = new T.Mesh(new T.CylinderGeometry(2.45, 2.45, 0.2, 16),
                U.mat(0x6b4a10, { emissive: 0xc07a10, emissiveIntensity: 1.3 }));
              liq.position.y = 2.9; t.add(liq);
              for (let i = 0; i < 4; i++) {
                const bb = new T.Mesh(new T.SphereGeometry(0.22 + Math.random() * 0.2, 8, 6),
                  U.mat(0xd8a030, { emissive: 0xff8a20, emissiveIntensity: 1.6 }));
                bb.position.set((Math.random() - 0.5) * 3, 3.1, (Math.random() - 0.5) * 3); t.add(bb);
              }
            } break;
          case 'cattle': // 牛坑
            {
              const pit = new T.Mesh(new T.CylinderGeometry(4, 4.4, 1.2, 16, 1, true),
                U.mat(0x241a14, { side: T.DoubleSide, flat: true }));
              pit.position.y = 0.6; t.add(pit);
              for (let i = 0; i < 3; i++) {
                const a = i / 3 * 6.283;
                const ox = new T.Group();
                const bd = new T.Mesh(new T.CapsuleGeometry(0.7, 1.6, 4, 8), U.mat(0x3a2018, { flat: true, emissive: 0x2a0a04, emissiveIntensity: 0.5 }));
                bd.rotation.z = Math.PI / 2; bd.position.y = 1.2; ox.add(bd);
                const hd = new T.Mesh(new T.BoxGeometry(0.9, 0.8, 0.9), U.mat(0x3a2018, { flat: true }));
                hd.position.set(1.3, 1.5, 0); ox.add(hd);
                for (const s of [-1, 1]) {
                  const hn = new T.Mesh(new T.ConeGeometry(0.15, 1.0, 5), U.mat(0x9a8a62, {}));
                  hn.position.set(1.3, 2.2, s * 0.35); hn.rotation.z = -0.5; ox.add(hn);
                }
                ox.position.set(Math.cos(a) * 2.2, 0.4, Math.sin(a) * 2.2); ox.rotation.y = -a;
                t.add(ox);
              }
            } break;
          case 'press': // 石压
            {
              const slab = new T.Mesh(new T.BoxGeometry(6, 2.4, 5), U.mat(0x3a3630, { flat: true }));
              slab.position.y = 1.4; t.add(slab);
              const vic = new T.Mesh(new T.CapsuleGeometry(0.4, 1.4, 4, 8), U.mat(0x2a1a16, {}));
              vic.position.y = 0.35; vic.rotation.z = Math.PI / 2; t.add(vic);
              const crack = new T.Mesh(new T.BoxGeometry(6.1, 0.1, 0.1), U.mat(0x8e1010, { emissive: 0x5a0a06, emissiveIntensity: 1 }));
              crack.position.set(0, 2.6, 2.4); t.add(crack);
            } break;
          case 'mortar': // 舂臼
            {
              const bowl = new T.Mesh(new T.CylinderGeometry(2.4, 1.6, 2.6, 16, 1, true),
                U.mat(0x3a3630, { flat: true, side: T.DoubleSide }));
              bowl.position.y = 1.3; t.add(bowl);
              const pestle = new T.Mesh(new T.CylinderGeometry(0.45, 0.55, 5.4, 10), U.mat(0x4a4440, { flat: true }));
              pestle.position.y = 4.4; pestle.rotation.z = 0.22; t.add(pestle);
            } break;
          case 'blood': // 血池
            {
              const pool = new T.Mesh(new T.CylinderGeometry(3.6, 3.6, 0.3, 20), blood);
              pool.position.y = 0.4; t.add(pool);
              const rim2 = new T.Mesh(new T.TorusGeometry(3.7, 0.35, 6, 20), U.mat(0x2a1a18, { flat: true }));
              rim2.rotation.x = Math.PI / 2; rim2.position.y = 0.5; t.add(rim2);
              for (let i = 0; i < 5; i++) {
                const hd = new T.Mesh(new T.SphereGeometry(0.32, 8, 6), U.mat(0x9a9088, {}));
                hd.position.set((Math.random() - 0.5) * 5, 0.55, (Math.random() - 0.5) * 5); t.add(hd);
              }
            } break;
          case 'hang': // 枉死（绳套）
            {
              const beam2 = new T.Mesh(new T.BoxGeometry(5, 0.4, 0.4), dark); beam2.position.y = 6.4; t.add(beam2);
              for (const s of [-1, 1]) {
                const po = new T.Mesh(new T.BoxGeometry(0.35, 6.4, 0.35), dark);
                po.position.set(s * 2.3, 3.2, 0); t.add(po);
              }
              const rope = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2, 6), U.mat(0x8a7a52, {}));
              rope.position.y = 5.4; t.add(rope);
              const noose = new T.Mesh(new T.TorusGeometry(0.7, 0.09, 6, 16), U.mat(0x8a7a52, {}));
              noose.position.y = 4.2; noose.rotation.x = Math.PI / 2; t.add(noose);
              const gh = new T.Mesh(new T.CapsuleGeometry(0.38, 1.3, 4, 8),
                U.mat(0x9ab0c4, { transparent: true, opacity: 0.34, emissive: 0x2e5a66, emissiveIntensity: 0.8 }));
              gh.position.y = 2.6; t.add(gh);
            } break;
          case 'zhe': // 磔刑
            {
              const cross = new T.Mesh(new T.BoxGeometry(5, 0.35, 0.35), dark); cross.position.y = 4.2; t.add(cross);
              const post2 = new T.Mesh(new T.BoxGeometry(0.35, 4.4, 0.35), dark); post2.position.y = 2.2; t.add(post2);
              for (let i = 0; i < 6; i++) {
                const kn = new T.Mesh(new T.BoxGeometry(0.12, 1.1, 0.35), steel);
                kn.position.set(-2 + i * 0.8, 3.4, 0.3); kn.rotation.x = 0.3; t.add(kn);
              }
            } break;
          case 'volcano': // 火山
            {
              const cone = new T.Mesh(new T.ConeGeometry(3.6, 6.5, 12), U.mat(0x241014, { flat: true }));
              cone.position.y = 3.2; t.add(cone);
              const lava = new T.Mesh(new T.ConeGeometry(1.1, 1.6, 10), hot);
              lava.position.y = 6.6; t.add(lava);
              for (let i = 0; i < 5; i++) {
                const a = i / 5 * 6.283;
                const fl = new T.Mesh(new T.ConeGeometry(0.4, 1.8, 6), hot);
                fl.position.set(Math.cos(a) * 2.2, 1.2 + Math.random() * 2, Math.sin(a) * 2.2);
                fl.rotation.z = -Math.cos(a) * 0.5; t.add(fl);
              }
            } break;
          case 'mill': // 石磨
            {
              const base = new T.Mesh(new T.CylinderGeometry(2.6, 2.8, 0.8, 16), U.mat(0x3a3630, { flat: true }));
              base.position.y = 0.4; t.add(base);
              const top2 = new T.Mesh(new T.CylinderGeometry(2.4, 2.6, 1.2, 16), U.mat(0x463f38, { flat: true }));
              top2.position.y = 1.4; t.add(top2);
              const axle = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 3.4, 8), U.mat(0x2e2118, {}));
              axle.position.y = 3.2; t.add(axle);
              const handle = new T.Mesh(new T.BoxGeometry(3.2, 0.22, 0.22), U.mat(0x3a2f22, {}));
              handle.position.set(1.2, 4.7, 0); t.add(handle);
            } break;
          default: // saw 刀锯
            {
              const bed = new T.Mesh(new T.BoxGeometry(6.4, 0.5, 1.4), dark); bed.position.y = 2.2; t.add(bed);
              for (const s of [-1, 1]) {
                const leg = new T.Mesh(new T.BoxGeometry(0.4, 2.2, 0.4), dark);
                leg.position.set(s * 2.8, 1.1, 0); t.add(leg);
              }
              const saw = new T.Mesh(new T.BoxGeometry(5.4, 2.6, 0.1), steel); saw.position.y = 3.7; t.add(saw);
              for (let i = 0; i < 14; i++) {
                const tooth = new T.Mesh(new T.ConeGeometry(0.16, 0.4, 4), steel);
                tooth.position.set(-2.6 + i * 0.4, 2.35, 0.08); tooth.rotation.x = Math.PI; t.add(tooth);
              }
            }
        }
        return t;
      }

      const kinds = ['tongue', 'scissor', 'tree', 'mirror', 'steamer', 'copper', 'knife', 'ice', 'oil',
        'cattle', 'press', 'mortar', 'blood', 'hang', 'zhe', 'volcano', 'mill', 'saw'];

      const layerTop = -6, layerGap = 8.4;
      const platformMat = U.mat(0x2a201c, { flat: true, roughness: 1 });

      for (let i = 0; i < 18; i++) {
        const y = layerTop - i * layerGap;
        const lv = D.hells[i];
        const lg = new T.Group();
        lg.position.y = y;

        // 环形平台
        const ring = new T.Mesh(new T.RingGeometry(HELL_R * 0.52, HELL_R * 0.94, 40, 1), platformMat);
        ring.rotation.x = -Math.PI / 2; lg.add(ring);
        // 外沿
        const edge = new T.Mesh(new T.CylinderGeometry(HELL_R * 0.94, HELL_R * 0.94, 0.8, 40, 1, true),
          U.mat(0x1c1512, { side: T.DoubleSide, flat: true }));
        edge.position.y = -0.4; lg.add(edge);
        // 通往下一层的斜坡（阶梯）
        for (let k = 0; k < 3; k++) {
          const st = new T.Mesh(new T.BoxGeometry(5, 0.5, 2.4), U.mat(0x33261f, { flat: true }));
          const a = (i % 3) * 2.1 + 0.6;
          st.position.set(Math.cos(a) * (HELL_R * 0.72), -k * 1.4 - 0.6, Math.sin(a) * (HELL_R * 0.72));
          st.rotation.y = -a; st.rotation.x = -0.35;
          lg.add(st);
        }

        // 层名牌匾
        const pfA = U.plaque(lv.lv + '\n' + name, 7.4, 3.4, { vertical: false, bg: '#140a08', fg: '#e07a4a' });
        pfA.position.set(0, 5.2, HELL_R * 0.88);
        lg.add(pfA);
        const pfB = pfA.clone();
        pfB.position.set(0, 5.2, -HELL_R * 0.88);
        pfB.rotation.y = Math.PI;
        lg.add(pfB);

        // 刑具 ×2
        const kd = kinds[i];
        for (let k = 0; k < 2; k++) {
          const a = k / 3 * 6.283 + i * 0.5;
          const tk = torture(kd);
          tk.position.set(Math.cos(a) * HELL_R * 0.74, 0, Math.sin(a) * HELL_R * 0.74);
          tk.rotation.y = -a;
          tk.scale.setScalar(0.95);
          lg.add(tk);
        }
        // 每层一盏鬼火灯（靠 emissive 与少量点光源交替）
        const torch = new T.Mesh(new T.SphereGeometry(0.7, 8, 6),
          U.mat(0x000000, { emissive: 0xff5a1a, emissiveIntensity: 2.2 }));
        torch.position.set(0, 2.4, HELL_R * 0.8); lg.add(torch);
        if (i % 3 === 0) {
          const lp = new T.PointLight(0xff4a12, 12, 46, 2);
          lp.position.set(0, 3, HELL_R * 0.7); lg.add(lp);
        }
        g.add(lg);

        // 该层可点击（用代理盒圈整层）
        const bb = new T.Box3(
          new T.Vector3(-HELL_R, -1, -HELL_R),
          new T.Vector3(HELL_R, 8, HELL_R)
        );
        pick(lg, {
          title: lv.lv + ' · ' + lv.name, sub: '所治之罪：' + lv.sin,
          body: lv.d,
          quote: '此狱专为' + lv.sin + '者而设。'
        }, bb);
      }

      // 井底阿鼻火海
      const bottom = new T.Mesh(new T.CircleGeometry(HELL_R * 0.8, 32),
        U.mat(0x000000, { emissive: 0x8e1408, emissiveIntensity: 1.6 }));
      bottom.rotation.x = -Math.PI / 2;
      bottom.position.y = HELL_BOTTOM + 2;
      g.add(bottom);
      const bl = new T.PointLight(0xff2a08, 40, 140, 2); bl.position.set(0, HELL_BOTTOM + 14, 0); g.add(bl);
      updaters.push(function (t) {
        bottom.material.emissiveIntensity = 1.2 + Math.sin(t * 1.4) * 0.5;
        bl.intensity = 34 + Math.sin(t * 2.1) * 12;
        mouth.material.opacity = 0.45 + Math.sin(t * 0.8) * 0.14;
      });
      pick(bottom, {
        title: '阿鼻地狱 · 无间', sub: '第九殿平等王所辖',
        body: '梵语「阿鼻」意为无间：受苦无间断、身形无间、时无间、命无间。罪人日夜受刑，无有片刻喘息，一人亦满，多人亦满。杀人放火、奸淫掳掠、十恶不赦者堕此，罪孽消尽方得转解第十殿；案卷须呈酆都大帝终审。',
        quote: '无间地狱无间苦，一念回头便是春。'
      }, new T.Box3(new T.Vector3(-60, -2, -60), new T.Vector3(60, 2, 60)));

      // 井口石碑
      const hs = U.stele('十八层地狱\n入此门者\n万劫不复', 3.2, 6.4, 1);
      hs.position.set(HELL_R + 12, 3.2, 16); g.add(hs);
      pick(hs, {
        title: '十八层地狱', sub: '《水陆全图》名目',
        body: D.hells.map(h => h.lv + ' · ' + h.name + '：' + h.sin).join('\n'),
        quote: '层层皆业火，步步是人心。', list: 'hells'
      });
      registerArea(g, Z.hell);
    })();

    /* =========================================================
     *  七、六道轮回 · 转轮台
     * ========================================================= */
    (function buildSamsara() {
      const g = new T.Group(); g.position.z = Z.samsara; root.add(g);

      // 台基
      const base = new T.Mesh(new T.CylinderGeometry(34, 38, 2.6, 32), U.mat(0x332c26, { flat: true }));
      base.position.y = 0.6; g.add(base);
      const base2 = new T.Mesh(new T.CylinderGeometry(26, 30, 1.8, 32), U.mat(0x3b342c, { flat: true }));
      base2.position.y = 2.6; g.add(base2);
      // 莲花座
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * 6.283;
        const petal = new T.Mesh(new T.SphereGeometry(4.4, 8, 6), U.mat(0x8e2a2a, { flat: true }));
        petal.scale.set(1, 0.35, 1.7);
        petal.position.set(Math.cos(a) * 22, 3.5, Math.sin(a) * 22);
        petal.rotation.y = -a; petal.rotation.x = 0.45;
        g.add(petal);
      }

      /* --- 大法轮 --- */
      const wheel = new T.Group();
      const R = 21;
      const rim = new T.Mesh(new T.TorusGeometry(R, 1.5, 12, 64), U.mat(0x6b4a1a, { metalness: 0.7, roughness: 0.4 }));
      wheel.add(rim);
      const rim2 = new T.Mesh(new T.TorusGeometry(R - 2.2, 0.5, 8, 64), U.mat(0xc9a227, { metalness: 0.9, roughness: 0.25, emissive: 0x3a2a00, emissiveIntensity: 0.6 }));
      wheel.add(rim2);
      // 辐条 + 扇形道板
      const paths = D.sixPaths;
      for (let i = 0; i < 6; i++) {
        const a0 = i / 6 * Math.PI * 2;
        const spoke = new T.Mesh(new T.BoxGeometry(R - 1, 0.8, 0.6), U.mat(0x5c3f18, { metalness: 0.5, roughness: 0.5 }));
        spoke.position.set(Math.cos(a0 + Math.PI / 6) * R / 2, Math.sin(a0 + Math.PI / 6) * R / 2, 0);
        spoke.rotation.z = a0 + Math.PI / 6;
        wheel.add(spoke);
        // 扇形
        const seg = new T.Mesh(
          new T.RingGeometry(4.6, R - 2.4, 24, 1, a0, Math.PI / 3 - 0.02),
          U.mat(new T.Color(paths[i].color), { emissive: new T.Color(paths[i].color), emissiveIntensity: 0.22, roughness: 0.7, transparent: true, opacity: 0.62, side: T.DoubleSide })
        );
        wheel.add(seg);
        // 道名牌
        const pn = U.plaque(paths[i].name, 6.4, 2.6, { vertical: false, bg: 'rgba(0,0,0,0)', fg: '#f5e6c8', border: 'rgba(240,220,180,0.5)', borderWidth: 5, glow: 'rgba(255,220,140,0.5)', grain: false });
        const am = a0 + Math.PI / 6;
        pn.position.set(Math.cos(am) * 13.4, Math.sin(am) * 13.4, 0.6);
        pn.rotation.z = am - Math.PI / 2;
        wheel.add(pn);
      }
      // 轮心
      const hub = new T.Mesh(new T.SphereGeometry(4.2, 16, 12), U.mat(0x2a1c14, { metalness: 0.4, roughness: 0.5 }));
      wheel.add(hub);
      const hub2 = new T.Mesh(new T.TorusGeometry(4.6, 0.5, 8, 32), U.mat(0xd4af37, { metalness: 0.9, roughness: 0.22, emissive: 0x4a3600, emissiveIntensity: 0.7 }));
      wheel.add(hub2);
      for (let i = 0; i < 3; i++) {
        const ring3 = new T.Mesh(new T.TorusGeometry(2.6 - i * 0.7, 0.16, 6, 24), U.mat(0xc9a227, { metalness: 0.9, roughness: 0.3 }));
        wheel.add(ring3);
      }
      wheel.position.set(0, 27, 0);
      g.add(wheel);
      refs.wheel = wheel;

      // 立柱支撑
      for (const s of [-1, 1]) {
        const p = new T.Mesh(new T.CylinderGeometry(1.4, 2.0, 26, 12), U.mat(0x5c2118, { flat: true }));
        p.position.set(s * 24, 13, -2); g.add(p);
        const dragon = new T.Mesh(new T.ConeGeometry(1.6, 3.2, 6), U.mat(0xc9a227, { metalness: 0.8, roughness: 0.3 }));
        dragon.position.set(s * 24, 27.5, -2); g.add(dragon);
      }
      // 轮下的业海
      const sea = new T.Mesh(new T.CircleGeometry(30, 40),
        U.mat(0x1a0a10, { emissive: 0x4a0a20, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 }));
      sea.rotation.x = -Math.PI / 2; sea.position.y = 0.3; g.add(sea);

      const wl = new T.PointLight(0xffd08a, 30, 90, 2); wl.position.set(0, 27, 12); g.add(wl);
      updaters.push(function (t) { wl.intensity = 26 + Math.sin(t * 1.1) * 6; });

      wheel.userData.speed = 0.06;
      wheel.userData.boost = 0;
      wheel.userData.spinning = false;
      updaters.push(function (t, dt) {
        wheel.rotation.z -= wheel.userData.speed * dt;
        if (wheel.userData.boost > 0) {
          wheel.userData.boost -= dt;
          if (wheel.userData.boost <= 0) {
            wheel.userData.speed = 0.06;
            wheel.userData.spinning = false;
            if (wheel.userData.onStop) { wheel.userData.onStop(); wheel.userData.onStop = null; }
          }
        }
      });

      pick(wheel, {
        title: '六道轮回', sub: '十殿转轮王所司',
        body: '转轮王核定各殿解到鬼魂的善恶等级，发往四大部洲投生。轮分六道：天道、阿修罗道、人道为三善道；畜生道、饿鬼道、地狱道为三恶道。或年季生死，或朝生暮死，翻覆变换，皆随业力自转，非阎王所能私与人情。',
        quote: '轮推磨转无停日，一念之差六道分。', action: 'wheel'
      }, new T.Box3(new T.Vector3(-24, -24, -4), new T.Vector3(24, 24, 4)));

      // 转轮王像
      const tw = new T.Group();
      const robe = new T.Mesh(new T.CylinderGeometry(1.6, 2.6, 4.6, 12), U.mat(0x2a3a5c, { flat: true }));
      robe.position.y = 2.3; tw.add(robe);
      const hd = new T.Mesh(new T.SphereGeometry(1.0, 14, 12), U.mat(0x3d2a1e, { flat: true }));
      hd.position.y = 5.2; tw.add(hd);
      const crown = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 0.6, 12), U.mat(0xc9a227, { metalness: 0.8, roughness: 0.3 }));
      crown.position.y = 6.1; tw.add(crown);
      const wheelSmall = new T.Mesh(new T.TorusGeometry(1.1, 0.18, 8, 24), U.mat(0xd4af37, { metalness: 0.9, roughness: 0.25, emissive: 0x5a4200, emissiveIntensity: 0.8 }));
      wheelSmall.position.set(1.5, 3.4, 0.6); wheelSmall.rotation.y = 0.4; tw.add(wheelSmall);
      const scroll = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 2.2, 8), U.mat(0xd8cba8, {}));
      scroll.position.set(-1.5, 3.2, 0.5); scroll.rotation.z = 0.4; tw.add(scroll);
      tw.position.set(-30, 3.6, 22); tw.rotation.y = 0.7;
      g.add(tw);
      pick(tw, {
        title: '第十殿 · 转轮王', sub: '薛礼 · 肃英宫 · 四月十七诞辰',
        body: D.tenKings[9].sin + '　' + D.tenKings[9].d,
        quote: '转轮一转分六道，孟婆汤尽便为人。'
      });

      // 六道石碑
      const sp = U.stele('六道轮回\n天道　人道　修罗\n畜生　饿鬼　地狱', 3, 6, 1);
      sp.position.set(30, 3, 22); sp.rotation.y = -0.7; g.add(sp);
      pick(sp, {
        title: '六道', sub: '三善道 · 三恶道',
        body: D.sixPaths.map(p => p.name + '（' + p.type + '道）：' + p.d).join('\n'),
        quote: '一念之差六道分。', list: 'paths'
      });
      registerArea(g, Z.samsara);
    })();

    /* =========================================================
     *  全局：地府官员索引碑（起点处）
     * ========================================================= */
    (function buildIndex() {
      const g = new T.Group(); root.add(g);
      const items = [
        { pos: [-30, Z.gate + 60], txt: '幽冥神职\n酆都大帝\n东岳大帝\n地藏王\n黑白无常\n牛头马面\n崔判官\n孟婆',
          data: { title: '幽冥神职', sub: '地府职官', body: D.spirits.map(s => s.name + '：' + s.d).join('\n'), quote: '阴曹设百官，专管鬼与魂。', list: 'spirits' } },
        { pos: [30, Z.gate + 60], txt: '亡魂路程\n勾魂\n鬼门关\n黄泉路\n奈何桥\n十殿\n六道',
          data: { title: '亡魂入冥之路', sub: '自阳间至轮回', body: D.process.map((p, i) => (i + 1) + '. ' + p.t + '：' + p.d).join('\n'), quote: '七七四十九日，走完十殿。', list: 'process' } }
      ];
      for (const it of items) {
        const st = U.stele(it.txt, 2.6, 5.6, 0.9);
        st.position.set(it.pos[0], 2.8, it.pos[1]);
        st.rotation.y = it.pos[0] > 0 ? -0.35 : 0.35;
        g.add(st);
        pick(st, it.data);
      }
      registerArea(g, Z.gate + 60);
    })();

    /* ---------- 每帧更新 ---------- */
    function update(t, dt, camPos) {
      skyMat.uniforms.uT.value = t;
      for (const f of updaters) f(t, dt);
      for (const L of lights) {
        L.l.intensity = L.base * (0.82 + Math.sin(t * 3.1 + L.s) * 0.12 + Math.sin(t * 7.7 + L.s * 2) * 0.06);
      }
      if (camPos) {
        for (const g of areaGroups) {
          g.visible = Math.abs(camPos.z - g.userData.centerZ) < 520;
        }
      }
    }

    return { root, picks, update, refs, Z, terrainH, HELL_R, HELL_BOTTOM };
  }

  return { build, Z, terrainH, HELL_R, HELL_BOTTOM };
})();
