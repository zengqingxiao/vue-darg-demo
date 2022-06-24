<template>
    <div class="home">
        <Toolbar />

        <main>
            <!-- 左侧组件列表 -->
            <div class="left">
                <ComponentList />
            </div>
            <!-- 中间画布 -->
            <div class="center">
                <div
                    class="content"
                    @drop="handleDrop"
                    @dragover="handleDragOver"
                    @mousedown="handleMouseDown"
                    @mouseup="deselectCurComponent"
                >
                    <Editor />
                </div>
                <div class="adjustment">
                    <div class="slider">
                        <span class="label">画布比例：</span>
                        <!-- <span>scale</span>  -->
                        <div class="main"><el-slider v-model="scale" :max="200" @input="handleScaleChange"></el-slider></div>
                    </div>
                </div>
            </div>
            <!-- 右侧属性列表 -->
            <div class="right">
                <el-tabs v-model="activeName">
                    <el-tab-pane label="属性" name="attr">
                        <AttrList v-if="curComponent" />
                        <p v-else class="placeholder">请选择组件</p>
                    </el-tab-pane>
                    <el-tab-pane label="动画" name="animation">
                        <AnimationList v-if="curComponent" />
                        <p v-else class="placeholder">请选择组件</p>
                    </el-tab-pane>
                    <el-tab-pane label="事件" name="events">
                        <EventList v-if="curComponent" />
                        <p v-else class="placeholder">请选择组件</p>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </main>
    </div>
</template>

<script>
import Editor from '@/components/Editor/index'
import ComponentList from '@/components/ComponentList' // 左侧列表组件
import AttrList from '@/components/AttrList' // 右侧属性列表
import AnimationList from '@/components/AnimationList' // 右侧动画列表
import EventList from '@/components/EventList' // 右侧事件列表
import componentList from '@/custom-component/component-list' // 左侧列表数据
import Toolbar from '@/components/Toolbar'
import { deepCopy } from '@/utils/utils'
import { mapState } from 'vuex'
import generateID from '@/utils/generateID'
import { listenGlobalKeyDown } from '@/utils/shortcutKey'
import { divide, multiply } from 'mathjs'

export default {
    components: { Editor, ComponentList, AttrList, AnimationList, EventList, Toolbar },
    data() {
        return {
            activeName: 'attr',
            reSelectAnimateIndex: undefined,
            scale: 100,
        }
    },
    computed: mapState([
        'componentData',
        'curComponent',
        'isClickComponent',
        'canvasStyleData',
        'editor',
        'curComponentIndex',
    ]),
    created() {
        this.restore()
        // 全局监听按键事件
        listenGlobalKeyDown()
        this.scale = this.canvasStyleData.scale
    },
    methods: {
        restore() {
            // 用保存的数据恢复画布
            if (localStorage.getItem('canvasData')) {
                this.$store.commit('setComponentData', this.resetID(JSON.parse(localStorage.getItem('canvasData'))))
            }

            if (localStorage.getItem('canvasStyle')) {
                this.$store.commit('setCanvasStyle', JSON.parse(localStorage.getItem('canvasStyle')))
            }
        },

        resetID(data) {
            data.forEach(item => {
                item.id = generateID()
                if (item.component === 'Group') {
                    this.resetID(item.propValue)
                }
            })

            return data
        },

        handleDrop(e) {
            e.preventDefault()
            e.stopPropagation()
            const index = e.dataTransfer.getData('index')
            const rectInfo = this.editor.getBoundingClientRect()
            if (index) {
                const component = deepCopy(componentList[index])
                component.style.top = e.clientY - rectInfo.y
                component.style.left = e.clientX - rectInfo.x
                component.id = generateID()
                this.$store.commit('addComponent', { component })
                this.$store.commit('recordSnapshot')
            }
        },

        handleDragOver(e) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
        },

        handleMouseDown(e) {
            e.stopPropagation()
            this.$store.commit('setClickComponentStatus', false)
            this.$store.commit('setInEditorStatus', true)
        },

        deselectCurComponent(e) {
            if (!this.isClickComponent) {
                this.$store.commit('setCurComponent', { component: null, index: null })
            }

            // 0 左击 1 滚轮 2 右击
            if (e.button != 2) {
                this.$store.commit('hideContextMenu')
            }
        },
        format(value) {
            return multiply(value, divide(parseFloat(this.scale), 100))
        },
        handleScaleChange() {
            clearTimeout(this.timer)
            console.log('发生修改----')
            this.timer = setTimeout(() => {
                // 画布比例设一个最小值，不能为 0
                // eslint-disable-next-line no-bitwise
                this.scale = (~~this.scale) || 1
                const componentData = deepCopy(this.componentData)
                componentData.forEach(component => {
                    Object.keys(component.style).forEach(key => {
                        if (this.needToChange.includes(key)) {
                            // 根据原来的比例获取样式原来的尺寸
                            // 再用原来的尺寸 * 现在的比例得出新的尺寸
                            component.style[key] = this.format(this.getOriginStyle(component.style[key]))
                        }
                    })
                })

                this.$store.commit('setComponentData', componentData)
                // 更新画布数组后，需要重新设置当前组件，否则在改变比例后，直接拖动圆点改变组件大小不会生效 https://github.com/woai3c/vue-drag-demo/issues/74
                this.$store.commit('setCurComponent', { component: componentData[this.curComponentIndex], index: this.curComponentIndex })
                this.$store.commit('setCanvasStyle', {
                    ...this.canvasStyleData,
                    scale: this.scale,
                })
            }, 1000)
        },

    },
}
</script>

<style lang="scss" scoped>
.home {
    height: 100vh;
    background: #fff;

    main {
        height: calc(100% - 64px);
        position: relative;
        // position: flex;
        display: flex;
        
        .left {
            // position: absolute;
            // height: 100%;
            width: 100px;
            left: 0;
            top: 0;
            padding-top: 10px;
            background-color: #17191a;
            // border: 1px solid red;
        }

        .right {
            // position: absolute;
            height: 100%;
            width: 262px;
            // right: 0;
            // top: 0;
            background-color: #fff;
            // border: 1px solid red;
        }

        .center {
            flex: 1;
            // margin-left: 200px;
            // margin-right: 262px;
            background: #ebecf0;
            height: 100%;
            overflow: hidden;
          
            padding-top: 20px;
            // border: 1px solid red;
            // background-color: aqua;
            position: relative;
            // display: flex;
            // flex-direction: column;
            // justify-content: space-between;

            .content {
                height: calc(100% - 40px) ;
                padding-bottom: 15px;
                overflow-y: scroll;
            }
            .adjustment{
                border-top: 1px solid rgba(57,76,96,0.15);
                position: absolute;
                bottom:0px;
                left: 0px;
                right: 0px;
                height: 40px;
                padding: 0 10px;
                background-color: #fff;
                display: flex;
                // justify-content: self-end;
                justify-content: flex-end;
                .slider {
                    display: flex;
                    align-items: center;
                    width: 400px;
                    font-size: 14px;
                    // border: 1px solid red;
                    .label{
                        padding: 0 10px;
                    }
                    .main {
                        flex: 1;
                        // border: 1px solid red;
                    }
                    .el-slider__runway {

                    }
                }
            }
        }
    }

    .placeholder {
        text-align: center;
        color: #333;
    }
}
</style>
