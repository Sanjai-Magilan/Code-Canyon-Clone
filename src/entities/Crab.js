import Enemy from "./Enemy";

export default class Crab extends Enemy {
  /**
   * Represents a Crab enemy unit.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   */
  constructor(scene, x, y) {
    // Inherit base physics and AI movement using Crab visual configurations
    super(scene, x, y, "crab", "crab-run", "worm-shadow");
  }
}
