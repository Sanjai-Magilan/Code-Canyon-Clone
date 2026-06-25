import Bullet from "../entities/Bullet";
import BULLET_CONFIG from "../config/bulletConfig";

export default class ProjectileManager {
  /**
   * Manages projectile pooling, physics colliders, and collision callbacks.
   * @param {Phaser.Scene} scene The parent scene
   */
  constructor(scene) {
    this.scene = scene;

    // Initialize the pooled physics group for bullets
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: BULLET_CONFIG.maxSize
    });

    // Recycle bullets when they collide with obstacles (static stones)
    scene.physics.add.collider(this.bullets, scene.stones, (bullet) => {
      bullet.deactivate();
    });

    // Check for overlaps between bullets and the enemies physics group
    scene.physics.add.overlap(
      this.bullets,
      scene.enemiesGroup,
      this.handleBulletEnemyCollision,
      null,
      this
    );
  }

  /**
   * Spawns/recycles projectiles. Supports both a single shot info object or an array of them.
   * @param {object|object[]} shotData Coordinate and angle data
   */
  spawn(shotData) {
    if (Array.isArray(shotData)) {
      for (let i = 0; i < shotData.length; i++) {
        this.spawnSingle(shotData[i]);
      }
    } else if (shotData) {
      this.spawnSingle(shotData);
    }
  }

  /**
   * Spawns/recycles a single projectile.
   * @param {object} info Shot info containing x, y, angle, bulletTexture, bulletSpeed, and bulletScale
   * @private
   */
  spawnSingle(info) {
    // Set the texture dynamically when getting the bullet from the pool
    const bullet = this.bullets.get(info.x, info.y, info.bulletTexture);
    if (bullet) {
      bullet.fire(info.x, info.y, info.angle, info.bulletSpeed, info.bulletScale);
    }
  }

  /**
   * Handles collision logic when a bullet hits an enemy.
   * @param {Phaser.Physics.Arcade.Image} bullet The bullet sprite
   * @param {Phaser.Physics.Arcade.Sprite} enemySprite The enemy sprite
   */
  handleBulletEnemyCollision(bullet, enemySprite) {
    bullet.deactivate(); // Recycle bullet to the pool

    // Find and destroy the corresponding Enemy class wrapper
    const scene = this.scene;
    const index = scene.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index !== -1) {
      const enemy = scene.enemies[index];
      scene.enemies.splice(index, 1);
      enemy.sprite.destroy(); // Triggers destroy callback for shadow cleanup
    }
  }
}
