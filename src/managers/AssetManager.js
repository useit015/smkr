import * as THREE from 'three';
import { ModelLoader } from '../core/ModelLoader';
import { CONFIG } from '../Config';

/**
 * Manages the loading and organization of game assets (models, animations).
 */
export class AssetManager {
	constructor (onProgress, onLoad) {
		this.manager = new THREE.LoadingManager();
		this.loader = new ModelLoader(this.manager);

		this.manager.onProgress = onProgress;
		this.manager.onLoad = onLoad;

		this.characters = {}; // Cache for loaded character data
	}

	/**
	 * Loads a character model and all associated animations.
	 * @param {string} characterId - The ID of the character in CONFIG.
	 * @returns {Promise<Object>} Object containing the main model and animation clips.
	 */
	async loadCharacter (characterId) {
		const config = CONFIG.characters[ characterId ];
		if (!config) throw new Error(`Character ${ characterId } not found in CONFIG`);

		// Helper to extract model and animations from either FBX or GLB result
		const processResult = (result) => {
			const model = result.scene || result;
			const animations = result.animations || model.animations || [];
			return { model, animations };
		};

		// Load main model
		const idleResult = await this.loader.load(config.models.idle);
		const { model, animations: idleAnims } = processResult(idleResult);

		model.scale.setScalar(CONFIG.character.scale);
		ModelLoader.setupShadows(model);

		// Load animations in parallel
		const animResults = await Promise.all([
			this.loader.load(config.models.walking),
			this.loader.load(config.models.run),
			this.loader.load(config.models.jumpStatic),
			this.loader.load(config.models.jumpMove),
			this.loader.load(config.models.fall),
			this.loader.load(config.models.floating)
		]);

		const [ walking, run, jumpStatic, jumpMove, fall, floating ] = animResults.map(processResult);

		const animations = {
			idle: ModelLoader.prepareClip(idleAnims[ 0 ], model),
			walk: ModelLoader.prepareClip(walking.animations[ 0 ], model),
			run: ModelLoader.prepareClip(run.animations[ 0 ], model),
			jump_static: ModelLoader.prepareClip(jumpStatic.animations[ 0 ], model),
			jump_move: ModelLoader.prepareClip(jumpMove.animations[ 0 ], model),
			fall: ModelLoader.prepareClip(fall.animations[ 0 ], model),
			floating: ModelLoader.prepareClip(floating.animations[ 0 ], model)
		};

		return { model, animations };
	}
}
