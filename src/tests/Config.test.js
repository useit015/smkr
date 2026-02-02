import { describe, it, expect } from 'vitest';
import { CONFIG } from '../Config';

describe('Game Configuration', () => {
	it('should have a character configuration', () => {
		expect(CONFIG.character).toBeDefined();
		expect(CONFIG.character.walkSpeed).toBeGreaterThan(0);
		expect(CONFIG.character.runSpeed).toBeGreaterThan(CONFIG.character.walkSpeed);
		expect(CONFIG.character.jumpMoveSpeed).toBeDefined();
	});

	it('should have physics configuration', () => {
		expect(CONFIG.physics).toBeDefined();
		expect(CONFIG.physics.gravity).toBeLessThan(0);
	});

	it('should have at least one character', () => {
		expect(Object.keys(CONFIG.characters).length).toBeGreaterThan(0);
	});
});
