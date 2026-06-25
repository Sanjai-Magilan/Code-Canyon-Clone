const PLAYER_CONFIG = Object.freeze({
  speed: 800,
  scale: 0.8,
  depth: 10,
  maxHealth: 100,
  headOffset: Object.freeze({ x: -10, y: -90 }),
  headFloatAmplitude: 2,
  headFloatSpeed: 0.004,
  gunOffset: Object.freeze({ x: 22, y: -15 }),
  recoil: Object.freeze({
    offset: -12,
    angle: 8,
    offsetDecay: 0.82,
    angleDecay: 0.8,
  })
});

export default PLAYER_CONFIG;
