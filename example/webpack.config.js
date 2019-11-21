const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');

let templates = [];
let dir = './example';
let files = fs.readdirSync(dir);

let objs = [];

files.forEach(file => {
  const template = dir + '/' + 'template.pug';
  if (file.match(/\.ts$/)) {
    let filename = file.split('.')[0];
    let obj = Object.assign({
      entry: [
        `./example/${file}`,
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
                    name: `${filename}`
                  }
                }
              }
            ],
          }
        ],
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: template,
          filename: `${filename}.html`
        }),
        new HtmlWebpackPugPlugin()
      ],
      resolve: {
        extensions: [ '.ts'],
      },
      mode: "development",
      output: {
        filename: `${filename}.js`,
        path: path.resolve(__dirname, '../build/example'),
      },
    });
    objs.push(obj);
  }
});

module.exports = objs;