const Router = require('koa-router');
const router = new Router();
const db = require('../db');

router.get('/', (ctx, next) => {
    ctx.body = 'Beep beep.';
});

const areas = require('./areas');
router.get('/areas/summaries', areas.getSummaryOfAreas());
router.get('/areas/squares', areas.getSquares());
router.get('/areas/:id', areas.getArea());


const places = require('./places');
router.get('/places/sample', places.sample());
router.get('/places/search', places.search());
router.get('/places/tourist', places.getTouristPlaces());
router.get('/places/directions', places.getDirections());
router.get('/places/:id', places.getPlace());



module.exports = router;