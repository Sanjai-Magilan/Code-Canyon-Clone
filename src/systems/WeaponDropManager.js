import Phaser from "phaser";
import DroppedWeapon from "../entities/DroppedWeapon";

export default class WeaponDropManager {
  /**
   * Manages ground weapon pickups and overlap detection.
   * @param {Phaser.Scene} scene The parent scene
   */
  constructor(scene) {
    this.scene = scene;

    // Physics group for active dropped weapon pickups
    this.pickups = scene.physics.add.group({
      classType: DroppedWeapon,
      runChildUpdate: true
    });

    // Setup overlapping listener between player and weapon pickups (Arcade Physics overlap)
    scene.physics.add.overlap(
      scene.player.getSprite(),
      this.pickups,
      this.handlePlayerPickup,
      null,
      this
    );
  }

  /**
   * Spawns a dropped weapon pickup at the specified position.
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   * @param {string} gunId Weapon configuration key to spawn (e.g. 'gun1')
   */
  spawnPickup(x, y, gunId) {
    if (!gunId) return;
    const pickup = new DroppedWeapon(this.scene, x, y, gunId);
    this.pickups.add(pickup);
  }

  /**
   * Collision callback when the player walks over a weapon drop.
   * @param {Phaser.Physics.Arcade.Sprite} playerSprite The player sprite
   * @param {DroppedWeapon} pickup The pickup sprite
   */
  handlePlayerPickup(playerSprite, pickup) {
    // Equip the temporary weapon on the player
    if (this.scene.player && typeof this.scene.player.equipTemporaryWeapon === "function") {
      this.scene.player.equipTemporaryWeapon(pickup.gunId);
    }
    
    // Remove pickup from the map
    pickup.destroy();
  }
}
