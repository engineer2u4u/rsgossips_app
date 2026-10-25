// Consumes the `resume` route param that useAuthResume delivers.
//
// The param is created by the replay navigate itself, so unlike anything
// stored it cannot be stale. It is cleared as soon as it is read, so a
// re-focus or a re-render cannot fire the action twice.

import {useEffect, useRef} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';

import type {AuthIntentAction} from '../lib/authIntent';

export function useResumeAction(
  handlers: Partial<Record<AuthIntentAction, () => void>>,
): void {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const resume: AuthIntentAction | undefined = route.params?.resume;
  // Handlers are usually inline arrow functions, so a ref keeps this effect
  // keyed on the param alone rather than re-running on every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!resume) return;
    const run = handlersRef.current[resume];
    // Clear first: if the handler throws, we still must not loop.
    navigation.setParams({resume: undefined});
    run?.();
  }, [resume, navigation]);
}
