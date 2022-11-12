const path = require('path');

module.exports = {
  entry: ['@babel/polyfill','./src/index.js'],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
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

