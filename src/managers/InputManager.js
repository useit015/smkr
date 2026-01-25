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
			KeyW: false,
			KeyS: false,
			KeyA: false,
			KeyD: false,
			ShiftLeft: false,
			ShiftRight: false,
			Space: false
		};

		// Reusable vectors to avoid allocations in the update loop
		this._forward = new THREE.Vector3();
		this._right = new THREE.Vector3();
		this._moveDir = new THREE.Vector3();

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
			this.keys.ArrowLeft || this.keys.ArrowRight ||
			this.keys.KeyW || this.keys.KeyS ||
			this.keys.KeyA || this.keys.KeyD;
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

		// Calculate forward vector from camera orientation
		this._forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
		this._forward.y = 0;
		this._forward.normalize();

		// Calculate right vector from camera orientation
		this._right.set(1, 0, 0).applyQuaternion(camera.quaternion);
		this._right.y = 0;
		this._right.normalize();

		// Reset and calculate direction
		this._moveDir.set(0, 0, 0);

		if (this.keys.ArrowUp || this.keys.KeyW) this._moveDir.add(this._forward);
		if (this.keys.ArrowDown || this.keys.KeyS) this._moveDir.sub(this._forward);
		if (this.keys.ArrowLeft || this.keys.KeyA) this._moveDir.sub(this._right);
		if (this.keys.ArrowRight || this.keys.KeyD) this._moveDir.add(this._right);

		if (this._moveDir.lengthSq() > 0) {
			return this._moveDir.normalize();
		}

		return null;
	}

	/**
	 * Removes keyboard event listeners.
	 */
	dispose () {
		window.removeEventListener('keydown', this._onKeyDown);
		window.removeEventListener('keyup', this._onKeyUp);
	}
}
