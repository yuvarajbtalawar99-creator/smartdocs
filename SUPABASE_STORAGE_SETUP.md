# Supabase Storage Setup Guide

## Step 1: Create Storage Buckets

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**

### Create "documents" bucket:
- **Name:** `documents`
- **Public bucket:** ✅ Yes (or No if you want private)
- **File size limit:** 10 MB (or your preference)
- **Allowed MIME types:** Leave empty or add: `application/pdf,image/png,image/jpeg,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Create "bills" bucket:
- **Name:** `bills`
- **Public bucket:** ✅ Yes (or No if you want private)
- **File size limit:** 10 MB
- **Allowed MIME types:** Leave empty or add: `application/pdf,image/png,image/jpeg,image/jpg`

## Step 2: Set Up Storage Policies

For each bucket, you need to set up Row Level Security (RLS) policies. There are two ways to do this:

### Option A: Using SQL Editor (Recommended - Easier)

1. Go to **SQL Editor** in Supabase
2. Run this SQL for the "documents" bucket:

```sql
-- Storage policies for documents bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

3. Run this SQL for the "bills" bucket:

```sql
-- Storage policies for bills bucket
CREATE POLICY "Authenticated users can upload bills"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bills');

CREATE POLICY "Authenticated users can read bills"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'bills');

CREATE POLICY "Authenticated users can delete bills"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bills');
```

### Option B: Using Storage UI (Alternative)

1. Go to **Storage** > **Policies** > **documents**
2. Click **New Policy**
3. For each operation (INSERT, SELECT, DELETE), create a policy:
   - **Policy name:** e.g., "Users can upload documents"
   - **Allowed operation:** INSERT (or SELECT, DELETE)
   - **Policy definition:** Use the SQL from Option A above

**Important Notes:**
- If you get "policy already exists" errors, you can drop existing policies first:
```sql
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
```
- For public buckets, you might also want to allow public access (optional):
```sql
CREATE POLICY "Public can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

## Step 3: Create Database Tables

Go to **SQL Editor** in Supabase and run:

```sql
-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bill_type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for bills
CREATE POLICY "Users can view their own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);
```

## Step 4: View Files in Supabase

After implementing the code changes:
1. Go to **Storage** > **documents** or **bills**
2. You'll see folders organized by user ID
3. Click on a folder to see the uploaded files
4. You can download, preview, or delete files directly from the dashboard

## Step 5: View Database Records

1. Go to **Table Editor** in Supabase
2. You'll see the `documents` and `bills` tables
3. All metadata (name, type, dates, etc.) will be stored here
4. Files themselves are in Storage, metadata is in the database

## Troubleshooting: Files Not Showing in Supabase

If files are not appearing in Supabase after upload, check these:

### 1. Check Browser Console (F12)
- Open Developer Tools (F12)
- Go to **Console** tab
- Look for error messages when uploading
- Common errors will show what's wrong

### 2. Verify Bucket Exists
- Go to **Storage** in Supabase Dashboard
- Make sure you see a bucket named exactly `documents` (case-sensitive)
- If missing, create it following Step 1

### 3. Check Storage Policies
- Go to **Storage** > **Policies** > **documents**
- You should see 3 policies (INSERT, SELECT, DELETE)
- If missing, run the SQL from Step 2

### 4. Verify User Authentication
- Make sure you're logged in to your app
- Check that `supabase.auth.getUser()` returns a user
- Storage policies require authenticated users

### 5. Test Storage Access
Run this in your browser console (F12) while logged in:
```javascript
// Check if you can list buckets
const { data, error } = await supabase.storage.listBuckets();
console.log("Buckets:", data);
console.log("Error:", error);

// Check if you can list files in documents bucket
const { data: files, error: filesError } = await supabase.storage
  .from('documents')
  .list();
console.log("Files:", files);
console.log("Error:", filesError);
```

### 6. Common Issues

**Issue: "new row violates row-level security policy"**
- **Solution:** Storage policies are not set up correctly. Run the SQL from Step 2.

**Issue: "Bucket not found"**
- **Solution:** Create the bucket in Storage > Create bucket

**Issue: "Invalid API key"**
- **Solution:** Check your `.env` file has the correct `VITE_SUPABASE_PUBLISHABLE_KEY`

**Issue: Files upload but don't appear in dashboard**
- **Solution:** Check if bucket is public. If private, you need proper policies. Also refresh the Storage page.

**Issue: "Permission denied"**
- **Solution:** Storage policies are missing or incorrect. Re-run the SQL policies.

### 7. Quick Test Upload

Test if storage works by running this in browser console:
```javascript
const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('documents')
  .upload('test/test.txt', testFile);
console.log("Upload result:", data);
console.log("Error:", error);
```

If this fails, the issue is with storage setup, not your code.
