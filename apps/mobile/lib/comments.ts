import api from './api';

export interface CommentWithUser {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  user: {
    id: string;
    name: string | null;
    specialization: string | null;
    avatarUrl: string | null;
  };
  replies: CommentWithUser[];
}

export async function fetchComments(postId: string): Promise<CommentWithUser[]> {
  const res = await api.get<CommentWithUser[]>(`/posts/${postId}/comments`);
  return res.data;
}

export async function createComment(
  postId: string,
  body: string,
  parentId?: string,
): Promise<CommentWithUser> {
  const res = await api.post<CommentWithUser>(`/posts/${postId}/comments`, {
    body,
    ...(parentId ? { parentId } : {}),
  });
  return res.data;
}

export async function updateComment(
  postId: string,
  commentId: string,
  body: string,
): Promise<CommentWithUser> {
  const res = await api.patch<CommentWithUser>(`/posts/${postId}/comments/${commentId}`, { body });
  return res.data;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function likeComment(
  postId: string,
  commentId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await api.post<{ liked: boolean; likeCount: number }>(
    `/posts/${postId}/comments/${commentId}/like`,
  );
  return res.data;
}

export async function unlikeComment(
  postId: string,
  commentId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await api.delete<{ liked: boolean; likeCount: number }>(
    `/posts/${postId}/comments/${commentId}/like`,
  );
  return res.data;
}
