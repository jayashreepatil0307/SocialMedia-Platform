import { supabase } from '@/lib/supabase';
import type { Profile, Post, Comment, Friendship, Message, Notification } from '@/types';

// ===================== PROFILES =====================

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
}

// ===================== POSTS =====================

export async function getFeedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*), repost_of:posts!posts_repost_of_id_fkey(*, author:profiles!posts_author_id_fkey(*))')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function searchPosts(query: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .or(`content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function searchHashtags(tag: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .ilike('content', `%#${tag}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function createPost(content: string, imageUrl: string | null, repostOfId: string | null = null): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ content, image_url: imageUrl, repost_of_id: repostOfId })
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .maybeSingle();
  if (error) throw error;
  return data as Post | null;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ===================== COMMENTS =====================

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function addComment(postId: string, content: string): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content })
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .maybeSingle();
  if (error) throw error;
  return data as Comment | null;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

// ===================== LIKES =====================

export async function getLikesForPost(postId: string): Promise<{ count: number; liked: boolean }> {
  const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  return { count: count ?? 0, liked: false };
}

export async function toggleLike(postId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId });
  }
}

export async function getLikedPostIds(postIds: string[], userId: string): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds)
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data ?? []).map((l) => l.post_id));
}

export async function getLikeCounts(postIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (postIds.length === 0) return map;
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds);
  if (error) return map;
  for (const row of data ?? []) {
    map.set(row.post_id, (map.get(row.post_id) ?? 0) + 1);
  }
  return map;
}

export async function getCommentCounts(postIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (postIds.length === 0) return map;
  const { data, error } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);
  if (error) return map;
  for (const row of data ?? []) {
    map.set(row.post_id, (map.get(row.post_id) ?? 0) + 1);
  }
  return map;
}

// ===================== FRIENDSHIPS =====================

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' });
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: addresseeId,
    actor_id: requesterId,
    type: 'friend_request',
  });
}

export async function cancelFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .eq('status', 'pending');
  if (error) throw error;
}

export async function acceptFriendRequest(friendshipId: string, addresseeId: string, requesterId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: requesterId,
    actor_id: addresseeId,
    type: 'friend_accept',
  });
}

export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) throw error;
}

export async function getIncomingRequests(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Friendship[];
}

export async function getOutgoingRequests(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, addressee:profiles!friendships_addressee_id_fkey(*)')
    .eq('requester_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Friendship[];
}

export async function getFriends(userId: string): Promise<Profile[]> {
  const { data: accepted } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!accepted) return [];

  const friendIds = accepted.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );
  const uniqueIds = [...new Set(friendIds)].filter((id) => id !== userId);
  if (uniqueIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds);
  return (profiles ?? []) as Profile[];
}

export async function getFriendshipStatus(myId: string, otherId: string): Promise<{ status: string | null; friendship: Friendship | null }> {
  const { data } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${myId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${myId})`)
    .maybeSingle();
  if (!data) return { status: null, friendship: null };
  return { status: data.status, friendship: data as Friendship };
}

export async function getMutualFriends(myId: string, otherId: string): Promise<Profile[]> {
  const myFriends = await getFriends(myId);
  const theirFriends = await getFriends(otherId);
  const theirIds = new Set(theirFriends.map((f) => f.id));
  return myFriends.filter((f) => theirIds.has(f.id));
}

// ===================== MESSAGES =====================

export async function getConversations(userId: string): Promise<{ partner: Profile; lastMessage: Message | null }[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const messages = (data ?? []) as unknown as (Message & { sender: Profile; receiver: Profile })[];
  const convMap = new Map<string, { partner: Profile; lastMessage: Message }>();

  for (const msg of messages) {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, { partner, lastMessage: msg });
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  );
}

export async function getMessages(myId: string, partnerId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, shared_post:posts!messages_shared_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))')
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${myId})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(senderId: string, receiverId: string, content: string, imageUrl: string | null = null, sharedPostId: string | null = null): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content, image_url: imageUrl, shared_post_id: sharedPostId })
    .select('*')
    .maybeSingle();
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: receiverId,
    actor_id: senderId,
    type: 'message',
    message_id: data?.id,
  });

  return data as Message | null;
}

export async function markMessagesRead(myId: string, partnerId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', partnerId)
    .eq('receiver_id', myId)
    .is('read_at', null);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .is('read_at', null);
  if (error) return 0;
  return count ?? 0;
}

// ===================== NOTIFICATIONS =====================

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(*), post:posts!notifications_post_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) return 0;
  return count ?? 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function createNotification(notif: { user_id: string; actor_id: string; type: string; post_id?: string | null }): Promise<void> {
  await supabase.from('notifications').insert(notif);
}
