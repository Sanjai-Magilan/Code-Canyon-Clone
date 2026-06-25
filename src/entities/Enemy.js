import Phaser from "phaser";
import ENEMY_CONFIG from "../config/enemyConfig";

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
    scale = ENEMY_CONFIG.scale
  ) {
    this.scene = scene;
    this.speed = speed;
    this.scale = scale;

    // Attach shadow under the sprite
    this.shadow = scene.add.image(x + 10, y + 40, shadowKey);
    this.shadow.setScale(this.scale);

    // Create physics-enabled sprite for collisions and updates
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.sprite.setScale(this.scale);
    this.isMoving = true;

    // Start walking/running loop animation
    if (animKey) {
      this.sprite.play(animKey);
    }

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

    // Synchronize shadow positioning relative to parent body
    const shadowOffsetX = movingLeft ? 10 : -10;
    this.shadow.x = this.sprite.x + shadowOffsetX;
    this.shadow.y = this.sprite.y + 60;
    this.shadow.setFlipX(movingLeft);
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
