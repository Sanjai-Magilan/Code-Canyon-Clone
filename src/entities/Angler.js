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
    super({
      scene,
      x,
      y,
      texture: "angler",
      animKey: "angler-run",
      shadowKey: "worm-shadow",
      speed: 0, // Speed is unused for continuous velocity
      scale: ANGLER_CONFIG.scale,
      shadowConfig: ANGLER_CONFIG.shadow,
      hoppingConfig: ANGLER_CONFIG
    });
  }
}
