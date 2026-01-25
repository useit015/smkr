import { StartScreen } from '../ui/StartScreen';
import { PauseScreen } from '../ui/PauseScreen';
import { SettingsUI } from '../ui/SettingsUI';
import { GameUI } from '../ui/GameUI';

/**
 * Orchestrates all UI screens and their transitions.
 */
export class UIManager {
	/**
	 * @param {Object} callbacks - Object containing callbacks for various UI actions.
	 */
	constructor (game, callbacks) {
		this.game = game;
		this.callbacks = callbacks;

		// Internal Elements
		this.loadingScreen = document.getElementById('loading-screen');
		this.progressBar = document.getElementById('progress-bar');
		this.loadingText = document.getElementById('loading-text');
		this.gameOverScreen = document.getElementById('game-over-screen');
		this.restartBtn = document.getElementById('restart-btn');

		// Concrete UI Components
		this.settingsUI = new SettingsUI(game.settingsManager, callbacks.onSettingsChange);
		this.startScreen = new StartScreen(callbacks.onStartGame, () => this.settingsUI.open());

		this.pauseScreen = new PauseScreen(
			callbacks.onResume,
			callbacks.onSettingsChange,
			() => this.settingsUI.open(),
			callbacks.onChangeCharacter,
			{
				onPauseRequest: callbacks.onPauseRequest,
				onUnpauseRequest: callbacks.onUnpauseRequest
			}
		);

		this.gameUI = new GameUI(game);

		this._initInternalListeners();
	}

	_initInternalListeners () {
		if (this.restartBtn) {
			this.restartBtn.onclick = () => {
				this.hideGameOver();
				if (this.callbacks.onRestart) this.callbacks.onRestart();
			};
		}
	}

	showStart () {
		this.startScreen.startScreen.classList.remove('hidden');
	}

	hideStart () {
		this.startScreen.startScreen.classList.add('hidden');
	}

	showHUD () {
		this.gameUI.show();
	}

	hideHUD () {
		this.gameUI.hide();
	}

	showLoading (text = 'Loading...') {
		if (this.loadingScreen) {
			this.loadingScreen.style.display = 'flex';
			this.loadingScreen.style.opacity = '1';
			if (this.loadingText) this.loadingText.innerText = text;
		}
	}

	updateLoading (progress, text) {
		if (this.progressBar) this.progressBar.style.width = `${ progress }%`;
		if (this.loadingText && text) this.loadingText.innerText = text;
	}

	hideLoading () {
		if (this.loadingScreen) {
			this.loadingScreen.style.opacity = '0';
			setTimeout(() => {
				this.loadingScreen.style.display = 'none';
			}, 500);
		}
	}

	showGameOver () {
		if (this.gameOverScreen) {
			this.gameOverScreen.classList.remove('hidden');
		}
	}

	hideGameOver () {
		if (this.gameOverScreen) {
			this.gameOverScreen.classList.add('hidden');
		}
	}

	togglePause () {
		this.pauseScreen.toggle();
	}
}
