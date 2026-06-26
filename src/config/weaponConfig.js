import CRAB_CONFIG from "./crabConfig";

const WEAPON_CONFIG = Object.freeze({
  pistol: Object.freeze({
    fireRate: 350, // ms cooldown
    bulletCount: 1,
    spread: 0, // degrees spread
    bulletTexture: "bullet",
    bulletSpeed: 2000,
    bulletScale: 0.6,
    velocityInheritanceFactor: 0.0,
  }),
  shotgun: Object.freeze({
    fireRate: 750,
    bulletCount: 5,
    spread: 25,
    bulletTexture: "bullet",
    bulletSpeed: 1600,
    bulletScale: 0.5,
    velocityInheritanceFactor: 0.0,
  }),
  machineGun: Object.freeze({
    fireRate: 100,
    bulletCount: 1,
    spread: 8,
    bulletTexture: "bullet",
    bulletSpeed: 2400,
    bulletScale: 0.6,
    velocityInheritanceFactor: 0.0,
  }),
  crab_weapon: Object.freeze({
    fireRate: CRAB_CONFIG.shootCooldown,
    bulletCount: 1,
    spread: 0,
    bulletTexture: "crab-bullet",
    bulletSpeed: CRAB_CONFIG.bulletSpeed,
    bulletScale: 0.8,
    projectileLifetime: CRAB_CONFIG.projectileLifetime,
  }),
  gun1: Object.freeze({
    fireRate: 120,
    bulletCount: 1,
    spread: 6,
    bulletTexture: "bullet_gun1",
    bulletSpeed: 2200,
    bulletScale: 0.6,
    velocityInheritanceFactor: 0.0,
  }),
  gun4: Object.freeze({
    fireRate: 600,
    bulletCount: 5,
    spread: 25,
    bulletTexture: "bullet_gun4",
    bulletSpeed: 1700,
    bulletScale: 0.5,
    velocityInheritanceFactor: 0.0,
  }),
  gun5: Object.freeze({
    fireRate: 150,
    bulletCount: 1,
    spread: 0,
    bulletTexture: "bullet_gun5",
    bulletSpeed: 3500,
    bulletScale: 1.5,
    velocityInheritanceFactor: 0.0,
  }),
  default: Object.freeze({
    fireRate: 350,
    bulletCount: 1,
    spread: 0,
    bulletTexture: "bullet",
    bulletSpeed: 2000,
    bulletScale: 0.6,
  })
});

export default WEAPON_CONFIG;
