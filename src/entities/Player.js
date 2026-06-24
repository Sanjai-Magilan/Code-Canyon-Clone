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
    this.speed = 800; // Movement speed in pixels per second

    // Configurable offsets for head and gun relative to the sprite center
    // Adjust these offsets to line up the parts with the main body sprite
    this.headOffset = { x: -10, y: -90 };
    this.headFloatAmplitude = 2; // pixels
    this.headFloatSpeed = 0.004; // animation speed
    this.gunOffset = { x: 25, y: -16 };

    // --- OOP Structural Framework for Future Additions ---
    this.health = 100;
    this.maxHealth = 100;
    this.weapons = [];
    this.inventory = [];
    this.interactionSystem = {
      interact: () => {
        console.log("Interacting with nearby object...");
      },
    };

    // --- Sprite & Physics Creation ---
    // Create the physics-enabled sprite (representing the player's body)
    this.sprite = this.scene.physics.add.sprite(x, y, "player");
    this.sprite.setScale(0.8);

    // Constrain the sprite to world bounds
    this.sprite.setCollideWorldBounds(true);

    // --- Attachment Images Creation ---
    // Create the head and gun images attached to the player
    this.head = this.scene.add.image(x, y, "player-head");
    this.head.setScale(0.8);
    this.gun = this.scene.add.image(x, y, "player-gun");
    this.gun.setScale(0.8);
    // Set depths so elements overlay correctly
    this.sprite.setDepth(10);
    this.head.setDepth(11);
    this.gun.setDepth(12);

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

    // --- Solve the Physics Position Lag ---
    // Register to Phaser's POST_UPDATE event. This event fires after Arcade Physics
    // finishes calculating and updating body positions, but before rendering the frame.
    this.scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      this.postUpdate,
      this,
    );

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
  }

  /**
   * Sync positions of attachments post-update to eliminate 1-frame position lag.
   * This executes after physics updates body position but before rendering.
   */
  postUpdate() {
    if (!this.sprite || !this.sprite.active) return;

    // Flip offsets horizontally based on sprite direction
    const flipMultiplier = this.sprite.flipX ? -1 : 1;

    // Sync positions
    const headBob =
      Math.sin(this.scene.time.now * this.headFloatSpeed) *
      this.headFloatAmplitude;

    this.head.setPosition(
      this.sprite.x + this.headOffset.x * flipMultiplier,
      this.sprite.y + this.headOffset.y + headBob,
    );
    this.gun.setPosition(
      this.sprite.x + this.gunOffset.x * flipMultiplier,
      this.sprite.y + this.gunOffset.y,
    );

    // Sync flip states
    this.head.setFlipX(this.sprite.flipX);
    this.gun.setFlipX(this.sprite.flipX);
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
    }

    if (this.head) {
      this.head.destroy();
    }
    if (this.gun) {
      this.gun.destroy();
    }
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
    if (this.head) this.head.setVisible(false);
    if (this.gun) this.gun.setVisible(false);
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
