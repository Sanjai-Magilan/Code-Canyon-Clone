const WEAPON_DROP_CONFIG = Object.freeze({
  crab: Object.freeze({
    gun1: 0.15
  }),

  angler: Object.freeze({
    gun4: 0.15,
    gun5: 0.01
  }),

  durations: Object.freeze({
    gun1: 30000,
    gun4: 30000
  }),

  maxShots: Object.freeze({
    gun5: 2
  }),

  pickupLifetime: 10000
});

export default WEAPON_DROP_CONFIG;
