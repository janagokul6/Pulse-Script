import { Post, PostCard } from '@/components/PostCard';
import { PostSkeleton } from '@/components/SkeletonLoader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/lib/api';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { FlatList, Platform, RefreshControl, View as RNView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['For You', 'Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Radiology'];

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    caseSummary: 'A 45-year-old male presented with isolated jaw pain and diaphoresis, initially suspected as dental related but EKG confirmed STEMI.',
    title: 'Atypical Presentation of Myocardial Infarction',
    clinicalDecisions: '',
    outcome: '',
    keyLessons: '',
    specialty: 'Cardiology',
    tags: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: { id: 'auth-1', name: 'Dr. Sarah Chen', specialization: '12y Exp', avatarUrl: null },
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1bVbxh8btrE5Mo3CBwrt41jqL8_Kyct3FBzRRfwnAW02eYIk6qZtP0iXCaflMBgeBLlRzaKtbToPRbgYFcRTuHcHxTKdfu-j6j8vpeL4WPR3XPhiOTTBYFrZVbwUli7XHDD5lGhtqSj3UNjR6h_MHJYDkDK8jpldoqoWW1Sb6LiTyJ1N3G0ZMp8x59LABi9RudXuyohq-gEHzs4WxpbaMoDbPnzZxGZ5LfQxY8mUUUYTiIcQaoAO1EmMeFHx991lOBQ56S8PWxc10',
    stats: { comments: 24, shares: 8, saves: 15 },
    iconName: 'stethoscope'
  },
  {
    id: 'mock-2',
    caseSummary: 'Patient presented with sudden loss of peripheral vision and motor weakness in the left arm. Initial CT was negative for hemorrhage.',
    title: 'Rapid Onset Neurological Deficit in a 30yo Female',
    clinicalDecisions: '',
    outcome: '',
    keyLessons: '',
    specialty: 'Neurology',
    tags: [],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    author: { id: 'auth-2', name: 'Dr. Marcus Thorne', specialization: '8y Exp', avatarUrl: null },
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTdVMJTWz09K9aX_zJUPNIQTgtENUYtLxeQ5Z4L8NlWYWbPjcmO3xYQSsY_DcYw7qNi5xhzTSLJZs5tsetWzcsWEIBFEqlcjmGl0q28P_LTT9XAt1Lj01YftPrpshAOzxj0wRRDQbQhiN0zhVO9G9RV1HJVkJYCALdbXpIDlfhyBJv4l78II4htcPYwedprGwtfespR1289xGuQ5zWXzjBT4I27bllYaoeCTEkhyGQh0dpfAO1UiX3xYoJPlriNwWU6PKvr9Xgcyk',
    stats: { comments: 42, shares: 12, saves: 12, isSaved: true },
    iconName: 'brain.head.profile'
  },
  {
    id: 'mock-3',
    caseSummary: 'A complex case involving a 14-day-old infant with cycles of hyperpyrexia unresponsive to standard antibiotics. Genetic screening revealed a rare auto-inflammatory condition.',
    title: 'Persistent Fever in a Neonate: Beyond the Common',
    clinicalDecisions: '',
    outcome: '',
    keyLessons: '',
    specialty: 'Pediatrics',
    tags: [],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    author: { id: 'auth-3', name: 'Dr. Elena Rodriguez', specialization: '15y Exp', avatarUrl: null },
    badge: 'Diagnostic Dilemma',
    stats: { comments: 18, shares: 4, saves: 31 },
    iconName: 'figure.child'
  }
];

export default function FeedScreen() {
  const [selectedCategory, setSelectedCategory] = useState('For You');
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed', selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      const specialty = selectedCategory === 'For You' ? undefined : selectedCategory;
      const { data: res } = await api.get<{ posts: Post[]; total: number; page: number; limit: number }>('/feed', {
        params: { page: pageParam, limit: 10, specialty }
      });
      return res;
    },
    getNextPageParam: (lastPage) => {
      const totalFetched = lastPage.page * lastPage.limit;
      return totalFetched < lastPage.total ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  let posts = data?.pages.flatMap((p) => p.posts) ?? [];
  if (posts.length === 0 && !isLoading) {
    posts = MOCK_POSTS;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>MedLore</Text>
        <TouchableOpacity style={[styles.bellButton, { backgroundColor: theme.tint + '10' }]}>
          <SymbolView name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} tintColor={theme.secondary} size={22} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBtn,
                selectedCategory === cat && { backgroundColor: theme.tint, borderColor: theme.tint }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat ? { color: '#fff' } : { color: theme.secondary }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.tint} />}
        ListEmptyComponent={
          isLoading ? (
            <RNView style={{ padding: 20 }}>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </RNView>
          ) : (
            <View style={styles.emptyContainer}>
              <SymbolView name={{ ios: 'doc.text.magnifyingglass', android: 'search', web: 'search' }} tintColor={theme.secondary} size={48} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No cases found</Text>
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                Try selecting a different category or check back later.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <RNView style={{ paddingVertical: 16 }}>
              <PostSkeleton />
            </RNView>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bellButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  categoryContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    // Subtle shadow for chips
    shadowColor: '#1a355b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  list: { padding: 20 },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

