/**
 * Manages the in-game HUD and camera controls.
 */
export class GameUI {
	/**
	 * @param {Game} game - The main game instance.
	 */
	constructor (game) {
		this.game = game;
		this.cameraContainer = document.getElementById('camera-controls');
		this.buttons = document.querySelectorAll('.camera-btn');

		this._initListeners();
		this._updateActiveButton('medium');
	}

	_initListeners () {
		this.buttons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				const preset = e.target.closest('.camera-btn').dataset.preset;
				this._setCameraPreset(preset);
			});
		});
	}

	_setCameraPreset (preset) {
		if (this.game.cameraController) {
			this.game.cameraController.setPreset(preset);
			this._updateActiveButton(preset);
		}
	}

	_updateActiveButton (activePreset) {
		this.buttons.forEach(btn => {
			if (btn.dataset.preset === activePreset) {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});
	}

	/**
	 * Shows the game UI elements.
	 */
	show () {
		if (this.cameraContainer) {
			this.cameraContainer.classList.remove('hidden');
		}
	}

	/**
	 * Hides the game UI elements.
	 */
	hide () {
		if (this.cameraContainer) {
			this.cameraContainer.classList.add('hidden');
		}
	}
}
