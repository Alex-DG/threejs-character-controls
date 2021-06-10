import './style.css'

import * as THREE from 'three'
import * as dat from 'dat.gui'

import { hideLoader } from './utils/loader'

import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const MODEL_PATH = '/models/girl/'

class BasicCharacterControls {
  constructor(params) {
    this.params = params // <=> { target, camera } with target = fbx model

    this.move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    }

    this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0)
    this.acceleration = new THREE.Vector3(1.0, 0.25, 50.0)
    this.velocity = new THREE.Vector3(0, 0, 0)

    document.addEventListener(
      'keydown',
      (event) => this.onKeyDown(event),
      false
    )
    document.addEventListener('keyup', (event) => this.onKeyUp(event), false)
  }

  onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this.move.forward = true
        break
      case 65: // a
        this.move.left = true
        break
      case 83: // s
        this.move.backward = true
        break
      case 68: // d
        this.move.right = true
        break
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break
    }
  }

  onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this.move.forward = false
        break
      case 65: // a
        this.move.left = false
        break
      case 83: // s
        this.move.backward = false
        break
      case 68: // d
        this.move.right = false
        break
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break
    }
  }

  /**
   * Apply movement to the character
   *
   * @param time - in seconds
   */
  update(time) {
    const velocity = this.velocity

    const frameDecceleration = new THREE.Vector3(
      velocity.x * this.decceleration.x,
      velocity.y * this.decceleration.y,
      velocity.z * this.decceleration.z
    )
    frameDecceleration.multiplyScalar(time)
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z))

    velocity.add(frameDecceleration)

    const controlObject = this.params.target

    const Q = new THREE.Quaternion()
    const A = new THREE.Vector3()
    const R = controlObject.quaternion.clone()

    if (this.move.forward) {
      velocity.z += this.acceleration.z * time
    }

    if (this.move.backward) {
      velocity.z -= this.acceleration.z * time
    }

    if (this.move.left) {
      A.set(0, 1, 0)
      Q.setFromAxisAngle(A, Math.PI * time * this.acceleration.y)
      R.multiply(Q)
    }

    if (this.move.right) {
      A.set(0, 1, 0)
      Q.setFromAxisAngle(A, -Math.PI * time * this.acceleration.y)
      R.multiply(Q)
    }

    controlObject.quaternion.copy(R)

    const oldPosition = new THREE.Vector3()
    oldPosition.copy(controlObject.position)

    const forward = new THREE.Vector3(0, 0, 1)
    forward.applyQuaternion(controlObject.quaternion)
    forward.normalize()

    const sideways = new THREE.Vector3(1, 0, 0)
    sideways.applyQuaternion(controlObject.quaternion)
    sideways.normalize()

    sideways.multiplyScalar(velocity.x * time)
    forward.multiplyScalar(velocity.z * time)

    controlObject.position.add(forward)
    controlObject.position.add(sideways)

    oldPosition.copy(controlObject.position)
  }
}

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
    const loader = new FBXLoader()
    loader.setPath(MODEL_PATH)

    loader.load('eve_j_gonzales.fbx', (fbx) => {
      fbx.scale.setScalar(0.1)
      fbx.traverse((child) => {
        child.castShadow = true
      })

      // Character controls
      this.controls = new BasicCharacterControls({
        target: fbx,
        camera: this.camera,
      })

      const anim = new FBXLoader()
      anim.setPath(MODEL_PATH)

      anim.load('walk.fbx', (anim) => {
        const animationMixer = new THREE.AnimationMixer(fbx)
        this.mixers.push(animationMixer)

        const action = animationMixer.clipAction(anim.animations[0])
        action.play()
      })

      this.scene.add(fbx)
      hideLoader() // hide loader overlay
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

new Demo()

// const env = process.env.NODE_ENV
window.addEventListener('DOMContentLoaded', () => {
  const demo = new Demo()
  window.demo = demo
})
