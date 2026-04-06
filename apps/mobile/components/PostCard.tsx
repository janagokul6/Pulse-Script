import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export type Post = {
    id: string;
    caseSummary: string;
    title?: string;
    clinicalDecisions: string;
    outcome: string;
    keyLessons: string;
    specialty: string | null;
    tags: string[];
    createdAt: string;
    author: { id: string; name: string; specialization: string | null; avatarUrl: string | null };
    imageUrl?: string;
    commentCount?: number;
    stats?: { comments: number; shares: number; saves: number; isSaved?: boolean };
    badge?: string;
    iconName?: string;
};

/**
 * Format date to "2h ago", "1d ago", etc.
 */
function formatTimeAgo(dateString: string) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
}

export function PostCard({ post }: { post: Post }) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const router = useRouter();

    const authorInitial = post.author.name ? post.author.name[0].toUpperCase() : '?';

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/post/${post.id}`)}
        >
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: theme.tint + '1a' }]}>
                    {post.iconName ? (
                        <SymbolView name={{ ios: post.iconName as any, android: 'medical_services', web: 'medical_services' }} tintColor={theme.tint} size={22} />
                    ) : (
                        <Text style={[styles.avatarText, { color: theme.tint }]}>{authorInitial}</Text>
                    )}
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.authorName, { color: theme.text }]}>
                        {post.author.name}
                        {post.author.specialization && (
                            <Text style={[styles.experienceText, { color: theme.secondary }]}>
                                , {post.author.specialization}
                            </Text>
                        )}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaTime, { color: theme.secondary }]}>
                            {post.specialty || 'General Medicine'} • {formatTimeAgo(post.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>

            {post.imageUrl && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: post.imageUrl }} style={styles.cardImage} />
                </View>
            )}

            <View style={styles.content}>
                {post.badge && (
                    <View style={[styles.badgeContainer, { backgroundColor: theme.tint + '1a' }]}>
                        <Text style={[styles.badgeText, { color: theme.tint }]}>{post.badge.toUpperCase()}</Text>
                    </View>
                )}
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                    {post.title || (post.caseSummary.split('\n')[0].length < 60 ? post.caseSummary.split('\n')[0] : post.caseSummary.substring(0, 50) + '...')}
                </Text>
                <Text style={[styles.summary, { color: theme.secondary }]} numberOfLines={2}>
                    {post.title ? post.caseSummary : post.caseSummary}
                </Text>

                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                    <View style={styles.footerLeft}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <SymbolView name={{ ios: 'text.bubble.fill', android: 'chat_bubble', web: 'chat_bubble' }} tintColor={theme.secondary} size={20} />
                            <Text style={[styles.actionText, { color: theme.text }]}>{post.stats?.comments ?? post.commentCount ?? 0}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <SymbolView name={{ ios: 'arrowshape.turn.up.right.fill', android: 'share', web: 'share' }} tintColor={theme.secondary} size={20} />
                            <Text style={[styles.actionText, { color: theme.text }]}>{post.stats?.shares || Math.floor(Math.random() * 10)}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.actionBtn}>
                        <SymbolView
                            name={{ ios: post.stats?.isSaved ? 'bookmark.fill' : 'bookmark.fill', android: post.stats?.isSaved ? 'bookmark' : 'bookmark', web: post.stats?.isSaved ? 'bookmark' : 'bookmark' }}
                            tintColor={post.stats?.isSaved ? theme.tint : theme.secondary}
                            size={20}
                        />
                        <Text style={[styles.actionText, { color: post.stats?.isSaved ? theme.tint : theme.text }, post.stats?.isSaved && { fontWeight: '700' }]}>
                            {post.stats?.isSaved ? 'Saved' : (post.stats?.saves || Math.floor(Math.random() * 30) + 5)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        // Premium shadow
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden', // to clip the image
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerTextContainer: {
        flex: 1,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    experienceText: {
        fontSize: 14,
        fontWeight: '400',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    metaTime: {
        fontSize: 12,
        fontWeight: '500',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#f1f5f9',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    content: {
        padding: 16,
        paddingTop: 12,
        gap: 8,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        lineHeight: 26,
        letterSpacing: -0.4,
    },
    summary: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '400',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        marginTop: 8,
        paddingTop: 16,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
