import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  createComment,
  deleteComment,
  fetchComments,
  likeComment,
  unlikeComment,
  updateComment,
} from '@/lib/comments';
import type { CommentWithUser } from '@/lib/comments';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../SkeletonLoader';
import { useColorScheme } from '../useColorScheme';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';

interface CommentsBottomSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  autoFocusInput?: boolean;
}

export default function CommentsBottomSheet({
  postId,
  visible,
  onClose,
  autoFocusInput = false,
}: CommentsBottomSheetProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; body: string } | null>(null);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    enabled: visible && !!postId,
  });

  // Auto-focus input when modal opens with autoFocusInput=true
  useEffect(() => {
    if (visible && autoFocusInput) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible, autoFocusInput]);

  const handleReply = useCallback((comment: CommentWithUser) => {
    setEditTarget(null);
    setReplyTarget({ id: comment.id, authorName: comment.user.name ?? 'Unknown' });
    inputRef.current?.focus();
  }, []);

  const handleEdit = useCallback((comment: CommentWithUser) => {
    setReplyTarget(null);
    setEditTarget({ id: comment.id, body: comment.body });
    setInputText(comment.body);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTarget(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const savedText = inputText;

    try {
      if (editTarget) {
        await updateComment(postId, editTarget.id, trimmed);
        setEditTarget(null);
      } else {
        await createComment(postId, trimmed, replyTarget?.id);
        setReplyTarget(null);
      }
      setInputText('');
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch {
      setInputText(savedText);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [inputText, submitting, editTarget, replyTarget, postId, queryClient]);

  const handleDelete = useCallback(
    (commentId: string) => {
      Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(postId, commentId);
              await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            } catch {
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          },
        },
      ]);
    },
    [postId, queryClient],
  );

  const handleLike = useCallback(
    async (commentId: string, liked: boolean) => {
      // Optimistic update
      queryClient.setQueryData<CommentWithUser[]>(['comments', postId], (old) => {
        if (!old) return old;
        return updateLikeInTree(old, commentId, liked);
      });

      try {
        if (liked) {
          await unlikeComment(postId, commentId);
        } else {
          await likeComment(postId, commentId);
        }
        await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      } catch {
        // Revert optimistic update on failure
        queryClient.setQueryData<CommentWithUser[]>(['comments', postId], (old) => {
          if (!old) return old;
          return updateLikeInTree(old, commentId, !liked);
        });
        Alert.alert('Error', 'Failed to update like. Please try again.');
      }
    },
    [postId, queryClient],
  );

  const handleClose = useCallback(() => {
    setReplyTarget(null);
    setEditTarget(null);
    setInputText('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>Comments</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeBtn, { color: theme.secondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          {isLoading ? (
            <View style={styles.skeletonContainer}>
              {[0, 1, 2].map((i) => (
                <CommentSkeleton key={i} theme={theme} />
              ))}
            </View>
          ) : (
            <FlatList
              data={comments ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  currentUserId={user?.id ?? null}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onLike={handleLike}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.secondary }]}>
                    No comments yet. Be the first to start the discussion!
                  </Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Input */}
          <CommentInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSubmit}
            submitting={submitting}
            replyTarget={replyTarget}
            onCancelReply={handleCancelReply}
            inputRef={inputRef}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Recursively update like state in the comment tree for optimistic updates */
function updateLikeInTree(
  comments: CommentWithUser[],
  commentId: string,
  wasLiked: boolean,
): CommentWithUser[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return {
        ...c,
        likedByMe: !wasLiked,
        likeCount: wasLiked ? Math.max(0, c.likeCount - 1) : c.likeCount + 1,
      };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: updateLikeInTree(c.replies, commentId, wasLiked) };
    }
    return c;
  });
}

function CommentSkeleton({ theme }: { theme: any }) {
  return (
    <View style={[styles.skeletonItem, { borderBottomColor: theme.border }]}>
      <SkeletonLoader width={36} height={36} borderRadius={18} />
      <View style={styles.skeletonBody}>
        <SkeletonLoader width={120} height={13} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonLoader width="70%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  skeletonBody: {
    flex: 1,
  },
});
