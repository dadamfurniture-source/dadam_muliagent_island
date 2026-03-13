-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'schedule_reminder',   -- 일정 알림
    'project_status',      -- 프로젝트 상태 변경
    'payment',             -- 결제 관련
    'quote_ready',         -- 견적 완료
    'image_ready',         -- 이미지 생성 완료
    'system'               -- 시스템 알림
  )),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,               -- 클릭 시 이동할 경로
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_owner ON notifications(owner_id, is_read, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE USING (auth.uid() = owner_id);

-- 서버에서 알림 생성 (service role 사용)
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);
