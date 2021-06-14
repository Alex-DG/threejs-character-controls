import State from './State'

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

export default RunState
