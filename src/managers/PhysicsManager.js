import * as CANNON from 'cannon-es';
import { CONFIG } from '../Config';

/**
 * Manages the Cannon.js physics world and provides utilities for adding bodies.
 */
export class PhysicsManager {
	constructor () {
		this.world = new CANNON.World();
		this.world.gravity.set(0, CONFIG.physics.gravity || -30, 0);

		// Use SAPBroadphase for performance in worlds with many objects
		this.world.broadphase = new CANNON.SAPBroadphase(this.world);

		// Allow objects to "sleep" when not moving to save CPU
		this.world.allowSleep = true;

		// Fixed time step configuration
		this.fixedTimeStep = 1 / 60;
		this.maxSubSteps = 10;

		// Default material for physics interactions
		this.defaultMaterial = new CANNON.Material('default');
		const contactMaterial = new CANNON.ContactMaterial(
			this.defaultMaterial,
			this.defaultMaterial,
			{
				friction: 0.1,
				restitution: 0.0 // No bounce by default for parkour
			}
		);
		this.world.addContactMaterial(contactMaterial);
	}

	/**
	 * Steps the physics simulation with a fixed time step.
	 * @param {number} dt - Time step in seconds from the main loop.
	 */
	update (dt) {
		// Proper fixed time step logic: fixedStep, deltaTime, maxSubsteps
		this.world.step(this.fixedTimeStep, dt, this.maxSubSteps);
	}

	/**
	 * Adds a rigid body to the physics world.
	 * @param {CANNON.Body} body - The body to add.
	 */
	addBody (body) {
		this.world.addBody(body);
	}

	/**
	 * Removes a rigid body from the physics world.
	 * @param {CANNON.Body} body - The body to remove.
	 */
	removeBody (body) {
		this.world.removeBody(body);
	}

	/**
	 * Clears all bodies from the physics world.
	 */
	clear () {
		while (this.world.bodies.length > 0) {
			this.world.removeBody(this.world.bodies[ 0 ]);
		}
	}
}
