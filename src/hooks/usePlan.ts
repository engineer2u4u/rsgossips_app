// Plan-aware helpers for the current signed-in user.
// Mirrors web app src/hooks/usePlan.js.

import {useMemo} from 'react';
import {useAuth} from '../context/AuthContext';
import {
  PLAN_IDS,
  getEffectivePlan,
  hasFeature,
  getFeatureValue,
  isWithinTrial,
  trialDaysLeft,
  type FeatureCell,
  type PlanId,
} from '../lib/plans';

export interface PlanInfo {
  plan: PlanId;
  isStarter: boolean;
  isPro: boolean;
  isElite: boolean;
  isTrial: boolean;
  daysLeft: number;
  can: (key: string) => boolean;
  valueOf: (key: string) => FeatureCell | null;
}

export function usePlan(): PlanInfo {
  const {profile} = useAuth();
  return useMemo(() => {
    const plan = getEffectivePlan(profile);
    return {
      plan,
      isStarter: plan === PLAN_IDS.STARTER,
      isPro: plan === PLAN_IDS.PRO,
      isElite: plan === PLAN_IDS.ELITE,
      isTrial: isWithinTrial(profile),
      daysLeft: trialDaysLeft(profile),
      can: (key: string) => hasFeature(plan, key),
      valueOf: (key: string) => getFeatureValue(plan, key),
    };
  }, [profile]);
}
