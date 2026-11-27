import { Redirect, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useSessionStore } from '@/features/auth/session-store';

/** Shows the screen only to a signed-in user; others go to sign in and come back afterwards. */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const pathname = usePathname();

  if (status === 'unknown') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (status === 'signedOut') {
    return <Redirect href={{ pathname: '/sign-in', params: { next: pathname } }} />;
  }
  return children;
}
