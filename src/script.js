import './style.css';

import * as THREE from 'three';
import * as dat from 'dat.gui';

import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const DEFAULT_ANIMATION_PATH = '/models/Girl/girl-walk.fbx';

const ALL_ANIMATIONS = ['run', 'gather-objects', 'look-around'];

export default class Game {
  constructor(options) {
    // this.time = 0
    this.stats = Stats();
    this.container = options.dom;

    this.time = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0a0a0);
    this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      1,
      2000
    );
    this.camera.position.y = 100;
    this.camera.position.z = 250;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.animations = ALL_ANIMATIONS.map(
      (animation) => `/models/Girl/${animation}.fbx`
    );

    this.addStats();
    this.addLights();
    this.addObjects();

    this.setupResize();
    this.render();
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  addStats() {
    document.body.appendChild(this.stats.dom);
  }

  addLights() {
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemisphereLight.position.set(0, 200, 0);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 180;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.left = -120;
    directionalLight.shadow.camera.right = 120;

    this.scene.add(hemisphereLight, directionalLight);
  }

  addObjects() {
    // this.geometry = new THREE.BoxGeometry(1, 1, 1)
    // this.material = new THREE.MeshPhongMaterial({ color: 0x00aaff })
    // this.cube = new THREE.Mesh(this.geometry, this.material)
    // this.scene.add(this.cube)

    this.ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;

    this.grid = new THREE.GridHelper(2000, 40, 0x000000, 0x000000);
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;

    this.scene.add(this.grid, this.ground);

    /**
     * Load model
     */
    const loader = new FBXLoader();
    loader.load(DEFAULT_ANIMATION_PATH, (object) => {
      console.log('DEFAULT_ANIMATION_PATH =>', { object });
      object.mixer = new THREE.AnimationMixer(object);
      object.name = 'Girl';
      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(object);
    });
  }

  render() {
    this.stats.begin();

    const elapsedTime = this.time.getElapsedTime();

    // this.cube.rotation.y = elapsedTime * 0.5
    // this.cube.rotation.x = elapsedTime * 0.5

    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));

    this.stats.end();
  }
}

const env = process.env.NODE_ENV;

if (env === 'development') {
  // Access Game class from the terminal for debugging only
  window.addEventListener('DOMContentLoaded', () => {
    const game = new Game({
      dom: document.getElementById('webgl-container'),
    });
    window.game = game;
  });
} else {
  // staging or production
  new Game({
    dom: document.getElementById('webgl-container'),
  });
}
