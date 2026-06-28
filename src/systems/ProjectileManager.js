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
        info.velocityInheritanceFactor,
        info.bulletDamage
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
      this.scene.player.takeDamage(10, bullet); // Standard damage value
    }
  }

  /**
   * Handles collision logic when a bullet hits an enemy.
   * @param {Phaser.Physics.Arcade.Image} bullet The bullet sprite
   * @param {Phaser.Physics.Arcade.Sprite} enemySprite The enemy sprite
   */
  handleBulletEnemyCollision(bullet, enemySprite) {
    if (!enemySprite || !enemySprite.active) {
      bullet.deactivate();
      return;
    }

    const damage = bullet.damage !== undefined ? bullet.damage : 50;
    bullet.deactivate(); // Recycle bullet to the pool

    if (bullet.texture && bullet.texture.key === "bullet_gun5") {
      this.triggerExplosionDamage(enemySprite.x, enemySprite.y, damage);
      return;
    }

    // Find and apply damage to the corresponding Enemy class wrapper
    const scene = this.scene;
    const index = scene.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index !== -1) {
      const enemy = scene.enemies[index];
      if (typeof enemy.takeDamage === "function") {
        enemy.takeDamage(damage);
      } else {
        enemy.health -= damage;
        if (enemy.health <= 0) {
          enemy.die();
        }
      }
    }
  }

  /**
   * Applies area-of-effect explosion damage in a radius.
   * @param {number} x X coordinate of explosion
   * @param {number} y Y coordinate of explosion
   * @param {number} damage Damage value to apply
   */
  triggerExplosionDamage(x, y, damage) {
    try {
      const radius = 150; // Big diameter of 300px
      const scene = this.scene;

      // Visual explosion effect
      if (typeof scene.spawnEnemyExplosion === "function") {
        scene.spawnEnemyExplosion(x, y);
      }

      // Clone enemies array to prevent modifications during iteration
      const targets = [...scene.enemies];
      for (let i = 0; i < targets.length; i++) {
        const enemy = targets[i];
        if (!enemy || !enemy.sprite || !enemy.sprite.active) continue;

        const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
        if (dist <= radius) {
          if (typeof enemy.takeDamage === "function") {
            enemy.takeDamage(damage);
          } else {
            enemy.health -= damage;
            if (enemy.health <= 0) {
              enemy.die();
            }
          }
        }
      }
    } catch (err) {
      console.error("CRITICAL EXPLOSION ERROR:", err);
    }
  }
}
