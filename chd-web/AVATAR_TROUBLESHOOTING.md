# Avatar Upload Troubleshooting Guide

## Issue: Profile picture uploaded but not visible

### Quick Fixes to Try:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for these log messages after uploading:
     - "Uploading avatar to path: ..."
     - "Generated public URL: ..."
     - "Avatar URL in session: ..."
   - If you see errors, note them down

2. **Verify Supabase Bucket Setup**
   - Go to your Supabase Dashboard → Storage
   - Check if `avatars` bucket exists
   - Click on the bucket settings (gear icon)
   - Ensure "Public bucket" is **enabled** (toggle should be ON)
   - If not public, run the SQL script: `SUPABASE_AVATAR_SETUP.sql`

3. **Check Image URL**
   - After upload, check the Network tab in DevTools
   - Look for the image request to your Supabase URL
   - Status should be 200 (not 403 or 404)
   - If 403: Bucket is not public or RLS policies are wrong
   - If 404: File wasn't uploaded or path is incorrect

4. **Run the SQL Setup Script**
   ```bash
   # In Supabase Dashboard:
   # 1. Go to SQL Editor
   # 2. Paste contents of SUPABASE_AVATAR_SETUP.sql
   # 3. Click "Run"
   ```

5. **Test Image URL Directly**
   - Copy the avatar URL from console logs
   - Paste it in a new browser tab
   - If you see the image → App issue (cache/state)
   - If you get error → Bucket/permissions issue

### Common Issues:

#### Issue 1: 403 Forbidden
**Problem**: Avatars bucket is not public
**Solution**: 
```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';
```

#### Issue 2: Image doesn't update after upload
**Problem**: Browser caching or state not refreshing
**Solution**: 
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Clear browser cache
- Check if `setAvatarUrl(publicUrl)` is being called in console logs

#### Issue 3: Upload succeeds but URL is wrong
**Problem**: Supabase URL configuration
**Solution**: 
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
- Restart dev server after changing env vars

#### Issue 4: CORS errors
**Problem**: Supabase CORS not configured
**Solution**: 
- In Supabase Dashboard → Settings → API
- Add your domain to allowed origins

### Debug Checklist:

- [ ] Supabase URL and Anon Key are set in `.env.local`
- [ ] Avatars bucket exists in Supabase Storage
- [ ] Avatars bucket is marked as PUBLIC
- [ ] RLS policies are set (run SQL script)
- [ ] Browser console shows no errors during upload
- [ ] Image URL is accessible in new browser tab
- [ ] User session is authenticated
- [ ] File size is under 5MB

### Still Not Working?

Check these in DevTools Console after upload:

```javascript
// After uploading, check:
console.log('Avatar URL:', avatarUrl);
console.log('User metadata:', user?.user_metadata);

// Should show something like:
// "https://your-project.supabase.co/storage/v1/object/public/avatars/user-id/timestamp_filename.jpg"
```

### Quick Test:

1. Upload a very small image (< 100KB)
2. Open DevTools Console
3. Upload the image
4. Look for the "Generated public URL" log
5. Copy that URL and open in new tab
6. If image loads there but not in profile → frontend caching issue
7. If image doesn't load in new tab → Supabase bucket issue

---

**Need More Help?**
Share the:
1. Console error messages
2. Network tab response for the image request
3. Screenshot of Supabase Storage → avatars bucket settings
