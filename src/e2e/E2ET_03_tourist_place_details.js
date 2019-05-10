
const selectPlace = function (done) {
    const map = window.pdt_map;
    const fail = () => done(false)
    let timeout, place;
    map.on('moveend', function (e) {
        clearTimeout(timeout)
        done({
            place: place.querySelector('.place-label').textContent,
            zoom: map.getZoom()
        })
    });
    timeout = setTimeout(fail, 3000);
    // Open the places accordion
    document.querySelector('#tourism-places > div > div:nth-child(1) > div').click();
    setTimeout(() => {
        place = document.querySelector('#tourism-places > div > div.el-tree-node.is-expanded.is-current.is-focusable > div.el-tree-node__children > div:nth-child(1) > div > span.custom-tree-node')
        place.click();
    }, 100)
}

const selector = '#overview-table div > div > div.el-table__body-wrapper > table > tbody > tr:nth-child(1)'

module.exports = {
    'displays place details upon place selection': browser => {
        browser
            .url(process.env.APP_URL)
            .waitForElementVisible('#app', 3000)
            .waitForElementVisible(selector, 5000);

        // Zoom to places/squares level
        browser.execute('window.pdt_map.zoomTo(12); return null;', [], () => {
            browser
                // Wait for tourist places to load
                .waitForElementVisible('#tourism-places > div > div:nth-child(1) > div', 2000)
                // Execute async script in browser to select place
                .executeAsync(selectPlace, function (result) {
                    // If returned result value == false => script timed out
                    browser.assert.notStrictEqual(result.value, false, 'Map should zoom into selected tourist place.')
                    // Assert that place details have been displayed
                    browser.expect.element('#detail-card').to.be.visible
                    browser.expect.element('#detail-card h3').text.to.contain(result.value.place)
                    browser.assert.strictEqual(result.value.zoom > 12, true, 'Place has been zoomed to')
                    browser.end()
                })
        })
    },
}