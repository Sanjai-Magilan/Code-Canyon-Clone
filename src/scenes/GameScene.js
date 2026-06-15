import Phaser from "phaser";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import wormRun from "../assets/Sprites/Enemy/run/worm_run.png";
import shadowImg from "../assets/Sprites/Enemy/worm-shadow.png";
export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }
  preload() {
    this.load.spritesheet("worm", wormRun, {
      frameWidth: 198,
      frameHeight: 186,
    });
    this.load.image("worm-shadow", shadowImg);
  }
  create() {
    this.add.text(20, 20, "Farm Defense Clone", { fontSize: "32px" });
    this.playerHP = 100;
    this.player = new Player(this, 150, 360);
    this.anims.create({
      key: "worm-run",
      frames: this.anims.generateFrameNumbers("worm", { start: 0, end: 12 }),
      frameRate: 13,
      repeat: 0,
    });

    this.enemy = new Enemy(this, 1000, 360);
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.enemy.moveOneBeat();
      },
    });
  }
}
