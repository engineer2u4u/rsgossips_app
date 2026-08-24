/**
 * F-09 — Mobile session tokens are held in unencrypted local storage  (S2)
 * TR-07 / A-39
 *
 * Strategy: "assert access and refresh tokens are not held in plain
 * AsyncStorage, which is readable on rooted devices and via backup extraction.
 * Encrypted or Keystore-backed storage is the expectation for a token that
 * authorises escrow operations."
 *
 * WHAT THE CODE SHOWS (src/utils/supabase.ts:6-13):
 *
 *     export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
 *       auth: { storage: AsyncStorage, ... }
 *     });
 *
 * AsyncStorage on Android is an unencrypted SQLite file in the app sandbox. It
 * is readable on a rooted device, and it is included in adb backup unless the
 * manifest opts out. The token it holds authorises escrow operations, which is
 * what moves this from "hardening" to a finding.
 *
 * This is a STATIC assertion rather than a runtime one on purpose: the property
 * is "which adapter is configured", and reading the source proves that directly
 * without needing a device or a live session. A runtime check would only tell us
 * what happened on one device on one run.
 *
 * FIX: react-native-keychain, expo-secure-store, or an MMKV instance with
 * encryption, wrapped to satisfy the supabase-js storage interface
 * (getItem/setItem/removeItem). No app logic changes — only the adapter.
 *
 * EXPECTED TO FAIL until then.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CLIENT = join(__dirname, '..', 'src', 'utils', 'supabase.ts');
const PKG = join(__dirname, '..', 'package.json');

/** Dependencies that would satisfy the encrypted-storage requirement. */
const ENCRYPTED_STORAGE_DEPS = [
  'react-native-keychain',
  'expo-secure-store',
  'react-native-encrypted-storage',
  'react-native-mmkv', // acceptable only with encryptionKey set
  'react-native-sensitive-info',
];

describe('F-09 — the auth token must not sit in unencrypted storage', () => {
  it('the supabase client is not configured with plain AsyncStorage', () => {
    expect(existsSync(CLIENT)).toBe(true);
    const src = readFileSync(CLIENT, 'utf8');

    // Match the configured adapter, not merely a mention of the module.
    const usesPlainAsyncStorage = /storage:\s*AsyncStorage\b/.test(src);
    expect({ authStorage: usesPlainAsyncStorage ? 'AsyncStorage (plain)' : 'encrypted' }).toEqual({
      authStorage: 'encrypted',
    });
  });

  it('an encrypted-storage dependency is available to back the session', () => {
    const pkg = JSON.parse(readFileSync(PKG, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const present = ENCRYPTED_STORAGE_DEPS.filter(d => d in deps);

    // Without one of these installed, there is nothing to migrate the session to.
    expect({ encryptedStorageDeps: present.length }).not.toEqual({ encryptedStorageDeps: 0 });
  });
});
