import React, {useCallback, useState, useRef} from 'react';
import {View, ScrollView, StatusBar, RefreshControl, BackHandler} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import DashboardView from '../components/DashboardView';
import MyInformationDetail from '../components/MyInformationDetail';
import AddReelFlow from '../components/AddReelFlow';
import AnalyticsPage from '../components/AnalyticsPage';
import EditProfilePage from '../components/EditProfilePage';
import NotificationSettings from '../components/NotificationSettings';
import PrivacySecurityPage from '../components/PrivacySettings';
import ChangePassword from '../components/ChangePassword';
import TrustedDevices from '../components/TrustedDevices';
import DeactivateAccount from '../components/DeactiveAccount';
import HelpSupport from '../components/HelpAndSupport';
import PaymentMethods from '../components/PaymentMethods';
import BottomNav from '../components/BottomNav';

type ViewType =
  | 'dashboard'
  | 'my-info'
  | 'add-reel'
  | 'analytics'
  | 'edit-profile'
  | 'notifications'
  | 'privacy'
  | 'password-change'
  | 'trusted-devices'
  | 'deactivate-account'
  | 'help&support'
  | 'payments';

// Maps each subview to the view the user expects when they press the
// hardware back button. Mirrors the onBack callbacks below: most subviews
// pop back to the dashboard, but a few (password-change, trusted-devices,
// deactivate-account) are nested under privacy. Keep this in sync with the
// onBack handlers below.
const BACK_PARENT: Record<string, ViewType> = {
  'my-info': 'dashboard',
  'add-reel': 'my-info',
  'analytics': 'dashboard',
  'edit-profile': 'dashboard',
  'notifications': 'dashboard',
  'privacy': 'dashboard',
  'password-change': 'privacy',
  'trusted-devices': 'privacy',
  'deactivate-account': 'privacy',
  'help&support': 'dashboard',
  'payments': 'dashboard',
};

export default function InfluencerProfile() {
  const nav = useNavigation<any>();
  const [view, setView] = useState<ViewType>('dashboard');
  const scrollRef = useRef<ScrollView>(null);
  const {refreshProfile} = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const navigate = (next: ViewType) => {
    setView(next);
    scrollRef.current?.scrollTo({y: 0, animated: true});
  };

  // Hardware back: pop one level of the internal view state instead of
  // popping the InfluencerProfile screen entirely. Returning true tells
  // RN we've handled the event — only when we're already on the dashboard
  // do we return false to let the navigator pop us out.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (view === 'dashboard') return false;
        const parent = BACK_PARENT[view] || 'dashboard';
        navigate(parent);
        return true;
      });
      return () => sub.remove();
    }, [view]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  // Show the floating BottomNav on every profile subview — not just the
  // dashboard. Subviews used to render their own absolutely-positioned
  // BottomNav from inside this ScrollView, which made it scroll with the
  // page content instead of staying pinned to the viewport. Now the nav
  // lives at the SafeAreaView level (outside the ScrollView) for every
  // view, so it actually floats.
  const showBottomNav = true;

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E60076"
            colors={['#E60076']}
          />
        }>
        {view === 'dashboard' && (
          <DashboardView
            onNotificationClick={() => navigate('notifications')}
            onPrivacyClick={() => navigate('privacy')}
            onOpenAnalytics={() => navigate('analytics')}
            onOpenInfo={() => navigate('my-info')}
            onhelpSupportClick={() => navigate('help&support')}
            onPaymentsClick={() => navigate('payments')}
            onReferClick={() => nav.navigate('InfluencerRefer')}
          />
        )}

        {view === 'my-info' && (
          <MyInformationDetail
            onBack={() => navigate('dashboard')}
            onAddReel={() => navigate('add-reel')}
            onEditProfile={() => navigate('edit-profile')}
          />
        )}

        {view === 'add-reel' && (
          <View className="flex-1 bg-white pb-10">
            <AddReelFlow onBack={() => navigate('my-info')} />
          </View>
        )}

        {view === 'analytics' && (
          <AnalyticsPage onBack={() => navigate('dashboard')} />
        )}

        {view === 'edit-profile' && (
          <EditProfilePage onBack={() => navigate('dashboard')} />
        )}

        {view === 'notifications' && (
          <NotificationSettings onBack={() => navigate('dashboard')} />
        )}

        {view === 'privacy' && (
          <PrivacySecurityPage
            onBack={() => navigate('dashboard')}
            onTrustedDevices={() => navigate('trusted-devices')}
            onDeactiveAccount={() => navigate('deactivate-account')}
            onPasswordChange={() => navigate('password-change')}
          />
        )}

        {view === 'password-change' && (
          <ChangePassword onBack={() => navigate('privacy')} />
        )}

        {view === 'trusted-devices' && (
          <TrustedDevices onBack={() => navigate('privacy')} />
        )}

        {view === 'deactivate-account' && (
          <DeactivateAccount onBack={() => navigate('privacy')} />
        )}

        {view === 'help&support' && (
          <HelpSupport onBack={() => navigate('dashboard')} />
        )}

        {view === 'payments' && (
          <PaymentMethods onBack={() => navigate('dashboard')} />
        )}

        {showBottomNav && <View className="h-20" />}
      </ScrollView>

      {showBottomNav && (
        <View className="absolute bottom-0 left-0 right-0">
          <BottomNav />
        </View>
      )}
    </SafeAreaView>
  );
}
