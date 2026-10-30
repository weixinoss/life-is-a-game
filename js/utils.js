/* ============================================================
 *  工具库：文字纹理 / 程序化几何 / 噪声 / 伪随机
 * ============================================================ */
window.MJ = window.MJ || {};

MJ.U = (function () {
  const T = window.THREE;

  /* ---------- 可复现的伪随机 ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- 二维 value noise ---------- */
  function hash2(x, y) {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  function fbm(x, y) {
    return noise2(x, y) * 0.5 + noise2(x * 2.03, y * 2.03) * 0.25 + noise2(x * 4.11, y * 4.11) * 0.15;
  }

  /* ---------- 中文文字纹理 ---------- */
  const FONT = '"Songti SC","STSong","SimSun","Noto Serif SC","Source Han Serif SC",serif';

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /**
   * 生成文字贴图
   * @param {string} text 文字（可含 \n 换行；竖排时按字符换行）
   * @param {object} o {w,h,bg,fg,font,vertical,align,sub,border,glow,letterSpacing}
   */
  function textTexture(text, o) {
    o = o || {};
    const w = o.w || 512, h = o.h || 256;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const bg = o.bg || '#1a0e0c';
    const fg = o.fg || '#e8c86a';
    g.fillStyle = bg; g.fillRect(0, 0, w, h);

    // 底纹：木纹 / 石纹
    if (o.grain !== false) {
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const a = Math.random() * 0.09;
        g.fillStyle = (Math.random() > 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a + ')');
        g.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
      }
    }
    // 边框
    if (o.border) {
      g.strokeStyle = o.border; g.lineWidth = o.borderWidth || 6;
      g.strokeRect(o.borderWidth || 6, o.borderWidth || 6, w - (o.borderWidth || 6) * 2, h - (o.borderWidth || 6) * 2);
    }

    const lines = String(text).split('\n');
    g.textAlign = 'center'; g.textBaseline = 'middle';

    if (o.vertical) {
      const cols = lines.length;
      const colW = w / cols;
      const size = Math.min(colW * 0.72, (h * 0.8) / Math.max(...lines.map(l => l.length)));
      g.font = (o.weight || 'bold ') + size + 'px ' + (o.font || FONT);
      lines.forEach((line, ci) => {
        const chars = line.split('');
        const step = (h * 0.86) / chars.length;
        chars.forEach((ch, ri) => {
          const x = w - colW * (ci + 0.5);
          const y = h * 0.07 + step * (ri + 0.5);
          if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * 0.5; }
          g.fillStyle = fg; g.fillText(ch, x, y);
          g.shadowBlur = 0;
        });
      });
    } else {
      const size = Math.min((w * 0.86) / Math.max(...lines.map(l => l.length)), (h * 0.6) / lines.length);
      g.font = (o.weight || 'bold ') + size + 'px ' + (o.font || FONT);
      const step = (h * 0.86) / lines.length;
      lines.forEach((line, i) => {
        const y = h * 0.07 + step * (i + 0.5);
        if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * 0.45; }
        g.fillStyle = fg; g.fillText(line, w / 2, y);
        g.shadowBlur = 0;
      });
    }
    // 副标题
    if (o.sub) {
      const s = Math.floor(h * 0.1);
      g.font = s + 'px ' + FONT;
      g.fillStyle = o.subColor || 'rgba(200,170,120,0.7)';
      g.fillText(o.sub, w / 2, h * 0.9);
    }

    const tex = new T.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* ---------- 圆形光晕贴图（鬼火 / 粒子） ---------- */
  function glowTexture(inner, outer) {
    const c = makeCanvas(128, 128), g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, inner || 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, outer || 'rgba(255,210,120,0.55)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  /* ---------- 烟雾 / 血雾贴图 ---------- */
  function smokeTexture() {
    const c = makeCanvas(128, 128), g = c.getContext('2d');
    for (let i = 0; i < 40; i++) {
      const x = 64 + (Math.random() - 0.5) * 70;
      const y = 64 + (Math.random() - 0.5) * 70;
      const r = 12 + Math.random() * 26;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(255,255,255,0.10)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  /* ---------- 中式屋顶（四角起翘） ---------- */
  function chineseRoof(w, d, h, seg) {
    seg = seg || 20;
    const geo = new T.PlaneGeometry(w, d, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const a = w / 2, b = d / 2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const u = Math.abs(x) / a, v = Math.abs(z) / b;
      const t = Math.max(u, v);
      // 屋面自脊向檐下降，檐角微微起翘
      let y = h * Math.pow(1 - t, 1.35);
      y += h * 0.22 * Math.pow(u * v, 2.2);
      // 屋脊细部
      y -= h * 0.05 * Math.sin(u * Math.PI);
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }

  /* ---------- 灯笼 ---------- */
  function lantern(radius, color) {
    const g = new T.Group();
    const body = new T.Mesh(
      new T.SphereGeometry(radius, 16, 12),
      new T.MeshStandardMaterial({
        color: 0x6b0d0d, emissive: new T.Color(color || 0xff5522),
        emissiveIntensity: 1.4, roughness: 0.7, transparent: true, opacity: 0.95
      })
    );
    body.scale.set(1, 0.78, 1);
    g.add(body);
    const capMat = new T.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.6, metalness: 0.4 });
    const cap = new T.Mesh(new T.CylinderGeometry(radius * 0.42, radius * 0.42, radius * 0.28, 12), capMat);
    cap.position.y = radius * 0.78; g.add(cap);
    const cap2 = cap.clone(); cap2.position.y = -radius * 0.78; g.add(cap2);
    const tassel = new T.Mesh(
      new T.ConeGeometry(radius * 0.16, radius * 0.9, 8),
      new T.MeshStandardMaterial({ color: 0xc9a227, emissive: 0x332000, roughness: 0.5 })
    );
    tassel.position.y = -radius * 1.35; tassel.rotation.x = Math.PI; g.add(tassel);
    return g;
  }

  /* ---------- 幡 / 旗（双面上书大字） ---------- */
  function banner(text, w, h, color) {
    const tex = textTexture(text, {
      w: 256, h: 512, vertical: true,
      bg: '#5a0f0c', fg: color || '#f0d68a', border: 'rgba(230,190,110,0.55)', borderWidth: 8,
      glow: 'rgba(255,120,40,0.6)'
    });
    const mat = new T.MeshStandardMaterial({
      map: tex, transparent: true, side: T.DoubleSide,
      emissive: 0x3a0a06, emissiveIntensity: 0.6, roughness: 0.9
    });
    const m = new T.Mesh(new T.PlaneGeometry(w, h, 1, 8), mat);
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, Math.sin(pos.getY(i) * 2.2) * 0.06);
    }
    m.geometry.computeVertexNormals();
    return m;
  }

  /* ---------- 石碑 / 牌匾 ---------- */
  function plaque(text, w, h, o) {
    o = o || {};
    const tex = textTexture(text, {
      w: 512, h: 256, vertical: !!o.vertical,
      bg: o.bg || '#160d0a', fg: o.fg || '#e8c86a',
      border: 'rgba(200,160,80,0.65)', borderWidth: 10, glow: 'rgba(255,160,60,0.35)'
    });
    const mat = new T.MeshStandardMaterial({
      map: tex, emissive: 0x241009, emissiveIntensity: 0.8, roughness: 0.65, metalness: 0.15
    });
    return new T.Mesh(new T.PlaneGeometry(w, h), mat);
  }

  function stele(text, w, h, d) {
    const g = new T.Group();
    const tex = textTexture(text, {
      w: 256, h: 512, vertical: true, bg: '#20201e', fg: '#b8352c',
      border: 'rgba(120,110,90,0.5)', borderWidth: 6, glow: 'rgba(200,40,30,0.35)'
    });
    const body = new T.Mesh(
      new T.BoxGeometry(w, h, d),
      [
        new T.MeshStandardMaterial({ color: 0x2a2a26, roughness: 0.95 }),
        new T.MeshStandardMaterial({ color: 0x2a2a26, roughness: 0.95 }),
        new T.MeshStandardMaterial({ color: 0x33332e, roughness: 0.95 }),
        new T.MeshStandardMaterial({ color: 0x1a1a17, roughness: 0.95 }),
        new T.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0x1a0503, emissiveIntensity: 0.7 }),
        new T.MeshStandardMaterial({ color: 0x22221e, roughness: 0.95 })
      ]
    );
    g.add(body);
    const cap = new T.Mesh(new T.BoxGeometry(w * 1.18, h * 0.09, d * 1.18),
      new T.MeshStandardMaterial({ color: 0x33332c, roughness: 0.9 }));
    cap.position.y = h / 2 + h * 0.04; g.add(cap);
    return g;
  }

  /* ---------- 材质快捷方式 ---------- */
  function mat(color, o) {
    o = o || {};
    return new T.MeshStandardMaterial({
      color: color, roughness: o.roughness !== undefined ? o.roughness : 0.9,
      metalness: o.metalness !== undefined ? o.metalness : 0.05,
      emissive: o.emissive !== undefined ? o.emissive : 0x000000,
      emissiveIntensity: o.emissiveIntensity !== undefined ? o.emissiveIntensity : 1,
      transparent: !!o.transparent, opacity: o.opacity !== undefined ? o.opacity : 1,
      side: o.side || T.FrontSide, flatShading: !!o.flat
    });
  }

  return {
    mulberry32, noise2, fbm, textTexture, glowTexture, smokeTexture,
    chineseRoof, lantern, banner, plaque, stele, mat, FONT
  };
})();
