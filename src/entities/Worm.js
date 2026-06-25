import Enemy from "./Enemy";
import ENEMY_CONFIG from "../config/enemyConfig";

export default class Worm extends Enemy {
  /**
   * Represents a Worm enemy unit.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   */
  constructor(scene, x, y) {
    // Inherit base physics and AI movement using Worm visual configurations
    super(
      scene,
      x,
      y,
      "worm",
      "worm-run",
      "worm-shadow",
      ENEMY_CONFIG.speed,
      ENEMY_CONFIG.scale,
      ENEMY_CONFIG.shadow
    );
  }
}
