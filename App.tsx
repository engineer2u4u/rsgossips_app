import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import './global.css';
import { AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import BrandHome from './src/screens/BrandHome';
import InfluencerHome from './src/screens/InfluencerHome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

export default function App() {
  return (
    <GestureHandlerRootView>
      <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="BrandHome" component={BrandHome} />
          <Stack.Screen name="BrandSearch" component={BrandSearch} />
          <Stack.Screen name="BrandCampaigns" component={BrandCampaigns} />
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
        </Stack.Navigator>
      </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
