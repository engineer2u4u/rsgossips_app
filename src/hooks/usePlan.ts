// Plan-aware helpers for the current signed-in user.
// Mirrors web app src/hooks/usePlan.js.
//
// There is no trial. `isTrial` / `daysLeft` were removed with it — use
// `isFree` for the "has not paid" case they were standing in for.

import {useMemo} from 'react';
import {useAuth} from '../context/AuthContext';
import {
  PLAN_IDS,
  FREE_BARTER_APPLICATIONS,
  getEffectivePlan,
  hasFeature,
  getFeatureValue,
  isSubscribed,
  type FeatureCell,
  type PlanId,
} from '../lib/plans';

export interface PlanInfo {
  plan: PlanId;
  isFree: boolean;
  isStarter: boolean;
  isPro: boolean;
  isElite: boolean;
  subscribed: boolean;
  freeApplicationLimit: number;
  can: (key: string) => boolean;
  valueOf: (key: string) => FeatureCell | null;
}

export function usePlan(): PlanInfo {
  const {profile} = useAuth();
  return useMemo(() => {
    const plan = getEffectivePlan(profile);
    return {
      plan,
      isFree: plan === PLAN_IDS.FREE,
      isStarter: plan === PLAN_IDS.STARTER,
      isPro: plan === PLAN_IDS.PRO,
      isElite: plan === PLAN_IDS.ELITE,
      subscribed: isSubscribed(profile),
      freeApplicationLimit: FREE_BARTER_APPLICATIONS,
      can: (key: string) => hasFeature(plan, key),
      valueOf: (key: string) => getFeatureValue(plan, key),
    };
  }, [profile]);
}
