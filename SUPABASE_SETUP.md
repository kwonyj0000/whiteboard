# Supabase Setup Guide

This guide explains how to set up Supabase backend for the Collaborative Whiteboard application.

## Prerequisites

- Supabase account (sign up at https://supabase.com)
- Basic understanding of SQL databases

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Enter project details:
   - Name: `whiteboard` (or any name you prefer)
   - Database Password: (set a strong password)
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the contents of `supabase-schema.sql` from this repository
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify that the tables are created by going to **Table Editor**

You should see three tables:
- `sessions`
- `strokes`
- `sticky_notes`

## Step 3: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure the Application

### Option A: Modify `config.js` directly (for testing)

Open `js/config.js` and replace the placeholder values:

```javascript
export const config = {
    supabase: {
        url: 'https://your-project-id.supabase.co',  // Your Project URL
        anonKey: 'your-anon-key-here'                 // Your anon public key
    },
    defaultSessionName: 'default',
    useLocalStorage: false
};
```

### Option B: Use environment variables (for production)

If you're using a bundler (Vite, Webpack, etc.):

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Make sure `.env` is in your `.gitignore` (NEVER commit API keys to Git!)

## Step 5: Enable Real-time

Real-time synchronization is already configured in the schema, but verify it's enabled:

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Find the tables: `strokes`, `sticky_notes`
3. Make sure replication is **enabled** for both tables

## Step 6: Test the Application

1. Open `index.html` in a browser
2. Check the browser console (F12) for logs:
   - You should see: `Initializing Supabase backend...`
   - Then: `Session ID: <uuid>`
   - Then: `Loaded X strokes, Y notes from Supabase`
3. Check the connection status badge in the top-right corner:
   - Green dot = Connected to Supabase
   - Red dot = Connection failed (check console for errors)

## Step 7: Test Real-time Collaboration

1. Open the whiteboard in **two different browser windows** (or tabs)
2. Draw a stroke in one window
3. The stroke should appear in the other window within 1-2 seconds
4. Try adding sticky notes, moving them, and deleting content
5. All changes should sync across both windows

## Fallback to localStorage

If Supabase is not configured or connection fails, the app automatically falls back to localStorage:

- Data is stored locally in your browser
- No real-time collaboration
- Data persists only on that device

To force localStorage mode, set in `config.js`:
```javascript
useLocalStorage: true
```

## Troubleshooting

### Connection Status shows "Disconnected"

- Check browser console for error messages
- Verify your API credentials are correct
- Make sure your Supabase project is active (not paused)
- Check if Row Level Security policies are configured correctly

### Real-time updates not working

- Go to **Database → Replication** and enable replication for tables
- Check browser console for subscription errors
- Make sure you're using `https://` (not `http://`) for the Supabase URL

### "QuotaExceededError" when saving

- Supabase free tier has limits:
  - 500 MB database storage
  - 2 GB bandwidth per month
- Delete old sessions or upgrade your plan

### CORS errors

- Supabase automatically allows all origins in development
- For production, configure allowed origins in **Authentication → URL Configuration**

## Security Notes

### Current Configuration (Development)

The schema includes **public policies** that allow anyone to read/write:

```sql
CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
```

This is fine for a **demo/prototype** but NOT recommended for production.

### Recommended for Production

1. **Enable authentication**:
   ```sql
   -- Only allow authenticated users
   CREATE POLICY "Authenticated users only" ON strokes 
   FOR ALL USING (auth.uid() IS NOT NULL);
   ```

2. **Add session ownership**:
   ```sql
   ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
   
   -- Users can only access their own sessions
   CREATE POLICY "Users access own sessions" ON sessions
   FOR ALL USING (user_id = auth.uid());
   ```

3. **Rate limiting**: Use Supabase Edge Functions or middleware to prevent abuse

## Cost Estimates (Supabase Free Tier)

- **Database**: 500 MB (should handle ~100k strokes)
- **Bandwidth**: 2 GB/month (real-time subscriptions count toward this)
- **Realtime**: 200 concurrent connections

Typical usage:
- Small team (2-5 users): Free tier is sufficient
- Medium team (10-20 users): May need Pro plan ($25/month)
- Large deployment: Consider caching or throttling

## Next Steps

- **Authentication**: Add Supabase Auth for user accounts
- **Multi-session UI**: Let users create/join named sessions
- **Export/Import**: Add functionality to export whiteboards as images
- **Performance**: Add indexes if you have many sessions/strokes
- **Backup**: Enable automated backups in Supabase dashboard

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: (your repo)
