module.exports = {
    mode: "spa",
    srcDir: 'client/',
    css: [
        'element-ui/lib/theme-chalk/reset.css',
        'element-ui/lib/theme-chalk/index.css'
    ],
    build: {
        vendor: ['axios', 'element-ui', 'mapbox-gl']
    },
    plugins: ['@/plugins/element-ui']
}