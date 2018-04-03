var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var outputPath = path.resolve(__dirname, 'dist');
var webpackOptions = {
    entry: {
        bundle: './src/js/app.js',
        pwaPacked: './src/js/pwaServiceWorker.js'
    },
    output: {
        filename: '[name]-[hash].min.js',
        chunkFilename: '[name]-[chunkhash].min.js',
        path: outputPath,
        publicPath: ''
    },
    watch: false,
    watchOptions: {
        ignored: /node_modules/,
    },
    stats: {
        colors: true
    },
    devServer: {
        contentBase: './dist',
        hot: false
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CleanWebpackPlugin([outputPath + "/*-*.min.js*", outputPath + "/*-*.min.*.js*"]),
        new HtmlWebpackPlugin({
            template: 'index.html',
            inject: false,
        }),
        // Don't include momentjs since it isn't used by anything (but would otherwise get bundled
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CopyWebpackPlugin([
            {
                from: './src/fonts/*',
                to: outputPath + '/fonts/',
                flatten: true
            },
            {
                from: '*.png'
            },
            {
                from: '*.ico'
            },
            {
                from: './manifest.json'
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
module.exports = function () {
    if (process.env.npm_lifecycle_script.toString().includes("development")) {
        webpackOptions.watch = true;
        webpackOptions.plugins.push(new webpack.NamedModulesPlugin());
    }
    return webpackOptions;
};
//# sourceMappingURL=webpack.config.js.map