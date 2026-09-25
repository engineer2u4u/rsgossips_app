#!/usr/bin/env node
/**
 * iOS layout regressions that don't show up on Android — run before shipping
 * a UI change (`npm run check:ios`).
 *
 * Both checks exist because the same two mistakes kept reaching TestFlight,
 * where buttons and sections looked shrunk or clipped:
 *
 * 1. Self-sizing gradients. react-native-linear-gradient 2.8.3 has no Fabric
 *    support, so on RN 0.84's New Architecture a <LinearGradient> that derives
 *    its own size from padding + children COLLAPSES on iOS ("Match" → "Mat").
 *    The fix is always the same: the wrapping View/Pressable owns the sizing
 *    (padding/height/borderRadius + overflow:hidden) and the gradient becomes
 *    an absolute-fill background sibling. See commit c53ceb3.
 *
 * 2. Hard-coded home-indicator padding inside a Modal. `Platform.OS === 'ios'
 *    ? 34 : 20` guesses an inset that varies by device, and is wrong on
 *    Android 15+, where targetSdk 36 forces edge-to-edge and the sheet draws
 *    under the system nav bar. Use useSafeAreaInsets().bottom.
 *
 * Exits 1 when it finds something, so CI or a pre-push hook can gate on it.
 */

const {execSync} = require('child_process');
const fs = require('fs');

const files = execSync('git ls-files "src/**/*.tsx" "src/*.tsx"', {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const problems = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  // --- Check 1: gradients that size themselves from padding ---------------
  let openedAt = null; // 1-based line of the <LinearGradient that's still open
  let tag = ''; // text of the opening tag so far

  lines.forEach((line, i) => {
    if (line.includes('<LinearGradient')) {
      openedAt = i + 1;
      tag = '';
    }
    if (openedAt === null) return;

    tag += ' ' + line;

    // Self-closing: the gradient is a background, nothing to size.
    if (line.includes('/>')) {
      openedAt = null;
      return;
    }
    // Wait for the end of the opening tag.
    if (!/>\s*$/.test(line)) return;

    const at = openedAt;
    openedAt = null;

    // An absolute-fill gradient is the pattern we want, not a problem.
    if (/position:\s*['"]absolute['"]/.test(tag) || /absoluteFill/.test(tag)) {
      return;
    }
    // An explicit width AND height sizes the gradient without relying on
    // padding — safe (icon chips, avatars, FABs).
    const hasWidthAndHeight =
      (/width:/.test(tag) && /height:/.test(tag)) ||
      (/w-\[?\d/.test(tag) && /h-\[?\d/.test(tag));
    // NOTE: an explicit width alone is NOT safe and is not excused here.
    // The CTA card on the brand home had `width: winW - 28` and still
    // collapsed on iOS, clipping its buttons, because its HEIGHT came from
    // padding + children. Only width AND height together are safe.
    const sizesFromPadding = /padding/.test(tag) || /["\s]p[xy]?-\d/.test(tag);

    if (sizesFromPadding && !hasWidthAndHeight) {
      problems.push(
        `${file}:${at}: self-sizing <LinearGradient> with children — move the ` +
          'sizing to a wrapper View/Pressable and make the gradient an ' +
          'absolute-fill background',
      );
    }
  });

  // --- Check 2: guessed insets in a bottom-anchored sheet ------------------
  //
  // Scoped to <Modal> regions that anchor their content to the bottom of the
  // screen, because those are the ones that collide with the home indicator
  // and the Android nav bar. A centred popup needs no bottom inset, and a
  // plain screen's ScrollView padding (clearance for the floating BottomNav)
  // is not an inset at all.
  let modalStart = null;
  let region = '';

  lines.forEach((line, i) => {
    if (line.includes('<Modal')) {
      modalStart = i;
      region = '';
    }
    if (modalStart === null) return;
    region += '\n' + line;

    if (!line.includes('</Modal>')) return;

    const bottomAnchored =
      /justify-end/.test(region) ||
      /justifyContent:\s*['"]flex-end['"]/.test(region);
    if (bottomAnchored) {
      region.split('\n').forEach((l, n) => {
        // Only a hard-coded number is wrong; `? insets.bottom : 0` is the fix.
        if (/padding\w*:\s*Platform\.OS === ['"]ios['"]\s*\?\s*[\d.]+/.test(l)) {
          problems.push(
            `${file}:${modalStart + n}: hard-coded iOS inset in a ` +
              'bottom-anchored sheet — use useSafeAreaInsets().bottom',
          );
        }
      });
    }
    modalStart = null;
  });
}

if (problems.length) {
  console.error('iOS layout problems found:\n');
  for (const p of problems) {
    console.error('  ' + p);
  }
  console.error(
    '\nSee the "iOS layout pass" convention in CLAUDE.md for the fix.\n',
  );
  process.exit(1);
}

console.log('iOS layout checks passed.');
