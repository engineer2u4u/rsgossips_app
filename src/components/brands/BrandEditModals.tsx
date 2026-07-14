// Three edit modals for the brand profile screen: Brand Info, Contact Details,
// Categories. Each one collects its slice of fields and hands a camelCase
// payload to onSave — the parent piping it into update-profile.
//
// Web parity: src/app/brands/profile/page.js (BrandInfoModal, ContactDetailsModal,
// CategoriesModal). Field names match the update-profile edge function exactly.

import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Check, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';

// ─────────── Generic primitives ───────────

interface EditModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  children: React.ReactNode;
  saveLabel?: string;
  canSave?: boolean;
}

export function EditModal({
  visible,
  title,
  subtitle,
  onClose,
  onSave,
  children,
  saveLabel,
  canSave = true,
}: EditModalProps) {
  const {t} = useTranslation();
  const [saving, setSaving] = useState(false);
  const resolvedSaveLabel = saveLabel ?? t('BrandsBrandEditModals.save');

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={saving ? undefined : onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.scrim}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={{flex: 1}}>
              <Text style={s.title}>{title}</Text>
              {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              disabled={saving}
              hitSlop={8}
              style={s.close}>
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerStyle={{padding: 18, gap: 14}}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              style={[s.btn, s.btnGhost]}>
              <Text style={s.btnGhostText}>
                {t('BrandsBrandEditModals.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave || saving}
              style={[s.btn, s.btnPrimary, {opacity: !canSave || saving ? 0.5 : 1}]}>
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={s.btnPrimaryText}>{resolvedSaveLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'email';
  inputMode?: 'numeric' | 'email' | 'tel';
}) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        autoCapitalize={type === 'email' ? 'none' : 'sentences'}
        keyboardType={
          inputMode === 'numeric'
            ? 'number-pad'
            : type === 'email' || inputMode === 'email'
              ? 'email-address'
              : inputMode === 'tel'
                ? 'phone-pad'
                : 'default'
        }
        style={s.input}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

// ─────────── Brand info modal ───────────

interface BrandProfileShape {
  brand_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  gstin?: string;
  gstin_legal_name?: string;
  gstin_trade_name?: string;
  gstin_business_type?: string;
  gstin_address?: string;
  gstin_state?: string;
  gstin_pincode?: string;
  categories?: string[];
  logo_url?: string;
}

export interface BrandInfoPayload {
  brandName: string;
  gstinLegalName: string;
  gstinTradeName: string;
  gstinBusinessType: string;
  gstinAddress: string;
  gstinState: string;
  gstinPincode: string;
}

export function BrandInfoEditModal({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: BrandProfileShape;
  onClose: () => void;
  onSave: (payload: BrandInfoPayload) => Promise<void>;
}) {
  const {t} = useTranslation();
  const [brandName, setBrandName] = useState(profile.brand_name || '');
  const [legalName, setLegalName] = useState(profile.gstin_legal_name || '');
  const [tradeName, setTradeName] = useState(profile.gstin_trade_name || '');
  const [businessType, setBusinessType] = useState(
    profile.gstin_business_type || '',
  );
  const [address, setAddress] = useState(profile.gstin_address || '');
  const [state, setState] = useState(profile.gstin_state || '');
  const [pincode, setPincode] = useState(profile.gstin_pincode || '');

  return (
    <EditModal
      visible={visible}
      title={t('BrandsBrandEditModals.brandInfo.title')}
      subtitle={t('BrandsBrandEditModals.brandInfo.subtitle')}
      onClose={onClose}
      onSave={async () => {
        await onSave({
          brandName: brandName.trim(),
          gstinLegalName: legalName.trim(),
          gstinTradeName: tradeName.trim(),
          gstinBusinessType: businessType.trim(),
          gstinAddress: address.trim(),
          gstinState: state.trim(),
          gstinPincode: pincode.trim(),
        });
        onClose();
      }}>
      <Field
        label={t('BrandsBrandEditModals.brandInfo.brandNameLabel')}
        value={brandName}
        onChange={setBrandName}
        placeholder={t('BrandsBrandEditModals.brandInfo.brandNamePlaceholder')}
        hint={t('BrandsBrandEditModals.brandInfo.brandNameHint')}
      />
      <Field
        label={t('BrandsBrandEditModals.brandInfo.legalNameLabel')}
        value={legalName}
        onChange={setLegalName}
        placeholder={t('BrandsBrandEditModals.brandInfo.legalNamePlaceholder')}
      />
      <Field
        label={t('BrandsBrandEditModals.brandInfo.tradeNameLabel')}
        value={tradeName}
        onChange={setTradeName}
        placeholder={t('BrandsBrandEditModals.brandInfo.tradeNamePlaceholder')}
      />
      <Field
        label={t('BrandsBrandEditModals.brandInfo.businessTypeLabel')}
        value={businessType}
        onChange={setBusinessType}
        placeholder={t('BrandsBrandEditModals.brandInfo.businessTypePlaceholder')}
      />
      <Field
        label={t('BrandsBrandEditModals.brandInfo.addressLabel')}
        value={address}
        onChange={setAddress}
        placeholder={t('BrandsBrandEditModals.brandInfo.addressPlaceholder')}
      />
      <View style={{flexDirection: 'row', gap: 12}}>
        <View style={{flex: 1}}>
          <Field
            label={t('BrandsBrandEditModals.brandInfo.stateLabel')}
            value={state}
            onChange={setState}
            placeholder={t('BrandsBrandEditModals.brandInfo.statePlaceholder')}
          />
        </View>
        <View style={{flex: 1}}>
          <Field
            label={t('BrandsBrandEditModals.brandInfo.pincodeLabel')}
            value={pincode}
            onChange={v => setPincode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('BrandsBrandEditModals.brandInfo.pincodePlaceholder')}
            inputMode="numeric"
          />
        </View>
      </View>
      {profile.gstin ? (
        <View style={s.gstHintBox}>
          <Text style={s.gstHintText}>
            {t('BrandsBrandEditModals.brandInfo.gstHintPrefix')}{' '}
            <Text style={{fontWeight: '800'}}>{profile.gstin}</Text>
            {t('BrandsBrandEditModals.brandInfo.gstHintSuffix')}
          </Text>
        </View>
      ) : null}
    </EditModal>
  );
}

// ─────────── Contact details modal ───────────

export interface ContactDetailsPayload {
  contactName: string;
  contactEmail: string;
}

export function ContactDetailsEditModal({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: BrandProfileShape;
  onClose: () => void;
  onSave: (payload: ContactDetailsPayload) => Promise<void>;
}) {
  const {t} = useTranslation();
  const [contactName, setContactName] = useState(profile.contact_name || '');
  const [contactEmail, setContactEmail] = useState(profile.contact_email || '');

  const emailLooksOk =
    !contactEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());

  return (
    <EditModal
      visible={visible}
      title={t('BrandsBrandEditModals.contact.title')}
      subtitle={t('BrandsBrandEditModals.contact.subtitle')}
      canSave={emailLooksOk}
      onClose={onClose}
      onSave={async () => {
        await onSave({
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
        });
        onClose();
      }}>
      <Field
        label={t('BrandsBrandEditModals.contact.managerLabel')}
        value={contactName}
        onChange={setContactName}
        placeholder={t('BrandsBrandEditModals.contact.managerPlaceholder')}
      />

      {/* Phone is the login identity — read-only. Changing it here would
          let a signed-in user lock themselves out. */}
      <View>
        <Text style={s.fieldLabel}>
          {t('BrandsBrandEditModals.contact.mobileLabel')}
        </Text>
        <View style={s.readonlyRow}>
          <Text style={s.readonlyValue} numberOfLines={1}>
            {profile.contact_phone || '—'}
          </Text>
          <Text style={s.readonlyTag}>
            {t('BrandsBrandEditModals.contact.mobileTag')}
          </Text>
        </View>
        <Text style={s.hint}>
          {t('BrandsBrandEditModals.contact.mobileHint')}
        </Text>
      </View>

      <Field
        label={t('BrandsBrandEditModals.contact.emailLabel')}
        value={contactEmail}
        onChange={setContactEmail}
        placeholder={t('BrandsBrandEditModals.contact.emailPlaceholder')}
        hint={t('BrandsBrandEditModals.contact.emailHint')}
        type="email"
      />
      {contactEmail && !emailLooksOk ? (
        <Text style={s.errorText}>
          {t('BrandsBrandEditModals.contact.emailInvalid')}
        </Text>
      ) : null}
    </EditModal>
  );
}

// ─────────── Categories modal ───────────

export interface CategoriesPayload {
  categories: string[];
}

const CATEGORIES = [
  'Beauty & Skincare',
  'Fashion & Lifestyle',
  'Food & Beverage',
  'Health, Fitness & Wellness',
  'Travel & Hospitality',
  'Technology & Gadgets',
  'Parenting & Family',
  'Home & Decor',
  'Finance & Personal Finance',
  'Education & Career',
  'Gaming & Entertainment',
  'Automobile & Mobility',
  'Entrepreneurship & Business',
  'Sustainable & Eco-conscious Living',
  'Pet Care & Animals',
];

export function CategoriesEditModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: string[];
  onClose: () => void;
  onSave: (payload: CategoriesPayload) => Promise<void>;
}) {
  const {t} = useTranslation();
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (cat: string) => {
    setSelected(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  return (
    <EditModal
      visible={visible}
      title={t('BrandsBrandEditModals.categories.title')}
      subtitle={t('BrandsBrandEditModals.categories.subtitle', {
        count: selected.length,
        total: CATEGORIES.length,
      })}
      onClose={onClose}
      onSave={async () => {
        await onSave({categories: selected});
        onClose();
      }}>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {CATEGORIES.map(c => {
          const active = selected.includes(c);
          return (
            <Pressable
              key={c}
              onPress={() => toggle(c)}
              style={[s.chip, active && s.chipActive]}>
              {active ? <Check size={12} color="#5851DB" /> : null}
              <Text
                style={[s.chipText, active && {color: '#5851DB', fontWeight: '700'}]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </EditModal>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: '50%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  close: {padding: 4},
  title: {fontSize: 17, fontWeight: '800', color: '#0f172a'},
  subtitle: {fontSize: 12, color: '#64748b', marginTop: 4},
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  hint: {fontSize: 10, color: '#94a3b8', marginTop: 4},
  errorText: {fontSize: 11, color: '#dc2626', fontWeight: '700'},
  readonlyRow: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readonlyValue: {fontSize: 13, color: '#64748b', fontWeight: '700', flex: 1},
  readonlyTag: {fontSize: 9, color: '#94a3b8', fontWeight: '700'},
  gstHintBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  gstHintText: {fontSize: 11, color: '#92400e', lineHeight: 16},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {backgroundColor: '#EBE9FE', borderColor: '#5851DB'},
  chipText: {fontSize: 12, color: '#475569', fontWeight: '600'},
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {borderWidth: 1, borderColor: '#e2e8f0'},
  btnGhostText: {color: '#475569', fontWeight: '700', fontSize: 13},
  btnPrimary: {backgroundColor: '#5851DB'},
  btnPrimaryText: {color: 'white', fontWeight: '800', fontSize: 13},
});
