/*
# MitraSetu Social Media Schema

## Overview
Creates the full database schema for the MitraSetu social media platform, including user profiles, posts, comments, likes, friendships (friend requests), direct messages, and notifications.

## New Tables

1. `profiles`
   - Extends Supabase auth.users with social profile data.
   - `id` (uuid, PK, references auth.users)
   - `username` (text, unique) — handle for the user
   - `full_name` (text) — display name
   - `avatar_url` (text) — profile photo URL
   - `cover_url` (text) — cover photo URL
   - `bio` (text) — short bio
   - `location` (text)
   - `created_at` (timestamptz)

2. `posts`
   - `id` (uuid, PK)
   - `author_id` (uuid, references profiles, defaults to auth.uid())
   - `content` (text) — post text
   - `image_url` (text) — optional attached image
   - `repost_of_id` (uuid, nullable, references posts) — for reposts
   - `created_at` (timestamptz)

3. `comments`
   - `id` (uuid, PK)
   - `post_id` (uuid, references posts, cascade delete)
   - `author_id` (uuid, defaults to auth.uid())
   - `content` (text)
   - `created_at` (timestamptz)

4. `likes`
   - `id` (uuid, PK)
   - `post_id` (uuid, references posts, cascade delete)
   - `user_id` (uuid, defaults to auth.uid())
   - `created_at` (timestamptz)
   - Unique constraint on (post_id, user_id) to prevent duplicate likes

5. `friendships`
   - Models friend requests and accepted friendships.
   - `id` (uuid, PK)
   - `requester_id` (uuid, defaults to auth.uid())
   - `addressee_id` (uuid, references profiles)
   - `status` (text: 'pending' | 'accepted' | 'rejected', default 'pending')
   - `created_at` (timestamptz)
   - `responded_at` (timestamptz, nullable)
   - Unique constraint on (requester_id, addressee_id)

6. `messages`
   - Direct messages between two users.
   - `id` (uuid, PK)
   - `sender_id` (uuid, defaults to auth.uid())
   - `receiver_id` (uuid, references profiles)
   - `content` (text) — text body
   - `image_url` (text, nullable) — shared image
   - `shared_post_id` (uuid, nullable, references posts) — post shared into chat
   - `read_at` (timestamptz, nullable) — when receiver read it
   - `created_at` (timestamptz)

7. `notifications`
   - `id` (uuid, PK)
   - `user_id` (uuid) — the recipient of the notification
   - `actor_id` (uuid) — who triggered it
   - `type` (text: 'friend_request' | 'friend_accept' | 'like' | 'comment' | 'share' | 'message')
   - `post_id` (uuid, nullable)
   - `message_id` (uuid, nullable)
   - `read` (boolean, default false)
   - `created_at` (timestamptz)

## Security (RLS)
- All tables have RLS enabled.
- profiles: all authenticated users can SELECT (social network); only owner can UPDATE.
- posts: all authenticated can SELECT; only author can INSERT/UPDATE/DELETE.
- comments: all authenticated can SELECT; only author can INSERT; author or post owner can DELETE.
- likes: all authenticated can SELECT; only owner can INSERT/DELETE.
- friendships: only involved parties can SELECT; requester can INSERT; addressee can UPDATE status; requester can DELETE pending requests.
- messages: only sender or receiver can SELECT; only sender can INSERT; sender or receiver can DELETE.
- notifications: only the recipient can SELECT/UPDATE(read)/DELETE; any authenticated user can INSERT (notifications are created by other users' actions).

## Trigger
- `handle_new_user`: automatically creates a profile row when a new auth.users row is inserted.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  cover_url text,
  bio text DEFAULT '',
  location text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  image_url text,
  repost_of_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all"
ON posts FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"
ON posts FOR INSERT
TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"
ON posts FOR UPDATE
TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"
ON posts FOR DELETE
TO authenticated USING (auth.uid() = author_id);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all"
ON comments FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
ON comments FOR INSERT
TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "comments_delete_own_or_owner" ON comments;
CREATE POLICY "comments_delete_own_or_owner"
ON comments FOR DELETE
TO authenticated USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.author_id = auth.uid())
);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all"
ON likes FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own"
ON likes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own"
ON likes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select_involved" ON friendships;
CREATE POLICY "friendships_select_involved"
ON friendships FOR SELECT
TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_insert_requester" ON friendships;
CREATE POLICY "friendships_insert_requester"
ON friendships FOR INSERT
TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "friendships_update_addressee" ON friendships;
CREATE POLICY "friendships_update_addressee"
ON friendships FOR UPDATE
TO authenticated
USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "friendships_delete_involved" ON friendships;
CREATE POLICY "friendships_delete_involved"
ON friendships FOR DELETE
TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  image_url text,
  shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_party" ON messages;
CREATE POLICY "messages_select_party"
ON messages FOR SELECT
TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_sender" ON messages;
CREATE POLICY "messages_insert_sender"
ON messages FOR INSERT
TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_delete_party" ON messages;
CREATE POLICY "messages_delete_party"
ON messages FOR DELETE
TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('friend_request', 'friend_accept', 'like', 'comment', 'share', 'message')),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
CREATE POLICY "notifications_insert_any"
ON notifications FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own"
ON notifications FOR DELETE
TO authenticated USING (auth.uid() = user_id);
