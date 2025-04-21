import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import SWPrecacheWebpackPlugin from 'sw-precache-webpack-plugin';
import glob from 'glob';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default {
	mode: 'development',
	//mode: 'production',
	entry: path.resolve("src/app/index.js"),
	output: {
		path: path.resolve('web'),
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ["babel-loader"]
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"]
			},
			{
				test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
				use: ['url-loader']
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			inject: true,
			template: 'app/app.html',
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeRedundantAttributes: true,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				keepClosingSlash: true,
				minifyJS: true,
				minifyCSS: true,
				minifyURLs: true,
			},
		}),
		new webpack.DefinePlugin({WEB: true}),
		new CopyWebpackPlugin({patterns: ['translations/**']}),
	],
	resolve: {
		fallback: {
			dgram: false,
			fs: false,
			net: false,
			tls: false,
		},
	}
};