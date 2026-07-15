import Enemy from "./Enemy";
import Phaser from "phaser";

export default class HoppingEnemy extends Enemy {
  /**
   * Base class for enemies with a hopping movement pattern.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   * @param {string} texture Sprite sheet key
   * @param {string} animKey Run animation key
   * @param {string} shadowKey Shadow image key
   * @param {number} speed Movement speed (not used for continuous velocity)
   * @param {number} scale Scaling factor
   * @param {object} shadowConfig Shadow positioning offsets
   * @param {object} hoppingConfig Hopping parameters (jumpDistance, jumpDuration, jumpCooldown, jumpHeight)
   */
  constructor({
    scene,
    x,
    y,
    texture,
    animKey,
    shadowKey,
    speed,
    scale,
    shadowConfig,
    hoppingConfig
  }) {
    super({ scene, x, y, texture, animKey, shadowKey, speed, scale, shadowConfig });

    this.hoppingConfig = hoppingConfig;
    this.animKey = animKey;

    // Movement state machine: IDLE -> JUMPING -> LANDING -> COOLDOWN -> IDLE
    this.state = "IDLE";
    this.jumpProgress = 0;
  }

  /**
   * Overrides base continuous movement with the state machine.
   * @param {Phaser.Physics.Arcade.Sprite} player Target player
   */
  update(player) {
    if (!this.sprite || !this.sprite.body || !this.sprite.active) return;

    // Ensure velocity remains zero so there is no continuous physics drift
    this.sprite.setVelocity(0, 0);

    // If IDLE, initiate the next jump cycle
    if (this.state === "IDLE") {
      this.initiateJump(player);
    }
  }

  /**
   * Initiates a logical jump towards the player.
   * @param {Phaser.Physics.Arcade.Sprite} player Target player
   */
  initiateJump(player) {
    this.state = "JUMPING";

    const startX = this.sprite.x;
    const startY = this.sprite.y;

    // Calculate direction vector to target player
    const angle = Phaser.Math.Angle.Between(startX, startY, player.x, player.y);

    // Flip sprite horizontally to point towards player
    const movingLeft = player.x < startX;
    this.sprite.setFlipX(!movingLeft);

    // Calculate final landing destination
    let targetX = startX + Math.cos(angle) * this.hoppingConfig.jumpDistance;
    let targetY = startY + Math.sin(angle) * this.hoppingConfig.jumpDistance;

    // Clamp landing coordinates to the world boundaries with padding
    const bounds = this.scene.physics.world.bounds;
    const padding = 50;
    targetX = Phaser.Math.Clamp(targetX, bounds.x + padding, bounds.right - padding);
    targetY = Phaser.Math.Clamp(targetY, bounds.y + padding, bounds.bottom - padding);

    this.jumpProgress = 0;

    // Tween the progress factor from 0 to 1
    this.scene.tweens.add({
      targets: this,
      jumpProgress: 1,
      duration: this.hoppingConfig.jumpDuration,
      ease: "Linear",
      onStart: () => {
        if (this.sprite?.active) {
          this.sprite.play(this.animKey);
        }
      },
      onUpdate: () => {
        if (!this.sprite || !this.sprite.active || !this.shadow || !this.shadow.active) return;

        const t = this.jumpProgress;

        // Calculate logical ground position at time t
        const logicalX = startX + (targetX - startX) * t;
        const logicalY = startY + (targetY - startY) * t;

        // Calculate visual height offset using a parabolic arc
        const jumpHeightOffset = 4 * this.hoppingConfig.jumpHeight * t * (1 - t);

        // Update visual position of the sprite
        this.sprite.x = logicalX;
        this.sprite.y = logicalY - jumpHeightOffset;

        // Synchronize the physics body at ground plane for collision/overlap checks
        if (this.sprite.body) {
          this.sprite.body.reset(logicalX, logicalY);
        }

        // Keep the shadow flat on the ground plane moving towards target
        const shadowOffsetX = movingLeft ? this.shadowConfig.updateOffsetX : -this.shadowConfig.updateOffsetX;
        this.shadow.x = logicalX + shadowOffsetX;
        this.shadow.y = logicalY + this.shadowConfig.updateOffsetY;
        this.shadow.setFlipX(movingLeft);
      },
      onComplete: () => {
        if (!this.sprite || !this.sprite.active) return;

        this.state = "LANDING";
        this.sprite.stop();
        this.sprite.setFrame(0); // Freeze on frame 0 (idle look)

        // Enter a brief landing pause before the cooldown begins
        this.scene.time.delayedCall(100, () => {
          if (!this.sprite || !this.sprite.active) return;
          this.state = "COOLDOWN";

          // Wait out the configured jump cooldown before resetting to IDLE
          this.scene.time.delayedCall(this.hoppingConfig.jumpCooldown, () => {
            if (!this.sprite || !this.sprite.active) return;
            this.state = "IDLE";
          });
        });
      }
    });
  }

  /**
   * Clean up tweens to prevent memory leaks and exceptions upon destruction.
   */
  destroy(fromSpriteEvent = false) {
    this.scene?.tweens?.killTweensOf(this);
    super.destroy(fromSpriteEvent);
  }
}
