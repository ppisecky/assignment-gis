require('dotenv').config()
var geckodriver = require('geckodriver');

process.env.APP_URL = "http://" + process.env.CLIENT_HOST + ":" + process.env.CLIENT_PORT

module.exports = {
    src_folders: ['e2e'],
    output_folder: 'e2e/output',
    webdriver: {
        start_process: true,
        server_path: geckodriver.path,
        port: 4444,
        cli_args: [
            "--log", "debug"
        ]
    },
    test_settings: {
        default: {
            desiredCapabilities: {
                browserName: "firefox",
                acceptInsecureCerts: true
            }
        }
    }
};