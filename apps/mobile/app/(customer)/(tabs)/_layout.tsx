import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/constants/catalog';
import { ICON_SIZE, TAB_BAR_BOTTOM_PADDING, TAB_BAR_HEIGHT, colors } from '@/constants/theme';
import { useCartCount } from '@/features/cart/cart-store';
import { useUnreadCount } from '@/features/feedback/use-feedback';
import { strings } from '@/lib/i18n';

function tabIcon(name: IconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return (
      <Ionicons
        name={name}
        size={ICON_SIZE.medium}
        color={focused ? colors.primary : colors.muted}
      />
    );
  };
}

export default function TabsLayout() {
  const cartCount = useCartCount();
  const unread = useUnreadCount().data ?? 0;
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + bottom,
          paddingBottom: TAB_BAR_BOTTOM_PADDING + bottom,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: strings.tabs.home, tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="categories"
        options={{ title: strings.tabs.categories, tabBarIcon: tabIcon('grid-outline') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: strings.tabs.search, tabBarIcon: tabIcon('search-outline') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: strings.tabs.cart,
          tabBarIcon: tabIcon('cart-outline'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.brand },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: strings.tabs.account,
          tabBarIcon: tabIcon('person-outline'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.brand },
        }}
      />
    </Tabs>
  );
}
