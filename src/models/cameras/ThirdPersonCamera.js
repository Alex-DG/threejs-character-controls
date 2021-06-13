import * as THREE from 'three'

class ThirdPersonCamera {
  constructor(params) {
    this.target = params.target
    this.camera = params.camera

    this.currentPosition = new THREE.Vector3()
    this.currentLookat = new THREE.Vector3()
  }

  calculateIdealOffset(x, y, z) {
    const idealOffset = new THREE.Vector3(x, y, z)
    idealOffset.applyQuaternion(this.target.rotation)
    idealOffset.add(this.target.position)
    return idealOffset
  }

  calculateIdealLookat(x, y, z) {
    const idealLookat = new THREE.Vector3(x, y, z)
    idealLookat.applyQuaternion(this.target.rotation)
    idealLookat.add(this.target.position)
    return idealLookat
  }

  /**
   * Update camera position
   *
   * @param {Float} time - in second
   */
  update(time, freeCamera = false) {
    if (freeCamera) {
      this.camera.lookAt(this.target.position)
    } else {
      const idealOffset = this.calculateIdealOffset(-15, 20, -30)
      const idealLookat = this.calculateIdealLookat(0, 10, 50)

      const a = 1.0 - Math.pow(0.001, time)

      this.currentPosition.lerp(idealOffset, a)
      this.currentLookat.lerp(idealLookat, a)

      this.camera.position.copy(this.currentPosition)
      this.camera.lookAt(this.currentLookat)
    }
  }
}

export default ThirdPersonCamera
