import { CONFIG } from '../Config';

/**
 * Manages the start screen UI, including character selection and game initiation.
 */
export class StartScreen {
	/**
	 * @param {Function} onStartGame - Callback fired when the game starts.
	 * @param {Function} onOpenSettings - Callback to open the settings panel.
	 */
	constructor (onStartGame, onOpenSettings) {
		this.onStartGame = onStartGame;
		this.onOpenSettings = onOpenSettings;
		this.selectedCharacter = 'said'; // Default

		this.startScreen = document.getElementById('start-screen');
		this.startBtn = document.getElementById('start-game-btn');
		this.settingsBtn = document.getElementById('settings-btn');
		this.charGrid = this.startScreen.querySelector('.characters-grid-small');

		this._generateCharacterSelection();
		this._setupEventListeners();
	}

	_generateCharacterSelection () {
		if (!this.charGrid) return;
		this.charGrid.innerHTML = '';

		Object.values(CONFIG.characters).forEach(char => {
			const card = document.createElement('div');
			card.className = 'char-card-small';
			if (char.id === this.selectedCharacter) card.classList.add('selected');
			card.dataset.id = char.id;

			let icon = '👤';
			if (char.id === 'jamal') icon = '🏃';
			if (char.id === 'said') icon = '⚡';

			card.innerHTML = `
                <div class="char-icon">${ icon }</div>
                <span>${ char.name }</span>
            `;

			card.addEventListener('click', () => this._selectCharacter(char.id));
			this.charGrid.appendChild(card);
		});
	}

	_selectCharacter (id) {
		this.selectedCharacter = id;
		const cards = this.charGrid.querySelectorAll('.char-card-small');
		cards.forEach(c => {
			if (c.dataset.id === id) c.classList.add('selected');
			else c.classList.remove('selected');
		});
	}

	_setupEventListeners () {
		this.startBtn.addEventListener('click', () => this._handleStartGame());

		this.settingsBtn.addEventListener('click', (e) => {
			e.stopPropagation(); // Prevent bubbling issues
			if (this.onOpenSettings) this.onOpenSettings();
		});
	}

	_handleStartGame () {
		this.startScreen.classList.add('hidden');

		if (this.onStartGame) {
			this.onStartGame(this.selectedCharacter);
		}
	}
}

