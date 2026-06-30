const PLAYER_CONFIG = Object.freeze({
  maxHealth: 5,
  invincibilityDuration: 1000,
  dash: Object.freeze({
    distance: 250,
    duration: 150,
    cooldown: 1000
  })
});

export default PLAYER_CONFIG;
