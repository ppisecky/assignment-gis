
module.exports = {
    'initializes map upon page load': browser => {
        browser
            .url(process.env.APP_URL)
            .waitForElementVisible('#app', 3000);

        browser.expect.element('#main').to.be.present;
        browser.expect.element('canvas.mapboxgl-canvas').to.be.visible;
        browser.execute("return !!window.pdt_map && typeof window.pdt_map.flyTo == 'function';", [], function (response) {
            var value = response.value;
            browser.assert.notStrictEqual(value, false, 'Mapbox map has been added to the window object.')
        });

        browser.end()
    }
}