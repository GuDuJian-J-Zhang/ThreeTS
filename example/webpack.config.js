const path = require('path');

module.exports = {
  entry: './main.ts',
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
    filename: 'scene_example.js',
    path: path.resolve(__dirname, '../build/example'),
  },
};