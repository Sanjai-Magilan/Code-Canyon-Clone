import CRAB_CONFIG from "./crabConfig";

const WEAPON_CONFIG = Object.freeze({
  pistol: Object.freeze({
    fireRate: 350, // ms cooldown
    bulletCount: 1,
    spread: 0, // degrees spread
    bulletTexture: "bullet",
    bulletSpeed: 2000,
    bulletScale: 0.6,
  }),
  shotgun: Object.freeze({
    fireRate: 750,
    bulletCount: 5,
    spread: 25,
    bulletTexture: "bullet",
    bulletSpeed: 1600,
    bulletScale: 0.5,
  }),
  machineGun: Object.freeze({
    fireRate: 100,
    bulletCount: 1,
    spread: 8,
    bulletTexture: "bullet",
    bulletSpeed: 2400,
    bulletScale: 0.6,
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
