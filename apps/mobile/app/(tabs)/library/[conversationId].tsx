import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Message, formatTimeAgo, useConversations, useMessages } from '@/lib/messages';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
  Image,
} from 'react-native';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const router = useRouter();

  const { data: conversations } = useConversations();
  const conversation = conversations?.find((c) => c.id === conversationId);

  const { messages, sendMessage, currentUserId, markAsRead, refetch } = useMessages(conversationId);
  const [text, setText] = useState('');

  useEffect(() => {
    markAsRead();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  const latestOutgoing = useMemo(
    () =>
      [...sortedMessages]
        .reverse()
        .find((m) => m.senderId === currentUserId),
    [sortedMessages, currentUserId],
  );

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage({ body: text.trim() });
    setText('');
  };

  const handleAttach = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      // Support both old (`type`) and new (`canceled`) result shapes
      if ('type' in result && result.type === 'cancel') return;
      if ('canceled' in result && result.canceled) return;

      // Normalise fields
      const name = 'assets' in result && result.assets?.[0]?.name
        ? result.assets[0].name
        : (result as any).name ?? 'Attachment';
      const uri = 'assets' in result && result.assets?.[0]?.uri
        ? result.assets[0].uri
        : (result as any).uri;

      if (!uri) return;

      const isImage = /\.(jpe?g|png|gif|webp)$/i.test(name);

      sendMessage({
        body: name,
        type: isImage ? 'image' : 'file',
        attachmentUrl: uri,
        attachmentName: name,
      });
    } catch {
      // ignore for now
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUserId;
    const isLatestOutgoing = latestOutgoing && latestOutgoing.id === item.id;

    return (
      <RNView style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
        <RNView
          style={[
            styles.bubble,
            isMe
              ? { backgroundColor: theme.tint, borderBottomRightRadius: 4 }
              : { backgroundColor: theme.card, borderBottomLeftRadius: 4 },
          ]}
        >
          {item.type === 'image' && item.attachmentUrl && (
            <Image source={{ uri: item.attachmentUrl }} style={styles.imageAttachment} />
          )}
          {item.type === 'file' && item.attachmentName && (
            <RNView style={styles.fileAttachment}>
              <SymbolView
                name={{ ios: 'doc', android: 'insert_drive_file', web: 'insert_drive_file' }}
                tintColor={isMe ? '#fff' : theme.tint}
                size={18}
              />
              <Text
                style={[
                  styles.fileName,
                  isMe ? { color: '#fff' } : { color: theme.text },
                ]}
                numberOfLines={1}
              >
                {item.attachmentName}
              </Text>
            </RNView>
          )}
          {!!item.body && (
            <Text
              style={[
                styles.bubbleText,
                isMe ? { color: '#fff' } : { color: theme.text },
              ]}
            >
              {item.body}
            </Text>
          )}
        </RNView>
        <RNView style={styles.metaRow}>
          <Text style={[styles.timeText, { color: theme.secondary }]}>{formatTimeAgo(item.createdAt)}</Text>
          {isMe && isLatestOutgoing && item.status === 'read' && (
            <Text style={[styles.seenText, { color: theme.secondary }]}>Seen</Text>
          )}
        </RNView>
      </RNView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.flex}>
        <RNView style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={theme.text}
              size={22}
            />
          </TouchableOpacity>
          <RNView style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {conversation?.otherUser.name ?? 'Conversation'}
            </Text>
            {conversation?.otherUser.specialization && (
              <Text style={[styles.headerSubtitle, { color: theme.secondary }]} numberOfLines={1}>
                {conversation.otherUser.specialization}
              </Text>
            )}
          </RNView>
        </RNView>

        <FlatList
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
        />

        <RNView style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <RNView style={styles.inputActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleAttach}>
              <SymbolView
                name={{ ios: 'paperclip', android: 'attach_file', web: 'attach_file' }}
                tintColor={theme.secondary}
                size={22}
              />
            </TouchableOpacity>
          </RNView>
          <RNView style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor={theme.secondary}
              value={text}
              onChangeText={setText}
              multiline
            />
          </RNView>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: text.trim() ? theme.tint : theme.card }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <SymbolView
              name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
              tintColor={text.trim() ? '#fff' : theme.secondary}
              size={20}
            />
          </TouchableOpacity>
        </RNView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  messageRow: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageAttachment: {
    width: 200,
    height: 140,
    borderRadius: 12,
    marginBottom: 6,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    maxWidth: 220,
  },
  fileName: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 6,
  },
  timeText: {
    fontSize: 11,
  },
  seenText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputActions: {
    flexDirection: 'row',
    marginRight: 6,
  },
  iconButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 2,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

