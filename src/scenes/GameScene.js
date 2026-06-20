import Phaser from "phaser";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import wormRun from "../assets/Sprites/Enemy/run/worm_run.png";
import shadowImg from "../assets/Sprites/Enemy/worm-shadow.png";
import bg from "../assets/Sprites/BG/floor/tiledfloor.png";
import farm from "../assets/Sprites/BG/farm/carrot.png";
import decor1 from "../assets/Sprites/BG/stons/bgdesign-animation 1-000.png";
import decor2 from "../assets/Sprites/BG/stons/bgdesign-animation 1-001.png";
import floorPatch from "../assets/Sprites/BG/floor/popfade.png";

import playerHead from "../assets/Sprites/Player/head/playerhead-default-000.png";
import playerRun from "../assets/Sprites/Player/run/player_run.png";
import playerGun from "../assets/Sprites/Guns/gun0/playergun-gun-000.png";

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
    this.load.image("bg", bg);
    this.load.image("carrot", farm);
    this.load.image("decor1", decor1);
    this.load.image("decor2", decor2);
    this.load.image("floorPatch", floorPatch);

    this.load.spritesheet("player", playerRun, {
      frameWidth: 80,
      frameHeight: 103,
    });
    this.load.image("player-head", playerHead);
    this.load.image("player-gun", playerGun);
  }
  create() {
    this.physics.world.setBounds(0, 0, 5000, 5000);
    this.cameras.main.setBounds(0, 0, 5000, 5000);
    this.playerHP = 100;
    this.bg = this.add.tileSprite(2500, 2500, 5000, 5000, "bg");

    this.bg.setDepth(-100);
    const border = this.add.graphics();

    border.lineStyle(20, 0xff0000);
    border.strokeRect(0, 0, 5000, 5000);
    this.player = new Player(this, 800, 600);

    this.cameras.main.startFollow(this.player.getSprite());
    this.cursors = this.input.keyboard.createCursorKeys();
    // Create a static physics group for the stones (obstacles)
    this.stones = this.physics.add.staticGroup();

    // Place stones along the world border edges (world is 5000 x 5000)
    // We scale them down to 0.4 (thin) to occupy less playing space,
    // and randomly switch between decor1 and decor2 for variety.
    
    // Top border
    for (let x = 100; x <= 4900; x += 180) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(x, 99, key).setScale(0.7).refreshBody().setDepth(5);
    }

    // Bottom border
    for (let x = 100; x <= 4900; x += 180) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(x, 4980, key).setScale(0.7).refreshBody().setDepth(5);
    }

    // Left border (avoiding duplicate corner stones)
    for (let y = 280; y <= 4720; y += 180) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(99, y, key).setScale(0.7).refreshBody().setDepth(5);
    }

    // Right border (avoiding duplicate corner stones)
    for (let y = 280; y <= 4720; y += 180) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(4900, y, key).setScale(0.7).refreshBody().setDepth(5);
    }

    // Prevent the player from crossing the stones
    this.physics.add.collider(this.player.getSprite(), this.stones);
    this.gridContainer = this.add.container();

    const CELL_WIDTH = 128;
    const CELL_HEIGHT = 128;

    for (let row = 0; row < 7; row++) {
      const startCol = row % 2;

      for (let col = startCol; col < 10; col += 2) {
        const tile = this.add.image(
          col * CELL_WIDTH,
          row * CELL_HEIGHT,
          "floorPatch",
        );

        tile.setAlpha(0.05);

        this.gridContainer.add(tile);
      }
    }

    this.gridContainer.setPosition(470, 250);

    this.gridContainer.setDepth(-90);

    // this.add.rectangle(960, 540, 1920, 1080).setStrokeStyle(10, 0xff0000);

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
  update() {
    this.player.update(this.cursors);
    window.console.log("test");
    
  }
}
