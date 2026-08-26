/**
 * Jest setup for the app suite.
 *
 * React Native Firebase reaches for native modules (RNFBAppModule) at import
 * time, not at first use. App.tsx imports src/lib/push.ts, which imports
 * @react-native-firebase/messaging, so simply rendering <App /> blew up with
 * "Native module RNFBAppModule not found" long before any assertion ran — which
 * is why __tests__/App.test.tsx had never been runnable.
 *
 * These are the standard module mocks; they replace the native bridge, not the
 * app's own logic. Anything that asserts push BEHAVIOUR should mock
 * src/lib/push.ts directly rather than lean on these.
 */

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {apps: [], initializeApp: jest.fn()},
  getApp: jest.fn(() => ({name: '[DEFAULT]'})),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(() => jest.fn()),
    deleteToken: jest.fn(() => Promise.resolve()),
    setBackgroundMessageHandler: jest.fn(),
  });
  messaging.AuthorizationStatus = {NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2};
  return {__esModule: true, default: messaging, firebase: {messaging}};
});

// AsyncStorage ships an official mock for exactly this reason.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Native UI modules that resolve their binding at import time via
// TurboModuleRegistry.getEnforcing, which throws outside a real build.
// String component types, deliberately. Returning a function component here
// makes NativeWind's babel plugin inject `_ReactNativeCSSInterop` into the mock
// factory, and Jest rejects any out-of-scope variable in a jest.mock factory.
// A string type is a valid host component to React and needs no imports.
jest.mock('react-native-webview', () => ({
  __esModule: true,
  WebView: 'WebView',
  default: 'WebView',
}));

jest.mock('react-native-linear-gradient', () => ({
  __esModule: true,
  default: 'LinearGradient',
}));

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: {open: jest.fn(() => Promise.resolve({razorpay_payment_id: 'pay_test'}))},
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({assets: []})),
  launchCamera: jest.fn(() => Promise.resolve({assets: []})),
}));

jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: {
    openPicker: jest.fn(() => Promise.resolve({path: '', mime: 'image/jpeg'})),
    openCamera: jest.fn(() => Promise.resolve({path: '', mime: 'image/jpeg'})),
    openCropper: jest.fn(() => Promise.resolve({path: '', mime: 'image/jpeg'})),
    clean: jest.fn(() => Promise.resolve()),
  },
}));
