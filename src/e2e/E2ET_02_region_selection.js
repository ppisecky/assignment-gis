
const selectRegionRunner = function (done) {
    const selector = '#overview-table div > div > div.el-table__body-wrapper > table > tbody > tr:nth-child(1)'
    const map = window.pdt_map;
    const fail = () => done(false)
    let timeout;
    map.on('moveend', function (e) {
        clearTimeout(timeout)
        done(map.getZoom())
    });

    timeout = setTimeout(fail, 5000);
    document.querySelector(selector).click()
}

const selector = '#overview-table div > div > div.el-table__body-wrapper > table > tbody > tr:nth-child(1)'
const loaderSelector = '#map-search > div.el-card.is-always-shadow.el-loading-parent--relative > div.el-loading-mask > div';

module.exports = {
    'zooms in upon region selection': browser => {

        browser
            .url(process.env.APP_URL)
            .waitForElementVisible('#app', 3000)
            .waitForElementVisible(selector, 10000);

        browser.executeAsync(selectRegionRunner, function (result) {
            browser.assert.strictEqual(result.value, 8, 'Map should zoom into province level upon region selection.')
        })
    },

    'zooms in upon province selection': browser => {
        browser
            .waitForElementNotVisible(loaderSelector, 2000)
            .waitForElementVisible(selector, 2000)
            .executeAsync(selectRegionRunner, function (result) {
                browser.assert.strictEqual(result.value, 11, 'Map should zoom into municipalities level upon province selection.')
            })
    },

    'zooms in upon municipality selection': browser => {
        browser
            .waitForElementNotVisible(loaderSelector, 2000)
            .waitForElementVisible(selector, 2000)
            .executeAsync(selectRegionRunner, function (result) {
                browser.assert.strictEqual(result.value, 12, 'Map should zoom into detail level upon province selection.')
                browser.end()
            })
    }
}