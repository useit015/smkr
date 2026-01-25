import mitt from 'mitt';

/**
 * Global event emitter for decoupled communication between game systems.
 */
export const events = mitt();

export const EVENTS = {
	GAME_START: 'game:start',
	GAME_OVER: 'game:over',
	GAME_PAUSE: 'game:pause',
	GAME_RESUME: 'game:resume',
	PLATFORM_SPAWN: 'platform:spawn',
	PLATFORM_DESPAWN: 'platform:despawn',
	SCORE_UPDATE: 'score:update',
	SETTINGS_CHANGE: 'settings:change',
};
