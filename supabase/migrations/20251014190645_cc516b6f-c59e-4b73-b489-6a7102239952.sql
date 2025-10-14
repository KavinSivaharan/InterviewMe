-- Create storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- RLS policies for resume bucket
CREATE POLICY "Users can upload their own resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);