import * as THREE from 'three';
import { CONFIG } from '../Config';

export class CharacterController {
	constructor (model, inputManager, camera) {
		this.model = model;
		this.input = inputManager;
		this.camera = camera;

		// Jump state
		this.isJumping = false;
		this.jumpVelocity = 0;
		this.groundY = 0;
	}

	startJump () {
		if (this.isJumping) return false;

		this.isJumping = true;
		this.jumpVelocity = CONFIG.physics.jumpForce;
		this.groundY = this.model.position.y;
		return true;
	}

	update (dt) {
		this._updateJumpPhysics(dt);
		this._updateMovement(dt);
	}

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

	_getCurrentSpeed () {
		if (!this.input.isMoving) return 0;

		if (this.input.isRunning) {
			return CONFIG.character.runSpeed;
		}

		return CONFIG.character.walkSpeed;
	}
}
