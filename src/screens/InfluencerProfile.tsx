import React, {useState, useRef} from 'react';
import {View, ScrollView, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DashboardView from '../components/DashboardView';
import MyInformationDetail from '../components/MyInformationDetail';
import AddReelFlow from '../components/AddReelFlow';
import AnalyticsPage from '../components/AnalyticsPage';
import DetailedCampaignAnalytics from '../components/CampaignAnalytics';
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
  | 'campaign'
  | 'edit-profile'
  | 'notifications'
  | 'privacy'
  | 'password-change'
  | 'trusted-devices'
  | 'deactivate-account'
  | 'help&support'
  | 'payments';

export default function InfluencerProfile() {
  const [view, setView] = useState<ViewType>('dashboard');
  const scrollRef = useRef<ScrollView>(null);

  const navigate = (next: ViewType) => {
    setView(next);
    scrollRef.current?.scrollTo({y: 0, animated: true});
  };

  const showBottomNav = view === 'dashboard';

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}>
        {view === 'dashboard' && (
          <DashboardView
            onNotificationClick={() => navigate('notifications')}
            onPrivacyClick={() => navigate('privacy')}
            onOpenAnalytics={() => navigate('analytics')}
            onOpenInfo={() => navigate('my-info')}
            onhelpSupportClick={() => navigate('help&support')}
            onPaymentsClick={() => navigate('payments')}
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
          <AnalyticsPage
            onCampaignAnalytics={() => navigate('campaign')}
            onBack={() => navigate('dashboard')}
          />
        )}

        {view === 'campaign' && (
          <DetailedCampaignAnalytics onBack={() => navigate('analytics')} />
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
