Original prompt: this should be a parkour game not a speedrunner. i need someway to have better maps adjusted for parkour, with obstacles and stuff ...

Notes:
- Added parkour-focused platform patterns (stairs up/down, zigzag, long jumps) to world generation.
- Added obstacle spawning (hurdles, walls, pillars) per platform to create parkour challenges.
- Added render_game_to_text + advanceTime hooks for testing automation.

TODO:
- Verify obstacle placements feel fair in gameplay (no unavoidable blocks).
- Consider adding hazard/penalty logic if obstacles should do more than block movement.
