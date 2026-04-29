import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { themes } from './src/theme';
import { ToastProvider } from './src/components/Toast';

import { useNotifications } from './src/hooks/useNotifications';

SplashScreen.preventAutoHideAsync();

function MainApp() {
  const { theme } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const activeTheme = themes[theme] || themes.dark;

  // Initialize Push Notifications
  useNotifications(user?.id || user?._id);

  React.useEffect(() => {
    // Simulate loading
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <ToastProvider>
      <NavigationContainer theme={{
        dark: theme !== 'light',
        colors: {
          background: activeTheme.colors.background,
          primary: activeTheme.colors.primary,
          card: activeTheme.colors.surface,
          text: activeTheme.colors.text,
          border: activeTheme.colors.border,
          notification: activeTheme.colors.primary,
        }
      }}>
        <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
        <AppNavigator />
      </NavigationContainer>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}
