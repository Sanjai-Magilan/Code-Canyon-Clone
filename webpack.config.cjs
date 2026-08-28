const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",

  entry: {
    "phaser-custom": "./phaser-custom.cjs",
  },

  experiments: {
    outputModule: true,
  },

  resolve: {
    modules: [
      path.resolve(__dirname, "node_modules/phaser/src"),
      path.resolve(__dirname, "node_modules"),
    ],
  },

  output: {
    path: path.resolve(__dirname, "phaser-dist"),
    filename: "[name].js",
    library: {
      type: "module",
    },
  },

  plugins: [
    new webpack.DefinePlugin({
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true),
      "typeof WEBGL_DEBUG": JSON.stringify(false),
      "typeof EXPERIMENTAL": JSON.stringify(false),
      "typeof PLUGIN_3D": JSON.stringify(false),
      "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
      "typeof PLUGIN_FBINSTANT": JSON.stringify(false),
      "typeof FEATURE_SOUND": JSON.stringify(true),
    }),
  ],
};
