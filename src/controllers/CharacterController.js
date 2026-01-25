import * as CANNON from 'cannon-es';
import { CONFIG } from '../Config';

/**
 * Handles character movement, rotation, and jumping physics using Cannon.js.
 */
export class CharacterController {
	/**
	 * @param {THREE.Object3D} model - The character model to control.
	 * @param {InputManager} inputManager - The input manager for movement data.
	 * @param {THREE.Camera} camera - The camera used to determine movement direction.
	 * @param {PhysicsManager} physicsManager - The physics manager.
	 * @param {Function} [onGameOver] - Callback for when the character falls.
	 */
	constructor (model, inputManager, camera, physicsManager, onGameOver = null) {
		this.model = model;
		this.input = inputManager;
		this.camera = camera;
		this.physicsManager = physicsManager;
		this.onGameOver = onGameOver;

		// Physics State
		this.isGrounded = true;
		this.isJumping = false;
		this.isFalling = false;
		this.isDead = false;

		// Timing and Debounce
		this._jumpTime = 0; // Time when last jump started
		this._jumpCooldown = 0.2; // Minimum time between jumps (seconds)

		this._initPhysicsBody();
	}

	_initPhysicsBody () {
		// Create a capsule-like collider using a cylinder and two spheres
		// Total height: 2 units, Radius: 0.5 units
		const radius = 0.5;
		const cylinderHeight = 1.0;

		this.body = new CANNON.Body({
			mass: 1, // Dynamic
			fixedRotation: true, // Don't let the character roll like a ball
			material: this.physicsManager.defaultMaterial,
			collisionFilterGroup: 2, // Character group
			collisionFilterMask: 1, // Only collide with platforms (Group 1)
			linearDamping: 0.1,
			angularDamping: 0.1
		});

		const sphereShape = new CANNON.Sphere(radius);
		const cylinderShape = new CANNON.Cylinder(radius, radius, cylinderHeight, 12);

		// Add cylinder (centered at 0,0,0 by default in Cannon)
		this.body.addShape(cylinderShape);
		// Add top sphere
		this.body.addShape(sphereShape, new CANNON.Vec3(0, cylinderHeight / 2, 0));
		// Add bottom sphere
		this.body.addShape(sphereShape, new CANNON.Vec3(0, -cylinderHeight / 2, 0));

		// Initial position: center of capsule at Y = cylinderHeight/2 + radius
		this.body.position.set(0, (cylinderHeight / 2) + radius, 0);
		this.physicsManager.addBody(this.body);

		// Store reference back
		this.body.userData = { controller: this };
	}

	startJump () {
		if (this.isDead || !this.isGrounded) return false;

		const now = performance.now() / 1000;
		if (now - this._jumpTime < this._jumpCooldown) return false;

		// Ensure body is awake for the impulse
		this.body.wakeUp();

		// Apply vertical velocity for jump
		this.body.velocity.y = CONFIG.physics.jumpForce;
		this.isJumping = true;
		this.isGrounded = false;
		this._jumpTime = now;
		return true;
	}

	/**
	 * Combined check for grounding using raycasting and velocity.
	 * @private
	 */
	_updateGroundState () {
		// 1. Multi-Raycast check for better reliability on edges
		const { footprintRadius, rayLength, startYOffset } = CONFIG.character.grounding;
		const startY = this.body.position.y + startYOffset;

		const rayPoints = [
			new CANNON.Vec3(this.body.position.x, startY, this.body.position.z),
			new CANNON.Vec3(this.body.position.x + footprintRadius, startY, this.body.position.z),
			new CANNON.Vec3(this.body.position.x - footprintRadius, startY, this.body.position.z),
			new CANNON.Vec3(this.body.position.x, startY, this.body.position.z + footprintRadius),
			new CANNON.Vec3(this.body.position.x, startY, this.body.position.z - footprintRadius),
		];

		let hasPhysicsGround = false;
		const raycastResult = new CANNON.RaycastResult();

		for (const start of rayPoints) {
			const end = new CANNON.Vec3(start.x, start.y - rayLength, start.z);
			this.physicsManager.world.raycastClosest(start, end, {
				collisionFilterMask: 1,
				skipBackfaces: true
			}, raycastResult);

			if (raycastResult.hasHit) {
				hasPhysicsGround = true;
				break;
			}
		}

		// 2. Velocity check (don't land if flying up fast)
		const isMovingUp = this.body.velocity.y > 0.1;

		// 3. Jump Cooldown check (don't land immediately after jumping)
		const now = performance.now() / 1000;
		const inJumpWindow = (now - this._jumpTime) < 0.1;

		this.isGrounded = hasPhysicsGround && !isMovingUp && !inJumpWindow;
	}

	update (dt) {
		if (this.isDead) return;

		this._updateGroundState();
		this._updateMovement(dt);
		this._syncModel();
		this._checkGameOver();
		this._updateFlags();
	}

	_updateMovement (dt) {
		const moveDir = this.input.getMovementDirection(this.camera);
		const speed = this._getCurrentSpeed();

		if (moveDir) {
			// Set horizontal velocity
			this.body.velocity.x = moveDir.x * speed;
			this.body.velocity.z = moveDir.z * speed;
			this.body.wakeUp(); // Ensure character is responsive

			// Rotate character towards movement direction
			const targetRotation = Math.atan2(moveDir.x, moveDir.z);
			let delta = targetRotation - this.model.rotation.y;

			// Normalize angle delta
			while (delta < -Math.PI) delta += Math.PI * 2;
			while (delta > Math.PI) delta -= Math.PI * 2;

			this.model.rotation.y += delta * CONFIG.character.rotationSpeed * dt;
		} else {
			// Stop horizontal movement quickly (friction)
			this.body.velocity.x *= 0.9;
			this.body.velocity.z *= 0.9;
		}
	}

	_syncModel () {
		// Copy position from physics body to Three.js model
		// Offset Y by radius to keep model on top of sphere
		this.model.position.set(
			this.body.position.x,
			this.body.position.y - 1.0, // Sub radius
			this.body.position.z
		);
	}

	_updateFlags () {
		const vy = this.body.velocity.y;

		// We are falling if not grounded and moving down
		this.isFalling = !this.isGrounded && vy < -0.1;

		// isJumping is a state that persists until we land
		if (this.isGrounded) {
			this.isJumping = false;
		}
	}

	_checkGameOver () {
		if (this.model.position.y < -20) {
			this._triggerGameOver();
		}
	}

	_triggerGameOver () {
		if (this.isDead) return;
		this.isDead = true;
		if (this.onGameOver) this.onGameOver();
	}

	/**
	 * Resets the controller state and model position for a new game.
	 */
	reset () {
		this.isDead = false;
		this.isJumping = false;
		this.isFalling = false;

		if (this.body) {
			this.body.position.set(0, 2.0, 0); // Start slightly above floor to avoid overlap
			this.body.velocity.set(0, 0, 0);
			this.body.angularVelocity.set(0, 0, 0);
			this.body.wakeUp();
		}

		if (this.model) {
			this.model.position.set(0, 0, 0);
			this.model.rotation.set(0, Math.PI, 0); // Face the track (-Z)
		}
	}

	_getCurrentSpeed () {
		if (!this.input.isMoving) return 0;

		// Calculate difficulty-based speed boost
		const difficulty = Math.min(1.0, Math.abs(this.body.position.z) / 5000);
		const speedBoost = 1.0 + difficulty * 0.5; // Up to 50% faster

		const baseSpeed = this.input.isRunning ? CONFIG.character.runSpeed : CONFIG.character.walkSpeed;
		return baseSpeed * speedBoost;
	}
}

