// Renders the brand or influencer consent policy as a scrollable WebView.
// Navigated to from the consent checkbox links inside the signup forms,
// and from settings → Legal in the profile screens.
//
// Routes:
//   navigation.navigate('ConsentPolicy', { role: 'brand' | 'influencer' })

import React, {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {ArrowLeft} from 'lucide-react-native';
import {consentHtml as brandConsent} from '../lib/consent-brand';
import {consentHtml as influencerConsent} from '../lib/consent-influencer';

type ConsentRoute = RouteProp<
  {ConsentPolicy: {role?: 'brand' | 'influencer'}},
  'ConsentPolicy'
>;

const PAGE_CSS = `
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2" />
  <style>
    body {
      font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.55;
      padding: 16px 18px 48px;
      font-size: 15px;
    }
    h1 { font-size: 18px; color: #6347F9; margin-top: 24px; }
    h2 { font-size: 15px; color: #1e293b; margin-top: 18px; }
    p, li { margin: 8px 0; }
    strong { color: #0f172a; }
    table {
      width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;
    }
    th, td {
      border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; text-align: left;
    }
    th { background: #f1f5f9; }
    ul { padding-left: 22px; }
  </style>
`;

export default function ConsentPolicyScreen() {
  const navigation = useNavigation();
  const route = useRoute<ConsentRoute>();
  const role = route.params?.role || 'influencer';

  const html = useMemo(() => {
    const body = role === 'brand' ? brandConsent : influencerConsent;
    return `<!doctype html><html><head>${PAGE_CSS}</head><body>${body}</body></html>`;
  }, [role]);

  const title =
    role === 'brand' ? 'Brand Consent Policy' : 'Influencer Consent Policy';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={{width: 22}} />
      </View>
      <WebView
        originWhitelist={['*']}
        source={{html}}
        style={styles.web}
        showsVerticalScrollIndicator
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: 'white'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  back: {padding: 4},
  title: {fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'center'},
  web: {flex: 1, backgroundColor: 'white'},
});
