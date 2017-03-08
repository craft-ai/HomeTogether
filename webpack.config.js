var dotenv = require('dotenv');
var path = require('path');
var webpack = require('webpack');

dotenv.load();

module.exports = {
  devtool: 'eval',
  entry: [
    './src/browser/main'
  ],
  output: {
    path: path.join(__dirname, 'bin', 'static'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.DefinePlugin({
      __CRAFT_URL__: JSON.stringify(process.env.CRAFT_URL),
      __CRAFT_OWNER__: JSON.stringify(process.env.CRAFT_OWNER),
      __CRAFT_PROJECT__: JSON.stringify(process.env.CRAFT_PROJECT),
      __CRAFT_TOKEN__: JSON.stringify(process.env.CRAFT_TOKEN),
      __SERVER_SIDE_DEVICES__: JSON.stringify(process.env.SERVER_SIDE_DEVICES)
    })
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['babel'],
      exclude: /node_modules/
    }, {
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.css?$/,
      loaders: ['style', 'css']
    }, {
      test: /\.(png|svg)$/,
      loaders: ['url']
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loaders: ['url']
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loaders: ['url']
    }]
  }
};
