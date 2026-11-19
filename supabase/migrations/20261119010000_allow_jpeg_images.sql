-- Safari canvas'tan WebP üretemez (toBlob PNG'ye düşer). Panel bu durumda JPEG yükler.
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg']
where id = 'product-images';
