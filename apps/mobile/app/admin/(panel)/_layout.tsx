import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { GradientFill } from '@/components/gradient-fill';
import { colors } from '@/constants/theme';
import { useSessionStore } from '@/features/auth/session-store';
import { strings } from '@/lib/i18n';

/** Admin screens. The API checks the role on every request; this only keeps others out of the UI. */
export default function AdminPanelLayout() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === 'unknown') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (status === 'signedOut' || user?.role !== 'ADMIN') return <Redirect href="/admin/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerBackground: () => <GradientFill name="header" />,
        headerTintColor: colors.white,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: 'transparent' },
      }}>
      <Stack.Screen name="index" options={{ title: strings.admin.products }} />
      <Stack.Screen name="products/new" options={{ title: strings.admin.addProduct }} />
      <Stack.Screen name="products/[id]" options={{ title: strings.admin.editProduct }} />
      <Stack.Screen name="orders/index" options={{ title: strings.adminOrders.title }} />
      <Stack.Screen name="orders/[id]" options={{ title: strings.orders.detailTitle }} />
      <Stack.Screen name="feedback" options={{ title: strings.adminOrders.feedbackTitle }} />
    </Stack>
  );
}
