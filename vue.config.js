const CompressionPlugin = require('compression-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'

const { resolve } = require('path')

module.exports = {
    publicPath: isProd ? '/vue-drag-demo' : './',
    configureWebpack: () => {
        if (isProd) {
            return {
                // output: {
                //     filename: './docs.js', // 输出文件名 
                //     path: resolve(__dirname, 'docs/js'), // 输出文件路径配置
                // },
                plugins: [
                    new CompressionPlugin({
                        test: /\.js$|\.html$|\.css$|\.jpg$|\.jpeg$|\.png/, // 需要压缩的文件类型
                        threshold: 10240, // 归档需要进行压缩的文件大小最小值，这个对 10K 以上的进行压缩
                        deleteOriginalAssets: false, // 是否删除原文件
                    }),
                ],
            }
        }
    },
}
