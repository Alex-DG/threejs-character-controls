import '../styles/index.css'

import * as THREE from 'three'
import * as dat from 'dat.gui'

import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

import BasicCharacterController from './movements/BasicCharacterController'
import ThirdPersonCamera from './cameras/ThirdPersonCamera'

export default class Demo {
  constructor() {
    this.gui = new dat.GUI({ width: 350 })

    this.cameraFolder = this.gui.addFolder('Camera')
    this.ambientLightFolder = this.gui.addFolder('Ambient Light')
    this.directionalLightFolder = this.gui.addFolder('Directional Light')

    this.parameters = {
      thirdPersonCamera: true,
    }

    this.cameraFolder
      .add(this.parameters, 'thirdPersonCamera')
      .onChange((value) => {
        console.log({ value, cam: this.camera })
      })
      .name('Third Person Camera')

    // Init model
    this.init()
  }

  init() {
    this.stats = Stats()
    document.body.appendChild(this.stats.dom)

    this.time = new THREE.Clock()
    this.previousTime = 0

    this.mixers = []
    this.currentAction = null

    this.container = document.getElementById('webgl-container')
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height)

    this.container.appendChild(this.renderer.domElement)

    // Camera
    const fov = 60
    const aspect = this.width / this.height
    const near = 1.0
    const far = 2000.0
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.camera.position.set(25, 10, 35)

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xa0a0a0)
    this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000)

    // Light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.7)
    directionalLight.position.set(25, 80, 30)
    directionalLight.target.position.set(0, 0, 0)
    directionalLight.castShadow = true
    directionalLight.shadow.bias = -0.001
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 500.0
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500.0
    directionalLight.shadow.camera.left = 100
    directionalLight.shadow.camera.right = -100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)

    this.directionalLightFolder.add(directionalLight, 'castShadow')

    this.directionalLightFolder.add(directionalLight, 'visible')

    this.directionalLightFolder
      .add(directionalLight, 'intensity')
      .min(0)
      .max(100)
      .step(0.001)
      .name(`intensity`)
    this.directionalLightFolder
      .add(directionalLight.position, 'x')
      .min(0)
      .max(100)
      .step(0.001)
      .name(`light position X`)
    this.directionalLightFolder
      .add(directionalLight.position, 'y')
      .min(0)
      .max(100)
      .step(0.001)
      .name(`light position Y`)
    this.directionalLightFolder
      .add(directionalLight.position, 'z')
      .min(0)
      .max(100)
      .step(0.001)
      .name(`light position Z`)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    this.scene.add(ambientLight)
    this.ambientLightFolder
      .add(ambientLight, 'intensity')
      .min(0)
      .max(6)
      .step(0.1)

    // Orbit Controls
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )
    // this.orbitControls.enableDamping = true
    this.orbitControls.target.set(0, 20, 0)
    this.orbitControls.update()

    // Ground
    const grid = new THREE.GridHelper(150, 10, 0x000000, 0x000000)
    grid.material.opacity = 0.2
    grid.material.transparent = true

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 'white',
      })
    )
    plane.castShadow = false
    plane.receiveShadow = true
    plane.rotation.x = -Math.PI / 2

    this.scene.add(plane, grid)

    this.setupResize()
    this.loadAnimatedModel()
    this.render()
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.width, this.height)
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  loadAnimatedModel() {
    this.controls = new BasicCharacterController({
      camera: this.camera,
      scene: this.scene,
      path: '/models/girl/',
    })

    this.thirdPersonCamera = new ThirdPersonCamera({
      camera: this.camera,
      target: this.controls,
    })
  }

  /**
   * Load any model and play first animation
   * from different path and position
   */
  loadAnimatedModelAndPlay(path, modelFile, animFile, offset) {
    const loader = new FBXLoader()
    loader.setPath(path)

    loader.load(modelFile, (fbx) => {
      fbx.scale.setScalar(0.1)
      fbx.traverse((child) => {
        child.castShadow = true
      })
      fbx.position.copy(offset)

      const anim = new FBXLoader()
      anim.setPath(path)

      anim.load(animFile, (anim) => {
        const m = new THREE.AnimationMixer(fbx)
        this.mixers.push(m)

        const idle = m.clipAction(anim.animations[0])
        idle.play()
      })

      this.scene.add(fbx)
    })
  }

  modelUpdates(deltaTime) {
    // Animation
    this.mixers?.map((mix) => mix.update(deltaTime))

    // Movements
    this.controls?.update(deltaTime)

    // Camera
    const isFreeCam = !this.parameters?.thirdPersonCamera
    this.thirdPersonCamera.update(deltaTime, isFreeCam)
  }

  render() {
    this.stats.begin()

    const elapsedTime = this.time.getElapsedTime()
    const deltaTime = elapsedTime - this.previousTime
    this.previousTime = elapsedTime

    this.modelUpdates(deltaTime)

    this.renderer.render(this.scene, this.camera)

    window.requestAnimationFrame(this.render.bind(this))

    this.stats.end()
  }
}

// const env = process.env.NODE_ENV
window.addEventListener('DOMContentLoaded', () => {
  const demo = new Demo()
  window.demo = demo
})
