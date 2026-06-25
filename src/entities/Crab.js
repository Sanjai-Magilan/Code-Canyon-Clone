import RangedEnemy from "./RangedEnemy";
import CRAB_CONFIG from "../config/crabConfig";

export default class Crab extends RangedEnemy {
  /**
   * Represents a Crab enemy unit.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   */
  constructor(scene, x, y) {
    // Inherit base ranged enemy behavior and weapon capabilities
    super(scene, x, y, "crab", "crab-run", "worm-shadow", CRAB_CONFIG);
  }
}
