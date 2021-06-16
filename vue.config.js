// vue.config.js

//三个插件
//npm uninstall compression-webpack-plugin
//npm i -D compression-webpack-plugin@5.0.1
//npm i -D image-webpack-loader
//npm uninstall image-webpack-loader
//cnpm install image-webpack-loader --save-dev
//yarn add image-webpack-loader --dev
//yarn add gifsicle
//yarn add mozjpeg

//npm i -D webpack-bundle-analyzer

const IS_PROD = ['production', 'prod'].includes(process.env.NODE_ENV);
const CompressionWebpackPlugin = require("compression-webpack-plugin"); // 开启gzip压缩， 按需引用
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i; // 开启gzip压缩， 按需写入
//const path =  require('path');
//const resolve = (dir) => path.join(__dirname, dir);
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin; // 打包分析
/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
    // 选项...

    publicPath: process.env.NODE_ENV === 'production' ? '/site/vue-demo/' : '/',  // 公共路径
    outputDir: process.env.outputDir || 'dist', // 'dist', 生产环境构建文件的目录
    assetsDir: 'static', // 相对于outputDir的静态资源(js、css、img、fonts)目录
    indexPath: 'index.html' , // 相对于打包路径index.html的路径
    filenameHashing: true, // 生成的静态资源在它们的文件名中包含了 hash 以便更好的控制缓存
    //pages: {} //在 multi-page 模式下构建应用。
    lintOnSave: false, // 是否在开发环境下通过 eslint-loader 在每次保存时 lint 代码
    runtimeCompiler: true, // 是否使用包含运行时编译器的 Vue 构建版本
    //transpileDependencies 默认情况下 babel-loader 会忽略所有 node_modules 中的文件。如果你想要通过 Babel 显式转译一个依赖，可以在这个选项中列出来。
    productionSourceMap: !IS_PROD, // 生产环境的 source map 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建。
    //crossorigin 设置生成的 HTML 中 <link rel="stylesheet"> 和 <script> 标签的 crossorigin 属性。
    //integrity 在生成的 HTML 中的 <link rel="stylesheet"> 和 <script> 标签上启用 Subresource Integrity (SRI)。如果你构建后的文件是部署在 CDN 上的，启用该选项可以提供额外的安全性。
    configureWebpack: config => {
        // 开启 gzip 压缩 有兼容问题，所以带上版本号
        // 需要 npm i -D compression-webpack-plugin@5.0.1
        const plugins = [];
        if (IS_PROD) {
            plugins.push(
                new CompressionWebpackPlugin({
                    filename: "[path].gz[query]", //目标资源名称
                    algorithm: "gzip",
                    test: productionGzipExtensions, //处理所有匹配此 {RegExp} 的资源
                    threshold: 10240, //只处理比这个值大的资源。按字节计算 10k
                    minRatio: 0.8 //只有压缩率比这个值小的资源才会被处理
                })
            );
        }
        config.plugins = [...config.plugins, ...plugins];
    },
    chainWebpack: config => {
        // 压缩图片
        // 需要 npm i -D image-webpack-loader
        config.module
            .rule("images")
            .test(/\.(gif|png|jpe?g|svg)$/i)
            .use('image-webpack-loader')
            .loader('image-webpack-loader')
            .options({
                mozjpeg: {
                    progressive: true,
                    quality: 50
                },
                optipng: {
                    enabled: true,
                },
                pngquant: {
                    quality: [0.5, 0.65],
                    speed: 4
                },
                gifsicle: {
                    interlaced: false,
                },
                // 不支持WEBP就不要写这一项
                webp: {
                    quality: 75
                }
            })
            .end()
        if (IS_PROD) {

            // 打包分析 npm install --save-dev webpack-bundle-analyzer
            // 打包之后自动生成一个名叫report.html文件(可忽视)
            config.plugin("webpack-report").use(BundleAnalyzerPlugin, [
                {
                    analyzerMode: "static"
                }
            ]);
        }
    },
    css: {
        //modules 从 v4 起已弃用，请使用css.requireModuleExtension
        requireModuleExtension: false,// 去掉文件名中的 .module
        extract: IS_PROD, //是否将组件中的 CSS 提取至一个独立的 CSS 文件中
        sourceMap: true, //是否为 CSS 开启 source map。设置为 true 之后可能会影响构建的性能。
        loaderOptions: {
            // 给 sass-loader 传递选项
            sass: {
                // @/ 是 src/ 的别名
                // 所以这里假设你有 `src/variables.sass` 这个文件
                // 注意：在 sass-loader v8 中，这个选项名是 "prependData" additionalData
                prependData: `@import "~@/variables.sass"`
            },
            // 默认情况下 `sass` 选项会同时对 `sass` 和 `scss` 语法同时生效
            // 因为 `scss` 语法在内部也是由 sass-loader 处理的
            // 但是在配置 `prependData` 选项的时候
            // `scss` 语法会要求语句结尾必须有分号，`sass` 则要求必须没有分号
            // 在这种情况下，我们可以使用 `scss` 选项，对 `scss` 语法进行单独配置
            scss: {
                prependData: `@import "~@/variables.scss";`
            },
            /*// 给 less-loader 传递 Less.js 相关选项
            less: {
                // `globalVars` 定义全局对象，可加入全局变量
                globalVars: {
                    primary: '#333'
                }
            },*/
         }
    },
    devServer: {
        // proxy: 'http://localhost:8080'   // 配置跨域处理,只有一个代理
        proxy: { //配置多个跨域
            "/api": {
                target: "http://172.11.11.11:7071",
                changeOrigin: true,
                // ws: true,//websocket支持
                secure: false,
                pathRewrite: {
                    "^/api": "/"
                }
            },
            "/api2": {
                target: "http://172.12.12.12:2018",
                changeOrigin: true,
                //ws: true,//websocket支持
                secure: false,
                pathRewrite: {
                    "^/api2": "/"
                }
            },
        },
        overlay: { // 让浏览器 overlay 同时显示警告和错误
            warnings: true,
            errors: true
        },
        host: "localhost",
        port: 8080, // 端口号
        https: false, // https:{type:Boolean}
        open: true, //配置自动启动浏览器
        hotOnly: true, // 热更新
    },
    parallel: require("os").cpus().length > 1, // 是否为 Babel 或 TypeScript 使用 thread-loader。该选项在系统的 CPU 有多于一个内核时自动启用，仅作用于生产构建。
    pwa: {}, // 向 PWA 插件传递选项。 https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-pwa
    // pluginOptions 这是一个不进行任何 schema 验证的对象，因此它可以用来传递任何第三方插件选项。
}
