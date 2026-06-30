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
import monsterDeathAudio from "../assets/Sounds/enemy die/monsterDeath.webm";
import playerOofAudio from "../assets/Sounds/player/playerOof.webm";
import waveCompletedAudio from "../assets/Sounds/level completed/levelCompleted.webm";
import CAMERA_CONFIG from "../config/cameraConfig";
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
import WeaponDropManager from "../systems/WeaponDropManager";

import gunDrop1 from "../assets/Sprites/Guns/guns drop/gun-001.png";
import gunDrop2 from "../assets/Sprites/Guns/guns drop/gun-002.png";
import gunDrop3 from "../assets/Sprites/Guns/guns drop/gun-003.png";
import gunDrop4 from "../assets/Sprites/Guns/guns drop/gun-004.png";
import gunDrop5 from "../assets/Sprites/Guns/guns drop/gun-005.png";

import gunSkin1 from "../assets/Sprites/Guns/player gun/playergun-gun-001.png";
import gunSkin2 from "../assets/Sprites/Guns/player gun/playergun-gun-002.png";
import gunSkin3 from "../assets/Sprites/Guns/player gun/playergun-gun-003.png";
import gunSkin4 from "../assets/Sprites/Guns/player gun/playergun-gun-004.png";
import gunSkin5 from "../assets/Sprites/Guns/player gun/playergun-gun-005.png";

import powerUpAudio from "../assets/Sounds/powerUp.webm";
import healthImage from "../assets/Sprites/health/health-000.png";
import HealthPickup from "../entities/HealthPickup";
import shieldItemImg from "../assets/Sprites/sheld/itemskin-shield-000.png";
import shieldSpriteImg from "../assets/Sprites/sheld/shield-animation 1-000.png";
import ShieldPickup from "../entities/ShieldPickup";
import playButton from "../assets/Sprites/playButton/btnstart-play-000.png";
import slotFrameImg from "../assets/Sprites/powerup holder/slotframe-animation 1-000.png";
import lightningIconImg from "../assets/Sprites/lightining power/itemskin-basehp-000.png";
import beamImg from "../assets/Sprites/lightining power/beam_ends_spritesheet.png";

import bulletSkin1 from "../assets/Sprites/Guns/bullet/bulletskin-0-001.png";
import bulletSkin2 from "../assets/Sprites/Guns/bullet/bulletskin-0-002.png";
import bulletSkin3 from "../assets/Sprites/Guns/bullet/bulletskin-0-003.png";
import bulletSkin4 from "../assets/Sprites/Guns/bullet/bulletskin-0-004.png";
import bulletSkin5 from "../assets/Sprites/Guns/bullet/bulletskin-0-005.png";
import healthBarImg from "../assets/Sprites/health/barholder-animation 1-001.png";
import hudFontImg from "../assets/Sprites/font/fonth.png";

const POWERUP_ICON_SCALE = {
  "shield-item": 0.75,
  "defaultGun": 0.32,
};

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
    this.load.audio("monster-death", monsterDeathAudio);
    this.load.audio("player-oof", playerOofAudio);
    this.load.audio("wave-completed", waveCompletedAudio);

    // Preload weapon drops and skins
    this.load.image("drop_gun1", gunDrop1);
    this.load.image("drop_gun2", gunDrop2);
    this.load.image("drop_gun3", gunDrop3);
    this.load.image("drop_gun4", gunDrop4);
    this.load.image("drop_gun5", gunDrop5);

    this.load.image("skin_gun1", gunSkin1);
    this.load.image("skin_gun2", gunSkin2);
    this.load.image("skin_gun3", gunSkin3);
    this.load.image("skin_gun4", gunSkin4);
    this.load.image("skin_gun5", gunSkin5);

    // Preload custom bullet skins
    this.load.image("bullet_gun1", bulletSkin1);
    this.load.image("bullet_gun2", bulletSkin2);
    this.load.image("bullet_gun3", bulletSkin3);
    this.load.image("bullet_gun4", bulletSkin4);
    this.load.image("bullet_gun5", bulletSkin5);

    this.load.image("health", healthImage);
    this.load.image("shield-item", shieldItemImg);
    this.load.image("shield-sprite", shieldSpriteImg);
    this.load.image("play-button", playButton);
    this.load.image("slot-frame", slotFrameImg);
    this.load.image("health-bar-holder", healthBarImg);
    this.load.spritesheet("hud-font", hudFontImg, {
      frameWidth: 165,
      frameHeight: 157
    });
    this.load.image("lightning-icon", lightningIconImg);
    this.load.spritesheet("lightning-beam", beamImg, {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.audio("power-up", powerUpAudio);
  }

  create() {
    console.log("Scene create");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      console.log("Scene destroy");
    }, this);

    const worldWidth = WORLD_CONFIG.width;
    const worldHeight = WORLD_CONFIG.height;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.bg = this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, "bg");
    this.bg.setDepth(-100);

    // Initialize player with a specific character configuration key (e.g. "soldier")
    this.player = new Player(this, worldWidth / 2, worldHeight / 2, "soldier");
    this.playerHP = this.player.maxHealth;

    // Setup camera follow with lerping/smoothing and deadzone configurations
    this.cameras.main.startFollow(
      this.player.getSprite(),
      true, // Round pixels to prevent sub-pixel rendering jitter
      CAMERA_CONFIG.lerpX,
      CAMERA_CONFIG.lerpY
    );

    if (CAMERA_CONFIG.deadzoneWidth > 0 && CAMERA_CONFIG.deadzoneHeight > 0) {
      this.cameras.main.setDeadzone(CAMERA_CONFIG.deadzoneWidth, CAMERA_CONFIG.deadzoneHeight);
    }
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
    this.currentWaveId = 1;

    // Initialize health pickups group
    this.healthPickups = this.physics.add.group();

    // Setup overlap detection for health pickups collection
    this.physics.add.overlap(
      this.player.getSprite(),
      this.healthPickups,
      this.collectHealth,
      null,
      this
    );

    // Initialize shield pickups group
    this.shieldPickups = this.physics.add.group();

    // Setup overlap detection for shield pickups collection
    this.physics.add.overlap(
      this.player.getSprite(),
      this.shieldPickups,
      this.collectShield,
      null,
      this
    );

    // Initialize the WeaponDropManager system to handle ground pickups
    this.weaponDropManager = new WeaponDropManager(this);

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
    this.spawnTimerEvent = null;

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

    if (!this.anims.exists("lightning-strike")) {
      this.anims.create({
        key: "lightning-strike",
        frames: this.anims.generateFrameNumbers("lightning-beam", { start: 0, end: 2 }),
        frameRate: 12,
        repeat: 0
      });
    }

    // Play background music (looped, volume at 0.5)
    this.bgm = this.sound.add("bgm", {
      loop: true,
      volume: 0.5,
    });
    this.bgm.play();

    // Create HUD Health Bar Holder
    this.healthBarHolder = this.add.image(20, 20, "health-bar-holder");
    this.healthBarHolder.setOrigin(0, 0);
    this.healthBarHolder.setScrollFactor(0);
    this.healthBarHolder.setDepth(100000);

    // Create Power-Up Holder UI Slots
    const frameX = this.cameras.main.width - 80;
    const weaponFrameY = 80;
    const shieldFrameY = 210;

    // Weapon Slot
    this.weaponSlotFrame = this.add.image(frameX, weaponFrameY, "slot-frame");
    this.weaponSlotFrame.setScrollFactor(0);
    this.weaponSlotFrame.setDepth(100000);
    this.weaponSlotFrame.setScale(0.85);

    this.weaponPowerupIcon = this.add.image(frameX, weaponFrameY, "__DEFAULT");
    this.weaponPowerupIcon.setScrollFactor(0);
    this.weaponPowerupIcon.setDepth(100001);
    this.weaponPowerupIcon.setVisible(false);

    // Shield Slot
    this.shieldSlotFrame = this.add.image(frameX, shieldFrameY, "slot-frame");
    this.shieldSlotFrame.setScrollFactor(0);
    this.shieldSlotFrame.setDepth(100000);
    this.shieldSlotFrame.setScale(0.85);

    this.shieldPowerupIcon = this.add.image(frameX, shieldFrameY, "__DEFAULT");
    this.shieldPowerupIcon.setScrollFactor(0);
    this.shieldPowerupIcon.setDepth(100001);
    this.shieldPowerupIcon.setVisible(false);

    // Centered Heart count digit sprite inside the health bar slot
    this.heartCountSprite = this.add.sprite(196, 90, "hud-font");
    this.heartCountSprite.setFrame(57); // '5'
    this.heartCountSprite.setScale(0.3);
    this.heartCountSprite.setScrollFactor(0);
    this.heartCountSprite.setDepth(100001);

    this.updateHearts();

    // Lightning Power Initialization
    this.lightningKills = [];
    this.lightningReady = false;
    this.lightningPulseTween = null;

    this.lightningIcon = this.add.image(360, 80, "lightning-icon");
    this.lightningIcon.setScrollFactor(0);
    this.lightningIcon.setDepth(100000);
    this.lightningIcon.setScale(0.85);
    this.lightningIcon.setTint(0x777777);
    this.lightningIcon.setAlpha(0.35);

    // Mouse click activation
    this.lightningIcon.setInteractive({ useHandCursor: true });
    this.lightningIcon.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }
      this.triggerLightningAttack();
    });

    // Keyboard activation (Q key)
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    this.input.on("pointerdown", (pointer, currentlyOver) => {
      if (!this.gameStarted) return;
      if (currentlyOver && currentlyOver.length > 0) {
        if (currentlyOver.includes(this.lightningIcon)) {
          return;
        }
      }
      this.player.shoot();
    });

    // Start Screen / Play Button initialization
    this.gameStarted = false;
    const camera = this.cameras.main;
    const button = this.add.image(camera.centerX, camera.centerY, "play-button");
    button.setScale(0.5); 
    button.setScrollFactor(0);
    button.setDepth(200000);
    button.setInteractive({ useHandCursor: true });

    button.on("pointerover", () => {
      button.setScale(0.55);
    });
    button.on("pointerout", () => {
      button.setScale(0.5);
    });
    button.on("pointerdown", () => {
      button.setScale(0.55);
    });
    button.on("pointerup", () => {
      this.startGame();
    });

    this.playButton = button;
  }

  update() {
    if (!this.gameStarted) {
      return;
    }
    if (!this.player || this.player.isDead) return;
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
        this.showWavePopup(activeWaveConfig.id);
      }

      const playerSprite = this.player.getSprite();

      // Camera Look-Ahead System based on player body velocity
      if (playerSprite && playerSprite.body) {
        const playerVelX = playerSprite.body.velocity.x;
        const playerVelY = playerSprite.body.velocity.y;
        const playerSpeed = this.player.speed || 240;

        // Calculate target offset (inverted because followOffset shifts view opposite to focus)
        const targetOffsetX = -(playerVelX / playerSpeed) * CAMERA_CONFIG.lookAheadDistance;
        const targetOffsetY = -(playerVelY / playerSpeed) * CAMERA_CONFIG.lookAheadDistance;

        // Smoothly interpolate the camera's followOffset towards the target offset
        this.cameras.main.followOffset.x = Phaser.Math.Linear(
          this.cameras.main.followOffset.x,
          targetOffsetX,
          CAMERA_CONFIG.lookAheadSmoothness
        );
        this.cameras.main.followOffset.y = Phaser.Math.Linear(
          this.cameras.main.followOffset.y,
          targetOffsetY,
          CAMERA_CONFIG.lookAheadSmoothness
        );
      }

      // Update enemy AI behaviors (pathfinding/velocity update)
      for (const enemy of this.enemies) {
        if (!enemy.isFrozen) {
          enemy.update(playerSprite);
        }
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
    this.sound.play("enemy-die", { volume: 0.45 });
    this.sound.play("monster-death", { volume: 0.35 });

    explosion.once("animationcomplete", () => {
      explosion.destroy();
    });
  }

  handlePlayerEnemyCollision(playerSprite, enemySprite) {
    // Deal damage to the player, passing the enemy sprite as the source
    this.player.takeDamage(ENEMY_CONFIG.collisionDamage, enemySprite);

    // Find and destroy the enemy wrapper via its unified die method
    const index = this.enemies.findIndex((e) => e.sprite === enemySprite);
    if (index !== -1) {
      const enemy = this.enemies[index];
      enemy.die();
    }
  }

  /**
   * Redraws the HUD health bar heart count digit.
   */
  updateHearts() {
    console.trace("updateHearts called");
    if (!this.player || !this.heartCountSprite) return;

    // Synchronize playerHP with the single source of truth player.health
    this.playerHP = this.player.health;

    // Log the current state comparison
    console.log(
      "Health:",
      this.player.health,
      "PlayerHP:",
      this.playerHP
    );

    const currentHearts = this.player.health !== undefined ? this.player.health : 5;
    const clampedHearts = Phaser.Math.Clamp(Math.floor(currentHearts), 0, 9);

    this.heartCountSprite.setFrame(52 + clampedHearts);
  }

  /**
   * Spawns a floating retro font pop-up overlay announcing a new wave.
   * @param {number} waveNumber The new wave ID
   */
  showWavePopup(waveNumber) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const popupSprites = [];
    const chars = [
      { frame: 22, offsetX: -120 }, // W
      { frame: 0,  offsetX: -65  }, // A
      { frame: 21, offsetX: -15  }, // V
      { frame: 4,  offsetX: 35   }, // E
      { frame: 52 + waveNumber, offsetX: 110 } // Digit character
    ];

    chars.forEach(char => {
      const sprite = this.add.sprite(centerX + char.offsetX, centerY, "hud-font");
      sprite.setFrame(char.frame);
      sprite.setScale(0.1);
      sprite.setScrollFactor(0);
      sprite.setDepth(200000); // Float above EVERYTHING
      sprite.setAlpha(0);
      popupSprites.push(sprite);
    });

    this.tweens.add({
      targets: popupSprites,
      alpha: 1,
      scale: 0.5,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: popupSprites,
            alpha: 0,
            y: centerY - 50,
            duration: 400,
            ease: "Power2.easeIn",
            onComplete: () => {
              popupSprites.forEach(s => s.destroy());
            }
          });
        });
      }
    });
  }

  /**
   * Spawns a health heart pickup on the ground.
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   */
  spawnHealthPickup(x, y) {
    const pickup = new HealthPickup(this, x, y);
    this.healthPickups.add(pickup);
  }

  /**
   * Callback when player overlaps with a health heart pickup.
   */
  collectHealth(playerSprite, heart) {
    const playerObj = this.player;

    if (playerObj.health < playerObj.maxHealth) {
      playerObj.heal(1);

      if (this.sound) {
        this.sound.play("power-up", { volume: 0.5 });
      }

      heart.destroy();
    }
  }

  /**
   * Spawns a shield pickup on the ground.
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   */
  spawnShieldPickup(x, y) {
    const pickup = new ShieldPickup(this, x, y);
    this.shieldPickups.add(pickup);
  }

  /**
   * Callback when player overlaps with a shield pickup.
   */
  collectShield(playerSprite, shieldPickup) {
    if (this.player) {
      this.player.equipShield();
      this.showShieldPowerup({
        iconKey: "shield-item",
        duration: 3,
        type: "shield"
      });
      shieldPickup.destroy();
    }
  }

  /**
   * Starts the gameplay session, wave manager, spawner, and shows the wave popup.
   */
  startGame() {
    this.gameStarted = true;

    if (this.playButton) {
      this.playButton.destroy();
      this.playButton = null;
    }

    this.waveManager.start();
    this.startEnemySpawner();

    this.currentWaveId = this.waveManager.getCurrentWaveConfig().id;
    this.showWavePopup(this.currentWaveId);
  }

  /**
   * Starts periodic enemy spawning and initial burst.
   */
  startEnemySpawner() {
    this.enemies = [];

    // Spawn an initial burst of exactly 6 enemies at startup
    for (let i = 0; i < 6; i++) {
      const enemy = this.spawnEnemyNearPlayer();
      this.enemies.push(enemy);
    }

    // Spawn enemies periodically (capped at wave limit to prevent leaks)
    this.spawnTimerEvent = this.time.addEvent({
      delay: this.waveManager.getSpawnInterval(),
      loop: true,
      callback: () => {
        try {
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
  }

  /**
   * Configures and displays an active temporary weapon icon inside the weapon slot.
   */
  showWeaponPowerup(config) {
    this.clearWeaponPowerup();

    this.weaponPowerup = {
      iconKey: config.iconKey,
      type: config.type,
      duration: config.duration,
      remaining: config.duration
    };

    if (this.weaponPowerupIcon) {
      this.weaponPowerupIcon.setTexture(config.iconKey);
      this.weaponPowerupIcon.setVisible(true);
      this.weaponPowerupIcon.setAlpha(1.0);
      this.weaponPowerupIcon.setScale(this.getPowerupIconScale(config.iconKey));
    }

    if (config.type === "time") {
      const durationMs = config.duration * 1000;
      const warningDelay = Math.max(0, durationMs - 5000);

      this.weaponBlinkTimer = this.time.delayedCall(warningDelay, () => {
        this.startWeaponBlinking();
      }, [], this);

      this.weaponExpireTimer = this.time.delayedCall(durationMs, () => {
        this.clearWeaponPowerup();
      }, [], this);
    } else {
      this.updateWeaponPowerupUI();
    }
  }

  /**
   * Triggers the weapon slot warning blink animation.
   */
  startWeaponBlinking() {
    if (!this.weaponPowerupIcon || this.weaponBlinkTween) return;

    this.weaponBlinkTween = this.tweens.add({
      targets: this.weaponPowerupIcon,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 150
    });
  }

  /**
   * Alias for startWeaponBlinking.
   */
  startWeaponBlink() {
    this.startWeaponBlinking();
  }

  /**
   * Resets active weapon power-up state.
   */
  clearWeaponPowerup() {
    this.weaponPowerup = null;

    if (this.weaponPowerupIcon) {
      this.weaponPowerupIcon.setVisible(false);
      this.weaponPowerupIcon.setAlpha(1.0);
    }

    if (this.weaponBlinkTween) {
      this.weaponBlinkTween.remove();
      this.weaponBlinkTween = null;
    }

    if (this.weaponBlinkTimer) {
      this.weaponBlinkTimer.remove();
      this.weaponBlinkTimer = null;
    }

    if (this.weaponExpireTimer) {
      this.weaponExpireTimer.remove();
      this.weaponExpireTimer = null;
    }
  }

  /**
   * Updates weapon shot count.
   */
  updateWeaponPowerupUI() {
    if (!this.weaponPowerup) return;

    if (this.weaponPowerup.type === "shots") {
      const remainingShots = this.player.tempWeaponMaxShots - this.player.tempWeaponShotsFired;
      this.weaponPowerup.remaining = remainingShots;

      if (remainingShots <= 0) {
        this.clearWeaponPowerup();
      } else if (remainingShots === 1) {
        this.startWeaponBlinking();
      }
    }
  }

  /**
   * Configures and displays active shield icon inside the shield slot.
   */
  showShieldPowerup(config) {
    this.clearShieldPowerup();

    this.shieldPowerup = {
      iconKey: config.iconKey,
      type: config.type,
      duration: config.duration,
      remaining: config.duration
    };

    if (this.shieldPowerupIcon) {
      this.shieldPowerupIcon.setTexture(config.iconKey);
      this.shieldPowerupIcon.setVisible(true);
      this.shieldPowerupIcon.setAlpha(1.0);
      this.shieldPowerupIcon.setScale(this.getPowerupIconScale(config.iconKey));
    }

    this.updateShieldPowerupUI();
  }

  /**
   * Resolves the configured scaling factor for a power-up icon.
   * @param {string} iconKey The asset texture key
   * @returns {number} The scale value
   */
  getPowerupIconScale(iconKey) {
    if (POWERUP_ICON_SCALE[iconKey] !== undefined) {
      return POWERUP_ICON_SCALE[iconKey];
    }
    // If it is a gun texture key, default to defaultGun scale
    if (iconKey && iconKey.startsWith("drop_")) {
      return POWERUP_ICON_SCALE.defaultGun;
    }
    // Standard default scale for any other power-up
    return 0.75;
  }

  /**
   * Triggers the shield slot warning blink animation.
   */
  startShieldBlinking() {
    if (!this.shieldPowerupIcon || this.shieldBlinkTween) return;

    this.shieldBlinkTween = this.tweens.add({
      targets: this.shieldPowerupIcon,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 150
    });
  }

  /**
   * Alias for startShieldBlinking.
   */
  startShieldBlink() {
    this.startShieldBlinking();
  }

  /**
   * Resets active shield power-up state.
   */
  clearShieldPowerup() {
    this.shieldPowerup = null;

    if (this.shieldPowerupIcon) {
      this.shieldPowerupIcon.setVisible(false);
      this.shieldPowerupIcon.setAlpha(1.0);
    }

    if (this.shieldBlinkTween) {
      this.shieldBlinkTween.remove();
      this.shieldBlinkTween = null;
    }

    if (this.shieldBlinkTimer) {
      this.shieldBlinkTimer.remove();
      this.shieldBlinkTimer = null;
    }

    if (this.shieldExpireTimer) {
      this.shieldExpireTimer.remove();
      this.shieldExpireTimer = null;
    }
  }

  /**
   * Updates shield durability.
   */
  updateShieldPowerupUI() {
    if (!this.shieldPowerup) return;

    if (this.shieldPowerup.type === "shield") {
      const remainingShield = this.player.shieldHitsRemaining;
      this.shieldPowerup.remaining = remainingShield;

      if (remainingShield <= 0) {
        this.clearShieldPowerup();
      } else if (remainingShield === 1) {
        this.startShieldBlinking();
      }
    }
  }

  /**
   * Tracks enemy kills to charge the lightning power-up.
   */
  onEnemyKilled() {
    const now = this.time.now;
    this.lightningKills.push(now);

    // Keep only kills from last 4 seconds
    this.lightningKills = this.lightningKills.filter(t => now - t <= 4000);

    if (this.lightningKills.length >= 5 && !this.lightningReady) {
      this.chargeLightning();
    }
  }

  /**
   * Lights up the HUD icon and starts the pulse tween.
   */
  chargeLightning() {
    this.lightningReady = true;

    if (this.lightningIcon) {
      this.lightningIcon.clearTint();
      this.lightningIcon.setAlpha(1.0);

      if (this.lightningPulseTween) {
        this.lightningPulseTween.remove();
      }
      this.lightningPulseTween = this.tweens.add({
        targets: this.lightningIcon,
        scale: 1.05,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    }
  }

  /**
   * Triggers lightning strikes simultaneously on all visible enemies.
   */
  triggerLightningAttack() {
    if (!this.lightningReady || !this.player || this.player.isDead) return;

    // Get camera viewport boundary
    const view = this.cameras.main.worldView;

    // Find all enemies on screen
    const visibleEnemies = this.enemies.filter(enemy => 
      enemy && enemy.sprite && enemy.sprite.active &&
      view.contains(enemy.sprite.x, enemy.sprite.y)
    );

    if (visibleEnemies.length > 0) {
      // Play deep power sound
      this.sound.play("shoot", { volume: 0.8, pitch: 0.5 });

      visibleEnemies.forEach(enemy => {
        // Create lightning beam sprite at enemy's position
        const beam = this.add.sprite(enemy.sprite.x, enemy.sprite.y - 50, "lightning-beam");
        beam.setScale(1.5);
        beam.setDepth(enemy.sprite.depth + 10);
        beam.play("lightning-strike");

        // Freeze velocity
        enemy.isFrozen = true;
        if (enemy.sprite.body) {
          enemy.sprite.setVelocity(0, 0);
        }

        beam.once("animationcomplete", () => {
          beam.destroy();
          // Kill the enemy and trigger normal drops / XP
          if (enemy && typeof enemy.die === "function") {
            enemy.die();
          }
        });
      });
    }

    this.resetLightningPower();
  }

  /**
   * Resets active lightning state.
   */
  resetLightningPower() {
    this.lightningReady = false;
    this.lightningKills = [];

    if (this.lightningIcon) {
      this.lightningIcon.setTint(0x777777);
      this.lightningIcon.setAlpha(0.35);
      this.lightningIcon.setScale(0.85);
    }

    if (this.lightningPulseTween) {
      this.lightningPulseTween.remove();
      this.lightningPulseTween = null;
    }
  }

  /**
   * Cleans up scene resources, timers, listeners, and global sound states on shutdown/restart.
   */
  shutdown() {
    console.log("Scene shutdown");

    // Clean up active power-up states, lightning, and timers
    this.clearWeaponPowerup();
    this.clearShieldPowerup();
    this.resetLightningPower();

    if (this.lightningIcon) {
      this.lightningIcon.destroy();
      this.lightningIcon = null;
    }

    if (this.weaponSlotFrame) {
      this.weaponSlotFrame.destroy();
      this.weaponSlotFrame = null;
    }
    if (this.weaponPowerupIcon) {
      this.weaponPowerupIcon.destroy();
      this.weaponPowerupIcon = null;
    }

    if (this.shieldSlotFrame) {
      this.shieldSlotFrame.destroy();
      this.shieldSlotFrame = null;
    }
    if (this.shieldPowerupIcon) {
      this.shieldPowerupIcon.destroy();
      this.shieldPowerupIcon = null;
    }

    // Stop all active sounds to prevent duplication/leaks
    if (this.sound) {
      this.sound.stopAll();
    }

    // Clean up WaveManager state
    if (this.waveManager) {
      this.waveManager.reset();
    }

    // Clean up player
    if (this.player) {
      this.player.destroy();
    }

    // Clean up active timers
    if (this.spawnTimerEvent) {
      this.spawnTimerEvent.remove();
      this.spawnTimerEvent = null;
    }

    // Clean up health pickups group
    if (this.healthPickups && this.healthPickups.children && this.healthPickups.children.entries) {
      this.healthPickups.clear(true, true);
    }

    // Clean up shield pickups group
    if (this.shieldPickups && this.shieldPickups.children && this.shieldPickups.children.entries) {
      this.shieldPickups.clear(true, true);
    }

    // Destroy play button if active
    if (this.playButton) {
      this.playButton.destroy();
      this.playButton = null;
    }

    // Remove input listeners
    this.input.off("pointerdown");
  }
}
