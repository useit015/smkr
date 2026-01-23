import * as THREE from 'three';

/**
 * Handles keyboard input for character movement and actions.
 */
export class InputManager {
	constructor () {
		this.keys = {
			ArrowUp: false,
			ArrowDown: false,
			ArrowLeft: false,
			ArrowRight: false,
			ShiftLeft: false,
			ShiftRight: false,
			Space: false
		};

		this._onKeyDown = this._onKeyDown.bind(this);
		this._onKeyUp = this._onKeyUp.bind(this);

		this.onJumpPressed = null; // Callback for jump

		window.addEventListener('keydown', this._onKeyDown);
		window.addEventListener('keyup', this._onKeyUp);
	}

	_onKeyDown (event) {
		if (this.keys.hasOwnProperty(event.code)) {
			const wasPressed = this.keys[ event.code ];
			this.keys[ event.code ] = true;

			// Fire jump callback only on initial press
			if (event.code === 'Space' && !wasPressed && this.onJumpPressed) {
				this.onJumpPressed();
			}
		}
	}

	_onKeyUp (event) {
		if (this.keys.hasOwnProperty(event.code)) {
			this.keys[ event.code ] = false;
		}
	}

	/**
	 * Checks if any movement keys are currently pressed.
	 * @type {boolean}
	 */
	get isMoving () {
		return this.keys.ArrowUp || this.keys.ArrowDown ||
			this.keys.ArrowLeft || this.keys.ArrowRight;
	}

	/**
	 * Checks if any run (Shift) keys are currently pressed.
	 * @type {boolean}
	 */
	get isRunning () {
		return this.keys.ShiftLeft || this.keys.ShiftRight;
	}

	/**
	 * Calculates the normalized movement direction vector relative to the camera's orientation.
	 * @param {THREE.Camera} camera - The camera to use as a reference for direction.
	 * @returns {THREE.Vector3|null} The normalized movement direction vector, or null if not moving.
	 */
	getMovementDirection (camera) {
		if (!this.isMoving) return null;

		// Camera-relative movement vectors
		const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
		forward.y = 0;
		forward.normalize();

		const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
		right.y = 0;
		right.normalize();

		const moveDir = new THREE.Vector3();
		if (this.keys.ArrowUp) moveDir.add(forward);
		if (this.keys.ArrowDown) moveDir.sub(forward);
		if (this.keys.ArrowLeft) moveDir.sub(right);
		if (this.keys.ArrowRight) moveDir.add(right);

		return moveDir.length() > 0 ? moveDir.normalize() : null;
	}

	/**
	 * Removes keyboard event listeners.
	 */
	dispose () {
		window.removeEventListener('keydown', this._onKeyDown);
		window.removeEventListener('keyup', this._onKeyUp);
	}
}
