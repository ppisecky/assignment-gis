const db = require('../db');

/**
 * Get a sample of point data for testing
 *
 * @returns {sample}
 */
function sample() {
    return async function sample(ctx) {
        let {rows} = await db.query('SELECT osm_id, name, ST_AsGeoJSON(way) as geojson FROM planet_osm_point WHERE name is not null LIMIT 10', []);
        ctx.body = rows;
    }
}

/**
 * Search for tourist places by name and tourism type
 *
 * @returns {search}
 */
function search() {
    return async function search(ctx) {
        let q = ctx.query.q  + '%';

        let tags = ctx.query.tourism || [];
        if (typeof tags === 'string') tags = [tags];
        let tagParams = [];
        for(let i = 1; i <= tags.length; i++) {
            tagParams.push('$' + (i+1));
        }
        let tagsCondition = tags.length ? 'AND places.tourism IN (' + tagParams.join(',') + ')' : '';

        let sql = `
        SELECT places.osm_id, places.name, ST_AsGeoJSON(places.way) as geojson, places.tourism,
        ST_X(places.way) as lng, ST_Y(places.way) as lat
        FROM planet_osm_point as places
        
        WHERE places.name IS NOT null AND places.tourism IS NOT null ${tagsCondition} AND places.osm_id > 0 AND places.name LIKE $1
        
        LIMIT 10
        `;

        let {rows} = await db.query(sql, [q].concat(tags));
        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}

/**
 * Get tourist places by type in an area defined by lat/lng bounds
 *
 * @returns {getTouristPlaces}
 */
function getTouristPlaces() {
    return async function getTouristPlaces(ctx, next) {
        let bounds = ctx.query.bounds || [];
        let tags = ctx.query.tourism || [];
        if (typeof tags === 'string') tags = [tags];
        let tagParams = [];
        for(let i = 1; i <= tags.length; i++) {
            tagParams.push('$' + i);
        }
        let tagsCondition = tags.length ? 'AND places.tourism IN (' + tagParams.join(',') + ')' : '';
        let l = tags.length + 1;
        let boundsCondition = (bounds.length) ? `AND ST_Intersects(ST_MakeEnvelope($${l++}, $${l++}, $${l++}, $${l++}, ST_SRID(places.way)), places.way)` : '';

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
        
        WHERE places.name IS NOT null AND places.tourism IS NOT null ${tagsCondition} AND places.osm_id > 0 ${boundsCondition}
        
        LIMIT 200
        `;

        let {rows} = await db.query(sql, tags.concat(bounds));
        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}

/**
 * Find a place by its osm_id
 *
 * @returns {getPlace}
 */
function getPlace() {
    return async function getPlace(ctx, next) {
        let id = ctx.params.id;
        let sql = `
            SELECT * FROM planet_osm_point
            WHERE osm_id = $1
        `;

        let {rows} = await db.query(sql, [id]);
        ctx.body = rows.length ? rows[0] : null;
    }
}


module.exports = {
    sample,
    search,
    getTouristPlaces,
    getPlace
};