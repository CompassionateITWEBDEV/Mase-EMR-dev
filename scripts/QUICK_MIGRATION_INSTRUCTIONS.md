# Quick Migration Instructions

## ⚡ Fastest Way to Run the Migration

### Option 1: Use the Migration Page (Recommended)

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open in browser**:
   ```
   http://localhost:3000/research/migrate
   ```

3. **Click "Copy SQL to Clipboard"**

4. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in left sidebar
   - Click "New Query"
   - Paste the SQL (Ctrl+V)
   - Click "Run" button

5. **Done!** Refresh the Research Dashboard page

---

### Option 2: Direct Copy-Paste

1. **Open the SQL file**:
   ```
   scripts/create_research_studies_tables.sql
   ```

2. **Copy the entire contents** (Ctrl+A, Ctrl+C)

3. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor"
   - Click "New Query"
   - Paste (Ctrl+V)
   - Click "Run"

---

## ✅ Verification

After running, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('research_studies', 'research_study_participants');
```

You should see both tables listed.

---

## 🎯 That's It!

Once the migration is complete, go back to `/research-dashboard` and the error will be gone!

