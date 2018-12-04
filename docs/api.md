API implementation can be found in `src/server/routes` folder.

The queries listed here serve as an example of the final query. They
contain parametrization placeholders (e.g. `$1`,  `$2` etc.) used by the `pg` package query builder to supplement real values for the final query.
The actual numbering and usage of the placeholders depends on the query parameters used when calling the API.

Queries supporting area bounds expect coordinates in this exact order: sw lng, sw lat, ne lng, ne lat

# Areas

## Get administrative regions with overview information
`GET /areas/summaries?type=regions&bounds[]=`

Provides polygon geometry with summary information for various administrative regions. When searching for `regions` or `provinces` the capital city is included.

Query for regions and provinces:
```sql
SELECT areas.osm_id, areas.name, way_union, ST_AsGeoJSON(areas.way_union) as geojson, ST_X(ST_Centroid(areas.way_union)) as lng,
ST_Y(ST_Centroid(areas.way_union)) as lat, areas.s as squares_count, areas.t as tourism_count,
capitals.name as capital_name, capitals.osm_id as capital_osm_id, ST_AsGeoJSON(capitals.way) as capital_geojson, ST_Area(areas.way_union::geography) as area
FROM (
    SELECT polys.osm_id, polys.name, ST_Collect(ST_Simplify(polys.way, $2)) as way_union, SUM(squares_count_cache) as s,
    SUM(tourist_places_count_cache) as t
    FROM planet_osm_polygon as polys

    WHERE polys.boundary = 'administrative' AND polys.admin_level = $1 AND ST_Intersects(ST_MakeEnvelope($3, $4, $5, $6, ST_SRID(polys.way)), polys.way)
    GROUP BY polys.osm_id, polys.name
) as areas


LEFT JOIN planet_osm_point as capitals
ON ST_Contains(areas.way_union, capitals.way) AND capitals.name is not null AND capitals.capital = $1
LIMIT 120
```

Query for municiaplities:
```sql
SELECT polys.osm_id, polys.name, ST_AsGeoJSON(ST_Collect(ST_Simplify(polys.way, $2))) as geojson, ST_X(ST_Centroid(ST_Collect(ST_Simplify(polys.way, $2)))) as lng,
ST_Y(ST_Centroid(ST_Collect(ST_Simplify(polys.way, $2)))) as lat, sum(polys.squares_count_cache) as squares_count,
SUM(polys.tourist_places_count_cache) as tourism_count, ST_Area(ST_Collect(ST_Simplify(polys.way, $2))::geography) as area
FROM planet_osm_polygon as polys

WHERE polys.boundary = 'administrative' AND polys.admin_level = $1 AND ST_Intersects(ST_MakeEnvelope($3, $4, $5, $6, ST_SRID(polys.way)), polys.way)
GROUP BY polys.osm_id, polys.name
LIMIT 130
```


## Get squares within an area defined by lng/lat coordinates
`GET /areas/squares?bounds[]=`

Provides polygons marked as `place=square` in an area defined by bounds.
```sql
SELECT squares.osm_id, squares.name, ST_AsGeoJSON(squares.way) as geojson, ST_Area(way::geography) as area, squares.place,
ST_X(ST_Centroid(squares.way)) as lng, ST_Y(ST_Centroid(squares.way)) as lat
FROM planet_osm_polygon as squares

WHERE squares.name is not null AND squares.place = 'square' AND squares.osm_id > 0 AND ST_Intersects(ST_MakeEnvelope($1, $2, $3, $4, ST_SRID(squares.way)), squares.way)

LIMIT 100
```


## Get polygon by id
`GET /areas/:id`

Searches for a polygon by the osm_id specified in `:id`
```sql
SELECT *, ST_Area(way::geography) as area FROM planet_osm_polygon
WHERE osm_id = $1
```

# Places

## Search for places by name and filterd by `tourism` tag
`GET /places/search?q=foo&tourism[]=`

Search for places by name and tourism tag values.
```sql
SELECT places.osm_id, places.name, ST_AsGeoJSON(places.way) as geojson, places.tourism,
ST_X(places.way) as lng, ST_Y(places.way) as lat
FROM planet_osm_point as places

WHERE places.name IS NOT null AND places.tourism IS NOT null AND places.tourism IN($1, $2, $3) AND places.osm_id > 0 AND places.name LIKE $1

LIMIT 10
```

## Find tourist places of certain types in an area defined by bounds
`GET /places/tourist?tourism[]=&bounds[]=`

Finds tourist points of desired type in an area defined by bounds
```sql
SELECT places.osm_id, places.name, ST_AsGeoJSON(places.way) as geojson, places.tourism,
ST_X(places.way) as lng, ST_Y(places.way) as lat
FROM planet_osm_point as places

WHERE places.name IS NOT null AND places.tourism IS NOT null places.tourism IN($1, $2, $3) AND places.osm_id > 0 AND ST_Intersects(ST_MakeEnvelope($4, $5, $6, $7, ST_SRID(places.way)), places.way)

LIMIT 200
```

## Get a point by id
`GET /places/:id`

Get a point by osm_id

```sql
SELECT * FROM planet_osm_point
WHERE osm_id = $1
```
# Lines

## Get roads surrounding a point within a predefined distance

`GET /lines/surrounding?bounds[]=`

Get lines surrounding a point identified by an osm_id (maximum distance restrictions apply). The search area can be further restricted by provididng bounds. The chosen distance restriction is arbitrary.
```sql
SELECT ST_AsGeoJSON(edges.geom_way) as geojson
FROM planet_osm_point as points

JOIN pgr_italy_2po_4pgr as edges
ON ST_DWithin(points.way, edges.geom_way, 0.01) AND ST_Intersects(ST_MakeEnvelope($2, $3, $4, $5, ST_SRID(edges.geom_way)), edges.geom_way)

WHERE points.osm_id = $1
```


## Find the shortest path between two points
`GET /lines/directions?source=&target=`

Attempts to find directions between two points.

First a source and target nodes closest to the points specified by the `source` and `target` osm_id's are found - 150m radius is used here to limit maximum node distance from the point.

```sql
SELECT (
           SELECT v.id
           FROM planet_osm_point as p

           JOIN pgr_italy_2po_vertex as v
           ON ST_DWithin(p.way::geography, v.geog_vertex, 150)

           WHERE p.osm_id = $1

           ORDER BY ST_Distance(p.way::geography, v.geog_vertex) ASC
           LIMIT 1
       ) as source,
       (
          SELECT v.id
          FROM planet_osm_point as p

          JOIN pgr_italy_2po_vertex as v
          ON ST_DWithin(p.way::geography, v.geog_vertex, 150)

          WHERE p.osm_id = $2

          ORDER BY ST_Distance(p.way::geography, v.geog_vertex) ASC
          LIMIT 1
      ) as as target
```

Using the newly found nodes a shortest path between them is searched for using `pgr_dijkstra` function from `pgRouting`. Note: The `pg` package parametrization doesn't work here because the values need to be injected into the string used as the first argument for dijkstra. This isn't a major problem because at this point these values are going to be results of the previous query - not user input.

```sql
SELECT ST_AsGeoJSON(ST_Union(edges.geom_way)) as geojson
FROM pgr_dijkstra(
    'SELECT id, source, target, cost, reverse_cost, geom_way FROM pgr_italy_2po_4pgr as edges,
    (SELECT ST_Expand(ST_Extent(geom_way),0.1) as box  FROM pgr_italy_2po_4pgr as lim  WHERE lim.source = ${source_node} OR lim.target = ${target_node}) as box
    WHERE edges.geom_way && box.box',
    $1, $2,
    FALSE
) as path
JOIN pgr_italy_2po_4pgr as edges
ON edges.id = path.edge
```