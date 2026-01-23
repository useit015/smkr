import * as THREE from 'three';
import { CONFIG } from '../Config';

export class AnimationController {
	constructor (mixer) {
		this.mixer = mixer;
		this.actions = {};
		this.activeAction = null;
	}

	addAction (name, clip, options = {}) {
		const action = this.mixer.clipAction(clip);

		if (options.loop === 'once') {
			action.setLoop(THREE.LoopOnce);
			action.clampWhenFinished = true;
		}

		this.actions[ name ] = action;
		return action;
	}

	getAction (name) {
		return this.actions[ name ] || null;
	}

	play (name, fadeTime = CONFIG.animation.crossFadeDuration) {
		const newAction = this.actions[ name ];
		if (!newAction || this.activeAction === newAction) return;

		const oldAction = this.activeAction;
		this.activeAction = newAction;

		if (oldAction) {
			oldAction.fadeOut(fadeTime);
		}

		this.activeAction.reset().fadeIn(fadeTime).play();
	}

	update (dt) {
		if (this.mixer) {
			this.mixer.update(dt);
		}
	}

	get currentAction () {
		return this.activeAction;
	}
}
