<template>
    <el-container id="map">
        <el-card id="map-search" class="box-card" shadow="always">
            <div>
                <el-collapse-transition>
                    <el-form v-show="showSearch" style="margin-bottom: 1rem;">
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
                lng: 0,
                lat: 0,
                zoom: 5,
                showSearch: true
            }
        },
        mounted() {
            var self = this;

            mapboxgl.accessToken = "pk.eyJ1IjoicHBpc2Vja3kiLCJhIjoiY2ptbHFtaWQ5MGE4ejNwb2U2bjhjZTFndCJ9.OeB2WcaYoizROXfGgDGhgw";
            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v9',
                center: [self.lng, self.lat],
                zoom: self.zoom
            });
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