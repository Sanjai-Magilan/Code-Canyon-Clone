import Phaser from "phaser";
import Weapon from "./Weapon";
import CHARACTERS from "../config/characterConfig";

export default class Player {
  /**
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x The initial x coordinate
   * @param {number} y The initial y coordinate
   * @param {string|object} characterInput The character configuration key or object (defaults to "soldier")
   */
  constructor(scene, x, y, characterInput = "soldier") {
    this.scene = scene;

    // Load character configuration dynamically (supports string key or config object)
    this.characterConfig = typeof characterInput === "string"
      ? (CHARACTERS[characterInput] || CHARACTERS.soldier)
      : characterInput;

    // --- Character Stats ---
    this.speed = this.characterConfig.speed;
    this.health = this.characterConfig.maxHealth;
    this.maxHealth = this.characterConfig.maxHealth;

    // --- Visual Offsets & Recoil Parameters ---
    this.headOffset = this.characterConfig.headOffset;
    this.headFloatAmplitude = this.characterConfig.headFloatAmplitude;
    this.headFloatSpeed = this.characterConfig.headFloatSpeed;
    this.gunOffset = this.characterConfig.gunOffset;
    this.recoilOffset = 0; // Visual recoil offset
    this.recoilAngle = 0;  // Visual recoil angle rotation

    // --- Interaction System ---
    this.interactionSystem = {
      interact: () => {
        console.log("Interacting with nearby object...");
      },
    };

    // Instantiate weapon automatically based on character configuration
    this.weapon = new Weapon(this.scene, this, this.characterConfig.weapon);

    // --- Sprite & Physics Creation ---
    this.sprite = this.scene.physics.add.sprite(x, y, this.characterConfig.bodyTexture);
    this.sprite.setScale(this.characterConfig.scale);

    // Constrain the sprite to world bounds
    this.sprite.setCollideWorldBounds(true);
    this.shadow = this.scene.add.image(x, y + 40, this.characterConfig.shadowTexture);
    this.shadow.setScale(this.characterConfig.scale);
    this.shadow.setDepth(this.characterConfig.depth - 1);

    // --- Attachment Images Creation ---
    this.head = this.scene.add.image(x, y, this.characterConfig.headTexture);
    this.head.setScale(this.characterConfig.scale);
    this.gun = this.scene.add.image(x, y, this.characterConfig.gunTexture);
    this.gun.setScale(this.characterConfig.scale);

    // Set depths so elements overlay correctly
    this.sprite.setDepth(this.characterConfig.depth);
    this.head.setDepth(this.characterConfig.depth + 1);
    this.gun.setDepth(this.characterConfig.depth + 2);

    // --- Animation Creation ---
    this.createAnimations();

    // Play default run animation (starts playing immediately)
    this.sprite.play(`${this.characterConfig.bodyTexture}-run`);

    // --- Input Setup (WASD Keys) ---
    if (this.scene.input && this.scene.input.keyboard) {
      this.wasd = this.scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });
    }

    // --- Solve the Physics Position Lag ---
    this.scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      this.postUpdate,
      this,
    );

    // Listen to scene shutdown to ensure cleanup if scene changes
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    // Clean up event listeners when the player sprite is destroyed
    this.sprite.on(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  /**
   * Expose the underlying Phaser physics sprite
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Internal helper to register character animations dynamically.
   */
  createAnimations() {
    const runAnimKey = `${this.characterConfig.bodyTexture}-run`;
    if (!this.scene.anims.exists(runAnimKey)) {
      this.scene.anims.create({
        key: runAnimKey,
        frames: this.scene.anims.generateFrameNumbers(this.characterConfig.bodyTexture, {
          start: this.characterConfig.anim.run.start,
          end: this.characterConfig.anim.run.end,
        }),
        frameRate: this.characterConfig.anim.run.frameRate,
        repeat: -1,
      });
    }
  }

  /**
   * Handle movement, flipX, and animation states based on cursors
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors Keyboard cursors object
   */
  update(cursors) {
    if (!this.sprite.body) return;

    // Reset velocity on every update cycle
    this.sprite.setVelocity(0);

    let isMoving = false;

    // Read movements from both arrow keys (cursors) and WASD keys
    const leftDown =
      (cursors && cursors.left.isDown) || (this.wasd && this.wasd.left.isDown);
    const rightDown =
      (cursors && cursors.right.isDown) ||
      (this.wasd && this.wasd.right.isDown);
    const upDown =
      (cursors && cursors.up.isDown) || (this.wasd && this.wasd.up.isDown);
    const downDown =
      (cursors && cursors.down.isDown) || (this.wasd && this.wasd.down.isDown);

    // Handle horizontal movement
    if (leftDown) {
      this.sprite.setVelocityX(-this.speed);
      this.sprite.setFlipX(true);
      isMoving = true;
    } else if (rightDown) {
      this.sprite.setVelocityX(this.speed);
      this.sprite.setFlipX(false);
      isMoving = true;
    }

    // Handle vertical movement
    if (upDown) {
      this.sprite.setVelocityY(-this.speed);
      isMoving = true;
    } else if (downDown) {
      this.sprite.setVelocityY(this.speed);
      isMoving = true;
    }

    // Fix diagonal speed only if actively moving to avoid scaling collision velocities
    if (isMoving) {
      this.sprite.body.velocity.normalize().scale(this.speed);
    }

    // Animation state machine logic
    const runAnimKey = `${this.characterConfig.bodyTexture}-run`;
    if (isMoving) {
      if (
        !this.sprite.anims.isPlaying ||
        this.sprite.anims.currentAnim.key !== runAnimKey
      ) {
        this.sprite.play(runAnimKey);
      }
    } else {
      this.sprite.stop();
      this.sprite.setFrame(0);
    }
  }

  /**
   * Sync positions of attachments post-update to eliminate 1-frame position lag.
   * This executes after physics updates body position but before rendering.
   */
  postUpdate() {
    if (!this.sprite || !this.sprite.active) return;

    // Snappy math-based exponential visual recoil decay (zero dynamic allocations)
    this.recoilOffset *= this.characterConfig.recoil.offsetDecay;
    if (Math.abs(this.recoilOffset) < 0.1) {
      this.recoilOffset = 0;
    }

    this.recoilAngle *= this.characterConfig.recoil.angleDecay;
    if (Math.abs(this.recoilAngle) < 0.1) {
      this.recoilAngle = 0;
    }

    // Flip offsets horizontally based on sprite direction
    const flipMultiplier = this.sprite.flipX ? -1 : 1;
    const shadowOffsetX = this.sprite.flipX ? -0 : 0;

    this.shadow.setPosition(this.sprite.x + shadowOffsetX, this.sprite.y + 30);
    this.shadow.setFlipX(this.sprite.flipX);

    // Sync positions
    const headBob =
      Math.sin(this.scene.time.now * this.headFloatSpeed) *
      this.headFloatAmplitude;

    this.head.setPosition(
      this.sprite.x + this.headOffset.x * flipMultiplier,
      this.sprite.y + this.headOffset.y + headBob,
    );
    this.gun.setPosition(
      this.sprite.x + (this.gunOffset.x + this.recoilOffset) * flipMultiplier,
      this.sprite.y + this.gunOffset.y,
    );

    // Apply visual recoil angle
    this.gun.angle = this.recoilAngle;

    // Sync flip states
    this.head.setFlipX(this.sprite.flipX);
    this.gun.setFlipX(this.sprite.flipX);
    if (this.flash && this.flash.active) {
      const muzzle = this.getMuzzlePosition();
      this.flash.setPosition(muzzle.x, muzzle.y);
      this.flash.setFlipX(this.sprite.flipX);
    }
  }

  /**
   * Cleanup method to destroy children and detach scene event listeners
   * to avoid memory leaks.
   */
  destroy() {
    if (this.scene && this.scene.events) {
      this.scene.events.off(
        Phaser.Scenes.Events.POST_UPDATE,
        this.postUpdate,
        this,
      );
      this.scene.events.off(
        Phaser.Scenes.Events.SHUTDOWN,
        this.destroy,
        this,
      );
    }

    if (this.head) {
      this.head.destroy();
      this.head = null;
    }
    if (this.gun) {
      this.gun.destroy();
      this.gun = null;
    }
    if (this.flash) {
      this.flash.destroy();
      this.flash = null;
    }
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }

  /**
   * Apply damage to the player
   * @param {number} amount Damage amount
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Heal the player
   * @param {number} amount Health amount
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Handle player death sequence
   */
  die() {
    console.log("Player died!");
    this.sprite.disableBody(true, true);
    if (this.head) this.head.setVisible(false);
    if (this.gun) this.gun.setVisible(false);
    if (this.shadow) this.shadow.setVisible(false);
  }

  /**
   * Calculates the exact rotated position of the gun muzzle.
   * This aligns bullet spawning and muzzle flash visuals precisely, with zero lag or offset.
   * @returns {{x: number, y: number}}
   */
  getMuzzlePosition() {
    const flipMultiplier = this.sprite.flipX ? -1 : 1;
    const baseOffsetX = 90 * flipMultiplier;
    const baseOffsetY = -10;

    // Convert gun angle to radians to apply rotation
    const angleRad = Phaser.Math.DegToRad(this.gun.angle);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Apply rotation matrix relative to the gun's center position
    const rx = baseOffsetX * cos - baseOffsetY * sin;
    const ry = baseOffsetX * sin + baseOffsetY * cos;

    return {
      x: this.gun.x + rx,
      y: this.gun.y + ry,
    };
  }

  shoot() {
    const muzzle = this.getMuzzlePosition();

    // Delegate cooldown check and get spawn parameters
    const shotInfo = this.weapon.fire(muzzle, this.sprite.flipX);
    if (!shotInfo) {
      return;
    }

    // Hand off projectile spawning to the scene's ProjectileManager
    if (this.scene.projectileManager) {
      this.scene.projectileManager.spawn(shotInfo);
    }

    // Render visual effects and muzzle flash
    if (this.flash && this.flash.active) {
      this.flash.destroy();
    }

    const flashConfig = this.characterConfig.muzzleFlash;
    const flashSprite = this.scene.add.sprite(muzzle.x, muzzle.y, flashConfig.texture);
    this.flash = flashSprite;

    this.flash.setScale(flashConfig.scale);
    this.flash.setDepth(this.gun.depth + 1);
    this.flash.setFlipX(this.sprite.flipX);

    this.flash.play(flashConfig.anim);

    // Apply recoil parameters directly (zero dynamic allocations / tweens)
    const recoilConfig = this.characterConfig.recoil;
    this.recoilOffset = recoilConfig.offset;
    this.recoilAngle = this.sprite.flipX ? recoilConfig.angle : -recoilConfig.angle;

    flashSprite.once("animationcomplete", () => {
      flashSprite.destroy();
      if (this.flash === flashSprite) {
        this.flash = null;
      }
    });
  }
}
