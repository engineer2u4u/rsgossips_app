// Asset auto-linker config. `npx react-native-asset` reads this and copies
// every TTF in ./assets/fonts to:
//   - Android: android/app/src/main/assets/fonts/<name>.ttf
//   - iOS:     adds each font to the Xcode project + appends the filename
//              to UIAppFonts in ios/RGossips/Info.plist
// Re-run the command whenever you add or remove a font file.
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts'],
};
