<template>
    <el-aside style="padding: 1rem">
        <el-radio-group v-model="isCollapse" style="margin-bottom: 20px;">
            <el-radio-button :label="false">expand</el-radio-button>
            <el-radio-button :label="true">collapse</el-radio-button>
        </el-radio-group>
        <el-menu default-active="2" class="el-menu-vertical-demo" :collapse="isCollapse">
            <el-menu-item index="1">
                <el-input placeholder="Discover something">
                    <el-button slot="append" icon="el-icon-search"></el-button>
                </el-input>
            </el-menu-item>
        </el-menu>
    </el-aside>
</template>

<script>
    export default {
        name: "sidebar",
        data() {
            return {
                isCollapse: false
            }
        }
    }
</script>

<style scoped>

</style>