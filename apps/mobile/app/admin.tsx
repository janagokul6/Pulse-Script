import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, View } from '@/components/Themed';
import api from '@/lib/api';

type Post = {
  id: string;
  caseSummary: string;
  isRemoved: boolean;
  isPublished: boolean;
  createdAt: string;
  author: { id: string; name: string; specialization: string | null };
};

export default function AdminScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts'],
    queryFn: async () => {
      const { data: res } = await api.get<{ posts: Post[] }>('/admin/posts', { params: { limit: 50 } });
      return res.posts;
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, isRemoved }: { id: string; isRemoved: boolean }) =>
      api.patch(`/admin/posts/${id}`, { isRemoved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
  });

  const posts = data ?? [];

  const toggleRemoved = (post: Post) => {
    Alert.alert(
      post.isRemoved ? 'Restore post' : 'Remove post',
      post.isRemoved ? 'Restore this post so it appears in the feed again?' : 'Remove this post from the feed? (Author can still see it)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => removeMutation.mutate({ id: post.id, isRemoved: !post.isRemoved }) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, item.isRemoved && styles.cardRemoved]}>
            <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
              <Text style={styles.summary} numberOfLines={2}>{item.caseSummary}</Text>
              <Text style={styles.meta}>{item.author.name} · {new Date(item.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, item.isRemoved ? styles.btnRestore : styles.btnRemove]}
              onPress={() => toggleRemoved(item)}>
              <Text style={styles.btnText}>{item.isRemoved ? 'Restore' : 'Remove'}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading…' : 'No posts'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  card: { padding: 16, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  cardRemoved: { opacity: 0.6, backgroundColor: '#fafafa' },
  summary: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  meta: { fontSize: 12, opacity: 0.7 },
  btn: { marginTop: 8, padding: 8, borderRadius: 6, alignSelf: 'flex-start' },
  btnRemove: { backgroundColor: '#dc3545' },
  btnRestore: { backgroundColor: '#28a745' },
  btnText: { color: '#fff', fontSize: 13 },
  empty: { textAlign: 'center', padding: 24, opacity: 0.7 },
});
