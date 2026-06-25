const CRAB_CONFIG = Object.freeze({
  speed: 100,
  maxHealth: 120,
  weaponKey: "crab_weapon",
  shootCooldown: 1500, // milliseconds between shots
  bulletSpeed: 500,    // pixels per second
  damage: 10,          // health damage on player hit
  fireRange: 800,      // maximum firing range
  yAlignmentTolerance: 40, // max vertical offset to align shot
  projectileLifetime: 3000, // milliseconds before bullet despawns
  scale: 0.8,
  depth: 10,
  shadow: Object.freeze({
    offsetX: 0,
    offsetY: 40,
    updateOffsetX: 0,
    updateOffsetY: 50,
  }),
});

export default CRAB_CONFIG;
