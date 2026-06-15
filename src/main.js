import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import "./style.css";
const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,

    width: 1920,
    height: 1080,
  },
  backgroundColor: "#222",

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },

  scene: [GameScene],
};

new Phaser.Game(config);
