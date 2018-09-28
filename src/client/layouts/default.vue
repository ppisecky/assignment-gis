<template>
    <el-container>
        <el-header style="background-color: #545c64;">
            <el-menu
                    default-active="index"
                    class="el-menu-demo"
                    mode="horizontal"
                    background-color="#545c64"
                    text-color="#fff"
                    active-text-color="#ffd04b">
                <el-menu-item index="index">
                    <nuxt-link to="/">
                        Map
                    </nuxt-link>
                </el-menu-item>
            </el-menu>
        </el-header>
        <el-container>
            <el-main id="main">
                <nuxt/>
            </el-main>
        </el-container>
    </el-container>
</template>

<style>
    body {
        margin: 0;
    }

    #main {
        padding: 0;
    }
</style>
<script>
    export default {}
</script>