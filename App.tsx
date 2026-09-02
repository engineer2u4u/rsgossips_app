import React, { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
// Lives in src/lib so non-component modules (manage-plan.ts) can navigate
// without importing this file, which would be circular.
import { navigationRef } from './src/lib/navigation';
import { registerForPush, initPushHandlers } from './src/lib/push';
import OfflineGate from './src/components/OfflineGate';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LinkingOptions } from '@react-navigation/native';
import './global.css';
import './src/i18n'; // initialise i18next (side effect) before any screen renders
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoadingProvider } from './src/context/LoadingContext';
import LoginScreen from './src/screens/LoginScreen';
import ConsentPolicyScreen from './src/screens/ConsentPolicyScreen';
import BrandHome from './src/screens/BrandHome';
import BrandCampaignDetail from './src/screens/BrandCampaignDetail';
import CreateCampaignScreen from './src/screens/CreateCampaignScreen';
import BrandNotifications from './src/screens/BrandNotifications';
import InfluencerServicesList from './src/screens/InfluencerServicesList';
import InfluencerServiceDetail from './src/screens/InfluencerServiceDetail';
import InfluencerServiceQuote from './src/screens/InfluencerServiceQuote';
import InfluencerServiceOrders from './src/screens/InfluencerServiceOrders';
import InfluencerServiceOrderDetail from './src/screens/InfluencerServiceOrderDetail';
import InfluencerHome from './src/screens/InfluencerHome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BrandSearch from './src/screens/BrandSearch';
import BrandCampaigns from './src/screens/BrandCampaigns';
import BrandProfile from './src/screens/BrandProfile';
import BrandTransactions from './src/screens/BrandTransactions';
import InfluencerDiscover from './src/screens/InfluencerDiscover';
import InfluencerCampaign from './src/screens/InfluencerCampaign';
import InfluencerProfile from './src/screens/InfluencerProfile';
import InfluencerMediaKit from './src/screens/InfluencerMediaKit';
import InfluencerNotifications from './src/screens/InfluencerNotifications';
import InfluencerOfferDetail from './src/screens/InfluencerOfferDetail';
import InfluencerResume from './src/screens/InfluencerResume';
import RecommendedCampaigns from './src/screens/RecommendedCampaigns';
import ReferScreen from './src/screens/ReferScreen';
import InfluencerPricing from './src/screens/InfluencerPricing';

const Stack = createNativeStackNavigator();

// Deep-link config — admin invitation emails open
//   rgossips://?invited=<ig-handle>
// or the universal-link equivalent https://rgossips.com/?invited=...
// (once App Links are verified). LoginScreen reads `route.params.invited`
// on mount and runs the invitation flow.
const linking: LinkingOptions<any> = {
  prefixes: ['rgossips://', 'https://rgossips.com', 'https://www.rgossips.com'],
  config: {
    screens: {
      Login: '',
    },
  },
};

// Splits the navigator into "unauthed" (Login + ConsentPolicy modal) and
// "authed" (every dashboard screen) stacks. When the user is not signed in,
// the authed screens aren't mounted AT ALL — so a stray navigate() call,
// an unfortunate swipe-back inside a sub-pager, or any other client-side
// flow CANNOT reveal them. Stack swaps happen automatically when
// AuthContext flips `user` between null and a real value.

function RootStack() {
  const {user, loading, role, refreshProfile} = useAuth();

  // Register this device for FCM push once signed in, and wire tap-to-open
  // deep-linking. No-ops until Firebase native config is present (PUSH_SETUP.md).
  useEffect(() => {
    if (!user) return;
    registerForPush();
    initPushHandlers((route) => {
      if (navigationRef.isReady()) {
        (navigationRef.navigate as any)(route.name, route.params);
      }
    });
  }, [user]);
  // We route ONLY on the role check-profile confirmed — never a guess. The
  // splash below stays up until `role` is set, so the navigator can only ever
  // mount on the home that matches the server's answer. No AsyncStorage
  // fallback, no influencer default: the loading screen decides after the
  // server confirms, then shows the correct UI once.
  //
  // The one failure mode that leaves `role` null with a live session is a
  // TRANSIENT check-profile error (network blip / edge fn hiccup) — fetchProfile
  // deliberately keeps the session in that case rather than signing the user
  // out. Without a retry the user would sit on the splash until they kill the
  // app. So while we're signed in but still un-confirmed, re-ask the server on
  // a short cadence; the first successful response sets `role` and this stops.
  // (A definitive "no profile of this role" answer signs the user out inside
  // fetchProfile, which flips `user` to null and routes to Login — so this only
  // ever retries genuine transient failures.)
  useEffect(() => {
    if (!user || role) return;
    const t = setInterval(() => {
      refreshProfile();
    }, 2500);
    return () => clearInterval(t);
  }, [user, role, refreshProfile]);

  // Keep the spinner up until check-profile has CONFIRMED the role for a
  // signed-in user. Because we never drop the splash while `role` is null, the
  // authed Navigator can only ever mount with `initialRouteName` already set to
  // the correct home — there is no window in which the influencer default shows
  // and no post-mount correction to flash the user across. The retry above is
  // what guarantees this resolves even if the first check-profile call failed.
  if (loading || (user && !role)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F4F8',
        }}>
        <ActivityIndicator size="large" color="#E60076" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="ConsentPolicy"
          component={ConsentPolicyScreen}
          options={{presentation: 'modal'}}
        />
      </Stack.Navigator>
    );
  }

  // Authed: pick the right home based on the CONFIRMED role. We keep the
  // existing screen graph intact — any forward-nav from a dashboard still
  // works, but the user can never go "back" to Login because Login isn't in
  // the stack.
  const homeRoute = role === 'brand' ? 'BrandHome' : 'InfluencerHome';

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={homeRoute}>
      <Stack.Screen name="BrandHome" component={BrandHome} />
      <Stack.Screen name="BrandSearch" component={BrandSearch} />
      <Stack.Screen name="BrandCampaigns" component={BrandCampaigns} />
      <Stack.Screen
        name="BrandCampaignDetail"
        component={BrandCampaignDetail}
      />
      <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
      <Stack.Screen
        name="BrandNotifications"
        component={BrandNotifications}
      />
      <Stack.Screen name="BrandProfile" component={BrandProfile} />
      <Stack.Screen name="BrandTransactions" component={BrandTransactions} />
      <Stack.Screen name="InfluencerHome" component={InfluencerHome} />
      <Stack.Screen name="InfluencerSearch" component={InfluencerDiscover} />
      <Stack.Screen
        name="InfluencerCampaigns"
        component={InfluencerCampaign}
      />
      <Stack.Screen name="InfluencerProfile" component={InfluencerProfile} />
      <Stack.Screen name="InfluencerMediaKit" component={InfluencerMediaKit} />
      <Stack.Screen
        name="InfluencerNotifications"
        component={InfluencerNotifications}
      />
      <Stack.Screen name="InfluencerRefer" component={ReferScreen} />
      <Stack.Screen name="InfluencerPricing" component={InfluencerPricing} />
      <Stack.Screen
        name="InfluencerOfferDetail"
        component={InfluencerOfferDetail}
      />
      <Stack.Screen name="InfluencerResume" component={InfluencerResume} />
      <Stack.Screen
        name="RecommendedCampaigns"
        component={RecommendedCampaigns}
      />
      <Stack.Screen
        name="InfluencerServices"
        component={InfluencerServicesList}
      />
      <Stack.Screen
        name="InfluencerServiceDetail"
        component={InfluencerServiceDetail}
      />
      <Stack.Screen
        name="InfluencerServiceQuote"
        component={InfluencerServiceQuote}
      />
      <Stack.Screen
        name="InfluencerServiceOrders"
        component={InfluencerServiceOrders}
      />
      <Stack.Screen
        name="InfluencerServiceOrderDetail"
        component={InfluencerServiceOrderDetail}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        {/* App-wide default: dark icons on a light status bar. The safe-area
            behind the bar is white on every layout, so dark-content keeps the
            clock/battery legible. Screens that mount their own <StatusBar>
            (a few influencer screens) already use the same dark-content, so
            this only fixes the brand screens, which previously set nothing and
            inherited the OS default (white-on-white, invisible). */}
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LoadingProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootStack />
            </NavigationContainer>
            {/* Offline takeover — sits above the whole navigator; woken by
                invokeFn on network-level fetch failures, dismisses itself
                only when a connectivity probe succeeds. */}
            <OfflineGate />
          </AuthProvider>
        </LoadingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
