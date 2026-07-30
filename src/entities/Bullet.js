import Phaser from "phaser";
import BULLET_CONFIG from "../config/bulletConfig";

export default class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, texture = "bullet") {
    super(scene, x, y, texture);
    this.setScale(BULLET_CONFIG.scale);
    this.speed = BULLET_CONFIG.speed; // Pixels per second (frame-rate independent)
    this.setDepth(BULLET_CONFIG.depth);
  }

  /**
   * Resets position and fires the bullet in a given angle.
   * @param {number} x Spawn X position
   * @param {number} y Spawn Y position
   * @param {number} angle Radian angle of trajectory
   * @param {number} speed Trajectory velocity speed
   * @param {number} scale Image sprite scale multiplier
   * @param {number|null} lifetime Projectile lifetime in ms
   * @param {object|null} parentVelocity Owner velocity to inherit
   * @param {number} inheritanceFactor Proportion of owner velocity to inherit (0.0 to 1.0)
   * @param {number} damage Damage value of bullet
   */
  fire({ x, y, angle, speed = this.speed, scale = null, lifetime = null, parentVelocity = null, inheritanceFactor = 0, damage = 1 }) {
    this.damage = damage;
    this.speed = speed;
    
    // Explicitly set GameObject transform position to sync with physics body reset
    this.setPosition(x, y);
    this.enableBody(true, x, y, true, true);
    
    if (scale !== null) {
      this.setScale(scale);
    }
    
    // Set physics velocity based on the radian angle and speed
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;

    // Apply parent velocity inheritance if configured
    if (parentVelocity && inheritanceFactor > 0) {
      vx += parentVelocity.x * inheritanceFactor;
      vy += parentVelocity.y * inheritanceFactor;
    }

    this.setVelocity(vx, vy);
    
    // Align sprite orientation with velocity direction
    this.setRotation(angle);

    // Set depth dynamically to render above characters while maintaining Y-sorting
    this.setDepth(y + 50);

    // Track spawn timing and lifetime limits
    this.timeFired = this.scene.time.now;
    this.lifetime = lifetime;
  }

  /**
   * Getter returning whether this is the final typing completion bullet.
   * @returns {boolean}
   */
  get isFinalTypingShot() {
    if (!this.targetEnemy?.assignedWord) {
      return false;
    }
    return (
      this.targetLetterIndex !== null &&
      this.targetLetterIndex >= this.targetEnemy.assignedWord.length - 1
    );
  }

  /**
   * Deactivates the bullet, returning it to the pool.
   * @param {string} reason Reason for deactivation
   */
  deactivate(reason = "manual destroy") {
    this.disableBody(true, true);
    this.targetEnemy = null;
    this.targetLetterIndex = null;
  }

  update() {
    if (!this.active || !this.body) return;

    // Continuous homing tracking toward target enemy so bullets never miss
    if (this.targetEnemy && this.targetEnemy.sprite && this.targetEnemy.sprite.active && !this.targetEnemy.isDead) {
      const targetSprite = this.targetEnemy.sprite;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetSprite.x, targetSprite.y);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.setRotation(angle);
    }

    // Check if bullet exceeded its configured lifetime limits
    if (this.lifetime && this.scene.time.now - this.timeFired >= this.lifetime) {
      this.deactivate("lifetime limit reached");
      return;
    }

    // Return bullet to pool if it goes outside the world bounds
    const bounds = this.scene.physics.world.bounds;
    if (
      this.x < bounds.x ||
      this.x > bounds.right ||
      this.y < bounds.y ||
      this.y > bounds.bottom
    ) {
      this.deactivate("out of bounds");
    }
  }
}
