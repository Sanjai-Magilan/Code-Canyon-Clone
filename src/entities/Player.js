export default class Player {
  constructor(scene, x, y) {

    this.scene = scene;

    this.sprite = scene.add.rectangle(
      x,
      y,
      60,
      60,
      0x00ff00
    );
  }
}