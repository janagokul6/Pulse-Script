import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    View as RNView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

type Draft = {
    caseSummary: string;
    clinicalDecisions: string;
    outcome: string;
    keyLessons: string;
    specialty: string;
    tags: string[];
};

export default function ReviewScreen() {
    const router = useRouter();
    const searchParams = useLocalSearchParams();
    const queryClient = useQueryClient();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (searchParams.draftData) {
            try { setDraft(JSON.parse(searchParams.draftData as string)); }
            catch { console.error('Failed to parse draft data'); }
        }
    }, [searchParams.draftData]);

    const handlePublish = async () => {
        if (!draft?.caseSummary.trim()) {
            Alert.alert('Required', 'Case summary is required.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/posts', {
                caseSummary: draft.caseSummary.trim(),
                clinicalDecisions: draft.clinicalDecisions.trim(),
                outcome: draft.outcome.trim(),
                keyLessons: draft.keyLessons.trim(),
                specialty: draft.specialty.trim() || undefined,
                tags: draft.tags,
            });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            router.replace('/(tabs)');
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } } };
            Alert.alert('Error', err.response?.data?.error || 'Failed to publish case.');
        } finally {
            setSaving(false);
        }
    };

    if (!draft) return null;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <RNView style={[styles.iconBadge, { backgroundColor: theme.tint + '12' }]}>
                    <SymbolView name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} tintColor={theme.tint} size={30} />
                </RNView>
                <Text style={[styles.title, { color: theme.text }]}>Ready to Publish</Text>
                <Text style={[styles.subtitle, { color: theme.secondary }]}>
                    Review your clinical record before sharing with the community.
                </Text>
            </View>

            <RNView style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {(draft.specialty || draft.tags.length > 0) && (
                    <RNView style={styles.metaRow}>
                        {draft.specialty ? (
                            <RNView style={[styles.badge, { backgroundColor: theme.tint + '15' }]}>
                                <Text style={[styles.badgeText, { color: theme.tint }]}>{draft.specialty}</Text>
                            </RNView>
                        ) : null}
                        {draft.tags.map(tag => (
                            <RNView key={tag} style={[styles.badge, { backgroundColor: theme.border }]}>
                                <Text style={[styles.badgeText, { color: theme.secondary }]}>{tag}</Text>
                            </RNView>
                        ))}
                    </RNView>
                )}

                <RNView style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: theme.secondary }]}>Clinical Presentation</Text>
                    <Text style={[styles.body, { color: theme.text }]}>{draft.caseSummary}</Text>
                </RNView>

                {!!draft.clinicalDecisions && (
                    <RNView style={[styles.section, styles.sectionDivider, { borderTopColor: theme.border }]}>
                        <Text style={[styles.sectionLabel, { color: theme.secondary }]}>Clinical Decisions</Text>
                        <RNView style={[styles.insetCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <Text style={[styles.body, { color: theme.text }]}>{draft.clinicalDecisions}</Text>
                        </RNView>
                    </RNView>
                )}

                {!!draft.outcome && (
                    <RNView style={[styles.section, styles.sectionDivider, { borderTopColor: theme.border }]}>
                        <Text style={[styles.sectionLabel, { color: theme.secondary }]}>Outcome</Text>
                        <Text style={[styles.body, { color: theme.text }]}>{draft.outcome}</Text>
                    </RNView>
                )}

                {!!draft.keyLessons && (
                    <RNView style={[styles.section, styles.sectionDivider, { borderTopColor: theme.border }]}>
                        <Text style={[styles.sectionLabel, { color: theme.secondary }]}>Key Lessons</Text>
                        <RNView style={[styles.lessonsCard, { backgroundColor: theme.tint + '0d', borderLeftColor: theme.tint }]}>
                            <Text style={[styles.body, { color: theme.text }]}>{draft.keyLessons}</Text>
                        </RNView>
                    </RNView>
                )}
            </RNView>

            <RNView style={styles.actions}>
                <TouchableOpacity
                    style={[styles.publishBtn, { backgroundColor: theme.tint }, saving && styles.disabled]}
                    onPress={handlePublish}
                    disabled={saving}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} tintColor="#fff" size={18} />
                            <Text style={styles.publishBtnText}>Publish Case</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.editBtn, { borderColor: theme.border }]}
                    onPress={() => router.back()}
                    disabled={saving}
                >
                    <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Fields</Text>
                </TouchableOpacity>
            </RNView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 48 },
    header: { alignItems: 'center', marginBottom: 28 },
    iconBadge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
    subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
    badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    section: { paddingVertical: 2 },
    sectionDivider: { borderTopWidth: 1, marginTop: 16, paddingTop: 16 },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
    },
    body: { fontSize: 15, lineHeight: 23 },
    insetCard: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
    },
    lessonsCard: {
        padding: 14,
        borderRadius: 10,
        borderLeftWidth: 3,
    },
    actions: { gap: 12 },
    publishBtn: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    editBtn: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    editBtnText: { fontSize: 15, fontWeight: '600' },
    disabled: { opacity: 0.65 },
});
