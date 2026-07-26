import Phaser from "phaser";
import bg from "../assets/Sprites/BG/floor/tiledfloor.png";
import powerUpAudio from "../assets/Sounds/powerUp.webm";
import hudFontImg from "../assets/Sprites/font/fonth.png";
import HudFontHelper from "../utils/HudFontHelper";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {
    this.load.image("bg", bg);
    this.load.audio("power-up", powerUpAudio);
    this.load.spritesheet("hud-font", hudFontImg, {
      frameWidth: 165,
      frameHeight: 154
    });
  }

  create() {
    // 1. Canvas Background (1920x1080)
    this.add.image(960, 540, "bg").setOrigin(0.5).setDisplaySize(1920, 1080);

    // Dark base overlay for background contrast
    const baseOverlay = this.add.graphics();
    baseOverlay.fillStyle(0x000000, 0.45);
    baseOverlay.fillRect(0, 0, 1920, 1080);

    // 2. Retro Main Title rendered with proportional bitmap HUD font (Large, Green)
    const titleSprites = HudFontHelper.renderText(this, 960, 115, "BUG BLASTER", {
      scale: 0.55,
      tint: 0x00ff00,
      align: "center",
      letterSpacing: 14,
      depth: 100
    });

    // Floating motion for main title sprites
    this.tweens.add({
      targets: titleSprites,
      y: 105,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // 3. How To Play Panel (Semi-transparent 72% dark panel with green pixel-style border)
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
    HudFontHelper.renderText(this, 960, 255, "HOW TO PLAY", {
      scale: 0.32,
      tint: 0xffff00,
      align: "center",
      letterSpacing: 12,
      depth: 100
    });

    // 4. Controls Section (Two-Column Layout with Cyan Keycap Badges)
    const controls = [
      { label: "MOVE -", keycap: " ARROW KEYS ", y: 325 },
      { label: "DASH -" , keycap: " SPACE ", y: 370 },
      { label: "THUNDER -", keycap: " 1 ", y: 415 }
    ];

    controls.forEach(ctrl => {
      // Left Column: Control Name (White)
      HudFontHelper.renderText(this, 880, ctrl.y, ctrl.label, {
        scale: 0.22,
        tint: 0xffffff,
        align: "right",
        letterSpacing: 10,
        depth: 100
      });

      // Right Column: Keycap Badge (Cyan)
      HudFontHelper.renderText(this, 940, ctrl.y, ctrl.keycap, {
        scale: 0.22,
        tint: 0x00ffff,
        align: "left",
        letterSpacing: 10,
        depth: 100
      });
    });

    // Panel Separator Line
    const sepY = 475;
    const sepGraphics = this.add.graphics();
    sepGraphics.lineStyle(2, 0x444444, 0.8);
    sepGraphics.lineBetween(panelX + 60, sepY, panelX + panelW - 60, sepY);

    // 5. Game Instructions Section inside Panel (Bitmap HUD font)
    HudFontHelper.renderText(this, 960, 520, "TYPE THE WORD ABOVE EACH BUG TO DEFEAT IT.", {
      scale: 0.20,
      tint: 0xffffff,
      align: "center",
      letterSpacing: 8,
      depth: 100
    });

    HudFontHelper.renderText(this, 960, 575, "DEFEAT 5 ENEMIES IN A ROW TO CHARGE THUNDER.", {
      scale: 0.20,
      tint: 0xffffff,
      align: "center",
      letterSpacing: 8,
      depth: 100
    });

    // Warning Instruction (Red)
    HudFontHelper.renderText(this, 960, 640, "DONT LET THE BUGS REACH YOU", {
      scale: 0.22,
      tint: 0xff4444,
      align: "center",
      letterSpacing: 10,
      depth: 100
    });

    // 6. Bottom Start Prompt (Bitmap HUD font, Green, Pulsing Animation)
    const promptSprites = HudFontHelper.renderText(this, 960, 885, ">  PRESS ANY KEY TO START  <", {
      scale: 0.32,
      tint: 0x00ff00,
      align: "center",
      letterSpacing: 12,
      depth: 100
    });

    this.tweens.add({
      targets: promptSprites,
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
