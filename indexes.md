```postgresql

DROP INDEX IF EXISTS planet_osm_polygon_admin_way_index;
DROP INDEX IF EXISTS planet_osm_polygon_place_index;

DROP INDEX IF EXISTS planet_osm_point_capitals_way_index;
DROP INDEX IF EXISTS planet_osm_point_tourism_index;
DROP INDEX IF EXISTS planet_osm_point_id_index;

CREATE INDEX planet_osm_polygon_admin_way_index ON planet_osm_polygon USING GIST (way) WHERE boundary = 'administrative' and admin_level IN ('4', '6', '8', '10');
CREATE INDEX planet_osm_polygon_place_index ON planet_osm_polygon USING BTREE(name, place);

CREATE INDEX planet_osm_point_capitals_way_index ON planet_osm_point USING GIST (way) WHERE name is not null and capital IN ('4', '6');
CREATE INDEX planet_osm_point_tourism_way_index ON planet_osm_point USING gist (tourism, way);
CREATE INDEX planet_osm_point_id_index ON planet_osm_point USING btree(osm_id) WHERE osm_id > 0;
```

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

```postgresql
UPDATE pgr_italy_2po_vertex
SET geog_vertex = geom_vertex::geography;

DROP INDEX IF EXISTS vertex_geog_index;
DROP INDEX IF EXISTS pgr_italy_ids_index;
DROP INDEX IF EXISTS pgr_italy_geom_way_index;

CREATE INDEX vertex_geog_index ON pgr_italy_2po_vertex USING GIST(geog_vertex);
CREATE INDEX pgr_italy_ids_index ON pgr_italy_2po_4pgr USING btree(id, source, target);
CREATE INDEX pgr_italy_geom_way_index ON pgr_italy_2po_4pgr USING gist(geom_way);
```

```
CLUSTER pgr_italy_2po_4pgr USING pgr_italy_geom_way_index;
CLUSTER pgr_italy_2po_vertex USING vertex_geog_index;
CLUSTER planet_osm_point USING planet_osm_point_tourism_way_index;
```