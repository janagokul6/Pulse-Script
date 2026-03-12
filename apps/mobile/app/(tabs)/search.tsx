import { Post, PostCard } from '@/components/PostCard';
import { PostSkeleton } from '@/components/SkeletonLoader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, View as RNView, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Radiology', 'Emergency', 'Surgical'];

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useMemo(() => ({ current: null as ReturnType<typeof setTimeout> | null }), []);

  const updateDebounced = (v: string) => {
    setQuery(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(v.trim()), 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, selectedSpecialty],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '20' };
      if (debouncedQuery) params.q = debouncedQuery;
      if (selectedSpecialty) params.specialty = selectedSpecialty;
      const { data: res } = await api.get<{ posts: Post[]; total: number }>('/search', { params });
      return res;
    },
    enabled: debouncedQuery.length > 0 || !!selectedSpecialty,
  });

  const posts = data?.posts ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <RNView style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={theme.secondary} size={18} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Search clinical cases..."
            placeholderTextColor={theme.secondary}
            value={query}
            onChangeText={updateDebounced}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => updateDebounced('')}>
              <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={theme.secondary} size={18} />
            </TouchableOpacity>
          )}
        </RNView>
      </View>

      <RNView style={[styles.specialtiesContainer, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtiesList}>
          {SPECIALTIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.specialtyChip,
                selectedSpecialty === s && { backgroundColor: theme.tint }
              ]}
              onPress={() => setSelectedSpecialty(selectedSpecialty === s ? null : s)}>
              <Text style={[
                styles.specialtyText,
                selectedSpecialty === s ? { color: '#fff', fontWeight: '600' } : { color: theme.secondary }
              ]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RNView>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={
          isLoading ? (
            <RNView>
              <PostSkeleton />
              <PostSkeleton />
            </RNView>
          ) : (
            <RNView style={styles.emptyContainer}>
              <SymbolView
                name={{ ios: 'doc.text.magnifyingglass', android: 'search', web: 'search' }}
                tintColor={theme.secondary}
                size={48}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {!debouncedQuery && !selectedSpecialty ? 'Discover Medical Insights' : 'No results found'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                {!debouncedQuery && !selectedSpecialty
                  ? 'Search for topics, symptoms, or specialties above.'
                  : 'Try adjusting your search terms or filters.'}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  specialtiesContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  specialtiesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  specialtyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: { padding: 16, paddingBottom: 100 },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
