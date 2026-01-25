/**
 * Handles loading, saving, and applying game settings using localStorage.
 */
export class SettingsManager {
	constructor () {
		this.storageKey = 'gameSettings';
		this.defaults = {
			controls: {
				mouseSensitivity: 5
			},
			graphics: {
				shadowQuality: 'medium',
				renderDistance: 200,
				antialiasing: true
			},
			audio: {
				masterVolume: 80,
				sfxVolume: 100,
				musicVolume: 70
			}
		};

		this.settings = this.load();
	}

	/**
	 * Loads settings from localStorage or returns defaults if none exist.
	 * Merges stored settings with defaults to ensure all keys are present.
	 * @returns {Object} The loaded settings object.
	 */
	load () {
		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Merge with defaults to ensure all keys exist
				return this._deepMerge(this.defaults, parsed);
			}
		} catch (e) {
			console.warn('Failed to load settings:', e);
		}
		return { ...this.defaults };
	}

	/**
	 * Saves the current settings object to localStorage.
	 */
	save () {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
		} catch (e) {
			console.warn('Failed to save settings:', e);
		}
	}

	getHighScore () {
		return parseInt(localStorage.getItem('highScore') || '0', 10);
	}

	setHighScore (score) {
		const current = this.getHighScore();
		if (score > current) {
			localStorage.setItem('highScore', score.toString());
			return true;
		}
		return false;
	}

	/**
	 * Resets settings to their default values and saves them.
	 */
	reset () {
		this.settings = JSON.parse(JSON.stringify(this.defaults));
		this.save();
	}

	/**
	 * Retrieves a specific setting value.
	 * @param {string} category - The settings category (e.g., 'controls').
	 * @param {string} key - The setting key (e.g., 'mouseSensitivity').
	 * @returns {*} The setting value.
	 */
	get (category, key) {
		return this.settings[ category ]?.[ key ];
	}

	/**
	 * Updates a specific setting value.
	 * @param {string} category - The settings category.
	 * @param {string} key - The setting key.
	 * @param {*} value - The new value to set.
	 */
	set (category, key, value) {
		if (this.settings[ category ]) {
			this.settings[ category ][ key ] = value;
		}
	}

	/**
	 * Retrieves all current settings.
	 * @returns {Object} The complete settings object.
	 */
	getAll () {
		return this.settings;
	}

	/**
	 * Deeply merges two objects, with the source overriding the target.
	 * @param {Object} target - The base object.
	 * @param {Object} source - The object to merge from.
	 * @returns {Object} The merged result.
	 * @private
	 */
	_deepMerge (target, source) {
		const result = { ...target };
		for (const key in source) {
			if (source[ key ] && typeof source[ key ] === 'object' && !Array.isArray(source[ key ])) {
				result[ key ] = this._deepMerge(target[ key ] || {}, source[ key ]);
			} else {
				result[ key ] = source[ key ];
			}
		}
		return result;
	}
}
