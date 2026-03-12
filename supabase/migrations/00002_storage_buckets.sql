-- ============================================
-- Storage 버킷 생성 (이미지 업로드/생성)
-- ============================================

-- 현장사진 업로드 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'source-images',
  'source-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- AI 생성 이미지 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage RLS 정책
-- ============================================

-- source-images: 인증된 사용자만 자기 폴더에 업로드/조회
CREATE POLICY "source_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'source-images');

CREATE POLICY "source_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'source-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "source_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'source-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- generated-images: 누구나 조회, 인증된 사용자가 자기 폴더에 업로드
CREATE POLICY "generated_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

CREATE POLICY "generated_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "generated_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
