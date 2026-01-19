# Repository Structure Guide

This document describes the complete file organization for the FamilyPantry project.

## Root Directory

```
family-pantry/
├── app/                    # Expo Router app directory
├── assets/                 # Static assets (icons, images)
├── components/             # Reusable UI components
├── lib/                    # Utilities, helpers, API clients
├── store/                  # State management (optional)
├── supabase/              # Database schema and migrations
├── __tests__/             # Test files
├── .env                   # Environment variables (gitignored)
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore rules
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
├── CONTRIBUTING.md        # Contribution guidelines
├── eas.json               # EAS Build configuration
├── LICENSE                # MIT License
├── package.json           # Dependencies and scripts
├── README.md              # Main documentation
├── SETUP.md               # Setup instructions
├── tsconfig.json          # TypeScript configuration
└── yarn.lock / package-lock.json
```

## Detailed Structure

### `/app` - Application Screens (Expo Router)

```
app/
├── (auth)/                # Authentication group
│   ├── login.tsx          # Login screen
│   └── signup.tsx         # Signup screen
│
├── (tabs)/                # Main tab navigation group
│   ├── _layout.tsx        # Tab bar configuration
│   ├── inventory.tsx      # Inventory management screen
│   ├── shopping-list.tsx  # Shopping list screen
│   ├── history.tsx        # Purchase history screen
│   └── settings.tsx       # Settings and preferences
│
├── _layout.tsx            # Root layout (auth check, providers)
├── index.tsx              # Entry point (redirects to login/tabs)
└── +not-found.tsx         # 404 screen (optional)
```

**File Template: `app/(tabs)/inventory.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function InventoryScreen() {
  // Component logic here
  return <View>{/* UI here */}</View>;
}
```

### `/lib` - Shared Libraries

```
lib/
├── supabase.ts            # Supabase client configuration
├── types.ts               # TypeScript type definitions
├── utils.ts               # Helper functions
├── constants.ts           # App constants
└── hooks/                 # Custom React hooks
    ├── useInventory.ts    # Inventory data hook
    ├── useShoppingList.ts # Shopping list hook
    └── useAuth.ts         # Authentication hook
```

**File Template: `lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey
);
```

### `/components` - Reusable Components

```
components/
├── ui/                    # Base UI components
│   ├── Button.tsx         # Custom button
│   ├── Input.tsx          # Custom text input
│   ├── Card.tsx           # Card container
│   └── Modal.tsx          # Modal wrapper
│
├── inventory/             # Inventory-specific components
│   ├── InventoryCard.tsx  # Single inventory item
│   ├── InventoryList.tsx  # List of items
│   └── AddItemModal.tsx   # Add item form
│
├── shopping/              # Shopping list components
│   ├── ShoppingListItem.tsx
│   ├── StoreGroup.tsx     # Group items by store
│   └── CheckoffButton.tsx
│
└── common/                # Shared components
    ├── Header.tsx         # Screen header
    ├── Loading.tsx        # Loading indicator
    └── EmptyState.tsx     # Empty state message
```

**File Template: `components/ui/Button.tsx`**
```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, styles[variant]]} 
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#3b82f6',
  },
  secondary: {
    backgroundColor: '#6b7280',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

### `/store` - State Management (Optional)

```
store/
├── index.ts               # Export all stores
├── useAuthStore.ts        # Auth state
├── useInventoryStore.ts   # Inventory state
└── usePreferencesStore.ts # User preferences
```

**File Template: `store/useAuthStore.ts`** (using Zustand)
```typescript
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  familyId: string | null;
  setUser: (user: User | null) => void;
  setFamilyId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  familyId: null,
  setUser: (user) => set({ user }),
  setFamilyId: (familyId) => set({ familyId }),
}));
```

### `/supabase` - Database Files

```
supabase/
├── schema.sql             # Complete database schema
├── migrations/            # Migration files
│   ├── 20260101_initial_schema.sql
│   ├── 20260115_add_barcodes.sql
│   └── 20260120_add_notifications.sql
├── seed.sql               # Sample data for development
└── README.md              # Database documentation
```

**File: `supabase/schema.sql`**
```sql
-- See artifact "Supabase Database Schema"
-- Complete schema with tables, indexes, RLS policies
```

### `/assets` - Static Assets

```
assets/
├── images/
│   ├── icon.png           # App icon (1024x1024)
│   ├── splash.png         # Splash screen
│   ├── adaptive-icon.png  # Android adaptive icon
│   └── favicon.png        # Web favicon
│
└── fonts/                 # Custom fonts (optional)
    └── Inter-Regular.ttf
```

### `/__tests__` - Test Files

```
__tests__/
├── components/
│   ├── Button.test.tsx
│   └── InventoryCard.test.tsx
│
├── screens/
│   ├── InventoryScreen.test.tsx
│   └── ShoppingListScreen.test.tsx
│
├── lib/
│   └── utils.test.ts
│
└── setup.ts               # Test configuration
```

**File Template: `__tests__/components/Button.test.tsx`**
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test" onPress={() => {}} />
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test" onPress={onPress} />
    );
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Configuration Files

### `.env.example`
```env
# Copy to .env and fill in your values
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

### `babel.config.js`
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

### `tsconfig.json`
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

### `eas.json`
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `InventoryCard.tsx`)
- **Screens**: PascalCase with descriptor (e.g., `inventory.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `types.ts`)
- **Tests**: Same as source + `.test.tsx`

### Variables
- **Components**: PascalCase (`const InventoryCard = ...`)
- **Functions**: camelCase (`function fetchItems()`)
- **Constants**: UPPER_SNAKE_CASE (`const MAX_ITEMS = 100`)
- **Hooks**: camelCase with 'use' prefix (`useInventory`)

### Database
- **Tables**: snake_case (`inventory_items`)
- **Columns**: snake_case (`created_at`)
- **Functions**: snake_case (`update_max_quantity`)

## Import Order

Standard import order in files:

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. React Native imports
import { View, Text, FlatList } from 'react-native';

// 3. Third-party libraries
import { useQuery } from '@tanstack/react-query';

// 4. Local imports (absolute)
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '@/lib/types';

// 5. Local imports (relative)
import { Button } from '../../components/ui/Button';

// 6. Styles
import styles from './styles';
```

## File Size Guidelines

- **Components**: < 300 lines
- **Screens**: < 500 lines
- **Utilities**: < 200 lines
- **Types**: No limit (generated)

If files exceed these, consider splitting into smaller modules.

## Git Workflow

```
main                    # Production-ready code
  ├── develop           # Development branch
  │   ├── feature/...   # Feature branches
  │   ├── fix/...       # Bug fix branches
  │   └── refactor/...  # Refactoring branches
  └── hotfix/...        # Urgent production fixes
```

## Documentation Standards

Every major component/function should have:

```typescript
/**
 * InventoryCard component displays a single inventory item
 * 
 * @param item - The inventory item to display
 * @param onEdit - Callback when edit button pressed
 * @param onDelete - Callback when delete button pressed
 * 
 * @example
 * <InventoryCard 
 *   item={item} 
 *   onEdit={() => handleEdit(item.id)}
 *   onDelete={() => handleDelete(item.id)}
 * />
 */
export function InventoryCard({ item, onEdit, onDelete }: Props) {
  // ...
}
```

---

This structure ensures:
✅ Scalability (easy to add features)
✅ Maintainability (clear organization)
✅ Collaboration (team can find files easily)
✅ Best practices (follows Expo/React Native standards)