-- =====================
-- 헬퍼 함수
-- =====================

-- 현재 사용자가 관리자인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE email = auth.email() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 현재 사용자가 의뢰인인지 확인하고 client_id 반환
CREATE OR REPLACE FUNCTION get_client_id()
RETURNS text AS $$
  SELECT client_id FROM users WHERE email = auth.email() AND role = 'client';
$$ LANGUAGE sql SECURITY DEFINER;

-- 현재 사용자의 participant id 반환
CREATE OR REPLACE FUNCTION get_participant_id()
RETURNS integer AS $$
  SELECT id FROM participants WHERE email = auth.email();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================
-- participants
-- =====================
DROP POLICY IF EXISTS "participants_admin" ON participants;
DROP POLICY IF EXISTS "participants_self" ON participants;

CREATE POLICY "participants_admin" ON participants
FOR ALL USING (is_admin());

CREATE POLICY "participants_self" ON participants
FOR ALL USING (email = auth.email());

-- =====================
-- users
-- =====================
DROP POLICY IF EXISTS "users_admin" ON users;
DROP POLICY IF EXISTS "users_self" ON users;
DROP POLICY IF EXISTS "users_admin_readable" ON users;

CREATE POLICY "users_admin" ON users
FOR ALL USING (is_admin());

CREATE POLICY "users_self" ON users
FOR ALL USING (email = auth.email());

-- 체험단이 admin 목록 조회 가능
CREATE POLICY "users_admin_readable" ON users
FOR SELECT USING (role = 'admin');

-- =====================
-- projects
-- =====================
DROP POLICY IF EXISTS "projects_admin" ON projects;
DROP POLICY IF EXISTS "projects_client" ON projects;
DROP POLICY IF EXISTS "projects_participant_read" ON projects;

CREATE POLICY "projects_admin" ON projects
FOR ALL USING (is_admin());

CREATE POLICY "projects_client" ON projects
FOR SELECT USING (client_id = get_client_id());

CREATE POLICY "projects_participant_read" ON projects
FOR SELECT USING (true);

-- =====================
-- posts
-- =====================
DROP POLICY IF EXISTS "posts_admin" ON posts;
DROP POLICY IF EXISTS "posts_self" ON posts;
DROP POLICY IF EXISTS "posts_read" ON posts;

CREATE POLICY "posts_admin" ON posts
FOR ALL USING (is_admin());

CREATE POLICY "posts_self" ON posts
FOR ALL USING (member_id = get_participant_id());

CREATE POLICY "posts_read" ON posts
FOR SELECT USING (get_client_id() IS NOT NULL);

-- =====================
-- settlements
-- =====================
DROP POLICY IF EXISTS "settlements_admin" ON settlements;
DROP POLICY IF EXISTS "settlements_self" ON settlements;

CREATE POLICY "settlements_admin" ON settlements
FOR ALL USING (is_admin());

CREATE POLICY "settlements_self" ON settlements
FOR ALL USING (member_id = get_participant_id());

-- =====================
-- point_history
-- =====================
DROP POLICY IF EXISTS "point_history_admin" ON point_history;
DROP POLICY IF EXISTS "point_history_self" ON point_history;

CREATE POLICY "point_history_admin" ON point_history
FOR ALL USING (is_admin());

CREATE POLICY "point_history_self" ON point_history
FOR ALL USING (member_id = get_participant_id());

-- =====================
-- notifications
-- =====================
DROP POLICY IF EXISTS "notifications_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_self" ON notifications;

CREATE POLICY "notifications_admin" ON notifications
FOR ALL USING (is_admin());

CREATE POLICY "notifications_self" ON notifications
FOR ALL USING (user_id = CAST(get_participant_id() AS text) OR user_id IN (SELECT CAST(id AS text) FROM users WHERE email = auth.email()));

-- =====================
-- project_participants
-- =====================
DROP POLICY IF EXISTS "project_participants_admin" ON project_participants;
DROP POLICY IF EXISTS "project_participants_self" ON project_participants;
DROP POLICY IF EXISTS "project_participants_client_read" ON project_participants;

CREATE POLICY "project_participants_admin" ON project_participants
FOR ALL USING (is_admin());

CREATE POLICY "project_participants_self" ON project_participants
FOR ALL USING (member_id = get_participant_id());

CREATE POLICY "project_participants_client_read" ON project_participants
FOR SELECT USING (get_client_id() IS NOT NULL);

-- =====================
-- cover_requests
-- =====================
DROP POLICY IF EXISTS "cover_requests_admin" ON cover_requests;
DROP POLICY IF EXISTS "cover_requests_self" ON cover_requests;
DROP POLICY IF EXISTS "cover_requests_client_read" ON cover_requests;

CREATE POLICY "cover_requests_admin" ON cover_requests
FOR ALL USING (is_admin());

CREATE POLICY "cover_requests_self" ON cover_requests
FOR ALL USING (participant_id = get_participant_id());

CREATE POLICY "cover_requests_client_read" ON cover_requests
FOR SELECT USING (get_client_id() IS NOT NULL);

-- =====================
-- client_requests
-- =====================
DROP POLICY IF EXISTS "client_requests_admin" ON client_requests;
DROP POLICY IF EXISTS "client_requests_client" ON client_requests;
DROP POLICY IF EXISTS "client_requests_participant" ON client_requests;

CREATE POLICY "client_requests_admin" ON client_requests
FOR ALL USING (is_admin());

CREATE POLICY "client_requests_client" ON client_requests
FOR ALL USING (client_id = get_client_id());

CREATE POLICY "client_requests_participant" ON client_requests
FOR ALL USING (member_id = get_participant_id());

-- =====================
-- sns_change_requests
-- =====================
DROP POLICY IF EXISTS "sns_change_requests_admin" ON sns_change_requests;
DROP POLICY IF EXISTS "sns_change_requests_self" ON sns_change_requests;

CREATE POLICY "sns_change_requests_admin" ON sns_change_requests
FOR ALL USING (is_admin());

CREATE POLICY "sns_change_requests_self" ON sns_change_requests
FOR ALL USING (member_id = get_participant_id());

-- =====================
-- comment_missions
-- =====================
DROP POLICY IF EXISTS "comment_missions_admin" ON comment_missions;
DROP POLICY IF EXISTS "comment_missions_self" ON comment_missions;
DROP POLICY IF EXISTS "comment_missions_client_read" ON comment_missions;

CREATE POLICY "comment_missions_admin" ON comment_missions
FOR ALL USING (is_admin());

CREATE POLICY "comment_missions_self" ON comment_missions
FOR ALL USING (member_id = get_participant_id());

CREATE POLICY "comment_missions_client_read" ON comment_missions
FOR SELECT USING (get_client_id() IS NOT NULL);

-- =====================
-- artists
-- =====================
DROP POLICY IF EXISTS "artists_admin" ON artists;
DROP POLICY IF EXISTS "artists_client" ON artists;

CREATE POLICY "artists_admin" ON artists
FOR ALL USING (is_admin());

CREATE POLICY "artists_client" ON artists
FOR ALL USING (client_id = get_client_id());

-- =====================
-- project_applications
-- =====================
DROP POLICY IF EXISTS "project_applications_admin" ON project_applications;
DROP POLICY IF EXISTS "project_applications_client" ON project_applications;

CREATE POLICY "project_applications_admin" ON project_applications
FOR ALL USING (is_admin());

CREATE POLICY "project_applications_client" ON project_applications
FOR ALL USING (client_id = get_client_id());

-- =====================
-- 공개 읽기 테이블 (로그인만 하면 조회 가능)
-- =====================

-- project_links
DROP POLICY IF EXISTS "project_links_admin" ON project_links;
DROP POLICY IF EXISTS "project_links_read" ON project_links;

CREATE POLICY "project_links_admin" ON project_links
FOR ALL USING (is_admin());

CREATE POLICY "project_links_read" ON project_links
FOR SELECT USING (auth.role() = 'authenticated');

-- project_videos
DROP POLICY IF EXISTS "project_videos_admin" ON project_videos;
DROP POLICY IF EXISTS "project_videos_read" ON project_videos;

CREATE POLICY "project_videos_admin" ON project_videos
FOR ALL USING (is_admin());

CREATE POLICY "project_videos_read" ON project_videos
FOR SELECT USING (auth.role() = 'authenticated');

-- unlock_videos
DROP POLICY IF EXISTS "unlock_videos_admin" ON unlock_videos;
DROP POLICY IF EXISTS "unlock_videos_read" ON unlock_videos;

CREATE POLICY "unlock_videos_admin" ON unlock_videos
FOR ALL USING (is_admin());

CREATE POLICY "unlock_videos_read" ON unlock_videos
FOR SELECT USING (auth.role() = 'authenticated');

-- products
DROP POLICY IF EXISTS "products_admin" ON products;
DROP POLICY IF EXISTS "products_read" ON products;

CREATE POLICY "products_admin" ON products
FOR ALL USING (is_admin());

CREATE POLICY "products_read" ON products
FOR SELECT USING (auth.role() = 'authenticated');

-- post_stats_history
DROP POLICY IF EXISTS "post_stats_history_admin" ON post_stats_history;
DROP POLICY IF EXISTS "post_stats_history_read" ON post_stats_history;

CREATE POLICY "post_stats_history_admin" ON post_stats_history
FOR ALL USING (is_admin());

CREATE POLICY "post_stats_history_read" ON post_stats_history
FOR SELECT USING (auth.role() = 'authenticated');

-- push_tokens
DROP POLICY IF EXISTS "push_tokens_admin" ON push_tokens;
DROP POLICY IF EXISTS "push_tokens_self" ON push_tokens;

CREATE POLICY "push_tokens_admin" ON push_tokens
FOR ALL USING (is_admin());

CREATE POLICY "push_tokens_self" ON push_tokens
FOR ALL USING (user_id = CAST(get_participant_id() AS text) OR user_id IN (SELECT CAST(id AS text) FROM users WHERE email = auth.email()));

-- app_settings
DROP POLICY IF EXISTS "app_settings_read" ON app_settings;

CREATE POLICY "app_settings_read" ON app_settings
FOR SELECT USING (true);

