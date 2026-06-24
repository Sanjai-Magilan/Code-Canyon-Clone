import Phaser from "phaser";

export default class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;

    this.shadow = scene.add.image(x + 10, y + 40, "worm-shadow");

    this.shadow.setScale(0.7);

    this.sprite = scene.add.sprite(x, y, "worm");

    this.shadow.setDepth(0);
    this.sprite.setDepth(1);

    this.sprite.setScale(0.8);

    this.isMoving = false;

    // Start worm running animation immediately
    this.sprite.play("worm-run");
  }

  update(player) {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      player.x,
      player.y,
    );

    this.sprite.x += Math.cos(angle) * 2;
    this.sprite.y += Math.sin(angle) * 2;
    this.shadow.x = this.sprite.x + 10;
    this.shadow.y = this.sprite.y + 40;
  }
}

