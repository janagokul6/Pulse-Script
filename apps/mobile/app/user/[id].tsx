import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { Image, View as RNView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UserProfile = {
  id: string;
  name: string;
  specialization: string | null;
  experienceYears: number | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  isFollowing?: boolean;
};

// MOCK DATA for posts (in a real app, this would be fetched from /users/:id/posts)
const PUBLISHED_CASES = [
  {
    id: '1',
    category: 'CARDIOLOGY',
    title: 'Advanced Aortic Arch Reconstruction in Elderly Patients',
    summary: 'A comprehensive study on the efficacy of hybrid surgical approaches in 45 geriatric cases...',
    views: '1.2k',
    bookmarks: 85,
    featured: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv9YhC3QWryiYGd3FGtM8WD7W61db-Xdmvdu_WCij6eiahzYbZDPGqxIphAsHsZOCpNAjK37tRGg9MvVrkQaPghYDZJ72V2A_heC_FwO9J14fFeQ9CZAsw_eyGN-nnyNi6AIEZfKWPFJwB8aHcq7dIne74IIxljbZ7V0x_KrRRjx111rrDTJczCSCyUqBkynRq9A_BE-p_o_c7r-jd1Wugtkvdl0d8m8dGY8jexkoepvAZTR5klZg_RkDyeib2_-3dR4FmhblSuWY'
  },
  {
    id: '2',
    category: 'MICROBIOLOGY',
    title: 'Post-Operative Myocarditis: A 5-Year Retrospective',
    summary: 'Exploring early markers of cardiac inflammation following valve replacement surgeries...',
    views: '842',
    bookmarks: 42,
    date: 'Oct 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmlS-1lTWO58E9Ufg5PWk-9mRdAYMoOrpdRe0qxBThn1doMpadWqJ2cEnPSK4gYtfTqbxnofT4-qrqRGFKGON6uYvj7gK0xx-1j70Aa0WJzXk_e_MecJx4m_9QTpSsa5lHMBc0qZZrZsGdBXb4EmUJNm4dzkwyBvHbqbckz479u-PGX_4lZdLYCactETABsh82sIUQWST39Q9sAT1FPI6Vzj0pTkwrPge4RJ4stMrE0pIyJCPaSDnaVTTsrDtk8FpCsve2huo8QB8'
  },
  {
    id: '3',
    category: 'ROBOTICS',
    title: 'Implementation of AI in Minimally Invasive Surgeries',
    summary: 'The role of real-time imaging guidance in modern cardiac intervention...',
    views: '2.5k',
    bookmarks: 156,
    date: 'Aug 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_0o86ZZ1_srcajqWzvHdUs5RK-MxgkcUdAlOyumN3ndwDH4UhM8qAGhzjKX1SkfDOapuhvoalbEyN5C3XhBYeiHLGUDS5zDnUnZzL3UVHdyhybWrNvbEujVChuU7rcCoR59MLB_BJK605UeogmKOwVhbm3iTLA6fdLgf8u4GyTWXfF7zwRBLFkC7_1r0DN6neHWvtHpWwwEsT-3BJNDxOdVTWaABmNsi5qnFidZ1fFC9KvaYLlER9xGaiJJcitx3Chws7vgvfG7s'
  }
];

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('Library');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data } = await api.get<UserProfile>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: async (follow: boolean) => {
      if (follow) await api.post(`/users/${id}/follow`);
      else await api.delete(`/users/${id}/follow`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', id] }),
  });

  if (isLoading || !id) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
          <SkeletonLoader width={128} height={128} borderRadius={64} style={{ marginBottom: 16 }} />
        </View>
        <RNView style={{ alignItems: 'center', marginTop: 10 }}>
          <SkeletonLoader width={180} height={28} style={{ marginBottom: 12 }} />
          <SkeletonLoader width={220} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={160} height={14} />
        </RNView>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <SymbolView name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }} tintColor={theme.secondary} size={48} />
        <Text style={[styles.errorText, { color: theme.text }]}>User not found</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <Text style={{ color: theme.text, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnProfile = me?.id === profile.id;
  const avatarUrl = profile.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL1Rnx5XoM4wF_gvNeEAKSHRXpbvLE9jZE_rdzztNd92-BRuzQg495a565d7kw8oB_Is4VSsYvAX8eMf7z0DWVwsdLqktI1eKrUe--9jjLqXBQ_tLftZfMUm4DCDASyFVLotHDndg9REdwgFW-h6vYereLyqIHsRJ-mJcU2AmUg3xIVOfAg7yKOxMF-aCZcfQT6PSj1PQhKzVbQD4L1NdNK1It5hJEFa3pXKXWvixD2yNwHnGZe3QTrA0lb5u7Z84T8qWpZKplCZA';

  return (
    <RNView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <RNView style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={theme.tint} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Medical Fellow Profile</Text>
        <RNView style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerIcon}>
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} tintColor={theme.tint} size={22} />
          </TouchableOpacity>
        </RNView>
      </RNView>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Profile Hero Section */}
        <RNView style={[styles.heroSection, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <RNView style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={[styles.avatarImage, { borderColor: theme.tint + '1a' }]} />
            <RNView style={styles.verifiedBadge}>
              <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} tintColor="#fff" size={14} />
            </RNView>
          </RNView>

          <RNView style={styles.nameHeader}>
            <Text style={[styles.profileName, { color: theme.text }]}>{profile.name}</Text>
            <Text style={[styles.profileTitle, { color: theme.tint }]}>{profile.specialization || 'Clinical Specialist'}</Text>
            <Text style={[styles.profileCredentials, { color: theme.secondary }]}>{profile.bio || `${profile.experienceYears || '15'} years clinical expertise`}</Text>
          </RNView>

          <RNView style={styles.heroActions}>
            <TouchableOpacity style={[styles.btnMessage, { backgroundColor: theme.tint + '15' }]}>
              <Text style={[styles.btnMessageText, { color: theme.tint }]}>Message</Text>
            </TouchableOpacity>
            {!isOwnProfile && (
              <TouchableOpacity
                style={[
                  styles.btnFollow,
                  { backgroundColor: profile.isFollowing ? theme.background : theme.tint, borderWidth: profile.isFollowing ? 1 : 0, borderColor: theme.tint }
                ]}
                onPress={() => followMutation.mutate(!profile.isFollowing)}
                disabled={followMutation.isPending}
              >
                <Text style={[styles.btnFollowText, { color: profile.isFollowing ? theme.tint : '#fff' }]}>
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </RNView>
        </RNView>

        {/* Stats Section */}
        <RNView style={[styles.statsSection, { backgroundColor: theme.card }]}>
          <RNView style={[styles.statBox, { backgroundColor: theme.background, borderColor: '#d4af3733' }]}>
            <Text style={styles.statLabel}>SUCCESS</Text>
            <RNView style={styles.statValueRow}>
              <Text style={styles.statValueAccent}>99.4%</Text>
              <SymbolView name={{ ios: 'medal.fill', android: 'military_tech', web: 'military_tech' }} tintColor="#d4af37" size={18} />
            </RNView>
            <Text style={[styles.statHelper, { color: theme.tint }]}>+1.2% year-avg</Text>
          </RNView>

          <RNView style={[styles.statBox, { backgroundColor: theme.background, borderColor: '#d4af3733' }]}>
            <Text style={styles.statLabel}>LECTURES</Text>
            <RNView style={styles.statValueRow}>
              <Text style={[styles.statValueDark, { color: theme.text }]}>412</Text>
            </RNView>
            <Text style={[styles.statHelper, { color: theme.tint }]}>Top 5% Contributor</Text>
          </RNView>

          <RNView style={[styles.statBox, { backgroundColor: theme.background, borderColor: '#d4af3733' }]}>
            <Text style={styles.statLabel}>RATING</Text>
            <RNView style={styles.statValueRow}>
              <Text style={[styles.statValueDark, { color: theme.text }]}>5.0</Text>
              <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor="#d4af37" size={18} />
            </RNView>
            <Text style={[styles.statHelper, { color: theme.tint }]}>Elite Fellow</Text>
          </RNView>
        </RNView>

        {/* Tabs */}
        <RNView style={{ width: '100%', backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <RNView style={styles.tabsHeader}>
            {['About', 'Library', 'Research', 'Reviews'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.tint }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab ? { color: theme.tint } : { color: theme.secondary }]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>

        {/* Content Area */}
        {activeTab === 'Library' ? (
          <RNView style={[styles.libraryContent, { paddingBottom: insets.bottom + 80 }]}>
            <RNView style={styles.libraryHeader}>
              <Text style={[styles.libraryTitle, { color: theme.text }]}>Published Case Studies</Text>
              <TouchableOpacity>
                <Text style={[styles.filterText, { color: theme.tint }]}>Filter Library</Text>
              </TouchableOpacity>
            </RNView>

            {PUBLISHED_CASES.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.caseCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Image source={{ uri: item.image }} style={styles.caseImage} />
                <RNView style={styles.caseDetails}>
                  <RNView>
                    <RNView style={[styles.categoryBadge, { backgroundColor: theme.tint + '15' }]}>
                      <Text style={[styles.categoryText, { color: theme.tint }]}>{item.category}</Text>
                    </RNView>
                    <Text style={[styles.caseTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.caseSummary, { color: theme.secondary }]} numberOfLines={2}>{item.summary}</Text>
                  </RNView>

                  <RNView style={styles.caseMetrics}>
                    <RNView style={styles.metric}>
                      <SymbolView name={{ ios: 'eye', android: 'visibility', web: 'visibility' }} tintColor={theme.secondary} size={14} />
                      <Text style={[styles.metricText, { color: theme.secondary }]}>{item.views}</Text>
                    </RNView>
                    <RNView style={styles.metric}>
                      <SymbolView name={{ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }} tintColor={theme.secondary} size={14} />
                      <Text style={[styles.metricText, { color: theme.secondary }]}>{item.bookmarks}</Text>
                    </RNView>
                    {item.featured ? (
                      <RNView style={styles.metric}>
                        <SymbolView name={{ ios: 'star.circle.fill', android: 'award_star', web: 'award_star' }} tintColor="#d4af37" size={14} />
                        <Text style={[styles.metricText, { color: '#d4af37', fontWeight: '700' }]}>Featured</Text>
                      </RNView>
                    ) : (
                      <Text style={[styles.metricText, { color: theme.secondary, fontWeight: '500' }]}>{item.date}</Text>
                    )}
                  </RNView>
                </RNView>
              </TouchableOpacity>
            ))}
          </RNView>
        ) : (
          <RNView style={[styles.emptyContent, { paddingBottom: insets.bottom + 80 }]}>
            <Text style={[styles.emptyText, { color: theme.secondary }]}>
              {activeTab} content coming soon.
            </Text>
          </RNView>
        )}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 24 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#d4af37',
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  profileCredentials: {
    fontSize: 14,
    textAlign: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 420,
  },
  btnMessage: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMessageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnFollow: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a355b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnFollowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statValueAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#d4af37',
    letterSpacing: -0.5,
  },
  statValueDark: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statHelper: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  libraryContent: {
    padding: 16,
    gap: 16,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  caseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  caseImage: {
    width: 96,
    height: 128,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  caseDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  caseSummary: {
    fontSize: 12,
    lineHeight: 18,
  },
  caseMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 10,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});
