import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import api from '@/lib/api';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  View as RNView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RecordingRef = { stopAndUnloadAsync: () => Promise<void>; getURI: () => string | null };

export default function VoiceCreateScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [recording, setRecording] = useState<RecordingRef | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    try {
      let Audio;
      try {
        Audio = require('expo-av').Audio;
      } catch (err) {
        Alert.alert('Not supported', 'Voice recording is not available in this environment.');
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
    } catch (e) {
      Alert.alert(
        'Voice recording unavailable',
        'Audio recording is not available. Please use manual entry.'
      );
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recording) return;
    setTranscribing(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setTranscribing(false);
        return;
      }

      const formData = new FormData();
      const name = uri.split('/').pop() || 'audio.m4a';
      formData.append('audio', { uri, name, type: 'audio/m4a' } as unknown as Blob);

      const { data } = await api.post('/posts/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Navigate to step 2 with the transcription data
      router.push({
        pathname: '/(tabs)/create/text-entry',
        params: {
          transcript: data.transcript || data.draft?.caseSummary || '',
          draftData: JSON.stringify(data.draft || {})
        }
      });

    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      Alert.alert('Transcription failed', err.response?.data?.error || 'Could not transcribe. Try again.');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <RNView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <RNView style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10), backgroundColor: theme.background }]}>
        <RNView style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.tint + '10' }]}>
            <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={theme.tint} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Share a Clinical Case</Text>
        </RNView>

        <RNView style={styles.recordingIndicator}>
          <RNView style={[styles.recordingDot, recording ? { backgroundColor: '#ef4444' } : { backgroundColor: '#94a3b8' }]} />
          <Text style={[styles.recordingText, recording && { color: '#ef4444' }]}>
            {recording ? `Recording ${formatTime(recordingTime)}` : 'Ready'}
          </Text>
        </RNView>
      </RNView>

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <RNView style={styles.visualizerContainer}>

          {/* Concentric Circles & Mic */}
          <RNView style={styles.circlesContainer}>
            <RNView style={[styles.circleOuter, { backgroundColor: theme.tint + '08' }]} />
            <RNView style={[styles.circleInner, { backgroundColor: theme.tint + '1a' }]} />

            <TouchableOpacity
              style={[styles.micButton, { backgroundColor: theme.tint }]}
              onPress={!recording ? startRecording : undefined}
              disabled={transcribing || !!recording}
              activeOpacity={0.8}
            >
              <SymbolView name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }} tintColor="#fff" size={48} />
            </TouchableOpacity>
          </RNView>

          {/* Waveform Visualization */}
          <RNView style={styles.waveformContainer}>
            {[16, 32, 24, 48, 40, 24, 40, 48, 24, 32, 16].map((h, i) => {
              const opacities = [0.2, 0.4, 0.6, 1, 0.8, 0.6, 0.8, 1, 0.6, 0.4, 0.2];
              return (
                <RNView
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: recording ? h + (Math.random() * 10 - 5) : h, // Add slight flutter if recording
                      backgroundColor: theme.tint,
                      opacity: opacities[i]
                    }
                  ]}
                />
              );
            })}
          </RNView>

          {/* Instruction Texts - Explicitly shown here per feedback */}
          <RNView style={styles.instructionTextContainer}>
            <Text style={[styles.instructionTitle, { color: '#1e293b' }]}>
              Speak naturally about the case summary, decisions, and lessons.
            </Text>
            <Text style={[styles.instructionSubtitle, { color: '#64748b' }]}>
              Our AI will automatically structure your narration into a professional clinical post.
            </Text>
          </RNView>

        </RNView>
      </ScrollView>

      {/* Bottom Controls */}
      <RNView style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: theme.background }]}>

        <RNView style={styles.controlsWrapper}>
          {recording ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
              onPress={stopRecordingAndTranscribe}
              disabled={transcribing}
            >
              {transcribing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <RNView style={styles.stopSquare} />
                  <Text style={styles.primaryBtnText}>Stop & Process Case</Text>
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

          <RNView style={[styles.privacyBox, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
            <SymbolView name={{ ios: 'exclamationmark.shield.fill', android: 'security', web: 'security' }} tintColor="#d97706" size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <Text style={styles.privacyText}>
              <Text style={{ fontWeight: '800' }}>Privacy Reminder: </Text>
              Ensure no identifiable patient information (names, DOBs, specific locations) is included in your recording.
            </Text>
          </RNView>

        </RNView>

        {/* Progress Indicator */}
        <RNView style={styles.progressContainer}>
          <RNView style={[styles.progressDot, { backgroundColor: theme.tint }]} />
          <RNView style={[styles.progressDot, { backgroundColor: theme.tint, opacity: 0.2 }]} />
          <RNView style={[styles.progressDot, { backgroundColor: theme.tint, opacity: 0.2 }]} />
        </RNView>

      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },

  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  visualizerContainer: {
    alignItems: 'center',
    width: '100%',
    gap: 36,
  },
  circlesContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
  },
  circleOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  circleInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a355b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    marginTop: -50, // This pulls the waveform UP to explicitly overlap the circular rings below the mic
    marginBottom: 10,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  instructionTextContainer: {
    alignItems: 'center',
    maxWidth: '96%',
    gap: 12,
  },
  instructionTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  instructionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  controlsWrapper: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#1a355b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 220,
  },
  stopSquare: {
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    width: '100%',
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
