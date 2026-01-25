import GUI from 'lil-gui';
import { CONFIG } from '../Config';

/**
 * DebugUI provides a graphical interface for real-time parameter tuning.
 * Uses lil-gui to expose CONFIG properties and other game internals.
 */
export class DebugUI {
	/**
	 * @param {Object} game - The main Game instance.
	 */
	constructor (game) {
		this.game = game;
		this.gui = new GUI({ title: '🕹️ Game Debugger' });

		// Move to top-right and make it searchable
		this.gui.domElement.style.top = '10px';
		this.gui.domElement.style.right = '10px';

		this._initFolders();

		// Hide by default, can be toggled with 'H' or through code
		this.gui.close();
	}

	_initFolders () {
		this._setupCharacterFolder();
		this._setupPhysicsFolder();
		this._setupCameraFolder();
		this._setupSceneFolder();
		this._setupActionsFolder();
	}

	_setupCharacterFolder () {
		const folder = this.gui.addFolder('🏃 Character');

		folder.add(CONFIG.character, 'walkSpeed', 0, 30).name('Walk Speed');
		folder.add(CONFIG.character, 'runSpeed', 0, 50).name('Run Speed');
		folder.add(CONFIG.character, 'rotationSpeed', 0, 20).name('Rotation Speed');

		folder.open();
	}

	_setupPhysicsFolder () {
		const folder = this.gui.addFolder('⚖️ Physics');

		folder.add(CONFIG.physics, 'gravity', -100, 0).name('Gravity').onChange(v => {
			if (this.game.physics && this.game.physics.world) {
				this.game.physics.world.gravity.set(0, v, 0);
			}
		});

		folder.add(CONFIG.physics, 'jumpForce', 0, 30).name('Jump Force');

		folder.open();
	}

	_setupCameraFolder () {
		const folder = this.gui.addFolder('🎥 Camera');

		folder.add(CONFIG.camera, 'fov', 30, 120).name('FOV').onChange(v => {
			if (this.game.camera) {
				this.game.camera.fov = v;
				this.game.camera.updateProjectionMatrix();
			}
		});

		folder.add(CONFIG.camera, 'chaseDistance', 1, 50).name('Distance');
		folder.add(CONFIG.camera, 'chaseHeight', 1, 30).name('Height');
		folder.add(CONFIG.camera, 'smoothFactor', 0.01, 1).name('Smooth Factor');

		folder.close();
	}

	_setupSceneFolder () {
		const folder = this.gui.addFolder('🌍 Environment');

		folder.add(CONFIG.scene, 'fogNear', 0, 100).name('Fog Near').onChange(v => {
			if (this.game.scene.fog) this.game.scene.fog.near = v;
		});

		folder.add(CONFIG.scene, 'fogFar', 10, 2000).name('Fog Far').onChange(v => {
			if (this.game.scene.fog) this.game.scene.fog.far = v;
		});

		// Visual Helpers
		const helpers = {
			showPhysics: false,
			showStats: false
		};

		folder.add(helpers, 'showStats').name('Show Performance Stats').onChange(v => {
			if (this.game.stats) {
				this.game.stats.dom.style.display = v ? 'block' : 'none';
			}
		});

		// Future: track physics debugger state if you add it
		folder.add(helpers, 'showPhysics').name('Show Physics Hub (TBD)');

		folder.close();
	}

	_setupActionsFolder () {
		const folder = this.gui.addFolder('⚡ Actions');

		const actions = {
			restart: () => this.game._restartGame(),
			resetStats: () => console.log('Stats reset requested')
		};

		folder.add(actions, 'restart').name('Restart Game');

		folder.close();
	}

	/**
	 * Destroys the GUI instance.
	 */
	dispose () {
		if (this.gui) {
			this.gui.destroy();
		}
	}
}
