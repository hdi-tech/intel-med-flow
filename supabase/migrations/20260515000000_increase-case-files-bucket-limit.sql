
-- Increase case-files bucket size limit to 1 GB (1073741824 bytes)
UPDATE storage.buckets
SET file_size_limit = 1073741824
WHERE id = 'case-files';
