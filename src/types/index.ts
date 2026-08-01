export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  repost_of_id: string | null;
  created_at: string;
  author?: Profile;
  repost_of?: Post | null;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
  requester?: Profile;
  addressee?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  shared_post_id: string | null;
  read_at: string | null;
  created_at: string;
  shared_post?: Post | null;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'like'
  | 'comment'
  | 'share'
  | 'message';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  message_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post | null;
}
