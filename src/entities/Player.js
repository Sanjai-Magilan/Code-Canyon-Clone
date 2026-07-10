import Phaser from "phaser";
import Weapon from "./Weapon";
import CHARACTERS from "../config/characterConfig";
import WEAPON_DROP_CONFIG from "../config/weaponDropConfig";
import PLAYER_CONFIG from "../config/playerConfig";

export default class Player {
  /**
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x The initial x coordinate
   * @param {number} y The initial y coordinate
   * @param {string|object} characterInput The character configuration key or object (defaults to "soldier")
   */
  constructor(scene, x, y, characterInput = "soldier") {
    console.log("Player created");
    this.scene = scene;

    // Load character configuration dynamically (supports string key or config object)
    this.characterConfig = typeof characterInput === "string"
      ? (CHARACTERS[characterInput] || CHARACTERS.soldier)
      : characterInput;

    // --- Character Stats ---
    this.speed = this.characterConfig.speed;
    this.health = PLAYER_CONFIG.maxHealth;
    this.maxHealth = PLAYER_CONFIG.maxHealth;

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

    // --- Temporary Weapon System State ---
    this.tempWeaponId = null;
    this.tempWeaponMaxShots = null;
    this.tempWeaponShotsFired = 0;
    this.tempWeaponTimer = null;
    this.lastHitTime = -Infinity;
    this.invincibilityDuration = PLAYER_CONFIG.invincibilityDuration;
    this.isDead = false;

    // --- Shield State ---
    this.hasShield = false;
    this.shield = null;
    this.shieldDirection = "right";
    this.shieldHitsRemaining = 0;

    // --- Dash System State ---
    this.isDashing = false;
    this.canDash = true;
    this.lastDashTime = 0;
    this.lastMoveDirection = new Phaser.Math.Vector2(1, 0);
    this.currentDirVector = new Phaser.Math.Vector2(0, 0);

    this.spaceKey = this.scene?.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) || null;

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
    if (this.isDead || !this.sprite.body) return;

    // Check space key down for dash
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.dash();
    }

    if (this.isDashing) return;

    // Reset velocity on every update cycle
    this.sprite.setVelocity(0);

    let isMoving = false;

    // Read movements from arrow keys (cursors) ONLY (disable WASD to prevent typing conflict)
    const leftDown = cursors?.left?.isDown;
    const rightDown = cursors?.right?.isDown;
    const upDown = cursors?.up?.isDown;
    const downDown = cursors?.down?.isDown;

    // Calculate current movement direction vector using pre-allocated instance
    this.currentDirVector.set(0, 0);
    if (leftDown) this.currentDirVector.x = -1;
    else if (rightDown) this.currentDirVector.x = 1;

    if (upDown) this.currentDirVector.y = -1;
    else if (downDown) this.currentDirVector.y = 1;

    if (this.currentDirVector.x !== 0 || this.currentDirVector.y !== 0) {
      this.lastMoveDirection.copy(this.currentDirVector).normalize();
    }

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
    if (this.flash?.active) {
      const muzzle = this.getMuzzlePosition();
      this.flash.setPosition(muzzle.x, muzzle.y);
      this.flash.setFlipX(this.sprite.flipX);
    }

    // Update shield position, rotation, and flip matching the player's facing direction
    if (this.shield) {
      this.shieldDirection = this.sprite.flipX ? "left" : "right";

      const ox = this.sprite.flipX ? -50 : 50;
      const oy = -10;

      this.shield.setPosition(this.sprite.x + ox, this.sprite.y + oy);
      this.shield.setFlipX(this.sprite.flipX);
      this.shield.setRotation(0);
      this.shield.setAlpha(this.sprite.alpha);
    }
  }

  /**
   * Safe helper to destroy a game object if active and not already shutting down.
   */
  destroyGameObject(obj, sceneShutdown) {
    if (obj) {
      if (!sceneShutdown && obj.active) {
        obj.destroy();
      }
    }
    return null;
  }

  /**
   * Cleanup method to destroy children and detach scene event listeners
   * to avoid memory leaks.
   */
  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("Player destroyed");

    // Determine if this destroy is part of the scene's shutdown/restart pipeline
    const sceneShutdown = !this.scene?.scene?.isActive();

    this.destroyShield(sceneShutdown);
    this.clearInvincibilityTimers();

    if (this.tempWeaponTimer) {
      this.tempWeaponTimer.remove();
      this.tempWeaponTimer = null;
    }

    this.scene?.events?.off(
      Phaser.Scenes.Events.POST_UPDATE,
      this.postUpdate,
      this
    );
    this.scene?.events?.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.destroy,
      this
    );

    if (this.sprite) {
      this.sprite.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
      this.destroyGameObject(this.sprite, sceneShutdown);
      this.sprite = null;
    }
    this.head = this.destroyGameObject(this.head, sceneShutdown);
    this.gun = this.destroyGameObject(this.gun, sceneShutdown);
    this.flash = this.destroyGameObject(this.flash, sceneShutdown);
    this.shadow = this.destroyGameObject(this.shadow, sceneShutdown);

    // Clean up dash timers
    if (this.dashTimer) {
      this.dashTimer.remove();
      this.dashTimer = null;
    }
    if (this.dashCooldownTimer) {
      this.dashCooldownTimer.remove();
      this.dashCooldownTimer = null;
    }
  }

  /**
   * Executes the dash ability.
   */
  dash() {
    if (!this.canDash || this.isDashing || this.isDead) return;

    this.isDashing = true;
    this.canDash = false;

    // Visual effect: make player slightly transparent
    this.sprite.setAlpha(0.7);
    if (this.head) this.head.setAlpha(0.7);
    if (this.gun) this.gun.setAlpha(0.7);
    if (this.shadow) this.shadow.setAlpha(0.7);
    if (this.shield) this.shield.setAlpha(0.7);

    // Calculate direction and speed
    const dir = this.lastMoveDirection.clone().normalize();
    const dashSpeed = PLAYER_CONFIG.dash.distance / (PLAYER_CONFIG.dash.duration / 1000);

    this.sprite.setVelocity(dir.x * dashSpeed, dir.y * dashSpeed);

    // Keep running animation active
    const runAnimKey = `${this.characterConfig.bodyTexture}-run`;
    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== runAnimKey) {
      this.sprite.play(runAnimKey);
    }

    // End dash after duration
    this.dashTimer = this.scene.time.delayedCall(PLAYER_CONFIG.dash.duration, () => {
      this.isDashing = false;
      if (this.sprite?.body) {
        this.sprite.setVelocity(0, 0);
        this.sprite.setAlpha(1.0);
      }
      if (this.head) this.head.setAlpha(1.0);
      if (this.gun) this.gun.setAlpha(1.0);
      if (this.shadow) this.shadow.setAlpha(1.0);
      if (this.shield) this.shield.setAlpha(1.0);

      // Start cooldown timer
      this.dashCooldownTimer = this.scene.time.delayedCall(PLAYER_CONFIG.dash.cooldown, () => {
        this.canDash = true;
      });
    });
  }

  /**
   * Check if shield can block the damage source, and handle blocks
   */
  checkShieldBlock(source) {
    if (!this.hasShield || !source) return false;

    const angleToSource = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      source.x,
      source.y
    );

    let shieldAngle = 0;
    switch (this.shieldDirection) {
      case "right": shieldAngle = 0; break;
      case "left": shieldAngle = Math.PI; break;
      case "up": shieldAngle = -Math.PI / 2; break;
      case "down": shieldAngle = Math.PI / 2; break;
    }

    const diff = Phaser.Math.Angle.Wrap(angleToSource - shieldAngle);

    if (Math.abs(diff) <= Math.PI / 4) { // covers ±45 degrees
      this.blockDamage();

      // If the damage source is an enemy sprite, kill it immediately upon hitting the shield
      if (this.scene?.enemies) {
        const enemy = this.scene.enemies.find(e => e.sprite === source);
        enemy?.die();
      }

      return true;
    }
    return false;
  }

  takeDamage(amount, source = null) {
    if (this.isDead || this.isDashing) return;

    console.trace("takeDamage called");

    if (this.checkShieldBlock(source)) {
      return;
    }

    if (this.isInvincible) {
      console.log("Damage ignored due to iFrames");
      return;
    }

    // Play hit sound effect
    this.scene?.sound?.play("player-oof", { volume: 0.3 });

    this.health = Math.max(0, this.health - 1);
    console.log("Health:", this.health);
    console.trace("health changed");
    console.log(
      "Player hit",
      this.health,
      this.scene?.time?.now
    );

    this.scene?.updateHearts?.();

    if (this.health <= 0) {
      console.log("Calling die()");
      this.die();
    } else {
      this.startInvincibility();
    }
  }

  /**
   * Heal the player
   * @param {number} amount Health amount
   */
  heal(amount) {
    if (this.isDead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
    console.trace("health changed");
    this.scene?.updateHearts?.();
  }

  /**
   * Handle player death sequence
   */
  die() {
    if (this.isDead) return;
    this.isDead = true;

    this.destroyShield();

    console.log("Player died");
    this.clearInvincibilityTimers();
    this.setPlayerAlpha(1.0);

    // Stop movement and disable physics body
    if (this.sprite.body) {
      this.sprite.setVelocity(0, 0);
    }
    this.sprite.disableBody(true, true);
    if (this.head) this.head.setVisible(false);
    if (this.gun) this.gun.setVisible(false);
    if (this.shadow) this.shadow.setVisible(false);

    // Shake camera slightly
    this.scene?.cameras?.main?.shake(300, 0.02);

    // Restart the scene after 1000ms delay using Phaser's Clock
    console.log("Restart timer started");
    this.scene?.time?.delayedCall(1000, () => {
      console.log("Restart callback entered");
      try {
        console.log("Scene restarting");
        this.scene?.scene?.restart();
      } catch (err) {
        console.error("CRITICAL ERROR RESTARTING SCENE:", err);
      }
    });
  }

  /**
   * Equips the directional shield and configures durability.
   */
  equipShield() {
    if (this.isDead) return;
    if (this.hasShield) {
      this.shieldHitsRemaining = 3;
      return;
    }

    this.hasShield = true;
    this.shieldHitsRemaining = 3;

    // Create shield sprite attached to player
    this.shield = this.scene.add.image(this.sprite.x, this.sprite.y, "shield-sprite");
    this.shield.setScale(this.characterConfig.scale * 1.4);
    this.shield.setDepth(this.sprite.depth + 1);
  }

  /**
   * Destroys the shield and resets shield states.
   * @param {boolean} sceneShutdown Whether the scene is shutting down/restarting
   */
  destroyShield(sceneShutdown = false) {
    this.hasShield = false;
    this.shieldHitsRemaining = 0;
    if (this.shield) {
      if (!sceneShutdown && this.shield.active) {
        this.shield.destroy();
      }
      this.shield = null;
    }
    // Clear shield power-up UI
    this.scene?.clearShieldPowerup?.();
  }

  /**
   * Plays shield block visual shake, flash, and sound.
   */
  blockDamage() {
    this.shieldHitsRemaining--;

    // Update shield power-up UI
    if (this.scene && typeof this.scene.updateShieldPowerupUI === "function") {
      this.scene.updateShieldPowerupUI();
    }

    if (this.scene) {
      // Play blocking feedback audio
      if (this.scene.sound) {
        this.scene.sound.play("power-up", { volume: 0.3, pitch: 1.5 });
      }

      // Shake and flash shield
      if (this.shield) {
        this.scene.tweens.add({
          targets: this.shield,
          x: this.shield.x + Phaser.Math.Between(-6, 6),
          y: this.shield.y + Phaser.Math.Between(-6, 6),
          duration: 50,
          yoyo: true,
          repeat: 2
        });

        this.shield.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
          if (this.shield) this.shield.clearTint();
        });
      }
    }

    if (this.shieldHitsRemaining <= 0) {
      this.breakShield();
    }
  }

  /**
   * Breaks the shield and runs break fade animation.
   */
  breakShield() {
    if (this.shield && this.scene) {
      if (this.scene.sound) {
        this.scene.sound.play("enemy-die", { volume: 0.5, pitch: 0.8 });
      }

      const breakingShield = this.shield;
      this.shield = null;
      this.hasShield = false;
      this.shieldHitsRemaining = 0;

      this.scene.tweens.add({
        targets: breakingShield,
        scale: breakingShield.scale * 1.5,
        alpha: 0,
        duration: 300,
        ease: "Power2.easeOut",
        onComplete: () => {
          breakingShield.destroy();
        }
      });
    } else {
      this.destroyShield();
    }
  }

  /**
   * Starts player invincibility and blinking feedback.
   */
  startInvincibility() {
    this.clearInvincibilityTimers();

    this.isInvincible = true;

    let isAlphaLow = false;

    // Start 100ms blink timer using Phaser time events
    this.blinkTimer = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        isAlphaLow = !isAlphaLow;
        this.setPlayerAlpha(isAlphaLow ? 0.3 : 1.0);
      }
    });

    // Start invincibility duration timer using Phaser delayed call
    this.invincibilityTimer = this.scene.time.delayedCall(this.invincibilityDuration, () => {
      this.endInvincibility();
    });
  }

  /**
   * Ends player invincibility, stops timers, and restores alpha.
   */
  endInvincibility() {
    this.isInvincible = false;
    this.clearInvincibilityTimers();
    this.setPlayerAlpha(1.0);
  }

  /**
   * Sets the transparency alpha for all visual player attachment sprites.
   * @param {number} alpha Opacity value between 0 and 1
   */
  setPlayerAlpha(alpha) {
    if (this.sprite) this.sprite.setAlpha(alpha);
    if (this.head) this.head.setAlpha(alpha);
    if (this.gun) this.gun.setAlpha(alpha);
    if (this.shadow) this.shadow.setAlpha(alpha);
    if (this.flash) this.flash.setAlpha(alpha);
  }

  /**
   * Cleans up active Phaser time events to prevent memory/timer leaks.
   */
  clearInvincibilityTimers() {
    if (this.blinkTimer) {
      this.blinkTimer.remove();
      this.blinkTimer = null;
    }
    if (this.invincibilityTimer) {
      this.invincibilityTimer.remove();
      this.invincibilityTimer = null;
    }
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
    if (this.isDead) return;
    const muzzle = this.getMuzzlePosition();

    // Delegate cooldown check and get spawn parameters
    const shotInfo = this.weapon.fire(muzzle, this.sprite.flipX);
    if (!shotInfo) {
      return;
    }

    // Check shot count limit for temporary weapons
    if (this.tempWeaponMaxShots !== null) {
      this.tempWeaponShotsFired++;

      // Update UI manager shot count
      if (this.scene && typeof this.scene.updateWeaponPowerupUI === "function") {
        this.scene.updateWeaponPowerupUI();
      }

      if (this.tempWeaponShotsFired >= this.tempWeaponMaxShots) {
        this.scene.time.delayedCall(0, () => {
          this.revertToDefaultWeapon();
          this.showFeedbackText("Weapon Expired", "#ff4444");
        });
      }
    }

    // Play gun shoot sound effect
    this.scene.sound.play("shoot", { volume: 0.4 });

    // Hand off projectile spawning to the scene's ProjectileManager
    if (this.scene.projectileManager) {
      const parentVel = this.sprite.body ? { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y } : { x: 0, y: 0 };
      this.scene.projectileManager.spawn(shotInfo, false, parentVel);
    }

    // Render visual effects and muzzle flash
    if (this.flash?.active) {
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

    // Play gun recoil/reload sound
    this.scene.sound.play("recoil", { volume: 0.3 });

    flashSprite.once("animationcomplete", () => {
      flashSprite.destroy();
      if (this.flash === flashSprite) {
        this.flash = null;
      }
    });
  }

  /**
   * Fires a projectile in the exact direction of the target enemy,
   * setting the target locked references on the bullets.
   * @param {number} angle trajectory angle in radians
   * @param {object} targetEnemy the targeted Enemy instance
   */
  shootToward(angle, targetEnemy) {
    if (this.isDead) return;
    
    // Rotate/flip player toward target
    const isTargetLeft = targetEnemy.sprite.x < this.sprite.x;
    this.sprite.setFlipX(isTargetLeft);

    const muzzle = this.getMuzzlePosition();

    // Delegate cooldown check and get spawn parameters using the exact angle
    const shotInfo = this.weapon.fire(muzzle, angle);
    if (!shotInfo) {
      return;
    }

    // Check shot count limit for temporary weapons
    if (this.tempWeaponMaxShots !== null) {
      this.tempWeaponShotsFired++;

      if (this.scene && typeof this.scene.updateWeaponPowerupUI === "function") {
        this.scene.updateWeaponPowerupUI();
      }

      if (this.tempWeaponShotsFired >= this.tempWeaponMaxShots) {
        this.scene.time.delayedCall(0, () => {
          this.revertToDefaultWeapon();
          this.showFeedbackText("Weapon Expired", "#ff4444");
        });
      }
    }

    // Play gun shoot sound effect
    this.scene.sound.play("shoot", { volume: 0.4 });

    // Hand off projectile spawning to the scene's ProjectileManager
    if (this.scene.projectileManager) {
      const parentVel = this.sprite.body ? { x: this.sprite.body.velocity.x, y: this.sprite.body.velocity.y } : { x: 0, y: 0 };
      
      // Inject target enemy and letter index into shotInfo details
      if (Array.isArray(shotInfo)) {
        shotInfo.forEach(shot => {
          shot.targetEnemy = targetEnemy;
          shot.targetLetterIndex = targetEnemy.currentLetterIndex;
        });
      } else if (shotInfo) {
        shotInfo.targetEnemy = targetEnemy;
        shotInfo.targetLetterIndex = targetEnemy.currentLetterIndex;
      }
      this.scene.projectileManager.spawn(shotInfo, false, parentVel);
    }

    // Render visual effects and muzzle flash
    if (this.flash?.active) {
      this.flash.destroy();
    }

    const flashConfig = this.characterConfig.muzzleFlash;
    const flashSprite = this.scene.add.sprite(muzzle.x, muzzle.y, flashConfig.texture);
    this.flash = flashSprite;

    this.flash.setScale(flashConfig.scale);
    this.flash.setDepth(this.gun.depth + 1);
    this.flash.setFlipX(this.sprite.flipX);
    this.flash.play(flashConfig.anim);

    // Apply recoil parameters directly
    const recoilConfig = this.characterConfig.recoil;
    this.recoilOffset = recoilConfig.offset;
    this.recoilAngle = this.sprite.flipX ? recoilConfig.angle : -recoilConfig.angle;

    // Play gun recoil/reload sound
    this.scene.sound.play("recoil", { volume: 0.3 });

    flashSprite.once("animationcomplete", () => {
      flashSprite.destroy();
      if (this.flash === flashSprite) {
        this.flash = null;
      }
    });
  }

  /**
   * Equips a temporary weapon.
   * @param {string} gunId The weapon ID to equip (e.g. 'gun1')
   */
  equipTemporaryWeapon(gunId) {
    // Clear any existing expiration timers
    if (this.tempWeaponTimer) {
      this.tempWeaponTimer.remove();
      this.tempWeaponTimer = null;
    }

    this.tempWeaponId = gunId;
    this.tempWeaponShotsFired = 0;

    // Configure limits based on weapon drop config
    const maxShotsConfig = WEAPON_DROP_CONFIG.maxShots[gunId];
    this.tempWeaponMaxShots = maxShotsConfig !== undefined ? maxShotsConfig : null;

    const duration = WEAPON_DROP_CONFIG.durations[gunId];
    if (duration) {
      this.tempWeaponTimer = this.scene.time.delayedCall(
        duration,
        () => {
          this.revertToDefaultWeapon();
          this.showFeedbackText("Weapon Expired", "#ff4444");
        },
        [],
        this
      );
    }

    // Set the equipped skin image key (preloaded as skin_gunId)
    this.gun.setTexture(`skin_${gunId}`);

    // Re-create the Weapon instance using the temporary config key
    this.weapon = new Weapon(this.scene, this, gunId);

    // Visual feedback text above player
    const formattedName = gunId.toUpperCase();
    this.showFeedbackText(formattedName, "#44ff44");

    // Optional audio hook (power-up pickup sound)
    this.scene.sound.play("power-up", { volume: 0.5 });

    // Call UI manager to display the power-up slot icon
    if (this.scene && typeof this.scene.showWeaponPowerup === "function") {
      if (duration) {
        this.scene.showWeaponPowerup({
          iconKey: `drop_${gunId}`,
          duration: duration / 1000,
          type: "time"
        });
      } else if (this.tempWeaponMaxShots !== null) {
        this.scene.showWeaponPowerup({
          iconKey: `drop_${gunId}`,
          duration: this.tempWeaponMaxShots,
          type: "shots"
        });
      }
    }
  }

  /**
   * Reverts the temporary weapon back to the player's default weapon.
   */
  revertToDefaultWeapon() {
    if (this.tempWeaponTimer) {
      this.tempWeaponTimer.remove();
      this.tempWeaponTimer = null;
    }

    this.tempWeaponId = null;
    this.tempWeaponMaxShots = null;
    this.tempWeaponShotsFired = 0;

    // Restore default skin and weapon configuration
    this.gun.setTexture(this.characterConfig.gunTexture);
    this.weapon = new Weapon(this.scene, this, this.characterConfig.weapon);

    // Clear UI manager icon
    if (this.scene && typeof this.scene.clearWeaponPowerup === "function") {
      this.scene.clearWeaponPowerup();
    }
  }

  /**
   * Spawns a floating feedback text above the player.
   * @param {string} text The text to display
   * @param {string} color The hex color code
   */
  showFeedbackText(text, color = "#ffffff") {
    const feedback = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 80,
      text,
      {
        fontSize: "20px",
        fontFamily: "Arial",
        color: color,
        stroke: "#000000",
        strokeThickness: 4,
        align: "center"
      }
    );
    feedback.setOrigin(0.5);
    feedback.setDepth(this.sprite.depth + 10);

    this.scene.tweens.add({
      targets: feedback,
      y: feedback.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        feedback.destroy();
      }
    });
  }
}
