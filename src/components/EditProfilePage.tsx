import React, {useState} from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Camera,
  Check,
  ChevronLeft,
  FileText,
  Globe,
  Instagram,
  Mail,
  MapPin,
  RotateCcw,
  User,
  Youtube,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';
import {invokeFn} from '../lib/api';
import {pickFromLibrary} from '../lib/image-picker';
import {uploadProfilePhoto} from '../lib/image-upload';
import {useProfilePhoto} from '../utils/photoUrl';

const CATEGORY_OPTIONS = [
  'Beauty & Skincare', 'Fashion & Lifestyle', 'Food & Beverage',
  'Health, Fitness & Wellness', 'Travel & Hospitality', 'Technology & Gadgets',
  'Education & Career', 'Gaming & Entertainment', 'Home & Decor',
];

const SERVICE_OPTIONS = [
  {id: 'reels', label: 'Reels'},
  {id: 'stories', label: 'Stories'},
  {id: 'shorts', label: 'YouTube Shorts'},
  {id: 'posts', label: 'Static Posts'},
  {id: 'ugc', label: 'UGC Videos'},
];

interface Props {
  onBack: () => void;
}

const EditProfilePage: React.FC<Props> = ({onBack}) => {
  const {t} = useTranslation();
  const {profile, user, refreshProfile} = useAuth();
  const {withLoading} = useGlobalLoading();

  const [name, setName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  // Gender — powers the brand-side Gender filter. Previously only
  // settable by admins; creators can now maintain it themselves.
  const [gender, setGender] = useState(profile?.gender || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [tiktok, setTiktok] = useState(profile?.tiktok_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtube_url || '');
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url || '');
  const [categories, setCategories] = useState<string[]>(profile?.categories || []);
  const [services, setServices] = useState<string[]>(profile?.services || []);
  // service_rates from the DB comes back as Record<string, number>; the form
  // works with strings (text inputs). Coerce on init, coerce back on save.
  const [serviceRates, setServiceRates] = useState<Record<string, string>>(
    () => {
      const raw = profile?.service_rates || {};
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) {
        out[k] = v != null ? String(v) : '';
      }
      return out;
    },
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const photo = useProfilePhoto();
  const handle = profile?.instagram_handle || profile?.username || '';
  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handlePickPhoto = async () => {
    if (!user?.id) return;
    try {
      // crop: 'square' opens the native image-crop-picker UI with a fixed
      // 1:1 frame so every avatar lands as a square — no skewed photos.
      const image = await pickFromLibrary({crop: 'square', size: 800});
      if (!image) return;
      await withLoading(
        (async () => {
          try {
            await uploadProfilePhoto(user.id, image, 'influencer_profiles');
            await refreshProfile();
          } catch (err: any) {
            Alert.alert(
              t('EditProfilePage.alert.uploadFailed.title'),
              err?.message || t('EditProfilePage.alert.uploadFailed.fallback'),
            );
          }
        })(),
        t('EditProfilePage.loading.uploadingPhoto'),
      );
    } catch (err: any) {
      Alert.alert(
        t('EditProfilePage.alert.pickerError.title'),
        err?.message || t('EditProfilePage.alert.pickerError.fallback'),
      );
    }
  };

  const handleRevertPhoto = () => {
    if (!user?.id) return;
    Alert.alert(
      t('EditProfilePage.alert.revert.title'),
      t('EditProfilePage.alert.revert.message'),
      [
        {text: t('EditProfilePage.alert.cancel'), style: 'cancel'},
        {
          text: t('EditProfilePage.alert.revert.confirm'),
          style: 'destructive',
          onPress: () =>
            withLoading(
              (async () => {
                try {
                  // The web's revertBrandLogo flag is brand-specific; the
                  // influencer side uses a separate revertProfilePhoto flag.
                  await invokeFn('update-profile', {
                    userId: user.id,
                    table: 'influencer_profiles',
                    revertProfilePhoto: true,
                  });
                  await refreshProfile();
                } catch (err: any) {
                  Alert.alert(
                    t('EditProfilePage.alert.revertFailed.title'),
                    err?.message ||
                      t('EditProfilePage.alert.revertFailed.fallback'),
                  );
                }
              })(),
              t('EditProfilePage.loading.revertingPhoto'),
            ),
        },
      ],
    );
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await invokeFn('update-profile', {
        userId: user?.id,
        table: 'influencer_profiles',
        name,
        bio,
        location,
        gender,
        email,
        address,
        tiktokUrl: tiktok,
        youtubeUrl,
        facebookUrl,
        categories,
        services,
        serviceRates,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, 1200);
    } catch {
      // Saving failed — leave the form open so the user can retry. The
      // global loading overlay (if any) is handled by withLoading callers;
      // here we just keep the inline button state.
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{backgroundColor: '#F5F4F8'}}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100"
        style={{backgroundColor: '#ffffff'}}>
        <View className="flex-row items-center" style={{gap: 12}}>
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
            <ChevronLeft size={20} color="#E60076" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800">
            {t('EditProfilePage.header.title')}
          </Text>
        </View>
        {saved ? (
          <View className="flex-row items-center bg-green-50 px-4 py-2 rounded-xl" style={{gap: 4}}>
            <Check size={16} color="#10B981" />
            <Text className="text-sm font-bold text-green-600">
              {t('EditProfilePage.header.saved')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              opacity: saving ? 0.6 : 1,
            }}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            {saving && <ActivityIndicator size="small" color="white" style={{marginRight: 6}} />}
            <Text className="text-white text-sm font-bold">
              {saving
                ? t('EditProfilePage.header.saving')
                : t('EditProfilePage.header.save')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar (tappable for upload) */}
        <View className="items-center py-6">
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85}>
            <View className="relative">
              {photo ? (
                <Image
                  key={photo}
                  source={{uri: photo}}
                  className="w-24 h-24 rounded-2xl"
                  style={{borderWidth: 3, borderColor: '#F3F4F6'}}
                />
              ) : (
                <LinearGradient
                  colors={['#FF2D78', '#FF6BA1']}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text className="text-white text-3xl font-bold">{initials}</Text>
                </LinearGradient>
              )}
              <View
                className="absolute -bottom-1 -right-1 bg-white rounded-full"
                style={{padding: 4}}>
                <View
                  style={{
                    backgroundColor: '#E60076',
                    padding: 6,
                    borderRadius: 999,
                  }}>
                  <Camera size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-gray-400 italic mt-2">
            {handle ? `@${handle}` : t('EditProfilePage.avatar.tapToUpload')}
          </Text>
          {photo ? (
            <TouchableOpacity
              onPress={handleRevertPhoto}
              className="flex-row items-center mt-1"
              style={{gap: 4}}
              hitSlop={6}>
              <RotateCcw size={10} color="#94a3b8" />
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t('EditProfilePage.avatar.revertToInstagram')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View
          className="px-5"
          style={{gap: Platform.OS === 'ios' ? 18 : 16}}>
          {/* Basic Info */}
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {t('EditProfilePage.section.basicInfo')}
          </Text>

          <InputGroup
            label={t('EditProfilePage.field.fullName.label')}
            value={name}
            onChange={setName}
            placeholder={t('EditProfilePage.field.fullName.placeholder')}
            icon={<User size={16} color="#9810FA" />}
          />
          <InputGroup
            label={t('EditProfilePage.field.bio.label')}
            value={bio}
            onChange={setBio}
            placeholder={t('EditProfilePage.field.bio.placeholder')}
            multiline
          />
          <InputGroup
            label={t('EditProfilePage.field.email.label')}
            value={email}
            onChange={setEmail}
            placeholder={t('EditProfilePage.field.email.placeholder')}
            icon={<Mail size={16} color="#9810FA" />}
          />
          <InputGroup
            label={t('EditProfilePage.field.location.label')}
            value={location}
            onChange={setLocation}
            placeholder={t('EditProfilePage.field.location.placeholder')}
            icon={<MapPin size={16} color="#9810FA" />}
          />

          {/* Gender — chip row (RN has no native select). Tapping the
              active chip again clears the selection. */}
          <View style={{gap: 8}}>
            <Text className="text-[10px] font-black text-gray-400 uppercase ml-1">
              {t('EditProfilePage.gender.title')}
            </Text>
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {[
                {value: 'male'},
                {value: 'female'},
                {value: 'non_binary'},
                {value: 'prefer_not_to_say'},
              ].map(opt => {
                const active = gender === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGender(active ? '' : opt.value)}
                    className={`px-4 py-2.5 rounded-full border ${
                      active
                        ? 'bg-purple-500 border-purple-500'
                        : 'bg-white border-gray-200'
                    }`}>
                    <Text
                      className={`text-xs font-black ${
                        active ? 'text-white' : 'text-gray-600'
                      }`}>
                      {t(`EditProfilePage.gender.${opt.value}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <InputGroup
            label={t('EditProfilePage.field.phone.label')}
            value={profile?.phone || ''}
            onChange={() => {}}
            placeholder={t('EditProfilePage.field.phone.placeholder')}
            icon={<User size={16} color="#9810FA" />}
            disabled
          />
          <InputGroup
            label={t('EditProfilePage.field.address.label')}
            value={address}
            onChange={setAddress}
            placeholder={t('EditProfilePage.field.address.placeholder')}
            icon={<FileText size={16} color="#9810FA" />}
          />

          {/* Social Links */}
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
            {t('EditProfilePage.section.socialLinks')}
          </Text>

          <InputGroup
            label="Instagram"
            value={`@${handle}`}
            onChange={() => {}}
            placeholder="@handle"
            icon={<Instagram size={16} color="#E60076" />}
            disabled
          />
          <Text className="text-[9px] font-bold text-gray-400 ml-1 -mt-2">
            {t('EditProfilePage.instagramSyncNote')}
          </Text>
          <InputGroup
            label="TikTok"
            value={tiktok}
            onChange={setTiktok}
            placeholder={t('EditProfilePage.field.tiktok.placeholder')}
            icon={<Globe size={16} color="#000" />}
          />
          <InputGroup
            label="YouTube"
            value={youtubeUrl}
            onChange={setYoutubeUrl}
            placeholder={t('EditProfilePage.field.youtube.placeholder')}
            icon={<Youtube size={16} color="#FF0000" />}
          />
          <InputGroup
            label="Facebook"
            value={facebookUrl}
            onChange={setFacebookUrl}
            placeholder={t('EditProfilePage.field.facebook.placeholder')}
            icon={<Globe size={16} color="#3B82F6" />}
          />

          {/* Categories */}
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
            {t('EditProfilePage.section.categories')}
          </Text>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {CATEGORY_OPTIONS.map(cat => {
              const isSelected = categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() =>
                    setCategories(prev =>
                      prev.includes(cat)
                        ? prev.filter(c => c !== cat)
                        : [...prev, cat],
                    )
                  }
                  className={`px-4 py-2 rounded-full border ${
                    isSelected
                      ? 'bg-[#E60076] border-[#E60076]'
                      : 'bg-white border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-600'
                    }`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Services & Rates */}
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
            {t('EditProfilePage.section.servicesRates')}
          </Text>
          <View style={{gap: 8}}>
            {SERVICE_OPTIONS.map(svc => {
              const isSelected = services.includes(svc.id);
              return (
                <View key={svc.id}>
                  <TouchableOpacity
                    onPress={() =>
                      setServices(prev =>
                        prev.includes(svc.id)
                          ? prev.filter(s => s !== svc.id)
                          : [...prev, svc.id],
                      )
                    }
                    className={`flex-row items-center p-3 rounded-xl border ${
                      isSelected
                        ? 'bg-pink-50 border-[#E60076]'
                        : 'bg-white border-slate-200'
                    }`}
                    style={{gap: 10}}>
                    <Text
                      className={`text-sm font-semibold flex-1 ${
                        isSelected ? 'text-[#E60076]' : 'text-slate-600'
                      }`}>
                      {t(`EditProfilePage.services.${svc.id}`)}
                    </Text>
                    {isSelected && (
                      <View className="flex-row items-center bg-white border border-slate-200 rounded-lg px-3 h-9" style={{gap: 4}}>
                        <Text className="text-slate-400 text-sm">₹</Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={String(serviceRates[svc.id] || '')}
                          onChangeText={v =>
                            setServiceRates(prev => ({...prev, [svc.id]: v}))
                          }
                          placeholder="0"
                          className="w-16 text-sm font-bold text-slate-800"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Save Button (bottom) */}
        <View className="px-5 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
            style={{
              borderRadius: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              opacity: saving ? 0.6 : 1,
            }}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            {saving && <ActivityIndicator size="small" color="white" style={{marginRight: 8}} />}
            <Text className="text-white font-bold text-base">
              {saving
                ? t('EditProfilePage.saveButton.saving')
                : saved
                  ? t('EditProfilePage.saveButton.saved')
                  : t('EditProfilePage.saveButton.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  icon,
  disabled = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  multiline?: boolean;
}) {
  // iOS measures TextInput intrinsic height differently from Android — the
  // same paddingVertical renders taller on iOS, and the text sometimes sits
  // off-centre because iOS doesn't honour textAlignVertical. Use a
  // platform-specific padding + an explicit minHeight on single-line fields
  // so the visible field height matches Android.
  const padV = multiline
    ? 14
    : Platform.OS === 'ios'
      ? 12
      : 14;
  const minH = multiline ? 100 : Platform.OS === 'ios' ? 46 : undefined;

  return (
    <View style={{gap: 6}}>
      <Text className="text-[10px] font-black text-gray-400 uppercase ml-1">
        {label}
      </Text>
      <View
        className="relative bg-white rounded-2xl border border-slate-100"
        style={{
          // Soft card shadow so each field reads as a tile against the page
          // bg, matching the rest of the profile surfaces.
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 2},
          elevation: 2,
        }}>
        {icon && (
          <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
            {icon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          editable={!disabled}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={`text-sm font-bold text-gray-700 ${
            icon ? 'pl-12' : 'pl-5'
          } pr-5 ${disabled ? 'opacity-60' : ''}`}
          style={{
            paddingTop: padV,
            paddingBottom: padV,
            minHeight: minH,
          }}
        />
      </View>
    </View>
  );
}

export default EditProfilePage;
