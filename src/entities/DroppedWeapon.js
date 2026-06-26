import Phaser from "phaser";
import WEAPON_DROP_CONFIG from "../config/weaponDropConfig";

export default class DroppedWeapon extends Phaser.Physics.Arcade.Sprite {
  /**
   * Represents a weapon pickup on the ground.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x X position
   * @param {number} y Y position
   * @param {string} gunId The weapon identifier (e.g., 'gun1')
   */
  constructor(scene, x, y, gunId) {
    const textureKey = `drop_${gunId}`;
    super(scene, x, y, textureKey);

    this.gunId = gunId;
    this.scene = scene;

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Disable gravity-like behaviors for top-down space
    this.body.setImmovable(true);
    this.setScale(0.55);

    // Create dynamic glow
    this.createGlow(x, y);

    // Float slightly up and down using a tween
    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Despawn after configured lifetime
    this.despawnTimer = scene.time.delayedCall(
      WEAPON_DROP_CONFIG.pickupLifetime || 15000,
      this.despawn,
      [],
      this
    );

    // Set depth based on position for correct sorting
    this.setDepth(y);
  }

  /**
   * Creates a radial gradient glow under the weapon.
   */
  createGlow(x, y) {
    const textureKey = "weapon-glow";
    if (!this.scene.textures.exists(textureKey)) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255, 235, 150, 0.7)");
      gradient.addColorStop(0.3, "rgba(255, 200, 80, 0.3)");
      gradient.addColorStop(1, "rgba(255, 200, 80, 0)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      this.scene.textures.addCanvas(textureKey, canvas);
    }

    this.glow = this.scene.add.image(x, y, textureKey);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setDepth(this.depth - 1);
    this.glow.setScale(0.4);

    // Pulse the scale and transparency of the glow
    this.glowTween = this.scene.tweens.add({
      targets: this.glow,
      scale: 0.65,
      alpha: 0.45,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // Align glow to the floating weapon position
    if (this.glow && this.active) {
      this.glow.setPosition(this.x, this.y);
    }
  }

  despawn() {
    this.destroy();
  }

  destroy(fromScene) {
    if (this.floatTween) {
      this.floatTween.remove();
      this.floatTween = null;
    }
    if (this.glowTween) {
      this.glowTween.remove();
      this.glowTween = null;
    }
    if (this.despawnTimer) {
      this.despawnTimer.remove();
      this.despawnTimer = null;
    }
    if (this.glow) {
      this.glow.destroy();
      this.glow = null;
    }
    super.destroy(fromScene);
  }
}
