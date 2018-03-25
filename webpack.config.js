const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const outputPath = path.resolve(__dirname, 'dist');

module.exports = {
	entry: {
		bundle:'./src/js/app.js',
		pwaPacked: './src/pwaServiceWorker.js'
	},
	output: {
		filename: '[name].js',
		path: outputPath
	},
	plugins: [
		new CleanWebpackPlugin(outputPath),
		new CopyWebpackPlugin([
			{
				from: '*.png'
			},
			{
				from: '*.ico'
			},
			{
				from: './index.html'
			},
			{
				from: './manifest.json'
			}
		])
	]
};
