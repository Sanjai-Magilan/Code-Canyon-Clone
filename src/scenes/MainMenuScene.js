import Phaser from "phaser";
import introImg from "../assets/Sprites/intro image/introImage.png";
import powerUpAudio from "../assets/Sounds/powerUp.webm";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {
    this.load.image("intro-img", introImg);
    this.load.audio("power-up", powerUpAudio);
  }

  create() {
    // Centered intro artwork (FIT scaling preserving aspect ratio)
    const introSprite = this.add.image(960, 540, "intro-img").setOrigin(0.5);
    introSprite.setDisplaySize(1920, 1080);

    // Scene Transition Helper
    const transitionToSelect = () => {
      if (this.cache.audio.exists("power-up")) {
        this.sound.play("power-up", { volume: 0.4 });
      }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("CharacterSelectScene");
      });
    };

    // Transition on mouse click/touch or ANY keypress
    this.input.once("pointerdown", transitionToSelect);
    this.input.keyboard.once("keydown", transitionToSelect);
  }
}
