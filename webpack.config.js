const path = require('path');

module.exports = {
  entry: './src/scene/scene.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.ts'],
  },
  mode: "development",
  output: {
    filename: 'sce.js',
    path: path.resolve(__dirname, './build/debug'),
  },
};