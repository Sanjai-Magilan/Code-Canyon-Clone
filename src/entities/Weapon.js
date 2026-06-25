import Phaser from "phaser";
import WEAPON_CONFIG from "../config/weaponConfig";

export default class Weapon {
  /**
   * Represents a weapon instance attached to an entity.
   * @param {Phaser.Scene} scene The parent scene
   * @param {object} owner The owner entity (e.g. Player or Enemy)
   * @param {string} configKey The weapon configuration key
   */
  constructor(scene, owner, configKey = "default") {
    this.scene = scene;
    this.owner = owner;
    
    // Load config from the frozen weapon configurations module
    this.config = WEAPON_CONFIG[configKey] || WEAPON_CONFIG.default;
    
    // Track firing cooldown timestamps
    this.lastFired = 0;
  }

  /**
   * Attempts to fire the weapon.
   * Handles cooldown checks and returns spawn data for one or more projectiles.
   * @param {object} muzzlePosition Exact spawning coordinates `{x, y}`
   * @param {boolean} isFlipped Flipped direction state of owner
   * @returns {object[]|null} Array of spawn details if bullets fired, null if blocked by cooldown
   */
  fire(muzzlePosition, isFlipped) {
    const timeNow = this.scene.time.now;
    
    // Cooldown check (Fire Rate)
    if (timeNow - this.lastFired < this.config.fireRate) {
      return null;
    }

    this.lastFired = timeNow;

    const baseAngle = typeof isFlipped === "number"
      ? isFlipped
      : (isFlipped ? Math.PI : 0);
    const spreadRad = Phaser.Math.DegToRad(this.config.spread || 0);
    const count = this.config.bulletCount || 1;

    const shots = [];
    const bulletTexture = this.config.bulletTexture || "bullet";
    const bulletSpeed = this.config.bulletSpeed || 1200;
    const bulletScale = this.config.bulletScale || 0.6;
    const bulletLifetime = this.config.projectileLifetime || null;

    if (count <= 1) {
      // If there's spread but only 1 bullet (like a machine gun), apply random spread
      const angle = baseAngle + (spreadRad > 0 ? Phaser.Math.FloatBetween(-spreadRad / 2, spreadRad / 2) : 0);
      shots.push({
        x: muzzlePosition.x,
        y: muzzlePosition.y,
        angle: angle,
        bulletTexture,
        bulletSpeed,
        bulletScale,
        bulletLifetime
      });
    } else {
      // For multi-bullet weapons (like shotgun), distribute them evenly across the spread range
      for (let i = 0; i < count; i++) {
        const angle = baseAngle - (spreadRad / 2) + (i * (spreadRad / (count - 1)));
        shots.push({
          x: muzzlePosition.x,
          y: muzzlePosition.y,
          angle: angle,
          bulletTexture,
          bulletSpeed,
          bulletScale,
          bulletLifetime
        });
      }
    }

    return shots;
  }
}
