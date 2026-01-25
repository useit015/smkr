import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputManager } from '../managers/InputManager';

describe('InputManager', () => {
	let inputManager;

	beforeEach(() => {
		inputManager = new InputManager();
	});

	it('should track key down and up', () => {
		const event = new KeyboardEvent('keydown', { code: 'KeyW' });
		window.dispatchEvent(event);
		expect(inputManager.keys.KeyW).toBe(true);

		const upEvent = new KeyboardEvent('keyup', { code: 'KeyW' });
		window.dispatchEvent(upEvent);
		expect(inputManager.keys.KeyW).toBe(false);
	});

	it('should identify when moving', () => {
		expect(inputManager.isMoving).toBe(false);

		const event = new KeyboardEvent('keydown', { code: 'KeyW' });
		window.dispatchEvent(event);
		expect(inputManager.isMoving).toBe(true);
	});

	it('should fire jump callback', () => {
		const onJump = vi.fn();
		inputManager.onJumpPressed = onJump;

		const event = new KeyboardEvent('keydown', { code: 'Space' });
		window.dispatchEvent(event);

		expect(onJump).toHaveBeenCalledTimes(1);
	});
});
