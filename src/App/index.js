import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TorusKnotGeometry,
  Vector2,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'stats.js';

import vertexShader from './shaders/two/vertex.js';
import fragmentShader from './shaders/two/frag.js';

const COLOR = new Color();

const clampPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

export default class App {
  #gl;
  #camera;
  #scene;
  #clock;
  #controls;
  #stats;
  #gui;
  #meshGroup;
  #coreMesh;
  #wireMesh;
  #dust;
  #mouse;
  #uniforms;
  #targetScroll;
  #targetDistortion;
  #targetRotX;
  #targetRotY;
  #params;

  constructor() {
    this.#targetScroll = 0;
    this.#targetDistortion = 1.05;
    this.#targetRotX = 0.12;
    this.#targetRotY = 0;
    this.#mouse = new Vector2();

    this.#params = {
      distortion: 1.05,
      glow: 1.2,
      speed: 1,
      autoSpin: 0.35,
      colorA: '#63ffd9',
      colorB: '#ff8f63',
      colorC: '#9274ff',
    };

    this.#init();
  }

  #init() {
    const pixelRatio = clampPixelRatio();

    this.#gl = new WebGLRenderer({
      canvas: document.querySelector('#canvas'),
      antialias: pixelRatio <= 1.5,
      powerPreference: 'high-performance',
    });

    this.#gl.setPixelRatio(pixelRatio);
    this.#gl.setSize(window.innerWidth, window.innerHeight);
    this.#gl.outputColorSpace = SRGBColorSpace;
    this.#gl.toneMapping = ACESFilmicToneMapping;
    this.#gl.toneMappingExposure = 1.06;
    this.#gl.setClearColor(0x050b14, 1);

    const aspect = window.innerWidth / window.innerHeight;
    this.#camera = new PerspectiveCamera(55, aspect, 0.1, 40);
    this.#camera.position.set(0, 0.75, 5.35);

    this.#controls = new OrbitControls(this.#camera, this.#gl.domElement);
    this.#controls.enableDamping = true;
    this.#controls.dampingFactor = 0.055;
    this.#controls.enablePan = false;
    this.#controls.minDistance = 3.2;
    this.#controls.maxDistance = 9.2;

    this.#scene = new Scene();
    this.#scene.fog = new FogExp2(0x050b14, 0.065);

    this.#clock = new Clock();

    this.#initScene();
    this.#initGui();

    this.#stats = new Stats();
    this.#stats.dom.style.left = 'auto';
    this.#stats.dom.style.right = '0';
    document.body.appendChild(this.#stats.dom);

    this.#initEvents();
    this.#animate();
  }

  #initScene() {
    const hemi = new AmbientLight(0xa8dcff, 0.36);
    this.#scene.add(hemi);

    const key = new DirectionalLight(0xffdbbf, 1.2);
    key.position.set(3.2, 4.5, 2.5);
    this.#scene.add(key);

    const fill = new DirectionalLight(0x8fb2ff, 0.65);
    fill.position.set(-3.5, 1.5, -4.2);
    this.#scene.add(fill);

    const floor = new Mesh(
      new PlaneGeometry(22, 22),
      new MeshStandardMaterial({
        color: COLOR.clone().set(0x0b1a2b),
        roughness: 0.88,
        metalness: 0.04,
      }),
    );

    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -2.3;
    this.#scene.add(floor);

    this.#uniforms = {
      uTime: { value: 0 },
      uDistortion: { value: this.#params.distortion },
      uScroll: { value: 0 },
      uPointer: { value: new Vector2() },
      uGlow: { value: this.#params.glow },
      uColorA: { value: COLOR.clone().set(this.#params.colorA) },
      uColorB: { value: COLOR.clone().set(this.#params.colorB) },
      uColorC: { value: COLOR.clone().set(this.#params.colorC) },
    };

    this.#meshGroup = new Group();

    const coreGeometry = this.#withRandomAttribute(
      new TorusKnotGeometry(1.2, 0.34, 300, 64),
    );

    const coreMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.#uniforms,
    });

    this.#coreMesh = new Mesh(coreGeometry, coreMaterial);
    this.#coreMesh.position.y = 0.2;
    this.#meshGroup.add(this.#coreMesh);

    const wireGeometry = this.#withRandomAttribute(
      new TorusKnotGeometry(1.48, 0.12, 240, 22),
    );

    const wireMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.#uniforms,
      wireframe: true,
      transparent: true,
      depthWrite: false,
    });

    this.#wireMesh = new Mesh(wireGeometry, wireMaterial);
    this.#wireMesh.position.y = 0.2;
    this.#meshGroup.add(this.#wireMesh);

    this.#scene.add(this.#meshGroup);

    this.#dust = this.#buildDust();
    this.#scene.add(this.#dust);
  }

  #buildDust() {
    const count = 900;
    const points = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      points[i3] = (Math.random() - 0.5) * 20;
      points[i3 + 1] = (Math.random() - 0.5) * 10;
      points[i3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(points, 3));

    const material = new PointsMaterial({
      color: 0x96b0d8,
      size: 0.028,
      transparent: true,
      opacity: 0.46,
      sizeAttenuation: true,
    });

    return new Points(geometry, material);
  }

  #withRandomAttribute(geometry) {
    const amount = geometry.attributes.position.count;
    const random = new Float32Array(amount);

    for (let i = 0; i < amount; i++) {
      random[i] = Math.random();
    }

    geometry.setAttribute('aRandom', new BufferAttribute(random, 1));

    return geometry;
  }

  #initGui() {
    this.#gui = new GUI({ title: 'Shader Bloom Controls' });

    this.#gui
      .add(this.#params, 'distortion', 0.3, 2.4, 0.01)
      .name('Base Distortion')
      .onChange((value) => {
        this.#targetDistortion = value;
      });

    this.#gui
      .add(this.#params, 'glow', 0.25, 2.8, 0.01)
      .name('Glow')
      .onChange((value) => {
        this.#uniforms.uGlow.value = value;
      });

    this.#gui.add(this.#params, 'speed', 0.2, 2.5, 0.01).name('Time Speed');
    this.#gui
      .add(this.#params, 'autoSpin', -1.6, 1.6, 0.01)
      .name('Auto Spin');

    this.#gui
      .addColor(this.#params, 'colorA')
      .name('Color A')
      .onChange((value) => {
        this.#uniforms.uColorA.value.set(value);
      });

    this.#gui
      .addColor(this.#params, 'colorB')
      .name('Color B')
      .onChange((value) => {
        this.#uniforms.uColorB.value.set(value);
      });

    this.#gui
      .addColor(this.#params, 'colorC')
      .name('Color C')
      .onChange((value) => {
        this.#uniforms.uColorC.value.set(value);
      });

    this.#gui.close();
  }

  #onMouseMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.#mouse.set(x, y);
  };

  #onWheel = (event) => {
    this.#targetScroll += event.deltaY * 0.0035;

    const boost = MathUtils.clamp(Math.abs(event.deltaY) * 0.00085, 0.02, 0.28);

    this.#targetDistortion = MathUtils.clamp(
      this.#targetDistortion + boost,
      0.3,
      2.4,
    );
  };

  #onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      this.#targetRotY -= 0.22;
    }

    if (event.key === 'ArrowRight') {
      this.#targetRotY += 0.22;
    }

    if (event.key === 'ArrowUp') {
      this.#targetRotX = MathUtils.clamp(this.#targetRotX - 0.14, -0.6, 0.6);
      this.#targetDistortion = MathUtils.clamp(this.#targetDistortion + 0.06, 0.3, 2.4);
    }

    if (event.key === 'ArrowDown') {
      this.#targetRotX = MathUtils.clamp(this.#targetRotX + 0.14, -0.6, 0.6);
      this.#targetDistortion = MathUtils.clamp(this.#targetDistortion - 0.06, 0.3, 2.4);
    }
  };

  #resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.#gl.setPixelRatio(clampPixelRatio());
    this.#gl.setSize(w, h);

    this.#camera.aspect = w / h;
    this.#camera.updateProjectionMatrix();
  };

  #initEvents() {
    window.addEventListener('resize', this.#resize);
    window.addEventListener('mousemove', this.#onMouseMove);
    window.addEventListener('wheel', this.#onWheel, { passive: true });
    window.addEventListener('keydown', this.#onKeyDown);
  }

  #animate = () => {
    this.#stats.begin();

    const delta = this.#clock.getDelta();

    this.#uniforms.uTime.value += delta * this.#params.speed;

    this.#targetDistortion = MathUtils.lerp(
      this.#targetDistortion,
      this.#params.distortion,
      delta * 2.0,
    );

    this.#uniforms.uDistortion.value = MathUtils.lerp(
      this.#uniforms.uDistortion.value,
      this.#targetDistortion,
      delta * 5,
    );

    this.#uniforms.uScroll.value = MathUtils.lerp(
      this.#uniforms.uScroll.value,
      this.#targetScroll,
      delta * 2.3,
    );

    this.#uniforms.uPointer.value.lerp(this.#mouse, delta * 6.5);

    this.#targetRotY += this.#params.autoSpin * delta * 0.35;

    this.#meshGroup.rotation.x = MathUtils.lerp(
      this.#meshGroup.rotation.x,
      this.#targetRotX,
      delta * 3.2,
    );

    this.#meshGroup.rotation.y = MathUtils.lerp(
      this.#meshGroup.rotation.y,
      this.#targetRotY,
      delta * 3.2,
    );

    this.#wireMesh.rotation.x -= delta * 0.2;
    this.#wireMesh.rotation.z += delta * 0.16;
    this.#dust.rotation.y += delta * 0.03;

    this.#controls.update();

    this.#gl.render(this.#scene, this.#camera);
    this.#stats.end();

    window.requestAnimationFrame(this.#animate);
  };
}
