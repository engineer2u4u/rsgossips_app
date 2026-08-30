// Shared navigation ref.
//
// Lives here rather than in App.tsx so non-component modules can navigate
// without importing the root — manage-plan.ts needs it to open the in-app
// pricing screen, and importing App.tsx from a lib that App.tsx's own screens
// import would be circular.

import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
