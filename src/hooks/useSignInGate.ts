// The wall in front of account-based actions, for screens a guest can reach.
//
// Usage:
//   const gate = useSignInGate();
//   ...
//   onPress={() => gate.require('apply_campaign',
//     {screen: 'InfluencerOfferDetail', params: {id}, action: 'apply',
//      requiredRole: 'influencer'},
//     () => setShowApplyForm(true))}
//   ...
//   <SignInRequiredModal reason={gate.reason} onClose={gate.close}
//     onSignIn={gate.goSignIn} onSignUp={gate.goSignUp} />
//
// When there is a session `require` just runs the action, so call sites do not
// branch on `user` themselves. Explicit state + explicitly rendered modal, to
// match how UpgradeRequiredModal is already wired into InfluencerOfferDetail.

import {useCallback, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import {useAuth} from '../context/AuthContext';
import {setAuthIntent, type AuthIntent} from '../lib/authIntent';
import type {SignInReason} from '../components/SignInRequiredModal';

export function useSignInGate() {
  const {user} = useAuth();
  const navigation = useNavigation<any>();
  const [reason, setReason] = useState<SignInReason | null>(null);

  const isGuest = !user?.id;

  const require = useCallback(
    (
      why: SignInReason,
      intent: Omit<AuthIntent, 'ts'>,
      onAllowed?: () => void,
    ) => {
      if (!isGuest) {
        onAllowed?.();
        return;
      }
      // Remember what they were doing BEFORE sending them away — the screen
      // holding this state will not survive the sign-in.
      setAuthIntent(intent);
      setReason(why);
    },
    [isGuest],
  );

  const close = useCallback(() => setReason(null), []);

  const goSignIn = useCallback(() => {
    setReason(null);
    navigation.navigate('Login', {mode: 'signin'});
  }, [navigation]);

  const goSignUp = useCallback(() => {
    setReason(null);
    navigation.navigate('Login', {mode: 'signup'});
  }, [navigation]);

  return {isGuest, reason, require, close, goSignIn, goSignUp};
}
