import { setupAtmosphere } from '../core/WorldGenerator';
import { Platform } from '../core/Platform';
import { events, EVENTS } from '../core/EventEmitter';

/**
 * Manages the procedural world generation with dynamic spawning and despawning.
 * Utilizes object pooling for performance.
 */
export class WorldManager {
	constructor(scene, physics) {
		this.scene = scene;
		this.physics = physics;

		this.activePlatforms = [];
		this.pool = [];

		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;
		this.lastPlatformX = 0;

		this.spawnDistance = 250; // Distance ahead of player to spawn
		this.despawnDistance = 50; // Distance behind player to despawn
	}

	/**
	 * Initializes the first set of platforms.
	 */
	generate() {
		this.cleanup();
		setupAtmosphere(this.scene);

		// Initial spawning
		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;
		this.lastPlatformX = 0;

		// Create starting platform
		this._spawn(true);

		// Fill initially
		while (Math.abs(this.lastPlatformZ) < this.spawnDistance) {
			this._spawn();
		}

		events.emit(EVENTS.GAME_START);
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
	_spawn(isFirst = false) {
		let options = {};

		if (isFirst) {
			options = {
				width: 15,
				height: 2,
				length: 30,
				posX: 0,
				posY: -1,
				posZ: 0,
			};
			this.lastPlatformY = -1;
			this.lastPlatformZ = 0;
		} else {
			// 1. Determine next platform dimensions
			const width = 6 + Math.random() * 6;
			const height = 1 + Math.random() * 2;
			const length = 10 + Math.random() * 15;

			// 2. Determine Y Offset (Height change)
			const yJump = (Math.random() - 0.4) * 5;
			const nextY = Math.max(-10, Math.min(15, this.lastPlatformY + yJump));
			const actualYDiff = nextY - this.lastPlatformY;

			// 3. Rule-based Gap calculation
			let minGap = 6;
			let maxGap = 11;

			if (actualYDiff > 2) {
				maxGap = 8;
			} else if (actualYDiff < -3) {
				maxGap = 16;
			}

			const gap = minGap + Math.random() * (maxGap - minGap);

			// 4. Horizontal (X) limit
			const xShift = (Math.random() - 0.5) * 8;
			const nextX = Math.max(-8, Math.min(8, this.lastPlatformX + xShift));

			// Update tracking state
			this.lastPlatformY = nextY;
			this.lastPlatformX = nextX;
			this.lastPlatformZ -= length / 2 + gap;

			options = {
				width,
				height,
				length,
				posX: this.lastPlatformX,
				posY: this.lastPlatformY - 1,
				posZ: this.lastPlatformZ,
			};

			// Move forward for the next gap calculation
			this.lastPlatformZ -= length / 2;
		}

		// Use pool if available
		let platform;
		if (this.pool.length > 0) {
			platform = this.pool.pop();
		} else {
			platform = new Platform(this.scene, this.physics);
		}

		platform.spawn(options);
		this.activePlatforms.push(platform);

		events.emit(EVENTS.PLATFORM_SPAWN, platform);
	}

	_removePlatform(index) {
		const platform = this.activePlatforms[index];
		platform.despawn();

		// Add back to pool
		this.pool.push(platform);
		this.activePlatforms.splice(index, 1);

		events.emit(EVENTS.PLATFORM_DESPAWN, platform);
	}

	/**
	 * Fully clears the world.
	 */
	cleanup() {
		while (this.activePlatforms.length > 0) {
			this._removePlatform(0);
		}
		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;
		this.lastPlatformX = 0;
	}
}
