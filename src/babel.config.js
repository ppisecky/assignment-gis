module.exports = {
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { "targets": { "node": "current" } }],
        "@babel/preset-flow"
      ],
      plugins: [
        "@babel/plugin-transform-flow-strip-types"
      ]
    }
  }
}