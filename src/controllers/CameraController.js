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
		const targetPos = this.target.position.clone();
		const offset = CONFIG.camera.initialOffset;
		const headOffset = CONFIG.camera.targetOffset;

		const characterHead = targetPos.clone().add(
			new THREE.Vector3(headOffset.x, headOffset.y, headOffset.z)
		);

		this.controls.target.copy(characterHead);
		this.camera.position.set(
			targetPos.x + offset.x,
			targetPos.y + offset.y,
			targetPos.z + offset.z
		);
		this.camera.lookAt(characterHead);
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
		const currentOffset = this.camera.position.clone().sub(this.target.position);
		currentOffset.y = 0; // Flatten to get horizontal offset

		// Maintain current horizontal angle but adjust distance
		const currentAngle = Math.atan2(currentOffset.x, currentOffset.z);

		// Create ideal position maintaining current angle
		const idealOffset = new THREE.Vector3(
			Math.sin(currentAngle) * chaseDistance,
			chaseHeight,
			Math.cos(currentAngle) * chaseDistance
		);

		const targetPos = this.target.position.clone().add(idealOffset);

		// Smooth follow with position lerp
		this.camera.position.lerp(targetPos, smoothFactor);

		// Always keep the target on the character's head
		const characterHead = this.target.position.clone().add(
			new THREE.Vector3(targetOffset.x, targetOffset.y, targetOffset.z)
		);
		this.controls.target.lerp(characterHead, smoothFactor);

		// Apply sensitivity (default 5, range 1-10)
		// OrbitControls rotateSpeed defaults to 1.0
		// We map 1-10 to 0.2 - 2.0
		if (CONFIG.controls.mouseSensitivity) {
			this.controls.rotateSpeed = CONFIG.controls.mouseSensitivity / 5.0;
		}

		this.controls.update();
	}
}
