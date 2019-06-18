const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");

const outputPath = path.resolve(__dirname, "dist");

let webpackOptions = {
    entry: {
        bundle: "./src/js/app.ts",
        pwaPacked: "./src/js/workers/pwaServiceWorker.ts"
    },
    output: {
        filename: "[name]-[hash].min.js",
        chunkFilename: "[name]-[chunkhash].min.js",
        path: outputPath,
        publicPath: ""
    },
    watch: false,
    watchOptions: {
        ignored: /node_modules/
    },
    stats: {
        colors: true
    },
    devServer: {
        contentBase: "./dist",
        hot: false
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: [/node_modules/, /pwaServiceWorker\.ts/]
            },
            {
                test: /pwaServiceWorker\.ts/,
                loader: "ts-loader",
                options: { configFile: "/src/js/workers/tsconfig.json" }
            },
            {
                test: /\.GraphAlgorithmWorker\.tsx?$/,
                use: { loader: "worker-loader" }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
        new BrowserSyncPlugin({
            host: "localhost",
            port: 80,
            server: { baseDir: ["dist"] }
        }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: "index.html",
            inject: false
        }),
        // Don't include momentjs since it isn't used by anything (but would otherwise get bundled
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CopyWebpackPlugin([
            {
                from: "./src/fonts/*",
                to: outputPath + "/fonts/",
                flatten: true
            },
            {
                from: "*.png"
            },
            {
                from: "*.ico"
            },
            {
                from: "./manifest.json"
            }
        ])
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all",
                    reuseExistingChunk: true
                }
            }
        }
    }
};

module.exports = () => {
    if (process.env.npm_lifecycle_script.toString().includes("development")) {
        webpackOptions.watch = true;
        webpackOptions.plugins.push(new webpack.NamedModulesPlugin());
    }

    return webpackOptions;
};
