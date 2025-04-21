const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = env => {
  if(env && env.test)
    env = 'test'
  else if(env && env.production)
    env = 'production'
  
  const isDevelopment = env !== 'production' && env !== 'test';
  const isProduction = env === 'production';
  
  return {
    mode: env === 'test' ? 'production' : (env || 'development'),
    target: "node",
    node: {
      __dirname: false,
      __filename: false
    },
    externals: [nodeExternals()],
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        env: path.resolve(__dirname, `../config/env_${env}.json`),
        '@': path.resolve(__dirname, '../src')
      }
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: ["babel-loader"]
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
          type: 'asset'
        }
      ]
    },
    plugins: [
    ],
    experiments: {
      outputModule: true
    },
    output: {
      module: true,
      libraryTarget: 'module',
      chunkFormat: 'module'
    }
  };
};
