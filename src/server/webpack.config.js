const path = require('path');

module.exports = [
    {
        entry: './src/server/start.ts',
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
          extensions: [ '.ts', '.js'],
        },
        mode: "development",
        output: {
          filename: 'server.js',
          path: path.resolve(__dirname, '../../build/debug'),
        },
        target: "node"
    }
];