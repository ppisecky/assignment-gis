<template>
    <el-card class="box-card">
        <div slot="header" class="clearfix">
            <h3>
                {{entity.name}}<br>
                <small v-if="isSquare">Square</small>
                <small v-else>{{tourismLabel}}</small>
            </h3>

        </div>
        <span v-show="entity.area">Area: {{entity.area}}</span>
    </el-card>
</template>

<script>
    import _ from 'lodash'

    export default {
        name: "detail-card",
        props: ['entity'],
        computed: {
            isSquare: function () {
                return this.entity.hasOwnProperty('place') && this.entity.place === 'square';
            },
            tourismLabel: function () {
                return _.startCase(this.entity.tourism)
            }
        }
    }
</script>

<style scoped>

</style>