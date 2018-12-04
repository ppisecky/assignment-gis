const db = require('../db');

/**
 * Admin_level:
 *      10 - districts
 *      8 - municipalities
 *      6 - provinces
 *      4 - regions
 * Source (look for italy): https://wiki.openstreetmap.org/wiki/Tag:boundary=administrative?uselang=en-US
 */
const IT_ADMIN_BOUNDARIES = {
    'districts': {
        admin_level: '10',
        simplificationTolerance: 0.0075
    },
    'municipalities': {
        admin_level: '8',
        simplificationTolerance: 0.0005
    },
    'provinces': {
        admin_level: '6',
        simplificationTolerance: 0.0025
    },
    'regions': {
        admin_level: '4',
        simplificationTolerance: 0.0075
    }
};

/**
 * Router function for getting summary information of administrative areas
 *
 * @returns {getSummaryOfAreas}
 */
function getSummaryOfAreas() {
    return async function getSummaryOfAreas(ctx, next) {
        let type = ctx.query.type || 'regions';
        let level = IT_ADMIN_BOUNDARIES[type];
        let bounds = ctx.query.bounds || [];
        let boundsCondition = (bounds.length) ? 'AND ST_Intersects(ST_MakeEnvelope($3, $4, $5, $6, ST_SRID(polys.way)), polys.way)' : '';

        let sql = (type === 'regions' || type === 'provinces') ? `
        SELECT areas.osm_id, areas.name, way_union, ST_AsGeoJSON(areas.way_union) as geojson, ST_X(ST_Centroid(areas.way_union)) as lng, 
        ST_Y(ST_Centroid(areas.way_union)) as lat, areas.s as squares_count, areas.t as tourism_count,
        capitals.name as capital_name, capitals.osm_id as capital_osm_id, ST_AsGeoJSON(capitals.way) as capital_geojson, ST_Area(areas.way_union::geography) as area 
        FROM (
            SELECT polys.osm_id, polys.name, ST_Collect(ST_Simplify(polys.way, $2)) as way_union, SUM(squares_count_cache) as s, 
            SUM(tourist_places_count_cache) as t
            FROM planet_osm_polygon as polys
            
            WHERE polys.boundary = 'administrative' AND polys.admin_level = $1 ${boundsCondition}
            GROUP BY polys.osm_id, polys.name
        ) as areas
                                                                                                                        
        
        LEFT JOIN planet_osm_point as capitals 																						   
        ON ST_Contains(areas.way_union, capitals.way) AND capitals.name is not null AND capitals.capital = $1
        LIMIT 120`
        :
        `
        SELECT polys.osm_id, polys.name, ST_AsGeoJSON(ST_Collect(ST_Simplify(polys.way, $2))) as geojson, ST_X(ST_Centroid(ST_Collect(ST_Simplify(polys.way, $2)))) as lng, 
        ST_Y(ST_Centroid(ST_Collect(ST_Simplify(polys.way, $2)))) as lat, sum(polys.squares_count_cache) as squares_count,
        SUM(polys.tourist_places_count_cache) as tourism_count, ST_Area(ST_Collect(ST_Simplify(polys.way, $2))::geography) as area 
        FROM planet_osm_polygon as polys
        
        WHERE polys.boundary = 'administrative' AND polys.admin_level = $1 ${boundsCondition}
        GROUP BY polys.osm_id, polys.name
        LIMIT 130
        `;
        let {rows} = await db.query(sql, [level.admin_level, level.simplificationTolerance].concat(bounds));

        ctx.body = rows.map(function (r) {
            r.geojson = JSON.parse(r.geojson);
            r.squares_count = parseInt(r.squares_count);
            r.tourism_count = parseInt(r.tourism_count);
            if (r.hasOwnProperty('capital_geojson')) {
                r.capital_geojson = JSON.parse(r.capital_geojson);
            }
            return r;
        });
    }
}

/**
 * Get a polygon/area by osm_id
 *
 * @returns {getArea}
 */
function getArea() {
    return async function getArea(ctx, next) {
        let id = ctx.params.id;
        let sql = `
            SELECT *, ST_Area(way::geography) as area FROM planet_osm_polygon
            WHERE osm_id = $1
        `;

        let {rows} = await db.query(sql, [id]);
        ctx.body = rows.length ? rows[0] : null;
    }
}

/**
 * Get polygons tagged as place=square in an area defined by bounds array
 *
 * @returns {getSquares}
 */
function getSquares() {
    return async function getSquares(ctx, next) {
        let bounds = ctx.query.bounds || [];
        let boundsCondition = (bounds.length) ? 'AND ST_Intersects(ST_MakeEnvelope($1, $2, $3, $4, ST_SRID(squares.way)), squares.way)' : '';

        if (!bounds.length) {
            ctx.body = {
                error: "Bounds are required."
            };
            return;
        }

        let sql = `
        SELECT squares.osm_id, squares.name, ST_AsGeoJSON(squares.way) as geojson, ST_Area(way::geography) as area, squares.place,
        ST_X(ST_Centroid(squares.way)) as lng, ST_Y(ST_Centroid(squares.way)) as lat
        FROM planet_osm_polygon as squares
        
        WHERE squares.name is not null AND squares.place = 'square' AND squares.osm_id > 0 ${boundsCondition}
        
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
    getSummaryOfAreas,
    getSquares,
    getArea
};