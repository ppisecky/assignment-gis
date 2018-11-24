

```postgresql
DROP INDEX IF EXISTS planet_osm_polygon_admin_way_index;
DROP INDEX IF EXISTS planet_osm_polygon_place_index;

DROP INDEX IF EXISTS planet_osm_point_capitals_way_index;
DROP INDEX IF EXISTS planet_osm_point_tourism_index;

CREATE INDEX planet_osm_polygon_admin_way_index ON planet_osm_polygon USING GIST (way) WHERE boundary = 'administrative' and admin_level IN ('4', '6', '8', '10');
CREATE INDEX planet_osm_polygon_place_index ON planet_osm_polygon USING BTREE(name, place);

CREATE INDEX planet_osm_point_capitals_way_index ON planet_osm_point USING GIST (way) WHERE name is not null and capital IN ('4', '6');
CREATE INDEX planet_osm_point_tourism_index ON planet_osm_point USING BTREE (tourism);

```