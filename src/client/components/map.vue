<template>
  <div>
    <el-container id="map">
      <el-aside
        id="map-search"
        class="box-card"
        shadow="always"
        width="26rem"
        style="max-height: 80vh;"
      >
        <el-card v-show="!selectedItem">
          <el-form style="margin-bottom: 1rem;">
            <el-collapse-transition>
              <el-form-item v-show="viewType === 'detail' || showSearch">
                <el-select
                  v-model="selectedTourismOptions"
                  multiple
                  placeholder="Select"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="item in formattedTourismOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-collapse-transition>
            <el-collapse-transition>
              <div v-show="showSearch">
                <el-form-item>
                  <el-input placeholder="Please input" v-model="searchQuery">
                    <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
                  </el-input>
                </el-form-item>
                <ul>
                  <li v-for="result in searchResults" @click="selectItem(result)">
                    {{result.name}}
                    ({{result.tourism}})
                  </li>
                </ul>
              </div>
            </el-collapse-transition>
          </el-form>
          <el-button
            id="toggle-map-search"
            @click="showSearch = !showSearch"
            type="primary"
            size="small"
            plain
          >
            <i class="el-icon-arrow-down" v-show="showSearch === false"></i>
            <i class="el-icon-arrow-up" v-show="showSearch === true"></i>
            Toggle search
          </el-button>
        </el-card>
        <detail-card
          @close-detail="onDetailClose"
          id="detail-card"
          v-if="selectedItem"
          :entity="selectedItem"
          :isSquare="isSelectedSquare"
        ></detail-card>
        <br>
        <el-card v-show="viewType === 'overview'" v-loading="loading">
          <overview-table
            :overview="overview"
            :levelHasCapitals="overviewLevelHasCapitals"
            @areaSelected="handleCurrentAreaChange"
          ></overview-table>
        </el-card>
        <br>
        <el-card
          v-show="viewType === 'detail'"
          v-loading="loading"
          style="max-height: 400px; overflow: auto;"
        >
          <div v-show="!selectedItem" id="tourism-squares">
            <h2>
              Squares
              <small>{{detail.squares.length}}</small>
            </h2>
            <el-tree :data="detail.squares" :props="treeProps" @node-click="selectItem"></el-tree>
          </div>

          <div id="tourism-places">
            <h2>
              Tourism
              <small>
                {{detail.places.length}}
                <span v-show="detail.places.length >= 200">+</span>
              </small>
            </h2>
            <el-tree :data="placesTree" :props="treeProps" @node-click="selectItem" accordion>
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <span
                  class="tourism-node-legend"
                  :style="{'background-color': (data.children && data.tourism) ? tourismColorMap[data.tourism] : false }"
                ></span>
                <span class="place-label"
                  :style="{'color': (data.children && data.tourism) ? tourismColorMap[data.tourism] : false }"
                >{{ node.label }}</span>
                <el-button
                  v-show="!data.children && selectedItem && !isSelectedSquare && data.osm_id !== selectedItem.osm_id"
                  icon="el-icon-share"
                  type="text"
                  size="mini"
                  @click="showDirections(data.osm_id)"
                >Directions</el-button>
              </span>
            </el-tree>
          </div>
        </el-card>
      </el-aside>
    </el-container>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import _ from "lodash";
import DetailCard from "./detail-card";
import OverviewTable from "./overview-table";

export default {
  name: "map-italy",
  components: { OverviewTable, DetailCard },
  data() {
    return {
      selectedItem: null,
      searchQuery: "",
      searchResults: [],
      loading: true,
      maxBounds: [
        [-1.7358332999918105, 41.95301874211924],
        [26.389166699999663, 48.72146820328723]
      ],
      directionsLayer: "directions",
      streetsLayer: "streets",
      primaryColor: "#4d05e8",
      tourismOptions: [
        "alpine_hut",
        "apartment",
        "attraction",
        "bed_and_breakfast",
        "camp_site",
        "caravan_site",
        "gallery",
        "guest_house",
        "hostel",
        "hotel",
        "chalet",
        "information",
        "motel",
        "museum",
        "picnic_site",
        "theme_park",
        "viewpoint",
        "wilderness_hut",
        "zoo"
      ],
      selectedTourismOptions: [],
      tourismColorMap: {
        alpine_hut: "#f5e51b",
        apartment: "#f5e51b",
        artwork: "#f22613",
        attraction: "#a537fd",
        bed_and_breakfast: "#f5e51b",
        camp_site: "#2ecc71",
        caravan_site: "#2ecc71",
        gallery: "#f5e51b",
        guest_house: "#f5e51b",
        hostel: "#f5e51b",
        hotel: "#f5e51b",
        chalet: "#f5e51b",
        information: "#19b5fe",
        motel: "#f5e51b",
        museum: "#f22613",
        picnic_site: "#2ecc71",
        theme_park: "#a537fd",
        viewpoint: "#2ecc71",
        wilderness_hut: "#2ecc71",
        zoo: "#1e824c"
      },
      tourismSpriteMap: {
        alpine_hut: "lodging-15",
        apartment: "lodging-15",
        artwork: "art-gallery-15",
        attraction: "amusement-park-15",
        bed_and_breakfast: "lodging-15",
        camp_site: "park-15",
        caravan_site: "park-15",
        gallery: "lodging-15",
        guest_house: "lodging-15",
        hostel: "lodging-15",
        hotel: "lodging-15",
        chalet: "lodging-15",
        information: "information-15",
        motel: "lodging-15",
        museum: "museum-15",
        picnic_site: "park-15",
        theme_park: "amusement-park-15",
        viewpoint: "park-15",
        wilderness_hut: "park-15",
        zoo: "zoo-15"
      },
      hoverStateId: null,
      treeProps: {
        children: "children",
        label: "name"
      },
      overviewLevels: [
        {
          from: 0,
          to: 8,
          level: "regions",
          next: "provinces"
        },
        {
          from: 8,
          to: 11,
          level: "provinces",
          next: "municipalities"
        },
        {
          from: 11,
          to: 12,
          level: "municipalities",
          next: "districts"
        }
      ],
      map: null,
      coordinates: {
        lng: 12.3266667,
        lat: 45.4386111
      },
      zoom: 6,
      showSearch: true,
      overview: {
        level: "regions",
        data: [],
        layer: "overview_areas",
        pointsLayer: "overview_points"
      },
      detail: {
        squaresLayer: "detail-squares",
        squares: [],
        placesLayer: "detail-places",
        places: []
      }
    };
  },
  methods: {
    refreshView: async function() {
      if (this.viewType === "overview") {
        this.removeDetailData();
        this.refreshOverview();
      } else {
        this.removeOverviewData();
        this.refreshDetail();
      }
    },
    removeOverviewData: function() {
      let mockData = {
        type: "FeatureCollection",
        features: []
      };

      this.map.getSource(this.overview.layer).setData(mockData);
      this.map.getSource(this.overview.pointsLayer).setData(mockData);
    },
    removeDetailData: function() {
      let mockData = {
        type: "FeatureCollection",
        features: []
      };

      this.map.getSource(this.detail.placesLayer).setData(mockData);
      this.map.getSource(this.detail.squaresLayer).setData(mockData);
      this.map.getSource(this.directionsLayer).setData(mockData);
      this.removeStreetsData();
    },
    removeStreetsData: function() {
      let mockData = {
        type: "FeatureCollection",
        features: []
      };
      this.map.getSource(this.streetsLayer).setData(mockData);
    },
    refreshOverview: async function() {
      let level = (this.overview.level = this.overviewLevel.level),
        map = this.map,
        layerId = this.overview.layer,
        pointsLayerId = this.overview.pointsLayer;

      this.loading = true;
      let data = (this.overview.data = await this.fetchOverview(level));

      map.getSource(layerId).setData({
        type: "FeatureCollection",
        features: data.map(function(e) {
          return {
            type: "Feature",
            geometry: e.geojson,
            id: Math.abs(e.osm_id),
            properties: {
              lat: e.lat,
              lng: e.lng
            }
          };
        })
      });

      map.getSource(pointsLayerId).setData({
        type: "FeatureCollection",
        features: data
          .filter(e => e.capital_geojson)
          .map(function(e) {
            return {
              type: "Feature",
              geometry: e.capital_geojson
            };
          })
      });

      this.loading = false;
    },
    refreshDetail: async function() {
      this.loading = true;
      this.detail.squares = await this.fetchSquares();
      this.detail.places = await this.fetchTouristPlaces();

      this.map.getSource(this.detail.squaresLayer).setData({
        type: "FeatureCollection",
        features: this.detail.squares.map(function(e) {
          return {
            type: "Feature",
            geometry: e.geojson,
            id: Math.abs(e.osm_id),
            properties: {
              lat: e.lat,
              lng: e.lng
            }
          };
        })
      });

      this.map.getSource(this.detail.placesLayer).setData({
        type: "FeatureCollection",
        features: this.detail.places.map(function(e) {
          return {
            type: "Feature",
            geometry: e.geojson,
            id: Math.abs(e.osm_id),
            properties: {
              lat: e.lat,
              lng: e.lng,
              tourism: e.tourism,
              name: e.name
            }
          };
        })
      });
      this.loading = false;

      if (this.selectedItem) {
        this.showSurroundingEdges(this.selectedItem.osm_id);
      }
    },
    handleCurrentAreaChange: function(area) {
      if (area) {
        let zoom = this.nextOverviewLevel
          ? this.nextOverviewLevel.from
          : this.detailZoomLevel;
        this.map.flyTo({
          center: { lng: area.lng, lat: area.lat },
          zoom: zoom
        });
      }
    },
    selectItem: function(item) {
      if (item.hasOwnProperty("children")) {
        return;
      }
      this.selectedItem = item;
      this.map.flyTo({ center: { lng: item.lng, lat: item.lat }, zoom: 16.5 });
    },
    showSurroundingEdges: async function(osm_id) {
      let data = await this.fetchSurroundingEdges({
        osm_id: osm_id,
        bounds: this.bounds
      });

      this.map.getSource(this.streetsLayer).setData({
        type: "FeatureCollection",
        features: data.map(function(e) {
          return {
            type: "Feature",
            geometry: e.geojson
          };
        })
      });
    },
    showDirections: async function(osm_id) {
      let params = {
        source: this.selectedItem.osm_id,
        target: osm_id
      };
      console.log(params);
      let directions = await this.fetchDirections(params);

      if (!directions.length || !directions[0].geojson) {
        this.$toast.error("No directions found.");
      }

      this.map.getSource(this.directionsLayer).setData({
        type: "FeatureCollection",
        features: directions.map(function(e) {
          return {
            type: "Feature",
            geometry: e.geojson,
            properties: {
              color: "red"
            }
          };
        })
      });
    },
    search: async function() {
      this.searchResults = await this.$axios.$get("/places/search", {
        params: {
          q: this.searchQuery,
          tourism: this.selectedTourismOptions.length
            ? this.selectedTourismOptions
            : this.tourismOptions
        }
      });
    },
    fetchOverview: async function(overviewLevel) {
      return await this.$axios.$get("/areas/summaries", {
        params: {
          type: overviewLevel,
          bounds: this.bounds
        }
      });
    },
    fetchSquares: async function() {
      return await this.$axios.$get("/areas/squares", {
        params: {
          bounds: this.bounds
        }
      });
    },
    fetchTouristPlaces: async function() {
      return await this.$axios.$get("/places/tourist", {
        params: {
          bounds: this.bounds,
          tourism: this.selectedTourismOptions.length
            ? this.selectedTourismOptions
            : this.tourismOptions
        }
      });
    },
    fetchSurroundingEdges: async function(params) {
      return await this.$axios.$get("/lines/surrounding", {
        params: params
      });
    },
    fetchDirections: async function(params) {
      return await this.$axios.$get("/lines/directions", {
        params: params
      });
    },
    onDetailClose: function(e) {
      this.removeStreetsData();
      this.selectedItem = null;
    },
    onOverviewHover: function(e) {
      if (e.features.length > 0) {
        if (this.hoveredStateId) {
          this.map.setFeatureState(
            {
              source: this.overview.layer,
              id: this.hoveredStateId
            },
            { hover: false }
          );
        }

        this.hoveredStateId = e.features[0].id;
        this.map.setFeatureState(
          { source: this.overview.layer, id: this.hoveredStateId },
          { hover: true }
        );
      }
    },
    onOverviewMouseLeave: function(e) {
      if (this.hoveredStateId) {
        this.map.setFeatureState(
          { source: this.overview.layer, id: this.hoveredStateId },
          { hover: false }
        );
      }
      this.hoveredStateId = null;
    },

    initLayers: function() {
      let mockSource = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      };

      let layers = this.map.getStyle().layers;
      // Find the index of the first symbol layer in the map style
      let firstSymbolId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === "symbol") {
          firstSymbolId = layers[i].id;
          break;
        }
      }

      this.map.addLayer(
        {
          id: this.overview.layer,
          type: "fill",
          source: mockSource,
          paint: {
            "fill-color": this.primaryColor,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.8,
              0.4
            ]
          }
        },
        firstSymbolId
      );

      this.map.addLayer(
        {
          id: `${this.overview.layer}-outline`,
          type: "line",
          source: this.overview.layer,
          paint: {
            "line-color": "rgb(255, 208, 75)",
            "line-width": 1,
            "line-opacity": 0.6
          }
        },
        firstSymbolId
      );

      this.map.addLayer(
        {
          id: this.overview.pointsLayer,
          type: "circle",
          source: mockSource,
          paint: {
            "circle-radius": 6,
            "circle-color": "rgb(255, 208, 75)"
          }
        },
        firstSymbolId
      );

      this.map.addLayer(
        {
          id: this.detail.squaresLayer,
          type: "fill",
          source: mockSource,
          paint: {
            "fill-color": this.primaryColor,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              1,
              0.6
            ]
          }
        },
        firstSymbolId
      );

      this.map.addLayer({
        id: this.detail.placesLayer,
        type: "symbol",
        source: mockSource,
        layout: {
          "icon-image": [
            "match",
            ["get", "tourism"],
            ..._.flatten(_.toPairs(this.tourismSpriteMap)),
            "circle-15"
          ],
          "text-field": "{name}",
          "icon-anchor": "bottom",
          "text-size": 12
        },
        paint: {
          "icon-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1,
            0.6
          ],
          "icon-color": [
            "match",
            ["get", "tourism"],
            ..._.flatten(_.toPairs(this.tourismColorMap)),
            "#fff"
          ],
          "text-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1,
            0.6
          ],
          "text-color": [
            "match",
            ["get", "tourism"],
            ..._.flatten(_.toPairs(this.tourismColorMap)),
            "#fff"
          ]
        }
      });

      this.map.addLayer(
        {
          id: this.streetsLayer,
          type: "line",
          source: mockSource,
          paint: {
            "line-color": "#22ff22",
            "line-width": 3,
            "line-opacity": 0.6
          }
        },
        firstSymbolId
      );

      this.map.addLayer(
        {
          id: this.directionsLayer,
          type: "line",
          source: mockSource,
          paint: {
            "line-color": ["get", "color"],
            "line-width": 3,
            "line-opacity": 0.8
          }
        },
        firstSymbolId
      );
    },

    initMapListeners: function() {
      let self = this;

      this.map.on("mousemove", self.overview.layer, function(e) {
        self.onOverviewHover(e);
      });

      this.map.on("mouseleave", self.overview.layer, function() {
        self.onOverviewMouseLeave();
      });

      this.map.on("click", self.overview.layer, function(e) {
        self.handleCurrentAreaChange(e.lngLat);
      });

      this.map.on("zoomend", function() {
        let zoom = Math.floor(self.map.getZoom());
        if (self.zoom !== zoom) {
          self.zoom = zoom;
        }
      });

      this.map.on("moveend", function(e) {
        self.refreshView();
      });
    },
    isSquare: function(item) {
      return item.hasOwnProperty("place") && item.place === "square";
    }
  },
  watch: {
    zoom: function(zoom, oldZoom) {
      if (
        zoom !== oldZoom &&
        (!this.overviewLevel ||
          this.overviewLevel.level !== this.overview.level)
      ) {
        this.refreshView();
      }
    },
    selectedItem: function(item, oldItem) {
      if (oldItem) {
        let layer = this.isSquare(oldItem)
          ? this.detail.squaresLayer
          : this.detail.placesLayer;
        this.map.setFeatureState(
          {
            source: layer,
            id: oldItem.osm_id
          },
          { selected: false }
        );
      }

      if (item) {
        let layer = this.isSquare(item)
          ? this.detail.squaresLayer
          : this.detail.placesLayer;
        this.map.setFeatureState(
          { source: layer, id: item.osm_id },
          { selected: true }
        );
      }
    },
    selectedTourismOptions: function() {
      if (this.viewType === "detail") {
        this.refreshDetail();
      }
    }
  },
  computed: {
    detailZoomLevel: function() {
      return _.maxBy(this.overviewLevels, "to").to;
    },
    viewType: function() {
      return this.zoom >= this.detailZoomLevel ? "detail" : "overview";
    },

    overviewLevel: function() {
      let z = this.zoom;
      return _.find(this.overviewLevels, o => _.inRange(z, o.from, o.to));
    },

    nextOverviewLevel: function() {
      return _.find(this.overviewLevels, ["level", this.overviewLevel.next]);
    },

    overviewLevelHasCapitals: function() {
      return (
        this.overview.level === "regions" || this.overview.level === "provinces"
      );
    },

    bounds: function() {
      let bb = this.map.getBounds();
      return [bb._sw.lng, bb._sw.lat, bb._ne.lng, bb._ne.lat];
    },
    isSelectedSquare: function() {
      return this.isSquare(this.selectedItem);
    },
    placesTree: function() {
      let grouped = _.groupBy(this.detail.places, o => o.tourism);

      return _.keys(grouped).map(k => {
        return {
          name: _.startCase(k) + ` (${grouped[k].length})`,
          tourism: k,
          children: grouped[k]
        };
      });
    },
    formattedTourismOptions: function() {
      return this.tourismOptions.map(function(o) {
        return {
          value: o,
          label: _.startCase(o)
        };
      });
    }
  },
  mounted() {
    let self = this;

    mapboxgl.accessToken =
      "pk.eyJ1IjoicHBpc2Vja3kiLCJhIjoiY2ptbHFtaWQ5MGE4ejNwb2U2bjhjZTFndCJ9.OeB2WcaYoizROXfGgDGhgw";
    window.pdt_map = this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/ppisecky/cjp7h4xbl3iyy2ss0zbrz0gct",
      center: [this.coordinates.lng, this.coordinates.lat],
      zoom: this.zoom,
      maxBounds: this.maxBounds
    });

    this.map.on("load", function() {
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
  position: fixed;
  left: 1rem;
  top: 5rem;
  z-index: 1000;
  max-height: 60rem;
  width: 26rem;
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