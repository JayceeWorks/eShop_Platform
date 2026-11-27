import { Stack } from 'expo-router';

import { GradientFill } from '@/components/gradient-fill';
import { colors } from '@/constants/theme';
import { strings } from '@/lib/i18n';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerBackground: () => <GradientFill name="header" />,
        contentStyle: { backgroundColor: 'transparent' },
        headerTintColor: colors.white,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[slug]" options={{ title: '' }} />
      <Stack.Screen name="product/[slug]" options={{ title: strings.product.title }} />
      <Stack.Screen name="checkout" options={{ title: strings.checkout.title }} />
      <Stack.Screen name="orders/index" options={{ title: strings.orders.title }} />
      <Stack.Screen name="orders/[id]" options={{ title: strings.orders.detailTitle }} />
      <Stack.Screen name="notifications" options={{ title: strings.notifications.title }} />
      <Stack.Screen name="profile" options={{ title: strings.profile.title }} />
      <Stack.Screen name="addresses/index" options={{ title: strings.addresses.title }} />
      <Stack.Screen name="addresses/edit" options={{ title: strings.addresses.add }} />
      <Stack.Screen name="feedback" options={{ title: strings.feedback.title }} />
      <Stack.Screen name="review/[slug]" options={{ title: strings.reviews.formTitle }} />
    </Stack>
  );
}
