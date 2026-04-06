import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { formatTimeAgo, useConversations } from '@/lib/messages';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback } from 'react';
import { FlatList, Platform, StyleSheet, TouchableOpacity, View as RNView } from 'react-native';

export default function InboxScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const router = useRouter();

  const { data: conversations, isLoading, refetch } = useConversations();
  const items = conversations ?? [];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Inbox</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/ (tabs)/library/${item.id}`.replace(' ', ''))}
          >
            <View style={[styles.avatar, { backgroundColor: theme.tint + '1a' }]}>
              <Text style={[styles.avatarText, { color: theme.tint }]}>
                {item.otherUser.name ? item.otherUser.name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowHeader}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {item.otherUser.name}
                </Text>
                <Text style={[styles.time, { color: theme.secondary }]}>{formatTimeAgo(item.lastMessageAt)}</Text>
              </View>
              {item.otherUser.specialization && (
                <Text style={[styles.subtitle, { color: theme.secondary }]} numberOfLines={1}>
                  {item.otherUser.specialization}
                </Text>
              )}
              <View style={styles.rowFooter}>
                <Text style={[styles.preview, { color: theme.secondary }]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.tint + '20' }]}>
                    <Text style={[styles.unreadText, { color: theme.tint }]}>
                      {item.unreadCount > 9 ? '9+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <RNView style={styles.emptyContainer}>
              <SymbolView
                name={{ ios: 'bubble.left.and.bubble.right', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
                tintColor={theme.secondary}
                size={48}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No messages yet</Text>
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                When you start chatting with peers, your conversations will appear here.
              </Text>
            </RNView>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  preview: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

