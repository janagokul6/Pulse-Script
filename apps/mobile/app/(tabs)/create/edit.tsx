import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
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

export default function StructuredEditScreen() {
    const router = useRouter();
    const searchParams = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const [draft, setDraft] = useState<Draft>({
        caseSummary: '',
        clinicalDecisions: '',
        outcome: '',
        keyLessons: '',
        specialty: '',
        tags: [],
    });
    const [tagsStr, setTagsStr] = useState('');

    useEffect(() => {
        if (searchParams.draftData) {
            try {
                const parsed = JSON.parse(searchParams.draftData as string);
                setDraft(parsed);
                if (parsed.tags && Array.isArray(parsed.tags)) {
                    setTagsStr(parsed.tags.join(', '));
                }
            } catch (e) {
                console.error("Failed to parse draft data");
            }
        }
    }, [searchParams.draftData]);

    const handleNext = () => {
        if (!draft.caseSummary.trim()) {
            Alert.alert('Required Error', 'Case summary must not be empty.');
            return;
        }

        const updatedDraft = {
            ...draft,
            tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean)
        };

        router.push({
            pathname: '/(tabs)/create/review',
            params: { draftData: JSON.stringify(updatedDraft) }
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <SymbolView name={{ ios: 'pencil.and.list.clipboard', android: 'edit_note', web: 'edit_note' }} tintColor={theme.tint} size={32} />
                    <Text style={[styles.title, { color: theme.text }]}>Structured Case</Text>
                    <Text style={[styles.subtitle, { color: theme.secondary }]}>
                        Review and edit the fields extracted from your notes.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: theme.text }]}>Case Summary *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                        value={draft.caseSummary}
                        onChangeText={(t) => setDraft(d => ({ ...d, caseSummary: t }))}
                        multiline
                        placeholderTextColor={theme.secondary}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Clinical Decisions</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                        value={draft.clinicalDecisions}
                        onChangeText={(t) => setDraft(d => ({ ...d, clinicalDecisions: t }))}
                        multiline
                        placeholder="What actions were taken?"
                        placeholderTextColor={theme.secondary}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Outcome</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                        value={draft.outcome}
                        onChangeText={(t) => setDraft(d => ({ ...d, outcome: t }))}
                        multiline
                        placeholder="What was the result?"
                        placeholderTextColor={theme.secondary}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Key Lessons</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                        value={draft.keyLessons}
                        onChangeText={(t) => setDraft(d => ({ ...d, keyLessons: t }))}
                        multiline
                        placeholder="Main takeaways for other clinicians"
                        placeholderTextColor={theme.secondary}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Specialty</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                        value={draft.specialty}
                        onChangeText={(t) => setDraft(d => ({ ...d, specialty: t }))}
                        placeholder="e.g. Cardiology"
                        placeholderTextColor={theme.secondary}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Tags (comma separated)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                        value={tagsStr}
                        onChangeText={setTagsStr}
                        placeholder="e.g. acute, ECG, rare"
                        placeholderTextColor={theme.secondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: theme.tint }]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>Review & Publish</Text>
                    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="#fff" size={20} />
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
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
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    form: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 16,
        letterSpacing: 0.3,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    nextButton: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
