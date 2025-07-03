const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const port = process.env.PORT || 3000;

  return {
    entry: './src/renderer/index.tsx',
    target: 'web',
    devtool: isDevelopment ? 'source-map' : false,
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
      fallback: {
        path: false,
        fs: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        events: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: 'bundle.js',
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
    devServer: {
      port: port,
      host: '0.0.0.0', // Allow connections from any host (required for Docker)
      hot: true,
      allowedHosts: 'all', // Allow all hosts (required for Docker)
      client: {
        webSocketURL: {
          protocol: 'ws',
          hostname: 'localhost',
          port: port,
          pathname: '/ws',
        },
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      // Remove static file serving to prevent conflicts with in-memory serving
      // static: false, // Disable static file serving entirely
      static: {
        directory: path.join(__dirname, 'public'), // Serve only public assets, not dist
        publicPath: '/public',
        serveIndex: false, // Disable directory browsing
        watch: false, // Disable file watching for static files
      },
      historyApiFallback: {
        index: '/index.html', // Fallback for SPA routing
        disableDotRule: true,
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      // Add middleware to prevent double responses
      setupMiddlewares: (middlewares, devServer) => {
        // Add custom middleware to handle potential conflicts
        devServer.app.use((req, res, next) => {
          // Prevent multiple responses to the same request
          const originalSend = res.send;
          const originalJson = res.json;
          const originalEnd = res.end;

          let responseSent = false;

          res.send = function(...args) {
            if (!responseSent) {
              responseSent = true;
              return originalSend.apply(this, args);
            }
          };

          res.json = function(...args) {
            if (!responseSent) {
              responseSent = true;
              return originalJson.apply(this, args);
            }
          };

          res.end = function(...args) {
            if (!responseSent) {
              responseSent = true;
              return originalEnd.apply(this, args);
            }
          };

          next();
        });

        return middlewares;
      },
    },
  };
};
