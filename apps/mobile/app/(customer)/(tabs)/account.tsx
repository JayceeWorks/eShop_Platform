import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/buttons';
import { Card, MenuRow } from '@/components/ui/menu-row';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useDeleteAccount, useSignOut } from '@/features/account/use-account';
import { useSessionStore } from '@/features/auth/session-store';
import { useUnreadCount } from '@/features/feedback/use-feedback';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.account;
// Typed routes don't list index screens inside folders, so name them directly.
const ADMIN_HOME = '/admin' as Href;
const ORDERS = '/orders' as Href;
const ADDRESSES = '/addresses' as Href;

function GuestView() {
  return (
    <View className="p-4">
      <Card className="items-center p-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
          <Ionicons color={colors.brand} name="person-outline" size={ICON_SIZE.large} />
        </View>
        <Text className="mt-3 text-center text-lg font-bold text-brand">{t.guestTitle}</Text>
        <Text className="mb-5 mt-1 text-center text-gray-600">{t.guestBody}</Text>
        <View className="w-full gap-3">
          <Button label={t.signIn} onPress={() => router.push('/sign-in')} />
          <Button label={t.signUp} variant="outline" onPress={() => router.push('/sign-up')} />
        </View>
      </Card>
    </View>
  );
}

export default function AccountScreen() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const unread = useUnreadCount();
  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (status !== 'signedIn' || !user) {
    return (
      <View className="flex-1">
        <TabHeader title={t.title} />
        <GuestView />
      </View>
    );
  }

  const unreadCount = unread.data ?? 0;

  return (
    <View className="flex-1">
      <TabHeader title={t.title}>
        <Text className="mt-1 text-white/90">
          {user.name ? t.hello(user.name) : `+91 ${user.phone}`}
        </Text>
      </TabHeader>
      <ScrollView contentContainerClassName="p-4 pb-8">
        <Card>
          <MenuRow
            hint={t.ordersHint}
            icon="cube-outline"
            title={t.orders}
            onPress={() => router.push(ORDERS)}
          />
          <MenuRow
            badge={unreadCount > 0 ? t.unread(unreadCount) : undefined}
            hint={t.notificationsHint}
            icon="notifications-outline"
            title={t.notifications}
            onPress={() => router.push('/notifications')}
          />
          <MenuRow
            hint={t.profileHint}
            icon="person-circle-outline"
            title={t.profile}
            onPress={() => router.push('/profile')}
          />
          <MenuRow
            hint={t.addressesHint}
            icon="location-outline"
            title={t.addresses}
            onPress={() => router.push(ADDRESSES)}
          />
          <MenuRow
            hint={t.feedbackHint}
            icon="chatbubble-ellipses-outline"
            title={t.feedback}
            onPress={() => router.push('/feedback')}
          />
          {user.role === 'ADMIN' ? (
            <MenuRow
              icon="briefcase-outline"
              title={strings.admin.title}
              onPress={() => router.push(ADMIN_HOME)}
            />
          ) : null}
        </Card>

        <View className="mt-6 gap-3">
          <Button label={t.signOut} variant="outline" onPress={() => void signOut()} />
          {user.role === 'CUSTOMER' && !confirmDelete ? (
            <Button
              label={t.deleteAccount}
              variant="danger"
              onPress={() => setConfirmDelete(true)}
            />
          ) : null}
        </View>

        {confirmDelete ? (
          <View className="mt-3 gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Text className="text-red-900">{t.deleteConfirm}</Text>
            {deleteAccount.isError ? (
              <Text accessibilityLiveRegion="polite" className="font-semibold text-red-800">
                {errorMessage(deleteAccount.error)}
              </Text>
            ) : null}
            <Button
              label={t.deleteYes}
              loading={deleteAccount.isPending}
              variant="dangerFill"
              onPress={() => deleteAccount.mutate()}
            />
            <Button
              label={strings.admin.cancel}
              variant="outline"
              onPress={() => {
                deleteAccount.reset();
                setConfirmDelete(false);
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
