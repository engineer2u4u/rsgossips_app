import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {ChevronRight, Sparkles} from 'lucide-react-native';

import {useAuth} from '../context/AuthContext';
import {supabase} from '../utils/supabase';
import {BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';

// Compact wallet strip on the influencer home. Self-hides for users with
// no RC so the home stays clean until the wallet has something to show.
export default function ReferBalanceCard() {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const [avail, setAvail] = useState(0);
  const [locked, setLocked] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const {data} = await supabase
          .from('v_reward_credits_available_balance')
          .select('available_balance, locked_balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled) return;
        setAvail(data?.available_balance || 0);
        setLocked(data?.locked_balance || 0);
      } catch {
        /* silent — home shouldn't fail on a wallet lookup */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Only show once there's spendable RC. A brand-new signup whose only RC is
  // the still-locked 50 welcome bonus is greeted by WelcomeRewardModal
  // instead of a "0 available / +50 locked" strip.
  if (avail <= 0) return null;

  return (
    <Pressable
      onPress={() => navigation.navigate('Refer')}
      className="flex-row items-center bg-white rounded-2xl border border-slate-100 px-3 py-3"
      style={[{gap: 12}, CARD_SHADOW]}>
      <LinearGradient
        colors={[...BRAND_GRADIENT_WARM]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Sparkles size={18} color="white" />
      </LinearGradient>
      <View className="flex-1">
        <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Reward Credits
        </Text>
        <View className="flex-row items-baseline" style={{gap: 8}}>
          <Text className="text-lg font-black text-slate-900">
            {avail}{' '}
            <Text className="text-xs font-bold text-slate-400">available</Text>
          </Text>
          {locked > 0 ? (
            <View
              style={{
                backgroundColor: '#FEF3C7',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 3,
              }}>
              <Text
                className="text-[9px] font-black uppercase tracking-wider"
                style={{color: '#B45309'}}>
                +{locked} locked
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color="#CBD5E1" />
    </Pressable>
  );
}
