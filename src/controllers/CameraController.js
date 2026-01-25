import * as THREE from 'three';
import { CONFIG } from '../Config';

/**
 * Manages the camera behavior, including following the character and handling presets.
 */
export class CameraController {
	/**
	 * @param {THREE.Camera} camera - The camera to manage.
	 * @param {OrbitControls} controls - The controls associated with the camera.
	 * @param {THREE.Object3D} target - The character model to follow.
	 */
	constructor (camera, controls, target) {
		this.camera = camera;
		this.controls = controls;
		this.target = target;
		this.initialized = false;
		this.currentPreset = 'medium';

		// Reusable vectors to avoid allocations in the update loop
		this._currentOffset = new THREE.Vector3();
		this._idealOffset = new THREE.Vector3();
		this._targetPos = new THREE.Vector3();
		this._characterHead = new THREE.Vector3();
		this._tempVec = new THREE.Vector3();
	}

	/**
	 * Sets the camera distance and height based on a predefined preset.
	 * @param {string} presetName - Name of the preset ('close', 'medium', 'far').
	 */
	setPreset (presetName) {
		const preset = CONFIG.camera.presets[ presetName ];
		if (preset) {
			CONFIG.camera.chaseDistance = preset.distance;
			CONFIG.camera.chaseHeight = preset.height;
			this.currentPreset = presetName;
		}
	}

	/**
	 * Initializes the camera position and target based on the character's location.
	 */
	initializePosition () {
		const targetPos = this.target.position;
		const offset = CONFIG.camera.initialOffset;
		const headOffset = CONFIG.camera.targetOffset;

		this._characterHead.copy(targetPos).add(
			this._tempVec.set(headOffset.x, headOffset.y, headOffset.z)
		);

		this.controls.target.copy(this._characterHead);
		this.camera.position.set(
			targetPos.x + offset.x,
			targetPos.y + offset.y,
			targetPos.z + offset.z
		);
		this.camera.lookAt(this._characterHead);
		this.controls.update();

		this.initialized = true;
	}

	/**
	 * Updates the camera position to smoothly follow the character.
	 * Applies mouse sensitivity settings to the controls.
	 */
	update () {
		if (!this.initialized || !this.target) return;

		const { chaseDistance, chaseHeight, smoothFactor, targetOffset } = CONFIG.camera;

		// Get current offset from character to camera
		this._currentOffset.copy(this.camera.position).sub(this.target.position);
		this._currentOffset.y = 0; // Flatten to get horizontal offset

		// Maintain current horizontal angle but adjust distance
		const currentAngle = Math.atan2(this._currentOffset.x, this._currentOffset.z);

		// Create ideal position maintaining current angle
		this._idealOffset.set(
			Math.sin(currentAngle) * chaseDistance,
			chaseHeight,
			Math.cos(currentAngle) * chaseDistance
		);

		this._targetPos.copy(this.target.position).add(this._idealOffset);

		// Smooth follow with position lerp
		this.camera.position.lerp(this._targetPos, smoothFactor);

		// Always keep the target on the character's head
		this._characterHead.copy(this.target.position).add(
			this._tempVec.set(targetOffset.x, targetOffset.y, targetOffset.z)
		);
		this.controls.target.lerp(this._characterHead, smoothFactor);

		// Apply sensitivity (default 5, range 1-10)
		// OrbitControls rotateSpeed defaults to 1.0
		// We map 1-10 to 0.2 - 2.0
		if (CONFIG.controls.mouseSensitivity) {
			this.controls.rotateSpeed = CONFIG.controls.mouseSensitivity / 5.0;
		}

		this.controls.update();
	}
}
