import Phaser from "phaser";

export default class PlayerDustEmitter {
  /**
   * Helper class to manage running dust particles for the player.
   * @param {Phaser.Scene} scene The parent scene
   * @param {object} player The player entity wrapper
   */
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Object pool to recycle dust particle objects and prevent garbage collection overhead
    this.pool = [];
    // List of currently active dust particles
    this.activeParticles = [];

    // Spawning timer state
    this.lastSpawnTime = 0;
    this.spawnInterval = 50; //ms
  }

  /**
   * Updates coordinates, scales, opacities, and animations of all active dust particles.
   * @param {number} time Current scene time in ms
   * @param {number} delta Elapsed frame time in ms
   */
  update(time, delta) {
    const sprite = this.player.sprite;
    if (!sprite || !sprite.body || !sprite.active || this.player.isDead) {
      this.clearAll();
      return;
    }

    // Fallbacks if time/delta aren't passed by POST_UPDATE listener
    const actualTime = (time !== undefined) ? time : this.scene.time.now;
    const actualDelta = (delta !== undefined) ? delta : (this.scene.game?.loop?.delta || 16.66);

    // Check if the player is moving (velocity threshold > 10)
    const vx = sprite.body.velocity.x;
    const vy = sprite.body.velocity.y;
    const speedSq = vx * vx + vy * vy;
    const isMoving = speedSq > 100;

    if (isMoving) {
      if (actualTime - this.lastSpawnTime >= this.spawnInterval) {
        this.spawnParticle(vx, vy);
        // Randomize the next spawn interval to prevent uniform repetition (40-60 ms)
        this.spawnInterval = Phaser.Math.Between(40, 60);
        this.lastSpawnTime = actualTime;
      }
    }

    // Update active particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.lifetime -= actualDelta;

      if (p.lifetime <= 0) {
        this.recycleParticle(p, i);
      } else {
        // Drift opposite player velocity & float upward
        p.sprite.x += p.vx * delta;
        p.sprite.y += p.vy * delta;

        // Calculate progress (1.0 down to 0.0)
        const progress = Math.max(0, p.lifetime / p.maxLifetime);

        // Gradually fade out
        p.sprite.alpha = progress * p.initialAlpha;

        // Shrink slightly before disappearing
        p.sprite.setScale(progress * p.initialScale);

        // Slight rotation spin
        p.sprite.angle += p.spinSpeed * delta;
      }
    }
  }

  /**
   * Spawns a dust particle at the player's feet, drifting opposite their velocity vector.
   * @param {number} playerVx Player X velocity
   * @param {number} playerVy Player Y velocity
   */
  spawnParticle(playerVx, playerVy) {
    // Limit to a maximum of 15 active particles for performance stability
    if (this.activeParticles.length >= 15) {
      this.recycleParticle(this.activeParticles[0], 0);
    }

    const sprite = this.player.sprite;
    if (!sprite) return;

    // Target the bottom of the body (feet level)
    let spawnX = sprite.x + 20;
    let spawnY = sprite.y + 42;

    // Apply random offsets around the feet (±5-10px)
    spawnX += Phaser.Math.Between(-8, 8);
    spawnY += Phaser.Math.Between(-3, 3);

    // Shift spawning position slightly behind the feet based on movement direction
    if (playerVx < -10) {
      spawnX += Phaser.Math.Between(5, 12);
    } else if (playerVx > 10) {
      spawnX -= Phaser.Math.Between(5, 12);
    }

    // Calculate drift velocities opposite the player's movement direction
    const driftFactor = 0.04;
    let vx = -playerVx * driftFactor * Phaser.Math.FloatBetween(0.6, 1.2) / 1000;
    let vy = -playerVy * driftFactor * Phaser.Math.FloatBetween(0.6, 1.2) / 1000;

    // Add constant slight upward drift (float upward)
    vy -= Phaser.Math.FloatBetween(0.015, 0.035);

    // Randomize rotation, scale, lifetime, and alpha to create organic looking trails
    const initialScale = Phaser.Math.FloatBetween(0.7, 1.0);
    const initialAlpha = Phaser.Math.FloatBetween(0.4, 0.7);
    const angle = Phaser.Math.FloatBetween(-35, 35);
    const spinSpeed = Phaser.Math.FloatBetween(-0.06, 0.06);
    const maxLifetime = Phaser.Math.Between(300, 500);

    let p;
    if (this.pool.length > 0) {
      p = this.pool.pop();
      p.sprite.setPosition(spawnX, spawnY);
      p.sprite.setVisible(true);
      p.sprite.setActive(true);

      // Reset state properties
      p.lifetime = maxLifetime;
      p.maxLifetime = maxLifetime;
      p.vx = vx;
      p.vy = vy;
      p.initialScale = initialScale;
      p.initialAlpha = initialAlpha;
      p.spinSpeed = spinSpeed;

      p.sprite.setAngle(angle);
      p.sprite.setAlpha(initialAlpha);
      p.sprite.setScale(initialScale);
      p.sprite.setDepth(sprite.depth - 0.5);
    } else {
      const pSprite = this.scene.add.image(spawnX, spawnY, "player-dust");
      pSprite.setAngle(angle);
      pSprite.setAlpha(initialAlpha);
      pSprite.setScale(initialScale);
      pSprite.setDepth(sprite.depth - 0.5);

      p = {
        sprite: pSprite,
        lifetime: maxLifetime,
        maxLifetime,
        vx,
        vy,
        initialScale,
        initialAlpha,
        spinSpeed
      };
    }

    this.activeParticles.push(p);
  }

  /**
   * Recycles an active particle back into the object pool.
   * @param {object} p The particle wrapper object
   * @param {number} index Index in activeParticles array
   */
  recycleParticle(p, index) {
    p.sprite.setVisible(false);
    p.sprite.setActive(false);
    this.activeParticles.splice(index, 1);
    this.pool.push(p);
  }

  /**
   * Instantly clears and deactivates all active dust particles.
   */
  clearAll() {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      this.recycleParticle(this.activeParticles[i], i);
    }
  }

  /**
   * Destroys all sprites in the pool and active list to protect against memory leaks.
   */
  destroy() {
    this.clearAll();
    this.pool.forEach(p => {
      if (p.sprite) {
        p.sprite.destroy();
      }
    });
    this.pool = [];
    this.activeParticles = [];
  }
}
