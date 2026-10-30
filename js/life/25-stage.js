/* ============================================================
 *  25-stage.js
 *  渲染器、场景、天空着色器、相机与灯光
 * 声明：We 渲染器, ce 场景, yn 天空 uniform, kg 天空球, Ve 相机, Vh 窄屏标记, uc/eu/Le/Ac 灯光
 *  ------------------------------------------------------------
 *  由 index.html 单行压缩代码机械还原：缩进已还原，标识符沿用
 *  压缩后的短名（无原始 source map，不做重命名以免语义漂移）。
 * ============================================================ */

var We = new L.WebGLRenderer({
  antialias: !0,
  alpha: !1,
  powerPreference: "high-performance"
});
We.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
We.setSize(window.innerWidth, window.innerHeight);
We.shadowMap.enabled = !Ei;
We.shadowMap.type = Ei ? L.PCFShadowMap : L.PCFSoftShadowMap;
var Vh = window.innerWidth < 800;
We.toneMapping = L.NoToneMapping;
zg.appendChild(We.domElement);
var ce = new L.Scene;
ce.fog = new L.Fog(13036031, 90, 170);
var yn = {
    topColor: {
      value: new L.Color("#3f9fe0")
    },
    midColor: {
      value: new L.Color("#a8dcff")
    },
    botColor: {
      value: new L.Color("#f4fbff")
    },
    sunDir: {
      value: new L.Vector3(.4, .75, .5).normalize()
    },
    sunColor: {
      value: new L.Color("#fff3c4")
    },
    sunIntensity: {
      value: 1
    },
    moonDir: {
      value: new L.Vector3(-.4, -.8, -.5).normalize()
    },
    moonIntensity: {
      value: 0
    },
    nightMix: {
      value: 0
    }
  },
  kg = new L.Mesh(new L.SphereGeometry(300, 40, 24), new L.ShaderMaterial({
    side: L.BackSide,
    depthWrite: !1,
    fog: !1,
    uniforms: yn,
    vertexShader: `
      varying vec3 vDir;
      void main(){
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 botColor;
      uniform vec3 sunDir;
      uniform vec3 sunColor;
      uniform float sunIntensity;
      uniform vec3 moonDir;
      uniform float moonIntensity;
      uniform float nightMix;
      varying vec3 vDir;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(botColor, midColor, smoothstep(-0.16, 0.3, h));
        col = mix(col, topColor, smoothstep(0.08, 0.8, h));

        // \u592A\u9633
        float sd = max(dot(d, normalize(sunDir)), 0.0);
        col += sunColor * pow(sd, 420.0) * 2.4 * sunIntensity;
        col += sunColor * pow(sd, 14.0) * 0.34 * sunIntensity;

        // \u6708\u4EAE
        float md = max(dot(d, normalize(moonDir)), 0.0);
        col += vec3(0.88, 0.93, 1.0) * pow(md, 1200.0) * 3.0 * moonIntensity;
        col += vec3(0.55, 0.68, 0.92) * pow(md, 20.0) * 0.2 * moonIntensity;

        // \u661F\u7A7A
        vec2 sp = vec2(atan(d.z, d.x), asin(clamp(h, -1.0, 1.0))) * 42.0;
        vec2 ip = floor(sp);
        float st = step(0.984, hash(ip));
        float tw = 0.55 + 0.45 * sin(st * 3.0 + hash(ip) * 30.0);
        col += vec3(0.85, 0.9, 1.0) * st * tw * nightMix * smoothstep(0.02, 0.45, h) * 0.9;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  }));
ce.add(kg);
var Ve = new L.PerspectiveCamera(72, window.innerWidth / window.innerHeight, .1, 600);
Ve.position.set(0, 1, 16);
var x_ = {
    enabled: !1,
    target: new L.Vector3(0, 1, 0),
    update() {}
  },
  uc = new L.HemisphereLight(14676735, 10410152, 1.15);
ce.add(uc);
var eu = new L.AmbientLight(16777215, .22);
ce.add(eu);
var Le = new L.DirectionalLight(16774106, 2.2);
Le.position.set(30, 52, 22);
Le.castShadow = !0;
Le.shadow.mapSize.set(Vh ? 1024 : 2048, Vh ? 1024 : 2048);
Le.shadow.camera.left = -22;
Le.shadow.camera.right = 22;
Le.shadow.camera.top = 22;
Le.shadow.camera.bottom = -22;
Le.shadow.camera.near = 1;
Le.shadow.camera.far = 160;
Le.shadow.bias = -6e-4;
Le.shadow.normalBias = .03;
ce.add(Le);
var Ac = new L.DirectionalLight(12575999, .5);
Ac.position.set(-28, 26, -24);
ce.add(Ac);
