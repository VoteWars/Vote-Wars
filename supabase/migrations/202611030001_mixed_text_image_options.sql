-- Allow each topic option to contain exactly one of text or a public image URL.
ALTER TABLE public.options ALTER COLUMN text DROP NOT NULL;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.options DROP CONSTRAINT IF EXISTS options_exactly_one_content;
ALTER TABLE public.options ADD CONSTRAINT options_exactly_one_content CHECK (
  (text IS NOT NULL AND image_url IS NULL) OR
  (text IS NULL AND image_url IS NOT NULL)
);

-- Option uploads are performed by the server with the service role; public access is read-only.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'topic-option-images',
  'topic-option-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
