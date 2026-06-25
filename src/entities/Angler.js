import HoppingEnemy from "./HoppingEnemy";
import ANGLER_CONFIG from "../config/anglerConfig";

export default class Angler extends HoppingEnemy {
  /**
   * Represents an Angler enemy unit with hopping movement behavior.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   */
  constructor(scene, x, y) {
    // Inherit hopping behavior using Angler visual and movement configurations
    super(
      scene,
      x,
      y,
      "angler",
      "angler-run",
      "worm-shadow",
      0, // Speed is unused for continuous velocity
      ANGLER_CONFIG.scale,
      ANGLER_CONFIG.shadow,
      ANGLER_CONFIG
    );
  }
}
