const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: {
		bundle:'./src/js/app.js',
		pwaServiceWorkerPack: './src/pwaServiceWorker.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [
		new CopyWebpackPlugin([
			{
				from: '*.png'
			},
			{
				from: '*.ico'
			},
			{
				from: './src/index.html'
			},
			{
				from: './manifest.json'
			}
		])
	]
};
