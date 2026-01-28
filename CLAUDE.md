# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Family Pantry** is a React Native mobile application built with Expo for managing household inventory and shopping lists. The app allows family members to:

- Track pantry inventory with quantities and expiration dates
- Manage shared shopping lists
- Get low-stock alerts
- Share data across family members via Supabase

**Tech Stack:**
- **Framework**: Expo SDK 54 with React Native 0.81
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with Google and Apple social login
- **State Management**: React Context API
- **Styling**: React Native StyleSheet

## Project Structure

```
/
├── app/                      # Expo Router file-based routing
│   ├── (auth)/               # Authentication screens (login, signup, complete-profile)
│   ├── (tabs)/               # Main app tab screens
│   │   ├── index.tsx         # Home screen
│   │   ├── Inventory.tsx     # Inventory management
│   │   ├── shopping-list.tsx # Shopping list
│   │   ├── profile.tsx       # User profile
│   │   └── _layout.tsx       # Tab navigation layout
│   ├── _layout.tsx           # Root layout with auth routing
│   └── modal.tsx             # Modal screen
├── components/               # Reusable React components
│   ├── ui/                   # UI primitives (IconSymbol, Collapsible)
│   └── *.tsx                 # Feature components (themed, haptic, parallax)
├── constants/                # App-wide constants
│   └── theme.ts              # Colors and fonts
├── contexts/                 # React Context providers
│   └── auth-context.tsx      # Authentication state management
├── hooks/                    # Custom React hooks
│   ├── use-color-scheme.ts   # Theme detection
│   └── use-theme-color.ts    # Theme-aware colors
├── lib/                      # Utility libraries
│   ├── supabase.ts           # Supabase client configuration
│   └── types.ts              # Database TypeScript types
├── supabase/                 # Database configuration
│   └── database_schema.sql   # Full PostgreSQL schema with RLS
├── assets/                   # Static assets (images, fonts)
├── scripts/                  # Utility scripts
├── .eas/workflows/           # EAS CI/CD workflows
├── app.json                  # Expo configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Essential Commands

### Development

```bash
npx expo start                  # Start dev server
npx expo start --clear          # Clear cache and start dev server
npx expo start --ios            # Start and open iOS simulator
npx expo start --android        # Start and open Android emulator
npx expo install <package>      # Install packages with compatible versions
npx expo install --check        # Check installed packages for updates
npx expo install --fix          # Auto-fix package versions
```

### Code Quality

```bash
npx expo lint                   # Run ESLint
npx expo doctor                 # Check project health and dependencies
npm run test:connection         # Test Supabase connection
```

### Building & Deployment

```bash
npm run development-builds      # Create development builds (EAS workflow)
npm run draft                   # Publish preview update and website
npm run deploy                  # Deploy to production (EAS workflow)
npx eas-cli@latest build --platform ios -s      # Build iOS and submit to App Store
npx eas-cli@latest build --platform android -s  # Build Android and submit to Play Store
```

## Architecture Patterns

### Authentication Flow

The app uses a multi-step authentication flow managed in `app/_layout.tsx`:

1. **Unauthenticated**: Redirects to `/(auth)/login`
2. **Authenticated but no family**: Redirects to `/(auth)/complete-profile`
3. **Fully authenticated**: Redirects to `/(tabs)`

Auth state is managed via `AuthContext` in `contexts/auth-context.tsx`:

```typescript
const { session, user, familyId, loading, needsFamily, signIn, signOut } = useAuth();
```

### Database Schema

The app uses Supabase with these main tables:

- **families**: Family groups that users belong to
- **users**: Extended user profiles linked to auth.users
- **inventory_items**: Pantry items with quantities, prices, expiration dates
- **shopping_list_items**: Shared shopping list items
- **purchase_history**: Historical purchase records
- **product_barcodes**: Cached barcode lookups
- **user_preferences**: User notification settings

All tables use Row Level Security (RLS) with `get_auth_family_id()` to scope data to the user's family.

### Real-time Updates

Inventory and shopping list screens subscribe to Supabase real-time changes:

```typescript
const channel = supabase
  .channel('inventory_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchData())
  .subscribe();
```

### Navigation

Uses Expo Router with file-based routing:

- Route groups: `(auth)` for auth screens, `(tabs)` for main app
- Tab visibility controlled by auth state in `app/(tabs)/_layout.tsx`
- Import navigation from `expo-router`: `Link`, `router`, `useLocalSearchParams`

## Code Style & Conventions

### TypeScript

- Strict mode enabled
- Use absolute imports with `@/` prefix (e.g., `@/components/themed-text`)
- Define database types in `lib/types.ts`

### Component Patterns

- Function components with hooks
- React 19 with React Compiler enabled
- Platform-specific files: `*.ios.tsx`, `*.android.tsx`, `*.web.ts`

### Naming Conventions

- **Files**: kebab-case (`use-color-scheme.ts`, `themed-text.tsx`)
- **Components**: PascalCase (`ThemedText`, `IconSymbol`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useColorScheme`)

### Styling

- Use React Native `StyleSheet.create()` for styles
- Theme colors from `constants/theme.ts`
- Light/dark mode support via `useColorScheme()` hook

### Error Handling

- Use `Alert.alert()` for user-facing errors
- Handle Supabase errors with try/catch
- Auth errors trigger navigation via `_layout.tsx`

## Environment Variables

Required environment variables (set in `.env` or EAS secrets):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
```

## EAS Workflows

CI/CD is managed via EAS Workflows in `.eas/workflows/`:

- **create-development-builds.yml**: Build dev clients
- **create-draft.yml**: Publish preview updates
- **deploy-to-production.yml**: Build and submit to stores

Production deploys use fingerprinting to determine if a new native build is needed or if an OTA update suffices.

## Documentation Resources

When working on this project, consult official Expo documentation:

- **https://docs.expo.dev/llms-full.txt** - Complete Expo documentation
- **https://docs.expo.dev/llms-eas.txt** - EAS Build/Submit/Update docs
- **https://docs.expo.dev/llms-sdk.txt** - Expo SDK modules
- **https://reactnative.dev/docs/getting-started** - React Native docs
- **https://supabase.com/docs** - Supabase documentation

## AI Agent Instructions

When working on this project:

1. **Read before modifying**: Always read files before making changes
2. **Consult documentation**: Use Expo docs for API questions
3. **Follow existing patterns**: Match component and styling patterns in existing code
4. **Preserve auth flow**: Don't break the authentication routing logic in `_layout.tsx`
5. **Use RLS-aware queries**: All Supabase queries should work within RLS policies
6. **Test connection**: Run `npm run test:connection` after Supabase changes

### Common Tasks

**Adding a new screen:**
1. Create file in appropriate route group (`app/(tabs)/` or `app/(auth)/`)
2. Add tab configuration in `app/(tabs)/_layout.tsx` if needed
3. Use `useAuth()` for auth-gated features

**Adding a new database table:**
1. Update `supabase/database_schema.sql`
2. Add TypeScript types to `lib/types.ts`
3. Create RLS policies using `get_auth_family_id()`

**Adding environment variables:**
1. Prefix with `EXPO_PUBLIC_` for client-side access
2. Update this documentation

## Troubleshooting

### Expo Go Errors

If errors occur in Expo Go, create a development build (`npm run development-builds`). Expo Go has limited native module support.

### Auth Issues

- Check Supabase dashboard for auth logs
- Verify Google/Apple credentials match environment
- Ensure RLS policies allow the operation

### Database Issues

- Run `npm run test:connection` to verify connectivity
- Check Supabase logs for RLS policy violations
- Verify `family_id` is set correctly for the user
