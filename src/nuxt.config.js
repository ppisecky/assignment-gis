require('dotenv').config();

const CLIENT_HOST = process.env.CLIENT_HOST || 'localhost';
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 5000;

console.log(CLIENT_HOST, CLIENT_PORT, process.env.CLIENT_HOST, process.env.CLIENT_PORT);

module.exports = {
    srcDir: 'client/',
    mode: "spa",
    server: {
        port: CLIENT_PORT,
        host: CLIENT_HOST
    },
    css: [
        'element-ui/lib/theme-chalk/reset.css',
        'element-ui/lib/theme-chalk/index.css'
    ],
    build: {
        vendor: ['element-ui', 'mapbox-gl']
    },
    plugins: [
        '@/plugins/element-ui'
    ],
    modules: [
        '@nuxtjs/axios',
        '@nuxtjs/toast',
    ],
    axios: {
        host: API_HOST,
        port: API_PORT,
        progress: true,
    },
    toast: {
        position: 'top-center',
        duration: 2000
    }
};