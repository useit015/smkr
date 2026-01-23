# SMOKER - A 3D Adventure

A modular 3D third-person character controller and game engine built with **Three.js** and **Vite**.

## 🚀 Features

- **Third-Person Controller**: Smooth character movement and camera following.
- **Animation System**: State-based animation switching (Idle, Walk, Run, Jump).
- **Settings System**: Real-time adjustable graphics, controls, and audio settings.
- **Modular Architecture**: Clean separation of concerns between core engine, controllers, managers, and UI.
- **Dynamic Model Loading**: Supports FBX models with automated animation clip preparation.
- **Sound System**: Integrated spatial audio and background music management.

## 🛠️ Project Structure

```text
├── public/              # Static assets (models, sounds)
├── src/
│   ├── animations/      # Animation controllers and state machines
│   ├── controllers/     # Character and Camera movement logic
│   ├── core/            # Low-level Three.js setup (Scene, Loader)
│   ├── managers/        # Input, Settings, and Sound management
│   ├── ui/              # HUD, Menus, and Settings panels
│   ├── Config.js        # Global game configuration
│   └── Game.js          # Main game entry point and orchestrator
├── main.js              # Entry point for the application
└── index.html           # Main HTML container
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Production Build

Create a production-ready build:
```bash
npm run build
```

## 🎮 Controls

- **WASD / Arrow Keys**: Move character
- **Shift**: Run
- **Space**: Jump
- **Mouse**: Rotate camera
- **ESC**: Pause game

## 🏗️ Architecture Overview

### Core Systems
- **SceneBuilder**: Simplifies the creation of Three.js scene, camera, renderer, and lighting.
- **ModelLoader**: Handles asynchronous FBX loading and prepares animation tracks to match the target model's skeleton.

### Movement & Animation
- **CharacterController**: Manages character physics, movement directions, and rotation.
- **AnimationStateMachine**: Translates character and input states into specific animation sequences.

### UI & Management
- **SettingsManager**: Handles persistence and application of user preferences.
- **SoundManager**: Wraps Three.js Audio system for easy sound effect and music management.

## 📄 License

This project is licensed under the ISC License.
