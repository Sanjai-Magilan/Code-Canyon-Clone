import Phaser from "phaser";

export default class ShieldPickup extends Phaser.Physics.Arcade.Sprite {
  /**
   * Represents a shield pickup on the ground.
   * @param {Phaser.Scene} scene The parent scene
   * @param {number} x X position
   * @param {number} y Y position
   */
  constructor(scene, x, y) {
    super(scene, x, y, "shield-item");
    this.scene = scene;

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Disable gravity-like behaviors for top-down space
    if (this.body) {
      this.body.setImmovable(true);
    }
    this.setScale(1);

    // Float slightly up and down using a tween
    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Despawn after 15 seconds to prevent memory leaks/orphan pickups
    this.despawnTimer = scene.time.delayedCall(
      15000,
      this.despawn,
      [],
      this
    );

    // Set depth based on position for correct sorting
    this.setDepth(y);
  }

  despawn() {
    this.destroy();
  }

  destroy(fromScene) {
    if (this.floatTween) {
      this.floatTween.remove();
      this.floatTween = null;
    }
    if (this.despawnTimer) {
      this.despawnTimer.remove();
      this.despawnTimer = null;
    }
    super.destroy(fromScene);
  }
}
