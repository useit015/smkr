import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
/**
 * Helper class for loading and preparing 3D models.
 */
export class ModelLoader {
	/**
	 * @param {THREE.LoadingManager} [manager=THREE.DefaultLoadingManager] - The loading manager to use.
	 */
	constructor (manager = THREE.DefaultLoadingManager) {
		this.fbxLoader = new FBXLoader(manager);
		this.gltfLoader = new GLTFLoader(manager);
	}

	/**
	 * Asynchronously loads a model (FBX or GLB/GLTF) from the specified path.
	 * @param {string} path - The URL of the model.
	 * @param {Function} [onProgress] - Callback function for loading progress.
	 * @returns {Promise<THREE.Group|Object>} A promise that resolves to the loaded model or GLTF object.
	 */
	async load (path, onProgress) {
		const extension = path.split('.').pop().toLowerCase();

		if (extension === 'fbx') {
			return await this.fbxLoader.loadAsync(path, onProgress);
		} else if (extension === 'glb' || extension === 'gltf') {
			const gltf = await this.gltfLoader.loadAsync(path, onProgress);
			// We return the whole gltf object so we can access animations
			return gltf;
		} else {
			throw new Error(`Unsupported model extension: ${ extension }`);
		}
	}

	/**
	 * Prepares an animation clip to match the target model's skeleton.
	 * Renames tracks to match the hierarchy of the target model.
	 * @param {THREE.AnimationClip} clip - The source animation clip.
	 * @param {THREE.Object3D} model - The target model.
	 * @returns {THREE.AnimationClip} The prepared animation clip.
	 */
	static prepareClip (clip, model) {
		clip.tracks.forEach(track => {
			const rawName = track.name.split('.')[ 0 ];
			const property = track.name.split('.')[ 1 ];
			let foundNode = null;

			model.traverse(node => {
				if (node.name.replace(/.*:/, '') === rawName.replace(/.*:/, '')) {
					foundNode = node;
				}
			});

			if (foundNode) {
				track.name = foundNode.name + '.' + property;
			}
		});

		return clip;
	}

	/**
	 * Configures all meshes within a model to cast and receive shadows.
	 * @param {THREE.Object3D} model - The model to configure.
	 */
	static setupShadows (model) {
		model.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
	}
}
