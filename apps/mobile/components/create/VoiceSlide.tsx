/**
 * VoiceSlide — Exact voice recording UI from the original index.tsx,
 * wrapped as an embeddable slide component for the carousel.
 * All styling, layout, and colors are 100% preserved.
 */
import { Text } from '@/components/Themed';
import api from '@/lib/api';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    StyleSheet,
    TouchableOpacity,
    View as RNView,
} from 'react-native';

type RecordingRef = { stopAndUnloadAsync: () => Promise<void>; getURI: () => string | null };

const WAVE_HEIGHTS = [14, 28, 20, 44, 36, 22, 36, 44, 20, 28, 14];

type Theme = { text: string; tint: string; secondary: string; border: string; background: string; card: string };

export default function VoiceSlide({ theme, bottomInset }: { theme: Theme; bottomInset: number }) {
    const router = useRouter();

    const [recording, setRecording] = useState<RecordingRef | null>(null);
    const [transcribing, setTranscribing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnims = useRef(WAVE_HEIGHTS.map(() => new Animated.Value(1))).current;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (recording) {
            interval = setInterval(() => setRecordingTime((p) => p + 1), 1000);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
            waveAnims.forEach((anim, i) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, { toValue: 1.5 + Math.sin(i) * 0.5, duration: 400 + i * 60, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0.6, duration: 400 + i * 60, useNativeDriver: true }),
                    ])
                ).start();
            });
        } else {
            setRecordingTime(0);
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
            waveAnims.forEach((a) => { a.stopAnimation(); a.setValue(1); });
        }
        return () => clearInterval(interval);
    }, [recording]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const startRecording = async () => {
        try {
            let Audio;
            try { Audio = require('expo-av').Audio; } catch {
                Alert.alert('Not supported', 'Voice recording is not available here.');
                return;
            }
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Microphone access is required for voice posts.');
                return;
            }
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: false, staysActiveInBackground: false, shouldDuckAndroid: true, playThroughEarpieceAndroid: false });
            const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(rec as unknown as RecordingRef);
        } catch {
            Alert.alert('Unavailable', 'Audio recording failed. Please use manual entry.');
        }
    };

    const stopAndTranscribe = async () => {
        if (!recording) return;
        setTranscribing(true);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            if (!uri) { setTranscribing(false); return; }

            const formData = new FormData();
            formData.append('audio', { uri, name: uri.split('/').pop() || 'audio.m4a', type: 'audio/m4a' } as unknown as Blob);
            const { data } = await api.post('/posts/transcribe', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            router.push({
                pathname: '/(tabs)/create/text-entry',
                params: { transcript: data.transcript || data.draft?.caseSummary || '' },
            });
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } } };
            Alert.alert('Transcription failed', err.response?.data?.error || 'Could not transcribe. Try again.');
        } finally {
            setTranscribing(false);
        }
    };

    const goManual = () => router.push({ pathname: '/(tabs)/create/text-entry', params: { transcript: '' } });

    return (
        <RNView style={styles.container}>
            {/* Recording badge — exact same as original header right side */}
            <RNView style={styles.recordingBadgeRow}>
                <RNView style={[styles.dot, { backgroundColor: recording ? '#ef4444' : theme.border }]} />
                <Text style={[styles.recordingLabel, { color: recording ? '#ef4444' : theme.secondary }]}>
                    {recording ? formatTime(recordingTime) : 'Ready'}
                </Text>
            </RNView>

            <RNView style={styles.body}>
                <RNView style={styles.visualizer}>
                    <Animated.View style={[styles.circleOuter, { backgroundColor: theme.tint + '08', transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={[styles.circleInner, { backgroundColor: theme.tint + '18', transform: [{ scale: pulseAnim }] }]} />
                    <TouchableOpacity
                        style={[styles.micBtn, { backgroundColor: theme.tint }]}
                        onPress={!recording ? startRecording : undefined}
                        disabled={transcribing || !!recording}
                        activeOpacity={0.85}
                    >
                        <SymbolView name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }} tintColor="#fff" size={44} />
                    </TouchableOpacity>
                </RNView>

                <RNView style={styles.waveform}>
                    {WAVE_HEIGHTS.map((h, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.waveBar, { backgroundColor: theme.tint, height: h, transform: [{ scaleY: waveAnims[i] }] }]}
                        />
                    ))}
                </RNView>

                <RNView style={styles.instructions}>
                    <Text style={[styles.instructionTitle, { color: theme.text }]}>
                        Speak naturally about the case
                    </Text>
                    <Text style={[styles.instructionSub, { color: theme.secondary }]}>
                        Describe the presentation, decisions, and lessons. AI will structure it for you.
                    </Text>
                </RNView>
            </RNView>

            <RNView style={[styles.footer, { paddingBottom: bottomInset || 24 }]}>
                {recording ? (
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
                        onPress={stopAndTranscribe}
                        disabled={transcribing}
                    >
                        {transcribing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <RNView style={styles.stopSquare} />
                                <Text style={styles.primaryBtnText}>Stop & Process</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
                        onPress={startRecording}
                        disabled={transcribing}
                    >
                        <Text style={styles.primaryBtnText}>Start Recording</Text>
                    </TouchableOpacity>
                )}

                {/* <TouchableOpacity style={styles.manualBtn} onPress={goManual} disabled={!!recording || transcribing}>
                    <Text style={[styles.manualBtnText, { color: theme.secondary }]}>Type manually instead</Text>
                </TouchableOpacity> */}

                <RNView style={[styles.privacyBox, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
                    <SymbolView name={{ ios: 'exclamationmark.shield.fill', android: 'security', web: 'security' }} tintColor="#d97706" size={18} />
                    <Text style={styles.privacyText}>
                        <Text style={{ fontWeight: '700' }}>Privacy: </Text>
                        Do not include patient names, DOBs, or identifying details.
                    </Text>
                </RNView>
            </RNView>
        </RNView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    recordingBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    recordingLabel: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },

    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 24 },
    visualizer: {
        width: 220,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleOuter: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
    },
    circleInner: {
        position: 'absolute',
        width: 155,
        height: 155,
        borderRadius: 78,
    },
    micBtn: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 48,
    },
    waveBar: { width: 5, borderRadius: 3 },
    instructions: { alignItems: 'center', gap: 8, maxWidth: 300 },
    instructionTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26, letterSpacing: -0.3 },
    instructionSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

    footer: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center', gap: 12 },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 30,
        gap: 10,
        width: '100%',
        shadowColor: '#1a355b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    stopSquare: { width: 12, height: 12, backgroundColor: '#fff', borderRadius: 2 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    manualBtn: { paddingVertical: 4 },
    manualBtnText: { fontSize: 14, fontWeight: '500' },
    privacyBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
        width: '100%',
    },
    privacyText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 17 },
});
