import * as THREE from 'three';
import { CONFIG } from '../Config';

/**
 * Handles character movement, rotation, and jumping physics.
 */
export class CharacterController {
	/**
	 * @param {THREE.Object3D} model - The character model to control.
	 * @param {InputManager} inputManager - The input manager for movement data.
	 * @param {THREE.Camera} camera - The camera used to determine movement direction.
	 */
	constructor (model, inputManager, camera) {
		this.model = model;
		this.input = inputManager;
		this.camera = camera;

		// Jump state
		this.isJumping = false;
		this.jumpVelocity = 0;
		this.groundY = 0;
	}

	/**
	 * Initiates a jump if the character is not already jumping.
	 * @returns {boolean} True if the jump was started, false otherwise.
	 */
	startJump () {
		if (this.isJumping) return false;

		this.isJumping = true;
		this.jumpVelocity = CONFIG.physics.jumpForce;
		this.groundY = this.model.position.y;
		return true;
	}

	/**
	 * Updates character physics and movement.
	 * @param {number} dt - Delta time in seconds.
	 */
	update (dt) {
		this._updateJumpPhysics(dt);
		this._updateMovement(dt);
	}

	/**
	 * Updates the vertical position of the character during a jump.
	 * @param {number} dt - Delta time in seconds.
	 * @private
	 */
	_updateJumpPhysics (dt) {
		if (!this.isJumping) return;

		this.jumpVelocity += CONFIG.physics.gravity * dt;
		this.model.position.y += this.jumpVelocity * dt;

		// Check if landed
		if (this.model.position.y <= this.groundY) {
			this.model.position.y = this.groundY;
			this.isJumping = false;
			this.jumpVelocity = 0;
		}
	}

	/**
	 * Updates character horizontal movement and rotation based on inputs.
	 * @param {number} dt - Delta time in seconds.
	 * @private
	 */
	_updateMovement (dt) {
		const moveDir = this.input.getMovementDirection(this.camera);
		if (!moveDir) return;

		// Calculate speed based on state
		const speed = this._getCurrentSpeed();

		// Rotate character towards movement direction
		const targetRotation = Math.atan2(moveDir.x, moveDir.z);
		let delta = targetRotation - this.model.rotation.y;

		// Normalize angle delta
		while (delta < -Math.PI) delta += Math.PI * 2;
		while (delta > Math.PI) delta -= Math.PI * 2;

		this.model.rotation.y += delta * CONFIG.character.rotationSpeed * dt;

		// Move character
		this.model.position.add(moveDir.clone().multiplyScalar(speed * dt));
	}

	/**
	 * Calculates the current movement speed based on input state.
	 * @returns {number} The current speed.
	 * @private
	 */
	_getCurrentSpeed () {
		if (!this.input.isMoving) return 0;

		if (this.input.isRunning) {
			return CONFIG.character.runSpeed;
		}

		return CONFIG.character.walkSpeed;
	}
}
