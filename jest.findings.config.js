// Findings config — the RED suite for the mobile surface.
//
// Same contract as the web repo's jest.findings.config.mjs: these tests assert
// the DESIRED state of an open Appendix A finding and are EXPECTED TO FAIL. A
// failure is an open finding, not a broken build, which is why this is separate
// from `npm test` and its blocking gate.
//
// Findings covered here: F-09 (session tokens in unencrypted AsyncStorage) and
// F-10 (publishable-key fallback in the invocation helper).
//
// transformIgnorePatterns: several runtime deps ship untranspiled ESM
// (react-native-url-polyfill, the supabase client, async-storage). The RN preset
// excludes node_modules from transformation by default, so importing src/lib/api
// blows up on `import` unless they are allow-listed back in.
module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/__findings__'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?react-native|@react-native|@react-navigation' +
      '|react-native-url-polyfill|@supabase|@react-native-async-storage' +
      '|whatwg-url-without-unicode|react-native-.*)/',
  ],
};
