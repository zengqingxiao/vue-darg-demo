<template>
    <div class="component-list" @dragstart="handleDragStart">
        <div
            v-for="(item, index) in componentList"
            :key="index"
            class="list"
            draggable 
            :data-index="index"
        >
            <span class="iconfont" :class="'icon-' + item.icon"></span>
            <span>{{ item.label }}</span>
        </div>
    </div>
</template>

<script>
import componentList from '@/custom-component/component-list'

export default {
    data() {
        return {
            componentList,
        }
    },
    methods: {
        handleDragStart(e) {
            e.dataTransfer.setData('index', e.target.dataset.index)
        },
    },
}
</script>

<style lang="scss" scoped>
.component-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 10px;

    .list {
        font-size: 12px;
        color: hsla(0, 0%, 100%, 0.6);
        display: flex;
        flex-direction: column;
        // width: 45%;
        flex-basis: 75px;
        border: 1px solid #ddd;
        cursor: grab;
        margin-bottom: 10px;
        text-align: center;
        // color: #333;
        padding: 2px 5px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:active {
            cursor: grabbing;
        }
        &:hover {
            color: hsla(0, 0%, 100%, 0.9);
        }
        .iconfont {
            margin-right: 4px;
            font-size: 20px;
        }

        .icon-wenben,
        .icon-tupian {
            font-size: 18px;
        }
    }
}
</style>