const path = require('path');

module.exports = {
    entry: {
        'mengerSponge': './src/mengerSponge.js',
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },

    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        port: 9000,
    },
};