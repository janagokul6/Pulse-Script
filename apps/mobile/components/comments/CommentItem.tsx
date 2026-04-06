import Colors from '@/constants/Colors';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommentWithUser } from '../../lib/comments';
import { useColorScheme } from '../useColorScheme';

interface CommentItemProps {
  comment: CommentWithUser;
  currentUserId: string | null;
  onReply: (comment: CommentWithUser) => void;
  onEdit: (comment: CommentWithUser) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string, liked: boolean) => void;
  depth?: number;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  depth = 0,
}: CommentItemProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const isAuthor = currentUserId !== null && comment.userId === currentUserId;
  const initials = comment.user.name ? comment.user.name[0].toUpperCase() : '?';

  return (
    <View style={depth > 0 ? { marginLeft: 16 } : undefined}>
      <View style={[styles.container, { borderBottomColor: theme.border }]}>
        {/* Avatar */}
        {comment.user.avatarUrl ? (
          <Image source={{ uri: comment.user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.tint + '1a' }]}>
            <Text style={[styles.avatarInitials, { color: theme.tint }]}>{initials}</Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Author row */}
          <View style={styles.authorRow}>
            <Text style={[styles.authorName, { color: theme.text }]}>{comment.user.name ?? 'Unknown'}</Text>
            {comment.user.specialization && (
              <Text style={[styles.specialization, { color: theme.secondary }]}>
                {' · '}{comment.user.specialization}
              </Text>
            )}
            <Text style={[styles.timestamp, { color: theme.secondary }]}>
              {' · '}{formatTimeAgo(comment.createdAt)}
            </Text>
          </View>

          {/* Comment body */}
          <Text style={[styles.commentBody, { color: theme.text }]}>{comment.body}</Text>

          {/* Actions row */}
          <View style={styles.actionsRow}>
            {/* Like button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onLike(comment.id, comment.likedByMe)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.likeIcon, comment.likedByMe && { color: '#e53e3e' }]}>
                {comment.likedByMe ? '♥' : '♡'}
              </Text>
              {comment.likeCount > 0 && (
                <Text style={[styles.actionText, { color: comment.likedByMe ? '#e53e3e' : theme.secondary }]}>
                  {comment.likeCount}
                </Text>
              )}
            </TouchableOpacity>

            {/* Reply — always shown for authenticated users (parent decides if currentUserId is set) */}
            {currentUserId !== null && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onReply(comment)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.actionText, { color: theme.secondary }]}>Reply</Text>
              </TouchableOpacity>
            )}

            {/* Edit / Delete — only for comment author */}
            {isAuthor && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onEdit(comment)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.actionText, { color: theme.secondary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onDelete(comment.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.actionText, { color: '#e53e3e' }]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Replies — rendered recursively with indentation */}
      {comment.replies.length > 0 &&
        comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onLike={onLike}
            depth={depth + 1}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  specialization: {
    fontSize: 12,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIcon: {
    fontSize: 16,
    color: '#9ca3af',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
