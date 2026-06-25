const ENEMY_CONFIG = Object.freeze({
  speed: 120,
  scale: 0.8,
  spawn: Object.freeze({
    delay: 3000,
    distance: 1200,
    maxActive: 40,
  }),
  collisionDamage: 10,
});

export default ENEMY_CONFIG;
