import Phaser from "phaser";
import ENEMY_CONFIG from "../config/enemyConfig";
import WEAPON_DROP_CONFIG from "../config/weaponDropConfig";

export default class Enemy {
  /**
   * Base class representing an enemy unit.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   * @param {string} texture Texture sprite sheet key
   * @param {string} animKey Running animation key
   * @param {string} shadowKey Shadow image key
   * @param {number} speed Movement speed multiplier
   * @param {number} scale Image scaling multiplier
   */
  constructor(
    scene,
    x,
    y,
    texture = "worm",
    animKey = "worm-run",
    shadowKey = "worm-shadow",
    speed = ENEMY_CONFIG.speed,
    scale = ENEMY_CONFIG.scale,
    shadowConfig = ENEMY_CONFIG.shadow
  ) {
    this.scene = scene;
    this.speed = speed;
    this.scale = scale;
    this.shadowConfig = shadowConfig || ENEMY_CONFIG.shadow;

    // Attach shadow under the sprite using config
    this.shadow = scene.add.image(
      x + this.shadowConfig.offsetX,
      y + this.shadowConfig.offsetY,
      shadowKey
    );
    this.shadow.setScale(this.scale);

    // Create physics-enabled sprite for collisions and updates
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.sprite.setScale(this.scale);
    this.isMoving = true;

    // Start walking/running loop animation
    if (animKey) {
      this.sprite.play(animKey);
    }

    // Set health based on enemy type (worm: 50, crab: 100, angler: 150)
    this.maxHealth = 50;
    if (texture === "crab") {
      this.maxHealth = 100;
    } else if (texture === "angler") {
      this.maxHealth = 150;
    }
    this.health = this.maxHealth;
    this.isDead = false;

    // Attach memory leak protection event on destroy
    this.sprite.on(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  /**
   * Update lifecycle hook to drive movement pathing and visual flip states.
   * @param {Phaser.Physics.Arcade.Sprite} player The target player sprite
   */
  update(player) {
    if (!this.sprite || !this.sprite.body || !this.sprite.active) return;

    // Determine angle vector leading to target player sprite
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      player.x,
      player.y
    );

    // Assign physics velocity components based on vector angle
    this.sprite.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );

    // Flip sprite horizontally to point towards player
    const movingLeft = player.x < this.sprite.x;
    this.sprite.setFlipX(!movingLeft);

    // Synchronize shadow positioning relative to parent body using config
    const shadowOffsetX = movingLeft ? this.shadowConfig.updateOffsetX : -this.shadowConfig.updateOffsetX;
    this.shadow.x = this.sprite.x + shadowOffsetX;
    this.shadow.y = this.sprite.y + this.shadowConfig.updateOffsetY;
    this.shadow.setFlipX(movingLeft);
  }

  /**
   * Rolls a drop gun ID based on enemy type configuration.
   * @returns {string|null} The rolled weapon ID, or null
   */
  dropGunId() {
    const enemyType = this.sprite.texture.key;
    const dropConfig = WEAPON_DROP_CONFIG[enemyType];
    if (!dropConfig) return null;

    for (const [gunId, chance] of Object.entries(dropConfig)) {
      if (Math.random() < chance) {
        return gunId;
      }
    }
    return null;
  }

  /**
   * Applies damage to the enemy.
   * @param {number} amount Damage quantity
   */
  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Handles enemy death, including lists splicing, explosions, and pickups.
   */
  die() {
    if (this.isDead) return;
    this.isDead = true;

    const scene = this.scene;
    const index = scene.enemies.findIndex((e) => e === this);
    if (index !== -1) {
      scene.enemies.splice(index, 1);
    }

    if (this.sprite && this.sprite.active) {
      const deathX = this.sprite.x;
      const deathY = this.sprite.y;

      if (typeof scene.spawnEnemyExplosion === "function") {
        scene.spawnEnemyExplosion(deathX, deathY);
      }

      const gunId = this.dropGunId();
      if (gunId && scene.weaponDropManager) {
        scene.weaponDropManager.spawnPickup(deathX, deathY, gunId);
      }

      this.sprite.destroy();
    }
  }

  /**
   * Destroys visual shadow elements and detaches listeners.
   */
  destroy() {
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}
