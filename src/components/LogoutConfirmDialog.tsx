// Confirm-before-logout modal. Web parity: commit ae907f0 added a
// "Are you sure?" gate on signout so a stray tap doesn't kill the session.
//
// Usage:
//   const [show, setShow] = useState(false);
//   <LogoutConfirmDialog
//     visible={show}
//     onCancel={() => setShow(false)}
//     onConfirm={async () => { await signOut(); setShow(false); }}
//   />

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {LogOut} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

export default function LogoutConfirmDialog({
  visible,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel,
}: Props) {
  const {t} = useTranslation();
  const resolvedTitle = title ?? t('LogoutConfirmDialog.title');
  const resolvedMessage = message ?? t('LogoutConfirmDialog.message');
  const resolvedConfirmLabel =
    confirmLabel ?? t('LogoutConfirmDialog.confirmLabel');
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    if (busy) return;
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}>
      <Pressable style={styles.scrim} onPress={handleCancel}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <LogOut size={22} color="#dc2626" />
          </View>
          <Text style={styles.title}>{resolvedTitle}</Text>
          <Text style={styles.message}>{resolvedMessage}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              disabled={busy}
              style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>
                {t('LogoutConfirmDialog.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              style={[styles.btn, styles.btnDanger]}>
              {busy ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.btnDangerText}>{resolvedConfirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6},
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  actions: {flexDirection: 'row', gap: 10, width: '100%'},
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {backgroundColor: '#f1f5f9'},
  btnGhostText: {color: '#0f172a', fontSize: 14, fontWeight: '600'},
  btnDanger: {backgroundColor: '#dc2626'},
  btnDangerText: {color: 'white', fontSize: 14, fontWeight: '700'},
});
