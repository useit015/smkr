/**
 * Manages the pause screen UI and its interactions.
 */
export class PauseScreen {
	/**
	 * @param {Function} onResume - Callback when the game is resumed via UI.
	 * @param {Function} onSettingsChange - Callback when settings are changed.
	 * @param {Function} onOpenSettings - Callback to open the settings panel.
	 * @param {Function} onChangeCharacter - Callback to return to character selection.
	 * @param {Object} options - Added options for better lifecycle control.
	 */
	constructor (onResume, onSettingsChange, onOpenSettings, onChangeCharacter, options = {}) {
		this.onResume = onResume;
		this.onSettingsChange = onSettingsChange;
		this.onOpenSettings = onOpenSettings;
		this.onChangeCharacter = onChangeCharacter;

		this.onPauseRequest = options.onPauseRequest; // Fired when ESC is pressed to pause
		this.onUnpauseRequest = options.onUnpauseRequest; // Fired when ESC is pressed to unpause

		this.isPaused = false;

		// DOM Elements
		this.pauseScreen = document.getElementById('pause-screen');
		this.resumeBtn = document.getElementById('resume-btn');
		this.settingsBtn = document.getElementById('pause-settings-btn');
		this.changeCharBtn = document.getElementById('change-character-btn');
		this.closeSettingsBtn = document.getElementById('close-settings');

		this._setupEventListeners();
	}

	_setupEventListeners () {
		// ESC key to toggle pause
		window.addEventListener('keydown', (e) => {
			if (e.code === 'Escape') {
				e.preventDefault();
				this.toggle();
			}
		});

		// Resume button
		this.resumeBtn?.addEventListener('click', () => this.resume());

		// Change Character button
		this.changeCharBtn?.addEventListener('click', () => {
			this.isVisible = false;
			this.pauseScreen?.classList.add('hidden');
			if (this.onChangeCharacter) {
				this.onChangeCharacter();
			}
		});

		// Settings button from pause menu
		if (this.settingsBtn) {
			this.settingsBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (this.onOpenSettings) {
					this.onOpenSettings();
				}
			});
		}
	}

	/**
	 * Toggles the pause state of the game.
	 */
	toggle () {
		if (this.isPaused) {
			this.resume();
		} else {
			this.pause();
		}
	}

	/**
	 * Pauses the game and shows the pause screen.
	 */
	pause () {
		if (this.isPaused) return;
		this.isPaused = true;
		this.pauseScreen?.classList.remove('hidden');

		if (this.onPauseRequest) {
			this.onPauseRequest();
		}
	}

	/**
	 * Resumes the game and hides the pause screen.
	 */
	resume () {
		if (!this.isPaused) return;
		this.isPaused = false;
		this.pauseScreen?.classList.add('hidden');

		// Ensure settings is closed when resuming
		const settingsPanel = document.getElementById('settings-panel');
		if (settingsPanel) {
			settingsPanel.classList.add('hidden');
		}

		if (this.onResume) {
			this.onResume();
		}

		if (this.onUnpauseRequest) {
			this.onUnpauseRequest();
		}
	}
}
