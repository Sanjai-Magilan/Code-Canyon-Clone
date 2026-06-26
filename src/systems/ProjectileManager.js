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

    // Initialize the pooled physics group for enemy bullets
    this.enemyBullets = scene.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: BULLET_CONFIG.maxSize
    });

    // Recycle bullets when they collide with obstacles (static stones)
    scene.physics.add.collider(this.bullets, scene.stones, (bullet) => {
      bullet.deactivate();
    });

    scene.physics.add.collider(this.enemyBullets, scene.stones, (bullet) => {
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

    // Check for overlaps between enemy bullets and the player
    scene.physics.add.overlap(
      this.enemyBullets,
      scene.player.getSprite(),
      this.handleBulletPlayerCollision,
      null,
      this
    );
  }

  /**
   * Spawns/recycles projectiles. Supports both a single shot info object or an array of them.
   * @param {object|object[]} shotData Coordinate and angle data
   * @param {boolean} isEnemy True if spawned by an enemy unit
   * @param {object|null} parentVelocity Velocity vector of the parent entity
   */
  spawn(shotData, isEnemy = false, parentVelocity = null) {
    if (Array.isArray(shotData)) {
      for (let i = 0; i < shotData.length; i++) {
        this.spawnSingle(shotData[i], isEnemy, parentVelocity);
      }
    } else if (shotData) {
      this.spawnSingle(shotData, isEnemy, parentVelocity);
    }
  }

  /**
   * Spawns/recycles a single projectile.
   * @param {object} info Shot info containing x, y, angle, bulletTexture, bulletSpeed, and bulletScale
   * @param {boolean} isEnemy True if spawned by an enemy unit
   * @param {object|null} parentVelocity Velocity vector of the parent entity
   * @private
   */
  spawnSingle(info, isEnemy, parentVelocity) {
    const group = isEnemy ? this.enemyBullets : this.bullets;
    // Set the texture dynamically when getting the bullet from the pool
    const bullet = group.get(info.x, info.y, info.bulletTexture);
    if (bullet) {
      if (info.bulletTexture) {
        bullet.setTexture(info.bulletTexture);
      }
      bullet.fire(
        info.x,
        info.y,
        info.angle,
        info.bulletSpeed,
        info.bulletScale,
        info.bulletLifetime,
        parentVelocity,
        info.velocityInheritanceFactor
      );
    }
  }

  /**
   * Handles collision logic when an enemy bullet hits the player.
   * @param {any} arg1 First physics object in overlap
   * @param {any} arg2 Second physics object in overlap
   */
  handleBulletPlayerCollision(arg1, arg2) {
    // Determine which argument is the bullet by checking for the deactivate method
    let bullet = null;
    if (arg1 && typeof arg1.deactivate === "function") {
      bullet = arg1;
    } else if (arg2 && typeof arg2.deactivate === "function") {
      bullet = arg2;
    }

    if (bullet) {
      bullet.deactivate(); // Recycle bullet to pool
    } else {
      // Fallback: deactivate whichever is not the player sprite
      const playerSprite = this.scene.player ? this.scene.player.getSprite() : null;
      if (arg1 && arg1 !== playerSprite && typeof arg1.disableBody === "function") {
        arg1.disableBody(true, true);
      } else if (arg2 && arg2 !== playerSprite && typeof arg2.disableBody === "function") {
        arg2.disableBody(true, true);
      }
    }

    // Deal damage to the Player wrapper in the scene
    if (this.scene.player) {
      this.scene.player.takeDamage(10); // Standard damage value
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
      
      // Spawn death explosion at enemy position
      if (typeof scene.spawnEnemyExplosion === "function") {
        scene.spawnEnemyExplosion(enemySprite.x, enemySprite.y);
      }
      
      // Roll and spawn weapon drop if successful
      if (typeof enemy.dropGunId === "function") {
        const gunId = enemy.dropGunId();
        if (gunId && scene.weaponDropManager) {
          scene.weaponDropManager.spawnPickup(enemySprite.x, enemySprite.y, gunId);
        }
      }
      
      enemy.sprite.destroy(); // Triggers destroy callback for shadow cleanup
    }
  }
}
