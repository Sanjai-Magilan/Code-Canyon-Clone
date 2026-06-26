const WEAPON_DROP_CONFIG = Object.freeze({
  crab: Object.freeze({
    gun1: 0.25
  }),

  angler: Object.freeze({
    gun4: 0.25,
    gun5: 0.05
  }),

  durations: Object.freeze({
    gun1: 30000,
    gun4: 30000
  }),

  maxShots: Object.freeze({
    gun5: 2
  }),

  pickupLifetime: 15000
});

export default WEAPON_DROP_CONFIG;
