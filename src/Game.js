import * as THREE from 'three';
import { CONFIG } from './Config';
import { SceneBuilder } from './core/SceneBuilder';
import { InputManager } from './managers/InputManager';
import { CharacterController } from './controllers/CharacterController';
import { CameraController } from './controllers/CameraController';
import { AnimationController } from './animations/AnimationController';
import { AnimationStateMachine } from './animations/AnimationStateMachine';
import { SoundManager } from './managers/SoundManager';
import { PhysicsManager } from './managers/PhysicsManager';
import { SettingsManager } from './managers/SettingsManager';
import { AssetManager } from './managers/AssetManager';
import { WorldManager } from './managers/WorldManager';
import { UIManager } from './managers/UIManager';
import { DebugUI } from './ui/DebugUI';
import { events, EVENTS } from './core/EventEmitter';
import Stats from 'stats.js';

/**
 * Main game orchestrator class.
 * Initializes the engine, manages game state, and coordinates between various systems.
 */
export class Game {
	constructor () {
		this.isPaused = false;
		this.currentCharacter = 'said';
		this.score = 0;
		this.highScore = 0;
		this._elapsedTime = 0;

		// Initialize core engine and managers
		this.initEngine();
		this.initManagers();
		this._initTestHooks();

		// Show the initial start screen
		this.ui.showStart();
	}

	/**
	 * Initializes specialized managers to offload logic from the Game class.
	 */
	initManagers () {
		this.settingsManager = new SettingsManager();
		this.highScore = this.settingsManager.getHighScore();
		this.world = new WorldManager(this.scene, this.physics);

		// Asset loading with UI progress updates
		this.assets = new AssetManager(
			(url, loaded, total) => {
				const progress = (loaded / total) * 100;
				this.ui.updateLoading(progress, `Loading Assets: ${ Math.round(progress) }%`);
			},
			() => this.ui.hideLoading()
		);

		// Centralized UI management
		this.ui = new UIManager(this, {
			onStartGame: (charId) => {
				this.currentCharacter = charId;
				this._applySettings(this.settingsManager.getAll());
				this.startGame();
			},
			onSettingsChange: (settings) => this._applySettings(settings),
			onResume: () => this._resumeGame(),
			onRestart: () => this._restartGame(),
			onChangeCharacter: () => this._changeCharacter(),
			onPauseRequest: () => {
				this.isPaused = true;
				this.clock.stop();
				this.soundManager.pauseAll();
			},
			onUnpauseRequest: () => {
				this.isPaused = false;
				this.clock.start();
				this.soundManager.resumeAll();
			}
		});

		// Initialize debug tools
		this.debug = new DebugUI(this);
	}

	/**
	 * Initializes the Three.js engine and core systems.
	 */
	initEngine () {
		this.stats = new Stats();
		this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild(this.stats.dom);
		this.stats.dom.style.display = 'none'; // Hidden by default

		this.scene = SceneBuilder.createScene();
		this.camera = SceneBuilder.createCamera();
		this.renderer = SceneBuilder.createRenderer(document.querySelector('#game-canvas'));
		this.composer = SceneBuilder.createComposer(this.renderer, this.scene, this.camera);
		this.controls = SceneBuilder.createControls(this.camera, this.renderer.domElement);
		this.soundManager = new SoundManager(this.camera);
		this.physics = new PhysicsManager();

		SceneBuilder.addLighting(this.scene);

		this.input = new InputManager();
		this.clock = new THREE.Clock();

		this.input.onJumpPressed = () => this._handleJump();

		window.game = this;
		window.addEventListener('resize', () => this._onWindowResize());
		window.addEventListener('keydown', (e) => {
			if (e.key.toLowerCase() === 'h') {
				if (this.debug) {
					const isHidden = this.debug.gui._hidden;
					this.debug.gui.show(!isHidden);
				}
			}
		});

		this._animate();
	}

	/**
	 * Starts the game loop and loads character assets.
	 */
	async startGame () {
		this.isPaused = false;
		this.clock.start();
		this._elapsedTime = 0;

		// Prepare environment
		this.world.generate();
		this.ui.showHUD();

		// Load character and animations
		this.ui.showLoading(`Summoning ${ this.currentCharacter }...`);

		try {
			const { model, animations } = await this.assets.loadCharacter(this.currentCharacter);
			this.model = model;
			this.scene.add(this.model);

			// Setup animation system
			const mixer = new THREE.AnimationMixer(this.model);
			this.animController = new AnimationController(mixer);

			Object.entries(animations).forEach(([ name, clip ]) => {
				const options = (name === 'jump_static' || name === 'jump_move') ? { loop: 'once' } : {};
				this.animController.addAction(name, clip, options);
			});

			// Initialize specialized controllers
			this.charController = new CharacterController(this.model, this.input, this.camera, this.physics, () => this._handleGameOver());
			this.charController.reset();
			this.cameraController = new CameraController(this.camera, this.controls, this.model);
			this.animStateMachine = new AnimationStateMachine(this.animController, this.charController, this.input, this.soundManager);

			this.cameraController.initializePosition();
			this.animController.play('idle');

			// Force render to avoid black frame
			this._render();

			// Load sounds and start music
			await Promise.all([
				this.soundManager.loadSound('walk', CONFIG.sounds.walk, { loop: true, volume: 0.5 }),
				this.soundManager.loadSound('run', CONFIG.sounds.run, { loop: true, volume: 0.5 }),
				this.soundManager.loadSound('jump', CONFIG.sounds.jump, { loop: false, volume: 0.5 }),
				this.soundManager.loadSound('background', CONFIG.sounds.background, { loop: true, isMusic: true, volume: 0.5 })
			]);

			this.soundManager.playMusic('background');

		} catch (error) {
			console.error('Failed to start game:', error);
			this.ui.hideLoading();
		}
	}

	/**
	 * Returns to the character selection screen.
	 */
	_changeCharacter () {
		this._resetGame();
		this.ui.showStart();
	}

	/**
	 * Cleans up all game-specific resources to prevent memory leaks.
	 */
	_resetGame () {
		if (this.model) {
			this.scene.remove(this.model);
			this._disposeObject(this.model);
			this.model = null;
		}

		this.ui.hideHUD();
		this.world.cleanup();
		this.soundManager.dispose();

		this.charController = null;
		this.cameraController = null;
		this.animStateMachine = null;
		this.animController = null;
		this.isPaused = false;
		this._elapsedTime = 0;
	}

	_resumeGame () {
		this.isPaused = false;
		this.clock.start();
		this.soundManager.resumeAll();
		events.emit(EVENTS.GAME_RESUME);
	}

	_handleGameOver () {
		this.isPaused = true;
		this.clock.stop();
		this.soundManager.pauseAll();

		const isNewHigh = this.settingsManager.setHighScore(this.score);
		if (isNewHigh) this.highScore = this.score;

		this.ui.showGameOver();
		events.emit(EVENTS.GAME_OVER, { score: this.score, isNewHigh });
	}

	_restartGame () {
		this.isPaused = true;
		this.clock.stop();
		this.score = 0;
		this._elapsedTime = 0;

		this.world.generate();
		if (this.charController) this.charController.reset();
		if (this.cameraController) this.cameraController.initializePosition();
		if (this.animController) this.animController.play('idle', 0);

		this.isPaused = false;
		this.clock.start();
		this.soundManager.resumeAll();
		this.soundManager.playMusic('background');
	}

	_handleJump () {
		if (!this.charController || !this.charController.isGrounded) return;

		// Play jump animation immediately
		this.animStateMachine.playJumpAnimation();

		const isMoving = this.input.isMoving;

		// If standing still, the animation has a "wind-up" (bending knees).
		// We delay the physical push-off for better synchronization.
		const delay = isMoving ? 0 : 200; // 200ms delay for static jump

		const performJump = () => {
			// Check if we are still grounded and alive before applying force
			if (this.charController && this.charController.isGrounded && !this.charController.isDead) {
				this.charController.startJump();
				this.soundManager.play('jump');
			}
		};

		if (delay > 0) {
			setTimeout(performJump, delay);
		} else {
			performJump();
		}
	}

	_applySettings (settings) {
		if (settings.graphics) {
			CONFIG.camera.far = settings.graphics.renderDistance;
			CONFIG.scene.fogFar = settings.graphics.renderDistance;
			if (this.camera) {
				this.camera.far = CONFIG.camera.far;
				this.camera.updateProjectionMatrix();
			}
			if (this.scene && this.scene.fog) this.scene.fog.far = CONFIG.scene.fogFar;
			if (this.renderer && this.scene) {
				SceneBuilder.updateShadowQuality(this.renderer, this.scene, settings.graphics.shadowQuality);
			}
		}

		if (settings.controls) {
			CONFIG.controls.mouseSensitivity = settings.controls.mouseSensitivity;
		}

		if (settings.audio && this.soundManager) {
			this.soundManager.setMasterVolume(settings.audio.masterVolume / 100);
			this.soundManager.setSfxVolume(settings.audio.sfxVolume / 100);
			this.soundManager.setMusicVolume(settings.audio.musicVolume / 100);
		}
	}

	_onWindowResize () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
	}

	_animate () {
		requestAnimationFrame(() => this._animate());
		if (this.isPaused) return;

		if (this.stats) this.stats.begin();

		const dt = this.clock.getDelta();
		this._elapsedTime += dt;

		this._step(dt);

		this._render();

		if (this.stats) this.stats.end();
	}

	_step (dt) {
		if (this.isPaused) return;

		// Update all systems
		if (this.physics) this.physics.update(dt);
		if (this.charController) {
			this.charController.update(dt);
			if (this.world && this.model) this.world.update(this.model.position, this._elapsedTime);

			// Update score based on distance traveled along Z
			const currentScore = Math.max(0, Math.floor(Math.abs(this.model.position.z)));
			if (currentScore > this.score) {
				this.score = currentScore;
				events.emit(EVENTS.SCORE_UPDATE, { score: this.score, highScore: this.highScore });
			}
		}
		if (this.animStateMachine) this.animStateMachine.update();
		if (this.animController) this.animController.update(dt);
		if (this.cameraController) this.cameraController.update();
	}

	_render () {
		if (this.composer) {
			this.composer.render();
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}

	_disposeObject (obj) {
		obj.traverse(node => {
			if (node.isMesh) {
				if (node.geometry) node.geometry.dispose();
				if (node.material) {
					if (Array.isArray(node.material)) {
						node.material.forEach(mat => this._disposeMaterial(mat));
					} else {
						this._disposeMaterial(node.material);
					}
				}
			}
		});
	}

	_disposeMaterial (mat) {
		mat.dispose();
		for (const key of Object.keys(mat)) {
			if (mat[ key ] && mat[ key ].isTexture) {
				mat[ key ].dispose();
			}
		}
	}

	_initTestHooks () {
		window.advanceTime = (ms) => {
			const step = 1 / 60;
			const steps = Math.max(1, Math.round(ms / (1000 / 60)));
			for (let i = 0; i < steps; i++) {
				this._elapsedTime += step;
				this._step(step);
			}
			this._render();
		};

		window.render_game_to_text = () => {
			const mode = this.charController
				? (this.charController.isDead ? 'gameover' : (this.isPaused ? 'paused' : 'playing'))
				: 'menu';

			const player = this.model ? {
				x: Number(this.model.position.x.toFixed(2)),
				y: Number(this.model.position.y.toFixed(2)),
				z: Number(this.model.position.z.toFixed(2))
			} : null;

			const velocity = this.charController?.body ? {
				x: Number(this.charController.body.velocity.x.toFixed(2)),
				y: Number(this.charController.body.velocity.y.toFixed(2)),
				z: Number(this.charController.body.velocity.z.toFixed(2))
			} : null;

			const worldSummary = this.world ? this.world.getStateSummary() : { platforms: [], obstacles: [] };

			return JSON.stringify({
				mode,
				coordinateSystem: 'x:right, y:up, z:forward negative',
				player,
				velocity,
				grounded: this.charController?.isGrounded ?? false,
				score: this.score,
				platformCount: worldSummary.platforms.length,
				obstacleCount: worldSummary.obstacles.length,
				platforms: worldSummary.platforms,
				obstacles: worldSummary.obstacles
			});
		};
	}
}
