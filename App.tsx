import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LinkingOptions } from '@react-navigation/native';
import './global.css';
import { AuthProvider } from './src/context/AuthContext';
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
import BrandChats from './src/screens/BrandChats';
import InfluencerDiscover from './src/screens/InfluencerDiscover';
import InfluencerCampaign from './src/screens/InfluencerCampaign';
import InfluencerChats from './src/screens/InfluencerChats';
import InfluencerProfile from './src/screens/InfluencerProfile';
import InfluencerMediaKit from './src/screens/InfluencerMediaKit';
import InfluencerNotifications from './src/screens/InfluencerNotifications';
import InfluencerPricing from './src/screens/InfluencerPricing';
import InfluencerOfferDetail from './src/screens/InfluencerOfferDetail';
import InfluencerResume from './src/screens/InfluencerResume';
import RecommendedCampaigns from './src/screens/RecommendedCampaigns';

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

export default function App() {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
      <LoadingProvider>
      <AuthProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="ConsentPolicy"
            component={ConsentPolicyScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="BrandHome" component={BrandHome} />
          <Stack.Screen name="BrandSearch" component={BrandSearch} />
          <Stack.Screen name="BrandCampaigns" component={BrandCampaigns} />
          <Stack.Screen
            name="BrandCampaignDetail"
            component={BrandCampaignDetail}
          />
          <Stack.Screen
            name="CreateCampaign"
            component={CreateCampaignScreen}
          />
          <Stack.Screen
            name="BrandNotifications"
            component={BrandNotifications}
          />
          <Stack.Screen name="BrandChats" component={BrandChats} />
          <Stack.Screen name="BrandProfile" component={BrandProfile} />
          <Stack.Screen name="InfluencerHome" component={InfluencerHome} />
          <Stack.Screen
            name="InfluencerSearch"
            component={InfluencerDiscover}
          />
          <Stack.Screen
            name="InfluencerCampaigns"
            component={InfluencerCampaign}
          />
          <Stack.Screen name="InfluencerChats" component={InfluencerChats} />
          <Stack.Screen
            name="InfluencerProfile"
            component={InfluencerProfile}
          />
          <Stack.Screen
            name="InfluencerMediaKit"
            component={InfluencerMediaKit}
          />
          <Stack.Screen
            name="InfluencerNotifications"
            component={InfluencerNotifications}
          />
          <Stack.Screen
            name="InfluencerPricing"
            component={InfluencerPricing}
          />
          <Stack.Screen
            name="InfluencerOfferDetail"
            component={InfluencerOfferDetail}
          />
          <Stack.Screen
            name="InfluencerResume"
            component={InfluencerResume}
          />
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
      </NavigationContainer>
      </AuthProvider>
      </LoadingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
