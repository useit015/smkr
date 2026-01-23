import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CONFIG } from '../Config';

export class SceneBuilder {
	static createScene () {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(CONFIG.scene.backgroundColor);
		scene.fog = new THREE.Fog(
			CONFIG.scene.backgroundColor,
			CONFIG.scene.fogNear,
			CONFIG.scene.fogFar
		);
		return scene;
	}

	static createCamera () {
		const camera = new THREE.PerspectiveCamera(
			CONFIG.camera.fov,
			window.innerWidth / window.innerHeight,
			CONFIG.camera.near,
			CONFIG.camera.far
		);
		camera.position.set(0, 10, 20);
		return camera;
	}

	static createRenderer (canvas) {
		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;
		return renderer;
	}

	static createControls (camera, domElement) {
		const controls = new OrbitControls(camera, domElement);
		controls.enableDamping = true;
		controls.dampingFactor = CONFIG.controls.dampingFactor;
		controls.minDistance = CONFIG.controls.minDistance;
		controls.maxDistance = CONFIG.controls.maxDistance;
		controls.enablePan = false;
		return controls;
	}

	static addLighting (scene) {
		const { ambient, directional } = CONFIG.lighting;

		const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
		scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(directional.color, directional.intensity);
		dirLight.position.set(directional.position.x, directional.position.y, directional.position.z);
		dirLight.castShadow = true;

		// Configure shadow properties
		dirLight.shadow.mapSize.width = 2048; // Default to high
		dirLight.shadow.mapSize.height = 2048;
		dirLight.shadow.camera.near = 0.5;
		dirLight.shadow.camera.far = 500;
		dirLight.shadow.camera.left = -100;
		dirLight.shadow.camera.right = 100;
		dirLight.shadow.camera.top = 100;
		dirLight.shadow.camera.bottom = -100;
		dirLight.shadow.bias = -0.0005; // Fix shadow acne

		dirLight.name = 'directionalLight'; // Tag for easy retrieval
		scene.add(dirLight);
	}

	static updateShadowQuality (renderer, scene, quality) {
		const dirLight = scene.getObjectByName('directionalLight');

		if (quality === 'off') {
			renderer.shadowMap.enabled = false;
			if (dirLight) dirLight.castShadow = false;
		} else {
			renderer.shadowMap.enabled = true;
			if (dirLight) dirLight.castShadow = true;

			switch (quality) {
				case 'low':
					renderer.shadowMap.type = THREE.BasicShadowMap;
					if (dirLight) dirLight.shadow.mapSize.set(512, 512);
					break;
				case 'medium':
					renderer.shadowMap.type = THREE.PCFShadowMap;
					if (dirLight) dirLight.shadow.mapSize.set(1024, 1024);
					break;
				case 'high':
					renderer.shadowMap.type = THREE.PCFSoftShadowMap;
					if (dirLight) dirLight.shadow.mapSize.set(2048, 2048);
					break;
			}
		}

		// Force update materials
		scene.traverse((child) => {
			if (child.material) {
				child.material.needsUpdate = true;
			}
		});

		// Re-compile shadows if needed (often requires light update)
		if (dirLight && dirLight.shadow && dirLight.shadow.map) {
			dirLight.shadow.map.dispose();
			dirLight.shadow.map = null;
		}
	}

	static addFloor (scene) {
		const { size, color, gridDivisions, gridColor1, gridColor2 } = CONFIG.floor;

		const floorGeo = new THREE.PlaneGeometry(size, size);
		const floorMat = new THREE.MeshStandardMaterial({ color });
		const floor = new THREE.Mesh(floorGeo, floorMat);
		floor.rotation.x = -Math.PI / 2;
		floor.receiveShadow = true;
		scene.add(floor);

		const grid = new THREE.GridHelper(size, gridDivisions, gridColor1, gridColor2);
		grid.position.y = 0.01;
		scene.add(grid);
	}
}
