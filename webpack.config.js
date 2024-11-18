const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js', // Main JavaScript entry point
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'], // These loaders handle CSS files
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource', // or use 'file-loader' if needed
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/login.html',
            filename: 'login.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/signup.html',
            filename: 'signup.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/createevent.html',
            filename: 'createevent.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src', // Copies all files from 'src'
                    to: path.resolve(__dirname, 'dist'),  // Places them in 'dist'
                    globOptions: {
                        ignore: [
                            '**/index.html',   // Exclude files handled by HtmlWebpackPlugin
                            '**/login.html',
                            '**/signup.html',
                            '**/createevent.html',
                        ],
                    },
                },
            ],
        }),
    ],
    devServer: {
        static: './dist',
        hot: true,
    },
};
