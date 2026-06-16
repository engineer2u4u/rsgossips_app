// device-session — small helpers powering Trusted Devices.
//
// Port of web app src/utils/device-session.js. The same row in
// public.device_sessions is shared across web + RN; only the storage backend
// differs: localStorage on web, AsyncStorage here. RN gets a friendlier
// device name from Platform (no UA parsing).
//
// On sign-in we upsert (user_id, device_id) with fresh last_active_at +
// is_active=true. AuthContext polls every 60s; if the user revokes this
// device from the Trusted Devices page (is_active=false), the next poll
// signs them out.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import type {SupabaseClient} from '@supabase/supabase-js';

const STORAGE_KEY = 'rg.device_id';

// RFC 4122 v4 UUID. Math.random is fine here — collisions are catastrophic
// only across billions of devices and this isn't a security boundary.
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

// Short, recognisable label like "Android 14 · RGossips" or "iOS 17".
// The web file says: "Keeps the parser dumb on purpose — there's no need to
// identify every permutation perfectly, only enough so the user can tell
// devices apart."
export function buildDeviceName(): string {
  const os = Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : 'RN';
  const ver = String(Platform.Version || '').slice(0, 6);
  return ver ? `${os} ${ver} · RGossips` : `${os} · RGossips`;
}

// Same shape as the web's `user_agent` column — the table is shared, so we
// stuff a synthetic UA so server-side analytics can still tell mobile apart.
function syntheticUserAgent(): string {
  return `RGossipsApp/${Platform.OS}-${Platform.Version}`;
}

export async function registerDeviceSession(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) return null;
  const deviceId = await getDeviceId();
  const ua = syntheticUserAgent();
  const deviceName = buildDeviceName();
  const {error} = await supabase.from('device_sessions').upsert(
    {
      user_id: userId,
      device_id: deviceId,
      user_agent: ua.slice(0, 500),
      device_name: deviceName,
      last_active_at: new Date().toISOString(),
      is_active: true,
    },
    {onConflict: 'user_id,device_id'},
  );
  if (error) {
    // Best-effort — don't surface to the user. Common cause: table missing
    // in a dev project (RLS or migration not applied).
    console.warn('registerDeviceSession failed:', error.message);
  }
  return deviceId;
}

// Returns true when the current device's row still has is_active=true.
// A null row (e.g. never registered, or RLS denied) is treated as active so
// we don't sign out on transient errors.
export async function isCurrentDeviceActive(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return true;
  const deviceId = await getDeviceId();
  const {data, error} = await supabase
    .from('device_sessions')
    .select('is_active')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) {
    console.warn('isCurrentDeviceActive failed:', error.message);
    return true;
  }
  if (!data) return true;
  return data.is_active !== false;
}

export async function getCurrentDeviceId(): Promise<string> {
  return getDeviceId();
}
