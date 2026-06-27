import Worm from "../entities/Worm";
import Crab from "../entities/Crab";
import Angler from "../entities/Angler";

export default class WaveManager {
  /**
   * Manages elapsed game time and wave configurations.
   * @param {Phaser.Scene} scene The parent scene
   */
  constructor(scene) {
    this.scene = scene;
    
    // Map enemy keys to their respective class constructors
    this.enemyRegistry = {
      worm: Worm,
      crab: Crab,
      angler: Angler
    };

    // Define time-based wave configuration timeline
    // Waves are evaluated based on elapsed seconds
    this.waves = [
      {
        id: 1,
        duration: 60, // 0:00 - 1:00 (seconds)
        spawnInterval: 2000, // ms
        maxEnemies: 20,
        enemies: [
          { type: "worm", weight: 1.0 }
        ]
      },
      {
        id: 2,
        duration: 60, // 1:00 - 2:00 (seconds)
        spawnInterval: 1500, // ms
        maxEnemies: 30,
        enemies: [
          { type: "worm", weight: 0.7 },
          { type: "crab", weight: 0.3 }
        ]
      },
      {
        id: 3,
        duration: 60, // 2:00 - 3:00 (seconds)
        spawnInterval: 1000, // ms
        maxEnemies: 40,
        enemies: [
          { type: "worm", weight: 0.5 },
          { type: "crab", weight: 0.3 },
          { type: "angler", weight: 0.2 }
        ]
      }
    ];

    this.startTime = null;
  }

  /**
   * Starts the wave clock.
   */
  start() {
    this.startTime = this.scene.time.now;
  }

  /**
   * Resets the wave clock.
   */
  reset() {
    this.start();
  }

  /**
   * Returns elapsed time in milliseconds.
   * @returns {number}
   */
  getElapsedTime() {
    if (this.startTime === null) {
      return 0;
    }
    return this.scene.time.now - this.startTime;
  }

  /**
   * Retrieves config of the active wave based on elapsed time.
   * Falls back to the last defined wave once time exceeds the timeline.
   * @private
   */
  getCurrentWaveConfig() {
    const elapsedSeconds = this.getElapsedTime() / 1000;
    
    let cumulativeTime = 0;
    for (let i = 0; i < this.waves.length; i++) {
      cumulativeTime += this.waves[i].duration;
      if (elapsedSeconds < cumulativeTime) {
        return this.waves[i];
      }
    }
    // Return last wave if all durations exceeded
    return this.waves[this.waves.length - 1];
  }

  /**
   * Decides which enemy type class to spawn next based on active wave weights.
   * @returns {Function} Enemy class constructor
   */
  getNextEnemyClass() {
    const config = this.getCurrentWaveConfig();
    const rand = Math.random();
    let cumulativeWeight = 0;

    for (let i = 0; i < config.enemies.length; i++) {
      cumulativeWeight += config.enemies[i].weight;
      if (rand <= cumulativeWeight) {
        const type = config.enemies[i].type;
        return this.enemyRegistry[type] || this.enemyRegistry.worm;
      }
    }

    return this.enemyRegistry.worm;
  }

  /**
   * Exposes active wave spawn interval delay in milliseconds.
   * @returns {number}
   */
  getSpawnInterval() {
    return this.getCurrentWaveConfig().spawnInterval;
  }

  /**
   * Exposes active wave max active enemies limit.
   * @returns {number}
   */
  getMaxEnemies() {
    return this.getCurrentWaveConfig().maxEnemies;
  }
}
