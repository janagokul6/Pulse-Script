const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force a single React instance so hooks work during web SSR (avoids "Invalid hook call"
// from nested react in node_modules/expo/node_modules/@expo/cli/node_modules/react).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react-dom') {
    const resolved = require.resolve(moduleName, { paths: [path.join(__dirname, 'node_modules')] });
    return { type: 'sourceFile', filePath: resolved };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
