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
import gunfireSheet from "../assets/Sprites/Guns/gun-fire/gunfire_sheet copy.png";
import bullet from "../assets/Sprites/Guns/gun0/bullet.png";
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

    this.load.spritesheet("gunfire", gunfireSheet, {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, 5000, 5000);
    this.cameras.main.setBounds(0, 0, 5000, 5000);
    this.playerHP = 100;
    this.bg = this.add.tileSprite(2500, 2500, 5000, 5000, "bg");
    this.bg.setDepth(-100);

    this.player = new Player(this, 2500, 2500);

    this.cameras.main.startFollow(this.player.getSprite());
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create static physics group for the stones (obstacles)
    this.stones = this.physics.add.staticGroup();

    // Place stones along the world border edges to form a solid wall
    // 128px step size closes the gaps completely to keep player/enemies inside bounds.
    const BORDER_STEP = 128;

    // Top border
    for (let x = 64; x <= 4936; x += BORDER_STEP) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(x, 24, key).setScale(0.5).refreshBody();
    }

    // Bottom border
    for (let x = 64; x <= 4936; x += BORDER_STEP) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(x, 4976, key).setScale(0.5).refreshBody();
    }

    // Left border (avoiding duplicate corner stones)
    for (let y = 160; y <= 4840; y += BORDER_STEP) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(24, y, key).setScale(0.5).refreshBody();
    }

    // Right border (avoiding duplicate corner stones)
    for (let y = 160; y <= 4840; y += BORDER_STEP) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      this.stones.create(4976, y, key).setScale(0.5).refreshBody();
    }

    // Prevent player from passing the stone walls
    this.physics.add.collider(this.player.getSprite(), this.stones);

    // Physics group for enemy collision and physics handling
    this.enemiesGroup = this.physics.add.group();
    
    // Prevent enemies from passing the stone walls
    this.physics.add.collider(this.enemiesGroup, this.stones);

    // Add overlap/collision between player and enemies
    this.physics.add.collider(
      this.player.getSprite(),
      this.enemiesGroup,
      this.handlePlayerEnemyCollision,
      null,
      this
    );

    this.gridContainer = this.add.container();

    const CELL_WIDTH = 128;
    const CELL_HEIGHT = 128;
    const rows = Math.ceil(5000 / CELL_HEIGHT);
    const cols = Math.ceil(5000 / CELL_WIDTH);

    // Generate grid across the entire map, centering each tile inside its grid cell
    for (let row = 0; row < rows; row++) {
      const startCol = row % 2;
      for (let col = startCol; col < cols; col += 2) {
        const tile = this.add.image(
          col * CELL_WIDTH + CELL_WIDTH / 2,
          row * CELL_HEIGHT + CELL_HEIGHT / 2,
          "floorPatch"
        );
        tile.setAlpha(0.05);
        this.gridContainer.add(tile);
      }
    }

    this.gridContainer.setPosition(0, 0);
    this.gridContainer.setDepth(-90);

    this.anims.create({
      key: "worm-run",
      frames: this.anims.generateFrameNumbers("worm", { start: 0, end: 12 }),
      frameRate: 13,
      repeat: -1,
    });

    this.enemies = [];

    // Spawn enemies periodically
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        const enemy = this.spawnEnemyNearPlayer();
        this.enemies.push(enemy);
      },
    });

    this.anims.create({
      key: "gun-fire",
      frames: this.anims.generateFrameNumbers("gunfire", {
        start: 0,
        end: 2,
      }),
      frameRate: 20,
      repeat: 0,
    });

    this.input.on("pointerdown", () => {
      this.player.shoot();
    });
  }

  update() {
    this.player.update(this.cursors);

    const playerSprite = this.player.getSprite();

    // Remove destroyed enemies to prevent array memory leaks
    this.enemies = this.enemies.filter(
      (enemy) => enemy.sprite && enemy.sprite.active
    );

    // Update enemy AI behaviors (pathfinding/velocity update)
    for (const enemy of this.enemies) {
      enemy.update(playerSprite);
    }

    // Dynamic depth sorting (Y-Sorting) for correct overlapping visuals
    playerSprite.setDepth(playerSprite.y);
    this.player.head.setDepth(playerSprite.y + 0.1);
    this.player.gun.setDepth(playerSprite.y + 0.2);
    if (this.player.flash && this.player.flash.active) {
      this.player.flash.setDepth(playerSprite.y + 0.3);
    }

    for (const enemy of this.enemies) {
      enemy.sprite.setDepth(enemy.sprite.y);
      enemy.shadow.setDepth(enemy.sprite.y - 1);
    }

    this.stones.getChildren().forEach((stone) => {
      stone.setDepth(stone.y);
    });
  }

  spawnEnemyNearPlayer() {
    const player = this.player.getSprite();
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // Spawn 1200px away to guarantee they spawn completely outside the player viewport
    const distance = 1200;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;

    const enemy = new Enemy(this, x, y);
    
    // Add enemy sprite to the physics group so collision handles it
    this.enemiesGroup.add(enemy.sprite);

    return enemy;
  }

  handlePlayerEnemyCollision(playerSprite, enemySprite) {
    // Deal damage to the player
    this.player.takeDamage(10);

    // Find and destroy the enemy wrapper
    const index = this.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index !== -1) {
      const enemy = this.enemies[index];
      this.enemies.splice(index, 1);
      enemy.sprite.destroy(); // Properly destroys sprite and hooks shadow cleanup
    }
  }
}
