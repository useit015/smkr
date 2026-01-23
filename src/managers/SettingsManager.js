/**
 * SettingsManager - Handles loading, saving, and applying game settings
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
	 * Load settings from localStorage or return defaults
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
	 * Save current settings to localStorage
	 */
	save () {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
		} catch (e) {
			console.warn('Failed to save settings:', e);
		}
	}

	/**
	 * Reset settings to defaults
	 */
	reset () {
		this.settings = JSON.parse(JSON.stringify(this.defaults));
		this.save();
	}

	/**
	 * Get a specific setting value
	 */
	get (category, key) {
		return this.settings[ category ]?.[ key ];
	}

	/**
	 * Set a specific setting value
	 */
	set (category, key, value) {
		if (this.settings[ category ]) {
			this.settings[ category ][ key ] = value;
		}
	}

	/**
	 * Get all settings
	 */
	getAll () {
		return this.settings;
	}

	/**
	 * Deep merge two objects
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
