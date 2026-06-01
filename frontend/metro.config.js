const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const firebaseAppCjs = path.join(__dirname, 'node_modules', '@firebase', 'app', 'dist', 'index.cjs.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === '@firebase/app') {
    return {
      filePath: firebaseAppCjs,
      type: 'sourceFile'
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
