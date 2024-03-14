module.exports = {
  entry: ["./server.js"],
  output: {
    path: __dirname,
    publicPath: "/",
    filename: "bundle.js"
  },

  resolve: {
    extensions: ["", ".js", ".jsx"]
  },

  module: {
    rules: [
      {
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        },

        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "images/",
              publicPath: "images/"
            }
          }
        ]
      }
    ]
  },

  devServer: {
    historyApiFallback: true,
    contentBase: "./",
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  },
  node: {
    fs: "empty"
  }
};
