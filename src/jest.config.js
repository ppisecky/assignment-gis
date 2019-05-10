module.exports = {
    testMatch: [
        "**/client/test/unit/?(*.)+(spec|test).[jt]s?(x)"
    ],
    moduleFileExtensions: [
      "js",
      "json",
      "vue"
    ],
    watchman: false,
    moduleNameMapper: {
      "^~/(.*)$": "<rootDir>/$1",
      "^~~/(.*)$": "<rootDir>/$1",
      "\\.(css|scss)$": "<rootDir>/client/test/unit/__mocks__/styleMock.js"
    },
    transform: {
      "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
      ".*\\.(vue)$": "<rootDir>/node_modules/vue-jest"
    },
    "transformIgnorePatterns": [
        "/node_modules\\/(?!(mapbox-gl))/",
    ],
    snapshotSerializers: [
      "<rootDir>/node_modules/jest-serializer-vue"
    ],
    setupFiles: [
      "<rootDir>/client/test/unit/setup.jest.js"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
      "<rootDir>/client/components/**/*.vue",
      "<rootDir>/client/pages/*.vue"
    ]
  }