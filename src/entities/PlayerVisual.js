import Phaser from "phaser";
import HEAD_OFFSETS from "../config/headOffsets";

export default class PlayerVisual {
  /**
   * Dedicated modular visual rendering system for the player using a Phaser Container.
   * Eliminates independent world-space position calculations and pixel-snapping jitter.
   * 
   * @param {Phaser.Scene} scene The parent scene
   * @param {object} player The player entity instance
   */
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.config = player.characterConfig;

    // Local configuration parameters
    this.headOffset = this.config.headOffset;
    this.headFloatAmplitude = this.config.headFloatAmplitude;
    this.headFloatSpeed = this.config.headFloatSpeed;
    this.gunOffset = this.config.gunOffset;

    // Recoil state
    this.recoilOffset = 0;
    this.recoilAngle = 0;

    // Flip state
    this.isFlipped = false;

    // Create container at initial coordinates
    this.container = this.scene.add.container(player.sprite?.x || 0, player.sprite?.y || 0);
    this.container.setDepth(this.config.depth);

    // Create child GameObjects inside the Container (ordered from back to front)
    // 1. Shadow (Local Y: +30)
    this.shadow = this.scene.add.image(0, 30, this.config.shadowTexture);
    this.shadow.setScale(this.config.scale);

    // 2. Body Sprite (Local 0, 0)
    this.bodySprite = this.scene.add.sprite(0, 0, this.config.bodyTexture);
    this.bodySprite.setScale(this.config.scale);

    // 3. Head Image
    this.head = this.scene.add.image(
      this.headOffset.x,
      this.headOffset.y,
      this.config.headTexture
    );
    this.head.setScale(this.config.scale);

    // 4. Gun Image
    this.gun = this.scene.add.image(
      this.gunOffset.x,
      this.gunOffset.y,
      this.config.gunTexture
    );
    this.gun.setScale(this.config.scale);

    // 5. Muzzle Flash Sprite (optional)
    this.flash = null;

    // 6. Shield Image (optional)
    this.shield = null;

    // Add children to the Container in back-to-front rendering order
    this.container.add([
      this.shadow,
      this.bodySprite,
      this.head,
      this.gun
    ]);

    // Setup body animation
    this.createAnimations();
    this.playAnimation(`${this.config.bodyTexture}-run`);
  }

  /**
   * Internal helper to register character body animations.
   */
  createAnimations() {
    const runAnimKey = `${this.config.bodyTexture}-run`;
    if (!this.scene.anims.exists(runAnimKey)) {
      this.scene.anims.create({
        key: runAnimKey,
        frames: this.scene.anims.generateFrameNumbers(this.config.bodyTexture, {
          start: this.config.anim.run.start,
          end: this.config.anim.run.end,
        }),
        frameRate: this.config.anim.run.frameRate,
        repeat: -1,
      });
    }
  }

  /**
   * Sync container position to match the physics body.
   * @param {number} x World X coordinate
   * @param {number} y World Y coordinate
   */
  setPosition(x, y) {
    if (this.container && this.container.active) {
      this.container.setPosition(x, y);
    }
  }

  /**
   * Update visual effects (head bobbing, recoil decay, attachments) post-physics.
   * @param {number} time Current scene time
   * @param {number} delta Elapsed frame delta in ms
   */
  update(time, delta) {
    if (!this.container || !this.container.active) return;

    // 1. Decay visual recoil offsets
    this.recoilOffset *= this.config.recoil.offsetDecay;
    if (Math.abs(this.recoilOffset) < 0.1) this.recoilOffset = 0;

    this.recoilAngle *= this.config.recoil.angleDecay;
    if (Math.abs(this.recoilAngle) < 0.1) this.recoilAngle = 0;

    // 2. Compute local attachment flip multiplier
    const flipMultiplier = this.isFlipped ? -1 : 1;

    // 3. Compute head bobbing offset
    const actualTime = time !== undefined ? time : this.scene?.time?.now || 0;
    const headBob = Math.sin(actualTime * this.headFloatSpeed) * this.headFloatAmplitude;
    const offset = HEAD_OFFSETS[this.head?.texture?.key] || this.headOffset;

    // 4. Position attachments using LOCAL container coordinates
    if (this.head?.active) {
      this.head.setPosition(
        offset.x * flipMultiplier,
        offset.y + headBob
      );
    }

    if (this.gun?.active) {
      this.gun.setPosition(
        (this.gunOffset.x + this.recoilOffset) * flipMultiplier,
        this.gunOffset.y
      );
      this.gun.setAngle(this.recoilAngle);
    }

    // 5. Update flash position if active
    if (this.flash?.active) {
      const localMuzzle = this.getLocalMuzzlePosition();
      this.flash.setPosition(localMuzzle.x, localMuzzle.y);
      this.flash.setFlipX(this.isFlipped);
    }

    // 6. Update shield position if active
    if (this.shield?.active) {
      const ox = this.isFlipped ? -50 : 50;
      this.shield.setPosition(ox, -10);
      this.shield.setFlipX(this.isFlipped);
    }
  }

  /**
   * Set container and attachment facing direction.
   * @param {boolean} flipX True if facing left
   */
  setFlip(flipX) {
    if (this.isFlipped === flipX) return;
    this.isFlipped = flipX;

    if (this.bodySprite?.active) this.bodySprite.setFlipX(flipX);
    if (this.head?.active) this.head.setFlipX(flipX);
    if (this.gun?.active) this.gun.setFlipX(flipX);
    if (this.shadow?.active) this.shadow.setFlipX(flipX);
    if (this.shield?.active) this.shield.setFlipX(flipX);
  }

  /**
   * Safely swaps the player's head texture in-place without recreating GameObjects.
   * @param {string} headKey Texture key for the new head
   */
  setHead(headKey) {
    if (!headKey || !this.head || !this.head.active) return;
    this.head.setTexture(headKey);
  }

  /**
   * Safely swaps the player's gun texture in-place without recreating GameObjects.
   * @param {string} gunKey Texture key for the new gun
   */
  setGun(gunKey) {
    if (!gunKey || !this.gun || !this.gun.active) return;
    this.gun.setTexture(gunKey);
  }

  /**
   * Equip shield attachment onto the container.
   * @param {string} shieldKey Texture key for the shield
   */
  equipShield(shieldKey = "itemskin-shield-000") {
    if (!this.shield || !this.shield.active) {
      this.shield = this.scene.add.image(50, -10, shieldKey);
      this.shield.setScale(this.config.scale);
      if (this.container?.active) {
        this.container.add(this.shield);
      }
    } else {
      this.shield.setTexture(shieldKey);
      this.shield.setVisible(true);
    }
    this.shield.setFlipX(this.isFlipped);
  }

  /**
   * Remove active shield attachment from the container.
   */
  removeShield() {
    if (this.shield) {
      if (this.container?.active) {
        this.container.remove(this.shield, true);
      } else if (this.shield.active) {
        this.shield.destroy();
      }
      this.shield = null;
    }
  }

  /**
   * Apply a recoil impulse to the gun.
   * @param {number} offset Recoil pixel offset impulse
   * @param {number} angle Recoil angle rotational impulse
   */
  applyRecoil(offset, angle) {
    this.recoilOffset = offset;
    this.recoilAngle = angle;
  }

  /**
   * Return local muzzle position relative to the container origin.
   * @returns {{x: number, y: number}}
   */
  getLocalMuzzlePosition() {
    const flipMultiplier = this.isFlipped ? -1 : 1;
    return {
      x: (this.gunOffset.x + 30 + this.recoilOffset) * flipMultiplier,
      y: this.gunOffset.y - 5
    };
  }

  /**
   * Return world-space muzzle position for spawning bullets.
   * @returns {{x: number, y: number}}
   */
  getWorldMuzzlePosition() {
    const local = this.getLocalMuzzlePosition();
    const cx = this.container?.x || 0;
    const cy = this.container?.y || 0;
    return {
      x: cx + local.x,
      y: cy + local.y
    };
  }

  /**
   * Play body animation key.
   * @param {string} key Animation key
   */
  playAnimation(key) {
    if (this.bodySprite?.active && this.bodySprite.anims) {
      this.bodySprite.play(key, true);
    }
  }

  /**
   * Stop body animation and set frame.
   * @param {number} frame Frame index
   */
  stopAnimation(frame = 0) {
    if (this.bodySprite?.active) {
      this.bodySprite.stop();
      this.bodySprite.setFrame(frame);
    }
  }

  /**
   * Set z-order depth of the container.
   * @param {number} depth Depth value
   */
  setDepth(depth) {
    if (this.container?.active) {
      this.container.setDepth(depth);
    }
  }

  /**
   * Set container visibility.
   * @param {boolean} visible Visibility state
   */
  setVisible(visible) {
    if (this.container?.active) {
      this.container.setVisible(visible);
    }
  }

  /**
   * Destroy container and all child sprites, nullifying references to prevent leaks.
   */
  destroy() {
    if (this.container) {
      // Container.destroy(true) recursively destroys all child sprites and removes container from scene
      this.container.destroy(true);
      this.container = null;
    }
    this.shadow = null;
    this.bodySprite = null;
    this.head = null;
    this.gun = null;
    this.flash = null;
    this.shield = null;
    this.scene = null;
    this.player = null;
  }
}
