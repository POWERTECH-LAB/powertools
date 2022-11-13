const path = require('path');

module.exports = {
  entry: ['@babel/polyfill','./src/index.js'],
  mode: 'production',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  performance: {
    maxEntrypointSize: 25000000,
    maxAssetSize: 25000000,
  },
  module: {
    rules: [
      {
        test: /\.aff$/i,
        use: 'raw-loader',
      },
      {
        test: /\.dic$/i,
        use: 'raw-loader',
      },
    ],
  },
};

