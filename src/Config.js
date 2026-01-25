function createGetModelPath (id) {
	return (model) => `/models/${ id }/${ model }.fbx`;
}

function createCharacter (id) {
	const getModelPath = createGetModelPath(id);

	return {
		name: id.charAt(0).toUpperCase() + id.slice(1),
		id,
		models: {
			run: getModelPath('run'),
			idle: getModelPath('idle'),
			walking: getModelPath('walk'),
			jumpMove: getModelPath('jump_move'),
			jumpStatic: getModelPath('jump_static'),
			fall: getModelPath('fall'),
			floating: getModelPath('floating'),
		}
	};
}

/**
 * Global game configuration object.
 * Contains settings for scene, camera, controls, lighting, character physics, and assets.
 * @type {Object}
 */
export const CONFIG = {
	// Scene
	scene: {
		backgroundColor: 0x222222,
		fogNear: 50,
		fogFar: 200,
		shadowQuality: 'high'
	},

	// Camera
	camera: {
		fov: 75,
		near: 0.1,
		far: 2000,
		initialOffset: { x: 0, y: 8, z: 15 },
		chaseDistance: 15,
		chaseHeight: 8,
		smoothFactor: 0.1,
		targetOffset: { x: 0, y: 3, z: 0 },
		presets: {
			close: { distance: 8, height: 4 },
			medium: { distance: 12, height: 6 },
			far: { distance: 24, height: 12 }
		}
	},

	// Controls
	controls: {
		dampingFactor: 0.05,
		minDistance: 5,
		maxDistance: 100,
		mouseSensitivity: 5
	},

	// Lighting
	lighting: {
		ambient: { color: 0xffffff, intensity: 0.8 },
		directional: { color: 0xffffff, intensity: 1.2, position: { x: 20, y: 40, z: 20 } }
	},

	// Floor
	floor: {
		size: 5000,
		color: 0x444444,
		gridDivisions: 500,
		gridColor1: 0x888888,
		gridColor2: 0x333333
	},

	// Character
	character: {
		scale: 0.04,
		walkSpeed: 8.0,
		runSpeed: 18.0,
		rotationSpeed: 10.0
	},

	// Physics
	physics: {
		gravity: -30,
		jumpForce: 10
	},

	// Animation
	animation: {
		crossFadeDuration: 0.3,
		jumpFadeDuration: 0.1
	},

	// Model paths
	characters: {
		// jamal: createCharacter('jamal'),
		said: createCharacter('said'),
	},

	// Sound paths
	sounds: {
		walk: '/sounds/walk.mp3',
		run: '/sounds/run.mp3',
		jump: '/sounds/jump.mp3',
		background: '/sounds/background.mp3'
	}
};
