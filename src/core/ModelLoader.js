import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class ModelLoader {
	constructor (manager = THREE.DefaultLoadingManager) {
		this.loader = new FBXLoader(manager);
	}

	async load (path, onProgress) {
		return await this.loader.loadAsync(path, onProgress);
	}

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

	static setupShadows (model) {
		model.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
	}
}
