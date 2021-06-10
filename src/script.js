import './style.css'

import * as THREE from 'three'
import * as dat from 'dat.gui'

import { hideLoader } from './utils/loader'

import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const MODEL_PATH = '/models/girl/'

/**
 * Action State
 */
class State {
  constructor(parent) {
    this.parent = parent
  }

  enter() {}
  exit() {}
  update() {}
}

class DanceState extends State {
  constructor(parent) {
    super(parent)

    this.finishedCallback = () => {
      this.finished()
    }
  }

  get name() {
    return 'dance'
  }

  enter(prevState) {
    const currentAction = this.parent.proxy.animations['dance'].action

    const mixer = currentAction.getMixer()
    mixer.addEventListener('finished', this.finishedCallback)

    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.name].action

      currentAction.reset()
      currentAction.setLoop(THREE.LoopOnce, 1)
      currentAction.clampWhenFinished = true
      currentAction.crossFadeFrom(prevAction, 0.2, true)
      currentAction.play()
    } else {
      currentAction.play()
    }
  }

  finished() {
    this.cleanup()
    this.parent.setState('idle')
  }

  cleanup() {
    const action = this.parent.proxy.animations['dance'].action
    action.getMixer().removeEventListener('finished', this.cleanupCallback)
  }

  exit() {
    this.cleanup()
  }

  update(_) {}
}

class WalkState extends State {
  constructor(parent) {
    super(parent)
  }

  get name() {
    return 'walk'
  }

  enter(prevState) {
    const currentAction = this.parent.proxy.animations['walk'].action

    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.name].action

      currentAction.enabled = true

      if (prevState.name == 'run') {
        const ratio =
          currentAction.getClip().duration / prevAction.getClip().duration
        currentAction.time = prevAction.time * ratio
      } else {
        currentAction.time = 0.0
        currentAction.setEffectiveTimeScale(1.0)
        currentAction.setEffectiveWeight(1.0)
      }

      currentAction.crossFadeFrom(prevAction, 0.5, true)
      currentAction.play()
    } else {
      currentAction.play()
    }
  }

  exit() {}

  update(_, input) {
    if (input.keys.forward || input.keys.backward) {
      if (input.keys.shift) {
        this.parent.setState('run')
      }

      return
    }

    this.parent.setState('idle')
  }
}

class RunState extends State {
  constructor(parent) {
    super(parent)
  }

  get name() {
    return 'run'
  }

  enter(prevState) {
    const currentAction = this.parent.proxy.animations['run'].action

    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.name].action

      currentAction.enabled = true

      if (prevState.name == 'walk') {
        const ratio =
          currentAction.getClip().duration / prevAction.getClip().duration
        currentAction.time = prevAction.time * ratio
      } else {
        currentAction.time = 0.0
        currentAction.setEffectiveTimeScale(1.0)
        currentAction.setEffectiveWeight(1.0)
      }

      currentAction.crossFadeFrom(prevAction, 0.5, true)
      currentAction.play()
    } else {
      currentAction.play()
    }
  }

  exit() {}

  update(_, input) {
    if (input.keys.forward || input.keys.backward) {
      if (!input.keys.shift) {
        this.parent.setState('walk')
      }

      return
    }

    this.parent.setState('idle')
  }
}

class IdleState extends State {
  constructor(parent) {
    super(parent)
  }

  get name() {
    return 'idle'
  }

  enter(prevState) {
    const idleAction = this.parent.proxy.animations['idle'].action

    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.name].action

      idleAction.time = 0.0
      idleAction.enabled = true
      idleAction.setEffectiveTimeScale(1.0)
      idleAction.setEffectiveWeight(1.0)
      idleAction.crossFadeFrom(prevAction, 0.5, true)
      idleAction.play()
    } else {
      idleAction.play()
    }
  }

  exit() {}

  update(_, input) {
    if (input.keys.forward || input.keys.backward) {
      this.parent.setState('walk')
    } else if (input.keys.space) {
      this.parent.setState('dance')
    }
  }
}

class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations
  }

  get animations() {
    return this._animations
  }
}

class BasicCharacterController {
  constructor(params) {
    this.params = params // <=> { camera, scene }

    this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0)
    this.acceleration = new THREE.Vector3(1.0, 0.25, 50.0)
    this.velocity = new THREE.Vector3(0, 0, 0)

    this.animations = {}

    this.input = new BasicCharacterControllerInput()
    this.stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this.animations)
    )

    this.loadModels()
  }

  loadModels() {
    const loader = new FBXLoader()
    loader.setPath(MODEL_PATH)

    loader.load('eve_j_gonzales.fbx', (fbx) => {
      fbx.scale.setScalar(0.1)
      fbx.traverse((child) => {
        child.castShadow = true
      })

      this.target = fbx
      this.params.scene.add(fbx)

      this.mixer = new THREE.AnimationMixer(fbx)

      this.manager = new THREE.LoadingManager()
      this.manager.onLoad = () => {
        this.stateMachine.setState('idle')
      }

      const onLoadAnimation = (name, data) => {
        const clip = data.animations[0]
        const action = this.mixer.clipAction(clip)

        // this.animations = { ...this.animations, [name]: { clip, action } }
        this.animations[name] = {
          clip,
          action,
        }
      }

      const loaderWithManager = new FBXLoader(this.manager)
      loaderWithManager.setPath(MODEL_PATH)

      loaderWithManager.load('walk.fbx', (data) => {
        onLoadAnimation('walk', data)
      })
      loaderWithManager.load('idle.fbx', (data) => {
        onLoadAnimation('idle', data)
      })
      loaderWithManager.load('dance.fbx', (data) => {
        onLoadAnimation('dance', data)
      })
      loaderWithManager.load('run.fbx', (data) => {
        onLoadAnimation('run', data)

        hideLoader()
      })
    })
  }

  /**
   * Apply movement to the character
   *
   * @param time - seconds
   */
  update(time) {
    if (!this.target) return

    this.stateMachine.update(time, this.input)

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

    const controlObject = this.target
    const Q = new THREE.Quaternion()
    const A = new THREE.Vector3()
    const R = controlObject.quaternion.clone()

    const acc = this.acceleration.clone()

    if (this.input.keys.shift) {
      acc.multiplyScalar(2.0)
    }
    if (this.stateMachine.currentState?.name == 'dance') {
      acc.multiplyScalar(0.0)
    }
    if (this.input.keys.forward) {
      velocity.z += acc.z * time
    }
    if (this.input.keys.backward) {
      velocity.z -= acc.z * time
    }
    if (this.input.keys.left) {
      A.set(0, 1, 0)
      Q.setFromAxisAngle(A, 4.0 * Math.PI * time * this.acceleration.y)
      R.multiply(Q)
    }
    if (this.input.keys.right) {
      A.set(0, 1, 0)
      Q.setFromAxisAngle(A, 4.0 * -Math.PI * time * this.acceleration.y)
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

    this.mixer?.update(time)
  }
}

/**
 * Keyboard listeners on press keys up and down
 */
class BasicCharacterControllerInput {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    }

    document.addEventListener(
      'keydown',
      (event) => this.onKeyDown(event),
      false
    )

    document.addEventListener('keyup', (event) => this.onKeyUp(event), false)
  }

  onKeyDown({ keyCode }) {
    switch (keyCode) {
      case 87: // w
        this.keys.forward = true
        break
      case 65: // a
        this.keys.left = true
        break
      case 83: // s
        this.keys.backward = true
        break
      case 68: // d
        this.keys.right = true
        break
      case 32: // SPACE
        this.keys.space = true
        break
      case 16: // SHIFT
        this.keys.shift = true
        break
    }
  }

  onKeyUp({ keyCode }) {
    switch (keyCode) {
      case 87: // w
        this.keys.forward = false
        break
      case 65: // a
        this.keys.left = false
        break
      case 83: // s
        this.keys.backward = false
        break
      case 68: // d
        this.keys.right = false
        break
      case 32: // SPACE
        this.keys.space = false
        break
      case 16: // SHIFT
        this.keys.shift = false
        break
    }
  }
}

/**
 * Final-State Machine
 * https://en.wikipedia.org/wiki/Finite-state_machine
 *
 * The FSM can change from one state to another in response to some inputs
 *
 * idle -> 'forward key' -> walk
 * walk -> 'stop' -> idle
 *
 * walk -> 'shift key' -> run
 * run -> 'no shift key' ->  walk
 *
 * idle -> 'space key' -> dance
 * dance -> 'no space key' -> idle
 *
 */
class FiniteStateMachine {
  constructor() {
    this.states = {}
    this.currentState = null
  }

  addState(name, type) {
    this.states[name] = type
  }

  setState(name) {
    const prevState = this.currentState

    if (prevState) {
      if (prevState.name == name) {
        return
      }
      prevState.exit()
    }

    const state = new this.states[name](this)

    this.currentState = state
    state.enter(prevState)
  }

  update(timeElapsed, input) {
    this.currentState?.update(timeElapsed, input)
  }
}

class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super()
    this.proxy = proxy

    this.addState('idle', IdleState)
    this.addState('walk', WalkState)
    this.addState('run', RunState)
    this.addState('dance', DanceState)
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
