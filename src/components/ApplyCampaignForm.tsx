import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Instagram,
  CheckCircle2,
  ExternalLink,
  User,
  Mail,
  Phone,
  Users,
  Activity,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {invokeFn, EdgeFunctionError} from '../lib/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  campaignData: any;
  onSubmitSuccess: () => void;
}

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function ApplyCampaignForm({visible, onClose, campaignData, onSubmitSuccess}: Props) {
  const {profile, user} = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [whyChooseYou, setWhyChooseYou] = useState('');

  const fullName = profile?.full_name || '';
  const email = profile?.email || '';
  const phone = profile?.phone || '';
  const instagramHandle = profile?.instagram_handle || profile?.username || '';
  const followersCount = profile?.followers_count || 0;
  const engagementRate = profile?.engagement_rate || 0;
  const mediaKitPublished = profile?.media_kit_published;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await invokeFn<{success?: boolean}>('apply-campaign', {
        campaignId: campaignData?.id,
        influencerId: user?.id,
        proposedRate: proposedRate ? Number(proposedRate) : null,
      });

      if (data?.success) {
        setSubmitted(true);
        setTimeout(() => {
          onSubmitSuccess();
        }, 2000);
      } else {
        setError('Unexpected response from the server.');
      }
    } catch (err) {
      // The edge function returns structured errors (already_applied,
      // plan_limit_reached, etc.). invokeFn surfaces them as EdgeFunctionError.
      if (err instanceof EdgeFunctionError) {
        const code = err.data?.error;
        if (code === 'already_applied') {
          setError('You have already applied to this campaign.');
        } else if (code === 'plan_limit_reached') {
          const used = err.data?.used ?? '?';
          const limit = err.data?.limit ?? '?';
          const plan = (err.data?.plan || 'starter') as string;
          setError(
            `You've used ${used}/${limit} applications on your ${plan} plan this month. Upgrade to apply to more campaigns.`,
          );
        } else {
          setError(err.message);
        }
      } else {
        setError((err as Error)?.message || 'Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white">
          {submitted ? (
            // Success screen
            <View className="p-8 items-center" style={{gap: 16}}>
              <View className="w-16 h-16 bg-emerald-50 rounded-full items-center justify-center">
                <CheckCircle2 size={32} color="#10B981" />
              </View>
              <Text className="text-xl font-black text-slate-900">Application Submitted!</Text>
              <Text className="text-sm text-slate-500 text-center">
                Your application is now under review. You'll be notified when the brand responds.
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
                <View>
                  <Text className="text-base font-bold text-slate-900">Apply for Campaign</Text>
                  <Text className="text-[11px] text-slate-400">
                    {campaignData?.title || 'Campaign'} · {campaignData?.brandName || 'Brand'}
                  </Text>
                </View>
                <Pressable onPress={onClose} className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                  <X size={16} color="#94A3B8" />
                </Pressable>
              </View>

              {/* Scrollable Form */}
              <ScrollView className="flex-1 px-6 py-5" showsVerticalScrollIndicator={false}>
                <View style={{gap: 20}}>
                  {error ? (
                    <View className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <Text className="text-sm text-red-600">{error}</Text>
                    </View>
                  ) : null}

                  {/* Your Profile (Auto-populated) */}
                  <View style={{gap: 10}}>
                    <View className="flex-row items-center" style={{gap: 6}}>
                      <Text className="text-sm font-bold text-slate-900">Your Profile</Text>
                      <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Text className="text-[9px] font-bold text-emerald-500">Auto-filled</Text>
                      </View>
                    </View>

                    <ReadOnlyField icon={<User size={14} color="#9810FA" />} label="Full Name" value={fullName || 'Not set'} />
                    <View className="flex-row" style={{gap: 8}}>
                      <View className="flex-1">
                        <ReadOnlyField icon={<Mail size={14} color="#EC4899" />} label="Email" value={email || 'Not set'} />
                      </View>
                      <View className="flex-1">
                        <ReadOnlyField icon={<Phone size={14} color="#3B82F6" />} label="Phone" value={phone || 'Not set'} />
                      </View>
                    </View>
                    <ReadOnlyField icon={<Instagram size={14} color="#EC4899" />} label="Instagram" value={instagramHandle ? `@${instagramHandle}` : 'Not connected'} />
                    <View className="flex-row" style={{gap: 8}}>
                      <View className="flex-1">
                        <ReadOnlyField icon={<Users size={14} color="#9810FA" />} label="Followers" value={formatCount(followersCount)} />
                      </View>
                      <View className="flex-1">
                        <ReadOnlyField icon={<Activity size={14} color="#10B981" />} label="Engagement" value={engagementRate ? `${engagementRate}%` : '—'} />
                      </View>
                    </View>
                  </View>

                  {/* Media Kit */}
                  <View style={{gap: 8}}>
                    <Text className="text-sm font-bold text-slate-900">Media Kit</Text>
                    {mediaKitPublished && instagramHandle ? (
                      <View className="flex-row items-center p-4 border border-purple-100 bg-purple-50/30 rounded-xl" style={{gap: 12}}>
                        <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center">
                          <ExternalLink size={18} color="#9333EA" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-slate-800">View Media Kit</Text>
                          <Text className="text-[10px] text-slate-400" numberOfLines={1}>rgossips.com/kit/{instagramHandle}</Text>
                        </View>
                        <View className="bg-emerald-50 px-2 py-1 rounded-full">
                          <Text className="text-[9px] font-bold text-emerald-600">Published</Text>
                        </View>
                      </View>
                    ) : (
                      <View className="p-4 border border-dashed border-slate-200 rounded-xl items-center">
                        <Text className="text-xs text-slate-400">Media kit not published yet</Text>
                        <Text className="text-xs font-bold text-purple-500 mt-1">Generate Media Kit</Text>
                      </View>
                    )}
                  </View>

                  {/* Proposed Rate */}
                  <View style={{gap: 8}}>
                    <Text className="text-sm font-bold text-slate-900">Your Proposed Rate</Text>
                    <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl px-4 h-12">
                      <Text className="text-sm font-bold text-slate-400 mr-2">₹</Text>
                      <TextInput
                        keyboardType="number-pad"
                        placeholder="Enter your rate for this campaign"
                        placeholderTextColor="#94A3B8"
                        value={proposedRate}
                        onChangeText={setProposedRate}
                        className="flex-1 text-sm text-slate-700"
                      />
                    </View>
                    {campaignData?.budget && (
                      <Text className="text-[10px] text-slate-400">Campaign budget: {campaignData.budget}</Text>
                    )}
                  </View>

                  {/* Why Choose You */}
                  <View style={{gap: 8}}>
                    <Text className="text-sm font-bold text-slate-900">Why should we choose you?</Text>
                    <TextInput
                      placeholder="Tell the brand why you're the perfect fit..."
                      placeholderTextColor="#94A3B8"
                      value={whyChooseYou}
                      onChangeText={setWhyChooseYou}
                      multiline
                      textAlignVertical="top"
                      className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700"
                      style={{minHeight: 100}}
                    />
                  </View>
                </View>

                <View className="h-4" />
              </ScrollView>

              {/* Footer */}
              <View className="flex-row px-6 py-4 border-t border-slate-100" style={{gap: 12}}>
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 h-12 rounded-xl border border-slate-200 items-center justify-center">
                  <Text className="text-sm font-bold text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    height: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    opacity: submitting ? 0.5 : 1,
                  }}>
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                  />
                  {submitting && <ActivityIndicator size="small" color="white" style={{marginRight: 8}} />}
                  <Text className="text-white text-sm font-bold">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReadOnlyField({icon, label, value}: {icon: React.ReactNode; label: string; value: string}) {
  return (
    <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-100 p-3" style={{gap: 10}}>
      {icon}
      <View className="flex-1">
        <Text className="text-[9px] font-bold text-slate-400 uppercase">{label}</Text>
        <Text className="text-sm font-bold text-slate-700" numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}
