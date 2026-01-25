import { events, EVENTS } from '../core/EventEmitter';

/**
 * Manages the in-game HUD, score display, and camera controls.
 */
export class GameUI {
	/**
	 * @param {Game} game - The main game instance.
	 */
	constructor (game) {
		this.game = game;
		this.cameraContainer = document.getElementById('camera-controls');
		this.scoreContainer = document.getElementById('score-container');
		this.scoreValue = document.getElementById('score-value');
		this.highScoreValue = document.getElementById('high-score-value');
		this.buttons = document.querySelectorAll('.camera-btn');

		this._initListeners();
		this._updateActiveButton('medium');
	}

	_initListeners () {
		events.on(EVENTS.SCORE_UPDATE, (data) => {
			if (this.scoreValue) this.scoreValue.innerText = data.score;
			if (this.highScoreValue) this.highScoreValue.innerText = data.highScore;
		});

		events.on(EVENTS.GAME_START, () => {
			if (this.scoreValue) this.scoreValue.innerText = '0';
			if (this.highScoreValue) this.highScoreValue.innerText = this.game.highScore;
		});

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
		if (this.cameraContainer) this.cameraContainer.classList.remove('hidden');
		if (this.scoreContainer) this.scoreContainer.classList.remove('hidden');
	}

	/**
	 * Hides the game UI elements.
	 */
	hide () {
		if (this.cameraContainer) this.cameraContainer.classList.add('hidden');
		if (this.scoreContainer) this.scoreContainer.classList.add('hidden');
	}
}
