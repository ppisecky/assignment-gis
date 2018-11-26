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
        
        WHERE places.name IS NOT null AND places.tourism IS NOT null AND places.osm_id > 0 ${boundsCondition}
        
        LIMIT 200
        `;

        let {rows} = await db.query(sql, bounds);
        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}

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

function getVertexSql(param) {
    return `ARRAY(
                SELECT v.id
                FROM planet_osm_point as p
        
                JOIN pgr_italy_2po_vertex as v
                ON ST_DWithin(p.way::geography, v.geog_vertex, 150)
        
                WHERE p.osm_id = ${param}
        
                ORDER BY ST_Distance(p.way::geography, v.geog_vertex) ASC
                LIMIT 3
            )
        `;
}

function getDirections() {
    return async function getDirections(ctx) {

        let source = ctx.query.source, target = ctx.query.target;

        let sql = `
            SELECT ST_AsGeoJSON(ST_Union(edges.geom_way)) as geojson
            FROM pgr_dijkstra(
                'SELECT id, source, target, cost, reverse_cost, geom_way FROM pgr_italy_2po_4pgr',
                ${getVertexSql('$1')}, ${getVertexSql('$2')},
                FALSE
            ) as path
            JOIN pgr_italy_2po_4pgr as edges
            ON edges.id = path.edge
            
            GROUP BY path.start_vid, path.end_vid
        `;


        let {rows} = await db.query(sql, [source, target]);
        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}

module.exports = {
    sample,
    search,
    getTouristPlaces,
    getPlace,
    getDirections
};