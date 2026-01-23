export class GameUI {
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

	show () {
		if (this.cameraContainer) {
			this.cameraContainer.classList.remove('hidden');
		}
	}

	hide () {
		if (this.cameraContainer) {
			this.cameraContainer.classList.add('hidden');
		}
	}
}
