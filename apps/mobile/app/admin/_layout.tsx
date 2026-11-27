import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { GradientFill } from '@/components/gradient-fill';
import { colors } from '@/constants/theme';
import { useSessionStore } from '@/features/auth/session-store';
import { strings } from '@/lib/i18n';

export default function AdminLayout() {
  const status = useSessionStore((state) => state.status);
  const restore = useSessionStore((state) => state.restore);

  useEffect(() => {
    if (status === 'unknown') void restore();
  }, [status, restore]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerBackground: () => <GradientFill name="header" />,
        headerTintColor: colors.white,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="login" options={{ title: strings.admin.loginTitle }} />
      <Stack.Screen name="(panel)" options={{ headerShown: false }} />
    </Stack>
  );
}
