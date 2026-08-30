// Purchase lifecycle for creator subscriptions.
//
// Wraps react-native-iap's useIAP so screens only deal with "buy this plan"
// and "restore". The ordering below is not incidental — each step exists
// because skipping it breaks something specific:
//
//   1. requestPurchase opens the store sheet.
//   2. The purchase arrives on a LISTENER, not as a return value. The user can
//      complete a purchase after backgrounding the app, or a pending one can
//      land on next launch, so anything waiting on the call's return misses it.
//   3. Verify server-side. Nothing is granted until Apple or Google confirms.
//   4. finishTransaction ONLY after verification succeeds. Android auto-refunds
//      purchases not finalized within 3 days; iOS replays unfinished
//      transactions on every launch. Finishing before verifying would drop the
//      receipt while the entitlement failed to write — the user pays and gets
//      nothing, with no way to recover it.

import {useCallback, useEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';
import {useIAP} from 'react-native-iap';
import type {Purchase, PurchaseError} from 'react-native-iap';
import {ALL_IAP_SKUS, IAP_SKUS, verifyPurchase} from '../lib/iap';
import type {PlanId, BillingCycle} from '../lib/plans';
import {useAuth} from '../context/AuthContext';

type Status = 'idle' | 'purchasing' | 'verifying' | 'restoring';

export function useSubscriptionPurchase() {
  const {refreshProfile} = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  // Purchases arrive on a listener that also fires for transactions restored
  // at launch. Without this the screen would show "purchase complete" for
  // something the user did days ago on another device.
  const expectingPurchase = useRef(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    availablePurchases,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      setStatus('verifying');
      setError('');
      try {
        const res = await verifyPurchase(purchase);
        if (!res?.success) {
          // Do NOT finish the transaction — leaving it open means the store
          // replays it, giving verification another chance rather than
          // stranding a paid purchase.
          setError(res?.error || 'We could not verify that purchase.');
          return;
        }
        await finishTransaction({purchase, isConsumable: false});
        // The server wrote subscription_plan; pull it so the UI reflects the
        // new tier without a restart.
        await refreshProfile();
      } catch (e: any) {
        setError(e?.message || 'Something went wrong completing your purchase.');
      } finally {
        expectingPurchase.current = false;
        setStatus('idle');
      }
    },
    onPurchaseError: (e: PurchaseError) => {
      expectingPurchase.current = false;
      setStatus('idle');
      // A cancelled sheet is not an error worth showing.
      const cancelled = /cancel/i.test(e?.code || '') || /cancel/i.test(e?.message || '');
      setError(cancelled ? '' : e?.message || 'Purchase failed.');
    },
  });

  // Load the store's own product list. Prices, currency and localisation must
  // come from the store, never from PLAN_PRICING — the store is the source of
  // truth for what the user is actually charged, and showing anything else is
  // both wrong and a review risk.
  useEffect(() => {
    if (!connected) return;
    fetchProducts({skus: ALL_IAP_SKUS, type: 'subs'}).catch(() => {
      setError('Could not load plans from the store.');
    });
  }, [connected, fetchProducts]);

  const buy = useCallback(
    async (plan: PlanId, cycle: BillingCycle) => {
      const sku = IAP_SKUS[plan]?.[cycle];
      if (!sku) {
        setError('That plan is unavailable.');
        return;
      }
      setError('');
      setStatus('purchasing');
      expectingPurchase.current = true;
      try {
        await requestPurchase({
          type: 'subs',
          request:
            Platform.OS === 'ios'
              ? {apple: {sku}}
              : {google: {skus: [sku]}},
        });
      } catch (e: any) {
        expectingPurchase.current = false;
        setStatus('idle');
        setError(e?.message || 'Could not open the store.');
      }
    },
    [requestPurchase],
  );

  /**
   * Restore Purchases. Apple requires this control to exist — an app selling
   * subscriptions without one fails review — and it is the recovery path for a
   * reinstall or a new device.
   */
  const restore = useCallback(async () => {
    setError('');
    setStatus('restoring');
    try {
      await getAvailablePurchases();
    } catch (e: any) {
      setError(e?.message || 'Could not restore purchases.');
      setStatus('idle');
    }
  }, [getAvailablePurchases]);

  // Verify whatever the restore turned up. Runs off availablePurchases rather
  // than a return value because that is where the library reports results.
  useEffect(() => {
    if (status !== 'restoring') return;
    if (!availablePurchases?.length) {
      setStatus('idle');
      setError('No previous purchases found on this account.');
      return;
    }
    (async () => {
      let entitled = false;
      for (const p of availablePurchases) {
        try {
          const res = await verifyPurchase(p);
          if (res?.success) {
            // Finish even a lapsed one — it is verified and recorded, and
            // leaving it open makes the store replay it forever.
            await finishTransaction({purchase: p, isConsumable: false});
            if (res.entitled) entitled = true;
          }
        } catch {
          // One bad receipt must not abandon the rest.
        }
      }
      await refreshProfile();
      if (!entitled) setError('No active subscription found to restore.');
      setStatus('idle');
    })();
  }, [availablePurchases, status, finishTransaction, refreshProfile]);

  return {
    connected,
    /** Store-provided products — use these for price display, not PLAN_PRICING. */
    subscriptions,
    status,
    busy: status !== 'idle',
    error,
    clearError: () => setError(''),
    buy,
    restore,
  };
}
