import Phaser from "phaser";

import bg from "../assets/Sprites/BG/floor/tiledfloor.png";
import leftArrow from "../assets/Sprites/arrow/left-arrow.png";
import rightArrow from "../assets/Sprites/arrow/right-arrow.png";
import playButton from "../assets/Sprites/playButton/btnstart-play-000.png";
import powerUpAudio from "../assets/Sounds/powerUp.webm";

// Display heads (slideheroes c0 to c9)
import c0_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c0-000.png";
import c1_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c1-000.png";
import c2_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c2-000.png";
import c3_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c3-000.png";
import c4_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c4-000.png";
import c5_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c5-000.png";
import c6_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c6-000.png";
import c7_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c7-000.png";
import c8_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c8-000.png";
import c9_portrait from "../assets/Sprites/Player/head/display-head/images/slideheroes-c9-000.png";

// Gameplay heads (playerhead-default-000 to 009)
import c0_head from "../assets/Sprites/Player/head/playerhead-default-000.png";
import c1_head from "../assets/Sprites/Player/head/images/playerhead-default-001.png";
import c2_head from "../assets/Sprites/Player/head/images/playerhead-default-002.png";
import c3_head from "../assets/Sprites/Player/head/images/playerhead-default-003.png";
import c4_head from "../assets/Sprites/Player/head/images/playerhead-default-004.png";
import c5_head from "../assets/Sprites/Player/head/images/playerhead-default-005.png";
import c6_head from "../assets/Sprites/Player/head/images/playerhead-default-006.png";
import c7_head from "../assets/Sprites/Player/head/images/playerhead-default-007.png";
import c8_head from "../assets/Sprites/Player/head/images/playerhead-default-008.png";
import c9_head from "../assets/Sprites/Player/head/images/playerhead-default-009.png";

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");
    
    // Character definition data
    this.characters = [
      { name: "Vanguard Soldier", portraitKey: "portrait_c0", headKey: "playerhead-default-000" },
      { name: "Tactical Specialist", portraitKey: "portrait_c1", headKey: "playerhead-default-001" },
      { name: "Cyborg Recon", portraitKey: "portrait_c2", headKey: "playerhead-default-002" },
      { name: "Urban Commando", portraitKey: "portrait_c3", headKey: "playerhead-default-003" },
      { name: "Heavy Infantry", portraitKey: "portrait_c4", headKey: "playerhead-default-004" },
      { name: "Stealth Operative", portraitKey: "portrait_c5", headKey: "playerhead-default-005" },
      { name: "Biohazard Agent", portraitKey: "portrait_c6", headKey: "playerhead-default-006" },
      { name: "Cyber Hunter", portraitKey: "portrait_c7", headKey: "playerhead-default-007" },
      { name: "Dreadnought Elite", portraitKey: "portrait_c8", headKey: "playerhead-default-008" },
      { name: "Assault Raider", portraitKey: "portrait_c9", headKey: "playerhead-default-009" }
    ];
    
    this.selectedIndex = 0;
    this.isTransitioning = false;
  }

  preload() {
    // Load common layout assets
    this.load.image("bg", bg);
    this.load.image("left-arrow", leftArrow);
    this.load.image("right-arrow", rightArrow);
    this.load.image("play-button", playButton);
    this.load.audio("power-up", powerUpAudio);

    // Load display portraits
    this.load.image("portrait_c0", c0_portrait);
    this.load.image("portrait_c1", c1_portrait);
    this.load.image("portrait_c2", c2_portrait);
    this.load.image("portrait_c3", c3_portrait);
    this.load.image("portrait_c4", c4_portrait);
    this.load.image("portrait_c5", c5_portrait);
    this.load.image("portrait_c6", c6_portrait);
    this.load.image("portrait_c7", c7_portrait);
    this.load.image("portrait_c8", c8_portrait);
    this.load.image("portrait_c9", c9_portrait);

    // Load gameplay heads (shared cache)
    this.load.image("playerhead-default-000", c0_head);
    this.load.image("playerhead-default-001", c1_head);
    this.load.image("playerhead-default-002", c2_head);
    this.load.image("playerhead-default-003", c3_head);
    this.load.image("playerhead-default-004", c4_head);
    this.load.image("playerhead-default-005", c5_head);
    this.load.image("playerhead-default-006", c6_head);
    this.load.image("playerhead-default-007", c7_head);
    this.load.image("playerhead-default-008", c8_head);
    this.load.image("playerhead-default-009", c9_head);
  }

  create() {
    // 1. Add background centered and scaled to fill screen exactly
    this.add.image(960, 540, "bg").setOrigin(0.5).setDisplaySize(1920, 1080);

    // Dark overlay for improved contrast
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.45);
    overlay.fillRect(0, 0, 1920, 1080);

    // 2. Add header text
    this.add.text(960, 120, "SELECT YOUR HERO", {
      fontSize: "64px",
      fontFamily: "monospace",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(3, 3, "#000000", 4);

    // 3. Create portrait wrappers
    const initialHero = this.characters[this.selectedIndex];
    this.currentPortrait = this.add.image(960, 480, initialHero.portraitKey)
      .setOrigin(0.5)
      .setScale(1.0);

    // Secondary portrait ready for transition animations
    this.nextPortrait = this.add.image(960, 480, initialHero.portraitKey)
      .setOrigin(0.5)
      .setVisible(false);

    // 4. Navigation arrows
    const arrowY = 480;
    const leftBtn = this.add.image(660, arrowY, "left-arrow")
      .setInteractive({ useHandCursor: true })
      .setScale(0.85);

    const rightBtn = this.add.image(1260, arrowY, "right-arrow")
      .setInteractive({ useHandCursor: true })
      .setScale(0.85);

    // Hover transitions for left arrow
    leftBtn.on("pointerover", () => {
      this.tweens.add({
        targets: leftBtn,
        scale: 0.95,
        duration: 100,
        ease: "Cubic.easeOut"
      });
    });
    leftBtn.on("pointerout", () => {
      this.tweens.add({
        targets: leftBtn,
        scale: 0.85,
        duration: 100,
        ease: "Cubic.easeOut"
      });
    });
    leftBtn.on("pointerdown", () => {
      leftBtn.setScale(0.75);
      this.changeCharacter(-1);
    });
    leftBtn.on("pointerup", () => {
      leftBtn.setScale(0.95);
    });

    // Hover transitions for right arrow
    rightBtn.on("pointerover", () => {
      this.tweens.add({
        targets: rightBtn,
        scale: 0.95,
        duration: 100,
        ease: "Cubic.easeOut"
      });
    });
    rightBtn.on("pointerout", () => {
      this.tweens.add({
        targets: rightBtn,
        scale: 0.85,
        duration: 100,
        ease: "Cubic.easeOut"
      });
    });
    rightBtn.on("pointerdown", () => {
      rightBtn.setScale(0.75);
      this.changeCharacter(1);
    });
    rightBtn.on("pointerup", () => {
      rightBtn.setScale(0.95);
    });

    // 5. Character info label (placed slightly higher to leave room for the restored PLAY button)
    this.characterNameText = this.add.text(960, 740, initialHero.name.toUpperCase(), {
      fontSize: "44px",
      fontFamily: "monospace",
      color: "#00ff00",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(2, 2, "#000000", 3);

    // 6. Large PLAY button (Restored)
    const playBtn = this.add.image(960, 890, "play-button")
      .setInteractive({ useHandCursor: true })
      .setScale(0.75);

    playBtn.on("pointerover", () => {
      this.tweens.add({
        targets: playBtn,
        scale: 0.82,
        duration: 100,
        ease: "Cubic.easeOut"
      });
    });
    playBtn.on("pointerout", () => {
      this.tweens.add({
        targets: playBtn,
        scale: 0.75,
        duration: 100,
        ease: "Cubic.easeOut"
      });
    });
    playBtn.on("pointerdown", () => {
      playBtn.setScale(0.68);
    });
    playBtn.on("pointerup", () => {
      playBtn.setScale(0.82);
      this.startGame();
    });

    // 7. Keyboard events
    this.input.keyboard.on("keydown", (event) => {
      if (this.isTransitioning) return;
      switch (event.code) {
        case "ArrowLeft":
          this.changeCharacter(-1);
          break;
        case "ArrowRight":
          this.changeCharacter(1);
          break;
        case "Enter":
        case "Space":
          // Prevent browser scrolling behavior on space press
          event.preventDefault();
          this.startGame();
          break;
      }
    });
  }

  /**
   * Navigates to next/previous character with scale-pop, fade, and slide transitions.
   * @param {number} direction Navigation direction (-1 for left, 1 for right)
   */
  changeCharacter(direction) {
    console.log(`[CharacterSelectScene] Arrow click event detected, direction: ${direction}`);
    console.log(`[CharacterSelectScene] Before changeCharacter: selectedIndex=${this.selectedIndex}`);

    if (this.isTransitioning) {
      console.log(`[CharacterSelectScene] Blocked click: isTransitioning is true`);
      return;
    }
    this.isTransitioning = true;

    const prevIndex = this.selectedIndex;
    // Symmetrical wrap-around logic
    this.selectedIndex = (this.selectedIndex + direction + this.characters.length) % this.characters.length;

    const nextHero = this.characters[this.selectedIndex];
    console.log(`[CharacterSelectScene] Character selected:`, nextHero);
    console.log(`[CharacterSelectScene] Portrait texture key: ${nextHero.portraitKey}`);

    // Instantly transition character name to match target
    this.characterNameText.setText(nextHero.name.toUpperCase());

    // Configure enter portrait properties
    this.nextPortrait.setTexture(nextHero.portraitKey);
    this.nextPortrait.setAlpha(0);
    this.nextPortrait.setScale(0.5);
    // Slide in from left if moving prev (direction = -1), from right if moving next (direction = 1)
    this.nextPortrait.setPosition(960 + direction * 200, 480);
    this.nextPortrait.setVisible(true);

    // Slide and fade out current portrait
    this.tweens.add({
      targets: this.currentPortrait,
      x: 960 - direction * 200,
      alpha: 0,
      scale: 0.5,
      duration: 350,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.currentPortrait.setVisible(false);
      }
    });

    // Slide, fade in, and scale pop the next portrait
    this.tweens.add({
      targets: this.nextPortrait,
      x: 960,
      alpha: 1,
      scale: 1.0,
      duration: 400,
      ease: "Back.easeOut",
      onStart: () => {
        if (this.cache.audio.exists("power-up")) {
          this.sound.play("power-up", { volume: 0.35 });
        }
      },
      onComplete: () => {
        // Swap references
        const temp = this.currentPortrait;
        this.currentPortrait = this.nextPortrait;
        this.nextPortrait = temp;
        this.isTransitioning = false;
        console.log(`[CharacterSelectScene] After changeCharacter: selectedIndex=${this.selectedIndex}`);
      }
    });
  }

  /**
   * Transitions to GameScene passing selected character data.
   */
  startGame() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Play selection sound
    if (this.cache.audio.exists("power-up")) {
      this.sound.play("power-up", { volume: 0.5 });
    }

    // Scale pop animation on active portrait
    this.tweens.add({
      targets: this.currentPortrait,
      scale: 1.25,
      alpha: 0.8,
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        // Snappy camera fade out (300ms)
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          const selected = this.characters[this.selectedIndex];
          this.isTransitioning = false;
          this.scene.start("GameScene", { selectedHeadKey: selected.headKey });
        });
      }
    });
  }
}
