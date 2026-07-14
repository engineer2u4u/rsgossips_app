// Brand profile — real `useAuth().profile` data with editable Brand Info,
// Contact Details, and Categories via update-profile edge function.
//
// Web parity: src/app/brands/profile/page.js. Image upload (logo + revert)
// is its own batch — needs react-native-image-picker + a rebuild — so
// the avatar shows initials/photo URL but the "Change Logo" CTA notes
// that this is editable on the web for now.

import React, {useCallback, useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  HelpCircle,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Tag,
  User,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import BrandsLayout from '../layouts/BrandLayout';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';
import {invokeFn} from '../lib/api';
import {pickFromLibrary} from '../lib/image-picker';
import {uploadProfilePhoto} from '../lib/image-upload';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';
import {BrandTrustWidget} from '../components/brands/BrandTrustWidget';
import HelpSupport from '../components/HelpAndSupport';
import {
  BrandInfoEditModal,
  CategoriesEditModal,
  ContactDetailsEditModal,
  type BrandInfoPayload,
  type CategoriesPayload,
  type ContactDetailsPayload,
} from '../components/brands/BrandEditModals';

export default function BrandProfile() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {profile, signOut, refreshProfile, user} = useAuth();
  const {withLoading} = useGlobalLoading();

  const [showLogout, setShowLogout] = useState(false);
  const [brandInfoOpen, setBrandInfoOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Refresh on focus so an edit made elsewhere (e.g. signup) shows up.
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const displayName =
    profile?.gstin_trade_name ||
    profile?.brand_name ||
    profile?.contact_name ||
    t('ScreensBrandProfile.brand');
  const initials = displayName.charAt(0).toUpperCase();
  const handle = profile?.instagram_handle || profile?.username || '';
  const categories: string[] = Array.isArray(profile?.categories)
    ? profile!.categories!
    : [];

  // Single edit path. Payload field names are camelCase to match the
  // update-profile edge function's expected body.
  const saveBrandFields = async (
    payload: Record<string, any>,
    loadingMsg: string,
  ) => {
    if (!user?.id) return;
    await withLoading(
      (async () => {
        try {
          await invokeFn('update-profile', {
            userId: user.id,
            table: 'brand_profiles',
            ...payload,
          });
          await refreshProfile();
        } catch (err: any) {
          Alert.alert(
            t('ScreensBrandProfile.failedToSave'),
            err?.message || t('ScreensBrandProfile.tryAgainLater'),
          );
          throw err;
        }
      })(),
      loadingMsg,
    );
  };

  const handlePickLogo = async () => {
    if (!user?.id) return;
    try {
      const image = await pickFromLibrary();
      if (!image) return;
      await withLoading(
        (async () => {
          try {
            await uploadProfilePhoto(user.id, image, 'brand_profiles');
            await refreshProfile();
          } catch (err: any) {
            Alert.alert(
              t('ScreensBrandProfile.uploadFailed'),
              err?.message || t('ScreensBrandProfile.tryAgainLater'),
            );
          }
        })(),
        t('ScreensBrandProfile.uploadingLogo'),
      );
    } catch (err: any) {
      Alert.alert(
        t('ScreensBrandProfile.pickerError'),
        err?.message || t('ScreensBrandProfile.couldNotOpenPicker'),
      );
    }
  };

  const handleRevertLogo = () => {
    Alert.alert(
      t('ScreensBrandProfile.revertLogoTitle'),
      t('ScreensBrandProfile.revertLogoMessage'),
      [
        {text: t('ScreensBrandProfile.cancel'), style: 'cancel'},
        {
          text: t('ScreensBrandProfile.revert'),
          style: 'destructive',
          onPress: () =>
            saveBrandFields(
              {revertBrandLogo: true},
              t('ScreensBrandProfile.revertingLogo'),
            ),
        },
      ],
    );
  };

  if (!profile) {
    return (
      <BrandsLayout>
        <View style={{padding: 40, alignItems: 'center'}}>
          <Text className="text-gray-400 text-sm">
            {t('ScreensBrandProfile.loadingProfile')}
          </Text>
        </View>
      </BrandsLayout>
    );
  }

  return (
    <BrandsLayout>
      {/* Header */}
      <LinearGradient
        colors={['#4C75BE', '#4A3996']}
        className="pt-12 pb-8 px-6 rounded-b-[40px] mb-20">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-bold text-white">
            {t('ScreensBrandProfile.myProfile')}
          </Text>
        </View>
      </LinearGradient>

      {/* Profile card */}
      <View className="px-6 -mt-4 mb-8">
        <View className="bg-white rounded-[32px] p-6 shadow-sm shadow-black/5">
          <View className="items-center -mt-16">
            <TouchableOpacity onPress={handlePickLogo} activeOpacity={0.85}>
              <View className="relative">
                {profile.logo_url ? (
                  <Image
                    source={{uri: profile.logo_url}}
                    className="w-24 h-24 rounded-[28px] bg-gray-100"
                    style={{borderRadius: 28}}
                  />
                ) : (
                  <LinearGradient
                    colors={['#2563EB', '#1D4ED8']}
                    className="w-24 h-24 rounded-[28px] items-center justify-center shadow-xl">
                    <Text className="text-white text-3xl font-bold">{initials}</Text>
                  </LinearGradient>
                )}
                <View className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                  <View className="bg-[#5851DB] p-1.5 rounded-full">
                    <Camera size={12} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            {profile.logo_url ? (
              <TouchableOpacity
                onPress={handleRevertLogo}
                className="flex-row items-center mt-2"
                style={{gap: 4}}
                hitSlop={6}>
                <RotateCcw size={10} color="#94a3b8" />
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('ScreensBrandProfile.revertToInstagram')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View className="items-center mt-4">
              <View className="flex-row items-center" style={{gap: 6}}>
                <Text className="text-xl font-extrabold text-gray-900">
                  {displayName}
                </Text>
                {profile.gstin ? (
                  <CheckCircle2 size={18} color="#3B82F6" />
                ) : null}
              </View>
              {handle ? (
                <Text className="text-[11px] text-gray-400 font-semibold mt-1">
                  @{handle}
                </Text>
              ) : null}
            </View>
          </View>

        </View>
      </View>

      {/* Trust score + completion breakdown */}
      <View className="px-6 mb-6">
        <BrandTrustWidget />
      </View>

      <View className="px-6" style={{gap: 32, paddingBottom: 32}}>
        {/* Brand Information */}
        <Section
          title={t('ScreensBrandProfile.brandInformation')}
          onEdit={() => setBrandInfoOpen(true)}>
          <View className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<Briefcase size={18} color="#60A5FA" />}
              label={profile.brand_name || profile.gstin_trade_name || '—'}
              sub={t('ScreensBrandProfile.brandCompanyName')}
            />
            {profile.gstin_legal_name ? (
              <InfoRow
                icon={<FileText size={18} color="#3B82F6" />}
                label={profile.gstin_legal_name}
                sub={t('ScreensBrandProfile.legalName')}
              />
            ) : null}
            {profile.gstin_business_type ? (
              <InfoRow
                icon={<ShieldCheck size={18} color="#6366F1" />}
                label={profile.gstin_business_type}
                sub={t('ScreensBrandProfile.businessType')}
              />
            ) : null}
            {profile.gstin_address ? (
              <InfoRow
                icon={<MapPin size={18} color="#93C5FD" />}
                label={[
                  profile.gstin_address,
                  profile.gstin_state,
                  profile.gstin_pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
                sub={t('ScreensBrandProfile.registeredAddress')}
                last
              />
            ) : (
              <InfoRow
                icon={<MapPin size={18} color="#93C5FD" />}
                label={t('ScreensBrandProfile.noAddressOnFile')}
                sub={t('ScreensBrandProfile.tapEditToAdd')}
                last
              />
            )}
          </View>
        </Section>

        {/* Contact Details */}
        <Section
          title={t('ScreensBrandProfile.contactDetails')}
          onEdit={() => setContactOpen(true)}>
          <View className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<User size={18} color="#4ADE80" />}
              label={profile.contact_name || '—'}
              sub={t('ScreensBrandProfile.brandManager')}
            />
            <InfoRow
              icon={<Phone size={18} color="#22C55E" />}
              label={profile.contact_phone || profile.phone || '—'}
              sub={t('ScreensBrandProfile.businessMobile')}
              isVerified
            />
            <InfoRow
              icon={<Mail size={18} color="#F87171" />}
              label={profile.contact_email || '—'}
              sub={t('ScreensBrandProfile.partnershipEmail')}
              isVerified={!!profile.contact_email}
              last
            />
          </View>
        </Section>

        {/* Categories */}
        <Section
          title={t('ScreensBrandProfile.categories')}
          onEdit={() => setCategoriesOpen(true)}>
          {categories.length > 0 ? (
            <View className="flex-row flex-wrap" style={{gap: 6}}>
              {categories.map(c => (
                <View
                  key={c}
                  className="px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
                  <Text className="text-[11px] font-semibold text-[#5851DB]">
                    {c}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl border border-gray-100 p-5 flex-row items-center" style={{gap: 12}}>
              <Tag size={18} color="#94A3B8" />
              <Text className="text-xs text-gray-400 flex-1">
                {t('ScreensBrandProfile.categoriesHint')}
              </Text>
            </View>
          )}
        </Section>

        {/* Instagram */}
        {handle ? (
          <Section title={t('ScreensBrandProfile.social')}>
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://instagram.com/${handle}`)}
              activeOpacity={0.8}
              className="bg-white p-4 rounded-2xl border border-gray-50 flex-row items-center"
              style={{gap: 12}}>
              <View className="p-2 bg-pink-500 rounded-lg">
                <Instagram size={16} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] text-gray-400 font-extrabold uppercase">
                  Instagram
                </Text>
                <Text className="text-[12px] font-bold text-gray-900 mt-0.5">
                  @{handle}
                </Text>
              </View>
              <ExternalLink size={14} color="#94a3b8" />
            </TouchableOpacity>
          </Section>
        ) : null}

        {/* GST card */}
        {profile.gstin ? (
          <Section title={t('ScreensBrandProfile.taxLegalDocuments')}>
            <View className="bg-white rounded-[28px] p-5 border border-gray-100">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row" style={{gap: 10}}>
                  <View className="p-2.5 bg-orange-50 rounded-xl">
                    <FileText size={20} color="#F97316" />
                  </View>
                  <View>
                    <Text className="text-[11px] font-extrabold text-gray-900">
                      {t('ScreensBrandProfile.gstRegistration')}
                    </Text>
                    <Text className="text-[9px] text-gray-400 font-semibold">
                      {t('ScreensBrandProfile.goodsServicesTax')}
                    </Text>
                  </View>
                </View>
                <View className="bg-green-50 px-3 py-1 rounded-lg">
                  <Text className="text-[9px] font-bold text-green-600 uppercase">
                    {t('ScreensBrandProfile.verified')}
                  </Text>
                </View>
              </View>
              <Text className="text-[8px] text-gray-400 font-extrabold uppercase mb-1">
                {t('ScreensBrandProfile.gstinNumber')}
              </Text>
              <Text className="text-[13px] font-extrabold text-gray-900 tracking-wider">
                {profile.gstin}
              </Text>
            </View>
          </Section>
        ) : null}

        {/* Account */}
        <Section title={t('ScreensBrandProfile.account')}>
          <TouchableOpacity
            onPress={() => setHelpOpen(true)}
            className="w-full bg-white p-5 rounded-3xl flex-row items-center border border-gray-100/50 shadow-sm mb-3"
            style={{gap: 16}}
            activeOpacity={0.8}>
            <View className="p-2 bg-indigo-50 rounded-xl">
              <HelpCircle size={18} color="#5851DB" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-800 font-bold text-sm">
                {t('ScreensBrandProfile.helpSupport')}
              </Text>
              <Text className="text-[11px] text-slate-400">
                {t('ScreensBrandProfile.helpSupportSub')}
              </Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLogout(true)}
            className="w-full bg-white p-5 rounded-3xl flex-row items-center border border-gray-100/50 shadow-sm"
            style={{gap: 16}}
            activeOpacity={0.8}>
            <View className="p-2 bg-red-50 rounded-xl">
              <LogOut size={18} color="#EF4444" />
            </View>
            <Text className="text-red-500 font-bold text-sm flex-1">
              {t('ScreensBrandProfile.logOut')}
            </Text>
          </TouchableOpacity>
        </Section>
      </View>

      {/* Help & Support — modal so it stacks above all other profile sections */}
      <Modal
        visible={helpOpen}
        animationType="slide"
        onRequestClose={() => setHelpOpen(false)}>
        <HelpSupport onBack={() => setHelpOpen(false)} />
      </Modal>

      <LogoutConfirmDialog
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => {
          await signOut();
          setShowLogout(false);
          navigation.navigate('Login' as never);
        }}
      />

      <BrandInfoEditModal
        visible={brandInfoOpen}
        profile={profile as any}
        onClose={() => setBrandInfoOpen(false)}
        onSave={(payload: BrandInfoPayload) =>
          saveBrandFields(payload, t('ScreensBrandProfile.savingBrandInfo'))
        }
      />

      <ContactDetailsEditModal
        visible={contactOpen}
        profile={profile as any}
        onClose={() => setContactOpen(false)}
        onSave={(payload: ContactDetailsPayload) =>
          saveBrandFields(payload, t('ScreensBrandProfile.savingContactDetails'))
        }
      />

      <CategoriesEditModal
        visible={categoriesOpen}
        initial={categories}
        onClose={() => setCategoriesOpen(false)}
        onSave={(payload: CategoriesPayload) =>
          saveBrandFields(payload, t('ScreensBrandProfile.savingCategories'))
        }
      />
    </BrandsLayout>
  );
}

/* ─────────── Helpers ─────────── */

const Section = ({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) => (
  <View className="" style={{gap: 12}}>
    <View className="flex-row items-center justify-between px-2">
      <Text className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
        {title}
      </Text>
      {onEdit ? (
        <TouchableOpacity onPress={onEdit} className="flex-row items-center" style={{gap: 4}} hitSlop={6}>
          <Pencil size={12} color="#5851DB" />
          <Text className="text-[10px] font-bold text-[#5851DB] uppercase">Edit</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    {children}
  </View>
);

const InfoRow = ({
  icon,
  label,
  sub,
  last,
  isVerified,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  last?: boolean;
  isVerified?: boolean;
}) => (
  <View
    className={`flex-row items-center p-5 ${!last ? 'border-b border-gray-50' : ''}`}
    style={{gap: 16}}>
    <View className="p-2.5 bg-blue-50 rounded-xl">{icon}</View>
    <View className="flex-1">
      <Text className="text-[11px] font-bold text-gray-900 leading-tight">
        {label}
      </Text>
      <Text className="text-[9px] text-gray-400 font-semibold mt-0.5">
        {sub}
      </Text>
    </View>
    <View className="flex-row items-center" style={{gap: 8}}>
      {isVerified ? (
        <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
      ) : null}
      <ChevronRight size={16} color="#D1D5DB" />
    </View>
  </View>
);
