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

export default FiniteStateMachine
