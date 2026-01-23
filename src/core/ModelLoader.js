import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

/**
 * Helper class for loading and preparing 3D models.
 */
export class ModelLoader {
	/**
	 * @param {THREE.LoadingManager} [manager=THREE.DefaultLoadingManager] - The loading manager to use.
	 */
	constructor (manager = THREE.DefaultLoadingManager) {
		this.loader = new FBXLoader(manager);
	}

	/**
	 * Asynchronously loads an FBX model from the specified path.
	 * @param {string} path - The URL of the FBX model.
	 * @param {Function} [onProgress] - Callback function for loading progress.
	 * @returns {Promise<THREE.Group>} A promise that resolves to the loaded model.
	 */
	async load (path, onProgress) {
		return await this.loader.loadAsync(path, onProgress);
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
