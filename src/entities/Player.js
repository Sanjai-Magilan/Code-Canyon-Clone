import Phaser from "phaser";

export default class Player {
  /**
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x The initial x coordinate
   * @param {number} y The initial y coordinate
   */
  constructor(scene, x, y) {
    this.scene = scene;

    // --- Configurable Properties ---
    this.speed = 600; // Movement speed in pixels per second

    // --- OOP Structural Framework for Future Additions ---
    this.health = 100;
    this.maxHealth = 100;
    this.weapons = [];
    this.inventory = [];
    this.interactionSystem = {
      // Future interaction system logic can reside here
      interact: () => {
        console.log("Interacting with nearby object...");
      },
    };

    // --- Sprite & Physics Creation ---
    // Create the physics-enabled sprite
    this.sprite = this.scene.physics.add.sprite(x, y, "player");
    this.sprite.setScale(1);
    this.sprite.setCollideWorldBounds(true);

    this.head = this.scene.add.image(x, y - 95, "player-head");
    this.head.setScale(0.9);
    this.head.setDepth(this.sprite.depth + 1);

    this.gun = this.scene.add.image(x + 25, y - 10, "player-gun");
    this.gun.setScale(0.9);
    this.gun.setDepth(this.sprite.depth + 1);

    // --- Animation Creation ---
    this.createAnimations();

    // Play default run animation (starts playing immediately)
    this.sprite.play("player-run");

    // --- Input Setup (WASD Keys) ---
    if (this.scene.input && this.scene.input.keyboard) {
      this.wasd = this.scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });
    }
  }

  /**
   * Expose the underlying Phaser physics sprite
   * @returns {Phaser.Physics.Arcade.Sprite}
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Internal helper to register player animations.
   */
  createAnimations() {
    // Only register player-run animation if it hasn't been defined in the global animations manager
    if (!this.scene.anims.exists("player-run")) {
      this.scene.anims.create({
        key: "player-run",
        frames: this.scene.anims.generateFrameNumbers("player", {
          start: 0,
          end: 3,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Future animations (e.g. idle animation placeholder)
    if (!this.scene.anims.exists("player-idle")) {
      // Define player-idle animation when spritesheets are ready
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

    // Animation state machine logic
    if (isMoving) {
      if (
        !this.sprite.anims.isPlaying ||
        this.sprite.anims.currentAnim.key !== "player-run"
      ) {
        this.sprite.play("player-run");
      }
    } else {
      // If we have an idle animation, play it here. For now, stop the run animation at frame 0.
      if (this.scene.anims.exists("player-idle")) {
        this.sprite.play("player-idle", true);
      } else {
        this.sprite.stop();
        this.sprite.setFrame(0);
      }
    }
    const headOffsetX = this.sprite.flipX ? 15 : -15;
    this.head.x = this.sprite.x + headOffsetX;
    this.head.y = this.sprite.y - 95;

    this.head.flipX = this.sprite.flipX;

    const gunOffsetX = this.sprite.flipX ? -25 : 25;

    this.gun.x = this.sprite.x + gunOffsetX;
    this.gun.y = this.sprite.y - 10;

    this.gun.flipX = this.sprite.flipX;
    console.log(this.sprite.x, this.head.x, this.gun.x);
  }

  // --- Future OOP Systems & Actions ---

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
    this.head.setVisible(false);
    this.gun.setVisible(false);
  }

  /**
   * Equips a new weapon
   */
  equipWeapon(weapon) {
    this.weapons.push(weapon);
  }

  /**
   * Adds an item to inventory
   */
  addItemToInventory(item) {
    this.inventory.push(item);
  }
}
