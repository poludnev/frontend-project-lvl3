import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  mode: 'production',
  entry: {
    index: {
      import: './src/index.js',
      dependOn: 'shared',
    },
    shared: ['lodash', 'on-change', 'yup', 'axios', 'i18next'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(process.cwd(), 'dist'),
  },
  optimization: {
    runtimeChunk: 'single',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html',
    }),
  ],
};
