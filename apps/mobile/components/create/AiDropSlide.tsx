/**
 * AiDropSlide — Exact AI text entry UI from text-entry.tsx,
 * wrapped as an embeddable slide component for the carousel.
 * All styling, layout, and colors are 100% preserved.
 * Initializes with empty text (no searchParams dependency).
 */
import { Text, View } from '@/components/Themed';
import api from '@/lib/api';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';

const EMPTY_DRAFT = { caseSummary: '', clinicalDecisions: '', outcome: '', keyLessons: '', specialty: '', tags: [] };

type Theme = { text: string; tint: string; secondary: string; border: string; background: string; card: string };

export default function AiDropSlide({ theme }: { theme: Theme }) {
    const router = useRouter();

    const [rawText, setRawText] = useState('');
    const [structuring, setStructuring] = useState(false);

    const goToEdit = (draftData: object) =>
        router.push({ pathname: '/(tabs)/create/edit', params: { draftData: JSON.stringify(draftData) } });

    const handleStructure = async () => {
        const text = rawText.trim();
        if (!text) {
            Alert.alert('Required', 'Please enter your case notes before proceeding.');
            return;
        }
        setStructuring(true);
        try {
            const { data } = await api.post('/posts/ai-structure', { rawText: text });
            goToEdit(data);
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { code?: string; error?: string; message?: string } } };
            const isNotConfigured = err.response?.status === 400 && err.response?.data?.code === 'BAD_REQUEST';
            if (isNotConfigured) {
                goToEdit({ ...EMPTY_DRAFT, caseSummary: text });
                return;
            }
            Alert.alert(
                'AI Structuring Failed',
                err.response?.data?.error || err.response?.data?.message || 'Could not structure your notes.',
                [
                    { text: 'Fill Manually', onPress: () => goToEdit({ ...EMPTY_DRAFT, caseSummary: text }) },
                    { text: 'Retry', style: 'cancel' },
                ]
            );
        } finally {
            setStructuring(false);
        }
    };

    const handleManual = () => goToEdit({ ...EMPTY_DRAFT, caseSummary: rawText.trim() });

    const charCount = rawText.length;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <RNView style={[styles.iconBadge, { backgroundColor: theme.tint + '12' }]}>
                        <SymbolView name={{ ios: 'doc.text.viewfinder', android: 'document_scanner', web: 'document_scanner' }} tintColor={theme.tint} size={28} />
                    </RNView>
                    <Text style={[styles.title, { color: theme.text }]}>Your Case Notes</Text>
                    <Text style={[styles.subtitle, { color: theme.secondary }]}>
                        Review or edit the transcribed text. AI will extract structured fields in the next step.
                    </Text>
                </View>

                <RNView style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={rawText}
                        onChangeText={setRawText}
                        placeholder="Type or paste your clinical case notes here…"
                        placeholderTextColor={theme.secondary + '88'}
                        multiline
                        textAlignVertical="top"
                    />
                    <RNView style={[styles.inputFooter, { borderTopColor: theme.border }]}>
                        <Text style={[styles.charCount, { color: theme.secondary }]}>{charCount} chars</Text>
                    </RNView>
                </RNView>

                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.tint }, (!rawText.trim() || structuring) && styles.disabled]}
                    onPress={handleStructure}
                    disabled={!rawText.trim() || structuring}
                    activeOpacity={0.85}
                >
                    {structuring ? (
                        <>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.primaryBtnText}>Structuring…</Text>
                        </>
                    ) : (
                        <>
                            <SymbolView name={{ ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' }} tintColor="#fff" size={18} />
                            <Text style={styles.primaryBtnText}>Structure with AI</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={handleManual} disabled={structuring}>
                    <Text style={[styles.secondaryBtnText, { color: theme.secondary }]}>Fill fields manually</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 40, flexGrow: 1 },
    header: { alignItems: 'center', marginBottom: 24 },
    iconBadge: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
    subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16 },
    inputCard: {
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    input: {
        minHeight: 220,
        padding: 16,
        fontSize: 15,
        lineHeight: 23,
    },
    inputFooter: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'flex-end',
    },
    charCount: { fontSize: 12, fontWeight: '500' },
    primaryBtn: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.5 },
    secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
    secondaryBtnText: { fontSize: 14, fontWeight: '500' },
});
