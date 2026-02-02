import { setupAtmosphere } from '../core/WorldGenerator';
import { Platform } from '../core/Platform';
import { Obstacle } from '../core/Obstacle';
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
		this.activeObstacles = [];
		this.obstaclePool = [];

		this.patternQueue = [];

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
	 * @param {number} time - Current game time.
	 */
	update (playerPos, time = 0) {
		if (!playerPos) return;

		// 1. Spawn ahead
		if (Math.abs(this.lastPlatformZ - playerPos.z) < this.spawnDistance) {
			this._spawn();
		}

		// 2. Update active platforms and Cleanup behind
		for (let i = this.activePlatforms.length - 1; i >= 0; i--) {
			const platform = this.activePlatforms[ i ];

			// Update animations/shaders
			if (time > 0) platform.update(time);

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
		let difficulty = 0;

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
			// Calculate difficulty factor (0.0 to 1.0) based on distance
			difficulty = Math.min(1.0, Math.abs(this.lastPlatformZ) / 5000);

			let patternStep = null;
			if (this.patternQueue.length === 0 && Math.random() < 0.35) {
				this.patternQueue = this._createPattern(difficulty);
			}
			if (this.patternQueue.length > 0) {
				patternStep = this.patternQueue.shift();
			}

			// 1. Determine next platform dimensions - tuned for parkour
			const minWidth = Math.max(2.5, 5.5 - difficulty * 3.5);
			const maxWidth = Math.max(minWidth + 0.5, 9 - difficulty * 2.5);
			const width = patternStep?.width ?? (minWidth + Math.random() * (maxWidth - minWidth));
			const height = patternStep?.height ?? (1 + Math.random() * 2);
			const length = patternStep?.length ?? (8 + Math.random() * 12);

			// 2. Determine Y Offset (Height change)
			const yJump = patternStep?.yDelta ?? ((Math.random() - 0.4) * (4 + difficulty * 6));
			const nextY = Math.max(-12, Math.min(22, this.lastPlatformY + yJump));
			const actualYDiff = nextY - this.lastPlatformY;

			// 3. Rule-based Gap calculation - Gaps increase with difficulty
			let minGap = 5.5 + difficulty * 4;
			let maxGap = 10 + difficulty * 7;

			if (actualYDiff > 2) {
				maxGap = minGap + 2.5;
			} else if (actualYDiff < -3) {
				maxGap += 3.5;
			}

			const gap = patternStep?.gap ?? (minGap + Math.random() * (maxGap - minGap));

			// 4. Horizontal (X) limit
			const xShift = patternStep?.xDelta ?? ((Math.random() - 0.5) * 9);
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
		platform.obstacles = [];
		this.activePlatforms.push(platform);

		if (!isFirst) this._spawnObstacles(platform, difficulty);

		events.emit(EVENTS.PLATFORM_SPAWN, platform);
	}

	_removePlatform(index) {
		const platform = this.activePlatforms[index];
		if (platform && platform.obstacles) {
			platform.obstacles.forEach((obstacle) => this._removeObstacle(obstacle));
			platform.obstacles = [];
		}
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
		while (this.activeObstacles.length > 0) {
			this._removeObstacle(this.activeObstacles[0]);
		}
		this.lastPlatformZ = 0;
		this.lastPlatformY = 0;
		this.lastPlatformX = 0;
	}

	_createPattern(difficulty) {
		const patterns = [
			() => {
				const steps = 3 + Math.floor(Math.random() * 3);
				return Array.from({ length: steps }, (_, i) => ({
					width: 4.5 - difficulty * 1.5,
					length: 9 + Math.random() * 4,
					gap: 6 + Math.random() * 2,
					yDelta: 1.5 + Math.random() * 1.5,
					xDelta: (Math.random() - 0.5) * 1.5
				}));
			},
			() => {
				const steps = 3 + Math.floor(Math.random() * 3);
				return Array.from({ length: steps }, (_, i) => ({
					width: 4.5 - difficulty * 1.5,
					length: 9 + Math.random() * 5,
					gap: 6 + Math.random() * 2.5,
					yDelta: -(1.5 + Math.random() * 1.5),
					xDelta: (Math.random() - 0.5) * 1.5
				}));
			},
			() => {
				const steps = 4 + Math.floor(Math.random() * 3);
				return Array.from({ length: steps }, (_, i) => ({
					width: 4 + Math.random() * 2,
					length: 8 + Math.random() * 4,
					gap: 6 + Math.random() * 3,
					yDelta: (Math.random() - 0.5) * 2,
					xDelta: (i % 2 === 0 ? 1 : -1) * (3 + Math.random() * 2)
				}));
			},
			() => {
				return [
					{
						width: 6 + Math.random() * 2,
						length: 12 + Math.random() * 4,
						gap: 10 + Math.random() * 3,
						yDelta: (Math.random() - 0.5) * 1.5,
						xDelta: (Math.random() - 0.5) * 2
					}
				];
			}
		];

		const pattern = patterns[Math.floor(Math.random() * patterns.length)];
		return pattern();
	}

	_spawnObstacles(platform, difficulty) {
		const chance = 0.35 + difficulty * 0.35;
		if (Math.random() > chance) return;

		const width = platform.mesh.scale.x;
		const length = platform.mesh.scale.z;

		if (width < 3.5 || length < 6) return;

		const obstacleCount = Math.random() < 0.6 ? 1 : 2;

		for (let i = 0; i < obstacleCount; i++) {
			const typeRoll = Math.random();
			let type = 'hurdle';
			if (typeRoll > 0.75) type = 'pillar';
			else if (typeRoll > 0.45) type = 'wall';

			const paddingX = Math.max(1.2, width * 0.25);
			const paddingZ = Math.max(1.5, length * 0.3);

			const posX = platform.mesh.position.x + (Math.random() - 0.5) * (width - paddingX);
			const posZ = platform.mesh.position.z + (Math.random() - 0.5) * (length - paddingZ);
			const baseY = platform.mesh.position.y + platform.mesh.scale.y / 2;

			let config = {};

			if (type === 'pillar') {
				const radius = 0.4 + Math.random() * 0.4;
				const height = 3 + Math.random() * 2.5;
				config = { type, radius, height };
			} else if (type === 'wall') {
				const wallWidth = Math.max(1.8, Math.min(3.2, width * 0.6));
				const wallHeight = 2 + Math.random() * 1.5;
				const wallDepth = 0.6 + Math.random() * 0.4;
				config = { type, width: wallWidth, height: wallHeight, length: wallDepth };
			} else {
				const hurdleWidth = Math.max(1.5, Math.min(3.5, width * 0.5));
				const hurdleHeight = 1.2 + Math.random() * 0.7;
				const hurdleDepth = 0.6 + Math.random() * 0.4;
				config = { type, width: hurdleWidth, height: hurdleHeight, length: hurdleDepth };
			}

			const obstacle = this._getObstacleFromPool();
			obstacle.spawn({
				...config,
				posX,
				posY: baseY + (config.height ?? 1) / 2,
				posZ
			});

			this.activeObstacles.push(obstacle);
			platform.obstacles.push(obstacle);
		}
	}

	_getObstacleFromPool() {
		if (this.obstaclePool.length > 0) {
			return this.obstaclePool.pop();
		}
		return new Obstacle(this.scene, this.physics);
	}

	_removeObstacle(obstacle) {
		const index = this.activeObstacles.indexOf(obstacle);
		if (index >= 0) this.activeObstacles.splice(index, 1);
		obstacle.despawn();
		this.obstaclePool.push(obstacle);
	}

	getStateSummary() {
		return {
			platforms: this.activePlatforms.map((platform) => ({
				x: Number(platform.mesh.position.x.toFixed(2)),
				y: Number(platform.mesh.position.y.toFixed(2)),
				z: Number(platform.mesh.position.z.toFixed(2)),
				width: Number(platform.mesh.scale.x.toFixed(2)),
				height: Number(platform.mesh.scale.y.toFixed(2)),
				length: Number(platform.mesh.scale.z.toFixed(2))
			})),
			obstacles: this.activeObstacles.map((obstacle) => ({
				type: obstacle.type,
				x: Number(obstacle.mesh.position.x.toFixed(2)),
				y: Number(obstacle.mesh.position.y.toFixed(2)),
				z: Number(obstacle.mesh.position.z.toFixed(2)),
				w: Number(obstacle.mesh.scale.x.toFixed(2)),
				h: Number(obstacle.mesh.scale.y.toFixed(2)),
				l: Number(obstacle.mesh.scale.z.toFixed(2))
			}))
		};
	}
}
