const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");

const outputPath = path.resolve(__dirname, "dist");

class HtmlWebpackBackwardsCompatibilityPlugin {
    apply(compiler) {
        compiler
            .hooks
            .compilation
            .tap("HtmlWebpackBackwardsCompatibilityPlugin", compilation => {
                HtmlWebpackPlugin
                    .getHooks(compilation)
                    .beforeAssetTagGeneration
                    .tapAsync("HtmlWebpackBackwardsCompatibilityPlugin", (data, callback) => {
                        const { publicPath } = data.assets;
                        data.assets.chunks = {};

                        for (const entryPoint of compilation.entrypoints.values()) {
                            for (const chunk of entryPoint.chunks) {
                                data.assets.chunks[chunk.name] = {
                                    entry: chunk.files
                                        .map(file => publicPath + file)
                                        .find(file => file.endsWith(".js"))
                                };
                            }
                        }

                        callback(null, data);
                    }
                    );
            });
    }
}

let webpackOptions = {
    entry: {
        bundle: "./src/js/app.ts",
        pwaPacked: "./src/js/workers/pwaServiceWorker.ts"
    },
    output: {
        filename: "[name]-[contenthash].min.js",
        chunkFilename: "[name]-[chunkhash].min.js",
        path: outputPath,
        publicPath: ""
    },
    watch: false,
    watchOptions: {
        ignored: /node_modules|\/dist/
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
                exclude: [/node_modules/, /pwaServiceWorker\.ts/, /\.d\.ts$/]
            },
            {
                test: /pwaServiceWorker\.ts/,
                loader: "ts-loader",
                options: { configFile: "/src/js/workers/tsconfig.json" }
            },
            {
                test: /\.d\.ts$/,
                loader: 'ignore-loader'
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
        new HtmlWebpackBackwardsCompatibilityPlugin(),
        new HtmlWebpackPlugin({
            template: "index.html",
            inject: false
        }),
        // Don't include momentjs since it isn't used by anything (but would otherwise get bundled
        new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$|moment$/ }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "./src/fonts/*",
                    to: outputPath + "/fonts/[name][ext]"
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
            ]
        })
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
        webpackOptions.optimization.moduleIds = 'named';
    }

    return webpackOptions;
};
