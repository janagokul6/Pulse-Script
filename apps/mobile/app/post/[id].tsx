import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Image, Platform, View as RNView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Post = {
  id: string;
  caseSummary: string;
  title?: string;
  clinicalDecisions: string;
  outcome: string;
  keyLessons: string;
  specialty: string | null;
  tags: string[];
  createdAt: string;
  bookmarked?: boolean;
  author: { id: string; name: string; specialization: string | null; avatarUrl: string | null };
  imageUrl?: string;
  views?: number;
};

// Fallback mock data in case the post is one of our frontend-only mocks
const MOCK_DATA: Record<string, Partial<Post>> = {
  'mock-1': {
    title: 'Atypical Presentation of Myocardial Infarction',
    views: 1200,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1bVbxh8btrE5Mo3CBwrt41jqL8_Kyct3FBzRRfwnAW02eYIk6qZtP0iXCaflMBgeBLlRzaKtbToPRbgYFcRTUcHxTKdfu-j6j8vpeL4WPR3XPhiOTTBYFrZVbwUli7XHDD5lGhtqSj3UNjR6h_MHJYDkDK8jpldoqoWW1Sb6LiTyJ1N3G0ZMp8x59LABi9RudXuyohq-gEHzs4WxpbaMoDbPnzZxGZ5LfQxY8mUUUYTiIcQaoAO1EmMeFHx991lOBQ56S8PWxc10'
  },
  'mock-2': { title: 'Rapid Onset Neurological Deficit in a 30yo Female', views: 3400 },
  'mock-3': { title: 'Persistent Fever in a Neonate: Beyond the Common', views: 890 }
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const { data: fetchedPost, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      // If it's a mock post from the home feed, simulate a fetch
      if (id.startsWith('mock-')) {
        return {
          id,
          caseSummary: 'A 52-year-old female patient presented with a three-month history of bilateral lower extremity purpura, worsening fatigue, and intermittent low-grade fevers. She reported persistent numbness in her right foot and progressive shortness of breath over the last two weeks.\n\nInitial physical examination revealed palpable purpura on the shins and diminished sensation in the peroneal nerve distribution.',
          clinicalDecisions: 'Ordered immediate CT-Angiography to rule out major vessel involvement following abnormal pulmonary auscultation.\nInitiated pulse dose methylprednisolone (1g/day) for 3 days due to rapidly progressive renal insufficiency.\nConsulted Neurology for nerve conduction studies to confirm suspected mononeuritis multiplex.',
          outcome: 'Following the induction phase with Rituximab and high-dose corticosteroids, the patient\'s renal function stabilized. The purpura resolved within 14 days, and pulmonary symptoms significantly improved. The patient is currently on a tapering steroid regimen and remains in clinical remission at the 6-month follow-up mark.',
          keyLessons: '1. Early recognition of mononeuritis multiplex can be a critical diagnostic clue for systemic vasculitis.\n2. Multi-disciplinary collaboration between Nephrology, Rheumatology, and Neurology is essential for complex autoimmune presentations.\n3. Prompt initiation of immunosuppressive therapy is vital to prevent permanent organ damage in GPA variants.',
          specialty: 'Rheumatology',
          tags: [],
          createdAt: new Date().toISOString(),
          bookmarked: false,
          author: { id: 'author-1', name: 'Dr. Sarah Chen', specialization: '12y Exp', avatarUrl: null },
          ...MOCK_DATA[id]
        } as Post;
      }
      const { data } = await api.get<Post>(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (bookmarked: boolean) => {
      // Don't actually hit API for mocks
      if (id.startsWith('mock-')) return;
      if (bookmarked) await api.post(`/posts/${id}/bookmark`);
      else await api.delete(`/posts/${id}/bookmark`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', id] }),
  });

  if (isLoading || !id) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width={100} height={20} />
          <SkeletonLoader width={40} height={40} borderRadius={20} />
        </View>
        <View style={{ padding: 20 }}>
          <SkeletonLoader width="100%" height={32} style={{ marginBottom: 16 }} />
          <SkeletonLoader width="100%" height={100} style={{ marginBottom: 24 }} />
          <SkeletonLoader width="80%" height={24} style={{ marginBottom: 16 }} />
        </View>
      </View>
    );
  }

  if (error || !fetchedPost) {
    return (
      <View style={styles.center}>
        <SymbolView name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }} tintColor={theme.secondary} size={48} />
        <Text style={[styles.errorText, { color: theme.text }]}>Case not found</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <Text style={{ color: theme.text, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const post = fetchedPost;
  const toggleBookmark = () => bookmarkMutation.mutate(!post.bookmarked);

  // Parse fields for formatted display
  const titleStr = post.title || (post.caseSummary.split('\n')[0].length < 60 ? post.caseSummary.split('\n')[0] : 'Clinical Case Study');
  const decisionsList = post.clinicalDecisions ? post.clinicalDecisions.split('\n').filter(Boolean) : [];
  const lessonsList = post.keyLessons ? post.keyLessons.split('\n').filter(Boolean) : [];

  return (
    <RNView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Sticky Top Header */}
      <RNView style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10), backgroundColor: 'rgba(255,255,255,0.9)', borderBottomColor: theme.tint + '1a' }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={theme.tint} size={24} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.tint }]}>CASE STUDY</Text>

        <TouchableOpacity onPress={toggleBookmark} style={styles.iconBtn}>
          <SymbolView
            name={{ ios: post.bookmarked ? 'bookmark.fill' : 'bookmark', android: post.bookmarked ? 'bookmark' : 'bookmark_border', web: post.bookmarked ? 'bookmark' : 'bookmark_border' }}
            tintColor={theme.tint}
            size={24}
          />
        </TouchableOpacity>
      </RNView>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <RNView style={styles.hero}>
          <Text style={[styles.title, { color: theme.tint }]}>{titleStr}</Text>

          <RNView style={styles.tagsRow}>
            <RNView style={[styles.chip, { backgroundColor: theme.tint + '1a' }]}>
              <SymbolView name={{ ios: 'stethoscope', android: 'medical_services', web: 'medical_services' }} tintColor={theme.tint} size={14} />
              <Text style={[styles.chipText, { color: theme.tint }]}>{post.specialty || 'General'}</Text>
            </RNView>
            <RNView style={[styles.chip, { backgroundColor: theme.tint + '1a' }]}>
              <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} tintColor={theme.tint} size={14} />
              <Text style={[styles.chipText, { color: theme.tint }]}>
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </RNView>
            <RNView style={[styles.chip, { backgroundColor: theme.tint + '1a' }]}>
              <SymbolView name={{ ios: 'eye', android: 'visibility', web: 'visibility' }} tintColor={theme.tint} size={14} />
              <Text style={[styles.chipText, { color: theme.tint }]}>{post.views || '1.2k'} Views</Text>
            </RNView>
          </RNView>
        </RNView>

        {/* Clinical Presentation */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <RNView style={[styles.verticalBar, { backgroundColor: theme.tint }]} />
            <Text style={[styles.sectionTitle, { color: theme.tint }]}>Clinical Presentation</Text>
          </RNView>
          <Text style={[styles.bodyText, { color: theme.text }]}>{post.caseSummary}</Text>
        </RNView>

        {/* Clinical Decisions */}
        {decisionsList.length > 0 && (
          <RNView style={styles.section}>
            <RNView style={styles.sectionHeader}>
              <RNView style={[styles.verticalBar, { backgroundColor: theme.tint }]} />
              <Text style={[styles.sectionTitle, { color: theme.tint }]}>Clinical Decisions</Text>
            </RNView>
            <RNView style={styles.listContainer}>
              {decisionsList.map((decision, idx) => (
                <RNView key={idx} style={styles.listItem}>
                  <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} tintColor={theme.tint} size={20} style={{ marginTop: 2 }} />
                  <Text style={[styles.bodyText, { color: theme.text, flex: 1, marginLeft: 12 }]}>{decision.replace(/^- /, '')}</Text>
                </RNView>
              ))}
            </RNView>
          </RNView>
        )}

        {/* Image Placeholder / Visuals */}
        {post.imageUrl ? (
          <RNView style={styles.imageSection}>
            <Image source={{ uri: post.imageUrl }} style={styles.caseImage} />
            <RNView style={styles.imageCaptionBox}>
              <Text style={styles.imageCaptionText}>Figure 1: Relevant clinical imaging</Text>
            </RNView>
          </RNView>
        ) : (
          <RNView style={[styles.imageSection, { backgroundColor: theme.border }]}>
            <SymbolView name={{ ios: 'photo', android: 'image', web: 'image' }} tintColor={theme.secondary} size={48} />
          </RNView>
        )}

        {/* Outcome */}
        {post.outcome ? (
          <RNView style={styles.section}>
            <RNView style={styles.sectionHeader}>
              <RNView style={[styles.verticalBar, { backgroundColor: theme.tint }]} />
              <Text style={[styles.sectionTitle, { color: theme.tint }]}>Outcome</Text>
            </RNView>
            <Text style={[styles.bodyText, { color: theme.text }]}>{post.outcome}</Text>
          </RNView>
        ) : null}

        {/* Key Lessons */}
        {lessonsList.length > 0 && (
          <RNView style={[styles.lessonsSection, { backgroundColor: theme.tint + '0d', borderColor: theme.tint + '1a' }]}>
            <RNView style={[styles.sectionHeader, { marginBottom: 16 }]}>
              <SymbolView name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' }} tintColor={theme.tint} size={24} />
              <Text style={[styles.sectionTitle, { color: theme.tint, marginLeft: 8 }]}>Key Lessons</Text>
            </RNView>
            <RNView style={{ gap: 12 }}>
              {lessonsList.map((lesson, idx) => (
                <Text key={idx} style={[styles.lessonText, { color: theme.text }]}>{lesson}</Text>
              ))}
            </RNView>
          </RNView>
        )}

      </ScrollView>

      {/* Sticky Bottom Interaction Footer */}
      <RNView style={[styles.footer, { paddingBottom: insets.bottom || 16, backgroundColor: theme.background, borderTopColor: theme.tint + '1a' }]}>
        <TouchableOpacity style={[styles.followBtn, { backgroundColor: theme.tint }]}>
          <SymbolView name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} tintColor="#fff" size={20} />
          <Text style={styles.followBtnText}>Follow Doctor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerActionBtn, { backgroundColor: theme.tint + '1a' }]}>
          <SymbolView name={{ ios: 'bubble.right', android: 'chat_bubble', web: 'chat_bubble' }} tintColor={theme.tint} size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerActionBtn, { backgroundColor: theme.tint + '1a' }]}>
          <SymbolView name={{ ios: 'arrowshape.turn.up.right', android: 'share', web: 'share' }} tintColor={theme.tint} size={22} />
        </TouchableOpacity>
      </RNView>

    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 24 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },

  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },

  hero: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verticalBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },

  listContainer: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  imageSection: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  caseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageCaptionBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  imageCaptionText: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
  },

  lessonsSection: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  lessonText: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '500',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    gap: 8,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerActionBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});

