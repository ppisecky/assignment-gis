const db = require('../db');

/**
 * Get edges surrounding a point
 *
 * @returns {getSurroundingLines}
 */
function getSurroundingLines() {
    return async function getSurroundingLines(ctx) {
        let id = ctx.query.osm_id;
        let bounds = ctx.query.bounds;
        let boundsCondition = (bounds.length) ? 'AND ST_Intersects(ST_MakeEnvelope($2, $3, $4, $5, ST_SRID(edges.geom_way)), edges.geom_way)' : '';

        let sql = `
            SELECT ST_AsGeoJSON(edges.geom_way) as geojson
            FROM planet_osm_point as points
            
            JOIN pgr_italy_2po_4pgr as edges
            ON ST_DWithin(points.way, edges.geom_way, 0.01) ${boundsCondition}
            
            WHERE points.osm_id = $1
        `;

        let {rows} = await db.query(sql, [id].concat(bounds));

        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}


function getVertexSql(param) {
    return `(
                SELECT v.id
                FROM planet_osm_point as p
        
                JOIN pgr_italy_2po_vertex as v
                ON ST_DWithin(p.way::geography, v.geog_vertex, 150)
        
                WHERE p.osm_id = ${param}
        
                ORDER BY ST_Distance(p.way::geography, v.geog_vertex) ASC
                LIMIT 1
            )
        `;
}

/**
 * Get directions from one place to another
 *
 * @returns {getDirections}
 */
function getDirections() {
    return async function getDirections(ctx) {

        let source = ctx.query.source, target = ctx.query.target;

        let vertices_sql = `
            SELECT ${getVertexSql('$1')} as source, ${getVertexSql('$2')} as target
        `;

        let res = await db.query(vertices_sql, [source, target]);

        source = res.rows[0].source;
        target = res.rows[0].target;

        console.log(`Searching directions for ${source} ${target}`);

        let sql = `
            SELECT ST_AsGeoJSON(ST_Union(edges.geom_way)) as geojson
            FROM pgr_dijkstra(
                'SELECT id, source, target, cost, reverse_cost, geom_way FROM pgr_italy_2po_4pgr as edges,
                (SELECT ST_Expand(ST_Extent(geom_way),0.1) as box  FROM pgr_italy_2po_4pgr as lim  WHERE lim.source = ${source} OR lim.target = ${target}) as box
                WHERE edges.geom_way && box.box',
                ${source}, ${target},
                FALSE
            ) as path
            JOIN pgr_italy_2po_4pgr as edges
            ON edges.id = path.edge
        `;


        let {rows} = await db.query(sql);
        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            return r;
        });
    }
}

module.exports = {
    getSurroundingLines,
    getDirections
};