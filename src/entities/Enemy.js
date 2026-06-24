import Phaser from "phaser";

export default class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;

    this.shadow = scene.add.image(x + 10, y + 40, "worm-shadow");
    this.shadow.setScale(0.7);

    // Create a physics-enabled sprite for frame-rate independent movement & collisions
    this.sprite = scene.physics.add.sprite(x, y, "worm");
    this.sprite.setScale(0.8);
    
    this.speed = 120; // Pixels per second
    this.isMoving = true;

    // Start worm running animation immediately
    this.sprite.play("worm-run");

    // Hook cleanup to the sprite destroy event to prevent memory leaks
    this.sprite.on(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  update(player) {
    if (!this.sprite || !this.sprite.body || !this.sprite.active) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      player.x,
      player.y
    );

    // Set physics velocity instead of directly modifying coordinate offsets (avoids framerate dependency)
    this.sprite.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );

    // Face the player
    const movingLeft = player.x < this.sprite.x;
    this.sprite.setFlipX(movingLeft);

    // Update shadow position and mirroring to stay synced with the parent sprite
    const shadowOffsetX = movingLeft ? -10 : 10;
    this.shadow.x = this.sprite.x + shadowOffsetX;
    this.shadow.y = this.sprite.y + 40;
    this.shadow.setFlipX(movingLeft);
  }

  destroy() {
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}

