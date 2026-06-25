const CHARACTERS = Object.freeze({
  soldier: Object.freeze({
    speed: 800,
    maxHealth: 100,
    bodyTexture: "player",
    headTexture: "player-head",
    gunTexture: "player-gun",
    shadowTexture: "player-shadow",
    weapon: "pistol",
    scale: 0.8,
    depth: 10,
    headOffset: Object.freeze({ x: -10, y: -90 }),
    headFloatAmplitude: 2,
    headFloatSpeed: 0.004,
    gunOffset: Object.freeze({ x: 22, y: -15 }),
    recoil: Object.freeze({
      offset: -12,
      angle: 8,
      offsetDecay: 0.82,
      angleDecay: 0.8,
    }),
    anim: Object.freeze({
      run: Object.freeze({
        frameRate: 8,
        start: 0,
        end: 3
      })
    }),
    muzzleFlash: Object.freeze({
      texture: "gunfire",
      anim: "gun-fire",
      scale: 0.7
    })
  }),
  cyborg: Object.freeze({
    speed: 650,
    maxHealth: 140,
    bodyTexture: "player", // reusing assets as placeholder
    headTexture: "player-head",
    gunTexture: "player-gun",
    shadowTexture: "player-shadow",
    weapon: "shotgun",
    scale: 0.8,
    depth: 10,
    headOffset: Object.freeze({ x: -10, y: -90 }),
    headFloatAmplitude: 2.5,
    headFloatSpeed: 0.005,
    gunOffset: Object.freeze({ x: 22, y: -15 }),
    recoil: Object.freeze({
      offset: -20,
      angle: 15,
      offsetDecay: 0.80,
      angleDecay: 0.78,
    }),
    anim: Object.freeze({
      run: Object.freeze({
        frameRate: 8,
        start: 0,
        end: 3
      })
    }),
    muzzleFlash: Object.freeze({
      texture: "gunfire",
      anim: "gun-fire",
      scale: 0.7
    })
  })
});

export { CHARACTERS };
export default CHARACTERS;
