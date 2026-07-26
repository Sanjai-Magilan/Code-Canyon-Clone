import Phaser from "phaser";
import bg from "../assets/Sprites/BG/floor/tiledfloor.png";
import powerUpAudio from "../assets/Sounds/powerUp.webm";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {
    this.load.image("bg", bg);
    this.load.audio("power-up", powerUpAudio);
  }

  create() {
    // 1. Canvas Background (1920x1080)
    this.add.image(960, 540, "bg").setOrigin(0.5).setDisplaySize(1920, 1080);

    // Subtle dark base overlay for background contrast
    const baseOverlay = this.add.graphics();
    baseOverlay.fillStyle(0x000000, 0.45);
    baseOverlay.fillRect(0, 0, 1920, 1080);

    // 2. Retro Arcade Main Title (Large, Green, Gentle Floating Animation)
    const titleText = this.add.text(960, 115, "BUG BLASTER", {
      fontSize: "84px",
      fontFamily: "monospace",
      color: "#00ff00",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(5, 5, "#000000", 6);

    // Floating motion for main title
    this.tweens.add({
      targets: titleText,
      y: 105,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // 3. How To Play Panel (Semi-transparent 70% dark panel with green pixel-style border)
    const panelX = 410;
    const panelY = 210;
    const panelW = 1100;
    const panelH = 580;

    const panelGraphics = this.add.graphics();
    // Dark semi-transparent fill
    panelGraphics.fillStyle(0x000000, 0.72);
    panelGraphics.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    // Outer green border
    panelGraphics.lineStyle(4, 0x00ff00, 0.85);
    panelGraphics.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    // Inner yellow accent border
    panelGraphics.lineStyle(2, 0xffff00, 0.35);
    panelGraphics.strokeRoundedRect(panelX + 6, panelY + 6, panelW - 12, panelH - 12, 12);

    // Panel Section Heading (Medium, Yellow)
    this.add.text(960, 255, "HOW TO PLAY", {
      fontSize: "36px",
      fontFamily: "monospace",
      color: "#ffff00",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(2, 2, "#000000", 4);

    // 4. Controls Section (Two-Column Layout with Keycap Badges)
    const controlsY = 325;

    // Controls Data
    const controls = [
      { label: "Move", keycap: "[ ARROW KEYS ]", y: controlsY },
      { label: "Dash", keycap: "[ SPACE ]", y: controlsY + 45 },
      { label: "Thunder", keycap: "[ 1 ]", y: controlsY + 90 }
    ];

    controls.forEach(ctrl => {
      // Left Column: Control Name (Right-aligned to 900)
      this.add.text(900, ctrl.y, ctrl.label, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#ffffff",
        fontStyle: "bold"
      }).setOrigin(1, 0.5).setShadow(2, 2, "#000000", 3);

      // Right Column: Keycap Badge (Left-aligned at 940)
      this.add.text(940, ctrl.y, ctrl.keycap, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#00ffff",
        fontStyle: "bold"
      }).setOrigin(0, 0.5).setShadow(2, 2, "#000000", 3);
    });

    // Panel Separator Line
    const sepY = 485;
    const sepGraphics = this.add.graphics();
    sepGraphics.lineStyle(2, 0x444444, 0.8);
    sepGraphics.lineBetween(panelX + 60, sepY, panelX + panelW - 60, sepY);

    // 5. Game Instructions Section inside Panel
    this.add.text(960, 525, "Type the word above each bug to defeat it.", {
      fontSize: "24px",
      fontFamily: "monospace",
      color: "#ffffff"
    }).setOrigin(0.5).setShadow(2, 2, "#000000", 3);

    this.add.text(960, 580, "Defeat 5 enemies in a row to charge Thunder.", {
      fontSize: "24px",
      fontFamily: "monospace",
      color: "#ffffff"
    }).setOrigin(0.5).setShadow(2, 2, "#000000", 3);

    // Warning Instruction (Red)
    this.add.text(960, 645, "Don't let the bugs reach you!", {
      fontSize: "26px",
      fontFamily: "monospace",
      color: "#ff4444",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(2, 2, "#000000", 4);

    // 6. Bottom Start Prompt (Visually Prominent, Pulsing Animation)
    const promptText = this.add.text(960, 885, "►  PRESS ANY KEY TO START  ◄", {
      fontSize: "40px",
      fontFamily: "monospace",
      color: "#00ff00",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(4, 4, "#000000", 5);

    this.tweens.add({
      targets: promptText,
      alpha: 0.15,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // 7. Scene Transition Helper
    const transitionToSelect = () => {
      if (this.cache.audio.exists("power-up")) {
        this.sound.play("power-up", { volume: 0.4 });
      }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("CharacterSelectScene");
      });
    };

    // Transition on click/touch or ANY keypress
    this.input.once("pointerdown", transitionToSelect);
    this.input.keyboard.once("keydown", transitionToSelect);
  }
}
