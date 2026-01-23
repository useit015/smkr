import { CONFIG } from '../Config';

/**
 * Manages the state machine for character animations and synchronized sounds.
 */
export class AnimationStateMachine {
	/**
	 * @param {AnimationController} animController - The controller handling actual animation playback.
	 * @param {CharacterController} charController - The controller for character physics.
	 * @param {InputManager} inputManager - The input manager for movement state.
	 * @param {SoundManager} soundManager - The sound manager for footstep and jump sounds.
	 */
	constructor (animController, charController, inputManager, soundManager) {
		this.animations = animController;
		this.character = charController;
		this.input = inputManager;
		this.sounds = soundManager;
	}

	/**
	 * Updates the animation state and sounds based on the character's movement.
	 */
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

	/**
	 * Plays the appropriate jump animation based on whether the character is moving.
	 */
	playJumpAnimation () {
		const animName = this.input.isMoving ? 'jump_move' : 'jump_static';
		this.animations.play(animName, CONFIG.animation.jumpFadeDuration);
		this.sounds.play('jump');
	}

	/**
	 * Determines which animation should be playing based on input state.
	 * @returns {string} The name of the animation ('idle', 'walk', 'run').
	 * @private
	 */
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

