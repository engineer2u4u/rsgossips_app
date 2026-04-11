import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  User,
  Mail,
  MapPin,
  FileText,
  Instagram,
  Youtube,
  Globe,
  Check,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {
  NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY,
} from '@env';

interface Props {
  onBack: () => void;
}

const EditProfilePage: React.FC<Props> = ({onBack}) => {
  const {profile, user, refreshProfile} = useAuth();

  const [name, setName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [tiktok, setTiktok] = useState(profile?.tiktok_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtube_url || '');
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const photo = profile?.profile_photo_url;
  const handle = profile?.instagram_handle || profile?.username || '';
  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          table: 'influencer_profiles',
          name,
          bio,
          location,
          email,
          address,
          tiktokUrl: tiktok,
          youtubeUrl,
          facebookUrl,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, 1200);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
        <View className="flex-row items-center" style={{gap: 12}}>
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
            <ChevronLeft size={20} color="#E60076" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800">Edit Profile</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saved ? (
            <View className="flex-row items-center bg-green-50 px-4 py-2 rounded-xl" style={{gap: 4}}>
              <Check size={16} color="#10B981" />
              <Text className="text-sm font-bold text-green-600">Saved!</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              style={{borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, opacity: saving ? 0.6 : 1}}
              className="flex-row items-center justify-center">
              {saving && <ActivityIndicator size="small" color="white" style={{marginRight: 6}} />}
              <Text className="text-white text-sm font-bold">
                {saving ? 'Saving' : 'Save'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center py-6">
          {photo ? (
            <Image
              source={{uri: photo}}
              className="w-24 h-24 rounded-2xl"
              style={{borderWidth: 3, borderColor: '#F3F4F6'}}
            />
          ) : (
            <LinearGradient
              colors={['#FF2D78', '#FF6BA1']}
              style={{width: 96, height: 96, borderRadius: 16, alignItems: 'center', justifyContent: 'center'}}>
              <Text className="text-white text-3xl font-bold">{initials}</Text>
            </LinearGradient>
          )}
          <Text className="text-sm text-gray-400 italic mt-2">@{handle}</Text>
        </View>

        <View className="px-5" style={{gap: 16}}>
          {/* Basic Info */}
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Basic Information
          </Text>

          <InputGroup
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Your name"
            icon={<User size={16} color="#9810FA" />}
          />
          <InputGroup
            label="Bio"
            value={bio}
            onChange={setBio}
            placeholder="Tell brands about yourself..."
            multiline
          />
          <InputGroup
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
            icon={<Mail size={16} color="#9810FA" />}
          />
          <InputGroup
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="City, Country"
            icon={<MapPin size={16} color="#9810FA" />}
          />
          <InputGroup
            label="Address"
            value={address}
            onChange={setAddress}
            placeholder="Full address"
            icon={<FileText size={16} color="#9810FA" />}
          />

          {/* Social Links */}
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
            Social Links
          </Text>

          <InputGroup
            label="Instagram"
            value={`@${handle}`}
            onChange={() => {}}
            placeholder="@handle"
            icon={<Instagram size={16} color="#E60076" />}
            disabled
          />
          <InputGroup
            label="TikTok"
            value={tiktok}
            onChange={setTiktok}
            placeholder="TikTok URL"
            icon={<Globe size={16} color="#000" />}
          />
          <InputGroup
            label="YouTube"
            value={youtubeUrl}
            onChange={setYoutubeUrl}
            placeholder="YouTube channel URL"
            icon={<Youtube size={16} color="#FF0000" />}
          />
          <InputGroup
            label="Facebook"
            value={facebookUrl}
            onChange={setFacebookUrl}
            placeholder="Facebook page URL"
            icon={<Globe size={16} color="#3B82F6" />}
          />
        </View>

        {/* Save Button (bottom) */}
        <View className="px-5 mt-6 mb-8">
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.9}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{borderRadius: 16, height: 52, opacity: saving ? 0.6 : 1}}
              className="items-center justify-center flex-row">
              {saving && <ActivityIndicator size="small" color="white" style={{marginRight: 8}} />}
              <Text className="text-white font-bold text-base">
                {saving ? 'Saving Changes...' : saved ? 'Saved!' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  return (
    <View style={{gap: 6}}>
      <Text className="text-[10px] font-black text-gray-400 uppercase ml-1">
        {label}
      </Text>
      <View className="relative">
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
          className={`bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 ${
            icon ? 'pl-12' : 'pl-5'
          } pr-5 ${disabled ? 'opacity-60' : ''}`}
          style={{
            paddingVertical: multiline ? 16 : 14,
            minHeight: multiline ? 100 : undefined,
          }}
        />
      </View>
    </View>
  );
}

export default EditProfilePage;
