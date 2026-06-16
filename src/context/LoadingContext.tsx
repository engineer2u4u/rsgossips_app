// Global "busy" overlay state, ported from the web app's LoadingContext.
// On RN we render the overlay via <Modal> (replaces the web's createPortal
// to document.body) and a SafeAreaProvider/StatusBar-friendly absolute layer.
//
// Usage:
//   const { withLoading, startLoading, stopLoading } = useGlobalLoading();
//   await withLoading(myAsyncFn(), 'Saving…');
//
// Multiple overlapping starts are reference-counted so the overlay stays up
// until the last operation finishes.

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface LoadingContextValue {
  loading: boolean;
  message: string;
  startLoading: (msg?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, msg?: string) => Promise<T>;
}

const fallback: LoadingContextValue = {
  loading: false,
  message: '',
  startLoading: () => {},
  stopLoading: () => {},
  withLoading: <T,>(p: Promise<T>) => p,
};

const LoadingContext = createContext<LoadingContextValue>(fallback);

export function LoadingProvider({children}: {children: ReactNode}) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const messageStack = useRef<string[]>([]);

  const startLoading = useCallback((msg = '') => {
    setCount(c => c + 1);
    messageStack.current.push(msg);
    setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setCount(c => Math.max(0, c - 1));
    messageStack.current.pop();
    setMessage(messageStack.current[messageStack.current.length - 1] || '');
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, msg = ''): Promise<T> => {
      startLoading(msg);
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const value = useMemo<LoadingContextValue>(
    () => ({
      loading: count > 0,
      message,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [count, message, startLoading, stopLoading, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoaderOverlay loading={count > 0} message={message} />
    </LoadingContext.Provider>
  );
}

function GlobalLoaderOverlay({
  loading,
  message,
}: {
  loading: boolean;
  message: string;
}) {
  // `transparent` + onRequestClose noop blocks the hardware back button
  // while a long-running op is in flight — matches the web's behaviour of
  // swallowing Enter/Space/Escape.
  return (
    <Modal
      visible={loading}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#5851DB" />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
    minWidth: 120,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});

export function useGlobalLoading(): LoadingContextValue {
  return useContext(LoadingContext);
}
