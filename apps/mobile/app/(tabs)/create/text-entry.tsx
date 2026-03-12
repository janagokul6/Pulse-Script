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

export default function TextEntryScreen() {
    const router = useRouter();
    const searchParams = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const [rawText, setRawText] = useState((searchParams.transcript as string) || '');
    const [draftDataStr, setDraftDataStr] = useState((searchParams.draftData as string) || '{}');

    useEffect(() => {
        if (searchParams.transcript) {
            setRawText(searchParams.transcript as string);
        }
    }, [searchParams.transcript]);

    const handleNext = () => {
        if (!rawText.trim()) {
            Alert.alert('Required', 'Please enter your case notes before proceeding.');
            return;
        }

        try {
            const parsedDraft = JSON.parse(draftDataStr);
            // Overwrite caseSummary with current raw text so they have the latest edits if they changed it
            const updatedDraft = { ...parsedDraft, caseSummary: rawText.trim() };

            router.push({
                pathname: '/(tabs)/create/edit',
                params: { draftData: JSON.stringify(updatedDraft) }
            });
        } catch (e) {
            // If parsing fails, just send the raw text
            const fallbackDraft = {
                caseSummary: rawText.trim(),
                clinicalDecisions: '',
                outcome: '',
                keyLessons: '',
                specialty: '',
                tags: [],
            };
            router.push({
                pathname: '/(tabs)/create/edit',
                params: { draftData: JSON.stringify(fallbackDraft) }
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <SymbolView name={{ ios: 'doc.text.viewfinder', android: 'document_scanner', web: 'document_scanner' }} tintColor={theme.tint} size={32} />
                    <Text style={[styles.title, { color: theme.text }]}>Refine your notes</Text>
                    <Text style={[styles.subtitle, { color: theme.secondary }]}>
                        Review the transcribed text or enter your case notes manually. Our AI will extract structured fields in the next step.
                    </Text>
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={rawText}
                        onChangeText={setRawText}
                        placeholder="Type or paste your clinical case notes here..."
                        placeholderTextColor={theme.secondary}
                        multiline
                        autoFocus={!rawText}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: theme.tint }, !rawText.trim() && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={!rawText.trim()}
                >
                    <Text style={styles.nextButtonText}>Structure with AI</Text>
                    <SymbolView name={{ ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' }} tintColor="#fff" size={20} />
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
        flexGrow: 1,
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
    inputContainer: {
        flex: 1,
        minHeight: 250,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
    },
    nextButton: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
