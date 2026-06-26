import Phaser from "phaser";
import Player from "../entities/Player";
import WaveManager from "../systems/WaveManager";
import crabRun from "../assets/Sprites/Enemy/enemy 2/encrabskin-run-sheet.png";
import crabBulletImg from "../assets/Sprites/Enemy/enemy 2/enbulletskin-0-000.png";
import anglerRun from "../assets/Sprites/Enemy/enemy 3/enangler-run-sheet.png";
import bgmAudio from "../assets/Sounds/bgm/musicBg.webm";
import shootAudio from "../assets/Sounds/guns/shoot0.webm";
import recoilAudio from "../assets/Sounds/reload/reload.webm";
import crabShootAudio from "../assets/Sounds/enemy shoot/crabShoot.webm";
import enemyDieAudio from "../assets/Sounds/enemy die/explode.webm";
import playerOofAudio from "../assets/Sounds/player/playerOof.webm";
import waveCompletedAudio from "../assets/Sounds/level completed/levelCompleted.webm";
import WORLD_CONFIG from "../config/worldConfig";
import CHARACTERS from "../config/characterConfig";
import ENEMY_CONFIG from "../config/enemyConfig";
import BULLET_CONFIG from "../config/bulletConfig";
import wormRun from "../assets/Sprites/Enemy/run/worm_run.png";
import explosionSheet from "../assets/Sprites/Enemy/explosion/explosion-sheet.png";
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
    this.load.spritesheet("crab", crabRun, {
      frameWidth: 178,
      frameHeight: 199,
    });
    this.load.spritesheet("angler", anglerRun, {
      frameWidth: 219,
      frameHeight: 230,
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
    this.load.image("crab-bullet", crabBulletImg);
    this.load.spritesheet("gunfire", gunfireSheet, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet("explosion", explosionSheet, {
      frameWidth: 512,
      frameHeight: 512,
    });
    this.load.audio("bgm", bgmAudio);
    this.load.audio("shoot", shootAudio);
    this.load.audio("recoil", recoilAudio);
    this.load.audio("crab-shoot", crabShootAudio);
    this.load.audio("enemy-die", enemyDieAudio);
    this.load.audio("player-oof", playerOofAudio);
    this.load.audio("wave-completed", waveCompletedAudio);
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

    // Initialize the WaveManager system to handle wave configurations and timer scaling
    this.waveManager = new WaveManager(this);
    this.currentWaveId = this.waveManager.getCurrentWaveConfig().id;

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

    this.anims.create({
      key: "crab-run",
      frames: this.anims.generateFrameNumbers("crab", { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "angler-run",
      frames: this.anims.generateFrameNumbers("angler", { start: 0, end: 14 }),
      frameRate: 12,
      repeat: -1,
    });

    this.enemies = [];

    // Spawn an initial burst of exactly 6 enemies at startup
    for (let i = 0; i < 6; i++) {
      const enemy = this.spawnEnemyNearPlayer();
      this.enemies.push(enemy);
    }

    // Spawn enemies periodically (capped at wave limit to prevent crash/infinite growth leaks)
    this.spawnTimerEvent = this.time.addEvent({
      delay: this.waveManager.getSpawnInterval(),
      loop: true,
      callback: () => {
        try {
          // Limit active count dynamically based on the current wave configuration
          const maxActive = this.waveManager.getMaxEnemies();
          if (this.enemies.length < maxActive) {
            const enemy = this.spawnEnemyNearPlayer();
            this.enemies.push(enemy);
          }
        } catch (err) {
          console.error("CRITICAL SPANNING ERROR:", err);
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

    if (!this.anims.exists("enemy-explosion")) {
      this.anims.create({
        key: "enemy-explosion",
        frames: this.anims.generateFrameNumbers("explosion", {
          start: 0,
          end: 6,
        }),
        frameRate: 16,
        repeat: 0,
      });
    }

    // Play background music (looped, volume at 0.5)
    this.bgm = this.sound.add("bgm", {
      loop: true,
      volume: 0.5,
    });
    this.bgm.play();

    this.input.on("pointerdown", () => {
      this.player.shoot();
    });
  }

  update() {
    try {
      this.player.update(this.cursors);

      // Dynamically adjust spawn delay based on current wave configuration
      if (this.spawnTimerEvent) {
        this.spawnTimerEvent.delay = this.waveManager.getSpawnInterval();
      }

      // Check if a wave has completed (transitioned to a new wave ID)
      const activeWaveConfig = this.waveManager.getCurrentWaveConfig();
      if (activeWaveConfig && activeWaveConfig.id !== this.currentWaveId) {
        this.sound.play("wave-completed", { volume: 0.5 });
        this.currentWaveId = activeWaveConfig.id;
      }

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
    } catch (err) {
      console.error("CRITICAL RUNTIME ERROR IN UPDATE:", err);
      if (!this.errorText) {
        this.errorText = this.add.text(50, 50, "CRITICAL ERROR: " + err.message, {
          fontSize: "24px",
          color: "#ff0000",
          backgroundColor: "#000000",
          padding: { x: 10, y: 10 }
        });
        this.errorText.setScrollFactor(0);
        this.errorText.setDepth(99999);
      }
      this.physics.pause();
    }
  }

  spawnEnemyNearPlayer() {
    const player = this.player.getSprite();
    const distance = ENEMY_CONFIG.spawn.distance;
    const margin = ENEMY_CONFIG.spawn.margin;
    const maxAttempts = ENEMY_CONFIG.spawn.maxAttempts;
    const worldWidth = WORLD_CONFIG.width;
    const worldHeight = WORLD_CONFIG.height;
    const camera = this.cameras.main;

    let x = 0;
    let y = 0;
    let validSpawn = false;

    // Try up to maxAttempts random angles to find a spawn point within boundaries and outside viewport
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      x = player.x + Math.cos(angle) * distance;
      y = player.y + Math.sin(angle) * distance;

      const outsideScreen = !camera.worldView.contains(x, y);

      if (
        x >= margin &&
        x <= worldWidth - margin &&
        y >= margin &&
        y <= worldHeight - margin &&
        outsideScreen
      ) {
        validSpawn = true;
        break;
      }
    }

    // Fallback: If no valid spawn point was found within maxAttempts
    if (!validSpawn) {
      // 1. Clamp to world boundaries with margin
      x = Phaser.Math.Clamp(x, margin, worldWidth - margin);
      y = Phaser.Math.Clamp(y, margin, worldHeight - margin);

      // 2. Ensure clamped position is outside the viewport
      if (camera.worldView.contains(x, y)) {
        // 3. Move spawn point to the nearest valid edge just outside the camera
        const camLeft = camera.worldView.x;
        const camRight = camera.worldView.right;
        const camTop = camera.worldView.y;
        const camBottom = camera.worldView.bottom;
        const padding = 60; // Padding to ensure sprite spawns completely off-screen
        const candidates = [];

        // Left Candidate
        const candidateLeftX = camLeft - padding;
        if (candidateLeftX >= margin && candidateLeftX <= worldWidth - margin) {
          candidates.push({ x: candidateLeftX, y: y, dist: Math.abs(x - candidateLeftX) });
        }

        // Right Candidate
        const candidateRightX = camRight + padding;
        if (candidateRightX >= margin && candidateRightX <= worldWidth - margin) {
          candidates.push({ x: candidateRightX, y: y, dist: Math.abs(x - candidateRightX) });
        }

        // Top Candidate
        const candidateTopY = camTop - padding;
        if (candidateTopY >= margin && candidateTopY <= worldHeight - margin) {
          candidates.push({ x: x, y: candidateTopY, dist: Math.abs(y - candidateTopY) });
        }

        // Bottom Candidate
        const candidateBottomY = camBottom + padding;
        if (candidateBottomY >= margin && candidateBottomY <= worldHeight - margin) {
          candidates.push({ x: x, y: candidateBottomY, dist: Math.abs(y - candidateBottomY) });
        }

        // Select the closest valid candidate to minimize position snap
        if (candidates.length > 0) {
          candidates.sort((a, b) => a.dist - b.dist);
          x = candidates[0].x;
          y = candidates[0].y;
        }
      }
    }

    const EnemyClass = this.waveManager.getNextEnemyClass();
    const enemy = new EnemyClass(this, x, y);
    
    // Add enemy sprite to the physics group so collision handles it
    this.enemiesGroup.add(enemy.sprite);

    return enemy;
  }

  spawnEnemyExplosion(x, y) {
    const explosion = this.add.sprite(x, y, "explosion");
    explosion.setScale(0.5);
    explosion.setDepth(y + 10);
    explosion.play("enemy-explosion");

    // Play enemy death sound effect
    this.sound.play("enemy-die", { volume: 0.35 });

    explosion.once("animationcomplete", () => {
      explosion.destroy();
    });
  }

  handlePlayerEnemyCollision(playerSprite, enemySprite) {
    // Deal damage to the player
    this.player.takeDamage(ENEMY_CONFIG.collisionDamage);

    // Find and destroy the enemy wrapper
    const index = this.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index !== -1) {
      const enemy = this.enemies[index];
      this.enemies.splice(index, 1);
      
      this.spawnEnemyExplosion(enemySprite.x, enemySprite.y);
      enemy.sprite.destroy(); // Properly destroys sprite and hooks shadow cleanup
    }
  }
}
