import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { GradientFill } from '@/components/gradient-fill';
import { CATALOG_STALE_TIME_MS } from '@/constants/catalog';
import { colors } from '@/constants/theme';
import { useSessionStore } from '@/features/auth/session-store';

const QUERY_RETRY_COUNT = 1;

// Transparent so the page gradient shows behind every screen.
const NAVIGATION_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: colors.white,
  },
};

export default function RootLayout() {
  const restoreSession = useSessionStore((state) => state.restore);
  // Signed-in state is needed everywhere now (account tab, checkout), not only in admin.
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: QUERY_RETRY_COUNT,
            staleTime: CATALOG_STALE_TIME_MS,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAVIGATION_THEME}>
        <StatusBar style="light" />
        {/* The width cap keeps a phone layout in the desktop browser preview. */}
        <View className="flex-1 items-center bg-gray-300">
          <View className="w-full max-w-[480px] flex-1 overflow-hidden bg-surface">
            <GradientFill name="page" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </View>
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
