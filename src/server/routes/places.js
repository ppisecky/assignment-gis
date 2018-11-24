const db = require('../db');

function sample() {
    return async function sample(ctx) {
        let {rows} = await db.query('SELECT osm_id, name, ST_AsGeoJSON(way) as geojson FROM planet_osm_point WHERE name is not null LIMIT 10', []);
        ctx.body = rows;
    }
}

function search() {
    return async function search(ctx) {

    }
}

function getTouristPlaces() {
    return async function getTouristPlaces(ctx, next) {
        let bounds = ctx.query.bounds || [];
        let boundsCondition = (bounds.length) ? 'AND ST_Intersects(ST_MakeEnvelope($1, $2, $3, $4, ST_SRID(places.way)), places.way)' : '';

        if (!bounds.length) {
            ctx.body = {
                error: "Bounds are required."
            };
            return;
        }

        let sql = `
        SELECT places.osm_id, places.name, ST_AsGeoJSON(places.way) as geojson, places.tourism,
        ST_X(places.way) as lng, ST_Y(places.way) as lat
        FROM planet_osm_point as places
        
        WHERE places.name IS NOT null AND places.tourism IS NOT null ${boundsCondition}
        
        LIMIT 100
        `;

        let {rows} = await db.query(sql, bounds);
        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}

module.exports = {
    sample,
    search,
    getTouristPlaces
};