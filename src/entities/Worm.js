import Enemy from "./Enemy";

export default class Worm extends Enemy {
  /**
   * Represents a Worm enemy unit.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   */
  constructor(scene, x, y) {
    // Inherit base physics and AI movement using Worm visual configurations
    super(scene, x, y, "worm", "worm-run", "worm-shadow");
  }
}
