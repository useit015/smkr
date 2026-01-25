import * as THREE from 'three';
import { CONFIG } from '../Config';

/**
 * Wraps Three.js AnimationMixer to simplify playing and blending animations.
 */
export class AnimationController {
	/**
	 * @param {THREE.AnimationMixer} mixer - The animation mixer for the character model.
	 */
	constructor (mixer) {
		this.mixer = mixer;
		this.actions = {};
		this.activeAction = null;
		this.currentActionName = null;
	}

	/**
	 * Registers an animation clip as a named action.
	 * @param {string} name - Name of the action.
	 * @param {THREE.AnimationClip} clip - The animation clip to register.
	 * @param {Object} [options={}] - Options for the action (e.g., loop: 'once').
	 * @returns {THREE.AnimationAction} The created animation action.
	 */
	addAction (name, clip, options = {}) {
		const action = this.mixer.clipAction(clip);

		if (options.loop === 'once') {
			action.setLoop(THREE.LoopOnce);
			action.clampWhenFinished = true;
		}

		this.actions[ name ] = action;
		return action;
	}

	/**
	 * Retrieves a registered animation action by name.
	 * @param {string} name - The name of the action.
	 * @returns {THREE.AnimationAction|null} The requested action or null if not found.
	 */
	getAction (name) {
		return this.actions[ name ] || null;
	}

	/**
	 * Plays a named animation, cross-fading from the current active animation.
	 * @param {string} name - The name of the animation to play.
	 * @param {number} [fadeTime=CONFIG.animation.crossFadeDuration] - Duration of the cross-fade in seconds.
	 */
	play (name, fadeTime = CONFIG.animation.crossFadeDuration) {
		const newAction = this.actions[ name ];
		if (!newAction || this.activeAction === newAction) return;

		const oldAction = this.activeAction;
		this.activeAction = newAction;
		this.currentActionName = name;

		if (oldAction) {
			oldAction.fadeOut(fadeTime);
		}

		this.activeAction.reset().fadeIn(fadeTime).play();
	}

	/**
	 * Updates the animation mixer.
	 * @param {number} dt - Delta time in seconds.
	 */
	update (dt) {
		if (this.mixer) {
			this.mixer.update(dt);
		}
	}

	/**
	 * Gets the currently active animation action.
	 * @type {THREE.AnimationAction|null}
	 */
	get currentAction () {
		return this.activeAction;
	}
}
