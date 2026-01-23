import * as THREE from 'three';

export class SoundManager {
	constructor (camera) {
		this.listener = new THREE.AudioListener();
		camera.add(this.listener);

		this.sounds = {};
		this.music = {};
		this.audioLoader = new THREE.AudioLoader();

		this.volumes = {
			master: 1.0,
			sfx: 1.0,
			music: 1.0
		};
	}

	async loadSound (name, url, options = {}) {
		console.log(`SoundManager: Loading ${ name } from ${ url }`, options);
		const loop = options.loop !== undefined ? options.loop : false;
		const isMusic = options.isMusic || false;
		const volume = options.volume || 0.5;

		if (isMusic) {
			return new Promise((resolve, reject) => {
				const audio = new Audio(url);
				audio.loop = loop;
				audio._baseVolume = volume;

				// Apply initial volume
				this._updateMusicVolume(audio);

				this.music[ name ] = audio;

				// For HTML5 Audio, we resolve when metadata is loaded or canplay
				const onCanPlay = () => {
					console.log(`SoundManager: HTML5 Audio loaded for ${ name }`);
					resolve(audio);
				};

				audio.addEventListener('canplaythrough', onCanPlay, { once: true });
				audio.addEventListener('error', (e) => {
					console.error(`SoundManager: HTML5 Audio error for ${ name }`, e);
					reject(e);
				});

				// Trigger load
				audio.load();
			});
		}

		return new Promise((resolve, reject) => {
			this.audioLoader.load(url, (buffer) => {
				console.log(`SoundManager: Successfully loaded buffer for ${ name }`);
				const sound = new THREE.Audio(this.listener);
				sound.setBuffer(buffer);
				sound.setLoop(loop);
				sound.setVolume(volume);

				this.sounds[ name ] = sound;
				sound.setVolume(volume * this.volumes.sfx);

				resolve(sound);
			}, undefined, (err) => {
				console.error(`SoundManager: Failed to load ${ name }`, err);
				reject(err);
			});
		});
	}

	play (name) {
		const sound = this.sounds[ name ];
		if (!sound) return;

		// For one-shot sounds, stop first to allow replay
		if (!sound.loop && sound.isPlaying) {
			sound.stop();
		}

		if (!sound.isPlaying) {
			sound.play();
		}
	}

	playMusic (name) {
		console.log(`SoundManager: PlayMusic '${ name }' requested`);
		const audio = this.music[ name ];
		if (!audio) {
			console.warn(`SoundManager: Music '${ name }' not found in registry`);
			return;
		}

		this._updateMusicVolume(audio);

		if (audio.paused) {
			audio.play().catch(e => {
				console.error(`SoundManager: Playback failed for '${ name }'`, e);
			});
		}
	}

	stop (name) {
		if (this.sounds[ name ] && this.sounds[ name ].isPlaying) {
			this.sounds[ name ].stop();
		}
		if (this.music[ name ]) {
			this.music[ name ].pause();
			this.music[ name ].currentTime = 0;
		}
	}

	stopAll () {
		Object.values(this.sounds).forEach(sound => {
			if (sound.isPlaying) sound.stop();
		});
		Object.values(this.music).forEach(audio => {
			audio.pause();
			audio.currentTime = 0;
		});
	}

	pauseAll () {
		Object.values(this.sounds).forEach(sound => {
			if (sound.isPlaying) {
				sound.pause();
				sound._wasPlaying = true;
			}
		});
		Object.values(this.music).forEach(audio => {
			if (!audio.paused) {
				audio.pause();
				audio._wasPlaying = true;
			}
		});
	}

	resumeAll () {
		Object.values(this.sounds).forEach(sound => {
			if (sound._wasPlaying) {
				sound.play();
				delete sound._wasPlaying;
			}
		});
		Object.values(this.music).forEach(audio => {
			if (audio._wasPlaying) {
				audio.play().catch(e => console.error("Resume failed", e));
				delete audio._wasPlaying;
			}
		});
	}

	/**
	 * Set master volume for the audio listener
	 * @param {number} volume - Volume level between 0 and 1
	 */
	setMasterVolume (volume) {
		this.volumes.master = volume;
		this.listener.setMasterVolume(volume);

		// Update HTML5 audio volumes
		Object.values(this.music).forEach(audio => {
			this._updateMusicVolume(audio);
		});
	}

	setSfxVolume (volume) {
		this.volumes.sfx = volume;
		Object.values(this.sounds).forEach(sound => {
			sound.setVolume(0.5 * volume);
		});
	}

	setMusicVolume (volume) {
		this.volumes.music = volume;
		Object.values(this.music).forEach(audio => {
			this._updateMusicVolume(audio);
		});
	}

	_updateMusicVolume (audio) {
		if (audio && audio._baseVolume !== undefined) {
			const finalVol = audio._baseVolume * this.volumes.music * this.volumes.master;
			audio.volume = Math.max(0, Math.min(1, finalVol));
		}
	}
}
