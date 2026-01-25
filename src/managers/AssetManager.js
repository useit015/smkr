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

		// Load main model
		const model = await this.loader.load(config.models.idle);
		model.scale.setScalar(CONFIG.character.scale);
		ModelLoader.setupShadows(model);

		// Load animations in parallel
		const [ walkingFBX, runFBX, jumpStaticFBX, jumpMoveFBX, fallFBX, floatingFBX ] = await Promise.all([
			this.loader.load(config.models.walking),
			this.loader.load(config.models.run),
			this.loader.load(config.models.jumpStatic),
			this.loader.load(config.models.jumpMove),
			this.loader.load(config.models.fall),
			this.loader.load(config.models.floating)
		]);

		const animations = {
			idle: ModelLoader.prepareClip(model.animations[ 0 ], model),
			walk: ModelLoader.prepareClip(walkingFBX.animations[ 0 ], model),
			run: ModelLoader.prepareClip(runFBX.animations[ 0 ], model),
			jump_static: ModelLoader.prepareClip(jumpStaticFBX.animations[ 0 ], model),
			jump_move: ModelLoader.prepareClip(jumpMoveFBX.animations[ 0 ], model),
			fall: ModelLoader.prepareClip(fallFBX.animations[ 0 ], model),
			floating: ModelLoader.prepareClip(floatingFBX.animations[ 0 ], model)
		};

		return { model, animations };
	}
}
