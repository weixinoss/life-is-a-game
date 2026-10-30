import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

/* =========================================================================
   天庭漫游 · Heavenly Court Roam
   A fully procedural, interactive, photorealistic-styled 3D heaven.
   ========================================================================= */

/* ---------------------------- i18n ------------------------------------- */
const I18N = {
  zh: {
    loadingTitle: '加载天宫中…',
    loadingSub: '正在凝聚云海与殿宇',
    retry: '重试',
    tour: '自动漫游',
    tourStop: '停止漫游',
    reset: '重置视角',
    landmarks: '天宫地标',
    hint: '拖拽旋转 · 滚轮缩放 · 点击地标前往 · 靠近玉简可拾取',
    errorTitle: '加载失败',
    errorWebGL: '您的浏览器或设备不支持 WebGL，无法渲染 3D 天庭。请更换支持 WebGL 的浏览器后重试。',
    errorGeneric: '天庭初始化时发生错误：',
    infoHint: '点击左侧地标可飞往该殿宇',
    dayNight: '昼夜流转',
    meteor: '流星雨',
    voice: '语音讲解',
    beasts: '瑞兽图鉴',
    show: '显示',
    hide: '隐藏',
    follow: '跟随',
    following: '跟随中',
    beastHint: '点击瑞兽可跟随观赏 · 点击建筑聆听讲解',
    questTitle: '仙箓册',
    questSub: '天庭散落三枚玉简。御风抵达，拾得一枚，便读得一段旧事。',
    questBanner: '三枚玉简归位，天庭重光。云路已开，随你去看哪一座殿宇。',
    questReset: '重头来过',
    questDone: '已归位',
    questReady: '可拾取',
    questLantern: '瑶池：点击水面放河灯',
    questPickKey: '按 <b>E</b> 拾取玉简',
    questPickTap: '点击玉简拾取',
    questLocked: '尚未拾得。御风前去，玉简便浮在殿前。',
    questGotZh: '拾得玉简 · ',
    questGotEn: 'Jade slip taken · ',
    questAll: '三枚玉简归位 · 天庭重光',
    questAllEn: 'Three slips returned · the court shines again',
    questResetTipZh: '仙箓已重置',
    questResetTipEn: 'Register reset',
    questLanternTipZh: '河灯已放',
    questLanternTipEn: 'Lantern set afloat',
    questOpenTipZh: '三盏河灯亮起，玉简浮出水面',
    questOpenTipEn: 'Three lanterns lit — a jade slip rises from the water',
    games: '玩法',
    gameGuide: '引路凤凰',
    gameStar: '观星连线',
    gameFish: '云海垂钓',
    gameDive: '镜池入水',
    gameMoon: '月相门',
    quizTitle: '御道登阶',
    quizRightZh: '答对了 · 仙阶洞开',
    quizWrongZh: '再想想',
    guideNoneZh: '诸处玉简已尽归位',
    guideGoZh: '凤凰引你前往 · ',
    starSolvedZh: '星官连成 · 点亮 ',
    fishGotZh: '云海钓得 · ',
    diveNearZh: '需临近瑶池方可入水',
    diveInZh: '潜入镜池 · 水中天',
    diveOutZh: '浮出水面',
    gameHint: '引路凤凰会带你前往最近的玉简；观星连线点亮空殿；云海垂钓抛钩入云；镜池入水可见水中天。',
  },
  en: {
    loadingTitle: 'Summoning the Heavenly Court…',
    loadingSub: 'Gathering clouds and palaces',
    retry: 'Retry',
    tour: 'Auto Tour',
    tourStop: 'Stop Tour',
    reset: 'Reset View',
    landmarks: 'Celestial Landmarks',
    hint: 'Drag to orbit · scroll to zoom · tap a landmark to fly · approach a jade slip to take it',
    errorTitle: 'Load Failed',
    errorWebGL: 'Your browser or device does not support WebGL, so the 3D heaven cannot be rendered. Please use a WebGL-capable browser and retry.',
    errorGeneric: 'An error occurred while building the heaven: ',
    infoHint: 'Tap a landmark on the left to fly there',
    dayNight: 'Day / Night',
    meteor: 'Meteors',
    voice: 'Voice Guide',
    beasts: 'Bestiary',
    show: 'Show',
    hide: 'Hide',
    follow: 'Follow',
    following: 'Following',
    beastHint: 'Tap a beast to follow · tap a palace to hear its tale',
    questTitle: 'Register of Jade Slips',
    questSub: 'Three jade slips lie scattered across the court. Reach one, take it, and a fragment of the old tale opens.',
    questBanner: 'All three slips returned — the court shines again. The cloud paths are open.',
    questReset: 'Start over',
    questDone: 'Returned',
    questReady: 'Ready',
    questLantern: 'Jade Pool · tap the water to float a lantern',
    questPickKey: 'Press <b>E</b> to take the jade slip',
    questPickTap: 'Tap the jade slip to take it',
    questLocked: 'Not yet found. Travel there — the slip floats before the hall.',
    questGotZh: '拾得玉简 · ',
    questGotEn: 'Jade slip taken · ',
    questAll: '三枚玉简归位 · 天庭重光',
    questAllEn: 'Three slips returned · the court shines again',
    questResetTipZh: '仙箓已重置',
    questResetTipEn: 'Register reset',
    questLanternTipZh: '河灯已放',
    questLanternTipEn: 'Lantern set afloat',
    questOpenTipZh: '三盏河灯亮起，玉简浮出水面',
    questOpenTipEn: 'Three lanterns lit — a jade slip rises from the water',
    games: 'Gameplay',
    gameGuide: 'Guide Phoenix',
    gameStar: 'Stargaze',
    gameFish: 'Fish the Clouds',
    gameDive: 'Dive the Pool',
    gameMoon: 'Moon Gate',
    quizTitle: 'Trial of the Imperial Way',
    quizRightZh: '答对了 · 仙阶洞开',
    quizRightEn: 'Correct · the stair yields',
    quizWrongZh: '再想想',
    quizWrongEn: 'Look again',
    guideNoneZh: '诸处玉简已尽归位',
    guideNoneEn: 'All jade slips are returned',
    guideGoZh: '凤凰引你前往 · ',
    guideGoEn: 'The phoenix leads you to · ',
    starSolvedZh: '星官连成 · 点亮 ',
    starSolvedEn: 'Constellation formed · lit ',
    fishGotZh: '云海钓得 · ',
    fishGotEn: 'Hauled from the clouds · ',
    diveNearZh: '需临近瑶池方可入水',
    diveNearEn: 'Approach the Jade Pool to dive',
    diveInZh: '潜入镜池 · 水中天',
    diveInEn: 'Descend into the mirror pool',
    diveOutZh: '浮出水面',
    diveOutEn: 'Risen to the surface',
    gameHint: 'The guiding phoenix leads you to the nearest jade slip; stargazing lights empty halls; cast into the clouds to fish; dive the pool for the under-water heaven.',
  },
};
let lang = (navigator.language || 'zh').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
const t = (k) => (I18N[lang][k] !== undefined ? I18N[lang][k] : I18N.zh[k]);

/* ---------------------------- Landmark data ---------------------------- */
const LANDMARKS = [
  { id:'lingxiao', zh:'凌霄宝殿', en:'Hall of Lingxiao', type:'palace',
    pos:[0,0,0], width:96, depth:80, height:26, tiers:3, roof:0xe9c46a, accent:0x8b1a1a, baseY:4, labelY:106,
    glow:0xffe6a0, focusDist:300, focusY:62,
    descZh:'天庭至高之殿，玉皇大帝临朝之所。三层崇台，重檐金瓦，丹陛御道直通南天门，统御三界十方。',
    descEn:'The supreme hall of Heaven where the Jade Emperor holds court — three tiers of marble terraces, triple golden eaves, and an imperial marble way running straight to the Southern Gate.' },

  { id:'nantianmen', zh:'南天门', en:'Southern Heaven Gate', type:'gate',
    pos:[0,0,470], width:96, height:58, depth:20, roof:0xe9c46a, accent:0x8b1a1a, baseY:4, labelY:96,
    glow:0xffd27a, focusDist:230, focusY:34,
    descZh:'天庭正门，下接南赡部洲。双柱擎天，云气缭绕，入门即是汉白玉御道，直抵凌霄宝殿。',
    descEn:'The grand southern gateway of Heaven — two pillars holding up the sky; beyond it the marble imperial way leads straight to the Hall of Lingxiao.' },

  { id:'yaochi', zh:'瑶池', en:'Jade Pool', type:'pool',
    pos:[360,0,260], radius:130, roof:0xeccb7a, accent:0x2a7fb0,
    glow:0x9fd8ff, focusDist:240, focusY:30,
    descZh:'西王母所居之仙池，碧水如玉，莲开不谢，锦鲤成群游于其间。蟠桃盛会于此宴请群仙。',
    descEn:"The Jade Pool of the Queen Mother — jade-green water, eternal lotus and drifting koi; host to the Peach Banquet of the immortals." },

  { id:'doushuai', zh:'兜率宫', en:'Doushuai Palace', type:'palace',
    pos:[-380,0,-260], width:58, height:18, tiers:2, roof:0xe4bd63, accent:0x5b2a8b,
    glow:0xb07cff, focusDist:195, focusY:34, labelY:58,
    descZh:'太上老君炼丹之所，两层楼阁，八卦炉中丹火不熄，紫气东来，道韵悠长。',
    descEn:"Lord Laozi's two-storey alchemy palace — the eight-trigram furnace burns eternally with the purple qi of the Dao." },

  { id:'guanghan', zh:'广寒宫', en:'Palace of Cold', type:'palace',
    pos:[-580,180,-380], width:54, height:17, tiers:2, roof:0xf0dcae, accent:0x3a5a8b,
    glow:0xbfe0ff, focusDist:180, focusY:26,
    descZh:'月中仙宫，嫦娥居所。桂树婆娑，玉兔捣药；宫外芳草如茵，石桌鼓凳上茶烟未散。',
    descEn:"The moon palace of Chang'e — swaying osmanthus, the jade rabbit at its mortar, and a lawn outside with a marble tea table set for guests." },

  { id:'chaohui', zh:'朝会殿', en:'Audience Hall', type:'palace',
    pos:[247,0,80], width:50, height:16, tiers:2, roof:0xe9c46a, accent:0x8b1a1a,
    glow:0xffd27a, focusDist:130, focusY:20,
    descZh:'群仙每日朝参之地，钟鼓齐鸣，仙班罗列，朝礼玉帝。',
    descEn:'The daily gathering hall where the hosts of immortals pay morning reverence to the Jade Emperor.' },

  { id:'tongming', zh:'通明殿', en:'Hall of Clarity', type:'palace',
    pos:[106,0,237], width:50, height:16, tiers:2, roof:0xeccb7a, accent:0x2a7fb0,
    glow:0x9fd8ff, focusDist:130, focusY:20,
    descZh:'玉帝前殿，光明洞彻，纤毫毕现，灵光流转不息。',
    descEn:"The antechamber of clarity before the emperor's throne — luminous, transparent, endless flowing light." },

  { id:'baoguang', zh:'宝光殿', en:'Hall of Treasure Light', type:'palace',
    pos:[-106,0,237], width:50, height:16, tiers:2, roof:0xffd166, accent:0x8b5a1a,
    glow:0xff9d3c, focusDist:130, focusY:20,
    descZh:'藏万宝灵物之殿，奇光宝气冲霄，瑞霭千条。',
    descEn:'The treasury hall of sacred relics — radiant treasure-light piercing the sky in a thousand auspicious rays.' },

  { id:'lingxu', zh:'凌虚殿', en:'Hall of the Void', type:'palace',
    pos:[-247,0,80], width:50, height:16, tiers:2, roof:0xe4bd63, accent:0x5b2a8b,
    glow:0xb07cff, focusDist:130, focusY:20,
    descZh:'悬于太虚之殿，俯瞰下界星河，缥缈若存若亡。',
    descEn:"A hall suspended in the void, overlooking the rivers of stars below — faint, drifting between being and non-being." },

  { id:'miluo', zh:'弥罗宫', en:'Miluo Palace', type:'palace',
    pos:[-338,0,-148], width:50, height:16, tiers:2, roof:0xe9c46a, accent:0x8b1a1a,
    glow:0xffe6a0, focusDist:130, focusY:20,
    descZh:'元始天尊道场，玄之又玄，众妙之门，万法归宗。',
    descEn:"The supreme Daoist sanctuary of the Celestial Worthy — the mysterious gate from which all laws arise." },

  { id:'ziwei', zh:'紫微宫', en:'Purple Forbidden Palace', type:'palace',
    pos:[-247,0,-237], width:50, height:16, tiers:2, roof:0xd9ae52, accent:0x3a3a8b,
    glow:0x7f9bff, focusDist:130, focusY:20,
    descZh:'中天北极紫微大帝之宫，众星拱卫，帝星所居。',
    descEn:"The palace of the Purple Star Emperor at the celestial pole — surrounded and guarded by all the stars." },

  { id:'yunlou', zh:'云楼宫', en:'Cloud Tower Palace', type:'palace',
    pos:[106,0,-237], width:50, height:16, tiers:2, roof:0xe4c07a, accent:0x8b2a5a,
    glow:0xff7fb0, focusDist:130, focusY:20,
    descZh:'层楼叠榭，起于云表，仙乐随风，缥缈可闻。',
    descEn:'Tiered towers rising from the cloud-table — where immortal music drifts upon the wind.' },

  { id:'douniu', zh:'斗牛宫', en:'Douniu Palace', type:'palace',
    pos:[247,0,-148], width:50, height:16, tiers:2, roof:0xe9c46a, accent:0x1a6b4a,
    glow:0x4fd6a8, focusDist:130, focusY:20,
    descZh:'斗宿牛宿之宫，星官所治，主四时八节之序。',
    descEn:"The palace of the Dipper and Ox asterisms — where stellar officials govern the order of the seasons." },
];

/* ---------------------------- Beast (瑞兽) gallery data ----------------- */
const BEASTS = [
  { id: 'phoenix', zh: '凤', en: 'Phoenix', build: buildPhoenix, update: updatePhoenix, group: null, curve: null, u: 0,
    descZh: '百鸟之王，丹凤来仪。身披五彩，鸣若箫韶，主太平与升仙之兆。',
    descEn: "The phoenix, king of birds — clad in five colors, singing like celestial music, a portent of peace and ascension." },
];

/* ---------------------------- Globals ---------------------------------- */
let renderer, scene, camera, controls, clock;
let composer = null;
let cloudGroup, starField, sunMesh, moonMesh, sunLight;
const cloudLayers = [];         // 云海 / 薄雾着色器材质（统一驱动 uTime / 光照）
const cloudSpriteMats = [];     // 云团精灵材质（统一昼夜着色）
let fly = null;                 // camera fly-to tween
let touring = false, tourTimer = 0, tourIndex = 0;
let isMobile = false;
let currentLandmark = null;
let glowTex, cloudTex, starTex, sunTex, moonTex;
let cloudSeaMesh = null, cloudSeaMat = null;   // 主云海（垂钓涟漪写入其 uniform）
let skyMat, skyDome, sunGlow, moonGlow, hemi, ambient, moonLight, nightAmount = 0;
let meteorGroup, meteorStreakTex, meteors = [], meteorEnabled = true;
let dayNight = { phase: 0.18, auto: true, length: 140 };
let voiceEnabled = true;
let follow = null, followPrev = new THREE.Vector3();
let raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let downX = 0, downY = 0, downT = 0;

const DEFAULT_CAM = new THREE.Vector3(0, 285, 690);
const DEFAULT_TAR = new THREE.Vector3(0, 12, 100);

/* ---------------------------- Error handling --------------------------- */
function showError(msg) {
  const ld = document.getElementById('loading'); if (ld) ld.classList.add('hidden');
  const er = document.getElementById('error'); if (er) er.classList.remove('hidden');
  const m = document.getElementById('error-msg'); if (m && msg) m.textContent = msg;
  const title = document.getElementById('error-title'); if (title) title.textContent = t('errorTitle');
  window.__courtReady = true; // prevent fallback timeout
}
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/* ---------------------------- Texture helpers -------------------------- */
function makeGradientTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0.0, '#05030f');
  grd.addColorStop(0.35, '#1a1340');
  grd.addColorStop(0.62, '#3b2a6b');
  grd.addColorStop(0.82, '#7d5fa6');
  grd.addColorStop(1.0, '#f6c98a');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeStarTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,240,200,0.7)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
// 团块云贴图：分形噪声生成"花椰菜"状云朵体块，并按垂直方向做受光/暗部着色
// （顶部提亮、底部压暗偏蓝），比若干径向渐变圆点叠出来的棉花球更像真实积云。
function makeCloudTexture(seed) {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const data = img.data;
  const sd = (seed === undefined ? Math.random() : seed) * 1000;
  const hash = (x, y) => {
    let h = Math.sin(x * 127.1 + y * 311.7 + sd) * 43758.5453;
    return h - Math.floor(h);
  };
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c2 = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * fx) + ((c2 + (d - c2) * fx) - (a + (b - a) * fx)) * fy;
  };
  const billow = (x, y, oct) => {
    let v = 0, amp = 0.5, fx = x, fy = y;
    for (let i = 0; i < oct; i++) {
      const n = noise(fx, fy);
      v += amp * (1 - Math.abs(n * 2 - 1));
      fx = fx * 2.03 + 1.7; fy = fy * 2.03 + 9.2; amp *= 0.5;
    }
    return v;
  };
  const fbm = (x, y, oct) => {
    let v = 0, amp = 0.5, fx = x, fy = y;
    for (let i = 0; i < oct; i++) { v += amp * noise(fx, fy); fx = fx * 2.01 + 3.3; fy = fy * 2.01 + 5.1; amp *= 0.5; }
    return v;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S * 2 - 1, v = y / S * 2 - 1;
      // 椭圆包络：横向更宽、上下略扁，四边平滑收边
      const rr = Math.sqrt(u * u * 0.92 + v * v * 1.55);
      const mask = 1 - Math.min(1, Math.max(0, (rr - 0.18) / 0.82));
      const dens = billow(x * 0.021 + 5.5, y * 0.021 + 9.1, 5) * 0.75 + fbm(x * 0.008, y * 0.008, 3) * 0.55;
      const t = Math.min(1, Math.max(0, (dens - 0.36) / 0.30));
      let a = t * t * (3 - 2 * t) * Math.pow(mask, 0.72);
      a = Math.min(1, a * 1.3);
      if (a <= 0.004) { data[(y * S + x) * 4 + 3] = 0; continue; }
      // 垂直受光：上部亮、下部压暗并偏冷（模拟天光照在云顶）
      const up = 1 - y / S;
      const shade = 0.66 + 0.46 * Math.pow(up, 0.85) + (dens - 0.55) * 0.22;
      const warm = Math.max(0, dens - 0.62) * 0.5;
      const idx = (y * S + x) * 4;
      data[idx] = Math.min(255, 255 * Math.min(1.0, shade + warm));
      data[idx + 1] = Math.min(255, 252 * Math.min(1.0, shade + warm * 0.7));
      data[idx + 2] = Math.min(255, 255 * Math.min(1.0, shade * 1.03));
      data[idx + 3] = 255 * a;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = false;
  tex.anisotropy = 4;
  return tex;
}
function makePlaqueTexture(text) {
  // 黑漆匾心 + 描金外框 + 鎏金大字（对应参考图的“陈天宫”匾）
  const c = document.createElement('canvas'); c.width = 512; c.height = 200;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 200);
  const bg = g.createLinearGradient(0, 0, 0, 200);
  bg.addColorStop(0, '#1d2230'); bg.addColorStop(0.5, '#0d1017'); bg.addColorStop(1, '#1a1f29');
  roundRect(g, 22, 24, 468, 152, 14); g.fillStyle = bg; g.fill();
  // 描金外框（双层）
  g.strokeStyle = '#d7aa45'; g.lineWidth = 13; roundRect(g, 22, 24, 468, 152, 14); g.stroke();
  g.strokeStyle = 'rgba(255,236,170,0.7)'; g.lineWidth = 3;
  roundRect(g, 37, 39, 438, 122, 9); g.stroke();
  // 四角金钉
  for (const p of [[50, 52], [462, 52], [50, 148], [462, 148]]) {
    g.fillStyle = '#e8c46c'; g.beginPath(); g.arc(p[0], p[1], 7, 0, Math.PI * 2); g.fill();
  }
  // 鎏金大字（辉光 + 立体描边）
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 92px "PingFang SC","Microsoft YaHei",serif';
  g.shadowColor = 'rgba(255,205,90,0.6)'; g.shadowBlur = 24;
  g.fillStyle = '#f7dc93'; g.fillText(text, 256, 104);
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(88,58,10,0.5)'; g.lineWidth = 2; g.strokeText(text, 256, 104);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function makeLabelTexture(zh, en) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 160);
  // backing
  g.fillStyle = 'rgba(10,8,20,0.45)';
  roundRect(g, 40, 30, 432, 100, 18); g.fill();
  g.strokeStyle = 'rgba(233,196,106,0.55)'; g.lineWidth = 3; g.stroke();
  g.textAlign = 'center';
  g.fillStyle = '#f4d58d';
  g.font = 'bold 58px "PingFang SC","Microsoft YaHei",sans-serif';
  g.textBaseline = 'middle';
  g.fillText(zh, 256, 66);
  g.fillStyle = '#cfc6b4';
  g.font = '22px "Segoe UI",sans-serif';
  g.fillText(en.toUpperCase(), 256, 112);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ---------------------------- Material helper -------------------------- */
function stdMat(color, metalness, roughness, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color, metalness, roughness,
    emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
    emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
    transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1,
    side: opts.side || THREE.FrontSide,
  });
}

/* ---------------------------- Roof geometry ---------------------------- */
// A curved hip roof (square footprint) with upturned eaves.
/* =========================================================================
   Procedural PBR-style texture library (cached, canvas-generated)
   Gives the palace surfaces film-like glazed tiles, marble, lacquer, gold…
   ========================================================================= */
const TEX = {};

const TEX_BUILD = {
  wood: makeWoodTexture, marble: makeMarbleTexture, gold: makeGoldTexture,
  tile: makeTileTexture, stone: makeStoneTexture, lattice: makeLatticeTexture,
  lacquer: makeLacquerTexture,
  cloud: makeCloudTexture, grass: makeGrassTexture,
};
function getTex(n) { if (!TEX[n]) TEX[n] = TEX_BUILD[n](); return TEX[n]; }

function makeWoodTexture() {
  // 朱漆红柱：深胭脂底 + 纵向擦漆光泽 + 岁月斑驳（对应参考图的漆柱质感）
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 256, 0);
  lg.addColorStop(0.00, '#4a0b0e'); lg.addColorStop(0.26, '#7a1519');
  lg.addColorStop(0.46, '#9c2427'); lg.addColorStop(0.60, '#841a1d');
  lg.addColorStop(0.82, '#5c1013'); lg.addColorStop(1.00, '#430a0d');
  g.fillStyle = lg; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 256, light = Math.random() > 0.55;
    g.strokeStyle = light
      ? `rgba(255,128,116,${0.02 + Math.random() * 0.05})`
      : `rgba(46,3,5,${0.03 + Math.random() * 0.08})`;
    g.lineWidth = 1 + Math.random() * 3.2;
    g.beginPath(); g.moveTo(x, -8); g.lineTo(x + (Math.random() - 0.5) * 8, 264); g.stroke();
  }
  for (let i = 0; i < 34; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 8 + Math.random() * 26;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(32,3,5,0.10)'); rg.addColorStop(1, 'rgba(32,3,5,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return texFromCanvas(c, true);
}

// 如意云纹一笔（用于汉白玉浮雕）
function cloudScroll(g, cx, cy, r, lw, style) {
  g.strokeStyle = style; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 1.62); g.stroke();
  g.beginPath(); g.arc(cx + r * 0.58, cy + r * 0.12, r * 0.44, Math.PI * 1.4, Math.PI * 0.45, true); g.stroke();
  g.beginPath(); g.moveTo(cx - r * 0.82, cy + r * 0.6);
  g.quadraticCurveTo(cx - r * 1.9, cy + r * 0.55, cx - r * 2.35, cy - r * 0.18); g.stroke();
}

function makeMarbleTexture() {
  // 汉白玉：近白暖调 + 淡灰石纹 + 极浅的云纹浮雕（颜色图 + 凹凸图）
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0.00, '#fdfcf8'); bg.addColorStop(0.45, '#f3f1e9'); bg.addColorStop(1.00, '#e4e0d3');
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  // soft cloudy body
  for (let i = 0; i < 34; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 50 + Math.random() * 150;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(198,196,186,${0.04 + Math.random() * 0.07})`); rg.addColorStop(1, 'rgba(198,196,186,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // grey veins (branching, irregular)
  for (let i = 0; i < 26; i++) {
    let x = Math.random() * S, y = Math.random() * S, w = 0.5 + Math.random() * 1.4;
    const a = 0.06 + Math.random() * 0.1;
    g.strokeStyle = `rgba(138,138,142,${a})`; g.lineWidth = w;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 15; k++) {
      x += (Math.random() - 0.42) * 54; y += (Math.random() - 0.5) * 54; g.lineTo(x, y);
      if (Math.random() < 0.25) { // small branch
        const bx = x, by = y;
        g.moveTo(bx, by);
        g.lineTo(bx + (Math.random() - 0.5) * 40, by + (Math.random() - 0.5) * 40);
        g.moveTo(bx, by);
      }
    }
    g.stroke();
  }
  // faint 云纹浮雕 (very subtle — a whisper of carving, not wallpaper)
  const bumpC = document.createElement('canvas'); bumpC.width = bumpC.height = S;
  const bg2 = bumpC.getContext('2d');
  bg2.fillStyle = '#808080'; bg2.fillRect(0, 0, S, S);
  for (const spot of [[0.26, 0.3], [0.74, 0.62], [0.5, 0.86]]) {
    const cx2 = spot[0] * S, cy2 = spot[1] * S;
    const r = 74 + Math.random() * 26, rot = Math.random() * Math.PI * 2;
    g.save(); g.translate(cx2, cy2); g.rotate(rot); g.translate(-cx2, -cy2);
    cloudScroll(g, cx2, cy2, r, 8, 'rgba(172,168,156,0.16)');
    cloudScroll(g, cx2 - 3, cy2 - 3, r, 4.5, 'rgba(255,255,252,0.42)');
    g.restore();
    bg2.save(); bg2.translate(cx2, cy2); bg2.rotate(rot); bg2.translate(-cx2, -cy2);
    cloudScroll(bg2, cx2, cy2, r, 8, 'rgba(196,196,196,0.75)');
    bg2.restore();
  }
  return { map: texFromCanvas(c, true), bump: texFromCanvas(bumpC, false) };
}
function makeGoldTexture() {
  // 鎏金：暖黄铜金 + 横向锤揲拉丝 + 凹处积色
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0.0, '#c08a26'); bg.addColorStop(0.28, '#e8bb49');
  bg.addColorStop(0.52, '#d9a637'); bg.addColorStop(0.78, '#c08a26');
  bg.addColorStop(1.0, '#b8821f');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * 256, light = Math.random() > 0.45;
    g.strokeStyle = light
      ? `rgba(255,238,178,${0.05 + Math.random() * 0.18})`
      : `rgba(118,76,12,${0.05 + Math.random() * 0.16})`;
    g.lineWidth = 0.6 + Math.random() * 1.7;
    g.beginPath(); g.moveTo(-5, y); g.lineTo(261, y + (Math.random() - 0.5) * 4); g.stroke();
  }
  for (let i = 0; i < 42; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 4 + Math.random() * 13;
    const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,248,205,0.20)'); rg.addColorStop(0.68, 'rgba(148,98,18,0.10)'); rg.addColorStop(1, 'rgba(148,98,18,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const rc = document.createElement('canvas'); rc.width = rc.height = 256; const rg2 = rc.getContext('2d');
  rg2.fillStyle = '#5c5c5c'; rg2.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    const y = Math.random() * 256, v = Math.random() > 0.5 ? 150 : 34;
    rg2.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    rg2.lineWidth = 1 + Math.random() * 2;
    rg2.beginPath(); rg2.moveTo(0, y); rg2.lineTo(256, y); rg2.stroke();
  }
  return { map: texFromCanvas(c, true), rough: texFromCanvas(rc, false) };
}
function makeTileTexture() {
  // 琉璃筒瓦：竖向瓦垄（圆柱状高光）+ 横向搭接阴影（对应参考图的金瓦）
  const S = 256, cols = 6, rows = 7;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#4a2c06'; g.fillRect(0, 0, S, S);
  const cw = S / cols, rh = S / rows;
  for (let r = 0; r < rows; r++) {
    const y0 = r * rh;
    for (let i = 0; i < cols; i++) {
      const x = i * cw;
      const grd = g.createLinearGradient(x, 0, x + cw, 0);
      grd.addColorStop(0.00, '#3d2606');
      grd.addColorStop(0.14, '#8a5c12');
      grd.addColorStop(0.34, '#d5a132');
      grd.addColorStop(0.46, '#ffe9a8');
      grd.addColorStop(0.56, '#e8b845');
      grd.addColorStop(0.76, '#b3812a');
      grd.addColorStop(0.92, '#6b4407');
      grd.addColorStop(1.00, '#4a2c04');
      g.fillStyle = grd; g.fillRect(x, y0, cw, rh);
    }
    // 每垄瓦片的下缘：投影 + 受光瓦唇（让横向搭接层次读得出来）
    const sr = g.createLinearGradient(0, y0 + rh * 0.72, 0, y0 + rh);
    sr.addColorStop(0, 'rgba(38,20,2,0)');
    sr.addColorStop(0.55, 'rgba(38,20,2,0.45)');
    sr.addColorStop(1, 'rgba(26,13,1,0.72)');
    g.fillStyle = sr; g.fillRect(0, y0 + rh * 0.72, S, rh * 0.28);
    g.fillStyle = 'rgba(255,240,178,0.42)'; g.fillRect(0, y0 + rh * 0.70, S, rh * 0.035);
  }
  const color = texFromCanvas(c, true); color.repeat.set(1.5, 1);

  const bc = document.createElement('canvas'); bc.width = S; bc.height = S;
  const bg2 = bc.getContext('2d');
  bg2.fillStyle = '#2a2a2a'; bg2.fillRect(0, 0, S, S);
  for (let r = 0; r < rows; r++) {
    const y0 = r * rh;
    for (let i = 0; i < cols; i++) {
      const x = i * cw;
      const grd = bg2.createLinearGradient(x, 0, x + cw, 0);
      grd.addColorStop(0.0, '#262626'); grd.addColorStop(0.47, '#f2f2f2');
      grd.addColorStop(0.55, '#e0e0e0'); grd.addColorStop(1.0, '#262626');
      bg2.fillStyle = grd; bg2.fillRect(x, y0, cw, rh);
    }
    bg2.fillStyle = '#0e0e0e'; bg2.fillRect(0, y0 + rh * 0.72, S, rh * 0.28);
  }
  const bump = texFromCanvas(bc, false); bump.repeat.set(1.5, 1);

  const rc = document.createElement('canvas'); rc.width = S; rc.height = S;
  const rg = rc.getContext('2d');
  rg.fillStyle = '#9a9a9a'; rg.fillRect(0, 0, S, S);
  for (let i = 0; i < cols; i++) {
    const x = i * cw;
    const grd = rg.createLinearGradient(x, 0, x + cw, 0);
    grd.addColorStop(0.0, '#bcbcbc'); grd.addColorStop(0.48, '#2a2a2a'); grd.addColorStop(1.0, '#bcbcbc');
    rg.fillStyle = grd; rg.fillRect(x, 0, cw, S);
  }
  const rough = texFromCanvas(rc, false); rough.repeat.set(1.5, 1);
  return { map: color, bump, rough };
}
function makeLacquerTexture() {
  // 朱漆墙面：深红漆底 + 竖向分间 + 描金上下腰带（对应参考图的红墙）
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, S);
  bg.addColorStop(0.0, '#4d0c0f'); bg.addColorStop(0.24, '#7d161a');
  bg.addColorStop(0.55, '#8e1d20'); bg.addColorStop(1.0, '#480a0d');
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  // 竖向分间（暗缝 + 金线），平铺后形成规律的柱间壁板
  for (const x of [S * 0.5]) {
    g.fillStyle = 'rgba(30,3,5,0.5)'; g.fillRect(x - 3, 0, 6, S);
    g.fillStyle = 'rgba(214,170,70,0.55)'; g.fillRect(x - 5, 0, 2, S);
    g.fillStyle = 'rgba(214,170,70,0.35)'; g.fillRect(x + 4, 0, 1.6, S);
  }
  // 上下金腰带
  for (const y of [S * 0.12, S * 0.88]) {
    g.fillStyle = 'rgba(206,163,66,0.75)'; g.fillRect(0, y - 3, S, 6);
    g.fillStyle = 'rgba(255,230,160,0.35)'; g.fillRect(0, y - 5, S, 1.6);
  }
  // 壁板内极浅的描金云纹（有变化，不成网格）
  g.save(); g.globalAlpha = 0.26;
  cloudScroll(g, S * 0.26, S * 0.52, 26, 3.2, '#e6c274');
  cloudScroll(g, S * 0.74, S * 0.42, 20, 3.2, '#e6c274');
  g.restore();
  return texFromCanvas(c, true);
}
function makeStoneTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#8a8175'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { const v = 120 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v - 6},${v - 14},${Math.random() * 0.3})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 4); }
  for (let i = 0; i < 12; i++) { g.strokeStyle = `rgba(60,55,50,${Math.random() * 0.22})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); let x = Math.random() * 256, y = Math.random() * 256; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 50; y += (Math.random() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  return texFromCanvas(c, true);
}
// 草地：明暗斑驳的草皮 + 细密草叶笔触（广寒宫宫外院落用）
function makeGrassTexture() {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, '#527c3f'); base.addColorStop(0.5, '#5d8a46'); base.addColorStop(1, '#4a7239');
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  // 大块色斑：让草皮有高低起伏
  for (let i = 0; i < 280; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 6 + Math.random() * 30;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const hue = 84 + Math.random() * 30, lit = 22 + Math.random() * 26;
    grd.addColorStop(0, `hsla(${hue},40%,${lit}%,0.55)`);
    grd.addColorStop(1, `hsla(${hue},40%,${lit}%,0)`);
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // 草叶
  g.lineCap = 'round';
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * S, y = Math.random() * S, len = 2 + Math.random() * 5;
    g.strokeStyle = `hsla(${82 + Math.random() * 36},${40 + Math.random() * 26}%,${22 + Math.random() * 30}%,${0.3 + Math.random() * 0.5})`;
    g.lineWidth = 0.6 + Math.random() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y - len); g.stroke();
  }
  return texFromCanvas(c, true);
}
function makeLatticeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#6a1414'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#e9c46a'; g.lineWidth = 4;
  for (let i = 0; i <= 4; i++) { const p = i / 4 * 128; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 128); g.beginPath(); g.moveTo(0, p); g.lineTo(128, p); g.stroke(); }
  g.strokeStyle = 'rgba(255,222,150,0.5)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 128); g.moveTo(128, 0); g.lineTo(0, 128); g.stroke();
  return texFromCanvas(c, true);
}
function makeScaleTexture() {
  // neutral grayscale scales (acts as a tintable map so any body color shows through)
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    const off = (y / 16) % 2 ? 8 : 0;
    for (let x = -8; x < 128; x += 16) {
      g.fillStyle = '#f2f2f2'; g.beginPath(); g.arc(x + off, y + 8, 7, Math.PI * 0.1, Math.PI * 0.9); g.fill();
      g.strokeStyle = '#7a7a7a'; g.lineWidth = 1; g.stroke();
    }
  }
  return texFromCanvas(c, true);
}
function texFromCanvas(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

/* ---- cached material helpers (shared instances → cheap day/night updates) ---- */
const MATCACHE = new Map();
const ENV_MATS = [];
function cachedMat(key, make) { let m = MATCACHE.get(key); if (!m) { m = make(); MATCACHE.set(key, m); } return m; }
function tagEnv(m, k) { m.userData.envBase = k; m.envMapIntensity = k; ENV_MATS.push(m); return m; }

// 汉白玉：近白暖调 + 浮雕凹凸，轻微抛光
function matMarble() {
  return cachedMat('marble', () => {
    const t = getTex('marble');
    return tagEnv(new THREE.MeshStandardMaterial({
      color: 0xfffdf7, map: t.map, bumpMap: t.bump, bumpScale: 0.55,
      roughness: 0.36, metalness: 0.05,
    }), 0.75);
  });
}
// 鎏金：高金属度、低粗糙，靠环境光照出真实的金色反射
function matGold() {
  return cachedMat('gold', () => {
    const o = getTex('gold');
    return tagEnv(new THREE.MeshStandardMaterial({
      color: 0xffce5a, map: o.map, roughnessMap: o.rough,
      metalness: 1.0, roughness: 0.22,
      emissive: 0x3a2200, emissiveIntensity: 0.24,
    }), 1.35);
  });
}
// 琉璃金瓦：釉面（clearcoat）+ 金属光泽 + 瓦垄凹凸
function matTile(roofColor) {
  return cachedMat('tile' + roofColor, () => {
    const o = getTex('tile');
    const m = new THREE.MeshPhysicalMaterial({
      color: roofColor, map: o.map, bumpMap: o.bump, bumpScale: 1.15,
      roughnessMap: o.rough, metalness: 0.45, roughness: 0.26,
      clearcoat: 1.0, clearcoatRoughness: 0.05,
      emissive: roofColor, emissiveIntensity: 0.05,
    });
    m.side = THREE.DoubleSide;
    return tagEnv(m, 0.95);
  });
}
// 朱漆墙面（描金框 + 菱格窗棂）
function matLacquer() {
  return cachedMat('lacquer', () => tagEnv(new THREE.MeshStandardMaterial({
    color: 0xffffff, map: getTex('lacquer'),
    roughness: 0.3, metalness: 0.14,
    emissive: 0x160304, emissiveIntensity: 0.3,
  }), 0.55));
}
// 朱漆立柱：polished lacquer
function matWood() {
  return cachedMat('wood', () => tagEnv(new THREE.MeshStandardMaterial({
    color: 0xfff2ef, map: getTex('wood'),
    roughness: 0.22, metalness: 0.12,
    emissive: 0x1a0405, emissiveIntensity: 0.22,
  }), 0.85));
}
function matStone() { return cachedMat('stone', () => new THREE.MeshStandardMaterial({ color: 0x8f8677, map: getTex('stone'), roughness: 0.95, metalness: 0.0 })); }
function matBronze() {
  return cachedMat('bronze', () => tagEnv(new THREE.MeshStandardMaterial({
    color: 0xd9af52, metalness: 1.0, roughness: 0.3,
    emissive: 0x2a1800, emissiveIntensity: 0.2,
  }), 1.0));
}
// 描金额枋（和玺彩画的金色底）
function matBeam(accent) {
  return cachedMat('beam' + accent, () => {
    const o = getTex('gold');
    return tagEnv(new THREE.MeshStandardMaterial({
      color: 0xf3d27a, map: o.map, roughnessMap: o.rough,
      metalness: 0.9, roughness: 0.3,
      emissive: accent, emissiveIntensity: 0.2,
    }), 0.9);
  });
}

/* ---------------------------- Chinese roof ----------------------------- */
// Curved hip roof (庑殿顶 when ridge>0, 攒尖顶 when ridge=0) with upturned
// eaves (飞檐翘角), tiled glazed surface and ridge ornaments. Returns a Group.
function makeChineseRoof(halfW, halfD, H, opt) {
  opt = opt || {};
  const seg = isMobile ? 7 : 11, vseg = isMobile ? 5 : 8;
  const ridge = opt.ridge || 0;
  const curve = opt.curve || 1.7;
  const cornerLift = opt.cornerLift !== undefined ? opt.cornerLift : H * 0.18;
  const grp = new THREE.Group();
  const positions = [], uvs = [], indices = []; let vc = 0;
  function pushGrid(getPos, getUV, nU, nV) {
    const s = vc;
    for (let j = 0; j <= nV; j++) for (let i = 0; i <= nU; i++) { const p = getPos(i / nU, j / nV); positions.push(p.x, p.y, p.z); const uv = getUV(i / nU, j / nV); uvs.push(uv.x, uv.y); }
    for (let j = 0; j < nV; j++) for (let i = 0; i < nU; i++) { const a = s + j * (nU + 1) + i, b = a + 1, c = a + (nU + 1), d = c + 1; indices.push(a, c, b, b, c, d); }
    vc += (nU + 1) * (nV + 1);
  }
  const ex = cornerLift * 0.5;
  const C = [
    new THREE.Vector3(halfW + ex, cornerLift, halfD + ex), new THREE.Vector3(-halfW - ex, cornerLift, halfD + ex),
    new THREE.Vector3(-halfW - ex, cornerLift, -halfD - ex), new THREE.Vector3(halfW + ex, cornerLift, -halfD - ex),
  ];
  const ridgeA = new THREE.Vector3(-ridge / 2, H, 0), ridgeB = new THREE.Vector3(ridge / 2, H, 0);
  function slope(baseA, baseB, topA, topB, u, v) {
    const b = new THREE.Vector3().lerpVectors(baseA, baseB, u);
    const tp = new THREE.Vector3().lerpVectors(topA, topB, u);
    const x = b.x + (tp.x - b.x) * v, z = b.z + (tp.z - b.z) * v;
    const y = b.y + (H - b.y) * Math.pow(v, curve);
    const cw = Math.pow(Math.max(0, 1 - 2 * Math.min(u, 1 - u)), 2);
    const lift = cornerLift * 0.7 * (1 - v) * cw;
    const ox = (x >= 0 ? 1 : -1) * cw * cornerLift * 0.3 * (1 - v);
    const oz = (z >= 0 ? 1 : -1) * cw * cornerLift * 0.3 * (1 - v);
    return new THREE.Vector3(x + ox, y + lift, z + oz);
  }
  pushGrid((u, v) => slope(C[0], C[1], ridgeB, ridgeA, u, v), (u, v) => new THREE.Vector2(u * 4, v * 3), seg, vseg);
  pushGrid((u, v) => slope(C[3], C[2], ridgeB, ridgeA, u, v), (u, v) => new THREE.Vector2(u * 4, v * 3), seg, vseg);
  pushGrid((u, v) => slope(C[1], C[2], ridgeA, ridgeA, u, v), (u, v) => new THREE.Vector2(u * 4, v * 3), seg, vseg);
  pushGrid((u, v) => slope(C[3], C[0], ridgeB, ridgeB, u, v), (u, v) => new THREE.Vector2(u * 4, v * 3), seg, vseg);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices); geo.computeVertexNormals();
  const roofMesh = new THREE.Mesh(geo, matTile(opt.roof || 0xe9c46a));
  roofMesh.material.side = THREE.DoubleSide;
  roofMesh.castShadow = true; grp.add(roofMesh);

  // ridge beam (正脊) + 鸱吻 end caps for hip roofs
  if (ridge > 0) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ridge + halfW * 0.5, H * 0.07, halfD * 0.16), matBronze());
    beam.position.set(0, H, 0); grp.add(beam);
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(halfW * 0.28, H * 0.18, halfD * 0.22), matBronze());
      cap.position.set(s * (ridge / 2 + halfW * 0.18), H - H * 0.02, 0); grp.add(cap);
      const curl = new THREE.Mesh(new THREE.TorusGeometry(halfD * 0.12, halfD * 0.05, 8, 12, Math.PI), matBronze());
      curl.position.set(s * (ridge / 2 + halfW * 0.22), H + H * 0.04, 0); curl.rotation.set(0, 0, s * Math.PI / 2); grp.add(curl);
    }
  } else {
    // 宝顶 finial for pyramidal roof
    const fin = new THREE.Mesh(new THREE.SphereGeometry(Math.max(1.4, halfW * 0.08), 16, 16), matGold());
    fin.position.set(0, H + halfW * 0.06, 0); grp.add(fin);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(Math.max(0.6, halfW * 0.04), H * 0.22, 10), matGold());
    spire.position.set(0, H + halfW * 0.06 + H * 0.11, 0); grp.add(spire);
  }
  // corner upturned ornaments (戗脊兽)
  for (const cc of C) {
    const orm = new THREE.Mesh(new THREE.ConeGeometry(Math.max(0.6, halfW * 0.05), halfW * 0.16, 8), matBronze());
    orm.position.set(cc.x * 0.98, cc.y + halfW * 0.04, cc.z * 0.98); orm.rotation.z = -Math.PI / 2.4; orm.rotation.y = Math.atan2(cc.z, cc.x); grp.add(orm);
  }
  return grp;
}

/* ---------------------------- Terrace / 台基 --------------------------- */
function buildTerrace(footW, footD, baseH) {
  const grp = new THREE.Group(); const m = matMarble();
  const specs = [{ w: footW * 1.12, d: footD * 1.12, h: baseH * 0.4 }, { w: footW * 1.0, d: footD * 1.0, h: baseH * 0.28 }, { w: footW * 0.92, d: footD * 0.92, h: baseH * 0.36 }];
  let yy = 0;
  specs.forEach((s) => { const box = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), m); box.position.y = yy + s.h / 2; box.castShadow = true; box.receiveShadow = true; grp.add(box); yy += s.h; });
  const topY = yy, railH = baseH * 0.5;
  const halfW = footW * 0.46, halfD = footD * 0.46, postN = isMobile ? 8 : 16;
  const postGeo = new THREE.CylinderGeometry(0.5, 0.5, railH, 8);
  for (let i = 0; i <= postN; i++) { const x = -halfW + (i / postN) * 2 * halfW; for (const zz of [halfD, -halfD]) { const p = new THREE.Mesh(postGeo, m); p.position.set(x, topY + railH / 2, zz); grp.add(p); } }
  for (let i = 1; i < postN; i++) { const z = -halfD + (i / postN) * 2 * halfD; for (const xx of [halfW, -halfW]) { const p = new THREE.Mesh(postGeo, m); p.position.set(xx, topY + railH / 2, z); grp.add(p); } }
  const railMat = matGold();
  for (const zz of [halfD, -halfD]) { const r = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 0.6, 0.6), railMat); r.position.set(0, topY + railH, zz); grp.add(r); }
  for (const xx of [halfW, -halfW]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, halfD * 2), railMat); r.position.set(xx, topY + railH, 0); grp.add(r); }
  return grp;
}

/* ---------------- 汉白玉栏杆 / 踏跺 / 御道（marble details） ------------- */
// 一段栏杆：望柱用 InstancedMesh 合并，避免每级台基产生上百个 draw call
function railRun(parent, x0, z0, x1, z1, y, opt) {
  opt = opt || {};
  const h = opt.h || 3.2, gap = opt.gap || 15, m = opt.mat || matMarble();
  const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz);
  if (len < 1) return null;
  const grp = new THREE.Group();
  grp.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  grp.rotation.y = Math.atan2(dx, dz);
  const n = Math.max(2, Math.round(len / gap));
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, h, 1.05), m, n + 1);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i <= n; i++) { mtx.makeTranslation(0, h / 2, -len / 2 + (i / n) * len); inst.setMatrixAt(i, mtx); }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true; inst.receiveShadow = true; grp.add(inst);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, h * 0.60, len), m);
  panel.position.y = h * 0.40; panel.receiveShadow = true; grp.add(panel);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, len), m);
  rail.position.y = h * 0.925; grp.add(rail);
  parent.add(grp);
  return grp;
}
function addBalustrade(parent, w, d, y, opt) {
  const hw = w / 2, hd = d / 2;
  railRun(parent, -hw, -hd, hw, -hd, y, opt);
  railRun(parent, -hw, hd, hw, hd, y, opt);
  railRun(parent, -hw, -hd, -hw, hd, y, opt);
  railRun(parent, hw, -hd, hw, hd, y, opt);
}

// 汉白玉踏跺：实心台阶 + 两侧垂带石 + 中央御路（云龙斜板）
function addMarbleStairs(parent, w, y0, y1, zFace, run, opt) {
  opt = opt || {};
  const g = new THREE.Group();
  const m = opt.mat || matMarble();
  const n = Math.max(4, Math.round((y1 - y0) / 0.95));
  const rise = (y1 - y0) / n, tread = run / n;
  for (let i = 0; i < n; i++) {
    const h = rise * (i + 1);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, tread * 1.04), m);
    box.position.set(0, y0 + h / 2, zFace + tread * (i + 0.5));
    box.receiveShadow = true; box.castShadow = true; g.add(box);
  }
  const runLen = Math.hypot(run, y1 - y0), ang = Math.atan2(y1 - y0, run);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, runLen), m);
    cheek.position.set(s * (w / 2 + 1.1), y0 + (y1 - y0) / 2 + 0.8, zFace + run / 2);
    cheek.rotation.x = -ang; cheek.castShadow = true; g.add(cheek);
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.4, 1.7), m);
    post.position.set(s * (w / 2 + 1.1), y1 + 1.7, zFace + 0.9); g.add(post);
  }
  // 御路：整块云龙浮雕斜板
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(w * 0.32, 0.9, runLen), opt.rampMat || matMarble());
  ramp.position.set(0, y0 + (y1 - y0) / 2 + 0.5, zFace + run / 2);
  ramp.rotation.x = -ang; ramp.receiveShadow = true; g.add(ramp);
  parent.add(g);
  return g;
}

// 台基下的山体/云台：上大下小的方锥台，让殿宇不悬空
function makePlateau(w, d, topY, depth, opt) {
  opt = opt || {};
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), opt.topMat || matMarble());
  slab.position.y = topY - 1.2; slab.receiveShadow = true; slab.castShadow = true; g.add(slab);
  const h = depth || 30;
  const frustum = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.52, h, 4, 1, false, Math.PI / 4), opt.mat || matStone());
  frustum.scale.set(w * 0.7071 * 0.97, 1, d * 0.7071 * 0.97);
  frustum.position.y = topY - 2.4 - h / 2;
  frustum.castShadow = true; frustum.receiveShadow = true; g.add(frustum);
  // 崖壁上零星的岩石块，破一破平面的锥面
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + Math.random() * 9, 0), opt.mat || matStone());
    const a = Math.random() * Math.PI * 2, dd = 0.26 + Math.random() * 0.16;
    r.position.set(Math.cos(a) * w * dd, topY - 9 - Math.random() * h * 0.55, Math.sin(a) * d * dd);
    r.rotation.set(Math.random(), Math.random(), Math.random()); g.add(r);
  }
  return g;
}

/* ------------- 重楼殿：多层须弥座 + 逐层收进的多重檐楼阁 ------------- */
// 通用骨架：台基逐级收进、正面各设踏跺；楼身逐层收进，下层出腰檐、顶层主屋顶收头。
// 凌霄宝殿（三层）与兜率宫（两层）共用这套骨架，只是传入的台基层数与层高不同。
function buildTieredHall(o) {
  const g = new THREE.Group();
  const W = o.width || 96, D = o.depth || 80;
  const marble = matMarble(), gold = matGold(), wood = matWood();
  const roofColor = o.roof !== undefined ? o.roof : 0xe9c46a;
  const accent = o.accent !== undefined ? o.accent : 0x8b1a1a;
  const tiers = o.tiers, levels = o.levels;
  const topH = o.topH || 17.0;

  // ---- 须弥座台基（逐级收进，正面各设踏跺） ----
  let y = 0;
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const body = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.d), marble);
    body.position.y = y + tier.h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
    // 束腰：内收的深色石带
    const waist = new THREE.Mesh(new THREE.BoxGeometry(tier.w * 1.006, tier.h * 0.30, tier.d * 1.006), matStone());
    waist.position.y = y + tier.h * 0.42; waist.receiveShadow = true; g.add(waist);
    // 压边（外挑一圈，坐在下面一层的台面上）
    const lip = new THREE.Mesh(new THREE.BoxGeometry(tier.w * 1.04, tier.h * 0.13, tier.d * 1.04), marble);
    lip.position.y = y + tier.h * 0.93; lip.receiveShadow = true; lip.castShadow = true; g.add(lip);
    addBalustrade(g, tier.w * 1.02, tier.d * 1.02, y + tier.h, { h: 3.2, gap: i === 0 ? 16 : 12 });
    // 正面踏跺
    const yBelow = i === 0 ? 0 : y;
    const run = i === 0 ? 26 : Math.max(8, (tiers[i - 1].d - tier.d) / 2 - 1.5);
    const sw = W * (i === 0 ? 0.60 : 0.48 - i * 0.06);
    addMarbleStairs(g, sw, yBelow, y + tier.h, tier.d / 2, run, {});
    y += tier.h;
  }
  const baseY = y;

  // ---- 逐层楼阁（自下而上收进） ----
  let ly = baseY;
  for (let i = 0; i < levels.length; i++) {
    const L = levels[i], bw = L.w, bd = L.d, bh = L.h;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), matLacquer());
    wall.position.y = ly + bh / 2; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
    // 鎏金束带 + 和玺彩画额枋
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.05, bh * 0.09, bd * 1.05), gold);
    plinth.position.y = ly + bh * 0.05; g.add(plinth);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.09, bh * 0.15, bd * 1.09), matBeam(accent));
    beam.position.y = ly + bh - bh * 0.075; g.add(beam);
    // 朱漆立柱
    const colR = Math.max(0.85, bw * 0.028);
    for (const side of [1, -1]) {
      for (let c = 0; c < L.cols; c++) {
        const fx = (c / (L.cols - 1) - 0.5) * bw * 0.90;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR * 1.08, bh * 0.95, 14), wood);
        col.position.set(fx, ly + bh * 0.475, side * bd * 0.5); col.castShadow = true; g.add(col);
      }
    }
    addDougong(g, bw * 1.09, bd * 1.09, ly + bh - bh * 0.03);

    // 底层正门 + 匾额
    if (i === 0) {
      const doorW = bw * 0.30, doorH = bh * 0.46;
      const dFrame = new THREE.Mesh(new THREE.BoxGeometry(doorW * 1.14, doorH * 1.06, 0.45), gold);
      dFrame.position.set(0, ly + doorH / 2 + 0.15, bd / 2 + 0.08); g.add(dFrame);
      const leafGeo = new THREE.BoxGeometry(doorW * 0.47, doorH, 0.7);
      for (const s of [-1, 1]) {
        const leaf = new THREE.Mesh(leafGeo, wood);
        leaf.position.set(s * doorW * 0.235, ly + doorH / 2, bd / 2 + 0.3); g.add(leaf);
      }
      // 黑漆金框匾额：挂在门楣之上、额枋之外（与南天门同款）
      const name = o.name || '凌霄宝殿';
      const pw = Math.min(bw * 0.34, 5.4 * name.length), ph = pw / 2.56;
      const board = buildPlaqueBoard(name, pw);
      board.position.set(0, ly + doorH + 0.35 + ph / 2, bd * 0.545 + 0.85);
      g.add(board);
      addLanterns(g, bw, bd, ly + bh * 0.88, accent);
    }

    // 屋顶：下几层为腰檐（上层楼身穿插其中），顶层为主屋顶
    const top = i === levels.length - 1;
    const H = top ? topH : bh * 0.50;
    const eave = top ? 1.32 : 1.20;
    const roof = makeChineseRoof(bw * 0.5 * eave, bd * 0.5 * eave, H, {
      ridge: top ? bw * 0.40 : levels[i + 1].w * 0.42,
      curve: 1.72, cornerLift: H * (top ? 0.24 : 0.34), roof: roofColor,
    });
    roof.position.y = ly + bh; roof.castShadow = true; g.add(roof);
    ly += bh;
  }

  if (o.glow) {
    const pl = new THREE.PointLight(o.glow, 1.8, W * 6, 2);
    pl.position.set(0, baseY + 20, 0); g.add(pl);
  }
  return g;
}

/* -------------------------- 凌霄宝殿：三层重檐 -------------------------- */
function buildSupremeHall(o) {
  const W = o.width || 96, D = o.depth || 80;
  return buildTieredHall({
    width: W, depth: D, roof: o.roof, accent: o.accent, glow: o.glow,
    name: o.name, topH: 17.0,
    tiers: [
      { w: W * 1.46, d: D * 1.78, h: 8.0 },
      { w: W * 1.22, d: D * 1.45, h: 7.0 },
      { w: W * 0.99, d: D * 1.15, h: 6.0 },
    ],
    levels: [
      { w: W * 0.94, d: D * 0.98, h: 18.0, cols: 7 },
      { w: W * 0.74, d: D * 0.80, h: 13.0, cols: 5 },
      { w: W * 0.56, d: D * 0.62, h: 11.0, cols: 4 },
    ],
  });
}

/* ---------------------- 兜率宫：两层楼阁（炼丹道宫） -------------------- */
// 两层须弥座 + 两层楼身：下层出腰檐供上层穿插，上层以歇山顶收头，正面悬“兜率宫”匾。
function buildAlchemyPalace(o) {
  const W = o.width || 58, D = (o.depth || W) * 0.92;
  return buildTieredHall({
    width: W, depth: D, roof: o.roof, accent: o.accent, glow: o.glow,
    name: o.name || '兜率宫', topH: 12.0,
    tiers: [
      { w: W * 1.30, d: D * 1.42, h: 7.2 },
      { w: W * 1.06, d: D * 1.16, h: 6.2 },
    ],
    levels: [
      { w: W * 0.92, d: D * 0.96, h: 15.0, cols: 5 },
      { w: W * 0.68, d: D * 0.72, h: 10.5, cols: 4 },
    ],
  });
}

/* ------------------------------- 匾额 -------------------------------- */
// 黑漆匾心 + 描金外框 + 鎏金大字，与南天门的匾同一款式，可挂于殿门上方
function buildPlaqueBoard(text, w, opt) {
  opt = opt || {};
  const g = new THREE.Group();
  const pw = w || 14, ph = pw / 2.56;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(pw * 1.10, ph * 1.16, 1.5), matGold());
  frame.castShadow = true; g.add(frame);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(pw * 1.08, ph * 1.13),
    new THREE.MeshBasicMaterial({ map: makePlaqueTexture(text), transparent: true }));
  face.position.z = 0.78; g.add(face);
  if (opt.cap !== false) {
    // 顶部压枋：让匾额像是被额枋稳稳压住
    const cap = new THREE.Mesh(new THREE.BoxGeometry(pw * 1.26, ph * 0.13, 2.2), matBronze());
    cap.position.set(0, ph * 0.60, 0.05); g.add(cap);
  }
  g.userData.pw = pw;
  return g;
}

/* -------------------- 汉白玉御道：凌霄宝殿 → 南天门 -------------------- */
// 云龙御路石纹：浅色石面 + 回纹边框 + 中央云纹浮雕
function makeRoadTexture() {
  const W = 256, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, '#e6dfcd'); bg.addColorStop(0.5, '#fbf8ee'); bg.addColorStop(1, '#e6dfcd');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // 石板拼缝
  g.strokeStyle = 'rgba(146,138,120,0.42)'; g.lineWidth = 2;
  for (let yy = 0; yy <= H; yy += H / 4) { g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); }
  // 回纹边框
  g.strokeStyle = 'rgba(178,142,68,0.55)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(26, 0); g.lineTo(26, H); g.moveTo(W - 26, 0); g.lineTo(W - 26, H); g.stroke();
  g.strokeStyle = 'rgba(255,252,232,0.5)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(34, 0); g.lineTo(34, H); g.moveTo(W - 34, 0); g.lineTo(W - 34, H); g.stroke();
  // 中央云纹
  cloudScroll(g, W / 2, H * 0.5, 62, 9, 'rgba(160,134,80,0.28)');
  cloudScroll(g, W / 2 - 2, H * 0.5 - 2, 62, 4.5, 'rgba(255,253,240,0.55)');
  cloudScroll(g, W / 2, H * 0.08, 34, 5, 'rgba(160,134,80,0.20)');
  cloudScroll(g, W / 2, H * 0.92, 34, 5, 'rgba(160,134,80,0.20)');
  return texFromCanvas(c, true);
}

function buildImperialWay(zFrom, zTo, width, yTop) {
  const g = new THREE.Group();
  const len = zTo - zFrom, zc = (zFrom + zTo) / 2;
  const marble = matMarble();
  // 桥面 + 侧壁（须弥座式）
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 2.0, len), marble);
  deck.position.set(0, yTop - 1.0, zc); deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
  const side = new THREE.Mesh(new THREE.BoxGeometry(width * 1.03, 3.0, len), marble);
  side.position.set(0, yTop - 2.5, zc); side.castShadow = true; g.add(side);
  // 悬空桥体：向下收分的梯形，营造“浮于云上”的体量
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.51, 0); shape.lineTo(width * 0.51, 0);
  shape.lineTo(width * 0.17, -20); shape.lineTo(-width * 0.17, -20); shape.closePath();
  const keel = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, curveSegments: 1 }), matStone());
  keel.position.set(0, yTop - 4.8, zFrom);
  keel.castShadow = true; g.add(keel);
  // 中央御道（云纹石板）
  const tex = makeRoadTexture();
  const roadLen = len - 4;
  tex.repeat.set(1, Math.max(1, Math.round(roadLen / 30)));
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.62, roadLen),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.40, metalness: 0.10, envMapIntensity: 0.6 }));
  strip.rotation.x = -Math.PI / 2; strip.position.set(0, yTop + 0.03, zc);
  strip.receiveShadow = true; g.add(strip);
  // 两侧栏杆
  const hw = width / 2 - 1.2;
  railRun(g, -hw, zFrom + 2, -hw, zTo - 2, yTop, { h: 3.0, gap: 17 });
  railRun(g, hw, zFrom + 2, hw, zTo - 2, yTop, { h: 3.0, gap: 17 });
  // 御道石灯（两侧对称）
  const lampN = 6;
  for (let i = 0; i < lampN; i++) {
    const z = zFrom + 20 + (i / (lampN - 1)) * (len - 44);
    for (const s of [-1, 1]) {
      const lg = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 9, 8), marble);
      post.position.y = 4.5; post.castShadow = true; lg.add(post);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 3.4), matGold());
      cap.position.y = 9.2; lg.add(cap);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 2.6),
        new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffb347, emissiveIntensity: 1.5, roughness: 0.5 }));
      lamp.position.y = 11.0; lg.add(lamp);
      lg.add(makeGlowSprite(0xffcaa0, 13, 15, 11.0));
      lg.position.set(s * (hw - 3.2), yTop, z); g.add(lg);
    }
  }
  return g;
}

function ringFrame(w, d, h, thick, mat, y) {
  const grp = new THREE.Group();
  const fw = new THREE.Mesh(new THREE.BoxGeometry(w + thick, h, thick), mat); fw.position.set(0, y, d / 2); grp.add(fw);
  const bw = fw.clone(); bw.position.z = -d / 2; grp.add(bw);
  const lw = new THREE.Mesh(new THREE.BoxGeometry(thick, h, d + thick), mat); lw.position.set(-w / 2, y, 0); grp.add(lw);
  const rw = lw.clone(); rw.position.x = w / 2; grp.add(rw);
  return grp;
}
// stylised 斗拱 (dougong) bracket band beneath the eaves
function addDougong(g, w, d, y) {
  const mat = matBronze();
  g.add(ringFrame(w, d, 1.4, 1.2, mat, y + 0.7));
  g.add(ringFrame(w * 0.92, d * 0.92, 1.0, 0.8, mat, y + 1.8));
  const n = isMobile ? 6 : 10;
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (i / n) * w;
    for (const zz of [d / 2, -d / 2]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.6), mat); arm.position.set(x, y + 1.3, zz); g.add(arm); }
  }
  for (let i = 1; i < n; i++) {
    const z = -d / 2 + (i / n) * d;
    for (const xx of [w / 2, -w / 2]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.6), mat); arm.position.set(xx, y + 1.3, z); g.add(arm); }
  }
}
function addLanterns(g, w, d, y, accent) {
  const pos = [[w * 0.44, d * 0.44], [-w * 0.44, d * 0.44], [w * 0.44, -d * 0.44], [-w * 0.44, -d * 0.44]];
  pos.forEach((p) => {
    const lg = new THREE.Group();
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 6), matBronze()); line.position.y = 3; lg.add(line);
    const bodyM = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2, roughness: 0.4 }));
    bodyM.scale.y = 1.25; bodyM.position.y = -3; lg.add(bodyM);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 1.5, 10), matGold()); cap.position.y = -6; lg.add(cap);
    lg.add(makeGlowSprite(0xffcaa0, 16, 22, -3));
    lg.position.set(p[0], y, p[1]); g.add(lg);
  });
}
function makeGlowSprite(color, sx, sy, py) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(sx, sy, 1); if (py) s.position.y = py; return s;
}

/* ---------------------------- Builders --------------------------------- */
function buildIsland(radius, color) {
  const g = new THREE.Group();
  const sm = matStone();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.94, 6, 56), sm);
  top.position.y = 0; top.receiveShadow = true; top.castShadow = true; g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.96, 1.6, 12, 64), matBronze());
  rim.rotation.x = Math.PI / 2; rim.position.y = 3; g.add(rim);
  const H = radius * 1.8;
  // 倒锥的背面朝下，Default 材质会被剔除、从下方看成一团黑 —— 用双面深色石
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6154, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const rock = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.92, H, 56), rockMat);
  rock.rotation.x = Math.PI; rock.position.y = -3 - H / 2; rock.castShadow = true; g.add(rock);
  // mossy rocky chunks clinging to the cliff
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * (0.1 + Math.random() * 0.12), 0), sm);
    const a = Math.random() * Math.PI * 2, d = radius * (0.5 + Math.random() * 0.35);
    r.position.set(Math.cos(a) * d, -8 - Math.random() * radius * 0.5, Math.sin(a) * d);
    r.rotation.set(Math.random(), Math.random(), Math.random()); g.add(r);
  }
  return g;
}

function buildPalace(o) {
  const width = o.width || 44, depth = o.depth || width, height = o.height || 16, tiers = o.tiers || 2;
  const roofColor = o.roof !== undefined ? o.roof : 0xe9c46a;
  const accent = o.accent !== undefined ? o.accent : 0x8b1a1a;
  const g = new THREE.Group();
  const baseH = 6;

  // 汉白玉 terrace (须弥座 + 栏杆)
  g.add(buildTerrace(width * 0.92, depth * 0.92, baseH));

  const bodyW = width * 0.78, bodyD = depth * 0.78, bodyH = height;
  // red-lacquer body with gilt frames + lattice windows
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), matLacquer());
  body.position.y = baseH + bodyH / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  // gold plinth band
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 1.04, baseH * 0.5, bodyD * 1.04), matGold());
  plinth.position.y = baseH * 0.78; g.add(plinth);
  // painted beam (额枋) beneath the eaves
  const beam = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 1.08, bodyH * 0.16, bodyD * 1.08), matBeam(accent));
  beam.position.y = baseH + bodyH - bodyH * 0.1; g.add(beam);

  // 朱红大门（金框 + 双扇门叶）
  const doorW = bodyW * 0.34, doorH = bodyH * (o.plaque ? 0.46 : 0.7);
  const dFrame = new THREE.Mesh(new THREE.BoxGeometry(doorW * 1.12, doorH * 1.06, 0.35), matGold());
  dFrame.position.set(0, baseH + doorH / 2, bodyD / 2 + 0.06); g.add(dFrame);
  const leafGeo = new THREE.BoxGeometry(doorW * 0.46, doorH, 0.6);
  for (const s of [-1, 1]) {
    const leaf = new THREE.Mesh(leafGeo, matWood());
    leaf.position.set(s * doorW * 0.235, baseH + doorH / 2, bodyD / 2 + 0.26); g.add(leaf);
  }

  // 匾额（黑漆金框 + 鎏金大字，同南天门款，挂在门楣上方的额枋前）
  if (o.plaque) {
    const pw = Math.min(bodyW * 0.44, 5.4 * o.plaque.length), ph = pw / 2.56;
    const board = buildPlaqueBoard(o.plaque, pw);
    board.position.set(0, baseH + doorH + 0.35 + ph / 2, bodyD * 0.54 + 0.85);
    g.add(board);
  }

  // 朱红立柱 with bronze capitals, bases and gilt hoops (金箍)
  const colR = Math.max(0.9, width * 0.03), colH = bodyH * 0.9, cols = o.columns || 6;
  const colMat = matWood(), goldMat = matGold();
  const bandGeo = new THREE.CylinderGeometry(colR * 1.09, colR * 1.09, Math.max(0.5, colH * 0.035), 14);
  for (const side of [1, -1]) {
    for (let i = 0; i < cols; i++) {
      const fx = (i / (cols - 1) - 0.5) * bodyW * 0.86;
      const cz = side * (bodyD * 0.5);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR * 1.12, colH, 14), colMat);
      c.position.set(fx, baseH + colH / 2, cz); c.castShadow = true; g.add(c);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(colR * 1.4, colR * 1.4, colH * 0.06, 14), matBronze()); cap.position.set(fx, baseH + colH, cz); g.add(cap);
      const cb = new THREE.Mesh(new THREE.CylinderGeometry(colR * 1.5, colR * 1.6, colH * 0.05, 14), matBronze()); cb.position.set(fx, baseH + colH * 0.03, cz); g.add(cb);
      const hoop = new THREE.Mesh(bandGeo, goldMat); hoop.position.set(fx, baseH + colH * 0.66, cz); g.add(hoop);
    }
  }

  // 斗拱 bracket band beneath the eaves
  addDougong(g, bodyW * 1.08, bodyD * 1.08, baseH + bodyH - bodyH * 0.02);

  // curved glazed-tile roofs (庑殿顶 / 攒尖顶)
  let ry = baseH + bodyH, rw = width * 0.88, rd = depth * 0.88, rh = height * 0.7;
  for (let i = 0; i < tiers; i++) {
    const ridge = i === 0 ? rw * 0.46 : (i === tiers - 1 ? 0 : rw * 0.18);
    const roof = makeChineseRoof(rw / 2, rd / 2, rh, { ridge, curve: 1.7, cornerLift: rh * 0.2, roof: roofColor });
    roof.position.y = ry; g.add(roof);
    ry += rh * 0.64; rw *= 0.66; rd *= 0.66; rh *= 0.8;
  }

  // hanging lanterns at the corners
  addLanterns(g, bodyW, bodyD, baseH + bodyH * 0.92, accent);

  if (o.glow) {
    const pl = new THREE.PointLight(o.glow, 1.4, width * 5, 2);
    pl.position.y = baseH + bodyH * 0.7; g.add(pl);
  }
  return g;
}

// 雕龙金柱：金色游龙盘绕石柱（对应参考图南天门的盘龙柱）
// 用胶囊段沿螺旋路径首尾相接，形成连贯的龙身，而不是一串珠子。
function addCoiledDragon(g, px, pz, R, botY, topY, dir) {
  const gold = matGold();
  const N = 22;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const a = t * Math.PI * 2.5 * dir;
    const y = botY + (topY - botY) * Math.pow(t, 0.92);
    const r = R * (1.06 - t * 0.14);
    pts.push(new THREE.Vector3(px + Math.cos(a) * r, y, pz + Math.sin(a) * r));
  }
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const dvec = p1.clone().sub(p0);
    const len = dvec.length();
    const t = i / (N - 1);
    const rad = R * 0.23 * (1 - t * 0.3);
    const geo = new THREE.CapsuleGeometry(rad, Math.max(0.05, len * 0.55), 4, 8);
    const m = new THREE.Mesh(geo, gold);
    m.position.copy(mid);
    m.quaternion.setFromUnitVectors(up, dvec.clone().normalize());
    g.add(m);
    if (i % 3 === 1) { // 背鳍
      const sp = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.55, rad * 2.1, 6), gold);
      sp.position.copy(mid); sp.position.y += rad * 0.85;
      sp.rotation.z = -0.5 * dir;
      g.add(sp);
    }
  }
  // 龙首
  const last = pts[N - 1], prev = pts[N - 2];
  const fwd = last.clone().sub(prev).normalize();
  const head = new THREE.Group();
  head.position.copy(last).addScaledVector(fwd, R * 0.18);
  head.rotation.y = Math.atan2(fwd.x, fwd.z);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(R * 0.34, 12, 10), gold);
  hm.scale.set(1, 0.92, 1.3); head.add(hm);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(R * 0.3, R * 0.2, R * 0.46), gold);
  snout.position.set(0, -R * 0.05, R * 0.36); head.add(snout);
  for (const sgn of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(R * 0.06, R * 0.5, 7), gold);
    horn.position.set(sgn * R * 0.16, R * 0.28, -R * 0.12); horn.rotation.z = sgn * 0.55; head.add(horn);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(R * 0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff4028, emissive: 0xff2400, emissiveIntensity: 1.7, roughness: 0.4 }));
    eye.position.set(sgn * R * 0.15, R * 0.06, R * 0.29); head.add(eye);
    const whisk = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.026, R * 0.6, 3, 6), gold);
    whisk.position.set(sgn * R * 0.14, -R * 0.02, R * 0.6); whisk.rotation.set(Math.PI / 2, 0, sgn * 0.5); head.add(whisk);
  }
  g.add(head);
}

function buildGate(o) {
  const g = new THREE.Group();
  const w = o.width || 90, h = o.height || 58, d = o.depth || 18;
  const pierW = w * 0.14, pierD = w * 0.12;     // 汉白玉方形望柱
  const px = w / 2 - pierW / 2;
  const marble = matMarble(), gold = matGold();
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(pierW, h, pierD), marble);
    p.position.set(s * px, h / 2, 0); p.castShadow = true; p.receiveShadow = true; g.add(p);
    const base = new THREE.Mesh(new THREE.BoxGeometry(pierW * 1.22, h * 0.05, pierD * 1.22), gold);
    base.position.set(s * px, h * 0.025, 0); g.add(base);
    addCoiledDragon(g, s * px, 0, pierW * 0.76, h * 0.15, h * 0.66, s > 0 ? 1 : -1);
  }
  // 石门楣（横跨两柱的汉白玉梁，承托匾额与屋顶）
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, h * 0.22, d * 0.84), marble);
  lintel.position.y = h * 0.80; lintel.castShadow = true; lintel.receiveShadow = true; g.add(lintel);
  // 描金额枋 + 斗拱
  const beam = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, h * 0.075, d * 0.88), matBeam(0x8b1a1a));
  beam.position.y = h * 0.925; beam.castShadow = true; g.add(beam);
  addDougong(g, w * 1.02, d * 0.82, h * 0.955);
  const roof = makeChineseRoof(w * 0.53, d * 0.88, h * 0.44, { ridge: w * 0.22, curve: 1.6, cornerLift: h * 0.12, roof: o.roof !== undefined ? o.roof : 0xe9c46a });
  roof.position.y = h * 0.985; roof.castShadow = true; g.add(roof);
  // 黑漆金框匾额（正反两面，立体鎏金匾）
  const board = buildPlaqueBoard(o.name || '南天门', w * 0.34, { cap: false });
  board.position.set(0, h * 0.80, d * 0.435); g.add(board);
  const board2 = board.clone();
  board2.position.z = -d * 0.435; board2.rotation.y = Math.PI; g.add(board2);
  // lanterns
  for (const s of [-1, 1]) {
    const lg = new THREE.Group();
    const bodyM = new THREE.Mesh(new THREE.SphereGeometry(h * 0.07, 16, 12), new THREE.MeshStandardMaterial({ color: 0x8b1a1a, emissive: 0x8b1a1a, emissiveIntensity: 1.1, roughness: 0.4 }));
    bodyM.scale.y = 1.25; lg.add(bodyM);
    lg.add(makeGlowSprite(0xffcaa0, h * 0.32, h * 0.42, 0));
    lg.position.set(s * w * 0.32, h * 0.42, d * 0.5); g.add(lg);
  }
  if (o.glow) { const gl = new THREE.PointLight(o.glow, 1.6, w * 4, 2); gl.position.y = h * 0.6; g.add(gl); }
  return g;
}

function buildPool(o) {
  const g = new THREE.Group();
  const R = o.radius || 120;
  g.add(buildIsland(R, 0x4a6b8b));

  // ---- 下沉式汉白玉仙池：池壁 + 池沿 + 碧绿水面 ----
  const Rin = R * 0.78, Rout = R * 0.90;
  const yBot = 3.2, yTop = 6.8;           // 池底 / 池沿高度
  const marble = matMarble();
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(Rout, Rout * 1.015, yTop - yBot, 72, 1, true), marble);
  outerWall.position.y = (yBot + yTop) / 2; outerWall.castShadow = true; outerWall.receiveShadow = true; g.add(outerWall);
  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(Rin, Rin, yTop - yBot, 72, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xeeebe0, map: getTex('marble').map, roughness: 0.42, metalness: 0.04, side: THREE.DoubleSide }));
  innerWall.position.y = (yBot + yTop) / 2; innerWall.receiveShadow = true; g.add(innerWall);
  const rim = new THREE.Mesh(new THREE.RingGeometry(Rin, Rout, 72), marble);
  rim.rotation.x = -Math.PI / 2; rim.position.y = yTop; rim.receiveShadow = true; g.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(Rin, 72),
    new THREE.MeshStandardMaterial({ color: 0x22453a, map: getTex('stone'), roughness: 0.85, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = yBot + 0.08; floor.receiveShadow = true; g.add(floor);
  // 池沿外的一圈浅台，接住浮岛的石头地面
  const apron = new THREE.Mesh(new THREE.RingGeometry(Rout, Rout + 9, 72), marble);
  apron.rotation.x = -Math.PI / 2; apron.position.y = yTop - 0.9; apron.receiveShadow = true; g.add(apron);

  // 碧绿池水：清透但带玉石般的绿，表面有缓慢流动的细波
  const waterY = yTop - 0.28;
  waterNormalTex = makeWaterNormalTexture();
  waterNormalTex.repeat.set(8, 8);
  const water = new THREE.Mesh(new THREE.CircleGeometry(Rin - 0.5, 84),
    new THREE.MeshPhysicalMaterial({
      color: 0x127a52, metalness: 0.16, roughness: 0.035,
      transparent: true, opacity: 0.52, depthWrite: false,
      emissive: 0x073a28, emissiveIntensity: 0.30,
      clearcoat: 1.0, clearcoatRoughness: 0.035,
      normalMap: waterNormalTex, normalScale: new THREE.Vector2(0.55, 0.55),
      envMapIntensity: 1.5, ior: 1.36,
    }));
  water.rotation.x = -Math.PI / 2; water.position.y = waterY; water.renderOrder = 3; g.add(water);

  // 池心石台 + 水榭
  const isl = new THREE.Mesh(new THREE.CylinderGeometry(30, 33, yTop - yBot + 0.4, 48), marble);
  isl.position.y = (yBot + yTop) / 2; isl.receiveShadow = true; isl.castShadow = true; g.add(isl);
  const pav = buildPalace({ width: 40, height: 14, tiers: 2, roof: o.roof, accent: o.accent, glow: o.glow });
  pav.position.set(0, yTop + 0.2, 0); g.add(pav);

  // 池上莲花
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2, d = Rin * (0.32 + Math.random() * 0.55);
    const lotus = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcf6a, emissiveIntensity: 0.5, roughness: 0.5 }));
    core.scale.y = 0.5; lotus.add(core);
    for (let p = 0; p < 6; p++) {
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0xff9ec4, emissive: 0x551030, emissiveIntensity: 0.45, roughness: 0.5, side: THREE.DoubleSide }));
      petal.position.set(Math.cos(p / 6 * Math.PI * 2) * 1.6, 0.4, Math.sin(p / 6 * Math.PI * 2) * 1.6); petal.rotation.z = 0.6; petal.rotation.y = p / 6 * Math.PI * 2; lotus.add(petal);
    }
    lotus.position.set(Math.cos(a) * d, waterY + 0.15, Math.sin(a) * d); g.add(lotus);
  }
  // 池沿石灯
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const lg = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 10, 8), marble);
    post.position.y = 5; post.castShadow = true; lg.add(post);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(3, 3.4, 3), new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffb347, emissiveIntensity: 1.4, roughness: 0.5 }));
    lamp.position.y = 11.6; lg.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.2, 4), matGold());
    cap.position.y = 14.4; cap.rotation.y = Math.PI / 4; lg.add(cap);
    lg.add(makeGlowSprite(0xffcaa0, 10, 12, 11.6));
    lg.position.set(Math.cos(a) * (Rout - 3), yTop, Math.sin(a) * (Rout - 3)); g.add(lg);
  }
  // 水中锦鲤
  g.add(buildKoi(Rin, waterY, yBot, 36));
  // 供「放河灯」玩法引用：水面对象、水面高度、池半径
  poolRef = { root: g, water, waterY, Rin, Rout };
  return g;
}

// 锦鲤：细长纺锤身 + 摆动尾鳍，沿池中环形巡游
const KOI = [];
const LURES = [];            // 河灯位置（池体局部坐标）：灯亮了鱼就聚过来
const LANTERNS = [];
let poolRef = null;          // { root, water, waterY, Rin, Rout }
let waterNormalTex = null;

function makeWaterNormalTexture() {
  const S = 128;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const H = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x / S) * Math.PI * 2, v = (y / S) * Math.PI * 2;
      H[y * S + x] = Math.sin(u * 2 + Math.cos(v * 2) * 1.2) * 0.5
                   + Math.sin(v * 3 - 0.7) * 0.30
                   + Math.sin((u + v) * 4 + Math.cos(u) * 1.5) * 0.14
                   + Math.sin((u - v) * 6) * 0.07;
    }
  }
  const at = (x, y) => H[(((y % S) + S) % S) * S + (((x % S) + S) % S)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const nx = -dx * 2.4, ny = -dy * 2.4, nz = 1.0;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * S + x) * 4;
      img.data[i] = Math.round((nx / l * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((nz / l * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return texFromCanvas(c, false);
}

function buildKoi(R, waterY, floorY, avoidR) {
  const g = new THREE.Group();
  KOI.length = 0;
  const n = isMobile ? 5 : 10;
  const palette = [0xff5a12, 0xff9a1e, 0xfff4e2, 0xfffbf4, 0xd8321a, 0xffb020, 0xf04a10];
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.3 });
  for (let i = 0; i < n; i++) {
    const f = new THREE.Group();
    const col = palette[i % palette.length];
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.26, metalness: 0.12, emissive: col, emissiveIntensity: 0.14 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 12), mat);
    body.scale.set(0.76, 0.92, 2.5); f.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), mat);
    head.position.z = 3.05; head.scale.set(0.92, 0.92, 1.15); f.add(head);
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.7, 3), mat);
    dorsal.position.set(0, 1.3, 0.1); dorsal.scale.set(0.22, 1, 1); f.add(dorsal);
    for (const s of [-1, 1]) {
      const pf = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 3), mat);
      pf.position.set(s * 1.0, -0.25, 1.4);
      pf.rotation.set(0, 0, s * 1.3); pf.scale.set(1, 1, 0.3); f.add(pf);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
      e.position.set(s * 0.72, 0.30, 3.85); f.add(e);
    }
    // 尾鳍（挂在枢轴上左右摆）
    const tail = new THREE.Group(); tail.position.z = -3.3; f.add(tail);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.9, 4), mat);
    fin.rotation.x = -Math.PI / 2; fin.scale.set(0.26, 1, 1); fin.position.z = -1.45; tail.add(fin);
    const d = {
      a: Math.random() * Math.PI * 2,
      sp: (0.14 + Math.random() * 0.18) * (Math.random() < 0.5 ? 1 : -1),
      r: avoidR + 8 + Math.random() * (R - avoidR - 20),
      sx: 0.86 + Math.random() * 0.2, sz: 0.86 + Math.random() * 0.2,
      y: waterY - 0.95 - Math.random() * 0.7,
      ph: Math.random() * Math.PI * 2, tail,
    };
    f.userData = d;
    d.r0 = d.r;              // 记下原始巡游半径，灯灭后鱼群能自己散回去
    f.scale.setScalar(1.45 + Math.random() * 0.75);
    g.add(f); KOI.push(f);
  }
  return g;
}

function updateKoi(dt, time) {
  for (let i = 0; i < KOI.length; i++) {
    const f = KOI[i], d = f.userData;
    if (LURES.length) {
      // 灯亮了：鱼缓缓聚到灯下，绕灯打转、贴着水面抢灯影
      const L = LURES[i % LURES.length];
      const ta = Math.atan2(L.z, L.x) + (i % 2 ? 0.26 : -0.26);
      const tr = Math.hypot(L.x, L.z) + 16 + (i % 3) * 7;
      d.a += d.sp * dt * 0.22;
      const da = ((ta - d.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      d.a += da * Math.min(1, dt * 0.85);
      d.r += (tr - d.r) * Math.min(1, dt * 0.7);
    } else {
      d.a += d.sp * dt;
      d.r += (d.r0 - d.r) * Math.min(1, dt * 0.5);
    }
    const r = d.r + Math.sin(time * 0.5 + d.ph) * (LURES.length ? 3.0 : 4.5);
    const bob = LURES.length ? 0.22 : 0.5;
    f.position.set(Math.cos(d.a) * r * d.sx, d.y + Math.sin(time * 0.85 + d.ph * 1.7) * bob, Math.sin(d.a) * r * d.sz);
    f.rotation.y = Math.atan2(-Math.sin(d.a) * d.sx * d.sp, Math.cos(d.a) * d.sz * d.sp);
    f.rotation.x = Math.sin(time * 1.6 + d.ph) * 0.05;
    d.tail.rotation.y = Math.sin(time * 6.5 + d.ph) * (LURES.length ? 0.8 : 0.5);
  }
}

function buildLandmark(lm) {
  let inner;
  const baseY = lm.baseY || 0;
  if (lm.id === 'lingxiao') {
    // 三层重檐的凌霄宝殿，坐于云台之上，正面踏跺接汉白玉御道直通南天门
    inner = new THREE.Group();
    const hall = buildSupremeHall({ width: lm.width, depth: lm.depth, height: lm.height, roof: lm.roof, accent: lm.accent, glow: lm.glow, name: lm.zh });
    hall.position.y = baseY; inner.add(hall);
    inner.add(makePlateau(176, 208, baseY, 50));
    const gate = LANDMARKS.find((l) => l.id === 'nantianmen');
    const z0 = 103, z1 = gate.pos[2] - 50;
    if (z1 > z0 + 24) inner.add(buildImperialWay(z0, z1, 48, baseY));
  } else if (lm.type === 'gate') {
    inner = new THREE.Group();
    const gate = buildGate({ width: lm.width, height: lm.height, depth: lm.depth, roof: lm.roof, accent: lm.accent, glow: lm.glow, name: lm.zh });
    gate.position.y = baseY; inner.add(gate);
    // 城门同样立在云台之上，才能与御道齐平
    inner.add(makePlateau(lm.width * 1.62, (lm.depth || 20) * 5, baseY, 34));
  }
  else if (lm.id === 'doushuai') {
    // 两层楼阁的兜率宫，正面悬“兜率宫”匾
    inner = new THREE.Group();
    const hall = buildAlchemyPalace({ width: lm.width, roof: lm.roof, accent: lm.accent, glow: lm.glow, name: lm.zh });
    hall.position.y = baseY; inner.add(hall);
  }
  else if (lm.type === 'pool') inner = buildPool({ radius: lm.radius, roof: lm.roof, accent: lm.accent, glow: lm.glow });
  else if (lm.id === 'guanghan') {
    inner = new THREE.Group();
    const island = buildIsland(70, 0x3a4a6b); inner.add(island);
    inner.add(buildMoonPalaceContent(lm));
  } else inner = buildPalace({ width: lm.width, depth: lm.depth, height: lm.height, tiers: lm.tiers, roof: lm.roof, accent: lm.accent, wall: lm.wall, columns: 6, glow: lm.glow });

  const root = new THREE.Group();
  root.add(inner);
  root.position.set(lm.pos[0], lm.pos[1], lm.pos[2]);

  // floating name label
  const labelTex = makeLabelTexture(lm.zh, lm.en);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false }));
  label.scale.set(70, 22, 1);
  const bodyTop = (lm.type === 'gate' ? lm.height : (lm.height || 20) + 6);
  const roofExtra = (lm.type === 'gate' ? lm.height * 0.5 : (lm.tiers || 2) * (lm.height || 20) * 0.5) + (lm.type === 'pool' ? 14 : 6);
  const topY = lm.labelY !== undefined ? lm.labelY : bodyTop + roofExtra + (lm.type === 'pool' ? 16 : 14);
  label.position.set(0, topY, 0);
  root.add(label);
  return root;
}

// content-only moon palace (island added by caller)
function buildMoonPalaceContent(lm) {
  const grp = new THREE.Group();
  const p = buildPalace({ width: 54, height: 17, tiers: 2, roof: lm.roof, accent: lm.accent, glow: lm.glow, plaque: lm.zh });
  p.position.y = 2.6; grp.add(p);

  // 桂树 (osmanthus) — trunk, foliage and tiny golden blossoms
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 18, 10), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9, metalness: 0.05 }));
  trunk.position.set(40, 11, 20); grp.add(trunk);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(8 + Math.random() * 4, 12, 10), new THREE.MeshStandardMaterial({ color: 0x9fd6a0, roughness: 0.8, emissive: 0x224a22, emissiveIntensity: 0.3 }));
    leaf.position.set(40 + (Math.random() - 0.5) * 18, 20 + Math.random() * 12, 20 + (Math.random() - 0.5) * 18); grp.add(leaf);
  }
  for (let i = 0; i < 40; i++) {
    const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffd070, emissiveIntensity: 0.9, roughness: 0.5 }));
    blossom.position.set(40 + (Math.random() - 0.5) * 22, 18 + Math.random() * 16, 20 + (Math.random() - 0.5) * 22); grp.add(blossom);
  }

  // 玉兔 (jade rabbit)
  const rbMat = new THREE.MeshStandardMaterial({ color: 0xf0f4ff, roughness: 0.35, metalness: 0.1, emissive: 0x334466, emissiveIntensity: 0.35 });
  const rb = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), rbMat); rb.scale.set(1, 0.9, 1.3); rb.position.set(-34, 6, 26); grp.add(rb);
  const rbHead = new THREE.Mesh(new THREE.SphereGeometry(2, 14, 14), rbMat); rbHead.position.set(-34, 9, 29); grp.add(rbHead);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 4, 4, 8), rbMat); ear.position.set(-34 + s * 1.1, 13, 29); ear.rotation.x = -0.2; grp.add(ear);
  }
  const mortar = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2, 2, 16), matMarble()); mortar.position.set(-40, 4, 20); grp.add(mortar);

  // crescent moon rock
  const moonRock = new THREE.Mesh(new THREE.TorusGeometry(10, 3, 12, 24, Math.PI), matMarble());
  moonRock.position.set(46, 6, -10); moonRock.rotation.z = Math.PI * 0.1; grp.add(moonRock);

  // ---- 宫外：草地 + 石桌鼓凳 ----
  const groundY = 3.06;
  const tablePos = { x: -16, z: 44 };
  grp.add(buildGrassField(60, groundY, [
    { x: 40, z: 20, r: 16 },   // 桂树
    { x: -34, z: 26, r: 10 },  // 玉兔
    { x: -40, z: 20, r: 9 },   // 药臼
    { x: 46, z: -10, r: 14 },  // 月牙石
    { x: tablePos.x, z: tablePos.z, r: 13 }, // 茶桌
  ]));
  const tea = buildTeaSet();
  tea.position.set(tablePos.x, groundY, tablePos.z);
  tea.rotation.y = -0.32;
  grp.add(tea);
  grp.add(buildGardenPath(2, 29, tablePos.x + 6, tablePos.z - 9, groundY));
  return grp;
}

/* ------------------ 广寒宫苑：草地 / 石桌鼓凳 / 小径 ------------------ */
// 宫外草皮：草地圆盘 + 草簇（InstancedMesh）+ 零星野花
function buildGrassField(R, y, avoid) {
  const g = new THREE.Group();
  const tex = getTex('grass');
  if (tex.repeat.x === 1) tex.repeat.set(5, 5);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R, 80),
    new THREE.MeshStandardMaterial({ color: 0x8dbb6a, map: tex, roughness: 0.94, metalness: 0.0 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = y;
  ground.receiveShadow = true; g.add(ground);

  const N = isMobile ? 260 : 620;
  const tuftGeo = new THREE.ConeGeometry(0.55, 1.7, 4, 1);
  tuftGeo.translate(0, 0.85, 0);
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x4d7534, roughness: 0.92, metalness: 0.0, flatShading: true });
  const inst = new THREE.InstancedMesh(tuftGeo, tuftMat, N);
  inst.castShadow = true; inst.receiveShadow = true;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(),
    sc = new THREE.Vector3(), pos = new THREE.Vector3();
  // 先生成草簇中心，再在其周围撒草叶：成丛才算草地，散开就像小树林
  const seeds = [];
  const nCluster = isMobile ? 18 : 34;
  for (let c = 0; c < nCluster; c++) {
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * (R - 36);
    seeds.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  let k = 0, guard = 0;
  while (k < N && guard++ < N * 40) {
    const sd = seeds[(Math.random() * seeds.length) | 0];
    const x = sd.x + (Math.random() - 0.5) * 17;
    const z = sd.z + (Math.random() - 0.5) * 17;
    const rr = Math.hypot(x, z);
    if (rr > R - 3) continue;
    if (Math.abs(x) < 32 && Math.abs(z) < 32) continue;    // 避开殿身台基
    let skip = false;
    for (const av of avoid) { if (Math.hypot(x - av.x, z - av.z) < av.r) { skip = true; break; } }
    if (skip) continue;
    eu.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.22);
    q.setFromEuler(eu);
    const s = 0.6 + Math.random() * 0.85;
    sc.set(s, s * (0.7 + Math.random() * 0.85), s);
    pos.set(x, y, z);
    mtx.compose(pos, q, sc);
    inst.setMatrixAt(k, mtx);
    k++;
  }
  inst.count = k;
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);

  // 野花
  const petal = new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffe0a0, emissiveIntensity: 0.5, roughness: 0.6 });
  const fN = isMobile ? 14 : 32;
  for (let i = 0; i < fN; i++) {
    const sd = seeds[i % seeds.length];
    const x = sd.x + (Math.random() - 0.5) * 13, z = sd.z + (Math.random() - 0.5) * 13;
    if (Math.abs(x) < 32 && Math.abs(z) < 32) continue;
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.36, 6, 5), petal);
    fl.position.set(x, y + 0.55 + Math.random() * 0.45, z); g.add(fl);
  }
  return g;
}

// 汉白玉圆桌 + 四只朱漆鼓凳 + 一套青瓷茶具
function buildTeaSet() {
  const g = new THREE.Group();
  const marble = matMarble(), gold = matGold(), lacquer = matLacquer();
  // 圆桌：柱础 + 独腿 + 桌面
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 3.0, 1.1, 20), marble);
  foot.position.y = 0.55; foot.castShadow = true; foot.receiveShadow = true; g.add(foot);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.4, 3.7, 16), marble);
  leg.position.y = 2.95; leg.castShadow = true; g.add(leg);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.1, 0.85, 36), marble);
  top.position.y = 5.2; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.24, 0.17, 8, 36), gold);
  rim.rotation.x = Math.PI / 2; rim.position.y = 5.56; g.add(rim);

  // 茶具：提梁壶 + 四只茶盏
  const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xf7f9f3, roughness: 0.16, metalness: 0.04, clearcoat: 0.9, clearcoatRoughness: 0.08 });
  const pot = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 12), porcelain);
  pot.scale.y = 0.82; pot.position.set(0, 6.5, 0); pot.castShadow = true; g.add(pot);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.74, 0.22, 16), porcelain);
  lid.position.set(0, 7.3, 0); g.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), gold);
  knob.position.set(0, 7.48, 0); g.add(knob);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.27, 1.2, 10), porcelain);
  spout.position.set(1.2, 6.66, 0); spout.rotation.z = -1.0; g.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 6, 14, Math.PI * 1.15), porcelain);
  handle.position.set(-1.05, 6.72, 0); handle.rotation.z = -0.55; g.add(handle);
  const teaMat = new THREE.MeshStandardMaterial({ color: 0x8cc46a, emissive: 0x2f5a1e, emissiveIntensity: 0.45, roughness: 0.25 });
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const cx = Math.cos(a) * 2.95, cz = Math.sin(a) * 2.95;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.34, 0.52, 14), porcelain);
    cup.position.set(cx, 5.88, cz); cup.castShadow = true; g.add(cup);
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 14), teaMat);
    tea.position.set(cx, 6.11, cz); g.add(tea);
  }

  // 鼓凳：汉白玉坐面 + 朱漆鼓身 + 金箍
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const st = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.62, 24), marble);
    seat.position.y = 3.1; seat.castShadow = true; seat.receiveShadow = true; st.add(seat);
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.82, 2.6, 24), lacquer);
    belly.position.y = 1.5; belly.castShadow = true; st.add(belly);
    const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.86, 0.3, 24), marble);
    baseRing.position.y = 0.15; baseRing.receiveShadow = true; st.add(baseRing);
    for (const yy of [0.42, 2.6]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.12, 6, 24), gold);
      hoop.rotation.x = Math.PI / 2; hoop.position.y = yy; st.add(hoop);
    }
    st.position.set(Math.cos(a) * 8.9, 0, Math.sin(a) * 8.9);
    st.rotation.y = -a;
    g.add(st);
  }
  return g;
}

// 草地上的碎拼小径：从殿前踏跺通向茶桌
function buildGardenPath(x0, z0, x1, z1, y) {
  const g = new THREE.Group();
  const m = matMarble();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * 3;
    const z = z0 + (z1 - z0) * t;
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(2.3 + Math.random() * 0.4, 2.2, 0.5, 9), m);
    slab.position.set(x, y + 0.22, z);
    slab.rotation.y = Math.random() * Math.PI;
    slab.receiveShadow = true; slab.castShadow = true;
    g.add(slab);
  }
  return g;
}

/* ---------------------------- Sky / celestial -------------------------- */
function buildSky() {
  // Sky dome (follows the camera, stays world-oriented) — gradient + day/night uniforms
  const skyGeo = new THREE.SphereGeometry(4000, 32, 16);
  const skyOct = isMobile ? 3 : 5;
  skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: {
      uDayTop: { value: new THREE.Vector3(0.10, 0.28, 0.70) },
      uDayBot: { value: new THREE.Vector3(0.52, 0.66, 0.86) },
      uNightTop: { value: new THREE.Vector3(0.02, 0.02, 0.08) },
      uNightBot: { value: new THREE.Vector3(0.10, 0.10, 0.22) },
      uMix: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uWarm: { value: 0 },
      uTime: { value: 0 },
      uCover: { value: 0.42 },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `#define OCT ${skyOct}\n${CLOUD_GLSL}
      uniform vec3 uDayTop; uniform vec3 uDayBot; uniform vec3 uNightTop; uniform vec3 uNightBot;
      uniform float uMix; uniform vec3 uSunDir; uniform float uWarm; uniform float uTime; uniform float uCover;
      varying vec3 vDir;
      void main() {
        vec3 dir = normalize(vDir);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 day = mix(uDayBot, uDayTop, pow(h, 0.8));
        vec3 night = mix(uNightBot, uNightTop, pow(h, 0.6));
        vec3 col = mix(day, night, uMix);
        vec3 sd = normalize(uSunDir);
        float sun = max(dot(dir, sd), 0.0);
        col += vec3(1.0, 0.55, 0.2) * pow(sun, 6.0) * uWarm * (1.0 - uMix * 0.7);

        // ---- 铺满天穹的云层：方向向量做平面透视投影，越靠地平线越密 ----
        float ay = max(dir.y, 0.035);
        vec2 sp = dir.xz / (ay + 0.30) * 4.2;
        vec2 drift = vec2(uTime * 0.0042, uTime * 0.0023);
        vec2 q = vec2(cFbm(sp * 0.5 + drift * 0.7), cFbm(sp * 0.5 - drift * 0.5 + 8.7));
        float n = cBillow(sp * 0.95 + (q - 0.5) * 1.5 + drift);
        float cover = smoothstep(uCover, uCover + 0.26, n);
        // 高层丝缕薄云，让天空不至于是一整片积云
        float thin = smoothstep(0.46, 0.92, cFbm(sp * 0.42 + drift * 2.2 + 21.0));
        float a = clamp(cover * 0.95 + thin * 0.22 * smoothstep(0.02, 0.35, dir.y), 0.0, 1.0);
        // 地平线附近不要一刀切：向上收云、向下渐入远处云海，避免出现生硬的水平色带
        a *= smoothstep(-0.22, 0.10, dir.y);
        // 地平线以下：把天色渐变为远处云海的淡青灰，读作「云铺到天边」
        vec3 farSea = mix(vec3(0.78, 0.83, 0.90), vec3(0.10, 0.13, 0.22), uMix);
        col = mix(farSea, col, smoothstep(-0.26, 0.06, dir.y));
        // 云体受光：云顶亮、云底压暗；黄昏整体染金；夜里压成深蓝剪影
        vec3 litC = mix(vec3(0.98, 0.97, 0.95), vec3(0.26, 0.30, 0.46), uMix);
        litC += vec3(0.55, 0.38, 0.20) * uWarm * 1.1;
        vec3 shaC = mix(vec3(0.56, 0.62, 0.75), vec3(0.05, 0.06, 0.12), uMix);
        vec3 cloudCol = mix(shaC, litC, smoothstep(0.10, 0.92, n));
        cloudCol += vec3(0.55, 0.47, 0.34) * pow(sun, 12.0) * (0.55 + uWarm * 1.3) * (1.0 - uMix * 0.55);
        col = mix(col, cloudCol, a);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);
  scene.background = null;
  scene.fog = new THREE.FogExp2(0x5c5188, 0.00026);

  // Stars
  const starCount = isMobile ? 1800 : 4500;
  const pos = new Float32Array(starCount * 3);
  const col = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 1600 + Math.random() * 600;
    const th = Math.acos(2 * Math.random() - 1);
    const ph = Math.random() * Math.PI * 2;
    pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(th)) * 0.7 + 80; // bias upward
    pos[i * 3 + 2] = r * Math.sin(th) * Math.sin(ph);
    const tint = Math.random();
    col[i * 3] = 0.8 + 0.2 * tint; col[i * 3 + 1] = 0.85 + 0.15 * tint; col[i * 3 + 2] = 1.0;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  starField = new THREE.Points(sg, new THREE.PointsMaterial({
    size: 6, map: starTex, vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  scene.add(starField);

  // Sun
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }));
  scene.add(sunMesh);
  sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe39a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sunGlow.scale.set(620, 620, 1); scene.add(sunGlow);

  // Moon
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(46, 32, 32), new THREE.MeshStandardMaterial({ color: 0xeaf0ff, emissive: 0x9fb4d8, emissiveIntensity: 0.7, roughness: 1 }));
  scene.add(moonMesh);
  moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbfd0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  moonGlow.scale.set(360, 360, 1); scene.add(moonGlow);

  // Lights
  sunLight = new THREE.DirectionalLight(0xfff0d6, 2.2);
  sunLight.castShadow = !isMobile;
  if (sunLight.castShadow) {
    sunLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    const cam = sunLight.shadow.camera;
    cam.left = -900; cam.right = 900; cam.top = 900; cam.bottom = -900; cam.near = 1; cam.far = 5000;
    sunLight.shadow.bias = -0.0004;
  }
  scene.add(sunLight);
  hemi = new THREE.HemisphereLight(0xbcd0ff, 0x5a4a7a, 0.80); scene.add(hemi);
  ambient = new THREE.AmbientLight(0x4a4a70, 0.40); scene.add(ambient);
  moonLight = new THREE.DirectionalLight(0x9fb4ff, 0.8); scene.add(moonLight);
}

function updateDayNight(dt) {
  if (!skyMat || !sunLight) return;
  if (dayNight.auto) dayNight.phase = (dayNight.phase + dt / dayNight.length) % 1;
  const ang = dayNight.phase * Math.PI * 2;
  const s = Math.sin(ang);
  const R = 2600;
  const sunPos = new THREE.Vector3(Math.sin(ang) * R * 0.9, Math.cos(ang) * R, -R * 0.25);
  const moonPos = new THREE.Vector3(-Math.sin(ang) * R * 0.9, -Math.cos(ang) * R, R * 0.25);
  if (sunMesh) {
    sunMesh.position.copy(sunPos); sunMesh.visible = s > -0.05;
    sunGlow.position.copy(sunPos); sunGlow.visible = s > -0.05;
  }
  if (moonMesh) {
    moonMesh.position.copy(moonPos); moonMesh.visible = -s > -0.05;
    moonGlow.position.copy(moonPos); moonGlow.visible = -s > -0.05;
  }
  sunLight.position.copy(sunPos);
  sunLight.intensity = Math.max(0, s) * 2.2;
  moonLight.position.copy(moonPos);
  moonLight.intensity = Math.max(0, -s) * 1.4 + 0.08;
  nightAmount = THREE.MathUtils.clamp((0.12 - s) / 0.45, 0, 1);
  const warm = Math.max(0, (0.32 - Math.abs(s)) / 0.32) * Math.max(0, s + 0.05);
  if (skyMat) {
    // 观星模式把天空压暗一档，星点才跳得出来
    const dim = Math.max(nightAmount, starDim);
    skyMat.uniforms.uMix.value = dim;
    skyMat.uniforms.uSunDir.value.copy(sunPos).normalize();
    skyMat.uniforms.uWarm.value = warm;
  }
  if (starField) starField.material.opacity = 0.15 + Math.max(nightAmount, starDim) * 0.85;
  // 入水时雾色由 applyDiveLook 接管，别被昼夜循环覆盖
  if (scene.fog && !diving) scene.fog.color.setRGB(
    0.42 * (1 - nightAmount) + 0.04 * nightAmount,
    0.35 * (1 - nightAmount) + 0.04 * nightAmount,
    0.57 * (1 - nightAmount) + 0.12 * nightAmount);

  // 云层随昼夜同步：太阳方向 / 夜色 / 雾色，以及黄昏时的暖色云缘
  if (scene.fog) {
    const fc = scene.fog.color;
    for (let i = 0; i < cloudLayers.length; i++) {
      const u = cloudLayers[i].uniforms;
      u.uSunDir.value.copy(sunPos).normalize();
      u.uNight.value = Math.max(nightAmount, starDim);
      u.uFog.value.set(fc.r, fc.g, fc.b);
    }
  }
  // 云团精灵：白天暖白，黄昏镶金，夜晚压成蓝灰剪影
  if (cloudSpriteMats.length) {
    const nb = Math.max(nightAmount, starDim);
    const r = 1.0 - nb * 0.72 + warm * 0.10;
    const gg = 1.0 - nb * 0.72 + warm * 0.02;
    const b = 1.0 - nb * 0.58;
    for (let i = 0; i < cloudSpriteMats.length; i++) cloudSpriteMats[i].color.setRGB(r, gg, b);
  }

  if (hemi) hemi.intensity = 0.80 * (1 - Math.max(nightAmount, starDim) * 0.55);
  if (ambient) ambient.intensity = 0.40 + Math.max(nightAmount, starDim) * 0.16;
  renderer.toneMappingExposure = 0.95 - Math.max(nightAmount, starDim) * 0.22;
  // dim the IBL at night so the gold doesn't keep a daylight sheen
  const envF = 0.20 + (1 - nightAmount) * 0.95;
  for (let i = 0; i < ENV_MATS.length; i++) {
    const m = ENV_MATS[i];
    m.envMapIntensity = m.userData.envBase * envF;
  }
}

/* ------------------------- Volumetric cloud layers ---------------------- */
// 共享噪声库：分形值噪声 + billow（花椰菜状）噪声，供云海/天穹云层共用
const CLOUD_GLSL = `
float cHash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.56); return fract(p.x * p.y); }
float cNoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = cHash(i), b = cHash(i + vec2(1.0, 0.0)), c = cHash(i + vec2(0.0, 1.0)), d = cHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float cFbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < OCT; i++) { v += a * cNoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
float cBillow(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < OCT; i++) {
    float n = cNoise(p);
    v += a * (1.0 - abs(n * 2.0 - 1.0));
    p = p * 2.07 + vec2(4.3, 2.1); a *= 0.5;
  }
  return v;
}
`;

const CLOUD_SEA_FRAG = `
varying vec3 vWorld;
uniform float uTime; uniform vec3 uSunDir; uniform float uNight;
uniform vec3 uFog; uniform float uScale; uniform float uCover; uniform float uAlpha;
uniform vec2 uDrift; uniform float uWarp; uniform float uBump;
#ifdef CLOUD_RIPPLE
uniform vec3 uRipples[8];
uniform float uRippleTime;
#endif

void main() {
  vec2 p = vWorld.xz * uScale;
  vec2 drift = uDrift * uTime;
  float rippleGlow = 0.0;
  // 域扭曲：让云团边缘出现被拉拽的纤维状结构，而不是均匀的圆斑
  vec2 q = vec2(cFbm(p * 0.6 + drift * 0.6), cFbm(p * 0.6 - drift * 0.4 + 13.0));
  vec2 r = p + (q - 0.5) * uWarp + drift;
  float coarse = cBillow(r);
  float fine = cBillow(r * 2.2 + 3.0);
  float n = coarse * 0.86 + fine * 0.14;
#ifdef CLOUD_HQ
  float e = 0.17;
  float nx = cBillow((r + vec2(e, 0.0)) * 2.2 + 3.0) - fine;
  float nz = cBillow((r + vec2(0.0, e)) * 2.2 + 3.0) - fine;
#else
  float nx = 0.0, nz = 0.0;
#endif
  // 更锐利的阈值 → 云团有清晰的边界与翻滚的凹陷，而不是一片糊
  float dens = smoothstep(uCover, uCover + 0.30, n);
  // 大尺度"云团—云隙"分布，避免整片云海均匀铺满
  float bank = smoothstep(0.26, 0.80, cFbm(p * 0.15 - drift * 0.25 + 4.0));
  dens *= mix(0.45, 1.0, bank);

  // 云海垂钓：钩子入云处荡开的圆形涟漪（仅云海材质启用 CLOUD_RIPPLE）
#ifdef CLOUD_RIPPLE
  for (int ri = 0; ri < 8; ri++) {
    vec3 R0 = uRipples[ri];
    if (R0.z < 0.0) continue;
    float age = uRippleTime - R0.z;
    if (age < 0.0 || age > 3.0) continue;
    float dd = distance(vWorld.xz, R0.xy);
    float front = age * 78.0;                       // 波前以恒定速度外扩
    float ring = exp(-pow((dd - front) * 0.045, 2.0));// 高斯环
    float fade = 1.0 - age / 3.0;
    dens += ring * 0.85 * fade;                      // 涟漪鼓起一圈云
    dens -= smoothstep(46.0, 0.0, dd) * 0.40 * fade;  // 钩下云被压出一个小凹
    // 钩入云处泛一点青光，让「这里刚被钓过」一眼可辨
    rippleGlow += exp(-pow((dd - front) * 0.030, 2.0)) * 0.85 * fade;
  }
#endif

  // 用密度梯度伪造法线，得到云顶的立体受光
  vec3 nrm = normalize(vec3(-nx * uBump, 1.0, -nz * uBump));
  vec3 L = normalize(normalize(uSunDir) + vec3(0.10, 0.30, 0.06));
  float lam = clamp(dot(nrm, L), 0.0, 1.0);
  float rim = pow(lam, 8.0);
  // 云顶受光偏暖白，云隙/背光面压成冷灰蓝 —— 靠这个明暗差做出体积
  vec3 litC = mix(vec3(1.00, 0.995, 0.99), vec3(0.34, 0.38, 0.52), uNight);
  vec3 shaC = mix(vec3(0.66, 0.72, 0.82), vec3(0.08, 0.09, 0.16), uNight);
  vec3 col = mix(shaC, litC, smoothstep(0.0, 0.86, lam * 0.82 + dens * 0.30));
  // 侧逆光透亮（约等于云体次表面散射）
  col += vec3(0.34, 0.26, 0.16) * rim * (1.0 - uNight);
  // 垂钓涟漪的青光：钩子入云处泛出一圈冷色涟漪
  col += vec3(0.10, 0.42, 0.55) * rippleGlow;

  float d = length(vWorld - cameraPosition);
  float fogF = clamp(1.0 - exp(-pow(d * 0.00055, 2.0)), 0.0, 1.0);
  col = mix(col, uFog, fogF * 0.94);
  // 云隙保留一层暗底，避免透出天空底色而显得像结冰的平面
  float a = mix(0.04, 1.0, dens) * uAlpha * (1.0 - smoothstep(750.0, 2400.0, d)) * (1.0 - fogF * 0.35);
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}
`;

// 云层材质：uCover 越大云越稀（阈值越高），uScale 决定云团尺度（单位 = 1/uScale 世界单位）
function makeCloudLayerMaterial(o) {
  const oct = o.oct || (isMobile ? 3 : 5);
  const hq = o.hq !== undefined ? o.hq : !isMobile;
  const uniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.3, 1.0, 0.2) },
    uNight: { value: 0 },
    uFog: { value: new THREE.Vector3(0.42, 0.35, 0.57) },
    uScale: { value: o.scale },
    uCover: { value: o.cover },
    uAlpha: { value: o.alpha },
    uDrift: { value: new THREE.Vector2(o.driftX || 0.02, o.driftZ || 0.011) },
    uWarp: { value: o.warp === undefined ? 1.9 : o.warp },
    uBump: { value: o.bump === undefined ? 6.0 : o.bump },
    uAmp: { value: o.amp || 0 },
  };
  if (o.ripple) {
    uniforms.uRipples = { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -1)) };
    uniforms.uRippleTime = { value: 0 };
  }
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    uniforms,
    vertexShader: `#define OCT 3
      ${CLOUD_GLSL}
      uniform float uTime; uniform float uScale; uniform float uAmp;
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        if (uAmp > 0.001) {
          vec2 p = wp.xz * uScale;
          float h = cFbm(p * 0.55 + vec2(uTime * 0.014, uTime * 0.008)) * 0.68
                  + cFbm(p * 1.45 - vec2(uTime * 0.009, uTime * 0.004)) * 0.32;
          wp.y += (h - 0.62) * uAmp;
        }
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `#define OCT ${oct}\n${hq ? '#define CLOUD_HQ 1\n' : ''}${o.ripple ? '#define CLOUD_RIPPLE 1\n' : ''}${CLOUD_GLSL}${CLOUD_SEA_FRAG}`,
  });
}

function buildClouds() {
  cloudGroup = new THREE.Group();

  // 1) 主云海：起伏的云面位于台基地面（y≈3）下方，云峰则高过地板
  const seaMat = makeCloudLayerMaterial({
    scale: 0.0036, cover: 0.37, alpha: 0.98, driftX: 0.0055, driftZ: 0.0032,
    warp: 1.6, bump: 21.0, amp: 8.5, hq: true, ripple: true,
  });
  // 云海“底”：浅色层让云隙读作更深处的云，避免直接透出天空底色
  const depth = new THREE.Mesh(new THREE.PlaneGeometry(6800, 6800),
    new THREE.MeshBasicMaterial({ color: 0xc6d6e6, transparent: true, opacity: 0.98, depthWrite: false }));
  depth.rotation.x = -Math.PI / 2; depth.position.y = -22; depth.renderOrder = 0;
  depth.frustumCulled = false; scene.add(depth);

  const seaGeo = new THREE.PlaneGeometry(20000, 20000, isMobile ? 96 : 170, isMobile ? 96 : 170);
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.y = 0.5; sea.renderOrder = 1;
  sea.frustumCulled = false; scene.add(sea);
  cloudSeaMesh = sea; cloudSeaMat = seaMat;
  cloudLayers.push(seaMat);

  // 2) 半层云：贴着地面飘过，云顶明显漫过建筑地板与须弥座
  const midMat = makeCloudLayerMaterial({
    scale: 0.020, cover: 0.56, alpha: 0.10, driftX: 0.024, driftZ: 0.014,
    warp: 2.6, bump: 14.0, amp: 7.0,
  });
  const mid = new THREE.Mesh(new THREE.PlaneGeometry(4600, 4600, 48, 48), midMat);
  mid.rotation.x = -Math.PI / 2; mid.position.y = 3.8; mid.renderOrder = 2;
  mid.frustumCulled = false; scene.add(mid);
  cloudLayers.push(midMat);

  // 3) 高空积云：大尺度云块，提供天空的纵深与视差
  const count = isMobile ? 42 : 80;
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(cloudSpriteMaterial(0.5 + Math.random() * 0.34));
    const a = Math.random() * Math.PI * 2;
    const r = 420 + Math.random() * 1500;
    const y = 26 + Math.pow(Math.random(), 0.7) * 330;
    sp.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    const s = 150 + Math.random() * 320;
    sp.scale.set(s, s * (0.5 + Math.random() * 0.2), 1);
    sp.material.rotation = Math.random() * Math.PI * 2;
    sp.userData = { speed: (Math.random() - 0.5) * 6, baseY: y, phase: Math.random() * Math.PI * 2 };
    cloudGroup.add(sp);
  }
  scene.add(cloudGroup);
  buildCloudDeck();
  buildCloudSpill();
}

// 低空云团群：以"云簇"方式成团堆叠，占据岛屿之间的空域并高过地板，
// 让云海从一张平整的噪声面变成有轮廓、有前后遮挡的积云。
function buildCloudDeck() {
  const clusters = isMobile ? 10 : 20;
  for (let c = 0; c < clusters; c++) {
    const ca = Math.random() * Math.PI * 2;
    const cr = 430 + Math.pow(Math.random(), 0.8) * 1650;
    const cx = Math.cos(ca) * cr, cz = Math.sin(ca) * cr;
    const cy = 8 + Math.random() * 30;
    const n = isMobile ? 3 : 4 + Math.floor(Math.random() * 3);
    const base = 150 + Math.random() * 200;
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(cloudSpriteMaterial(0.82 + Math.random() * 0.18));
      const ox = (Math.random() - 0.5) * base * 1.6;
      const oz = (Math.random() - 0.5) * base * 1.6;
      const oy = (Math.random() - 0.5) * base * 0.30;
      sp.position.set(cx + ox, Math.max(4.5, cy + oy), cz + oz);
      const s2 = base * (0.75 + Math.random() * 0.9);
      sp.scale.set(s2, s2 * 0.62, 1);
      sp.material.rotation = Math.random() * Math.PI * 2;
      sp.userData = { speed: (Math.random() - 0.5) * 3.2, baseY: sp.position.y, phase: Math.random() * Math.PI * 2 };
      cloudGroup.add(sp);
    }
  }
}

function cloudSpriteMaterial(opacity) {
  const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity, depthWrite: false, color: 0xffffff });
  cloudSpriteMats.push(m);
  return m;
}

// 岛屿边缘的"溢云"：云团高过台基，视觉上漫过建筑地板
function buildCloudSpill() {
  if (!cloudGroup) return;
  LANDMARKS.forEach((lm) => {
    const R = (lm.radius || lm.width * 0.62 || 40);
    const n = isMobile ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      // 贴着岛缘外侧，只"啃"平台边缘，不遮挡殿宇
      const d = R * (1.02 + Math.random() * 0.42);
      const sp = new THREE.Sprite(cloudSpriteMaterial(0.20 + Math.random() * 0.16));
      sp.position.set(lm.pos[0] + Math.cos(a) * d, 1.4 + Math.random() * 3.4, lm.pos[2] + Math.sin(a) * d);
      const s = R * (0.60 + Math.random() * 0.55);
      sp.scale.set(s, s * 0.55, 1);
      sp.material.rotation = Math.random() * Math.PI * 2;
      sp.userData = { speed: (Math.random() - 0.5) * 2.2, baseY: sp.position.y, phase: Math.random() * Math.PI * 2, spill: true };
      cloudGroup.add(sp);
    }
  });
}


/* ---------------------------- Meteor shower ---------------------------- */
function makeMeteorStreakTexture() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.15, 'rgba(255,245,210,0.9)');
  grd.addColorStop(1, 'rgba(255,245,210,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 32, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function buildMeteors() {
  meteorStreakTex = makeMeteorStreakTexture();
  meteorGroup = new THREE.Group();
  const N = isMobile ? 10 : 18;
  for (let i = 0; i < N; i++) {
    const m = new THREE.Group();
    const streakGeo = new THREE.PlaneGeometry(3, 80);
    streakGeo.translate(0, -40, 0); // head at origin, tail trails to -Y
    const streak = new THREE.Mesh(streakGeo, new THREE.MeshBasicMaterial({
      map: meteorStreakTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    m.add(streak);
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    head.scale.set(16, 16, 1); m.add(head);
    m.visible = false;
    meteorGroup.add(m);
    meteors.push({ mesh: m, streak, head, active: false, vel: new THREE.Vector3(), life: 0, maxLife: 1, respawn: Math.random() * 3 });
  }
  scene.add(meteorGroup);
}
function spawnMeteor(m) {
  const dir = new THREE.Vector3((Math.random() - 0.5) * 2, -(0.35 + Math.random() * 0.5), (Math.random() - 0.5) * 2).normalize();
  const start = new THREE.Vector3((Math.random() - 0.5) * 2600, 900 + Math.random() * 900, (Math.random() - 0.5) * 2600);
  m.mesh.position.copy(start);
  m.vel.copy(dir.multiplyScalar(900 + Math.random() * 500));
  m.maxLife = 2.2 + Math.random() * 1.6;
  m.life = m.maxLife;
  m.active = true;
  m.mesh.visible = true;
}
function updateMeteors(dt) {
  if (!meteorGroup) return;
  meteorGroup.visible = meteorEnabled;
  if (!meteorEnabled) return;
  const rate = 0.5 + nightAmount * 2.2;
  const right = new THREE.Vector3(), normal = new THREE.Vector3(), toCam = new THREE.Vector3(), dir = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  for (const m of meteors) {
    if (m.active) {
      m.mesh.position.addScaledVector(m.vel, dt);
      m.life -= dt;
      const k = Math.min(1, m.life / 0.4) * Math.min(1, (m.maxLife - m.life) / 0.2);
      m.streak.material.opacity = k; m.head.material.opacity = k;
      dir.copy(m.vel).normalize();
      toCam.copy(camera.position).sub(m.mesh.position).normalize();
      right.crossVectors(dir, toCam).normalize();
      normal.crossVectors(right, dir).normalize();
      if (normal.dot(toCam) < 0) normal.negate();
      basis.makeBasis(right, dir, normal);
      m.mesh.quaternion.setFromRotationMatrix(basis);
      if (m.life <= 0) { m.active = false; m.mesh.visible = false; m.respawn = 0.2 + Math.random() * 2.2; }
    } else {
      m.respawn -= dt * rate;
      if (m.respawn <= 0) spawnMeteor(m);
    }
  }
}

/* ------------------------------- Phoenix ------------------------------- */
function makeLoopCurve(radius, y, wobble) {
  const pts = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = radius * (1 + 0.18 * Math.sin(a * 3));
    pts.push(new THREE.Vector3(Math.cos(a) * r, y + Math.sin(a * 2) * wobble, Math.sin(a) * r));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

function buildPhoenix() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff5d73, metalness: 0.35, roughness: 0.35, emissive: 0x882432, emissiveIntensity: 0.7 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(2, 18, 18), bodyMat); body.scale.set(1, 0.9, 2.4); g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 3, 12), bodyMat); neck.position.set(0, 1.4, 2.6); neck.rotation.x = -0.7; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), bodyMat); head.position.set(0, 3, 3.9); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 10), new THREE.MeshStandardMaterial({ color: 0xffc14d, metalness: 0.6, roughness: 0.4 })); beak.position.set(0, 3, 5.1); beak.rotation.x = Math.PI / 2; g.add(beak);
  const crestMat = new THREE.MeshStandardMaterial({ color: 0xffd24d, emissive: 0x553300, emissiveIntensity: 0.6, roughness: 0.4 });
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.2, 8), crestMat); c.position.set((i - 2) * 0.35, 4.2, 3.4); c.rotation.x = -0.5 - i * 0.05; g.add(c); }
  // wings: layered feather rows
  function featherRow(parent, side, mat, y, zoff, len, n) {
    for (let i = 0; i < n; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.45, len, 6), mat);
      const t = i / (n - 1);
      f.position.set(side * (1.4 + i * 1.15), y - t * 0.7, zoff - t * 4.5);
      f.rotation.set(0, 0, side * Math.PI / 2); f.rotation.x = -0.5 - t * 0.45;
      parent.add(f);
    }
  }
  function wing(side) {
    const w = new THREE.Group();
    featherRow(w, side, new THREE.MeshStandardMaterial({ color: 0x39c6e0, emissive: 0x0a4a5a, emissiveIntensity: 0.5, roughness: 0.45, side: THREE.DoubleSide }), 1.1, -0.3, 9, isMobile ? 6 : 8);
    featherRow(w, side, new THREE.MeshStandardMaterial({ color: 0xff8a5b, emissive: 0x7a2405, emissiveIntensity: 0.6, roughness: 0.45, side: THREE.DoubleSide }), 0.6, 0, 8, isMobile ? 6 : 8);
    featherRow(w, side, new THREE.MeshStandardMaterial({ color: 0xffd24d, emissive: 0x6a4000, emissiveIntensity: 0.55, roughness: 0.45, side: THREE.DoubleSide }), 0.1, 0.5, 6.5, isMobile ? 5 : 7);
    featherRow(w, side, new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x5a0a05, emissiveIntensity: 0.5, roughness: 0.45, side: THREE.DoubleSide }), -0.4, 1, 5, isMobile ? 4 : 6);
    w.position.set(side * 1, 0.6, 0); return w;
  }
  const lw = wing(-1), rw = wing(1); g.add(lw); g.add(rw);
  // long tail plumes with eyespots
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xffd24d, emissive: 0x6a4000, emissiveIntensity: 0.6, roughness: 0.35, side: THREE.DoubleSide });
  const nT = isMobile ? 5 : 7;
  for (let i = 0; i < nT; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.45, 13, 8), tailMat); f.position.set((i - (nT - 1) / 2) * 0.7, -0.4, -4.5); f.rotation.x = Math.PI * 0.5 + 0.3; g.add(f);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshStandardMaterial({ color: 0x39c6e0, emissive: 0x0a4a5a, emissiveIntensity: 0.8, roughness: 0.35 })); eye.position.set((i - (nT - 1) / 2) * 0.7 + 0.4, -0.4, -10.5); g.add(eye);
  }
  g.add(makeGlowSprite(0xffb0c0, 30, 30, 0));
  g.userData = { lw, rw };
  return g;
}

function updatePhoenix(b, dt, time) {
  if (updatePhoenixGuide(dt)) return;
  b.u = (b.u + dt * 0.02) % 1;
  const p = b.curve.getPointAt(b.u);
  const p2 = b.curve.getPointAt((b.u + 0.01) % 1);
  b.group.position.copy(p);
  b.group.lookAt(p2);
  const flap = Math.sin(time * 7) * 0.7 + 0.2;
  b.group.userData.lw.rotation.z = flap;
  b.group.userData.rw.rotation.z = -flap;
  b.group.userData.lw.rotation.y = Math.sin(time * 7) * 0.2;
  b.group.userData.rw.rotation.y = -Math.sin(time * 7) * 0.2;
}
/* ---------------------------- Build sequence w/ progress --------------- */
const setProgress = (p, msg) => {
  const bar = document.getElementById('progress-bar');
  const txt = document.getElementById('progress-text');
  if (bar) bar.style.width = Math.round(p * 100) + '%';
  if (txt) txt.textContent = Math.round(p * 100) + '%';
  if (msg) { const s = document.querySelector('[data-i18n="loadingSub"]'); if (s) s.textContent = msg; }
};
const nextFrame = () => new Promise((r) => {
  // 兜底计时：后台标签页 / 低帧率设备上 rAF 可能被节流甚至暂停，避免加载流程卡死
  let done = false;
  const fin = () => { if (!done) { done = true; r(); } };
  requestAnimationFrame(fin);
  setTimeout(fin, 300);
});

async function buildScene() {
  setProgress(0.05, t('loadingSub')); await nextFrame();
  buildSky(); setProgress(0.18); await nextFrame();
  buildClouds(); setProgress(0.32); await nextFrame();

  // landmarks
  const step = 0.4 / LANDMARKS.length;
  for (let i = 0; i < LANDMARKS.length; i++) {
    const lm = LANDMARKS[i];
    const node = buildLandmark(lm);
    node.userData.landmark = lm;
    scene.add(node);
    lm.node = node;
    setProgress(0.32 + step * (i + 1));
    if (i % 2 === 0) await nextFrame();
  }

  // beasts (瑞兽)
  const beastCfg = {
    phoenix: { r: 640, y: 230, w: 90 },
  };
  for (const b of BEASTS) {
    const c = beastCfg[b.id];
    b.curve = makeLoopCurve(c.r, c.y, c.w);
    b.group = b.build();
    b.group.userData.beast = b;
    scene.add(b.group);
  }
  setProgress(0.9); await nextFrame();

  buildMeteors();
  setProgress(0.95); await nextFrame();

  buildLandmarkPanel();
  createSlips();
  buildStarOfficials();
  buildMoonBridge();
  buildQuizSteps();
  ensureDiveDome();
  applyLang();
  setProgress(1); await nextFrame();
}

/* ==================== 修行闭环原型：三枚玉简 ==================== */
// 最小可玩闭环：抵达 → 拾取玉简 → 读到典故 → 仙箓册点亮。
// 瑶池多一道关：先点水面放三盏河灯，玉简才浮出来（锦鲤会聚到灯下）。
const SAVE_KEY = 'heaven.quest.v1';
const SLIP_DEFS = [
  { id: 'nantianmen', trigger: 260, pos: [8, 30, 438] },
  { id: 'lingxiao', trigger: 400, pos: [0, 36, 92] },
  { id: 'yaochi', trigger: 340, pos: [360, 16.4, 322], needLanterns: 3 },
];
const quest = { taken: {}, lanterns: 0, done: false };
const SLIPS = [];
let activeSlip = null, toastTimer = 0, poolCenter = null;

function loadQuest() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const o = JSON.parse(raw);
    if (o && typeof o === 'object') {
      quest.taken = (o.taken && typeof o.taken === 'object') ? o.taken : {};
      quest.lanterns = Math.max(0, Math.min(3, o.lanterns | 0));
      quest.done = !!o.done;
    }
  } catch (e) { /* 隐私模式/无 localStorage：正常游玩，只是不落盘 */ }
}
function saveQuest() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ taken: quest.taken, lanterns: quest.lanterns, done: quest.done })); } catch (e) {}
}
const takenCount = () => SLIP_DEFS.reduce((n, d) => n + (quest.taken[d.id] ? 1 : 0), 0);

/* ---- 玉简本体：一块发光的青玉简，悬在殿前缓慢旋转 ---- */
function buildJadeSlipMesh() {
  const g = new THREE.Group();
  const jade = new THREE.MeshStandardMaterial({
    color: 0x9fe1cb, emissive: 0x2f8f6f, emissiveIntensity: 0.85,
    roughness: 0.24, metalness: 0.16, transparent: true, opacity: 0.95,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8.6, 0.6), jade);
  g.add(body);
  // 上下两道金箍（编绳的意象）
  for (const s of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.5, 0.76), matGold());
    band.position.y = s * 2.7; g.add(band);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 8, 18), matGold());
  ring.position.y = 5.1; g.add(ring);
  g.add(makeGlowSprite(0xa8f0d8, 28, 28, 0));
  return g;
}

function spawnSlip(def) {
  if (SLIPS.some((s) => s.id === def.id && !s.taken)) return null;
  const mesh = buildJadeSlipMesh();
  mesh.position.set(def.pos[0], def.pos[1], def.pos[2]);
  mesh.traverse((o) => { o.userData.slipId = def.id; });
  scene.add(mesh);
  const s = {
    id: def.id, def, mesh, taken: false, fade: -1,
    base: new THREE.Vector3(def.pos[0], def.pos[1], def.pos[2]),
  };
  SLIPS.push(s);
  return s;
}

function createSlips() {
  loadQuest();
  for (const d of SLIP_DEFS) {
    if (quest.taken[d.id]) continue;
    if (d.needLanterns && quest.lanterns < d.needLanterns) continue;
    spawnSlip(d);
  }
  // 存档里已经放过灯：把灯补回水面，鱼群也一起回来
  if (quest.lanterns > 0 && poolRef) {
    for (let i = 0; i < quest.lanterns; i++) {
      const a = Math.PI * 0.5 + (i - 1) * 0.62;
      addLanternObject(Math.cos(a) * 74, Math.sin(a) * 74);
    }
  }
  refreshQuestUI();
}

/* ---- 河灯 ---- */
function addLanternObject(x, z) {
  if (!poolRef) return null;
  const g = new THREE.Group();
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xe0456f, emissive: 0x8c1030, emissiveIntensity: 0.55,
    roughness: 0.5, side: THREE.DoubleSide,
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6.4, 5), petalMat);
    p.position.set(Math.cos(a) * 4.3, 0.4, Math.sin(a) * 4.3);
    p.rotation.set(0.52, -a, 0.66);
    g.add(p);
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 3.6, 1.4, 16),
    new THREE.MeshStandardMaterial({ color: 0x13361f, emissive: 0x061c10, emissiveIntensity: 0.4, roughness: 0.75, metalness: 0.05 }));
  base.position.y = 0.1; g.add(base);
  // 灯盏：暖金色的小灯碗，俯视时才不会只看到一张暗绿底盘
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 1.7, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa63c, emissiveIntensity: 1.7, roughness: 0.5 }));
  bowl.position.y = 1.9; g.add(bowl);
  // 灯芯：一小簇明火，高出花瓣才看得出「点着了」
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb43c });
  const candle = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 8), flameMat);
  candle.position.y = 4.4; g.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  flame.position.y = 5.5; flame.scale.y = 1.6; g.add(flame);
  // 灯晕：小一圈、半透明，才不会把整片水面糊白
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xff9a4a, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  halo.scale.set(7, 8, 1); halo.position.y = 5.0; g.add(halo);
  const light = new THREE.PointLight(0xffb26a, 1.1, 78, 2);
  light.position.y = 5.2; g.add(light);

  const y = poolRef.waterY + 0.3;
  g.position.set(x, y, z);
  g.scale.setScalar(1.3);
  g.userData.baseY = y;
  g.userData.phase = Math.random() * Math.PI * 2;
  poolRef.root.add(g);
  LANTERNS.push(g);
  LURES.push(new THREE.Vector3(x, y, z));
  return g;
}

function placeLantern(worldPoint) {
  if (!poolRef || quest.lanterns >= 3) return false;
  const local = poolRef.root.worldToLocal(worldPoint.clone());
  const r = Math.hypot(local.x, local.z);
  const rr = Math.max(46, Math.min(poolRef.Rin - 12, r));       // 收进池内、避开池心水榭
  let a = Math.atan2(local.z, local.x);
  // 避免两盏灯叠在同一处：挨太近就绕着池心挪开
  for (let t = 0; t < 12; t++) {
    const px = Math.cos(a) * rr, pz = Math.sin(a) * rr;
    const clash = LANTERNS.some((l) => Math.hypot(l.position.x - px, l.position.z - pz) < 26);
    if (!clash) break;
    a += 0.45;
  }
  addLanternObject(Math.cos(a) * rr, Math.sin(a) * rr);

  quest.lanterns = LANTERNS.length;
  saveQuest();
  toast(lang === 'zh' ? t('questLanternTipZh') : t('questLanternTipEn'));
  if (quest.lanterns >= 3) {
    spawnSlip(SLIP_DEFS.find((d) => d.id === 'yaochi'));
    setTimeout(() => toast(lang === 'zh' ? t('questOpenTipZh') : t('questOpenTipEn')), 900);
  }
  refreshQuestUI();
  return true;
}

/* ---- 拾取 ---- */
function collectSlip(s) {
  if (!s || s.taken) return false;
  s.taken = true; s.fade = 0;
  quest.taken[s.id] = Date.now();
  saveQuest();
  const lm = LANDMARKS.find((l) => l.id === s.id);
  toast((lang === 'zh' ? t('questGotZh') : t('questGotEn')) + (lm ? (lang === 'zh' ? lm.zh : lm.en) : s.id));
  if (lm) { showInfo(lm); speak(lang === 'zh' ? lm.descZh : lm.descEn); }
  activeSlip = null;
  setPrompt('');
  refreshQuestUI();
  checkQuestDone();
  return true;
}

function checkQuestDone() {
  if (quest.done || takenCount() < SLIP_DEFS.length) return;
  quest.done = true; saveQuest();
  toast(lang === 'zh' ? t('questAll') : t('questAllEn'));
  document.getElementById('quest-panel').classList.add('open');
  // 收束镜头：退回全景，把整座天庭交还给玩家（这才是「闭环」的收尾）
  if (touring) toggleTour();
  clearFollow();
  fly = {
    fromPos: camera.position.clone(), toPos: DEFAULT_CAM.clone(),
    fromTar: controls.target.clone(), toTar: DEFAULT_TAR.clone(), t: 0, dur: 2.4,
  };
  currentLandmark = null;
  refreshQuestUI();
}

function resetQuest() {
  quest.taken = {}; quest.lanterns = 0; quest.done = false;
  saveQuest();
  LANTERNS.forEach((l) => { if (l.parent) l.parent.remove(l); });
  LANTERNS.length = 0; LURES.length = 0;
  SLIPS.forEach((s) => { if (s.mesh.parent) scene.remove(s.mesh); });
  SLIPS.length = 0;
  SLIP_DEFS.forEach((d) => { if (!d.needLanterns) spawnSlip(d); });
  refreshQuestUI();
  toast(lang === 'zh' ? t('questResetTipZh') : t('questResetTipEn'));
}

/* ==================== 扩展玩法系统 ==================== */
// 六套创意玩法：凤凰引路 / 星宿连线 / 云海垂钓 / 月相门 / 御道登阶 / 镜池水中天
let gameMode = null;                 // 'star' | 'fish' | null（观星 / 垂钓为模式）
let phoenixGuide = null;             // 凤凰引路状态机
const ADOPTED = {};                  // 星宿连线已点亮的殿宇 id -> beacon 对象
let starGroup = null, starSel = null, starSpin = 0, starDim = 0, starCurrent = 0, starNextTimer = 0; // 观星：星点组 + 当前选择 + 缓转 + 压暗 + 当前星官
const QUIZ_DONE = {};                // 御道登阶已完成阶口
let quizOpen = false, currentQuiz = null;
const quizStepMarkers = [];
let diving = false, mirrorRealm = null, diveDome = null, diveState = null, diveLight = null;
let moonBridge = null;
let fishCount = 0;
const fishingItems = [];
let gamesTicker = 0;
let _audio = null;

/* ---------- 音效（首次用户手势后创建，满足自动播放策略） ---------- */
function audioCtx() {
  if (!_audio) { try { _audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (_audio && _audio.state === 'suspended') _audio.resume();
  return _audio;
}
function playChime(freqs) {
  const ac = audioCtx(); if (!ac) return;
  const t0 = ac.currentTime;
  (freqs || [660, 880, 1175]).forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const s = t0 + i * 0.08;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.16, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
    o.connect(g).connect(ac.destination); o.start(s); o.stop(s + 0.55);
  });
}

/* ---------- 星宿连线 ---------- */
// 每个星官有固定的星形与连线顺序：北斗是斗形，玄武是龟蛇相缠，等等。
// shape 是星点在「切平面」上的归一化坐标（x 向右、y 向上），连线按数组顺序首尾相接。
const STAR_OFFICIALS = [
  { id: 'ziwei', zh: '紫微垣', en: 'Purple Forbidden', lmId: 'ziwei', seed: 0.3, y: 0.80,
    shape: [[0, 0.18], [0.42, 0.02], [0.30, -0.42], [-0.30, -0.42], [-0.42, 0.02]] },
  { id: 'douniu', zh: '北斗', en: 'Northern Dipper', lmId: 'douniu', seed: 1.6, y: 0.70,
    // 斗：口四星 + 柄三星
    shape: [[0, 0], [0.62, 0.16], [1.05, 0.30], [1.42, 0.44], [1.42, 0.86], [1.02, 0.70], [0.62, 0.56]] },
  { id: 'miluo', zh: '太微垣', en: 'Supreme Palace', lmId: 'miluo', seed: 3.1, y: 0.60,
    shape: [[0, 0], [0.52, 0.22], [0.22, 0.56], [-0.30, 0.50], [-0.48, 0.04]] },
  { id: 'lingxu', zh: '文昌', en: 'Wenchang', lmId: 'lingxu', seed: 4.7, y: 0.50,
    shape: [[-0.55, 0], [0, 0.20], [0.55, 0], [0, -0.20], [0, 0]] },
  { id: 'yunlou', zh: '天市垣', en: 'Heavenly Market', lmId: 'yunlou', seed: 6.0, y: 0.40,
    shape: [[-0.62, 0.12], [-0.20, 0.34], [0.24, 0.30], [0.58, 0.06], [0.22, -0.22], [-0.28, -0.24]] },
  { id: 'baoguang', zh: '勾陈', en: 'Curved Array', lmId: 'baoguang', seed: 7.4, y: 0.32,
    shape: [[0, 0], [0.36, 0.30], [0.30, -0.34], [-0.34, -0.32], [-0.38, 0.28]] },
  { id: 'tongming', zh: '南斗', en: 'Southern Dipper', lmId: 'tongming', seed: 8.9, y: 0.26,
    // 南斗：斗口 + 斜柄
    shape: [[0, 0], [0.48, 0.18], [0.84, 0.34], [1.10, 0.52], [0.80, 0.72], [0.46, 0.56]] },
  { id: 'chaohui', zh: '玄武', en: 'Black Tortoise', lmId: 'chaohui', seed: 10.2, y: 0.22,
    // 龟身 + 蛇尾缠绕
    shape: [[-0.55, 0.22], [-0.18, 0.30], [0.16, 0.12], [0.34, -0.16], [0.12, -0.34], [-0.22, -0.22], [-0.48, -0.04]] },
];

function buildStarOfficials() {
  starGroup = new THREE.Group(); starGroup.visible = false; scene.add(starGroup);
  const starGeo = new THREE.SphereGeometry(22, 12, 12);
  STAR_OFFICIALS.forEach((off) => {
    off.stars = []; off.meshes = []; off.lines = []; off.halos = [];
    const sh = off.shape;
    off.n = sh.length;
    for (let j = 1; j < off.n; j++) off.lines.push([j - 1, j]);
    const ga = off.seed * 2.399963; const gy = off.y; const gr = Math.sqrt(1 - gy * gy);
    const c = new THREE.Vector3(Math.cos(ga) * gr, gy, Math.sin(ga) * gr).normalize();
    off.center = c.clone();
    const t1 = new THREE.Vector3().crossVectors(c, new THREE.Vector3(0, 1, 0)).normalize();
    const t2 = new THREE.Vector3().crossVectors(c, t1).normalize();
    const R = 0.155;   // 星图角半径（弧度）
    for (let j = 0; j < off.n; j++) {
      const dir = c.clone()
        .addScaledVector(t1, sh[j][0] * R)
        .addScaledVector(t2, sh[j][1] * R)
        .normalize();
      const pos = dir.multiplyScalar(1900);
      // 星点/光晕/连线一律 toneMapped:false，否则 ACES 会把青蓝去饱和成白色
      const m = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xfff3d0, fog: false, depthTest: false, toneMapped: false }));
      m.position.copy(pos); m.userData = { off, idx: j }; m.renderOrder = 999;
      starGroup.add(m);
      // 光晕：亮天空上也能看清星点
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: 0x9fe0ff, transparent: true, opacity: 0.75,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
      }));
      halo.scale.set(58, 58, 1); halo.position.copy(pos); halo.renderOrder = 998;
      starGroup.add(halo);
      off.halos.push(halo);
      off.meshes.push(m); off.stars.push(pos.clone());
    }
    // 连线用一串发光 Sprite 串成光带（Line 恒 1px、Cylinder 在远处太细，都看不见；
    // Sprite 走的是 billboard 路径，在本项目里已验证可靠）
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(off.n * 2 * 3), 3));
    const line = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0, fog: false, depthTest: false, toneMapped: false }));
    line.renderOrder = 999;
    line.frustumCulled = false;
    starGroup.add(line); off.line = line;
    // 每一段用若干发光点串起来
    off.segs = [];
    const DOTS = 13;
    for (let j = 0; j < off.lines.length; j++) {
      const dots = [];
      for (let k = 0; k < DOTS; k++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, color: 0x4fd0ff, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
        }));
        sp.scale.set(46, 46, 1);
        sp.renderOrder = 999;
        sp.visible = false;
        starGroup.add(sp);
        dots.push(sp);
      }
      off.segs.push(dots);
    }
  });
}
function starClick(mesh) {
  const off = mesh.userData.off, j = mesh.userData.idx;
  // 必须按连线顺序点：先点错不算数，星图要一笔画出来
  if (!starSel || starSel.off !== off) starSel = { off, idxs: [j] };
  else {
    const expect = starSel.idxs.length;      // 下一个该点的序号
    if (j === expect) starSel.idxs.push(j);
    else if (starSel.idxs.includes(j)) return; // 已点过，忽略
    else { starSel = { off, idxs: [j] }; }      // 点错则重画
  }
  off.meshes.forEach((mm, k) => { mm.material.color.set((starSel.off === off && (starSel.idxs.includes(k) || off.solved)) ? 0x4fd8ff : 0xfff3d0); });
  refreshStarLine(off);
  if (starSel.idxs.length === off.n && !off.solved) solveOfficial(off);
}
function enterStarMode() {
  if (!starGroup) return;
  starGroup.visible = true;
  starSel = null;
  starDim = 0.86;
  // 找到第一个还没点亮的星官
  starCurrent = STAR_OFFICIALS.findIndex((o) => !o.solved);
  if (starCurrent < 0) starCurrent = 0;
  refreshStarState();
  aimAtOfficial(starCurrent);
  toast(lang === 'zh' ? '抬头点星，连成一组星官图' : 'Look up and tap the stars to trace a constellation');
}
// 统一刷新星图状态：可见性、颜色、连线全部由这一处计算，每帧调用，杜绝状态不同步
function refreshStarState() {
  STAR_OFFICIALS.forEach((off, i) => {
    const isCur = (i === starCurrent);
    const sel = (starSel && starSel.off === off) ? starSel.idxs : [];
    const on = isCur || off.solved;
    off.meshes.forEach((m, k) => {
      m.visible = on;
      const lit = off.solved || sel.includes(k);
      m.material.color.set(lit ? 0x4fd8ff : 0xfff3d0);
    });
    off.halos.forEach((h) => {
      h.visible = on;
      h.material.color.set(off.solved ? 0x4fd8ff : 0xbfe0ff);
    });
    if (off.line) off.line.visible = on;
    refreshStarLine(off);
  });
}
// 把相机抬到空中并对准某个星官的中心
// 注意：OrbitControls 有 maxDistance / maxPolarAngle 约束，会把 target 拉回并压平仰角，
// 所以这里让相机自己「站到星官正对面」，target 取相机正前方远处，视线方向才不会被打乱。
function aimAtOfficial(i) {
  const off = STAR_OFFICIALS[i];
  if (!off || !off.center) return;
  const p = camera.position.clone();
  const c = off.center.clone().normalize();
  // 相机退到星官反方向 420 单位处，视线正对星官中心
  const to = p.clone().addScaledVector(c, -420);
  to.y = Math.max(to.y, 260);
  const tgt = to.clone().addScaledVector(c, 700);
  fly = {
    fromPos: p, toPos: to,
    fromTar: controls.target.clone(), toTar: tgt,
    t: 0, dur: 1.8,
  };
}
function refreshStarLine(off) {
  const arr = off.line.geometry.attributes.position.array;
  const on0 = off.solved || off.meshes[0].visible;
  let p = 0;
  off.lines.forEach(([a, b], k) => {
    const on = on0 && (off.solved || (starSel && starSel.off === off && starSel.idxs.includes(a) && starSel.idxs.includes(b)));
    const dots = off.segs && off.segs[k];
    if (on) {
      const A = off.stars[a], B = off.stars[b];
      arr[p++] = A.x; arr[p++] = A.y; arr[p++] = A.z;
      arr[p++] = B.x; arr[p++] = B.y; arr[p++] = B.z;
      if (dots) {
        for (let i = 0; i < dots.length; i++) {
          const t = (i + 0.5) / dots.length;
          dots[i].position.lerpVectors(A, B, t);
          dots[i].material.opacity = 0.9;
          dots[i].visible = true;
        }
      }
    } else if (dots) {
      dots.forEach((d) => { d.material.opacity = 0; d.visible = false; });
    }
  });
  off.line.geometry.setDrawRange(0, p / 3);
  off.line.geometry.attributes.position.needsUpdate = true;
  off.line.material.opacity = off.solved ? 0.9 : 0.9;
}
function solveOfficial(off) {
  const lm = LANDMARKS.find((l) => l.id === off.lmId);
  if (lm && !ADOPTED[lm.id]) lightBeacon(lm);
  off.solved = true; starSel = null;
  playChime([523, 659, 784, 1047]);
  toast((lang === 'zh' ? t('starSolvedZh') : t('starSolvedEn')) + (lang === 'zh' ? off.zh : off.en));
  refreshStarState();
  // 停一会儿让玩家看清连成的星图，再切到下一组
  clearTimeout(starNextTimer);
  starNextTimer = setTimeout(() => {
    const next = STAR_OFFICIALS.findIndex((o) => !o.solved);
    if (next >= 0) {
      starCurrent = next;
      refreshStarState();
      aimAtOfficial(next);
    } else {
      toast(lang === 'zh' ? '二十八宿已尽归其位，天庭重光' : 'All constellations are lit — the court shines again');
    }
    refreshGamePanel();
  }, 2800);
}
function lightBeacon(lm) {
  if (ADOPTED[lm.id]) return ADOPTED[lm.id];
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(14, 1.1, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0x7fd0ff, emissive: 0x2f7fa0, emissiveIntensity: 1.4, roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 4; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 90, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7fd0ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = 50; g.add(beam);
  const light = new THREE.PointLight(0x7fd0ff, 1.2, 300, 2); light.position.y = 20; g.add(light);
  g.add(makeGlowSprite(0x4fd8ff, 40, 40, 20));
  g.position.set(lm.pos[0], lm.pos[1] || 0, lm.pos[2]);
  scene.add(g); ADOPTED[lm.id] = g; return g;
}

/* ---------- 凤凰引路 ---------- */
function summonGuide() {
  if (phoenixGuide) return;
  let best = null, bd = Infinity;
  SLIP_DEFS.forEach((d) => {
    if (quest.taken[d.id]) return;
    const lm = LANDMARKS.find((l) => l.id === d.id); if (!lm) return;
    const dd = camera.position.distanceTo(new THREE.Vector3(lm.pos[0], lm.pos[1] + (lm.focusY || 20), lm.pos[2]));
    if (dd < bd) { bd = dd; best = lm; }
  });
  if (!best) { toast(lang === 'zh' ? t('guideNoneZh') : t('guideNoneEn')); return; }
  const ph = BEASTS[0];
  if (follow === ph) clearFollow();
  const start = ph.group.position.clone();
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
  const via = camera.position.clone().add(fwd.multiplyScalar(70)).add(new THREE.Vector3(0, 30, 0));
  const to = new THREE.Vector3(best.pos[0], (best.baseY || 0) + 60, best.pos[2]);
  phoenixGuide = { phase: 'lead', t: 0, dur: 2.6, start, via, to, lm: best, arrived: false, hover: 0 };
  toast((lang === 'zh' ? t('guideGoZh') : t('guideGoEn')) + (lang === 'zh' ? best.zh : best.en));
}
function updatePhoenixGuide(dt) {
  if (!phoenixGuide) return false;
  const ph = BEASTS[0]; const g = ph.group;
  phoenixGuide.t = Math.min(1, phoenixGuide.t + dt / phoenixGuide.dur);
  const tt = Math.min(phoenixGuide.t, 1);
  let pos;
  if (tt < 0.5) pos = phoenixGuide.start.clone().lerp(phoenixGuide.via, tt / 0.5);
  else {
    if (!phoenixGuide.arrived) { phoenixGuide.arrived = true; flyTo(phoenixGuide.lm); }
    pos = phoenixGuide.via.clone().lerp(phoenixGuide.to, (tt - 0.5) / 0.5);
  }
  pos.y += Math.sin(tt * Math.PI) * 46;
  g.position.copy(pos);
  g.lookAt(phoenixGuide.to);
  const time = clock.elapsedTime; const flap = Math.sin(time * 7) * 0.7 + 0.2;
  g.userData.lw.rotation.z = flap; g.userData.rw.rotation.z = -flap;
  if (tt >= 1) { phoenixGuide.hover += dt; if (phoenixGuide.hover > 2.6) { phoenixGuide = null; ph.u = Math.random(); } }
  return true;
}

/* ---------- 云海垂钓 ---------- */
// 钩子：入云处的浮标 + 一根斜插入云的钓竿，涟漪由云海着色器绘制
let fishingHook = null;
function castFish(worldPoint) {
  if (!cloudSeaMat) return false;
  const arr = cloudSeaMat.uniforms.uRipples.value;
  const now = cloudSeaMat.uniforms.uRippleTime.value;   // 累积时间，不会因掉帧而跳变
  let slot = -1, oldest = Infinity;
  for (let i = 0; i < arr.length; i++) { if (arr[i].z < 0) { slot = i; break; } if (arr[i].z < oldest) { oldest = arr[i].z; slot = i; } }
  if (slot < 0) slot = 0;
  arr[slot].set(worldPoint.x, worldPoint.z, now);
  playChime([392, 523, 659]);


  // 浮标：漂在云面上，伴随涟漪一起荡开
  if (!fishingHook) {
    const g = new THREE.Group();
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false }));
    buoy.position.y = 2.4; g.add(buoy);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.3, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.85, fog: false }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 1.2; g.add(ring);
    g.userData = { ring };
    scene.add(g); fishingHook = g;
  }
  fishingHook.position.set(worldPoint.x, 0, worldPoint.z);
  fishingHook.visible = true;

  const x = worldPoint.x, z = worldPoint.z;
  setTimeout(() => resolveCatch(x, z), 2600);
  return true;
}
function resolveCatch(x, z) {
  const rewards = [
    { zh: '星屑', en: 'Stardust' }, { zh: '旧玉', en: 'Old jade' }, { zh: '前朝器物', en: 'Ancient relic' },
    { zh: '云母', en: 'Mica' }, { zh: '仙露', en: 'Dew of immortals' }, { zh: '陨铁', en: 'Meteoric iron' },
  ];
  const r = rewards[Math.floor(Math.random() * rewards.length)];
  fishCount++;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xbfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sp.scale.set(24, 24, 1); sp.position.set(x, 4, z); sp.userData.born = clock.elapsedTime;
  scene.add(sp);
  fishingItems.push(sp);
  if (fishingHook) fishingHook.visible = false;
  toast((lang === 'zh' ? t('fishGotZh') : t('fishGotEn')) + (lang === 'zh' ? r.zh : r.en) + `（${fishCount}）`);
  playChime([880, 1175, 1568]);
  refreshGamePanel();
}

/* ---------- 月相门 ---------- */
const MOON_REF = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
const SYNODIC = 29.53058867;
function moonState() {
  const now = Date.now() / 86400000;
  let phase = ((now - MOON_REF) % SYNODIC + SYNODIC) % SYNODIC;
  const full = SYNODIC / 2;
  const dist = Math.min(Math.abs(phase - full), SYNODIC - Math.abs(phase - full));
  const isFull = dist < 3;
  const daysToFull = (full - phase + SYNODIC) % SYNODIC;
  const illum = (1 - Math.cos(2 * Math.PI * phase / SYNODIC)) / 2;
  return { phase, dist, isFull, daysToFull, illum };
}
/* ---------- 月相门：一幅横在云上的薄纱 ---------- */
// 桥不是管子，而是一匹悬在云海之上的绢纱：半透明、织纹流动、边缘泛荧光、时隐时现。
const MOON_SILK_VERT = `
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vNrm;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  vNrm = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const MOON_SILK_FRAG = `
uniform float uTime;
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vNrm;
void main(){
  vec3 V = normalize(cameraPosition - vWPos);
  float fres = pow(1.0 - abs(dot(normalize(vNrm), V)), 1.25);

  // 绢织纹理：经向细密、纬向稀疏，像极薄的绡
  float warp = cFbm(vec2(vUv.x * 46.0, vUv.y * 2.2) + vec2(uTime * 0.09, 0.0));
  float weft = cFbm(vec2(vUv.x * 7.0, vUv.y * 22.0) + vec2(0.0, uTime * 0.05));
  float weave = clamp(warp * 0.58 + weft * 0.42, 0.0, 1.0);
  // 织纹的疏密也影响不透明度：纱有厚薄
  float thin = smoothstep(0.18, 0.72, weave);

  // 纱的两边虚掉，像被风吹散
  float edge = pow(sin(clamp(vUv.y, 0.0, 1.0) * 3.14159265), 0.40);
  // 沿桥奔流的微光
  float flow = 0.5 + 0.5 * sin(vUv.x * 52.0 - uTime * 1.7);
  // 大尺度明灭 —— 若隐若现（谷底仍留一点，别整段消失）
  float breathe = 0.62 + 0.38 * sin(uTime * 0.42 + vUv.x * 4.5);
  // 绢纱的「子母经」：中央一道略厚的实芯，两侧各一道包边线
  float core = exp(-pow((vUv.y - 0.5) * 3.6, 2.0));
  float selv = exp(-pow((vUv.y - 0.5) * 22.0, 2.0));

  float a = edge * (0.10 + 0.50 * thin) * (0.48 + 0.52 * flow) * breathe;
  a += core * 0.48 * (0.60 + 0.40 * flow) * breathe;   // 实芯保证远看也有一条线
  a += selv * 0.42;                                      // 包边
  a *= smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
  a *= uOpacity;

  vec3 col = mix(uColA, uColB, clamp(thin * 0.8 + fres * 0.5, 0.0, 1.0));
  // 实芯与包边用深蓝实色，别被薄处混成白 —— 白云背景上才拉得开
  col = mix(col, uColA * 1.15, clamp(core * 0.85 + selv * 0.8, 0.0, 1.0));
  col += vec3(0.70, 0.92, 1.0) * pow(fres, 1.2) * 1.30;   // 掠射角度泛荧光
  col += vec3(0.38, 0.80, 1.0) * flow * 0.34;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.88));
}`;

// 沿曲线铺一条带状「纱」：两排顶点，边缘微微下垂并飘动
function makeSilkRibbon(curve, width, opt) {
  const o = opt || {};
  const N = o.seg || 180;
  const W = width;
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    let side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0));
    if (side.lengthSq() < 0.01) side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(1, 0, 0));
    side.normalize();
    const flut = (o.flutter === undefined ? 1 : o.flutter) * (Math.sin(t * 21.0) * 2.0 + Math.sin(t * 7.7 + 1.9) * 3.4);
    const w = W * (0.80 + 0.20 * Math.sin(t * 10.0 + 0.8));
    for (let j = 0; j <= 1; j++) {
      const s = j === 0 ? -1 : 1;
      const q = p.clone().addScaledVector(side, s * w * 0.5);
      q.y += (j === 0 ? -1 : 1) * (o.drape === undefined ? 5.0 : o.drape) + flut * (j === 0 ? 0.5 : 1.0);
      pos.push(q.x, q.y, q.z);
      uvs.push(t, j);
    }
  }
  for (let i = 0; i < N; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// 从纱上垂下的一缕丝
function makeSilkDrape(curve, t, len, width, seed) {
  const p = curve.getPointAt(t);
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const s = i / 16;
    const q = p.clone();
    q.y -= s * len;
    // 越往下摆得越开，末端散成缕
    q.x += Math.sin(s * 2.4 + seed) * s * 14.0;
    q.z += Math.cos(s * 2.1 + seed * 1.7) * s * 14.0;
    pts.push(q);
  }
  return makeSilkRibbon(new THREE.CatmullRomCurve3(pts), width, { seg: 56, flutter: 0.45, drape: 0.8 });
}

function buildMoonBridge() {
  const start = new THREE.Vector3(0, 8, 470);
  const end = new THREE.Vector3(-580, 180, -380);
  // 拱不要太高，否则从侧面看像一根立柱；只要微微上扬就够
  const mid = start.clone().lerp(end, 0.5); mid.y += 95;
  const q1 = start.clone().lerp(end, 0.28); q1.y += 62;
  const q2 = start.clone().lerp(end, 0.72); q2.y += 62;
  const curve = new THREE.CatmullRomCurve3([start, q1, mid, q2, end]);

  const grp = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    vertexShader: MOON_SILK_VERT,
    fragmentShader: `#define OCT 3\n${CLOUD_GLSL}\n${MOON_SILK_FRAG}`,
    uniforms: {
      uTime: { value: 0 },
      uColA: { value: new THREE.Color(0x2234c4) },
      uColB: { value: new THREE.Color(0x7ce0ff) },
      uOpacity: { value: 1 },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    toneMapped: false,
  });
  const silk = new THREE.Mesh(makeSilkRibbon(curve, 62, { seg: 220, flutter: 1.0, drape: 9.0 }), mat);
  grp.add(silk);

  // 从纱边垂下的丝缕：越垂越细、末端散开
  for (let i = 0; i < 11; i++) {
    const t = 0.06 + (i / 10) * 0.88;
    const drape = new THREE.Mesh(makeSilkDrape(curve, t, 26 + (i % 4) * 15, 13.0, i * 1.7), mat);
    grp.add(drape);
  }

  // 纱上的露珠：沿桥排一串小亮点，读作「可踏足」
  const beadGeo = new THREE.SphereGeometry(3.4, 10, 8);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xe6f2ff, fog: false, toneMapped: false });
  const beads = new THREE.InstancedMesh(beadGeo, beadMat, 30);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < 30; i++) {
    const p = curve.getPointAt(i / 29);
    mtx.makeTranslation(p.x, p.y + 2.5, p.z);
    beads.setMatrixAt(i, mtx);
  }
  beads.instanceMatrix.needsUpdate = true;
  grp.add(beads);

  // 桥周围飘散的萤火
  const fg = new THREE.BufferGeometry();
  const fp = [];
  for (let i = 0; i < 110; i++) {
    const p = curve.getPointAt(Math.random());
    p.x += (Math.random() - 0.5) * 78;
    p.y += (Math.random() - 0.5) * 52 + 14;
    p.z += (Math.random() - 0.5) * 78;
    fp.push(p.x, p.y, p.z);
  }
  fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const fireflies = new THREE.Points(fg, new THREE.PointsMaterial({
    size: 3.0, sizeAttenuation: true, color: 0xd8f0ff, map: glowTex,
    transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false,
  }));
  grp.add(fireflies);

  const lp = new THREE.PointLight(0x9fb4ff, 1.1, 700, 2); lp.position.copy(mid); grp.add(lp);

  grp.userData = { mat, beads, fireflies, curve };
  grp.visible = false;
  scene.add(grp);
  moonBridge = grp;
}
function updateMoonInfo() {
  const el = document.getElementById('moon-info'); if (!el) return;
  const m = moonState();
  const name = m.isFull ? (lang === 'zh' ? '满月' : 'Full moon') : (lang === 'zh'
    ? (m.daysToFull < 1 ? '将满' : `距满月 ${m.daysToFull.toFixed(1)} 天`) : (m.daysToFull < 1 ? 'Waxing' : `${m.daysToFull.toFixed(1)}d to full`));
  el.textContent = (lang === 'zh' ? '月相 · ' : 'Moon · ') + name + (m.isFull ? (lang === 'zh' ? ' · 广寒可往' : ' · gate open') : '');
}

/* ---------- 御道登阶 ---------- */
function buildQuizSteps() {
  const Z = [380, 320, 250, 185, 130];
  const baseY = (LANDMARKS.find((l) => l.id === 'lingxiao') || {}).baseY || 4;
  const g = new THREE.Group();
  Z.forEach((z, i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe9c46a, emissive: 0x6a4a00, emissiveIntensity: 0.6, roughness: 0.5 }));
    m.position.set(0, baseY + 5, z); g.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.4, 8, 24), new THREE.MeshBasicMaterial({ color: 0xe9c46a }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(m.position); ring.position.y += 6.5; g.add(ring);
    quizStepMarkers.push({ z, idx: i, mesh: m, ring });
  });
  scene.add(g);
}
function openQuiz(i) {
  quizOpen = true; currentQuiz = { i };
  const lm = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
  const others = LANDMARKS.filter((l) => l !== lm).sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [lm, ...others].sort(() => Math.random() - 0.5);
  const qp = document.getElementById('quiz-panel'); if (!qp) return;
  document.getElementById('quiz-q').innerHTML = lang === 'zh'
    ? `「${lm.descZh.slice(0, 40)}……」<br><b>此为何处？</b>`
    : `"${lm.descEn.slice(0, 110)}..."<br><b>Which place is this?</b>`;
  const box = document.getElementById('quiz-opts'); box.innerHTML = '';
  opts.forEach((o) => {
    const b = document.createElement('button'); b.className = 'quiz-opt';
    b.textContent = lang === 'zh' ? o.zh : o.en;
    b.addEventListener('click', () => answerQuiz(o.id));
    box.appendChild(b);
  });
  currentQuiz.answer = lm.id;
  qp.classList.add('open');
}
function answerQuiz(id) {
  if (!currentQuiz) return;
  if (id === currentQuiz.answer) {
    QUIZ_DONE[currentQuiz.i] = true;
    document.getElementById('quiz-panel').classList.remove('open');
    quizOpen = false; playChime([660, 880]);
    toast(lang === 'zh' ? t('quizRightZh') : t('quizRightEn'));
    currentQuiz = null;
  } else {
    toast(lang === 'zh' ? t('quizWrongZh') : t('quizWrongEn'));
    openQuiz(currentQuiz.i);
  }
}

/* ---------- 镜池水中天 ---------- */
function ensureDiveDome() {
  if (diveDome) return;
  diveDome = new THREE.Mesh(new THREE.SphereGeometry(430, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x0c4250, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false, fog: false }));
  diveDome.visible = false; scene.add(diveDome);
}
function buildMirrorRealm() {
  mirrorRealm = new THREE.Group(); mirrorRealm.visible = false;
  const cx = 360, cz = 260;
  const pav = buildPalace({ width: 60, height: 18, tiers: 2, roof: 0x2f6f8a, accent: 0x9fd8ff, glow: 0x9fd8ff });
  pav.position.set(cx, -34, cz); pav.rotation.x = Math.PI; pav.scale.setScalar(0.92);
  pav.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.45; } });
  mirrorRealm.add(pav);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, r = 70 + Math.random() * 30;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 64, 8),
      new THREE.MeshBasicMaterial({ color: 0x39e0c0, transparent: true, opacity: 0.32, depthWrite: false }));
    col.position.set(cx + Math.cos(a) * r, -28, cz + Math.sin(a) * r); mirrorRealm.add(col);
  }
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 92;
    const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    orb.scale.set(11, 11, 1); orb.position.set(cx + Math.cos(a) * r, -8 - Math.random() * 30, cz + Math.sin(a) * r);
    mirrorRealm.add(orb);
  }
  scene.add(mirrorRealm);
}
function diveToggle() {
  if (!diving) {
    if (!nearPool()) { toast(lang === 'zh' ? t('diveNearZh') : t('diveNearEn')); return; }
    if (!poolRef) { toast(lang === 'zh' ? t('diveNearZh') : t('diveNearEn')); return; }
    diving = true;
    ensureDiveDome();
    if (!mirrorRealm) buildMirrorRealm();
    mirrorRealm.visible = true;
    diveDome.visible = true;
    // 记住入水前的相机状态，浮出水面时复位
    diveState = {
      cam: camera.position.clone(),
      tar: controls.target.clone(),
      from: clock.elapsedTime,
    };
    applyDiveLook(true);
    toast(lang === 'zh' ? t('diveInZh') : t('diveInEn'));
  } else {
    diving = false;
    if (mirrorRealm) mirrorRealm.visible = false;
    if (diveDome) diveDome.visible = false;
    applyDiveLook(false);
    if (diveState) {
      fly = {
        fromPos: camera.position.clone(), toPos: diveState.cam.clone(),
        fromTar: controls.target.clone(), toTar: diveState.tar.clone(),
        t: 0, dur: 2.0,
      };
      diveState = null;
    }
    toast(lang === 'zh' ? t('diveOutZh') : t('diveOutEn'));
  }
  refreshGamePanel();
}
// 入水时把雾色、雾浓度、主光与色调都换成「水下」的一套
function applyDiveLook(on) {
  if (!scene.fog) return;
  if (on) {
    scene.fog.color.setRGB(0.05, 0.28, 0.30);
    scene.fog.density = 0.0075;
    if (hemi) hemi.intensity = 0.22;
    if (ambient) ambient.intensity = 0.18;
    if (moonLight) moonLight.intensity = 0.25;
    renderer.toneMappingExposure = 0.72;
    if (poolRef && poolRef.water) {
      poolRef.water.material.color.setHex(0x0a4a4a);
      poolRef.water.material.opacity = 0.34;
    }
    // 水下补一盏青色点光，让倒悬宫殿与光柱亮起来
    if (!diveLight) {
      diveLight = new THREE.PointLight(0x59e0d8, 1.6, 520, 2);
      scene.add(diveLight);
    }
    const c = new THREE.Vector3();
    if (poolRef) poolRef.root.getWorldPosition(c);
    diveLight.position.set(c.x, (poolRef ? poolRef.waterY : 6) - 12, c.z);
    diveLight.visible = true;
  } else {
    scene.fog.density = 0.00026;
    if (hemi) hemi.intensity = 0.80 * (1 - nightAmount * 0.55);
    if (ambient) ambient.intensity = 0.40 + nightAmount * 0.16;
    renderer.toneMappingExposure = 0.95 - nightAmount * 0.22;
    if (poolRef && poolRef.water) {
      poolRef.water.material.color.setHex(0x127a52);
      poolRef.water.material.opacity = 0.52;
    }
    if (diveLight) diveLight.visible = false;
  }
  // 云层跟随雾色
  if (scene.fog) {
    const fc = scene.fog.color;
    for (let i = 0; i < cloudLayers.length; i++) {
      const u = cloudLayers[i].uniforms;
      u.uFog.value.set(fc.r, fc.g, fc.b);
    }
  }
}
// 入水期间：相机缓缓沉到水面之下，注视瑶池水榭
// 注意：低帧率下 clock.getDelta() 会跳变，不能用「时间窗口内才插值」的写法，
// 否则会跨过窗口只插值一次 —— 用饱和进度，任何帧率都能走完。
function updateDiveCamera(dt) {
  if (!diving || !poolRef || !diveState) return;
  const c = new THREE.Vector3();
  poolRef.root.getWorldPosition(c);
  const el = clock.elapsedTime - diveState.from;
  const k = Math.min(1, el / 1.6);
  const e = k * k * (3 - 2 * k);
  const target = new THREE.Vector3(c.x, poolRef.waterY - 9, c.z + 26);
  camera.position.lerpVectors(diveState.cam, target, e);
  const look = new THREE.Vector3(c.x, poolRef.waterY - 3, c.z);
  controls.target.lerpVectors(diveState.tar, look, Math.min(1, k * 1.3));
}

/* ---------- 每帧驱动 ---------- */
function updateGames(dt, time) {
  // 涟漪用累积时间推进：掉帧时也不会让涟漪瞬间过期
  if (cloudSeaMat) cloudSeaMat.uniforms.uRippleTime.value += dt;
  if (moonBridge) {
    const ms = moonState();
    moonBridge.visible = ms.isFull;
    if (ms.isFull) {
      const u = moonBridge.userData;
      if (u.mat) u.mat.uniforms.uTime.value = time;
      if (u.fireflies) {
        // 萤火明灭 + 整体轻浮
        u.fireflies.material.opacity = 0.55 + 0.35 * Math.sin(time * 1.3);
        u.fireflies.position.y = Math.sin(time * 0.35) * 3.2;
      }
    }
  }
  gamesTicker += dt; if (gamesTicker > 0.5) { gamesTicker = 0; updateMoonInfo(); }
  if (!quizOpen && !diving) {
    for (let i = 0; i < quizStepMarkers.length; i++) {
      if (QUIZ_DONE[i]) continue;
      if (camera.position.distanceTo(quizStepMarkers[i].mesh.position) < 85) { openQuiz(i); break; }
    }
  }
  for (let i = fishingItems.length - 1; i >= 0; i--) {
    const sp = fishingItems[i]; const age = time - sp.userData.born;
    sp.position.y = 4 + age * 14; sp.material.opacity = Math.max(0, 1 - age / 2.2);
    if (age > 2.2) { scene.remove(sp); fishingItems.splice(i, 1); }
  }
  if (fishingHook && fishingHook.visible) {
    fishingHook.position.y = Math.sin(time * 2.2) * 0.7;
    fishingHook.userData.ring.scale.setScalar(1 + Math.sin(time * 3.4) * 0.16);
  }
  if (diveDome) diveDome.position.copy(camera.position);
  updateDiveCamera(dt);
  // 观星模式：星官固定不转（转了就没法点），只靠相机对准
  if (gameMode === 'star' && starGroup && starGroup.visible) {
    starGroup.rotation.y = 0;
    refreshStarState();
    // 下一颗该点的星轻轻脉动，给玩家一个「从这儿开始」的提示
    const off = STAR_OFFICIALS[starCurrent];
    if (off && !off.solved) {
      const nextIdx = starSel && starSel.off === off ? starSel.idxs.length : 0;
      const m = off.meshes[nextIdx];
      if (m) {
        const s = 1 + Math.sin(time * 4.2) * 0.22;
        m.scale.setScalar(s);
        m.material.color.set(0x4fd8ff);
      }
    }
  }
}


/* ---- 每帧：悬浮动画 / 触发提示 / 灯影摇曳 ---- */
function updateQuest(dt, time) {
  for (const s of SLIPS) {
    if (s.fade >= 0) {
      s.fade += dt;
      const k = Math.min(1, s.fade / 0.85);
      s.mesh.position.y = s.base.y + k * 26;
      s.mesh.scale.setScalar(Math.max(0.001, 1 - k * 0.92));
      s.mesh.rotation.y += dt * 7;
      if (k >= 1 && s.mesh.parent) scene.remove(s.mesh);
      continue;
    }
    s.mesh.position.y = s.base.y + Math.sin(time * 1.4 + s.base.x * 0.1) * 1.2;
    s.mesh.rotation.y += dt * 0.9;
  }

  for (const l of LANTERNS) {
    l.position.y = l.userData.baseY + Math.sin(time * 1.6 + l.userData.phase) * 0.22;
    l.rotation.y += dt * 0.16;
    l.rotation.z = Math.sin(time * 1.1 + l.userData.phase) * 0.05;
  }

  // 触发提示：靠近玉简 → 提示拾取；在瑶池且灯未放齐 → 提示放灯
  let best = null, bestD = Infinity;
  for (const s of SLIPS) {
    if (s.taken || s.fade >= 0) continue;
    const d = camera.position.distanceTo(s.base);
    if (d < s.def.trigger && d < bestD) { bestD = d; best = s; }
  }
  activeSlip = best;
  let msg = '';
  if (best) msg = isMobile ? t('questPickTap') : t('questPickKey');
  else if (poolRef && quest.lanterns < 3 && !quest.taken.yaochi && nearPool()) {
    msg = `${t('questLantern')} (${quest.lanterns}/3)`;
  }
  setPrompt(msg);
}

function nearPool() {
  if (!poolCenter) {
    const lm = LANDMARKS.find((l) => l.id === 'yaochi');
    if (!lm) return false;
    poolCenter = new THREE.Vector3(lm.pos[0], 0, lm.pos[2]);
  }
  return camera.position.distanceTo(poolCenter) < 270;
}

function setPrompt(msg) {
  const el = document.getElementById('prompt');
  if (!el) return;
  if (msg) {
    if (el.dataset.msg !== msg) { el.innerHTML = msg; el.dataset.msg = msg; }
    el.classList.add('show');
  } else {
    el.dataset.msg = '';
    el.classList.remove('show');
  }
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ---- 仙箓册 ---- */
function refreshQuestUI() {
  const n = takenCount(), total = SLIP_DEFS.length;
  const cnt = document.getElementById('quest-count');
  if (cnt) cnt.textContent = lang === 'zh' ? `仙箓 ${n}/${total}` : `Slips ${n}/${total}`;
  const btn = document.getElementById('quest-btn');
  if (btn) btn.classList.toggle('full', n >= total);
  const sub = document.getElementById('qp-sub');
  if (sub) sub.textContent = t('questSub');
  const banner = document.getElementById('qp-banner');
  if (banner) banner.textContent = t('questBanner');
  const panel = document.getElementById('quest-panel');
  if (panel) panel.classList.toggle('done', n >= total);

  const list = document.getElementById('slip-list');
  if (!list) return;
  list.innerHTML = '';
  SLIP_DEFS.forEach((d) => {
    const lm = LANDMARKS.find((l) => l.id === d.id);
    const on = !!quest.taken[d.id];
    const row = document.createElement('div');
    row.className = 'slip-row ' + (on ? 'on' : 'off');
    const name = lm ? (lang === 'zh' ? lm.zh : lm.en) : d.id;
    let tag = on ? t('questDone') : t('questReady');
    if (!on && d.needLanterns && quest.lanterns < d.needLanterns) {
      tag = lang === 'zh' ? `河灯 ${quest.lanterns}/${d.needLanterns}` : `Lanterns ${quest.lanterns}/${d.needLanterns}`;
    }
    const desc = on
      ? (lm ? (lang === 'zh' ? lm.descZh : lm.descEn) : '')
      : t('questLocked');
    row.innerHTML = '<div class="slip-ico"></div><div class="slip-main">'
      + `<div class="slip-name">${name}<span class="slip-tag">${tag}</span></div>`
      + `<div class="slip-desc">${desc}</div></div>`;
    list.appendChild(row);
  });
}
function toggleQuestPanel(force) {
  const p = document.getElementById('quest-panel');
  if (!p) return;
  if (force === true) p.classList.add('open');
  else if (force === false) p.classList.remove('open');
  else p.classList.toggle('open');
}
function onKeyDown(e) {
  if (e.key === 'e' || e.key === 'E') {
    if (activeSlip && collectSlip(activeSlip)) e.preventDefault();
  } else if (e.key === 'f' || e.key === 'F') {
    diveToggle();
  } else if (e.key === 'Escape') {
    toggleQuestPanel(false);
    if (quizOpen && currentQuiz) { document.getElementById('quiz-panel').classList.remove('open'); quizOpen = false; currentQuiz = null; }
  }
}

/* ---------------------------- UI -------------------------------------- */
const GAME_ITEMS = [
  { id: 'guide', ico: '凰', key: 'gameGuide', subZh: '凤凰引路至最近玉简', subEn: 'The phoenix leads you to the nearest slip' },
  { id: 'star', ico: '星', key: 'gameStar', subZh: '连成星官，点亮空殿', subEn: 'Link the stars to light empty halls' },
  { id: 'fish', ico: '钓', key: 'gameFish', subZh: '抛钩入云，钓取星屑', subEn: 'Cast into the clouds and haul stardust' },
  { id: 'dive', ico: '镜', key: 'gameDive', subZh: '潜入瑶池，见水中天', subEn: 'Dive the pool into the mirrored heaven' },
  { id: 'moon', ico: '月', key: 'gameMoon', subZh: '满月夜，月桥通往广寒', subEn: 'On full-moon nights a bridge to the Cold Palace' },
];
function buildGamePanel() {
  const list = document.getElementById('game-list');
  if (!list) return;
  list.innerHTML = '';
  GAME_ITEMS.forEach((g) => {
    const b = document.createElement('button');
    b.className = 'game-item';
    b.dataset.gid = g.id;
    b.innerHTML = `<span class="gi-ico">${g.ico}</span>
      <span class="gi-txt">${t(g.key)}<span class="gi-sub">${lang === 'zh' ? g.subZh : g.subEn}</span></span>
      <span class="gi-tag"></span>`;
    b.addEventListener('click', () => onGameItem(g.id));
    list.appendChild(b);
  });
  refreshGamePanel();
}
function refreshGamePanel() {
  const list = document.getElementById('game-list');
  if (!list) return;
  list.querySelectorAll('.game-item').forEach((el) => {
    const id = el.dataset.gid;
    const on = (id === 'star' && gameMode === 'star') || (id === 'fish' && gameMode === 'fish') || (id === 'dive' && diving);
    el.classList.toggle('on', on);
    const tag = el.querySelector('.gi-tag');
    if (!tag) return;
    if (id === 'star') {
      const solved = STAR_OFFICIALS.filter((o) => o.solved).length;
      tag.textContent = `${solved}/${STAR_OFFICIALS.length}`;
    } else if (id === 'fish') tag.textContent = `${fishCount}`;
    else if (id === 'dive') tag.textContent = diving ? (lang === 'zh' ? '水中' : 'in') : '';
    else if (id === 'guide') tag.textContent = phoenixGuide ? '✦' : '';
    else if (id === 'moon') { const m = moonState(); tag.textContent = m.isFull ? (lang === 'zh' ? '开' : 'open') : ''; }
  });
}
function toggleGamePanel(force) {
  const p = document.getElementById('game-panel');
  const b = document.getElementById('game-btn');
  if (!p) return;
  const open = force === undefined ? !p.classList.contains('open') : force;
  p.classList.toggle('open', open);
  if (b) b.classList.toggle('on', open);
  if (open) buildGamePanel();
}
function onGameItem(id) {
  audioCtx(); // 解锁音频上下文
  if (id === 'guide') { summonGuide(); refreshGamePanel(); return; }
  if (id === 'dive') { diveToggle(); refreshGamePanel(); return; }
  if (id === 'moon') { toggleGamePanel(false); flyTo(LANDMARKS.find((l) => l.id === 'guanghan')); toast(updateMoonText()); return; }
  // star / fish 为互斥模式
  const next = (gameMode === id) ? null : id;
  gameMode = next;
  if (starGroup) starGroup.visible = (gameMode === 'star');
  if (gameMode !== 'star') {
    starDim = 0;
    // 已连成的星官留在天上，作为「点亮星宿」的成果
    const anySolved = STAR_OFFICIALS.some((o) => o.solved);
    if (starGroup) starGroup.visible = anySolved;
    if (anySolved) refreshStarState();
  }
  if (gameMode === 'star') {
    enterStarMode();
  } else if (gameMode === 'fish') {
    toast(lang === 'zh' ? '对准云海点击，抛钩垂钓' : 'Aim at the cloud sea and click to cast');
  }
  refreshGamePanel();
}
function updateMoonText() {
  const m = moonState();
  const name = m.isFull ? (lang === 'zh' ? '满月 · 广寒可往' : 'Full moon · the Cold Palace is open')
    : (lang === 'zh' ? `距满月还有 ${m.daysToFull.toFixed(1)} 天` : `${m.daysToFull.toFixed(1)} days to the full moon`);
  return name;
}

function buildLandmarkPanel() {
  const list = document.getElementById('landmark-list');
  list.innerHTML = '';
  LANDMARKS.forEach((lm) => {
    const b = document.createElement('button');
    b.className = 'lm-btn';
    b.innerHTML = `<span class="dot" style="color:#${new THREE.Color(lm.glow || 0xffd27a).getHexString()}"></span>
      <span><span class="lm-zh">${lm.zh}</span><br><span class="lm-en">${lm.en}</span></span>`;
    b.addEventListener('click', () => { flyTo(lm); closePanelMobile(); });
    list.appendChild(b);
  });
}

function buildBeastPanel() {
  const list = document.getElementById('beast-list');
  if (!list) return;
  list.innerHTML = '';
  BEASTS.forEach((b) => {
    const row = document.createElement('div'); row.className = 'beast-row';
    const name = document.createElement('button'); name.className = 'beast-name';
    name.innerHTML = `${b.zh} <span style="opacity:.6;font-size:11px">${b.en}</span>`;
    name.addEventListener('click', () => { setFollow(b); closeBeastPanelMobile(); });
    const eye = document.createElement('button'); eye.className = 'beast-eye';
    const vis = b.group ? b.group.visible : true;
    eye.textContent = vis ? t('hide') : t('show');
    eye.classList.toggle('off', !vis);
    eye.addEventListener('click', () => {
      b.group.visible = !b.group.visible;
      eye.textContent = b.group.visible ? t('hide') : t('show');
      eye.classList.toggle('off', !b.group.visible);
      if (!b.group.visible && follow === b) clearFollow();
    });
    const fol = document.createElement('button'); fol.className = 'beast-follow';
    fol.textContent = t('follow');
    fol.addEventListener('click', () => { setFollow(b); closeBeastPanelMobile(); });
    b._eyeBtn = eye; b._followBtn = fol;
    row.appendChild(name); row.appendChild(eye); row.appendChild(fol);
    list.appendChild(row);
  });
  refreshBeastButtons();
}
function refreshBeastButtons() {
  BEASTS.forEach((b) => {
    if (b._followBtn) {
      const on = follow === b;
      b._followBtn.textContent = on ? t('following') : t('follow');
      b._followBtn.classList.toggle('active', on);
    }
  });
}
function closeBeastPanelMobile() { if (isMobile) document.getElementById('beast-panel').classList.remove('open'); }
function toggleBeastPanel() { document.getElementById('beast-panel').classList.toggle('open'); }

function speak(text) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    u.rate = lang === 'zh' ? 0.95 : 1.0;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((vv) => vv.lang && vv.lang.toLowerCase().startsWith(lang === 'zh' ? 'zh' : 'en'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech unsupported — ignore */ }
}

function setFollow(b) {
  if (touring) toggleTour();
  if (fly) fly = null;
  if (follow === b) { clearFollow(); return; }
  follow = b;
  followPrev.copy(b.group.position);
  showInfo(b);
  refreshBeastButtons();
}
function clearFollow() { follow = null; refreshBeastButtons(); }

function findRef(obj) {
  let o = obj;
  while (o) {
    if (o.userData && o.userData.landmark) return { type: 'landmark', ref: o.userData.landmark };
    if (o.userData && o.userData.beast) return { type: 'beast', ref: o.userData.beast };
    o = o.parent;
  }
  return null;
}
function findSlip(obj) {
  let o = obj;
  while (o) {
    if (o.userData && o.userData.slipId) return SLIPS.find((s) => s.id === o.userData.slipId && !s.taken);
    o = o.parent;
  }
  return null;
}
function onPointerDown(e) { downX = e.clientX; downY = e.clientY; downT = performance.now(); }
function onPointerUp(e) {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved > 6 || performance.now() - downT > 400) return; // it was an orbit/drag, not a tap
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  // 0) 观星模式：点星连接星官（用屏幕投影距离判定，比 raycast 命中球体更宽容）
  if (gameMode === 'star' && starGroup && starGroup.visible) {
    let best = null, bd = 46;   // 屏幕像素阈值
    for (const off of STAR_OFFICIALS) {
      for (const mm of off.meshes) {
        const v = mm.position.clone().add(starGroup.position).project(camera);
        if (v.z > 1) continue;
        const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
        const d = Math.hypot(sx - e.clientX, sy - e.clientY);
        if (d < bd) { bd = d; best = mm; }
      }
    }
    if (best) { starClick(best); return; }
  }
  // 0.5) 垂钓模式：点云海抛钩
  if (gameMode === 'fish' && cloudSeaMesh) {
    const sh = raycaster.intersectObject(cloudSeaMesh, false);
    if (sh.length) { if (castFish(sh[0].point)) return; }
  }

  // 1) 玉简优先：点中就收下
  const liveSlips = SLIPS.filter((s) => !s.taken && s.fade < 0);
  if (liveSlips.length) {
    const sh = raycaster.intersectObjects(liveSlips.map((s) => s.mesh), true);
    if (sh.length) {
      const s = findSlip(sh[0].object);
      if (s && collectSlip(s)) return;
    }
  }

  // 2) 瑶池水面：灯未放齐时，点水面放河灯
  if (poolRef && quest.lanterns < 3 && nearPool()) {
    const wh = raycaster.intersectObject(poolRef.water, false);
    if (wh.length) { if (placeLantern(wh[0].point)) return; }
  }

  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    const ref = findRef(h.object);
    if (ref) {
      if (ref.type === 'landmark') { flyTo(ref.ref); speak(lang === 'zh' ? ref.ref.descZh : ref.ref.descEn); }
      else if (ref.type === 'beast') { setFollow(ref.ref); }
      break;
    }
  }
}

function flyTo(lm) {
  if (touring) toggleTour(); // stop tour when user picks manually
  clearFollow();
  const target = new THREE.Vector3(lm.pos[0], lm.pos[1] + (lm.focusY || 24), lm.pos[2]);
  const dist = lm.focusDist || 140;
  const dir = new THREE.Vector3(0.55, 0.45, 1).normalize();
  const camPos = target.clone().add(dir.multiplyScalar(dist));
  fly = { fromPos: camera.position.clone(), toPos: camPos, fromTar: controls.target.clone(), toTar: target, t: 0, dur: 1.8 };
  currentLandmark = lm;
  showInfo(lm);
}

function showInfo(lm) {
  const card = document.getElementById('info-card');
  const name = document.getElementById('info-name');
  const desc = document.getElementById('info-desc');
  name.innerHTML = `${lm.zh}<span class="en">${lm.en}</span>`;
  desc.textContent = lang === 'zh' ? lm.descZh : lm.descEn;
  card.classList.remove('hidden');
}
function hideInfo() { document.getElementById('info-card').classList.add('hidden'); }

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.getAttribute('data-i18n');
    if (k && I18N[lang][k] !== undefined) el.textContent = I18N[lang][k];
  });
  document.getElementById('lang-btn').textContent = lang === 'zh' ? 'EN' : '中';
  const tourBtn = document.getElementById('tour-btn');
  tourBtn.textContent = touring ? t('tourStop') : t('tour');
  const hint = document.getElementById('hint');
  hint.textContent = t('hint');
  if (currentLandmark) showInfo(currentLandmark);
  if (BEASTS.length && BEASTS[0].group) buildBeastPanel();
  refreshQuestUI();
  buildGamePanel();
  updateMoonInfo();
}

function toggleTour() {
  touring = !touring;
  const btn = document.getElementById('tour-btn');
  btn.textContent = touring ? t('tourStop') : t('tour');
  btn.classList.toggle('active', touring);
  if (touring) { tourTimer = 0; tourIndex = 0; flyTo(LANDMARKS[0]); }
  else { if (fly) fly = null; }
}

function toggleDayNight() {
  dayNight.auto = !dayNight.auto;
  document.getElementById('daynight-btn').classList.toggle('active', dayNight.auto);
}
function toggleMeteor() {
  meteorEnabled = !meteorEnabled;
  document.getElementById('meteor-btn').classList.toggle('active', meteorEnabled);
}
function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  document.getElementById('voice-btn').classList.toggle('active', voiceEnabled);
  if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

function resetView() {
  if (touring) toggleTour();
  clearFollow();
  fly = { fromPos: camera.position.clone(), toPos: DEFAULT_CAM.clone(), fromTar: controls.target.clone(), toTar: DEFAULT_TAR.clone(), t: 0, dur: 1.4 };
  currentLandmark = null; hideInfo();
}

function closePanelMobile() {
  if (isMobile) document.getElementById('panel').classList.remove('open');
}

/* ------------------------- Image-based lighting ------------------------- */
// A tiny procedural sky env so metals (gold / bronze) reflect a real sky
// instead of going black — this is what makes the roofs look 金碧辉煌.
function buildEnvironment() {
  try {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0.00, '#fbeec4');   // warm zenith
    sky.addColorStop(0.30, '#cfe0f7');
    sky.addColorStop(0.50, '#fff6e4');   // bright horizon
    sky.addColorStop(0.58, '#a8927c');   // ground haze
    sky.addColorStop(1.00, '#241d2a');
    g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
    // warm sun disc for a strong specular highlight
    const rg = g.createRadialGradient(150, 62, 0, 150, 62, 110);
    rg.addColorStop(0, 'rgba(255,250,226,1)');
    rg.addColorStop(0.35, 'rgba(255,232,170,0.55)');
    rg.addColorStop(1, 'rgba(255,232,170,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 512, 256);
    // a couple of bright cloud bands = soft studio-ish reflections
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.07})`;
      g.beginPath(); g.ellipse(Math.random() * 512, 90 + Math.random() * 90, 90 + Math.random() * 90, 12 + Math.random() * 12, 0, 0, Math.PI * 2); g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromEquirectangular(tex).texture;
    tex.dispose(); pmrem.dispose();
  } catch (e) {
    console.warn('[Heaven] environment map unavailable', e);
  }
}

/* ---------------------------- Filmic bloom ----------------------------- */
async function setupBloom() {
  // 低配/软件渲染环境可用 ?nobloom=1 跳过后处理，直接渲染以保帧率
  if (location.search.indexOf('nobloom') >= 0) return;
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('./vendor/postprocessing/EffectComposer.js'),
      import('./vendor/postprocessing/RenderPass.js'),
      import('./vendor/postprocessing/UnrealBloomPass.js'),
      import('./vendor/postprocessing/OutputPass.js'),
    ]);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bp = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.5, 0.82);
    bp.threshold = 0.92; bp.strength = isMobile ? 0.3 : 0.42; bp.radius = 0.4;
    composer.addPass(bp);
    composer.addPass(new OutputPass());
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
  } catch (e) {
    console.warn('[Heaven] bloom unavailable, using direct render', e);
    composer = null;
  }
}

/* ---------------------------- Init & loop ------------------------------ */
function init() {
  if (!webglOK()) { showError(t('errorWebGL')); return; }
  isMobile = window.matchMedia('(max-width:720px)').matches || ('ontouchstart' in window && window.innerWidth < 900);
  // 调试：?hq=1 强制桌面高画质 / ?lq=1 强制低配，便于在任意窗口尺寸下校验效果
  if (location.search.indexOf('hq=1') >= 0) isMobile = false;
  if (location.search.indexOf('lq=1') >= 0) isMobile = true;
  // 调试：?reset=1 清空仙箓存档，回到未拾得状态
  if (location.search.indexOf('reset=1') >= 0) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  const app = document.getElementById('app');
  renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !isMobile && location.search.indexOf('noshadow') < 0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 6000);
  camera.position.copy(DEFAULT_CAM);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 40;
  controls.maxDistance = 1700;
  controls.maxPolarAngle = Math.PI * 0.495; // keep above the cloud sea
  controls.target.copy(DEFAULT_TAR);
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.4;

  // Filmic bloom (post-processing) — loaded asynchronously with graceful fallback
  setupBloom();

  // procedural IBL so gold / bronze / glaze reflect a real sky
  buildEnvironment();

  // shared textures
  glowTex = makeGlowTexture();
  cloudTex = makeCloudTexture();
  starTex = makeStarTexture();

  clock = new THREE.Clock();
  window.__courtReady = true;

  // 检视钩子（仅在 ?debug=1 时挂载，供离线渲染验证使用，不影响正常访问）
  if (location.search.indexOf('debug') >= 0) {
    window.__heaven = {
      THREE, scene, camera, controls, renderer, BEASTS, LANDMARKS,
      quest, SLIPS, LANTERNS, poolRef: () => poolRef,
      // 六套玩法：状态与调试入口
      gameMode: () => gameMode,
      STAR_OFFICIALS, ADOPTED,
      starGroup: () => starGroup,
      starClick, enterStarMode, solveOfficial,
      castFish,
      diveToggle, diving: () => diving,
      moonState, moonBridge: () => moonBridge,
      quizStepMarkers,
      summonGuide, phoenixGuide: () => phoenixGuide,
      setGameMode(m) {
        gameMode = m;
        if (starGroup) starGroup.visible = (m === 'star');
        if (m === 'star') enterStarMode();
        else {
          starDim = 0;
          const anySolved = STAR_OFFICIALS.some((o) => o.solved);
          if (starGroup) starGroup.visible = anySolved;
          if (anySolved) refreshStarState();
        }
        refreshGamePanel();
        return gameMode;
      },
      // 离线验证用：直接拾取 / 放灯 / 重置，不必真的拖鼠标
      collectNext() {
        const s = SLIPS.find((x) => !x.taken && x.fade < 0);
        return s ? collectSlip(s) : false;
      },
      dropLanterns(n) {
        for (let i = 0; i < (n || 3); i++) {
          const a = Math.PI * 0.5 + (i - 1) * 0.62;
          addLanternObject(Math.cos(a) * 74, Math.sin(a) * 74);
        }
        quest.lanterns = LANTERNS.length; saveQuest();
        if (quest.lanterns >= 3 && !quest.taken.yaochi) spawnSlip(SLIP_DEFS.find((d) => d.id === 'yaochi'));
        refreshQuestUI();
        return quest.lanterns;
      },
      resetQuest,
      drawOnce() { if (composer) composer.render(); else renderer.render(scene, camera); },
      focusBeast(i, dist, elev, azim) {
        const b = BEASTS[i];
        if (!b || !b.group) return false;
        const p = b.group.position.clone();
        const d = dist || 110, dy = elev === undefined ? 26 : elev, a = azim || 0;
        camera.position.set(p.x + Math.sin(a) * d, p.y + dy, p.z + Math.cos(a) * d);
        controls.target.copy(p);
        controls.update();
        return true;
      },
      trackBeastPart(i, dist, elev, azim, lx, ly, lz) {
        const b = BEASTS[i];
        if (!b || !b.group) return false;
        const p = b.group.localToWorld(new THREE.Vector3(lx || 0, ly || 0, lz || 0));
        const d = dist || 60, dy = elev === undefined ? 10 : elev, az = azim || 0;
        camera.position.set(p.x + Math.sin(az) * d, p.y + dy, p.z + Math.cos(az) * d);
        controls.target.copy(p);
        controls.update();
        follow = b;
        followPrev.copy(b.group.position);
        return true;
      },
      trackBeast(i, dist, elev, azim) {
        if (this.focusBeast(i, dist, elev, azim) === false) return false;
        follow = BEASTS[i];
        followPrev.copy(BEASTS[i].group.position);
        refreshBeastButtons();
        return true;
      },
      setPhase(p) { dayNight.auto = false; dayNight.phase = p; },
      flyActive() { return !!fly; },
      camState() {
        const dir = camera.getWorldDirection(new THREE.Vector3());
        return {
          pos: camera.position.toArray().map((v) => Math.round(v)),
          target: controls.target.toArray().map((v) => Math.round(v)),
          dir: dir.toArray().map((v) => +v.toFixed(3)),
        };
      },
      hideUI() {
        ['topbar', 'panel', 'beast-panel', 'info-card', 'hint', 'beast-toggle', 'panel-toggle',
          'quest-btn', 'quest-panel', 'prompt', 'toast'].forEach((id) => {
          const el = document.getElementById(id); if (el) el.style.display = 'none';
        });
      },
    };
  }

  // UI events
  document.getElementById('lang-btn').addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); });
  document.getElementById('daynight-btn').addEventListener('click', toggleDayNight);
  document.getElementById('meteor-btn').addEventListener('click', toggleMeteor);
  document.getElementById('voice-btn').addEventListener('click', toggleVoice);
  document.getElementById('tour-btn').addEventListener('click', toggleTour);
  document.getElementById('reset-btn').addEventListener('click', resetView);
  document.getElementById('info-close').addEventListener('click', hideInfo);
  document.getElementById('panel-toggle').addEventListener('click', () => document.getElementById('panel').classList.toggle('open'));
  document.getElementById('beast-btn').addEventListener('click', () => document.getElementById('beast-panel').classList.toggle('hidden'));
  document.getElementById('beast-toggle').addEventListener('click', toggleBeastPanel);
  document.getElementById('quest-btn').addEventListener('click', () => toggleQuestPanel());
  document.getElementById('quest-close').addEventListener('click', () => toggleQuestPanel(false));
  document.getElementById('quest-reset').addEventListener('click', resetQuest);
  document.getElementById('game-btn').addEventListener('click', () => toggleGamePanel());
  document.getElementById('quiz-close').addEventListener('click', () => {
    const qp = document.getElementById('quiz-panel'); if (qp) qp.classList.remove('open');
    quizOpen = false; currentQuiz = null;
  });
  window.addEventListener('keydown', onKeyDown);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  if ('speechSynthesis' in window) window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', () => {});
  window.addEventListener('resize', onResize);
  // hide hint after a while
  setTimeout(() => { const h = document.getElementById('hint'); if (h) h.classList.add('hidden'); }, 7000);

  loadQuest();
  applyLang();
  buildScene().then(() => {
    const ld = document.getElementById('loading'); if (ld) ld.classList.add('hidden');
  }).catch((err) => {
    console.error(err);
    showError(t('errorGeneric') + (err && err.message ? err.message : ''));
  });

  renderer.setAnimationLoop(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

// `?still` renders a couple of frames then stops — used for offline screenshots
const STILL_MODE = /[?&]still/.test(location.search);
let stillFrames = 0;

function animate() {
  const raw = clock.getDelta();
  const dt = Math.min(raw, 0.05);
  // 相机补间用真实耗时，低帧率设备上飞行时长才不会成倍拉长
  const fdt = Math.min(raw, 1.0);
  const time = clock.elapsedTime;

  updateDayNight(dt);

  // camera fly tween
  if (fly) {
    fly.t += fdt / fly.dur;
    const e = easeInOut(Math.min(fly.t, 1));
    camera.position.lerpVectors(fly.fromPos, fly.toPos, e);
    controls.target.lerpVectors(fly.fromTar, fly.toTar, e);
    if (fly.t >= 1) { fly = null; controls.update(); }
  }

  // tour cycling
  if (touring) {
    tourTimer += dt;
    if (tourTimer > 7 && !fly) {
      tourTimer = 0;
      tourIndex = (tourIndex + 1) % LANDMARKS.length;
      flyTo(LANDMARKS[tourIndex]);
    }
  }

  // 观星要能仰到接近天顶，先放宽 OrbitControls 约束，再让它 update
  if (gameMode === 'star') {
    controls.maxPolarAngle = Math.PI * 0.92;
    controls.maxDistance = 4000;
  } else if (diving) {
    // 水下可以往任何方向看
    controls.maxPolarAngle = Math.PI * 0.98;
    controls.maxDistance = 1700;
  } else {
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.maxDistance = 1700;
  }
  // 潜入瑶池时相机要沉到水下，必须放开最近距离与俯仰限制
  controls.minDistance = diving ? 5 : 40;

  controls.update();

  // follow a beast by panning camera + target along with it
  if (follow && follow.group) {
    const cur = follow.group.position;
    const d = cur.clone().sub(followPrev);
    camera.position.add(d);
    controls.target.add(d);
    followPrev.copy(cur);
  }

  // sky & stars follow the camera so they read as infinitely far
  if (skyDome) skyDome.position.copy(camera.position);
  if (starField) { starField.position.copy(camera.position); starField.rotation.y += dt * 0.005; }
  if (starGroup) starGroup.position.copy(camera.position);

  if (cloudLayers.length) {
    for (let i = 0; i < cloudLayers.length; i++) cloudLayers[i].uniforms.uTime.value = time;
  }
  if (skyMat) skyMat.uniforms.uTime.value = time;
  if (cloudGroup) {
    cloudGroup.rotation.y += dt * 0.006;
    cloudGroup.children.forEach((s) => {
      s.position.x += s.userData.speed * dt;
      s.position.y = s.userData.baseY + Math.sin(time * 0.3 + s.userData.phase) * (s.userData.spill ? 1.6 : 8);
      if (s.position.x > 1700) s.position.x = -1700;
      if (s.position.x < -1700) s.position.x = 1700;
    });
  }

  BEASTS.forEach((b) => { if (b.group) b.update(b, (b === BEASTS[0] && phoenixGuide) ? fdt : dt, time); });
  updateKoi(dt, time);
  updateQuest(dt, time);
  updateGames(dt, time);
  if (waterNormalTex) { waterNormalTex.offset.x += dt * 0.014; waterNormalTex.offset.y += dt * 0.009; }
  updateMeteors(dt);

  if (composer) composer.render();
  else renderer.render(scene, camera);

  if (STILL_MODE && ++stillFrames > 2) renderer.setAnimationLoop(null);
}

// only boot when the page actually contains the app shell (keeps the module
// importable from auxiliary/debug pages without side effects)
if (document.getElementById('app')) {
  try {
    init();
  } catch (e) {
    console.error(e);
    showError(t('errorGeneric') + (e && e.message ? e.message : ''));
  }
}

// exposed for the offline texture/material preview page
export {
  makeMarbleTexture, makeTileTexture, makeGoldTexture, makeWoodTexture,
  makeLacquerTexture, makePlaqueTexture, makeStoneTexture,
};
