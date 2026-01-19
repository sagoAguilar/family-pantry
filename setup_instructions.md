# FamilyPantry - Detailed Setup Guide

This guide walks you through setting up FamilyPantry from scratch.

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18 or higher ([Download](https://nodejs.org/))
- ✅ Git ([Download](https://git-scm.com/))
- ✅ A code editor (VS Code recommended)
- ✅ A smartphone for testing (iOS or Android)

## Step 1: Install Expo CLI

```bash
npm install -g expo-cli
```

Verify installation:
```bash
expo --version
```

## Step 2: Create Supabase Project

### 2.1 Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 2.2 Create New Project

1. Click "New Project"
2. Fill in details:
   - **Name**: `family-pantry`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### 2.3 Get API Credentials

1. Go to Project Settings (gear icon)
2. Click "API" in sidebar
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJ...` (long string)

**Save these somewhere safe!** You'll need them soon.

### 2.4 Set Up Database Schema

1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Copy the entire contents from the artifact "Supabase Database Schema"
4. Paste into SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

Verify tables were created:
1. Click "Database" → "Tables"
2. You should see 7 tables: `families`, `users`, `inventory_items`, etc.

## Step 3: Clone Repository

```bash
# Clone the repo
git clone https://github.com/yourusername/family-pantry.git
cd family-pantry

# Install dependencies
npm install
```

This will take 2-3 minutes.

## Step 4: Configure Environment Variables

Create `.env` file in project root:

```bash
# Create file
touch .env

# Add your credentials (replace with actual values from Step 2.3)
echo "EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co" >> .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ..." >> .env
```

Or manually create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important**: Never commit `.env` to Git! It's already in `.gitignore`.

## Step 5: Project File Structure

Create the following structure:

```
family-pantry/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── inventory.tsx
│   │   ├── shopping-list.tsx
│   │   ├── history.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── lib/
│   ├── supabase.ts
│   └── types.ts
├── components/
├── supabase/
│   └── schema.sql
├── .env
├── .gitignore
├── app.json
├── package.json
└── README.md
```

Copy code files from artifacts:
1. `lib/supabase.ts` - Artifact "lib/supabase.ts - Supabase Client"
2. `lib/types.ts` - Artifact "lib/types.ts - TypeScript Types"
3. `app/(tabs)/inventory.tsx` - Artifact "app/(tabs)/inventory.tsx - Inventory Screen"
4. `app/(tabs)/shopping-list.tsx` - Artifact "app/(tabs)/shopping-list.tsx - Shopping List Screen"

## Step 6: Install Expo Go on Your Phone

### iOS
1. Open App Store
2. Search "Expo Go"
3. Install

### Android
1. Open Google Play Store
2. Search "Expo Go"
3. Install

## Step 7: Start Development Server

```bash
npx expo start
```

You should see:
```
› Metro waiting on exp://192.168.1.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## Step 8: Open App on Phone

### iOS
1. Open Camera app
2. Point at QR code
3. Tap notification to open in Expo Go

### Android
1. Open Expo Go app
2. Tap "Scan QR code"
3. Point at QR code on terminal

App will load in ~30 seconds (first time).

## Step 9: Create First User

1. App opens to login screen
2. Tap "Sign Up"
3. Enter email and password
4. Check email for confirmation link (Supabase sends it)
5. Click confirmation link
6. Return to app and login

## Step 10: Create Family

After login, you need to link user to a family:

1. Go to Supabase dashboard
2. Click "Authentication" → "Users"
3. Copy your user ID (UUID)
4. Go to "SQL Editor"
5. Run this query (replace USER_ID):

```sql
-- Create family
INSERT INTO families (name) 
VALUES ('My Family') 
RETURNING id;

-- Copy the returned ID, then run (replace both UUIDs):
INSERT INTO users (id, family_id, name, role)
VALUES (
  'YOUR_USER_ID_HERE',
  'FAMILY_ID_FROM_ABOVE', 
  'Your Name',
  'admin'
);
```

6. Restart app (shake phone → "Reload")

## Step 11: Test the App

1. Go to Inventory tab
2. Tap "+ Add Item"
3. Add test item:
   - Name: `Milk`
   - Quantity: `2`
   - Unit: `L`
   - Price: `3.49`
   - Store: `Costco`
4. Tap "Save"

Item should appear in inventory!

## Step 12: Add Second Family Member (Optional)

1. Have family member install Expo Go
2. They scan same QR code
3. They sign up with their email
4. In Supabase, run:

```sql
-- Get your family_id first
SELECT family_id FROM users WHERE id = 'FIRST_USER_ID';

-- Add second user (replace UUIDs)
INSERT INTO users (id, family_id, name, role)
VALUES (
  'SECOND_USER_ID',
  'YOUR_FAMILY_ID',
  'Family Member Name',
  'member'
);
```

5. Second user restarts app
6. Both users now see same inventory in real-time! ✨

## Troubleshooting

### "Network request failed"
- Check `.env` file exists and has correct values
- Verify Supabase project is active (not paused)
- Try: `npx expo start --clear`

### "No family found"
- Run Step 10 SQL queries
- Verify user ID matches in Supabase Auth
- Check `users` table has your record

### App won't load on phone
- Ensure phone and computer on same WiFi
- Try: `npx expo start --tunnel`
- Disable VPN if running

### TypeScript errors
- Run: `npx tsc --noEmit` to see all errors
- Common fix: `rm -rf node_modules && npm install`

### "Supabase RLS policy violation"
- Check user is authenticated (logged in)
- Verify family_id is set in `users` table
- RLS policies are in schema (Step 2.4)

## Next Steps

✅ App is running!
✅ Database is set up!
✅ You're tracking inventory!

Now you can:
1. Customize the app (colors, features)
2. Add more family members
3. Deploy to app stores (see README.md)
4. Add barcode scanning (Phase 2)

## Development Tips

### Hot Reload
Changes to code auto-reload on phone. Just save the file!

### Debug Menu
Shake phone → "Debug Remote JS" (opens Chrome debugger)

### View Database
Supabase → "Database" → "Tables" → Browse data

### Logs
Terminal shows all console.log() output

## Support

Need help?
- 📖 Check [README.md](README.md)
- 💬 Open [GitHub Issue](https://github.com/yourusername/family-pantry/issues)
- 📧 Email: support@familypantry.app

---

**Setup complete! 🎉 You're ready to track your household inventory!**