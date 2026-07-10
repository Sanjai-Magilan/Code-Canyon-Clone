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
    super({
      scene,
      x,
      y,
      texture: "worm",
      animKey: "worm-run",
      shadowKey: "worm-shadow",
      speed: ENEMY_CONFIG.speed,
      scale: ENEMY_CONFIG.scale,
      shadowConfig: ENEMY_CONFIG.shadow
    });
  }
}
