import { setupAtmosphere, createPlatform } from '../core/WorldGenerator';

/**
 * Manages the procedural world generation with dynamic spawning and despawning.
 */
export class WorldManager {
	constructor (scene, physics) {
		this.scene = scene;
		this.physics = physics;

		this.activePlatforms = [];
		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;
		this.lastPlatformX = 0;

		this.spawnDistance = 250; // Distance ahead of player to spawn
		this.despawnDistance = 50; // Distance behind player to despawn
	}

	/**
	 * Initializes the first set of platforms.
	 */
	generate () {
		this.cleanup();
		setupAtmosphere(this.scene);

		// Initial spawning
		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;

		// Create starting platform
		this._spawn(true);

		// Fill initially
		while (Math.abs(this.lastPlatformZ) < this.spawnDistance) {
			this._spawn();
		}
	}

	/**
	 * Updates the world by spawning new platforms and removing old ones.
	 * @param {THREE.Vector3} playerPos - The current player position.
	 */
	update (playerPos) {
		if (!playerPos) return;

		// 1. Spawn ahead
		if (Math.abs(this.lastPlatformZ - playerPos.z) < this.spawnDistance) {
			this._spawn();
		}

		// 2. Cleanup behind
		for (let i = this.activePlatforms.length - 1; i >= 0; i--) {
			const platform = this.activePlatforms[ i ];
			if (platform.mesh.position.z > playerPos.z + this.despawnDistance) {
				this._removePlatform(i);
			}
		}
	}

	/**
	 * Spawns a new platform following the procedural rules.
	 * @private
	 */
	_spawn (isFirst = false) {
		let options = {};

		if (isFirst) {
			options = {
				width: 15,
				height: 2,
				length: 30,
				posX: 0,
				posY: -1,
				posZ: 0
			};
			this.lastPlatformY = -1;
			this.lastPlatformZ = 0;
		} else {
			// 1. Determine next platform length (variety)
			const length = 10 + Math.random() * 15;

			// 2. Determine Y Offset (Height change)
			// Higher chance for small changes, with limits
			const yJump = (Math.random() - 0.4) * 5; // Favors slightly upward but with big drops
			const nextY = Math.max(-10, Math.min(15, this.lastPlatformY + yJump));
			const actualYDiff = nextY - this.lastPlatformY;

			// 3. Rule-based Gap calculation
			// If jumping UP (actualYDiff > 0), gap must be tighter.
			// If jumping DOWN (actualYDiff < 0), gap can be wider.
			// Physics context: runSpeed 18, jumpForce 12 -> max flat jump ~14 units.
			let minGap = 6;
			let maxGap = 11;

			if (actualYDiff > 2) {
				maxGap = 8; // Steep climb: very tight gap
			} else if (actualYDiff < -3) {
				maxGap = 16; // Big drop: can fly further
			}

			const gap = minGap + Math.random() * (maxGap - minGap);

			// 4. Horizontal (X) limit
			// Prevent platforms from zig-zagging too far to the sides (max 8 units from center)
			const xShift = (Math.random() - 0.5) * 8;
			const nextX = Math.max(-8, Math.min(8, this.lastPlatformX + xShift));

			// Update tracking state
			this.lastPlatformY = nextY;
			this.lastPlatformX = nextX;
			this.lastPlatformZ -= (length / 2 + gap);

			options = {
				length,
				posX: this.lastPlatformX,
				posY: this.lastPlatformY - 1, // Compensate for collider centering
				posZ: this.lastPlatformZ
			};

			// Move forward for the next gap calculation
			this.lastPlatformZ -= (length / 2);
		}

		const platformData = createPlatform(this.scene, this.physics, options);
		this.activePlatforms.push(platformData);
	}

	_removePlatform (index) {
		const platform = this.activePlatforms[ index ];

		// Physics Cleanup
		if (platform.mesh.userData.physicsBody) {
			this.physics.removeBody(platform.mesh.userData.physicsBody);
		}

		// Graphics Cleanup
		this.scene.remove(platform.mesh);

		// The Game instance is responsible for recursive material disposal 
		// if we were truly destroying everything, but for a fast runner, 
		// we should ideally POOL the meshes. For now, removing from scene is enough.

		this.activePlatforms.splice(index, 1);
	}

	/**
	 * Fully clears the world.
	 */
	cleanup () {
		while (this.activePlatforms.length > 0) {
			this._removePlatform(0);
		}
		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;
		this.lastPlatformX = 0;
	}
}
