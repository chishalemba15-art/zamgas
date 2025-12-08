const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro uses the correct project root
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config;
