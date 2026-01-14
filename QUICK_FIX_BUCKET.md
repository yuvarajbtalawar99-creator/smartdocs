# Quick Fix: Create Storage Bucket

## The Error
```
StorageApiError: Bucket not found
```

This means the `documents` bucket doesn't exist in your Supabase project.

## Solution: Create the Bucket

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: `vcyjadheitlvzwhjrqcm`

### Step 2: Navigate to Storage
1. Click **Storage** in the left sidebar
2. You should see an empty list or existing buckets

### Step 3: Create "documents" Bucket
1. Click the **"New bucket"** or **"Create bucket"** button (usually top right)
2. Fill in the form:
   - **Name:** `documents` (exactly this, case-sensitive)
   - **Public bucket:** ✅ **Yes** (check this box - makes files accessible)
   - **File size limit:** `10` MB (or leave default)
   - **Allowed MIME types:** Leave empty (or add: `application/pdf,image/png,image/jpeg,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
3. Click **Create bucket** or **Save**

### Step 4: Verify Bucket Created
- You should now see `documents` in your bucket list
- It should show as **PUBLIC** (if you checked that option)

### Step 5: Set Up Storage Policies (Required!)

After creating the bucket, you MUST set up policies or uploads will fail.

**Option A: Using SQL Editor (Easiest)**
1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Paste and run this SQL:

```sql
-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

4. Click **Run** or press `Ctrl+Enter`

**Option B: Using Storage UI**
1. Go to **Storage** > **Policies** > **documents**
2. Click **New Policy** for each:
   - INSERT policy
   - SELECT policy  
   - DELETE policy
3. Use the SQL from Option A above

### Step 6: Test Upload Again
1. Go back to your app
2. Try uploading a document
3. Check browser console (F12) - should see success messages
4. Check Supabase Storage → documents bucket - file should appear!

## Also Create "bills" Bucket (For Bills Feature)

Repeat the same steps but name it `bills` instead of `documents`.

## Troubleshooting

**If bucket creation fails:**
- Make sure you're in the correct project
- Check you have proper permissions
- Try refreshing the page

**If upload still fails after creating bucket:**
- Make sure policies are set up (Step 5)
- Check browser console for new error messages
- Verify bucket name is exactly `documents` (case-sensitive)

**If you see "Permission denied" error:**
- Storage policies are missing or incorrect
- Re-run the SQL from Step 5
