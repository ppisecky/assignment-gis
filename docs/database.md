
# Indexing
Several indices were created to speed up query execution

## osm2pgsql tables

### planet_osm_polygon

```postgresql
CREATE INDEX planet_osm_polygon_admin_way_index ON planet_osm_polygon USING GIST (way) WHERE boundary = 'administrative' and admin_level IN ('4', '6', '8', '10');
CREATE INDEX planet_osm_polygon_place_index ON planet_osm_polygon USING BTREE(name, place);
```

### planet_osm_point

NOTE: the `planet_osm_point_tourism_way_index` requires the `btree_gist` extension to allow creation of combined regular/geo data type columns.

```postgresql
CREATE INDEX planet_osm_point_capitals_way_index ON planet_osm_point USING GIST (way) WHERE name is not null and capital IN ('4', '6');
CREATE INDEX planet_osm_point_tourism_way_index ON planet_osm_point USING gist (tourism, way);
CREATE INDEX planet_osm_point_id_index ON planet_osm_point USING btree(osm_id) WHERE osm_id > 0;
```

## osm2po tables

The tables imported by `osm2po` have a few indexes as well. Though in the case of `pgr_italy_2po_4pgr` these didn't seem to provide many performance improvements.

### pgr_italy_2po_vertex

```postgresql
CREATE INDEX vertex_geog_index ON pgr_italy_2po_vertex USING GIST(geog_vertex)
```

### pgr_italy_2po_4pgr

Multiple indices were created to attempt to speed up the performance of `pgr_dijkstra` but it seems like the algorithm loads the entire graph into the memory. 

```postgresql
CREATE INDEX pgr_italy_geom_way_index ON pgr_italy_2po_4pgr USING gist(geom_way);
CREATE INDEX pgr_italy_2po_id_index ON pgr_italy_2po_4pgr USING btree(id);
CREATE INDEX pgr_italy_2po_source_index ON pgr_italy_2po_4pgr USING btree(source);
CREATE INDEX pgr_italy_2po_target_index ON pgr_italy_2po_4pgr USING btree(target);
```

# Custom columns

3 new columns have been created in order to speed up query execution. 

## Seeding the columns 

This section describes ways to seed the custom columns created for this project.

### planet_osm_polygon

Two columns for maintaining a count of entities contained in certain polygons have been created: `squares_count_cache` and  `tourist_places_count_cache` (both `integer`). The following statements can be used to seed these values initially.

```postgresql
UPDATE planet_osm_polygon as areas SET squares_count_cache = (
	SELECT count(*)
	FROM planet_osm_polygon as squares
	WHERE squares.name IS NOT NULL AND squares.place = 'square' AND ST_Contains(areas.way, squares.way)
)

WHERE areas.boundary = 'administrative' AND areas.admin_level IN ('4', '6', '8', '10');
```

```postgresql
UPDATE planet_osm_polygon as areas SET tourist_places_count_cache = (
	SELECT count(*)
	FROM planet_osm_point as points
	WHERE points.name IS NOT NULL AND points.tourism IS NOT NULL AND ST_Contains(areas.way, points.way)
)

WHERE areas.boundary = 'administrative' AND areas.admin_level IN ('4', '6', '8', '10');
```

### pgr_italy_2po_vertex
A `geography` column called `geog_vertex` was added to allow for finding vertices in an area around points in `planet_osm_point` with a distance in meters.

```postgresql
UPDATE pgr_italy_2po_vertex
SET geog_vertex = geom_vertex::geography;
```

## Maintaining the columns with triggers

Though not required for this project the issue of maintaining the values of the counter columns can be considered. Use the following trigger SQL draft to maintain the values for the counter columns in `planet_osm_polygon`. This example only covers the `squares_count_cache` column. A simmilar trigger would have to be written for the `tourist_places_count_cache` column.

```postgresql
CREATE FUNCTION contained_squares_counter_cache_trg() RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE planet_osm_polygon SET squares_count_cache = squares_count_cache - 1 
	WHERE ST_Contains(way, old.way) AND old.place = 'square' 
	AND boundary = 'administrative' AND admin_level IN ('4', '6', '8', '10');
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE planet_osm_polygon SET squares_count_cache = squares_count_cache + 1 
	WHERE ST_Contains(way, new.way) AND new.place = 'square'
	AND boundary = 'administrative' AND admin_level IN ('4', '6', '8', '10');
  END IF;
  RETURN NULL;
END
$$
LANGUAGE plpgsql;

CREATE TRIGGER cache_contained_squares_counter
AFTER INSERT OR DELETE ON planet_osm_polygon
FOR EACH ROW
EXECUTE PROCEDURE contained_squares_counter_cache_trg();

CREATE TRIGGER cache_contained_squares_counter_update
AFTER UPDATE OF way ON planet_osm_polygon
FOR EACH ROW
WHEN (OLD.way IS DISTINCT FROM NEW.way)
EXECUTE PROCEDURE contained_squares_counter_cache_trg();
```

# Clustering

The following clustering was used in conjuction with `VACUUM` and `ANALYZE` in order to improve the performance of the queries.

```postgresql
CLUSTER pgr_italy_2po_4pgr USING pgr_italy_geom_way_index;
CLUSTER pgr_italy_2po_vertex USING vertex_geog_index;
CLUSTER planet_osm_point USING planet_osm_point_tourism_way_index;
```
