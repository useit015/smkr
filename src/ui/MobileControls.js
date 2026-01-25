import nipplejs from 'nipplejs';

/**
 * Manages mobile-specific UI controls like virtual joysticks.
 */
export class MobileControls {
	constructor(onMove, onJump) {
		this.onMove = onMove;
		this.onJump = onJump;
		this.joystick = null;
		this.init();
	}

	init() {
		// Only initialize if touch is supported
		if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return;

		// Create container for joystick
		const container = document.createElement('div');
		container.id = 'joystick-container';
		container.style.position = 'absolute';
		container.style.bottom = '50px';
		container.style.left = '50px';
		container.style.width = '150px';
		container.style.height = '150px';
		container.style.zIndex = '1000';
		document.body.appendChild(container);

		// Create jump button
		const jumpBtn = document.createElement('button');
		jumpBtn.id = 'jump-button';
		jumpBtn.innerText = 'JUMP';
		jumpBtn.style.position = 'absolute';
		jumpBtn.style.bottom = '50px';
		jumpBtn.style.right = '50px';
		jumpBtn.style.width = '80px';
		jumpBtn.style.height = '80px';
		jumpBtn.style.borderRadius = '50%';
		jumpBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
		jumpBtn.style.color = 'white';
		jumpBtn.style.border = '2px solid white';
		jumpBtn.style.zIndex = '1000';
		document.body.appendChild(jumpBtn);

		jumpBtn.addEventListener('touchstart', (e) => {
			e.preventDefault();
			if (this.onJump) this.onJump();
		});

		this.joystick = nipplejs.create({
			zone: container,
			mode: 'static',
			position: { left: '75px', top: '75px' },
			color: 'white',
		});

		this.joystick.on('move', (evt, data) => {
			if (this.onMove) {
				// Convert to forward/right components
				const forward = Math.sin(data.angle.radian);
				const right = Math.cos(data.angle.radian);
				const force = Math.min(data.force, 1.0);
				this.onMove({ forward, right, force });
			}
		});

		this.joystick.on('end', () => {
			if (this.onMove) this.onMove({ forward: 0, right: 0, force: 0 });
		});
	}

	show(visible) {
		const container = document.getElementById('joystick-container');
		const jumpBtn = document.getElementById('jump-button');
		if (container) container.style.display = visible ? 'block' : 'none';
		if (jumpBtn) jumpBtn.style.display = visible ? 'block' : 'none';
	}
}
