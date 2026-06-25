import Phaser from "phaser";
import BULLET_CONFIG from "../config/bulletConfig";

export default class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "bullet");
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
   */
  fire(x, y, angle, speed = this.speed, scale = null) {
    // Re-enable the physics body and make the bullet active and visible
    this.enableBody(true, x, y, true, true);
    
    if (scale !== null) {
      this.setScale(scale);
    }
    
    // Set physics velocity based on the radian angle and speed
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.setVelocity(vx, vy);
    
    // Align sprite orientation with velocity direction
    this.setRotation(angle);
  }

  /**
   * Deactivates the bullet, returning it to the pool.
   */
  deactivate() {
    this.disableBody(true, true);
  }

  update() {
    if (!this.active || !this.body) return;

    // Return bullet to pool if it goes outside the world bounds
    const bounds = this.scene.physics.world.bounds;
    if (
      this.x < bounds.x ||
      this.x > bounds.right ||
      this.y < bounds.y ||
      this.y > bounds.bottom
    ) {
      this.deactivate();
    }
  }
}
