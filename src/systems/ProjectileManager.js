import Bullet from "../entities/Bullet";
import BULLET_CONFIG from "../config/bulletConfig";
import { DAMAGE_SOURCE } from "../config/damageSources";

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
      bullet.deactivate("stone collision");
    });

    scene.physics.add.collider(this.enemyBullets, scene.stones, (bullet) => {
      bullet.deactivate("enemy bullet stone collision");
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
   * @param {object} info Shot info containing x, y, angle, bulletTexture, bulletSpeed, bulletScale, bulletLifetime, bulletDamage, and targetEnemy
   * @param {boolean} isEnemy True if spawned by an enemy unit
   * @param {object|null} parentVelocity Velocity vector of the parent entity
   */
  spawnSingle(info, isEnemy = false, parentVelocity = null) {
    const group = isEnemy ? this.enemyBullets : this.bullets;
    const bullet = group.get(info.x, info.y, info.bulletTexture);

    if (bullet) {
      if (info.bulletTexture) {
        bullet.setTexture(info.bulletTexture);
      }
      
      // Inject target enemy reference onto the bullet instance for homing & collision filtering
      bullet.targetEnemy = info.targetEnemy || null;
      bullet.targetLetterIndex = info.targetLetterIndex !== undefined ? info.targetLetterIndex : null;

      bullet.fire({
        x: info.x,
        y: info.y,
        angle: info.angle,
        speed: info.bulletSpeed || 1400,
        scale: info.bulletScale || 0.6,
        lifetime: info.bulletLifetime || 2000,
        parentVelocity,
        inheritanceFactor: info.velocityInheritanceFactor || 0,
        damage: info.bulletDamage !== undefined ? info.bulletDamage : 1
      });
    }
  }

  /**
   * Handles collision logic when an enemy bullet hits the player.
   * @param {any} arg1 First physics object in overlap
   * @param {any} arg2 Second physics object in overlap
   */
  handleBulletPlayerCollision(arg1, arg2) {
    let bullet = null;
    if (arg1 && typeof arg1.deactivate === "function") {
      bullet = arg1;
    } else if (arg2 && typeof arg2.deactivate === "function") {
      bullet = arg2;
    }

    if (bullet) {
      bullet.deactivate("player collision");
    } else {
      const playerSprite = this.scene.player?.getSprite() || null;
      if (arg1 && arg1 !== playerSprite && typeof arg1.disableBody === "function") {
        arg1.disableBody(true, true);
      } else if (arg2 && arg2 !== playerSprite && typeof arg2.disableBody === "function") {
        arg2.disableBody(true, true);
      }
    }

    this.scene.player?.takeDamage(10, bullet);
  }

  /**
   * Handles collision logic when a bullet hits an enemy.
   * @param {Phaser.Physics.Arcade.Image} bullet The bullet sprite
   * @param {Phaser.Physics.Arcade.Sprite} enemySprite The enemy sprite
   */
  handleBulletEnemyCollision(bullet, enemySprite) {
    if (!enemySprite || !enemySprite.active) {
      bullet.deactivate("inactive enemy sprite");
      return;
    }

    const scene = this.scene;
    const index = scene.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index === -1) {
      bullet.deactivate("enemy not found in scene list");
      return;
    }

    const enemy = scene.enemies[index];

    // If bullet has a target enemy specified, pass through all non-target enemies
    if (bullet.targetEnemy && bullet.targetEnemy !== enemy) {
      return;
    }

    // Deactivate/recycle bullet to the pool
    bullet.deactivate("enemy collision");

    // Delegate 1-damage hit handling, red flash, particles, knockback, and letter progress to the enemy
    if (typeof enemy.onBulletHit === "function") {
      enemy.onBulletHit(bullet);
    } else if (typeof enemy.applyDamage === "function") {
      enemy.applyDamage(1, DAMAGE_SOURCE.BULLET);
    }
  }
}
