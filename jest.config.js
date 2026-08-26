module.exports = {
  preset: 'react-native',
  // __findings__/ holds the intentionally-RED findings suite (see
  // jest.findings.config.js). It must stay out of the default run: those tests
  // assert the state open findings SHOULD be in, so they fail by design, and a
  // permanently-red default suite trains everyone to ignore `npm test`.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__findings__/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // App.tsx imports './global.css' for NativeWind. Jest hands .css straight to
  // the JS parser, which chokes on `@tailwind base`. Stub it — the styling has
  // no bearing on whether the tree renders.
  moduleNameMapper: {'\\.(css)$': '<rootDir>/__mocks__/styleMock.js'},
  // Several runtime deps ship untranspiled ESM (react-native-url-polyfill, the
  // supabase client, async-storage). The RN preset excludes node_modules from
  // transformation, so anything importing src/utils/supabase — which App.tsx
  // does transitively — died on `import` with "Jest encountered an unexpected
  // token". That predates this config; App.test.tsx had never been runnable.
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?react-native|@react-native|@react-navigation' +
      '|react-native-url-polyfill|@supabase|@react-native-async-storage' +
      '|whatwg-url-without-unicode|react-native-.*)/',
  ],
};
