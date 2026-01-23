/**
 * SettingsUI - Manages the settings panel UI and interactions
 */
export class SettingsUI {
	constructor (settingsManager, onSettingsChanged) {
		this.settingsManager = settingsManager;
		this.onSettingsChanged = onSettingsChanged;

		// DOM Elements
		this.settingsPanel = document.getElementById('settings-panel');
		this.closeSettingsBtn = document.getElementById('close-settings');
		this.saveSettingsBtn = document.getElementById('save-settings');
		this.resetSettingsBtn = document.getElementById('reset-settings');
		this.tabButtons = document.querySelectorAll('.tab-btn');

		// Settings inputs
		this.inputs = {
			mouseSensitivity: document.getElementById('mouse-sensitivity'),
			shadowQuality: document.getElementById('shadow-quality'),
			renderDistance: document.getElementById('render-distance'),
			antialiasing: document.getElementById('antialiasing'),
			masterVolume: document.getElementById('master-volume'),
			sfxVolume: document.getElementById('sfx-volume'),
			musicVolume: document.getElementById('music-volume')
		};

		// Value displays
		this.displays = {
			sensitivityValue: document.getElementById('sensitivity-value'),
			distanceValue: document.getElementById('distance-value'),
			masterValue: document.getElementById('master-value'),
			sfxValue: document.getElementById('sfx-value'),
			musicValue: document.getElementById('music-value')
		};

		this._setupEventListeners();
	}

	_setupEventListeners () {
		// Close settings
		this.closeSettingsBtn?.addEventListener('click', () => this.close());
		this.settingsPanel?.addEventListener('click', (e) => {
			if (e.target === this.settingsPanel) this.close();
		});

		// Save settings
		this.saveSettingsBtn?.addEventListener('click', () => this.save());

		// Reset settings
		this.resetSettingsBtn?.addEventListener('click', () => this.reset());

		// Tab switching
		this.tabButtons.forEach(btn => {
			btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
		});

		// Slider value updates
		this._setupSliderListener(this.inputs.mouseSensitivity, this.displays.sensitivityValue, (v) => v);
		this._setupSliderListener(this.inputs.renderDistance, this.displays.distanceValue, (v) => v);
		this._setupSliderListener(this.inputs.masterVolume, this.displays.masterValue, (v) => `${ v }%`);
		this._setupSliderListener(this.inputs.sfxVolume, this.displays.sfxValue, (v) => `${ v }%`);
		this._setupSliderListener(this.inputs.musicVolume, this.displays.musicValue, (v) => `${ v }%`);
	}

	_setupSliderListener (slider, display, formatter) {
		if (!slider || !display) return;
		slider.addEventListener('input', () => {
			display.textContent = formatter(slider.value);
		});
	}

	open () {
		console.log('SettingsUI: Opening settings panel');
		this._loadSettingsToUI();
		this.settingsPanel.classList.remove('hidden');
	}

	close () {
		this.settingsPanel.classList.add('hidden');
	}

	_loadSettingsToUI () {
		const settings = this.settingsManager.getAll();

		// Controls
		if (this.inputs.mouseSensitivity) {
			this.inputs.mouseSensitivity.value = settings.controls.mouseSensitivity;
			this.displays.sensitivityValue.textContent = settings.controls.mouseSensitivity;
		}

		// Graphics
		if (this.inputs.shadowQuality) {
			this.inputs.shadowQuality.value = settings.graphics.shadowQuality;
		}
		if (this.inputs.renderDistance) {
			this.inputs.renderDistance.value = settings.graphics.renderDistance;
			this.displays.distanceValue.textContent = settings.graphics.renderDistance;
		}
		if (this.inputs.antialiasing) {
			this.inputs.antialiasing.checked = settings.graphics.antialiasing;
		}

		// Audio
		if (this.inputs.masterVolume) {
			this.inputs.masterVolume.value = settings.audio.masterVolume;
			this.displays.masterValue.textContent = `${ settings.audio.masterVolume }%`;
		}
		if (this.inputs.sfxVolume) {
			this.inputs.sfxVolume.value = settings.audio.sfxVolume;
			this.displays.sfxValue.textContent = `${ settings.audio.sfxVolume }%`;
		}
		if (this.inputs.musicVolume) {
			this.inputs.musicVolume.value = settings.audio.musicVolume;
			this.displays.musicValue.textContent = `${ settings.audio.musicVolume }%`;
		}
	}

	_switchTab (tabId) {
		this.tabButtons.forEach(btn => {
			btn.classList.toggle('active', btn.dataset.tab === tabId);
		});

		document.querySelectorAll('.tab-content').forEach(content => {
			content.classList.toggle('active', content.id === `tab-${ tabId }`);
		});
	}

	save () {
		this.settingsManager.set('controls', 'mouseSensitivity', parseInt(this.inputs.mouseSensitivity.value));
		this.settingsManager.set('graphics', 'shadowQuality', this.inputs.shadowQuality.value);
		this.settingsManager.set('graphics', 'renderDistance', parseInt(this.inputs.renderDistance.value));
		this.settingsManager.set('graphics', 'antialiasing', this.inputs.antialiasing.checked);
		this.settingsManager.set('audio', 'masterVolume', parseInt(this.inputs.masterVolume.value));
		this.settingsManager.set('audio', 'sfxVolume', parseInt(this.inputs.sfxVolume.value));
		this.settingsManager.set('audio', 'musicVolume', parseInt(this.inputs.musicVolume.value));

		this.settingsManager.save();

		this.close();

		if (this.onSettingsChanged) {
			this.onSettingsChanged(this.settingsManager.getAll());
		}
	}

	reset () {
		this.settingsManager.reset();
		this._loadSettingsToUI();
	}
}
