import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND_GRADIENT_WARM} from '../theme/brand';

// Dark footer with newsletter signup + Platform / Legal columns + trust line.
// Mirrors the offline-prototype's `Footer` component.
export default function HomeFooter() {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    if (!email.trim()) {
      Alert.alert('Subscribe', 'Enter an email first.');
      return;
    }
    Alert.alert('Subscribed', `We'll send tips to ${email.trim()}.`);
    setEmail('');
  };

  return (
    <View
      style={{
        backgroundColor: '#190f2e',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 26,
        marginTop: 8,
      }}>
      <Image
        source={require('../assets/rgossipsLogo.png')}
        style={{height: 24, width: 160, marginBottom: 14}}
        resizeMode="contain"
      />
      <Text
        style={{
          color: 'rgba(255,255,255,0.62)',
          fontSize: 13,
          lineHeight: 20,
          marginBottom: 20,
        }}>
        The all-in-one influencer campaign platform connecting brands with
        verified creators globally.
      </Text>

      <Text className="text-white text-[13px] font-semibold mb-2.5">
        Get influencer marketing tips — weekly in your inbox
      </Text>

      <View className="flex-row mb-6" style={{gap: 8}}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="rgba(255,255,255,0.45)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: '#fff',
            fontSize: 13,
          }}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubscribe}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={[...BRAND_GRADIENT_WARM]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Text className="text-white text-[13px] font-bold">Subscribe</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row" style={{gap: 30}}>
        <View className="flex-1">
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>
            Platform
          </Text>
          <Text style={footerLink}>For Brands</Text>
          <Text style={footerLink}>For Influencers</Text>
          <Text style={footerLink}>Pricing</Text>
        </View>
        <View className="flex-1">
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>
            Legal
          </Text>
          <Text style={footerLink}>Influencer Consent Policy</Text>
          <Text style={footerLink}>Brand Consent Policy</Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        }}>
        <Text
          style={{
            fontSize: 11.5,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
          }}>
          5,000+ brands · 200,000+ creators · ISO 27001 certified
        </Text>
      </View>
    </View>
  );
}

const footerLink = {
  color: 'rgba(255,255,255,0.82)',
  fontSize: 13.5,
  fontWeight: '500' as const,
  marginBottom: 10,
};
