const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');

let templates = [];
let dir = './example';
let files = fs.readdirSync(dir);

files.forEach(file => {
  const template = dir + '/' + 'template.pug'；
  if (file.match(/\.pug$/)) {
    let filename = file.substring(0, file.length - 4);
    templates.push(
      new HtmlWebpackPlugin({
        template: template,
        filename: filename + '.html'
      })
    );
  }
});

module.exports = {
  entry: [
    './example/scene_example.ts'
  ],
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
          {
            loader: "pug-html-loader",
            options: {
              data: {
                name: 'scene_example'
              }
            }
          }
        ],
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