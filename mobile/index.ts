import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';
import App from './App';

// Register the root component after the React Native URL polyfill is ready.
// Supabase's apikey injection is configured directly on its client fetch
// implementation in src/api/supabase.ts, not by mutating global fetch here.
registerRootComponent(App);
