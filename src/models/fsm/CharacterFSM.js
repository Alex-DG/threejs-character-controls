import FiniteStateMachine from './FiniteStateMachine'

import DanceState from '../states/DanceState'
import RunState from '../states/RunState'
import WalkState from '../states/WalkState'
import IdleState from '../states/IdleState'

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

export default CharacterFSM
