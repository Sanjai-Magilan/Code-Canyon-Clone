import Phaser from "phaser";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import WORLD_CONFIG from "../config/worldConfig";
import CHARACTERS from "../config/characterConfig";
import ENEMY_CONFIG from "../config/enemyConfig";
import BULLET_CONFIG from "../config/bulletConfig";
import wormRun from "../assets/Sprites/Enemy/run/worm_run.png";
import shadowImg from "../assets/Sprites/Enemy/worm-shadow.png";
import bg from "../assets/Sprites/BG/floor/tiledfloor.png";
// import farm from "../assets/Sprites/BG/farm/carrot.png";
import decor1 from "../assets/Sprites/BG/stons/bgdesign-animation 1-000.png";
import decor2 from "../assets/Sprites/BG/stons/bgdesign-animation 1-001.png";
import floorPatch from "../assets/Sprites/BG/floor/popfade.png";
import playerHead from "../assets/Sprites/Player/head/playerhead-default-000.png";
import playerRun from "../assets/Sprites/Player/run/player_run.png";
import playerGun from "../assets/Sprites/Guns/gun0/playergun-gun-000.png";
import gunfireSheet from "../assets/Sprites/Guns/gun-fire/gunfire_sheet copy.png";
import bullet from "../assets/Sprites/Guns/gun0/bullet.png";
import ProjectileManager from "../systems/ProjectileManager";
import PlayerShadow from "../assets/Sprites/Player/player-animation 1-000.png";

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
    this.load.image("player-shadow", PlayerShadow);
    this.load.image("bg", bg);
    // this.load.image("carrot", farm);
    this.load.image("decor1", decor1);
    this.load.image("decor2", decor2);
    this.load.image("floorPatch", floorPatch);

    this.load.spritesheet("player", playerRun, {
      frameWidth: 80,
      frameHeight: 103,
    });
    this.load.image("player-head", playerHead);
    this.load.image("player-gun", playerGun);
    this.load.image("bullet", bullet);
    this.load.spritesheet("gunfire", gunfireSheet, {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    const worldWidth = WORLD_CONFIG.width;
    const worldHeight = WORLD_CONFIG.height;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.bg = this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, "bg");
    this.bg.setDepth(-100);

    // Initialize player with a specific character configuration key (e.g. "soldier")
    this.player = new Player(this, worldWidth / 2, worldHeight / 2, "soldier");
    this.playerHP = this.player.maxHealth;

    this.cameras.main.startFollow(this.player.getSprite());
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create static physics group for the stones (obstacles)
    this.stones = this.physics.add.staticGroup();

    // Place stones along the world border edges to form a solid wall
    const borderStep = WORLD_CONFIG.stones.step;
    const stoneScale = WORLD_CONFIG.stones.scale;

    // Top border
    for (let x = borderStep / 2; x <= worldWidth - borderStep / 2; x += borderStep) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      const stone = this.stones.create(x, 24, key).setScale(stoneScale).refreshBody();
      stone.setDepth(stone.y);
    }

    // Bottom border
    for (let x = borderStep / 2; x <= worldWidth - borderStep / 2; x += borderStep) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      const stone = this.stones.create(x, worldHeight - 24, key).setScale(stoneScale).refreshBody();
      stone.setDepth(stone.y);
    }

    // Left border (avoiding duplicate corner stones)
    for (let y = borderStep + 32; y <= worldHeight - borderStep - 32; y += borderStep) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      const stone = this.stones.create(24, y, key).setScale(stoneScale).refreshBody();
      stone.setDepth(stone.y);
    }

    // Right border (avoiding duplicate corner stones)
    for (let y = borderStep + 32; y <= worldHeight - borderStep - 32; y += borderStep) {
      const key = Math.random() < 0.5 ? "decor1" : "decor2";
      const stone = this.stones.create(worldWidth - 24, y, key).setScale(stoneScale).refreshBody();
      stone.setDepth(stone.y);
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
      this,
    );

    // Initialize the ProjectileManager system to handle spawning & physics of bullets
    this.projectileManager = new ProjectileManager(this);

    const CELL_WIDTH = WORLD_CONFIG.grid.cellWidth;
    const CELL_HEIGHT = WORLD_CONFIG.grid.cellHeight;
    const rows = Math.ceil(WORLD_CONFIG.height / CELL_HEIGHT);
    const cols = Math.ceil(WORLD_CONFIG.width / CELL_WIDTH);

    // High-performance Blitter for grid tiling (reduces draw calls and removes 800 GameObjects)
    const gridBlitter = this.add.blitter(0, 0, "floorPatch");
    gridBlitter.setDepth(-90);
    gridBlitter.alpha = WORLD_CONFIG.grid.alpha;

    for (let row = 0; row < rows; row++) {
      const startCol = row % 2;
      for (let col = startCol; col < cols; col += 2) {
        gridBlitter.create(
          col * CELL_WIDTH + CELL_WIDTH / 2,
          row * CELL_HEIGHT + CELL_HEIGHT / 2
        );
      }
    }

    this.anims.create({
      key: "worm-run",
      frames: this.anims.generateFrameNumbers("worm", { start: 0, end: 12 }),
      frameRate: 13,
      repeat: -1,
    });

    this.enemies = [];

    // Spawn enemies periodically (capped at config maxActive to prevent crash/infinite growth leaks)
    this.time.addEvent({
      delay: ENEMY_CONFIG.spawn.delay,
      loop: true,
      callback: () => {
        // Option A: Active count matches array length because dead enemies are spliced out instantly
        if (this.enemies.length < ENEMY_CONFIG.spawn.maxActive) {
          const enemy = this.spawnEnemyNearPlayer();
          this.enemies.push(enemy);
        }
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
  }

  spawnEnemyNearPlayer() {
    const player = this.player.getSprite();
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // Spawn distance from config to guarantee off-screen spawning
    const distance = ENEMY_CONFIG.spawn.distance;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;

    const enemy = new Enemy(this, x, y);
    
    // Add enemy sprite to the physics group so collision handles it
    this.enemiesGroup.add(enemy.sprite);

    return enemy;
  }

  handlePlayerEnemyCollision(playerSprite, enemySprite) {
    // Deal damage to the player
    this.player.takeDamage(ENEMY_CONFIG.collisionDamage);

    // Find and destroy the enemy wrapper
    const index = this.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index !== -1) {
      const enemy = this.enemies[index];
      this.enemies.splice(index, 1);
      enemy.sprite.destroy(); // Properly destroys sprite and hooks shadow cleanup
    }
  }
}
