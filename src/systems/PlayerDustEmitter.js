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

    // Queue for micro-staggered burst emissions (emits over 30-60 ms)
    this.pendingSpawns = [];

    // Spawning timer state (footstep burst interval ~60-80 ms)
    this.lastSpawnTime = 0;
    this.spawnInterval = 65; // ms
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
    const dt = actualDelta / 16.66;

    // 1. Process any pending micro-staggered particle spawns due at actualTime
    for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
      const item = this.pendingSpawns[i];
      if (actualTime >= item.timeToSpawn) {
        this.spawnSingleParticle(item.vx, item.vy);
        this.pendingSpawns.splice(i, 1);
      }
    }

    // 2. Check if player is moving (velocity threshold > 10) to trigger next staggered burst
    const vx = sprite.body.velocity.x;
    const vy = sprite.body.velocity.y;
    const speedSq = vx * vx + vy * vy;
    const isMoving = speedSq > 100;

    if (isMoving) {
      if (actualTime - this.lastSpawnTime >= this.spawnInterval) {
        this.triggerStaggeredBurst(vx, vy, actualTime);
        this.spawnInterval = Phaser.Math.Between(60, 80);
        this.lastSpawnTime = actualTime;
      }
    }

    // 3. Update active particles with 3-phase turbulent cloud physics & delayed fade/shrink
    const dragFactor = Math.pow(0.86, dt);
    const expandDuration = 50; // ms initial expansion puff

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.lifetime -= actualDelta;

      if (p.lifetime <= 0) {
        this.recycleParticle(p, i);
      } else {
        // Move particle by current velocity
        p.sprite.x += p.vx * actualDelta;
        p.sprite.y += p.vy * actualDelta;

        // Phase 2 & 3: Apply per-frame directional turbulence jitter
        const elapsed = p.maxLifetime - p.lifetime;
        const noiseAngle = p.noiseSeed + actualTime * 0.012 + elapsed * 0.015;
        const jitterStrength = 0.016 * dt;
        p.vx += Math.cos(noiseAngle) * jitterStrength;
        p.vy += Math.sin(noiseAngle) * jitterStrength;

        // Phase 2 & 3: Apply drag & settling drift
        p.vx = p.vx * dragFactor + p.driftVx * dt;
        p.vy = p.vy * dragFactor + p.driftVy * dt;

        // Calculate progress (1.0 down to 0.0)
        const progress = Math.max(0, p.lifetime / p.maxLifetime);

        // Delayed Fade Curve:
        // 0-30% lifetime (1.0..0.7): mostly opaque (1.0 -> 0.85)
        // 30-80% lifetime (0.7..0.2): gradual fade (0.85 -> 0.25)
        // 80-100% lifetime (0.2..0.0): quick fade to zero (0.25 -> 0.0)
        let fadeProgress;
        if (progress >= 0.7) {
          const norm = (progress - 0.7) / 0.3;
          fadeProgress = 0.85 + 0.15 * norm;
        } else if (progress >= 0.2) {
          const norm = (progress - 0.2) / 0.5;
          fadeProgress = 0.25 + 0.60 * norm;
        } else {
          const norm = progress / 0.2;
          fadeProgress = 0.25 * norm;
        }
        p.sprite.alpha = fadeProgress * p.initialAlpha;

        // Delayed Shrink Curve:
        // First 50ms: expand +15% puff
        // Middle lifetime (progress >= 0.2): shrink slowly from 1.15 to 0.40
        // Last 20% lifetime (progress < 0.2): collapse rapidly from 0.40 to 0.12
        let scaleMultiplier = 1.0;
        if (elapsed < expandDuration) {
          const norm = elapsed / expandDuration;
          scaleMultiplier = 1.0 + 0.15 * Math.sin(norm * Math.PI / 2);
        } else if (progress >= 0.2) {
          const norm = (progress - 0.2) / 0.8;
          scaleMultiplier = 0.40 + 0.75 * norm;
        } else {
          const norm = progress / 0.2;
          scaleMultiplier = 0.12 + 0.28 * norm;
        }

        p.sprite.setScale(p.initialScale * scaleMultiplier);

        // Rotation spin
        p.sprite.angle += p.spinSpeed * actualDelta;
      }
    }
  }

  /**
   * Schedules an explosive burst of 5-8 particles staggered over 30-60 ms.
   * @param {number} playerVx Player X velocity
   * @param {number} playerVy Player Y velocity
   * @param {number} now Current scene timestamp in ms
   */
  triggerStaggeredBurst(playerVx, playerVy, now) {
    const count = Phaser.Math.Between(5,5);
    let delayOffset = 0;

    for (let i = 0; i < count; i++) {
      this.pendingSpawns.push({
        timeToSpawn: now + delayOffset,
        vx: playerVx,
        vy: playerVy
      });
      // Stagger subsequent particles by 6 to 12 ms over 30-60 ms total
      delayOffset += Phaser.Math.Between(6, 12);
    }
  }

  /**
   * Spawns a single organic dust cloud particle with updated 180-320ms lifetime.
   * @param {number} playerVx Player X velocity
   * @param {number} playerVy Player Y velocity
   */
  spawnSingleParticle(playerVx, playerVy) {
    // Limit to a maximum of 35 active particles for performance stability
    if (this.activeParticles.length >= 35) {
      this.recycleParticle(this.activeParticles[0], 0);
    }

    const sprite = this.player.sprite;
    if (!sprite) return;

    // Center foot position
    const multiplier = sprite.flipX ? -1 : 1;
    const baseFootOffset = -10 * (sprite.scaleX || 0.8);
    const baseBehindOffset = -8; 

    const centerFeetX = sprite.x + (baseFootOffset + baseBehindOffset) * multiplier;
    const centerFeetY = sprite.y + 32;

    // Spawn Distribution: Uniform random point inside a FILLED circle (radius 8-14 px)
    const filledRadius = Math.sqrt(Phaser.Math.FloatBetween(0, 1)) * Phaser.Math.FloatBetween(8, 14);
    const circleAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const spawnX = centerFeetX + Math.cos(circleAngle) * filledRadius;
    const spawnY = centerFeetY + Math.sin(circleAngle) * filledRadius;

    // Velocity & Launch Angle (Wider 200° - 240° Radial Burst Fan)
    let launchAngle;
    const speedSq = playerVx * playerVx + playerVy * playerVy;

    if (speedSq > 100) {
      // Moving: 200° - 240° radial fan centered behind the player's movement direction
      const backAngle = Math.atan2(-playerVy, -playerVx);
      const fanSpread = Phaser.Math.FloatBetween(-Math.PI * 0.6, Math.PI * 0.6); // ~216° fan
      launchAngle = backAngle + fanSpread;
    } else {
      // Standing still: 360° radial burst
      launchAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    }

    // Phase 1 Initial burst speed (0.14 - 0.28 px/ms explosive impulse)
    const burstSpeed = Phaser.Math.FloatBetween(0.14, 0.28);
    let vx = Math.cos(launchAngle) * burstSpeed;
    let vy = Math.sin(launchAngle) * burstSpeed - Phaser.Math.FloatBetween(0.02, 0.045);

    // Phase 3 Gentle settling & upward buoyancy drift parameters
    const driftVx = -playerVx * 0.000015;
    const driftVy = -0.00025; // Gentle upward float

    // Size distribution: 70% Small (0.5-0.7), 20% Medium (0.8-1.0), 10% Large (1.1-1.3)
    const roll = Phaser.Math.Between(1, 100);
    let initialScale;
    if (roll <= 10) {
      initialScale = Phaser.Math.FloatBetween(1.1, 1.3); // 10% Large
    } else if (roll <= 30) {
      initialScale = Phaser.Math.FloatBetween(0.8, 1.0); // 20% Medium
    } else {
      initialScale = Phaser.Math.FloatBetween(0.5, 0.7); // 70% Small
    }

    // Slightly longer lifetime: 180 - 320 ms
    const initialAlpha = Phaser.Math.FloatBetween(0.55, 0.85);
    const angle = Phaser.Math.FloatBetween(-60, 60);
    const spinSpeed = Phaser.Math.FloatBetween(-0.1, 0.1);
    const maxLifetime = Phaser.Math.Between(180, 320);
    const noiseSeed = Phaser.Math.FloatBetween(0, 100);

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
      p.driftVx = driftVx;
      p.driftVy = driftVy;
      p.initialScale = initialScale;
      p.initialAlpha = initialAlpha;
      p.spinSpeed = spinSpeed;
      p.noiseSeed = noiseSeed;

      p.sprite.setAngle(angle);
      p.sprite.setAlpha(initialAlpha);
      p.sprite.setScale(initialScale);
      p.sprite.setDepth(sprite.depth - 0.2);
    } else {
      const pSprite = this.scene.add.image(spawnX, spawnY, "player-dust");
      pSprite.setAngle(angle);
      pSprite.setAlpha(initialAlpha);
      pSprite.setScale(initialScale);
      pSprite.setDepth(sprite.depth - 0.2);

      p = {
        sprite: pSprite,
        lifetime: maxLifetime,
        maxLifetime,
        vx,
        vy,
        driftVx,
        driftVy,
        initialScale,
        initialAlpha,
        spinSpeed,
        noiseSeed
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
   * Instantly clears and deactivates all active dust particles and pending spawns.
   */
  clearAll() {
    this.pendingSpawns = [];
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
