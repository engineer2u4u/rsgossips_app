// Mobile push (FCM — Android + iOS via Firebase). Mirrors the web-push client:
// asks permission, gets the FCM token, and registers it through the SAME
// register-push edge fn (platform:'fcm'). The send-push edge fn (fired by the
// notifications-table trigger) delivers to it.
//
// Requires @react-native-firebase/app + /messaging installed and native
// Firebase config in place (see PUSH_SETUP.md). All calls are wrapped so a
// missing/native-unconfigured Firebase never crashes the app.

import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { invokeFn, reportClientError } from './api';

let handlersBound = false;

// Compact web-link → React Navigation route mapping (mirrors NotificationsList
// routeFromLink) so a tapped push deep-links to the right screen.
function routeFromLink(link: string): { name: string; params?: any } | null {
  if (!link) return null;
  const cleaned = link.replace(/^\/+/, '');
  let m;
  if ((m = cleaned.match(/^influencer\/offers\/([^/?#]+)/i))) return { name: 'InfluencerOfferDetail', params: { id: m[1] } };
  if (/^influencer\/campaigns/i.test(cleaned)) return { name: 'InfluencerCampaigns' };
  if (/^influencer\/services\/orders/i.test(cleaned)) return { name: 'InfluencerServiceOrders' };
  if (/^influencer\/services/i.test(cleaned)) return { name: 'InfluencerServices' };
  if (/^influencer\/profile/i.test(cleaned)) return { name: 'InfluencerProfile' };
  if (/^brands\/campaign\/([^/?#]+)/i.test(cleaned)) {
    m = cleaned.match(/^brands\/campaign\/([^/?#]+)/i);
    return { name: 'BrandCampaignDetail', params: { id: m![1] } };
  }
  if (/^brands\/campaigns/i.test(cleaned)) return { name: 'BrandCampaigns' };
  return null;
}

async function hasPermission(): Promise<boolean> {
  try {
    const status = await messaging().requestPermission();
    const ok =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    if (!ok) {
      reportClientError(
        'push.permission_denied',
        'Notification permission not granted',
        { status, platform: Platform.OS },
        'warn',
      );
    }
    return ok;
  } catch (e: any) {
    reportClientError(
      'push.permission_threw',
      e?.message || 'requestPermission threw',
      { platform: Platform.OS },
    );
    return false;
  }
}

// Ask permission, get the FCM token, and register it for the signed-in user.
// Safe to call on every login / app focus — the edge fn upserts by token.
export async function registerForPush(): Promise<void> {
  // Every step used to fail silently, so a device that never registered was
  // indistinguishable from one that did — and a brand reporting "my campaign
  // was approved but I got no push" left nothing to look at. Same reasoning
  // as the IAP logging in useSubscriptionPurchase.
  try {
    if (!(await hasPermission())) return;
    // iOS: ensure the device is registered with APNs before requesting a token.
    if (Platform.OS === 'ios') {
      try {
        await messaging().registerDeviceForRemoteMessages();
      } catch (e: any) {
        // Usually "already registered", which is fine. A real APNs failure
        // looks the same from here, so record it and carry on to getToken —
        // that is where it will actually bite.
        reportClientError(
          'push.apns_register_failed',
          e?.message || 'registerDeviceForRemoteMessages threw',
          { platform: Platform.OS },
          'warn',
        );
      }
    }
    const token = await messaging().getToken();
    if (!token) {
      // On iOS this is the signature of a missing APNs key in the Firebase
      // project, or a bundle id the key does not cover.
      reportClientError('push.no_token', 'getToken returned empty', {
        platform: Platform.OS,
      });
      return;
    }
    await invokeFn('register-push', {
      action: 'subscribe',
      platform: 'fcm',
      token,
      userAgent: `${Platform.OS} ${Platform.Version}`,
    });
  } catch (e: any) {
    reportClientError(
      'push.register_failed',
      e?.message || 'registerForPush threw',
      { platform: Platform.OS },
    );
  }
}

// Delete this device's token (call on logout so a shared device stops getting
// the previous user's notifications).
export async function unregisterPush(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (token) {
      await invokeFn('register-push', { action: 'unsubscribe', platform: 'fcm', token });
    }
    await messaging().deleteToken();
  } catch {
    /* no-op */
  }
}

// Wire tap-to-open + token refresh once. `navigate` deep-links the tapped
// notification. Background/quit notifications are shown by the OS automatically;
// foreground ones just refresh the in-app list (no notifee dependency here).
export function initPushHandlers(navigate: (route: { name: string; params?: any }) => void): void {
  if (handlersBound) return;
  handlersBound = true;
  try {
    const open = (remoteMessage: any) => {
      const link = remoteMessage?.data?.link;
      const route = link ? routeFromLink(String(link)) : null;
      if (route) {
        try {
          navigate(route);
        } catch {
          /* navigator not ready */
        }
      }
    };

    messaging().onNotificationOpenedApp(open);
    messaging()
      .getInitialNotification()
      .then((m) => m && open(m))
      .catch(() => {});
    messaging().onTokenRefresh(() => {
      registerForPush();
    });
  } catch {
    /* Firebase not configured — no-op. */
  }
}
