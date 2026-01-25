import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const COLORS = [ 0x00FFFF, 0xFF00FF, 0x39FF14 ]; // Cyan, Magenta, Lime Green

/**
 * Sets up the scene background and fog for the Neon City.
 * @param {THREE.Scene} scene 
 */
export function setupAtmosphere (scene) {
	scene.background = new THREE.Color(0x000000);
	scene.fog = new THREE.FogExp2(0x000000, 0.02);

	// Add procedural starfield
	if (scene.getObjectByName('starfield')) return;

	const starGeometry = new THREE.BufferGeometry();
	const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });

	const starVertices = [];
	for (let i = 0; i < 5000; i++) {
		const x = (Math.random() - 0.5) * 1000;
		const y = (Math.random() - 0.5) * 1000;
		const z = (Math.random() - 0.5) * 1000;
		starVertices.push(x, y, z);
	}

	starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
	const stars = new THREE.Points(starGeometry, starMaterial);
	stars.name = 'starfield';
	scene.add(stars);
}

/**
 * Creates a single procedural platform and its physics body.
 * @returns {THREE.Mesh} The created platform mesh.
 */
export function createPlatform (scene, physicsManager, options = {}) {
	const {
		width = 6 + Math.random() * 6,
		height = 1 + Math.random() * 2,
		length = 10 + Math.random() * 10,
		posX = 0,
		posY = 0,
		posZ = 0
	} = options;

	// 1. Create Graphics
	const geometry = new THREE.BoxGeometry(width, height, length);
	const material = new THREE.MeshStandardMaterial({
		color: 0x000000,
		roughness: 0.1,
		metalness: 0.5
	});

	const platform = new THREE.Mesh(geometry, material);
	platform.position.set(posX, posY, posZ);
	platform.receiveShadow = true;
	platform.castShadow = true;

	// 2. Add Neon Wireframe
	const edges = new THREE.EdgesGeometry(geometry);
	const randomColor = COLORS[ Math.floor(Math.random() * COLORS.length) ];
	const lineMaterial = new THREE.LineBasicMaterial({ color: randomColor, linewidth: 2 });
	const wireframe = new THREE.LineSegments(edges, lineMaterial);
	platform.add(wireframe);

	scene.add(platform);

	// 3. Create Physics
	if (physicsManager) {
		const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, length / 2));
		const body = new CANNON.Body({
			mass: 0, // Static
			material: physicsManager.defaultMaterial,
			collisionFilterGroup: 1 // Platform group
		});
		body.addShape(shape);
		body.position.set(posX, posY, posZ);
		physicsManager.addBody(body);

		// Store reference for cleanup
		platform.userData.physicsBody = body;
	}

	return {
		mesh: platform,
		width,
		height,
		length,
		posX,
		posY,
		posZ
	};
}
