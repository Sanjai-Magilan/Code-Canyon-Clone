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
    // 1. Add background scaled to fill screen exactly
    this.add.image(960, 540, "bg").setOrigin(0.5).setDisplaySize(1920, 1080);

    // Dark overlay for improved contrast
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, 1920, 1080);

    // 2. Game Title
    this.add.text(960, 400, "BUG HUNTER", {
      fontSize: "96px",
      fontFamily: "monospace",
      color: "#00ff00",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(4, 4, "#000000", 5);

    // 3. Click to start prompt
    const promptText = this.add.text(960, 650, "CLICK ANYWHERE TO START", {
      fontSize: "36px",
      fontFamily: "monospace",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setShadow(2, 2, "#000000", 3);

    // Pulsing alpha tween for a premium visual feel
    this.tweens.add({
      targets: promptText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Transition helper function
    const transitionToSelect = () => {
      if (this.cache.audio.exists("power-up")) {
        this.sound.play("power-up", { volume: 0.4 });
      }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("CharacterSelectScene");
      });
    };

    // Transition on click/touch
    this.input.once("pointerdown", transitionToSelect);

    // Transition on keypress (Enter or Space)
    this.input.keyboard.once("keydown-ENTER", transitionToSelect);
    this.input.keyboard.once("keydown-SPACE", transitionToSelect);
  }
}
