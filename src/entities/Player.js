import Phaser from "phaser";
import Weapon from "./Weapon";
import CHARACTERS from "../config/characterConfig";
import WEAPON_CONFIG from "../config/weaponConfig";
import WEAPON_DROP_CONFIG from "../config/weaponDropConfig";
import PLAYER_CONFIG from "../config/playerConfig";
import PlayerDustEmitter from "../systems/PlayerDustEmitter";
import PlayerVisual from "./PlayerVisual";

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
    this.shieldDirection = "right";
    this.shieldHitsRemaining = 0;

    // --- Dash System State ---
    this.isDashing = false;
    this.canDash = true;
    this.lastDashTime = 0;
    this.lastMoveDirection = new Phaser.Math.Vector2(1, 0);
    this.currentDirVector = new Phaser.Math.Vector2(0, 0);

    this.spaceKey = this.scene?.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) || null;

    // --- Physics Body Creation ---
    this.sprite = this.scene.physics.add.sprite(x, y, this.characterConfig.bodyTexture);
    this.sprite.setScale(this.characterConfig.scale);
    this.sprite.setCollideWorldBounds(true);
    // Physics body handles movement/collisions; PlayerVisual handles visual rendering
    this.sprite.setVisible(false);

    // --- Visual Container System ---
    this.visual = new PlayerVisual(this.scene, this);

    // Initialize running dust emitter system
    this.dustEmitter = new PlayerDustEmitter(this.scene, this);

    // --- Solve Physics Position Lag ---
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

  // --- Backward Compatibility Getters ---
  get head() { return this.visual?.head; }
  get gun() { return this.visual?.gun; }
  get flash() { return this.visual?.flash; }
  get shadow() { return this.visual?.shadow; }
  get shield() { return this.visual?.shield; }

  /**
   * Expose the underlying Phaser physics sprite
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Safely swaps the player's head.
   * @param {string} headKey Texture key for the new head
   */
  setHead(headKey) {
    if (this.visual) {
      this.visual.setHead(headKey);
    }
  }

  /**
   * Safely swaps the player's gun.
   * @param {string} gunKey Texture key for the new gun
   */
  setGun(gunKey) {
    if (this.visual) {
      this.visual.setGun(gunKey);
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

    // Check if player is actively engaging a typing target
    const hasTypingTarget = !!(
      this.scene?.typingTarget &&
      this.scene.typingTarget.sprite &&
      this.scene.typingTarget.sprite.active &&
      !this.scene.typingTarget.isDead
    );

    // Handle horizontal movement & flip state
    if (leftDown) {
      this.sprite.setVelocityX(-this.speed);
      this.sprite.setFlipX(true);
      if (!hasTypingTarget) {
        this.visual.setFlip(true);
      }
      isMoving = true;
    } else if (rightDown) {
      this.sprite.setVelocityX(this.speed);
      this.sprite.setFlipX(false);
      if (!hasTypingTarget) {
        this.visual.setFlip(false);
      }
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
      this.visual.playAnimation(runAnimKey);
    } else {
      this.visual.stopAnimation(0);
    }
  }

  /**
   * Sync positions of attachments post-update to eliminate position lag.
   * This executes after physics updates body position but before rendering.
   */
  postUpdate(time, delta) {
    if (!this.sprite || !this.sprite.active) return;

    // Sync container position to match physics body
    this.visual.setPosition(this.sprite.x, this.sprite.y);
    this.visual.update(time, delta);

    // Update player running dust particles
    if (this.dustEmitter) {
      this.dustEmitter.update(time, delta);
    }

    // Sync shield facing direction property
    if (this.visual.shield) {
      this.shieldDirection = this.visual.isFlipped ? "left" : "right";
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
   * Cleanup method to destroy children and detach scene event listeners.
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

    if (this.visual) {
      this.visual.destroy();
      this.visual = null;
    }

    if (this.dustEmitter) {
      this.dustEmitter.destroy();
      this.dustEmitter = null;
    }

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

    // Visual effect: make container slightly transparent
    this.visual.container.setAlpha(0.7);

    // Calculate direction and speed
    const dir = this.lastMoveDirection.clone().normalize();
    const dashSpeed = PLAYER_CONFIG.dash.distance / (PLAYER_CONFIG.dash.duration / 1000);

    this.sprite.setVelocity(dir.x * dashSpeed, dir.y * dashSpeed);

    // Keep running animation active
    const runAnimKey = `${this.characterConfig.bodyTexture}-run`;
    this.visual.playAnimation(runAnimKey);

    // End dash after duration
    this.dashTimer = this.scene.time.delayedCall(PLAYER_CONFIG.dash.duration, () => {
      this.isDashing = false;
      if (this.sprite?.body) {
        this.sprite.setVelocity(0, 0);
      }
      if (this.visual?.container) {
        this.visual.container.setAlpha(1.0);
      }

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

    if (this.checkShieldBlock(source)) {
      return;
    }

    if (this.isInvincible) {
      return;
    }

    // Play hit sound effect
    this.scene?.sound?.play("player-oof", { volume: 0.3 });

    this.health = Math.max(0, this.health - 1);
    this.scene?.updateHearts?.();

    if (this.health <= 0) {
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
    this.scene?.updateHearts?.();
  }

  /**
   * Handle player death sequence
   */
  die() {
    if (this.isDead) return;
    this.isDead = true;

    this.destroyShield();
    this.clearInvincibilityTimers();
    this.setPlayerAlpha(1.0);

    // Stop movement and disable physics body
    if (this.sprite.body) {
      this.sprite.setVelocity(0, 0);
    }
    this.sprite.disableBody(true, true);
    this.visual.setVisible(false);

    // Shake camera slightly
    this.scene?.cameras?.main?.shake(300, 0.02);

    // Restart the scene after 1000ms delay using Phaser's Clock
    this.scene?.time?.delayedCall(1000, () => {
      try {
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
    this.visual.equipShield("shield-sprite");
  }

  /**
   * Destroys the shield and resets shield states.
   * @param {boolean} sceneShutdown Whether the scene is shutting down/restarting
   */
  destroyShield(sceneShutdown = false) {
    this.hasShield = false;
    this.shieldHitsRemaining = 0;
    if (this.visual) {
      this.visual.removeShield();
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
      if (this.visual?.shield) {
        this.scene.tweens.add({
          targets: this.visual.shield,
          x: this.visual.shield.x + Phaser.Math.Between(-6, 6),
          y: this.visual.shield.y + Phaser.Math.Between(-6, 6),
          duration: 50,
          yoyo: true,
          repeat: 2
        });

        this.visual.shield.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
          if (this.visual?.shield) this.visual.shield.clearTint();
        });
      }
    }

    if (this.shieldHitsRemaining <= 0) {
      this.destroyShield();
    }
  }

  /**
   * Returns current muzzle position in world coordinates for bullet spawning.
   * @returns {{x: number, y: number}}
   */
  getMuzzlePosition() {
    if (this.visual) {
      return this.visual.getWorldMuzzlePosition();
    }
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Fires one bullet toward a targeted enemy.
   * @param {object} targetEnemy The targeted Enemy entity
   */
  shootToward(targetEnemy) {
    if (!targetEnemy || !targetEnemy.sprite || !targetEnemy.sprite.active || targetEnemy.isDead) return;

    // Determine horizontal facing direction toward target enemy (facing left if enemy X < player X)
    const isTargetLeft = targetEnemy.sprite.x < this.sprite.x;
    if (this.visual) {
      this.visual.setFlip(isTargetLeft);
    }

    const muzzle = this.getMuzzlePosition();
    const angle = Phaser.Math.Angle.Between(
      muzzle.x,
      muzzle.y,
      targetEnemy.sprite.x,
      targetEnemy.sprite.y
    );

    // Get active weapon config
    const weaponConfig = this.getEquippedWeaponConfig();
    const bulletTexture = weaponConfig.bulletTexture || "bullet";
    const bulletSpeed = weaponConfig.bulletSpeed || 1400;
    const bulletScale = weaponConfig.bulletScale || 0.6;
    const bulletLifetime = weaponConfig.projectileLifetime || 2000;

    // Trigger visual gun recoil impulse
    this.triggerGunRecoil();

    // Play shoot sound effect if loaded in audio cache
    if (this.scene?.sound && this.scene?.cache?.audio?.has("shoot")) {
      this.scene.sound.play("shoot", { volume: 0.25 });
    }

    // Spawn bullet via ProjectileManager with target tracking & targetLetterIndex
    if (this.scene?.projectileManager) {
      const nextIdx = targetEnemy.pendingTypedCount !== undefined ? targetEnemy.pendingTypedCount : 0;
      this.scene.projectileManager.spawnSingle({
        x: muzzle.x,
        y: muzzle.y,
        angle: angle,
        bulletTexture: bulletTexture,
        bulletSpeed: bulletSpeed,
        bulletScale: bulletScale,
        bulletLifetime: bulletLifetime,
        bulletDamage: 1,
        targetEnemy: targetEnemy,
        targetLetterIndex: nextIdx
      }, false, this.sprite?.body?.velocity || null);
    }

    // Consume shot from temporary weapon drop if equipped
    this.useTemporaryWeaponShot();
  }

  /**
   * Trigger visual gun recoil impulse.
   */
  triggerGunRecoil() {
    const config = this.characterConfig.recoil;
    if (this.visual) {
      this.visual.applyRecoil(config.offset, config.angle);
    }
  }

  /**
   * Start invincibility frames when player takes damage.
   */
  startInvincibility() {
    this.isInvincible = true;
    this.lastHitTime = this.scene.time.now;

    // Create flashing transparency tween
    this.invincibilityTween = this.scene.tweens.add({
      targets: this.visual.container,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.invincibilityDuration / 200) - 1,
      onComplete: () => {
        this.setPlayerAlpha(1.0);
      }
    });

    this.invincibilityTimer = this.scene.time.delayedCall(this.invincibilityDuration, () => {
      this.isInvincible = false;
      this.setPlayerAlpha(1.0);
    });
  }

  /**
   * Helper to set alpha transparency across the visual container.
   * @param {number} alpha Alpha value
   */
  setPlayerAlpha(alpha) {
    if (this.visual?.container) {
      this.visual.container.setAlpha(alpha);
    }
  }

  /**
   * Helper to clear invincibility timers and reset visual state.
   */
  clearInvincibilityTimers() {
    this.isInvincible = false;
    if (this.invincibilityTween) {
      this.invincibilityTween.stop();
      this.invincibilityTween = null;
    }
    if (this.invincibilityTimer) {
      this.invincibilityTimer.remove();
      this.invincibilityTimer = null;
    }
    this.setPlayerAlpha(1.0);
  }

  /**
   * Equips a temporary weapon drop (e.g. shotgun, laser).
   * @param {string} dropId Drop weapon identifier
   */
  equipTemporaryWeapon(dropId) {
    const config = WEAPON_CONFIG[dropId];
    if (!config) return;

    this.tempWeaponId = dropId;
    this.tempWeaponMaxShots = WEAPON_DROP_CONFIG.maxShots?.[dropId] || config.durationShots || null;
    this.tempWeaponShotsFired = 0;

    // Update gun sprite texture (uses skin_<dropId> texture key if gunTexture is not explicitly defined)
    const gunTexture = config.gunTexture || `skin_${dropId}`;
    this.setGun(gunTexture);

    // Set duration timer if applicable from WEAPON_DROP_CONFIG.durations
    const durationMs = WEAPON_DROP_CONFIG.durations?.[dropId] || config.durationTime || null;
    if (durationMs) {
      if (this.tempWeaponTimer) {
        this.tempWeaponTimer.remove();
      }
      this.tempWeaponTimer = this.scene.time.delayedCall(durationMs, () => {
        this.revertToDefaultWeapon();
      });
    }

    // Notify scene to show weapon drop UI icon and start power-up state
    if (this.scene?.showWeaponPowerup) {
      this.scene.showWeaponPowerup({
        iconKey: `drop_${dropId}`,
        type: this.tempWeaponMaxShots ? "shots" : "time",
        duration: durationMs ? Math.round(durationMs / 1000) : (this.tempWeaponMaxShots || 30)
      });
    } else {
      this.scene?.updateWeaponPowerupUI?.();
    }
  }

  /**
   * Consumes a shot from the temporary weapon.
   */
  useTemporaryWeaponShot() {
    if (!this.tempWeaponId) return;

    this.tempWeaponShotsFired++;
    if (this.tempWeaponMaxShots && this.tempWeaponShotsFired >= this.tempWeaponMaxShots) {
      this.revertToDefaultWeapon();
    } else {
      this.scene?.updateWeaponPowerupUI?.();
    }
  }

  /**
   * Reverts to the player's default character weapon.
   */
  revertToDefaultWeapon() {
    this.tempWeaponId = null;
    this.tempWeaponMaxShots = null;
    this.tempWeaponShotsFired = 0;
    if (this.tempWeaponTimer) {
      this.tempWeaponTimer.remove();
      this.tempWeaponTimer = null;
    }

    // Revert gun texture to character default
    this.setGun(this.characterConfig.gunTexture);
    this.scene?.clearWeaponPowerup?.();
  }

  /**
   * Returns current active weapon drop configuration or default weapon config.
   */
  getEquippedWeaponConfig() {
    if (this.tempWeaponId && WEAPON_CONFIG[this.tempWeaponId]) {
      return WEAPON_CONFIG[this.tempWeaponId];
    }
    return this.weapon.config;
  }
}
