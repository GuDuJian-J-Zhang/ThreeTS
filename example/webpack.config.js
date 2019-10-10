const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');

let templates = [];
let dir = './example';
let files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.match(/\.pug$/)) {
    let filename = file.substring(0, file.length - 4);
    templates.push(
      new HtmlWebpackPlugin({
        template: dir + '/' + filename + '.pug',
        filename: filename + '.html'
      })
    );
  }
});

module.exports = {
  entry: './scene_example.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.pug$/,
        use: [
          "raw-loader",
          "pug-html-loader"
        ]
      }
    ],
  },
  plugins: [
    ...templates,
    new HtmlWebpackPugPlugin()
  ],
  resolve: {
    extensions: [ '.ts'],
  },
  mode: "development",
  output: {
    filename: 'scene_example.js',
    path: path.resolve(__dirname, '../build/example'),
  },
};