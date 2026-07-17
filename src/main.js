import Phaser from "phaser";
import MainMenuScene from "./scenes/MainMenuScene";
import CharacterSelectScene from "./scenes/CharacterSelectScene";
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

  scene: [MainMenuScene, CharacterSelectScene, GameScene],
};

new Phaser.Game(config);

window.addEventListener("error", (e) => {
  console.error("GLOBAL ERROR:", e.error);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("PROMISE ERROR:", e.reason);
});
