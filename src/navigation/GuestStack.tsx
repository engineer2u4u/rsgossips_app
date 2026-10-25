// The signed-out navigator: the creator marketplace, browsable without an
// account.
//
// Apple rejected the app under guideline 5.1.1(v) — it made people register
// before reaching features that are not account-based. A catalogue of brand
// campaigns is not account-based, so it opens to everyone. Applying, ordering,
// the media kit, plans and the profile stay behind sign-in, which 5.1.1
// explicitly permits.
//
// Route NAMES are deliberately identical to the authed stack, so every card,
// carousel and deep link navigates the same way in both and no screen needs to
// know which stack it is mounted in.
//
// What is NOT here is the point: every Brand* route, and the creator's own
// account screens. They are not mounted, so a stray navigate() cannot reveal
// them — the same guarantee the authed/unauthed split has always relied on,
// kept by construction rather than by remembering to check `user` in each
// screen.

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import ConsentPolicyScreen from '../screens/ConsentPolicyScreen';
import InfluencerHome from '../screens/InfluencerHome';
import InfluencerDiscover from '../screens/InfluencerDiscover';
import InfluencerCampaign from '../screens/InfluencerCampaign';
import InfluencerOfferDetail from '../screens/InfluencerOfferDetail';
import InfluencerServicesList from '../screens/InfluencerServicesList';
import InfluencerServiceDetail from '../screens/InfluencerServiceDetail';

const Stack = createNativeStackNavigator();

export default function GuestStack() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="InfluencerHome">
      {/* Browse */}
      <Stack.Screen name="InfluencerHome" component={InfluencerHome} />
      <Stack.Screen name="InfluencerSearch" component={InfluencerDiscover} />
      <Stack.Screen name="InfluencerCampaigns" component={InfluencerCampaign} />
      <Stack.Screen
        name="InfluencerOfferDetail"
        component={InfluencerOfferDetail}
      />
      <Stack.Screen
        name="InfluencerServices"
        component={InfluencerServicesList}
      />
      <Stack.Screen
        name="InfluencerServiceDetail"
        component={InfluencerServiceDetail}
      />

      {/* Sign-in. Still a real screen name here because the deep link config
          maps `Login: ''` — an invitation link opens on exactly this stack. */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ConsentPolicy"
        component={ConsentPolicyScreen}
        options={{presentation: 'modal'}}
      />
    </Stack.Navigator>
  );
}
