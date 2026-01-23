import { CONFIG } from '../Config';

export class AnimationStateMachine {
	constructor (animController, charController, inputManager, soundManager) {
		this.animations = animController;
		this.character = charController;
		this.input = inputManager;
		this.sounds = soundManager;
	}

	update () {
		// Don't change animation while jumping
		if (this.character.isJumping) {
			// Only stop footstep sounds, not jump sound
			this.sounds.stop('walk');
			this.sounds.stop('run');
			return;
		}

		const animationName = this._determineAnimation();
		this.animations.play(animationName);

		// Handle sounds
		if (animationName === 'walk') {
			this.sounds.stop('run');
			this.sounds.play('walk');
		} else if (animationName === 'run') {
			this.sounds.stop('walk');
			this.sounds.play('run');
		} else {
			this.sounds.stop('walk');
			this.sounds.stop('run');
		}
	}

	playJumpAnimation () {
		const animName = this.input.isMoving ? 'jump_move' : 'jump_static';
		this.animations.play(animName, CONFIG.animation.jumpFadeDuration);
		this.sounds.play('jump');
	}

	_determineAnimation () {
		if (!this.input.isMoving) {
			return 'idle';
		}

		if (this.input.isRunning) {
			return 'run';
		}

		return 'walk';
	}
}

