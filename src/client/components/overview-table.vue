<template>
    <div>
        <h2>Overview level: {{overview.level}}<br>
            <small>{{overview.data.length}} results</small>
        </h2>
        <el-table
                :data="overview.data"
                :default-sort="{prop: 'tourism_count', order: 'ascending'}"
                width="100%"
                max-height="250"
                highlight-current-row
                @current-change="onCurrentChange">
            <el-table-column
                    sortable
                    prop="name"
                    label="Name"
                    width="150"
                    fixed>
            </el-table-column>
            <el-table-column
                    sortable
                    prop="tourism_count"
                    width="140"
                    label="Tourist places">
            </el-table-column>
            <el-table-column
                    sortable
                    prop="squares_count"
                    width="130"
                    label="Squares">
            </el-table-column>
            <el-table-column
                    v-if="levelHasCapitals"
                    prop="capital_name"
                    label="Capital">
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
    export default {
        name: "overview-table",
        props: ['overview', 'levelHasCapitals'],
        methods: {
            onCurrentChange(e) {
                this.$emit('areaSelected', e);
            }
        }
    }
</script>

<style scoped>

</style>