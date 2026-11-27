const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const SHARED_PACKAGE = '@simple-concepts/shared';
const sharedEntry = path.resolve(__dirname, '../../packages/shared/dist/index.js');

const config = getDefaultConfig(__dirname);
const resolveRequest = config.resolver.resolveRequest;

// Resolved by path because Windows drive-letter case (c:\ vs C:\) can break Metro's
// handling of the workspace symlink.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === SHARED_PACKAGE) {
    return { type: 'sourceFile', filePath: sharedEntry };
  }
  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
