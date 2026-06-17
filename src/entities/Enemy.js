export default class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;

    this.shadow = scene.add.image(x + 10, y + 50, "worm-shadow");

    this.shadow.setScale(0.7);

    this.sprite = scene.add.sprite(x, y, "worm");

    this.shadow.setDepth(0);
    this.sprite.setDepth(1);

    this.sprite.setScale(0.8);

    this.isMoving = false;
  }

  moveOneBeat() {
    if (this.isMoving) return;

    this.isMoving = true;

    this.sprite.play("worm-run");

    this.scene.tweens.add({
      targets: [this.sprite, this.shadow],

      x: "-=60",

      duration: 300,

      onComplete: () => {
        this.sprite.stop();
        this.sprite.setFrame(0);

        this.isMoving = false;
      },
    });
  }
}
