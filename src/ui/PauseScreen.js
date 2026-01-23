/**
 * PauseScreen - Manages the pause screen UI
 */
export class PauseScreen {
	constructor (onResume, onSettingsChange, onOpenSettings, onChangeCharacter) {
		this.onResume = onResume;
		this.onSettingsChange = onSettingsChange;
		this.onOpenSettings = onOpenSettings;
		this.onChangeCharacter = onChangeCharacter;
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
			this.resume(); // Unpause locally (hide screen)
			if (this.onChangeCharacter) {
				this.onChangeCharacter();
			}
		});

		// Settings button from pause menu
		if (this.settingsBtn) {
			this.settingsBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				console.log('PauseScreen: Settings button clicked');
				if (this.onOpenSettings) {
					this.onOpenSettings();
				} else {
					console.error('PauseScreen: onOpenSettings callback is missing');
				}
			});
		} else {
			console.error('PauseScreen: Settings button element not found in DOM');
		}

		// Listen for close settings to ensure we don't double toggle
		this.closeSettingsBtn?.addEventListener('click', () => {
			// If we are paused, just ensuring focus or state is correct if needed
		});
	}

	toggle () {
		if (this.isPaused) {
			this.resume();
		} else {
			this.pause();
		}
	}

	pause () {
		if (this.isPaused) return;
		this.isPaused = true;
		this.pauseScreen?.classList.remove('hidden');
	}

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
	}
}
