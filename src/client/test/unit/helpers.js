const data = require('./__mocks__/mockedData')

// Generic
export const arrRandIndex = (arr) => Math.floor(Math.random() * arr.length)
export const randomItem = (arr) => arr[arrRandIndex(arr)]

// Mocked data
export const randomPlace = () => randomItem(data.places)
export const randomRegion = () => randomItem(data.regions)
export const randomRegionLevel = () => randomItem(data.regionLevels)
export const randomSquare = () => randomItem(data.squares)