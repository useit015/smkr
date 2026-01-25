import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const COLORS = [0x00ffff, 0xff00ff, 0x39ff14]; // Cyan, Magenta, Lime Green

// Shared geometry for all box platforms to save memory and allow BVH reuse
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
let boundsComputed = false;

const PLATFORM_VERTEX_SHADER = `
	varying vec2 vUv;
	varying vec3 vNormal;
	void main() {
		vUv = uv;
		vNormal = normalize(normalMatrix * normal);
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const PLATFORM_FRAGMENT_SHADER = `
	uniform vec3 baseColor;
	uniform vec3 neonColor;
	uniform float time;
	varying vec2 vUv;
	varying vec3 vNormal;

	void main() {
		// Create a grid/wireframe effect based on UVs
		float thickness = 0.05;
		vec2 smoothUv = smoothstep(0.0, thickness, vUv) * (1.0 - smoothstep(1.0 - thickness, 1.0, vUv));
		float edge = 1.0 - (smoothUv.x * smoothUv.y);

		// Add some subtle pulse to the neon
		float pulse = 0.8 + 0.2 * sin(time * 3.0);
		vec3 finalNeon = neonColor * pulse;

		// Combine base and neon
		vec3 color = mix(baseColor, finalNeon, edge);

		// Add simple rim lighting for depth
		float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
		color += finalNeon * pow(rim, 3.0) * 0.5;

		gl_FragColor = vec4(color, 1.0);
	}
`;

/**
 * Represents a reusable platform object containing both graphics and physics.
 */
export class Platform {
	constructor(scene, physics) {
		this.scene = scene;
		this.physics = physics;

		if (!boundsComputed && SHARED_BOX_GEOMETRY.computeBoundsTree) {
			SHARED_BOX_GEOMETRY.computeBoundsTree();
			boundsComputed = true;
		}

		// 1. Create Graphics using shared unit box (1x1x1)
		// We use a single ShaderMaterial to handle both the base and the neon edges
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				baseColor: { value: new THREE.Color(0x050505) },
				neonColor: { value: new THREE.Color(0x00ffff) },
				time: { value: 0 }
			},
			vertexShader: PLATFORM_VERTEX_SHADER,
			fragmentShader: PLATFORM_FRAGMENT_SHADER
		});

		this.mesh = new THREE.Mesh(SHARED_BOX_GEOMETRY, this.material);
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;

		// 2. Physics Body (Wireframe is now handled by the shader)
		this.body = new CANNON.Body({
			mass: 0, // Static
			material: this.physics.defaultMaterial,
			collisionFilterGroup: 1, // Platform group
		});
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

		// Update Shader Color
		const color = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
		this.material.uniforms.neonColor.value.copy(color);

		// Update Physics
		// Remove old shape and add a new one with correct dimensions
		if (this.body.shapes.length > 0) {
			this.body.removeShape(this.body.shapes[0]);
		}
		const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, length / 2));
		this.body.addShape(shape);

		this.body.position.set(posX, posY, posZ);

		// Ensure body is updated
		this.body.updateBoundingRadius();
		this.body.aabbNeedsUpdate = true;

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
	 * Updates the material uniforms (e.g., for time-based effects).
	 * @param {number} time - Current game time.
	 */
	update(time) {
		if (this.material && this.material.uniforms) {
			this.material.uniforms.time.value = time;
		}
	}

	/**
	 * Fully disposes of the platform's resources.
	 */
	dispose() {
		this.despawn();
		// We don't dispose SHARED_BOX_GEOMETRY here as it's shared
		if (this.material) this.material.dispose();
	}
}
