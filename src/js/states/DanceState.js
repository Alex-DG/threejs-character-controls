import * as THREE from 'three'

import State from './State'

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

export default DanceState
