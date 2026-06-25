const WORLD_CONFIG = Object.freeze({
  width: 5000,
  height: 5000,
  backgroundColor: "#222",
  grid: Object.freeze({
    cellWidth: 128,
    cellHeight: 128,
    alpha: 0.05,
  }),
  stones: Object.freeze({
    step: 128,
    scale: 0.5,
  })
});

export default WORLD_CONFIG;
