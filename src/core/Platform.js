import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const COLORS = [0x00ffff, 0xff00ff, 0x39ff14]; // Cyan, Magenta, Lime Green

/**
 * Represents a reusable platform object containing both graphics and physics.
 */
export class Platform {
	constructor(scene, physics) {
		this.scene = scene;
		this.physics = physics;

		// 1. Create Graphics with a unit box (1x1x1)
		// We will scale the mesh instead of recreating geometry
		this.geometry = new THREE.BoxGeometry(1, 1, 1);
		this.material = new THREE.MeshStandardMaterial({
			color: 0x000000,
			roughness: 0.1,
			metalness: 0.5,
		});

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;

		// 2. Add Neon Wireframe
		this.edges = new THREE.EdgesGeometry(this.geometry);
		this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
		this.wireframe = new THREE.LineSegments(this.edges, this.lineMaterial);
		this.mesh.add(this.wireframe);

		// 3. Create Physics Body
		this.shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
		this.body = new CANNON.Body({
			mass: 0, // Static
			material: this.physics.defaultMaterial,
			collisionFilterGroup: 1, // Platform group
		});
		this.body.addShape(this.shape);
		this.mesh.userData.physicsBody = this.body;
	}

	/**
	 * Activates and configures the platform with new dimensions and position.
	 */
	spawn(options) {
		const {
			width = 10,
			height = 2,
			length = 10,
			posX = 0,
			posY = 0,
			posZ = 0,
		} = options;

		// Update Graphics
		this.mesh.scale.set(width, height, length);
		this.mesh.position.set(posX, posY, posZ);

		// Update Wireframe color with higher intensity for bloom
		const color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
		this.lineMaterial.color.copy(color).multiplyScalar(2); // Boost intensity

		// Update Physics
		this.shape.halfExtents.set(width / 2, height / 2, length / 2);
		this.shape.updateConvexPolyhedronRepresentation();
		this.shape.updateBoundingSphereRadius();
		this.body.position.set(posX, posY, posZ);

		this.scene.add(this.mesh);
		this.physics.addBody(this.body);
	}

	/**
	 * Deactivates the platform and removes it from the scene/physics world.
	 */
	despawn() {
		this.scene.remove(this.mesh);
		this.physics.removeBody(this.body);
	}

	/**
	 * Fully disposes of the platform's resources.
	 */
	dispose() {
		this.despawn();
		this.geometry.dispose();
		this.material.dispose();
		this.edges.dispose();
		this.lineMaterial.dispose();
	}
}
