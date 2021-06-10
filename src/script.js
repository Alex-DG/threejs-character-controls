import './style.css'

import * as THREE from 'three'
import * as dat from 'dat.gui'

import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

import BasicCharacterController from './models/controls/BasicCharacterController'

export default class Demo {
  constructor() {
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
    const far = 1000.0
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.camera.position.set(0, 20, 60)

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xa0a0a0)
    this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000)

    // Light
    let light = new THREE.DirectionalLight(0xffffff, 1.0)
    light.position.set(20, 100, 10)
    light.target.position.set(0, 0, 0)
    light.castShadow = true
    light.shadow.bias = -0.001
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 500.0
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 500.0
    light.shadow.camera.left = 100
    light.shadow.camera.right = -100
    light.shadow.camera.top = 100
    light.shadow.camera.bottom = -100
    this.scene.add(light)

    light = new THREE.AmbientLight(0xffffff, 4.0)
    this.scene.add(light)

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
    window.addEventListener('resize', this.resize.bind(this))
  }

  loadAnimatedModel() {
    this.controls = new BasicCharacterController({
      camera: this.camera,
      scene: this.scene,
      path: '/models/girl/',
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

  render() {
    this.stats.begin()

    const elapsedTime = this.time.getElapsedTime()
    const deltaTime = elapsedTime - this.previousTime
    this.previousTime = elapsedTime

    // Model animation
    // this.mixer?.update(deltaTime)
    this.mixers?.map((mix) => mix.update(deltaTime))
    this.controls?.update(deltaTime)

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
