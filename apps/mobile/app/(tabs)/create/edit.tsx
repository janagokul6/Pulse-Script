import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    View as RNView,
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

type FieldConfig = {
    key: keyof Omit<Draft, 'tags'>;
    label: string;
    placeholder: string;
    iosIcon: string;
    androidIcon: string;
    required?: boolean;
    multiline?: boolean;
};

const FIELDS: FieldConfig[] = [
    { key: 'caseSummary', label: 'Case Summary', placeholder: 'Describe the patient presentation and clinical findings…', iosIcon: 'stethoscope', androidIcon: 'medical_services', required: true, multiline: true },
    { key: 'clinicalDecisions', label: 'Clinical Decisions', placeholder: 'What diagnostic and treatment actions were taken?', iosIcon: 'list.clipboard', androidIcon: 'fact_check', multiline: true },
    { key: 'outcome', label: 'Outcome', placeholder: 'What was the result or current patient status?', iosIcon: 'heart.text.square', androidIcon: 'monitoring', multiline: true },
    { key: 'keyLessons', label: 'Key Lessons', placeholder: 'Main takeaways for other clinicians', iosIcon: 'lightbulb', androidIcon: 'lightbulb', multiline: true },
    { key: 'specialty', label: 'Specialty', placeholder: 'e.g. Cardiology', iosIcon: 'cross.case', androidIcon: 'local_hospital', multiline: false },
];

export default function StructuredEditScreen() {
    const router = useRouter();
    const searchParams = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const [draft, setDraft] = useState<Draft>({
        caseSummary: '', clinicalDecisions: '', outcome: '', keyLessons: '', specialty: '', tags: [],
    });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (searchParams.draftData) {
            try {
                const parsed = JSON.parse(searchParams.draftData as string);
                setDraft({ caseSummary: '', clinicalDecisions: '', outcome: '', keyLessons: '', specialty: '', tags: [], ...parsed });
            } catch {}
        }
    }, [searchParams.draftData]);

    const addTag = () => {
        const val = tagInput.trim();
        if (!val) return;
        const newTags = val.split(',').map(t => t.trim()).filter(t => t && !draft.tags.includes(t));
        if (newTags.length) setDraft(d => ({ ...d, tags: [...d.tags, ...newTags] }));
        setTagInput('');
    };

    const removeTag = (tag: string) => setDraft(d => ({ ...d, tags: d.tags.filter(t => t !== tag) }));

    const handleNext = () => {
        if (!draft.caseSummary.trim()) {
            Alert.alert('Required', 'Case summary cannot be empty.');
            return;
        }
        const finalDraft = tagInput.trim()
            ? { ...draft, tags: [...draft.tags, ...tagInput.split(',').map(t => t.trim()).filter(Boolean)] }
            : draft;
        router.push({ pathname: '/(tabs)/create/review', params: { draftData: JSON.stringify(finalDraft) } });
    };

    const filledCount = FIELDS.filter(f => draft[f.key]?.trim()).length;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* <RNView style={styles.header}>
                    <RNView style={[styles.iconBadge, { backgroundColor: theme.tint + '12' }]}>
                        <SymbolView name={{ ios: 'pencil.and.list.clipboard', android: 'edit_note', web: 'edit_note' }} tintColor={theme.tint} size={26} />
                    </RNView>
                    <Text style={[styles.title, { color: theme.text }]}>Structured Case</Text>
                    <Text style={[styles.subtitle, { color: theme.secondary }]}>
                        Edit each section to shape your clinical case.
                    </Text>
                    <RNView style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                        <RNView style={[styles.progressFill, { backgroundColor: theme.tint, width: `${(filledCount / FIELDS.length) * 100}%` as any }]} />
                    </RNView>
                    <Text style={[styles.progressLabel, { color: theme.secondary }]}>
                        {filledCount} of {FIELDS.length} sections filled
                    </Text>
                </RNView> */}

                <RNView style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {FIELDS.map((field, i) => (
                        <RNView key={field.key} style={[styles.fieldGroup, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 16, paddingTop: 16 }]}>
                            <RNView style={styles.labelRow}>
                                <SymbolView name={{ ios: field.iosIcon, android: field.androidIcon, web: field.androidIcon } as any} tintColor={theme.tint} size={15} />
                                <Text style={[styles.label, { color: theme.text }]}>
                                    {field.label}{field.required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}
                                </Text>
                            </RNView>
                            <TextInput
                                style={[
                                    styles.input,
                                    field.multiline && styles.textArea,
                                    { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                                ]}
                                value={draft[field.key]}
                                onChangeText={(t) => setDraft(d => ({ ...d, [field.key]: t }))}
                                placeholder={field.placeholder}
                                placeholderTextColor={theme.secondary + '88'}
                                multiline={field.multiline}
                                textAlignVertical={field.multiline ? 'top' : 'center'}
                            />
                        </RNView>
                    ))}

                    <RNView style={[styles.fieldGroup, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 16, paddingTop: 16 }]}>
                        <RNView style={styles.labelRow}>
                            <SymbolView name={{ ios: 'tag', android: 'label', web: 'label' }} tintColor={theme.tint} size={15} />
                            <Text style={[styles.label, { color: theme.text }]}>Tags</Text>
                        </RNView>
                        {draft.tags.length > 0 && (
                            <RNView style={styles.tagsRow}>
                                {draft.tags.map(tag => (
                                    <TouchableOpacity
                                        key={tag}
                                        style={[styles.tagChip, { backgroundColor: theme.tint + '12' }]}
                                        onPress={() => removeTag(tag)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.tagChipText, { color: theme.tint }]}>{tag}</Text>
                                        <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={theme.tint} size={10} />
                                    </TouchableOpacity>
                                ))}
                            </RNView>
                        )}
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={tagInput}
                            onChangeText={setTagInput}
                            placeholder="Add a tag and press return"
                            placeholderTextColor={theme.secondary + '88'}
                            onSubmitEditing={addTag}
                            returnKeyType="done"
                            blurOnSubmit={false}
                        />
                        <Text style={[styles.tagHint, { color: theme.secondary }]}>Separate multiple tags with commas</Text>
                    </RNView>
                </RNView>

                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: theme.tint }, !draft.caseSummary.trim() && styles.disabled]}
                    onPress={handleNext}
                    disabled={!draft.caseSummary.trim()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextBtnText}>Review & Publish</Text>
                    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="#fff" size={17} />
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 48 },
    header: { alignItems: 'center', marginBottom: 28 },
    iconBadge: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
    subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
    progressTrack: { width: '55%', height: 4, borderRadius: 2, marginTop: 16, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    progressLabel: { fontSize: 12, fontWeight: '600', marginTop: 6 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    fieldGroup: { paddingVertical: 2 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 11,
        fontSize: 15,
        lineHeight: 22,
    },
    textArea: { minHeight: 84 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 9 },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 14,
    },
    tagChipText: { fontSize: 13, fontWeight: '600' },
    tagHint: { fontSize: 11, marginTop: 6 },
    nextBtn: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.45 },
});
