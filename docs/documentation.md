# Overview

This application helps tourists navigate in Italy:
- display overview of administrative regions in Italy with number of points of interest and squares
- search tourist points by name
- filter tourist points by type
- get directions between two points

This is it in action:

![Screenshot](preview1.JPG)
![Screenshot](preview2.JPG)


The application has 2 separate parts, the client which is a [frontend web application](#frontend) using Vue.js and mapbox-gl and the Node.js + Koa [backend application](#backend) using Postgres + PostGIS to query data. The frontend application communicates with backend using a REST API.



# Frontend

The frontend application is a Vue.js app, which shows a mapbox.js widget. It provieds two view modes: overview and detail. The overview mode is a high-level (low zoom) view that displays region outlines at various levels with summary information for the regions being displayed. The detail level (high zoom) displays points of interest (from tourist perspective) and squares in the viewed area. Different types of points are displayed using different colors and icons to make navigation easier. In the detail view an item can be selected to get more information about it. Selected item can also be used to get directions to another nearby point of interest (if available).

All relevant frontend code is in the `src/client` folder. The most important file is then located in `pages/index.vue`.

# Backend

The backend application is written in JavaScript using Node.js and Koa. The server provides a simple API for the client to query data in the database. All relevant PG queries are located in `src/server/routes`.

## Data

The dataset used in this project comes from a pre-existing export of data from Open Street Maps (due to size limits imposed by the OSM exporter). I downloaded an extent north-eastern Italy (~450MB) and imported it using the `osm2pgsql`. 

File: `nord-est-latest.osm.pbf` (~450MB)

Source: [https://download.geofabrik.de/europe/italy/nord-est.html](https://download.geofabrik.de/europe/italy/nord-est.html)

* `planet_osm_point`: 2 940 764 rows
* `planet_osm_polygon`: 5 054 833 rows
* `planet_osm_line`: 1 357 901 rows

The resulting database has been further modified by introducting 2 new columns into the `planet_osm_polygon` table. Notes on how these columns can be seeded and maintined can be found in the more extensive [db documentation](database.md). The columns in question are:

* `squares_count_cache` - number of squares in the area (polygons, place=square)
* `tourist_places_count_cache` - number of tourist locations in the area (points, tourism != null)

The data was also additionally imported using the `osm2po` tool which creates a network of nodes and vertices for use in conjunction with the `pgRouting` extension. Following tables have been created:

* `pgr_italy_2po_4pgr`: ~ 1 111 072 rows
* `pgr_italy_2po_vertex`: ~ 905 308 rows

The vertices table `pgr_italy_2po_vertex` has been modified by the addition of a geographical column `geog_vertex` for searching verticies based on distance in meters.

