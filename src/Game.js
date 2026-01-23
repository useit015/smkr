import * as THREE from 'three';
import { CONFIG } from './Config';
import { SceneBuilder } from './core/SceneBuilder';
import { ModelLoader } from './core/ModelLoader';
import { InputManager } from './managers/InputManager';
import { CharacterController } from './controllers/CharacterController';
import { CameraController } from './controllers/CameraController';
import { AnimationController } from './animations/AnimationController';
import { AnimationStateMachine } from './animations/AnimationStateMachine';
import { SoundManager } from './managers/SoundManager';
import { StartScreen } from './ui/StartScreen';
import { PauseScreen } from './ui/PauseScreen';
import { SettingsManager } from './managers/SettingsManager';
import { SettingsUI } from './ui/SettingsUI';
import { GameUI } from './ui/GameUI';

/**
 * Main game orchestrator class.
 * Initializes the engine, manages game state, and coordinates between various systems.
 */
export class Game {
	constructor () {
		this.gameSettings = null;
		this.isPaused = false;
		this.currentCharacter = 'jamal'; // Default

		// Initialize core systems immediately
		this.initEngine();

		this._showStartScreen();
	}

	/**
	 * Initializes settings and shows the initial start screen.
	 * @private
	 */
	_showStartScreen () {
		this.settingsManager = new SettingsManager();
		this.settingsUI = new SettingsUI(this.settingsManager, (settings) => this._applySettings(settings));

		this.startScreen = new StartScreen(
			(characterId) => {
				this.gameSettings = this.settingsManager.getAll();
				this._applySettings(this.gameSettings);
				this.currentCharacter = characterId;
				this.startGame();
			},
			() => this.settingsUI.open()
		);
	}

	/**
	 * Applies game settings to various systems (graphics, controls, audio).
	 * @param {Object} settings - The settings object to apply.
	 * @private
	 */
	_applySettings (settings) {
		// Apply graphics settings
		if (settings.graphics) {
			// Render Distance
			CONFIG.camera.far = settings.graphics.renderDistance;
			CONFIG.scene.fogFar = settings.graphics.renderDistance;
			if (this.camera) this.camera.far = settings.graphics.renderDistance;
			if (this.scene && this.scene.fog) this.scene.fog.far = settings.graphics.renderDistance;
			if (this.camera) this.camera.updateProjectionMatrix();

			// Shadow Quality
			if (this.renderer && this.scene) {
				SceneBuilder.updateShadowQuality(this.renderer, this.scene, settings.graphics.shadowQuality);
			}

			// Save to global config for other components to access
			CONFIG.scene.shadowQuality = settings.graphics.shadowQuality;
		}

		// Apply controls settings
		if (settings.controls) {
			CONFIG.controls.mouseSensitivity = settings.controls.mouseSensitivity;
		}

		// Apply audio settings
		if (settings.audio && this.soundManager) {
			const master = settings.audio.masterVolume / 100;
			const sfx = settings.audio.sfxVolume / 100;
			const music = settings.audio.musicVolume / 100;

			this.soundManager.setMasterVolume(master);
			this.soundManager.setSfxVolume(sfx);
			this.soundManager.setMusicVolume(music);
		}

		// Apply settings to pause screen if it exists
		if (this.pauseScreen) {
			// This will be handled by the update loop reading from settings manager,
			// or we could explicitly update if needed.
		}
	}

	/**
	 * Initializes the Three.js engine and core managers.
	 * Sets up scene, camera, renderer, lighting, and inputs.
	 */
	initEngine () {
		// Create core Three.js components
		this.scene = SceneBuilder.createScene();
		this.camera = SceneBuilder.createCamera();
		this.renderer = SceneBuilder.createRenderer(document.querySelector('#game-canvas'));
		this.controls = SceneBuilder.createControls(this.camera, this.renderer.domElement);
		this.soundManager = new SoundManager(this.camera);

		// Setup scene lighting and floor
		SceneBuilder.addLighting(this.scene);
		SceneBuilder.addFloor(this.scene);

		// Initialize managers
		this.input = new InputManager();
		this.clock = new THREE.Clock(); // Start clock but we won't use dt until game starts? 
		// Actually clock should be running for engine but maybe we pause logic?

		// Setup jump callback
		this.input.onJumpPressed = () => this._handleJump();

		// Expose game instance for debugging
		window.game = this;

		// Setup event listeners
		window.addEventListener('resize', () => this._onWindowResize());

		// Start loop (will render empty scene until game starts)
		this._animate();
	}

	/**
	 * Starts the game with the selected character and applied settings.
	 * Loads character models and initializes game UI.
	 * @async
	 */
	async startGame () {
		// Apply audio settings
		if (this.gameSettings?.audio) {
			const master = this.gameSettings.audio.masterVolume / 100;
			const sfx = this.gameSettings.audio.sfxVolume / 100;
			const music = this.gameSettings.audio.musicVolume / 100;

			this.soundManager.setMasterVolume(master);
			this.soundManager.setSfxVolume(sfx);
			this.soundManager.setMusicVolume(music);
		}

		// Setup Pause Screen
		this.pauseScreen = new PauseScreen(
			() => this._resumeGame(),
			(settings) => this._applySettings(settings),
			() => this.settingsUI.open(),
			() => this._changeCharacter()
		);

		// Hook into pause screen toggle to stop/start loop
		const originalToggle = this.pauseScreen.toggle.bind(this.pauseScreen);
		this.pauseScreen.toggle = () => {
			originalToggle();
			this.isPaused = this.pauseScreen.isPaused;
			if (this.isPaused) {
				this.clock.stop();
				this.soundManager.pauseAll();
			} else {
				this.clock.start();
				this.soundManager.resumeAll();
			}
		};

		// Initialize Game UI
		this.gameUI = new GameUI(this);
		this.gameUI.show();

		// Load models and setup controllers for selected character

		// Load models and setup controllers for selected character
		await this._loadModels(CONFIG.characters[ this.currentCharacter ]);
	}

	/**
	 * Resets the current game and returns to the character selection screen.
	 * @private
	 * @async
	 */
	async _changeCharacter () {
		// Reset game state
		this._resetGame();

		// Show start screen again
		this.startScreen.startScreen.classList.remove('hidden');
	}

	/**
	 * Resets the game state, removing the character model and UI.
	 * Properly disposes of Three.js resources to prevent memory leaks.
	 * @private
	 */
	_resetGame () {
		// Remove model from scene and dispose resources
		if (this.model) {
			this.scene.remove(this.model);
			this._disposeObject(this.model);
			this.model = null;
		}

		if (this.gameUI) {
			this.gameUI.hide();
			this.gameUI = null;
		}

		if (this.soundManager) {
			this.soundManager.dispose();
		}

		// Clear controllers

		// Clear controllers
		this.charController = null;
		this.cameraController = null;
		this.animStateMachine = null;
		this.animController = null;

		// Reset physics/state?
		this.isPaused = false;
	}

	/**
	 * Loads character models and animations, and initializes controllers.
	 * @param {Object} characterConfig - Configuration for the character to load.
	 * @private
	 * @async
	 */
	async _loadModels (characterConfig) {
		const loadingScreen = document.getElementById('loading-screen');
		const progressBar = document.getElementById('progress-bar');
		const loadingText = document.getElementById('loading-text');

		const manager = new THREE.LoadingManager();

		manager.onProgress = (url, itemsLoaded, itemsTotal) => {
			const progress = (itemsLoaded / itemsTotal) * 100;
			if (progressBar) progressBar.style.width = `${ progress }%`;
			if (loadingText) loadingText.innerText = `Loading: ${ Math.round(progress) }%`;
		};

		// Reset loading screen
		if (loadingScreen) {
			loadingScreen.style.display = 'flex';
			loadingScreen.style.opacity = '1';
			// Assuming there's a text element we reset
			if (loadingText) loadingText.innerText = `Preparing ${ characterConfig.name }...`;
		}

		manager.onLoad = () => {
			if (loadingScreen) {
				loadingScreen.style.opacity = '0';
				setTimeout(() => {
					loadingScreen.style.display = 'none';
				}, 500);
			}
		};

		const loader = new ModelLoader(manager);

		try {
			// Load main model
			this.model = await loader.load(characterConfig.models.idle);
			this.model.scale.setScalar(CONFIG.character.scale);
			ModelLoader.setupShadows(this.model);
			this.scene.add(this.model);

			// Setup animation mixer and controller
			const mixer = new THREE.AnimationMixer(this.model);
			this.animController = new AnimationController(mixer);
			window.mixer = mixer;

			// Load all animation models
			const [ walkingFBX, runFBX, jumpStaticFBX, jumpMoveFBX ] = await Promise.all([
				loader.load(characterConfig.models.walking),
				loader.load(characterConfig.models.run),
				loader.load(characterConfig.models.jumpStatic),
				loader.load(characterConfig.models.jumpMove)
			]);

			// Register animations
			this._registerAnimation('idle', this.model);
			this._registerAnimation('walk', walkingFBX);
			this._registerAnimation('run', runFBX);
			this._registerAnimation('jump_static', jumpStaticFBX, { loop: 'once' });
			this._registerAnimation('jump_move', jumpMoveFBX, { loop: 'once' });

			// Initialize controllers
			this.charController = new CharacterController(this.model, this.input, this.camera);
			this.cameraController = new CameraController(this.camera, this.controls, this.model);
			this.animStateMachine = new AnimationStateMachine(this.animController, this.charController, this.input, this.soundManager);

			// Initialize camera and start idle animation
			this.cameraController.initializePosition();
			this.animController.play('idle');

			// Force initial render
			this._render();

			console.log('Game initialized successfully');

			// Load sounds
			// Load sounds
			await Promise.all([
				this.soundManager.loadSound('walk', CONFIG.sounds.walk, { loop: true, volume: 0.5 }),
				this.soundManager.loadSound('run', CONFIG.sounds.run, { loop: true, volume: 0.5 }),
				this.soundManager.loadSound('jump', CONFIG.sounds.jump, { loop: false, volume: 0.5 }),
				this.soundManager.loadSound('background', CONFIG.sounds.background, { loop: true, isMusic: true, volume: 0.5 })
			]);

			// Start background music
			this.soundManager.playMusic('background');

		} catch (error) {
			console.error('Error loading models:', error);
		}
	}

	/**
	 * Registers an animation clip with the animation controller.
	 * @param {string} name - Name of the animation.
	 * @param {THREE.Group} fbxModel - The loaded FBX model containing the animation.
	 * @param {Object} [options={}] - Animation options (e.g., loop).
	 * @private
	 */
	_registerAnimation (name, fbxModel, options = {}) {
		if (fbxModel.animations.length > 0) {
			const clip = ModelLoader.prepareClip(fbxModel.animations[ 0 ], this.model);
			this.animController.addAction(name, clip, options);
		}
	}

	/**
	 * Handles the jump input event.
	 * @private
	 */
	_handleJump () {
		if (!this.charController) return;

		if (this.charController.startJump()) {
			this.animStateMachine.playJumpAnimation();
		}
	}

	/**
	 * Resumes the game from a paused state.
	 * @private
	 */
	_resumeGame () {
		this.isPaused = false;
		this.clock.start();
		this.soundManager.resumeAll();
	}

	/**
	 * Handles window resize events, updating camera and renderer dimensions.
	 * @private
	 */
	_onWindowResize () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	/**
	 * Main animation loop. Updates all systems and renders the scene.
	 * @private
	 */
	_animate () {
		requestAnimationFrame(() => this._animate());

		if (this.isPaused) return;

		const dt = this.clock.getDelta();

		// Update all systems
		if (this.charController) {
			this.charController.update(dt);
		}

		if (this.animStateMachine) {
			this.animStateMachine.update();
		}

		if (this.animController) {
			this.animController.update(dt);
		}

		if (this.cameraController) {
			this.cameraController.update();
		}

		this._render();
	}

	/**
	 * Renders the current scene.
	 * @private
	 */
	_render () {
		this.renderer.render(this.scene, this.camera);
	}

	/**
	 * Recursively disposes of geometries and materials in an object and its children.
	 * @param {THREE.Object3D} obj - The object to dispose.
	 * @private
	 */
	_disposeObject (obj) {
		obj.traverse(node => {
			if (node.isMesh) {
				if (node.geometry) node.geometry.dispose();
				if (node.material) {
					if (Array.isArray(node.material)) {
						node.material.forEach(mat => {
							this._disposeMaterial(mat);
						});
					} else {
						this._disposeMaterial(node.material);
					}
				}
			}
		});
	}

	/**
	 * Disposes of a material and its textures.
	 * @param {THREE.Material} mat - The material to dispose.
	 * @private
	 */
	_disposeMaterial (mat) {
		mat.dispose();

		// Dispose textures
		for (const key of Object.keys(mat)) {
			if (mat[ key ] && mat[ key ].isTexture) {
				mat[ key ].dispose();
			}
		}
	}
}
