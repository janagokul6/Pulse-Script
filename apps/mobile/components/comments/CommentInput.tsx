import Colors from '@/constants/Colors';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '../useColorScheme';

const MAX_LENGTH = 2000;

interface CommentInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  replyTarget: { authorName: string } | null;
  onCancelReply: () => void;
  inputRef: React.RefObject<TextInput>;
}

export function CommentInput({
  value,
  onChange,
  onSubmit,
  submitting,
  replyTarget,
  onCancelReply,
  inputRef,
}: CommentInputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const isBlank = value.trim().length === 0;
  const isDisabled = submitting || isBlank;
  const charCount = value.length;

  return (
    <View style={[styles.wrapper, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
      {/* Reply banner */}
      {replyTarget && (
        <View style={[styles.replyBanner, { backgroundColor: theme.tint + '15', borderBottomColor: theme.border }]}>
          <Text style={[styles.replyText, { color: theme.tint }]}>
            Replying to @{replyTarget.authorName}
          </Text>
          <TouchableOpacity
            onPress={onCancelReply}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.dismissText, { color: theme.secondary }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
          value={value}
          onChangeText={onChange}
          placeholder="Add a comment…"
          placeholderTextColor={theme.secondary}
          multiline
          maxLength={MAX_LENGTH}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: isDisabled ? theme.border : theme.tint }]}
          onPress={onSubmit}
          disabled={isDisabled}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Character counter */}
      <Text style={[styles.counter, { color: charCount > MAX_LENGTH * 0.9 ? '#e53e3e' : theme.secondary }]}>
        {charCount} / {MAX_LENGTH}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  counter: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
