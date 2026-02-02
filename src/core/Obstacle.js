import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const COLORS = {
	hurdle: 0xffb700,
	wall: 0xff3b30,
	pillar: 0x3ad6ff
};

const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const SHARED_CYLINDER_GEOMETRY = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);

/**
 * Represents a reusable obstacle object containing both graphics and physics.
 */
export class Obstacle {
	constructor(scene, physics) {
		this.scene = scene;
		this.physics = physics;

		this.material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			emissive: 0x111111,
			roughness: 0.35,
			metalness: 0.2
		});

		this.mesh = new THREE.Mesh(SHARED_BOX_GEOMETRY, this.material);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		this.body = new CANNON.Body({
			mass: 0,
			material: this.physics.defaultMaterial,
			collisionFilterGroup: 1
		});

		this.mesh.userData.physicsBody = this.body;
		this.type = 'hurdle';
	}

	spawn(options) {
		const {
			type = 'hurdle',
			width = 2,
			height = 2,
			length = 1,
			radius = 0.6,
			posX = 0,
			posY = 0,
			posZ = 0
		} = options;

		this.type = type;

		if (this.body.shapes.length > 0) {
			this.body.removeShape(this.body.shapes[0]);
		}

		if (type === 'pillar') {
			this.mesh.geometry = SHARED_CYLINDER_GEOMETRY;
			this.mesh.scale.set(radius * 2, height, radius * 2);
			const shape = new CANNON.Cylinder(radius, radius, height, 12);
			this.body.addShape(shape);
		} else {
			this.mesh.geometry = SHARED_BOX_GEOMETRY;
			this.mesh.scale.set(width, height, length);
			const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, length / 2));
			this.body.addShape(shape);
		}

		this.mesh.position.set(posX, posY, posZ);
		this.body.position.set(posX, posY, posZ);

		const color = COLORS[type] ?? 0xffffff;
		this.material.color.setHex(color);
		this.material.emissive.setHex(color);

		this.body.updateBoundingRadius();
		this.body.aabbNeedsUpdate = true;

		this.scene.add(this.mesh);
		this.physics.addBody(this.body);
	}

	despawn() {
		this.scene.remove(this.mesh);
		this.physics.removeBody(this.body);
	}

	dispose() {
		this.despawn();
		if (this.material) this.material.dispose();
	}
}
