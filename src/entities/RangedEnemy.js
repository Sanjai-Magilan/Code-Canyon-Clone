import Phaser from "phaser";
import Enemy from "./Enemy";
import Weapon from "./Weapon";

export default class RangedEnemy extends Enemy {
  /**
   * Ranged enemy unit capable of targeting the player, checking visibility,
   * aligning, pausing movement, and firing projectiles.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   * @param {string} texture Texture spritesheet key
   * @param {string} animKey Running animation key
   * @param {string} shadowKey Shadow image key
   * @param {object} rangedConfig Configuration object containing stats and tolerances
   */
  constructor({ scene, x, y, texture, animKey, shadowKey, rangedConfig }) {
    // Call generic Enemy constructor to set up pathing, base sprite, and shadow configs
    super({
      scene,
      x,
      y,
      texture,
      animKey,
      shadowKey,
      speed: rangedConfig.speed,
      scale: rangedConfig.scale,
      shadowConfig: rangedConfig.shadow
    });

    this.rangedConfig = rangedConfig;
    this.animKey = animKey;

    // Equip the ranged enemy with its custom weapon
    this.weapon = new Weapon(scene, this, rangedConfig.weaponKey);

    // Store shooting sound key if provided
    this.shootSoundKey = rangedConfig.shootSound;

    // Track active shooting state to halt movement
    this.isShooting = false;
  }

  /**
   * Evaluates targeting criteria and either fires or chases the player.
   * @param {Phaser.Physics.Arcade.Sprite} player The target player sprite
   */
  update(player) {
    if (!this.sprite || !this.sprite.body || !this.sprite.active) return;

    // Maintain stationary posture and halt velocity during firing animation
    if (this.isShooting) {
      this.sprite.setVelocity(0, 0);

      // Keep shadow in sync when shooting (since update is returned early)
      const facingLeft = !this.sprite.flipX;
      const shadowOffsetX = facingLeft ? this.shadowConfig.updateOffsetX : -this.shadowConfig.updateOffsetX;
      this.shadow.x = this.sprite.x + shadowOffsetX;
      this.shadow.y = this.sprite.y + this.shadowConfig.updateOffsetY;
      this.shadow.setFlipX(facingLeft);
      return;
    }

    const camera = this.scene.cameras.main;

    // 1 & 2. Visibility Check: Verify both Player and RangedEnemy are within the camera view port
    const isPlayerVisible = camera.worldView.contains(player.x, player.y);
    const isCrabVisible = camera.worldView.contains(this.sprite.x, this.sprite.y);

    // 3. Y-Axis Alignment Check: Within a configured tolerance
    const yDiff = Math.abs(this.sprite.y - player.y);
    const isAlignedY = yDiff <= this.rangedConfig.yAlignmentTolerance;

    // Range Check: Within firing distance
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      player.x,
      player.y
    );
    const isInRange = distance <= this.rangedConfig.fireRange;

    // Cooldown Check
    const timeNow = this.scene.time.now;
    const isCooldownDone =
      timeNow - this.weapon.lastFired >= this.rangedConfig.shootCooldown;

    // If all conditions are met, halt movement and execute firing sequence
    if (
      isPlayerVisible &&
      isCrabVisible &&
      isAlignedY &&
      isInRange &&
      isCooldownDone
    ) {
      this.isShooting = true;
      this.sprite.setVelocity(0, 0);
      this.sprite.stop(); // Stop run animation

      // 4. Face the player before firing
      const facingLeft = player.x < this.sprite.x;
      this.sprite.setFlipX(!facingLeft);

      // Fire weapon
      this.shootAtPlayer(facingLeft);

      // 5 & 6. Stop movement for a brief firing duration, then resume chasing
      this.scene.time.delayedCall(300, () => {
        this.isShooting = false;
        if (this.sprite?.active) {
          this.sprite.play(this.animKey);
        }
      });
    } else {
      // Otherwise, run base chase pathfinding update
      super.update(player);
    }
  }

  /**
   * Fires the equipped weapon in a direct horizontal vector towards the player.
   * @param {boolean} facingLeft Direction to shoot
   */
  shootAtPlayer(facingLeft) {
    const fireAngle = facingLeft ? Math.PI : 0;
    
    // Dynamically mirror horizontal claw offset depending on facing direction
    const offsetX = facingLeft ? -50 : 50;
    const muzzlePosition = { x: this.sprite.x + offsetX, y: this.sprite.y + 35 };

    const shots = this.weapon.fire(muzzlePosition, fireAngle);
    if (shots) {
      if (this.shootSoundKey) {
        this.scene.sound.play(this.shootSoundKey, { volume: 0.4 });
      }
      if (this.scene.projectileManager) {
        this.scene.projectileManager.spawn(shots, true); // isEnemy = true
      }
    }
  }
}
