const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const outputPath = path.resolve(__dirname, 'dist');

let webpackOptions = {
    entry: {
        bundle: './src/js/app.js',
        pwaPacked: './src/js/pwaServiceWorker.js'
    },
    output: {
        filename: '[name]-[hash].min.js',
        path: outputPath,
        publicPath: ''
    },
    watch: false,
    watchOptions: {
        ignored: /node_modules/,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'cache-loader'
                    },
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['env', {
                                    targets: {
                                        browsers: ["last 2 versions", "safari >= 9", "ie >= 9"]
                                    },
                                    "useBuiltIns": true
                                }]
                            ]
                        }
                    }
                ]
            }
        ]
    },
    stats: {
        colors: true
    },
    devServer: {
        contentBase: './dist',
        hot: false
    },
    devtool: "source-map",
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
                    chunks: "all"
                }
            }
        }
    }
};

module.exports = (env) => {
    if (process.env.npm_lifecycle_script.toString().includes("development")) {
        webpackOptions.watch = true;
        webpackOptions.plugins.push(new webpack.NamedModulesPlugin());
    }

    return webpackOptions;
};
