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
    externals: [nodeExternals({
      allowlist: [
        // Use regex patterns to match multiple libraries with similar patterns
        /^libp2p/,
        /^@libp2p/,
        /^@chainsafe/,
        /^multiformats/,
        /^@multiformats/,
        /^uint8arrays/,
        /^@uint8arrays/,
        /^uint8arraylist/,
        /^@uint8arraylist/,
        /^uint8-varint/,
        /^@uint8-varint/,
        /^datastore-core/,
        // Match common libp2p related packages
        /^(it-|p-|interface-|protons-|progress-events|weald|mortice|race-|any-signal|.*-stream|.*-to-it|get-iterator|yocto-queue)/,
        // Include specific remaining packages
        /^websocket-stream/,
        /^ws$/,
        /^@ws/,
        /^bufferutil/,
        /^utf-8-validate/,
        /^wherearewe/,
        /^eventemitter3/,
        /^is-loopback-addr/
      ]
    })],
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
    ]
  };
};
