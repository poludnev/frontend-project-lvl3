// const path = require('path');
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  entry: './src/init.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(process.cwd(), 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      //     {
      //       test: /\.(png|svg|jpg|jpeg|gif)$/i,
      //       type: 'asset/resource',
      //     },
      //     {
      //       test: /\.(woff|woff2|eot|ttf|otf)$/i,
      //       type: 'asset/resource',
      //     },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/template.html',
    }),
  ],
};
