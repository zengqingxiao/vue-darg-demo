<template>
    <div>
        <div class="toolbar">
            <el-tooltip
                class="item"
                effect="dark"
                content="撤销"
                :open-delay="500"
                placement="bottom-start"
            >
                <div class="btn icon" @click="undo">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="m6.05 7.25 2.22-2.22A.75.75 0 0 0 7.2 3.97L4.43 6.75c-.69.68-.69 1.8 0 2.48l2.83 2.83A.75.75 0 0 0 8.32 11L6.07 8.75H16a4.25 4.25 0 1 1 0 8.5h-4a.75.75 0 1 0 0 1.5h4a5.75 5.75 0 0 0 0-11.5H6.05z"
                        >
                        </path>
                    </svg>
                </div>
            </el-tooltip>
            <el-tooltip
                class="item"
                effect="dark"
                content="重做"
                :open-delay="500"
                placement="bottom-start"
            >
                <div class="btn icon" @click="redo">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill="currentColor"
                            d="m18.054 7.252-2.296-2.296a.75.75 0 0 1 1.06-1.06l2.83 2.828a1.75 1.75 0 0 1 0 2.475l-2.832 2.831a.75.75 0 0 1-1.06-1.06l2.219-2.22H8a4.25 4.25 0 0 0 0 8.5h4a.75.75 0 0 1 0 1.5H8a5.75 5.75 0 0 1 0-11.5h10c.018 0 .036 0 .054.002Z"
                        >
                        </path>
                    </svg>
                </div>
            </el-tooltip>
            <el-popover placement="bottom-end" width="500" trigger="click">
                <div class="canvas-config">
                    <span>画布大小:</span>
                    <div class="input">
                        <el-input v-model="canvasStyleData.width" placeholder="宽度">
                            <template slot="append">像素</template>
                        </el-input>
                    </div>
                    <span>*</span>
                    <div class="input">
                        <el-input v-model="canvasStyleData.height" placeholder="请输入内容">
                            <template slot="append">像素</template>
                        </el-input>
                    </div>
                </div>
                <div slot="reference" class="btn">调整尺寸</div>
            </el-popover>
            <!-- <el-button @click="undo">撤消</el-button> -->
            <!-- <el-button @click="redo">重做</el-button> -->
            <label for="input" class="insert">导入图片</label>
            <input
                id="input"
                type="file"
                hidden
                @change="handleFileChange"
            />
            <el-button style="margin-left: 10px;" @click="preview">预览</el-button>
            <el-button @click="save">保存</el-button>
            <el-button @click="clearCanvas">清空画布</el-button>
            
            <el-button :disabled="!areaData.components.length" @click="compose">组合</el-button>
            <el-button
                :disabled="!curComponent || curComponent.isLock || curComponent.component != 'Group'"
                @click="decompose"
            >
                拆分
            </el-button>

            <el-button :disabled="!curComponent || curComponent.isLock" @click="lock">锁定</el-button>
            <el-button :disabled="!curComponent || !curComponent.isLock" @click="unlock">解锁</el-button>
        </div>

        <!-- 预览 -->
        <Preview v-model="isShowPreview" @change="handlePreviewChange" />
    </div>
</template>

<script>
import generateID from '@/utils/generateID'
import toast from '@/utils/toast'
import { mapState } from 'vuex'
import Preview from '@/components/Editor/Preview'
import { commonStyle, commonAttr } from '@/custom-component/component-list'
import eventBus from '@/utils/eventBus'
import { deepCopy } from '@/utils/utils'
import { divide, multiply } from 'mathjs'

export default {
    components: { Preview },
    data() {
        return {
            isShowPreview: false,
            needToChange: [
                'top',
                'left',
                'width',
                'height',
                'fontSize',
            ],
            scale: '100%',
            timer: null,
        }
    },
    computed: mapState([
        'componentData',
        'canvasStyleData',
        'areaData',
        'curComponent',
        'curComponentIndex',
    ]),
    created() {
        eventBus.$on('preview', this.preview)
        eventBus.$on('save', this.save)
        eventBus.$on('clearCanvas', this.clearCanvas)

        this.scale = this.canvasStyleData.scale
        console.log(this.scale, 'this.scale-----')
    },
    methods: {
        format(value) {
            return multiply(value, divide(parseFloat(this.scale), 100))
        },

        getOriginStyle(value) {
            return divide(value, divide(parseFloat(this.canvasStyleData.scale), 100))
        },

        handleScaleChange() {
            clearTimeout(this.timer)
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

        lock() {
            this.$store.commit('lock')
        },

        unlock() {
            this.$store.commit('unlock')
        },

        compose() {
            this.$store.commit('compose')
            this.$store.commit('recordSnapshot')
        },

        decompose() {
            this.$store.commit('decompose')
            this.$store.commit('recordSnapshot')
        },

        undo() {
            this.$store.commit('undo')
        },

        redo() {
            this.$store.commit('redo')
        },

        handleFileChange(e) {
            const file = e.target.files[0]
            if (!file.type.includes('image')) {
                toast('只能插入图片')
                return
            }

            const reader = new FileReader()
            reader.onload = (res) => {
                const fileResult = res.target.result
                const img = new Image()
                img.onload = () => {
                    this.$store.commit('addComponent', {
                        component: {
                            ...commonAttr,
                            id: generateID(),
                            component: 'Picture',
                            label: '图片',
                            icon: '',
                            propValue: fileResult,
                            style: {
                                ...commonStyle,
                                top: 0,
                                left: 0,
                                width: img.width,
                                height: img.height,
                            },
                        },
                    })

                    this.$store.commit('recordSnapshot')

                    // 修复重复上传同一文件，@change 不触发的问题
                    document.querySelector('#input').setAttribute('type', 'text')
                    document.querySelector('#input').setAttribute('type', 'file')
                }

                img.src = fileResult
            }

            reader.readAsDataURL(file)
        },

        preview() {
            this.isShowPreview = true
            this.$store.commit('setEditMode', 'preview')
        },

        save() {
            localStorage.setItem('canvasData', JSON.stringify(this.componentData))
            localStorage.setItem('canvasStyle', JSON.stringify(this.canvasStyleData))
            this.$message.success('保存成功')
        },

        clearCanvas() {
            this.$store.commit('setCurComponent', { component: null, index: null })
            this.$store.commit('setComponentData', [])
            this.$store.commit('recordSnapshot')
        },

        handlePreviewChange() {
            this.$store.commit('setEditMode', 'edit')
        },
    },
}
</script>

<style lang="scss" scoped>
.canvas-config {
    // display: inline-block;
    display: flex;
    margin-left: 10px;
    font-size: 14px;
    color: #606266;
    align-items: center;

    .input {
        width: 150px;
        margin-left: 10px;
        outline: none;
        padding: 0 5px;
        // border: 1px solid #ddd;
        color: #606266;
    }

    span {
        margin-left: 10px;
    }
}

.toolbar {
    padding: 10px;
    white-space: nowrap;
    overflow-x: auto;
    color: #fff;
    font-size: 14px;
    // background: #fff;
    // border-bottom: 1px solid #ddd;
    background: linear-gradient(to right, #00c4cc, #9e77f3, #7300e6);
    display: flex;
    align-items: center;

    .btn {
        padding: 8px;
        cursor: pointer;
        border-radius: 5px;

        &:hover {
            background-color: hsla(0, 0%, 100%, 0.1);
        }
    }

    .icon {
        // border: 1px solid red;
        height: 40px;
        width: 40px;
    }

    .insert {
        display: inline-block;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        background: #fff;
        border: 1px solid #dcdfe6;
        color: #606266;
        -webkit-appearance: none;
        text-align: center;
        box-sizing: border-box;
        outline: 0;
        margin: 0;
        transition: .1s;
        font-weight: 500;
        padding: 9px 15px;
        font-size: 12px;
        border-radius: 3px;
        margin-left: 10px;

        &:active {
            color: #3a8ee6;
            border-color: #3a8ee6;
            outline: 0;
        }

        &:hover {
            background-color: #ecf5ff;
            color: #3a8ee6;
        }
    }
}
</style>
