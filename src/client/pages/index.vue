<template>
    <el-container id="map">
        <el-card id="map-search" class="box-card" shadow="always">
            <div>
                <el-collapse-transition>
                    <el-form v-show="showSearch" style="margin-bottom: 1rem;">
                        <el-form-item>
                            <el-input placeholder="Please input" v-model="coordinates.lat">
                                <template slot="prepend">Lat</template>
                            </el-input>
                        </el-form-item>

                        <el-form-item>
                            <el-input placeholder="Please input" v-model="coordinates.lng">
                                <template slot="prepend">Lng</template>
                            </el-input>
                        </el-form-item>

                        <el-input placeholder="Please input"></el-input>
                    </el-form>
                </el-collapse-transition>
            </div>
            <el-button id="toggle-map-search" @click="showSearch = !showSearch" type="primary" size="small" plain>
                <i class="el-icon-arrow-down" v-show="showSearch === false"></i>
                <i class="el-icon-arrow-up" v-show="showSearch === true"></i>
                Toggle search
            </el-button>

        </el-card>
    </el-container>
</template>

<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';

    export default {
        data() {
            return {
                map: {},
                coordinates: {
                    lng: 0,
                    lat: 0
                },
                zoom: 9,
                showSearch: true
            }
        },
        mounted() {
            var self = this;

            mapboxgl.accessToken = "pk.eyJ1IjoicHBpc2Vja3kiLCJhIjoiY2ptbHFtaWQ5MGE4ejNwb2U2bjhjZTFndCJ9.OeB2WcaYoizROXfGgDGhgw";
            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v9',
                center: [self.coordinates.lng, self.coordinates.lat],
                zoom: self.zoom
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    self.coordinates.lat = position.coords.latitude;
                    self.coordinates.lng = position.coords.longitude;
                    self.map.flyTo({center: self.coordinates});
                });
            }
        }
    };
</script>

<style>
    #map{
        min-height: calc(100vh - 60px);
    }

    #map-search {
        position: absolute;
        left: 1rem;
        top: 1rem;
        z-index: 1000;
        max-height: 60rem;
        width: 20rem;
    }

    #toggle-map-search {
        width: 100%;
    }
</style>