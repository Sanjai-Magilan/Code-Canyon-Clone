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

    // --- Typing Combat System State ---
    this.assignedWord = scene.getUniqueWordForEnemy();
    this.currentLetterIndex = 0;
    this.virtualLetterIndex = 0;
    this.typedProgress = "";
    this.remainingLetters = this.assignedWord;

    // Create label sprites above the enemy using sprite font "hud-font"
    this.wordSprites = [];
    this.createWordSprites();

    // Attach memory leak protection event on destroy
    this.sprite.on(Phaser.GameObjects.Events.DESTROY, () => this.destroy(true));
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

    this.updateWordSpritesPosition();
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

    // Clear typing target lock
    if (scene && scene.typingTarget === this) {
      scene.typingTarget = null;
    }

    // Immediately destroy all hovering letter sprites
    if (this.wordSprites) {
      this.wordSprites.forEach(sprite => {
        if (sprite) sprite.destroy();
      });
      this.wordSprites = [];
    }

    // Call scene onEnemyKilled hook to register kill streak progress
    if (scene && typeof scene.onEnemyKilled === "function") {
      scene.onEnemyKilled();
    }

    const index = scene.enemies.findIndex((e) => e === this);
    if (index !== -1) {
      scene.enemies.splice(index, 1);
    }

    if (this.sprite && this.sprite.active) {
      const deathX = this.sprite.x;
      const deathY = this.sprite.y;

      if (typeof scene.spawnEnemyExplosion === "function") {
        scene.spawnEnemyExplosion(deathX, deathY, this.sprite.texture.key);
      }

      const gunId = this.dropGunId();
      if (gunId && scene.weaponDropManager) {
        scene.weaponDropManager.spawnPickup(deathX, deathY, gunId);
      }

      // Only the Worm enemy can drop hearts (with 5% probability)
      if (this.sprite.texture.key === "worm") {
        if (Phaser.Math.Between(1, 100) <= 5) {
          if (typeof scene.spawnHealthPickup === "function") {
            scene.spawnHealthPickup(deathX, deathY);
          }
        }
      }

      // Only the Crab enemy can drop shields (with 10% probability)
      if (this.sprite.texture.key === "crab") {
        if (Phaser.Math.Between(1, 100) <= 10) {
          if (typeof scene.spawnShieldPickup === "function") {
            scene.spawnShieldPickup(deathX, deathY);
          }
        }
      }

      // Only the Angler enemy can drop shields (with 15% probability)
      if (this.sprite.texture.key === "angler") {
        if (Phaser.Math.Between(1, 100) <= 15) {
          if (typeof scene.spawnShieldPickup === "function") {
            scene.spawnShieldPickup(deathX, deathY);
          }
        }
      }

      this.sprite.destroy();
    }
  }

  /**
   * Spawns sprites representing the characters of the assigned word.
   */
  createWordSprites() {
    const scene = this.scene;
    const word = this.assignedWord.toUpperCase();
    const letterSpacing = 40; // horizontal spacing between characters
    const totalWidth = (word.length - 1) * letterSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i) - 65; // A = 65
      const frame = (charCode >= 0 && charCode <= 25) ? charCode : 0;

      const sprite = scene.add.sprite(this.sprite.x + startX + i * letterSpacing, this.sprite.y - 85, "hud-font");
      sprite.setFrame(frame);
      sprite.setScale(0.24);
      sprite.setDepth(this.sprite.depth + 100);
      sprite.setTint(0xffffff); // Initial untyped state (white)

      this.wordSprites.push(sprite);
    }
  }

  /**
   * Updates coordinates of the word label to follow the enemy.
   */
  updateWordSpritesPosition() {
    if (!this.sprite || !this.sprite.active) return;
    const word = this.assignedWord;
    const letterSpacing = 40;
    const totalWidth = (word.length - 1) * letterSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.wordSprites.length; i++) {
      const sprite = this.wordSprites[i];
      if (sprite && sprite.active) {
        sprite.x = this.sprite.x + startX + i * letterSpacing;
        sprite.y = this.sprite.y - 85;
        sprite.setDepth(this.sprite.depth + 100);
      }
    }
  }

  /**
   * Advances the actual hit progress when a typed bullet hits.
   */
  advanceProgress() {
    if (this.isDead) return;

    this.currentLetterIndex++;
    this.typedProgress = this.assignedWord.slice(0, this.currentLetterIndex);
    this.remainingLetters = this.assignedWord.slice(this.currentLetterIndex);

    // Apply green tint to successfully typed/hit characters, clear tint for untyped
    for (let i = 0; i < this.wordSprites.length; i++) {
      const sprite = this.wordSprites[i];
      if (sprite && sprite.active) {
        if (i < this.currentLetterIndex) {
          sprite.setTint(0x00ff00);
        } else {
          sprite.setTint(0xffffff);
        }
      }
    }

    // Trigger completion bullet once the whole word is successfully typed
    if (this.currentLetterIndex >= this.assignedWord.length) {
      if (this.scene && typeof this.scene.fireCompletionBullet === "function") {
        this.scene.fireCompletionBullet(this);
      }
      
      // Clear target lock immediately upon completion
      if (this.scene && this.scene.typingTarget === this) {
        this.scene.typingTarget = null;
      }
    }
  }

  destroy(fromSpriteEvent = false) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    if (this.wordSprites) {
      this.wordSprites.forEach(sprite => {
        if (sprite) sprite.destroy();
      });
      this.wordSprites = [];
    }
    if (this.scene && this.scene.activeWords && this.assignedWord) {
      this.scene.activeWords.delete(this.assignedWord);
    }
    if (this.sprite) {
      const sprite = this.sprite;
      this.sprite = null;
      if (!fromSpriteEvent) {
        sprite.destroy();
      }
    }
  }
}
