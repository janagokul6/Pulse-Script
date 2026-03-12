import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/lib/api';
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
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (searchParams.draftData) {
            try {
                setDraft(JSON.parse(searchParams.draftData as string));
            } catch (e) {
                console.error("Failed to parse draft data");
            }
        }
    }, [searchParams.draftData]);

    const handlePublish = async () => {
        if (!draft || !draft.caseSummary.trim()) {
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
            // Route back to the home feed index and reset the stack
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <SymbolView name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} tintColor={theme.tint} size={36} />
                <Text style={[styles.title, { color: theme.text }]}>Ready to Publish</Text>
                <Text style={[styles.subtitle, { color: theme.secondary }]}>
                    Review your final clinical record below. Publishing will make this case available to the MedLore community.
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {draft.specialty ? (
                    <View style={styles.tagsRow}>
                        <View style={[styles.tag, { backgroundColor: theme.tint + '15' }]}>
                            <Text style={[styles.tagText, { color: theme.tint }]}>{draft.specialty}</Text>
                        </View>
                    </View>
                ) : null}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Clinical Presentation</Text>
                    <Text style={[styles.body, { color: theme.text }]}>{draft.caseSummary}</Text>
                </View>

                {draft.clinicalDecisions ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Clinical Decisions</Text>
                        <RNView style={[styles.cardSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <Text style={[styles.body, { color: theme.text, marginBottom: 0 }]}>{draft.clinicalDecisions}</Text>
                        </RNView>
                    </View>
                ) : null}

                {draft.outcome ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Outcome</Text>
                        <Text style={[styles.body, { color: theme.text }]}>{draft.outcome}</Text>
                    </View>
                ) : null}

                {draft.keyLessons ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Lessons</Text>
                        <RNView style={[styles.lessonsCard, { backgroundColor: theme.tint + '10', borderLeftColor: theme.tint }]}>
                            <Text style={[styles.body, { color: theme.text, marginBottom: 0 }]}>{draft.keyLessons}</Text>
                        </RNView>
                    </View>
                ) : null}
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.publishButton, { backgroundColor: theme.tint }, saving && styles.buttonDisabled]}
                    onPress={handlePublish}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.publishText}>Publish Case</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.backButton, { borderColor: theme.border }]}
                    onPress={() => router.back()}
                    disabled={saving}
                >
                    <Text style={[styles.backText, { color: theme.text }]}>Edit Fields</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        paddingTop: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    tagsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 4,
    },
    cardSection: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 4,
    },
    lessonsCard: {
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        marginTop: 4,
    },
    actionRow: {
        gap: 16,
    },
    publishButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    publishText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
