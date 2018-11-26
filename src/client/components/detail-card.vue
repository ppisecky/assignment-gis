<template>
    <el-card class="box-card" style="position: relative">
        <div slot="header" class="clearfix">
            <h3>
                {{entity.name}}<br>
                <small v-if="isSquare">Square</small>
                <small v-else>{{tourismLabel}}</small>
                <el-button class="close-button" size="mini" icon="el-icon-close" circle @click="$emit('close-detail')"></el-button>
            </h3>
        </div>

        <el-table
                v-show="properties.length"
                v-loading="loadingDetail"
                :data="properties"
                width="100%"
                max-height="200">
            <el-table-column
                    prop="key"
                    label="Property"
                    width="100"
                    fixed>
            </el-table-column>
            <el-table-column
                    prop="value"
                    label="Value"
                    width="150">
            </el-table-column>

        </el-table>
    </el-card>
</template>

<script>
    import _ from 'lodash'

    export default {
        name: "detail-card",
        props: ['entity', 'isSquare'],
        data() {
            return {
                blacklist: ['way', 'z_order', 'name'],
                entityDetail: {},
                loadingDetail: false
            }
        },
        methods: {
            fetchEntityDetail: async function () {
                this.loadingDetail = true;
                if (this.isSquare) {
                    this.entityDetail = await this.$axios.$get('/areas/' + this.entity.osm_id);
                } else {
                    this.entityDetail = await this.$axios.$get('/places/' + this.entity.osm_id);
                }
                this.loadingDetail = false;
            }
        },
        computed: {
            tourismLabel: function () {
                return _.startCase(this.entity.tourism)
            },
            properties: function () {
                let self = this;
                return _.toPairs(this.entityDetail).map(function (a) {
                    return {
                        'key': a[0],
                        'value': a[1]
                    }
                }).filter(function (o) {
                    return o.value && !_.includes(self.blacklist, o.key);
                });
            }
        },
        watch: {
            'entity' : function () {
                this.entityDetail = {};
                this.fetchEntityDetail();
            }
        },
        mounted() {
            this.fetchEntityDetail();
        }
    }
</script>

<style scoped>
    .close-button {
        position: absolute;
        right: 10px;
        top: 10px;
    }
</style>