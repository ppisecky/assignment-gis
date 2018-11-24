<template>
    <el-container id="map">
        <el-card id="map-search" class="box-card" shadow="always" style="max-height: 80vh;">
            <div>
                <el-collapse-transition>
                    <el-form v-loading="loading" v-show="showSearch" style="margin-bottom: 1rem;">
                        <small>zoom {{zoom}}</small>
                        <el-form-item>
                            <el-input placeholder="Please input"></el-input>
                        </el-form-item>

                        <div v-show="viewType === 'overview'">
                            <h2>Overview level: {{overview.level}}<br>
                                <small>{{overview.data.length}} results</small>
                            </h2>

                            <el-table
                                    :data="overview.data"
                                    stripe
                                    style="width: 100%"
                                    max-height="250"
                                    highlight-current-row
                                    @current-change="handleCurrentAreaChange">
                                <el-table-column
                                        prop="name"
                                        label="Name"
                                        fixed>
                                </el-table-column>
                                <el-table-column
                                        v-if="overviewLevelHasCapitals"
                                        prop="capital_name"
                                        label="Capital">
                                </el-table-column>
                            </el-table>
                        </div>

                        <div v-show="viewType === 'detail'">
                            <h2>Squares
                                <small>{{detail.squares.length}}</small>
                            </h2>
                            <el-tree :data="detail.squares" :props="treeProps" @node-click="selectItem"></el-tree>

                            <h2>Tourism
                                <small>{{detail.places.length}}<span v-show="detail.places.length >= 100">+</span>
                                </small>
                            </h2>
                            <el-tree :data="placesTree" :props="treeProps" @node-click="selectItem" accordion>
                                <span class="custom-tree-node" slot-scope="{ node, data }">
                                    <span class="tourism-node-legend"
                                          :style="{'background-color': (data.children && data.tourism) ? tourismColorMap[data.tourism] : false }"></span><span
                                        :style="{'color': (data.children && data.tourism) ? tourismColorMap[data.tourism] : false }">{{ node.label }}</span>
                                </span>
                            </el-tree>
                        </div>
                    </el-form>
                </el-collapse-transition>
            </div>
            <el-button id="toggle-map-search" @click="showSearch = !showSearch" type="primary" size="small" plain>
                <i class="el-icon-arrow-down" v-show="showSearch === false"></i>
                <i class="el-icon-arrow-up" v-show="showSearch === true"></i>
                Toggle search
            </el-button>

        </el-card>

        <detail-card id="detail-card" v-if="selectedItem" :entity="selectedItem"></detail-card>
    </el-container>
</template>

<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import _ from 'lodash';
    import DetailCard from "../components/detail-card";

    export default {
        components: {DetailCard},
        data() {
            return {
                selectedItem: null,
                loading: true,
                maxBounds: [
                    [-1.7358332999918105, 41.95301874211924],
                    [26.389166699999663, 48.72146820328723]
                ],
                primaryColor: '#4d05e8',
                tourismColorMap: {
                    "alpine_hut": "#f5e51b",
                    "apartment": '#f5e51b',
                    "artwork": '#f22613',
                    "attraction": "#a537fd",
                    "bed_and_breakfast": "#f5e51b",
                    "camp_site": "#2ecc71",
                    "caravan_site": "#2ecc71",
                    "gallery": "#f5e51b",
                    "guest_house": "#f5e51b",
                    "hostel": "#f5e51b",
                    "hotel": '#f5e51b',
                    "chalet": "#f5e51b",
                    "information": '#19b5fe',
                    "motel": "#f5e51b",
                    "museum": "#f22613",
                    "picnic_site": "#2ecc71",
                    "theme_park": "#a537fd",
                    "viewpoint": "#2ecc71",
                    "wilderness_hut": "#2ecc71",
                    "zoo": "#1e824c"
                },
                hoverStateId: null,
                treeProps:
                    {
                        children: 'children',
                        label:
                            'name'
                    }
                ,
                overviewLevels: [
                    {
                        from: 0,
                        to: 8,
                        level: 'regions',
                        next: 'provinces',
                    },
                    {
                        from: 8,
                        to: 11,
                        level: 'provinces',
                        next: 'municipalities',
                    },
                    {
                        from: 11,
                        to: 12,
                        level: 'municipalities',
                        next: 'districts',
                    }
                ],
                map:
                    {}
                ,
                coordinates: {
                    lng: 12.3266667,
                    lat:
                        45.4386111
                }
                ,
                zoom: 6,
                showSearch:
                    true,
                overview:
                    {
                        level: 'regions',
                        data:
                            [],
                        layer:
                            'overview_areas',
                        pointsLayer:
                            'overview_points'
                    }
                ,
                detail: {
                    squaresLayer: 'detail-squares',
                    squares:
                        [],
                    placesLayer:
                        'detail-places',
                    places:
                        []
                }
            }
        },
        methods: {
            refreshView: async function () {
                if (this.viewType === 'overview') {
                    this.removeDetailData();
                    this.refreshOverview();
                } else {
                    this.removeOverviewData();
                    this.refreshDetail();
                }
            },
            removeOverviewData: function () {
                this.map.getSource(this.overview.layer).setData({
                    'type': 'FeatureCollection',
                    'features': []
                });

                this.map.getSource(this.overview.pointsLayer).setData({
                    'type': 'FeatureCollection',
                    'features': []
                });
            },
            removeDetailData: function () {
                this.map.getSource(this.detail.placesLayer).setData({
                    'type': 'FeatureCollection',
                    'features': []
                });

                this.map.getSource(this.detail.squaresLayer).setData({
                    'type': 'FeatureCollection',
                    'features': []
                });
            },
            refreshOverview: async function () {
                let level = this.overview.level = this.overviewLevel.level, map = this.map,
                    layerId = this.overview.layer, pointsLayerId = this.overview.pointsLayer;

                this.loading = true;
                let data = this.overview.data = await this.fetchOverview(level);

                map.getSource(layerId).setData({
                    'type': 'FeatureCollection',
                    'features': data.map(function (e) {
                        return {
                            type: "Feature",
                            geometry: e.geojson,
                            id: Math.abs(e.osm_id),
                            properties: {
                                lat: e.lat,
                                lng: e.lng
                            }
                        }
                    })
                });

                map.getSource(pointsLayerId).setData({
                    'type': 'FeatureCollection',
                    'features': data.filter((e) => e.capital_geojson).map(function (e) {
                        return {
                            type: "Feature",
                            geometry: e.capital_geojson
                        }
                    })
                });

                this.loading = false;
            },
            refreshDetail: async function()  {
                this.loading = true;
                this.detail.squares = await this.fetchSquares();
                this.detail.places = await this.fetchTouristPlaces();

                this.map.getSource(this.detail.squaresLayer).setData({
                    'type': 'FeatureCollection',
                    'features': this.detail.squares.map(function (e) {
                        return {
                            type: "Feature",
                            geometry: e.geojson,
                            id: Math.abs(e.osm_id),
                            properties: {
                                lat: e.lat,
                                lng: e.lng
                            }
                        }
                    })
                });

                this.map.getSource(this.detail.placesLayer).setData({
                    'type': 'FeatureCollection',
                    'features': this.detail.places.map(function (e) {
                        return {
                            type: "Feature",
                            geometry: e.geojson,
                            id: Math.abs(e.osm_id),
                            properties: {
                                lat: e.lat,
                                lng: e.lng,
                                tourism: e.tourism
                            }
                        }
                    })
                });

                this.loading = false;
            },
            handleCurrentAreaChange: function (area) {
                if (area) {
                    let zoom = (this.nextOverviewLevel) ? this.nextOverviewLevel.from : 13;
                    this.map.flyTo({center: {lng: area.lng, lat: area.lat}, zoom: zoom});
                }
            },
            selectItem: function (item) {
                if (item.hasOwnProperty('children')) {
                    return;
                }
                this.selectedItem = item;
                this.map.flyTo({center: {lng: item.lng, lat: item.lat}, zoom: 16.5})
            },
            fetchOverview: async function (overviewLevel) {
                return await this.$axios.$get('/areas/summaries', {
                    params: {
                        type: overviewLevel,
                        bounds: this.bounds
                    }
                })
            },
            fetchSquares: async function () {
                return await this.$axios.$get('/areas/squares', {
                    params: {
                        bounds: this.bounds
                    }
                })
            },
            fetchTouristPlaces: async function () {
                return await this.$axios.$get('/places/tourist', {
                    params: {
                        bounds: this.bounds
                    }
                })
            },
            onOverviewHover: function (e) {
                if (e.features.length > 0) {
                    if (this.hoveredStateId) {
                        this.map.setFeatureState({
                            source: this.overview.layer,
                            id: this.hoveredStateId
                        }, {hover: false});
                    }

                    this.hoveredStateId = e.features[0].id;
                    this.map.setFeatureState({source: this.overview.layer, id: this.hoveredStateId}, {hover: true});
                }
            },
            onOverviewMouseLeave: function (e) {
                if (this.hoveredStateId) {
                    this.map.setFeatureState({source: this.overview.layer, id: this.hoveredStateId}, {hover: false});
                }
                this.hoveredStateId = null;
            },

            initLayers: function () {
                let mockSource = {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': []
                    }
                };

                let layers = this.map.getStyle().layers;
                // Find the index of the first symbol layer in the map style
                let firstSymbolId;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].type === 'symbol') {
                        firstSymbolId = layers[i].id;
                        break;
                    }
                }

                this.map.addLayer({
                    'id': this.overview.layer,
                    'type': 'fill',
                    'source': mockSource,
                    'paint': {
                        'fill-color': this.primaryColor,
                        'fill-opacity': ["case", ["boolean", ["feature-state", "hover"], false], 0.4, 0.2]
                    }
                }, firstSymbolId);

                this.map.addLayer({
                    'id': `${this.overview.layer}-outline`,
                    'type': 'line',
                    'source': this.overview.layer,
                    'paint': {
                        'line-color': 'rgb(255, 208, 75)',
                        'line-width': 1,
                        'line-opacity': 0.6
                    }
                }, firstSymbolId);

                this.map.addLayer({
                    'id': this.overview.pointsLayer,
                    'type': 'circle',
                    'source': mockSource,
                    'paint': {
                        "circle-radius": 6,
                        "circle-color": "rgb(255, 208, 75)"
                    }
                }, firstSymbolId);

                this.map.addLayer({
                    'id': this.detail.squaresLayer,
                    'type': 'fill',
                    'source': mockSource,
                    'paint': {
                        'fill-color': this.primaryColor,
                        'fill-opacity': ["case", ["boolean", ["feature-state", "hover"], false], 0.8, 0.4]
                    }
                }, firstSymbolId);

                this.map.addLayer({
                    'id': this.detail.placesLayer,
                    'type': 'circle',
                    'source': mockSource,
                    'paint': {
                        // make circles larger as the user zooms from z12 to z22
                        'circle-radius': {
                            'base': 1.75,
                            'stops': [[this.detailZoomLevel, 2], [22, 90]]
                        },
                        // color circles by ethnicity, using a match expression
                        // https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
                        'circle-color': [
                            'match',
                            ['get', 'tourism'],
                            ..._.flatten(_.toPairs(this.tourismColorMap)),
                            /* other */ '#ccc'
                        ]
                    }
                });
            },

            initMapListeners: function () {
                let self = this;

                this.map.on("mousemove", self.overview.layer, function (e) {
                    self.onOverviewHover(e);
                });

                this.map.on("mouseleave", self.overview.layer, function () {
                    self.onOverviewMouseLeave();
                });

                this.map.on("click", self.overview.layer, function (e) {
                    self.handleCurrentAreaChange(e.lngLat);
                });

                this.map.on('zoomend', function () {
                    let zoom = Math.floor(self.map.getZoom());
                    if (self.zoom !== zoom) {
                        self.zoom = zoom;
                    }
                });

                this.map.on('moveend', function (e) {
                    if (e.hasOwnProperty('originalEvent')) {
                        self.refreshView();
                    }
                });
            }
        },
        watch: {
            'zoom': function (zoom, oldZoom) {
                if (zoom !== oldZoom && (!this.overviewLevel || this.overviewLevel.level !== this.overview.level)) {
                    this.refreshView();
                }

            }
        },
        computed: {
            detailZoomLevel: function () {
                return _.maxBy(this.overviewLevels, 'to').to;
            },
            viewType: function () {
                return this.zoom >= this.detailZoomLevel ? 'detail' : 'overview';
            },

            overviewLevel: function () {
                let z = this.zoom;
                return _.find(this.overviewLevels, (o) => _.inRange(z, o.from, o.to));
            },

            nextOverviewLevel: function () {
                return _.find(this.overviewLevels, ['level', this.overviewLevel.next]);
            },

            overviewLevelHasCapitals: function () {
                return this.overview.level === 'regions' || this.overview.level === 'provinces';
            },

            bounds: function () {
                let bb = this.map.getBounds();
                return [bb._sw.lng, bb._sw.lat, bb._ne.lng, bb._ne.lat];
            },

            placesTree: function () {
                let grouped = _.groupBy(this.detail.places, o => o.tourism);

                return _.keys(grouped).map(k => {
                    return {
                        name: _.startCase(k) + ` (${grouped[k].length})`,
                        tourism: k,
                        children: grouped[k]
                    }
                });
            }
        },
        mounted() {
            let self = this;

            mapboxgl.accessToken = "pk.eyJ1IjoicHBpc2Vja3kiLCJhIjoiY2ptbHFtaWQ5MGE4ejNwb2U2bjhjZTFndCJ9.OeB2WcaYoizROXfGgDGhgw";
            window.pdt_map = this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/dark-v9',
                center: [this.coordinates.lng, this.coordinates.lat],
                zoom: this.zoom,
                maxBounds: this.maxBounds
            });

            this.map.on('load', function () {
                self.loading = false;
                self.initLayers();
                self.initMapListeners();

                self.refreshView();
            });
        }
    };
</script>

<style>
    #map {
        min-height: calc(100vh - 60px);
    }

    #map-search {
        position: absolute;
        left: 1rem;
        top: 1rem;
        z-index: 1000;
        max-height: 60rem;
        width: 26rem;
    }

    #detail-card {
        position: absolute;
        left: 27.5rem;
        top: 1rem;
        z-index: 1000;
        max-height: 60rem;
        width: 16rem;
    }

    #toggle-map-search {
        width: 100%;
    }

    .tourism-node-legend {
        width: 8px;
        height: 8px;
        margin-right: 4px;
        border-radius: 50%;
        display: inline-block;
    }
</style>