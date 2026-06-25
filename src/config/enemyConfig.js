const ENEMY_CONFIG = Object.freeze({
  speed: 120,
  scale: 0.8,
  spawn: Object.freeze({
    delay: 3000,
    distance: 1200,
    maxActive: 40,
  }),
  collisionDamage: 10,
  shadow: Object.freeze({
    offsetX: 10,
    offsetY: 40,
    updateOffsetX: 10,
    updateOffsetY: 60,
  }),
});

export default ENEMY_CONFIG;
