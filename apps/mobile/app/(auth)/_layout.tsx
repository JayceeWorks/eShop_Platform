import { Stack } from 'expo-router';

import { GradientFill } from '@/components/gradient-fill';
import { colors } from '@/constants/theme';
import { strings } from '@/lib/i18n';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerBackground: () => <GradientFill name="header" />,
        headerTintColor: colors.white,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="sign-in" options={{ title: strings.auth.signInTitle }} />
      <Stack.Screen name="sign-up" options={{ title: strings.auth.signUpTitle }} />
    </Stack>
  );
}
