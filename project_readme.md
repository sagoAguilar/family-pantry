# FamilyPantry

A React Native mobile app for managing household inventory and shopping lists, built with Expo and Supabase.

## Features

- 📦 **Inventory Management** - Track what you have at home with quantities, prices, and expiration dates
- 🛒 **Smart Shopping Lists** - Organize by store, check off items while shopping
- 👨‍👩‍👧‍👦 **Family Sharing** - Real-time sync across all family members
- 📊 **Purchase History** - Track what you buy, where, and when
- 🔔 **Low Stock Alerts** - Automatic notifications when items run low
- 🏪 **Store Tracking** - Remember where you bought each item
- 📱 **Offline Support** - Works without internet, syncs when online
- 🔐 **Secure** - Row-level security ensures family data privacy

## Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Real-time**: Supabase WebSockets
- **Authentication**: Supabase Auth

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/family-pantry.git
cd family-pantry
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Copy and run the schema from `supabase/schema.sql`
5. Get your credentials from Project Settings → API

### 4. Configure Environment

Create `.env` file in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

### 5. Run App

```bash
# Start development server
npx expo start

# Options:
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app
```

## Project Structure

```
family-pantry/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx          # Login screen
│   │   └── signup.tsx         # Signup screen
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab navigation
│   │   ├── inventory.tsx      # Inventory management
│   │   ├── shopping-list.tsx  # Shopping list
│   │   ├── history.tsx        # Purchase history
│   │   └── settings.tsx       # App settings
│   ├── _layout.tsx            # Root layout
│   └── index.tsx              # Entry point
├── components/
│   ├── InventoryCard.tsx      # Inventory item card
│   ├── ShoppingListItem.tsx   # Shopping list item
│   └── Button.tsx             # Reusable button
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── types.ts               # TypeScript types
├── store/
│   └── useStore.ts            # Global state (optional)
├── supabase/
│   ├── schema.sql             # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Sample data
├── .env                       # Environment variables (gitignored)
├── .gitignore
├── app.json                   # Expo config
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

### Tables

- `families` - Family groups
- `users` - User profiles (extends Supabase auth.users)
- `inventory_items` - Household inventory
- `shopping_list_items` - Shopping list items
- `purchase_history` - Purchase records
- `product_barcodes` - Barcode cache
- `user_preferences` - User settings

See `supabase/schema.sql` for complete schema.

## Usage Guide

### Adding Items to Inventory

1. Tap "Add Item" button
2. Enter item details:
   - Name (required)
   - Quantity (required)
   - Unit (L, kg, units, etc.)
   - Price (optional)
   - Store (optional)
   - Expiration date (optional)
3. Tap "Save"

### Creating Shopping List

1. Go to Shopping List tab
2. Tap "Add Item"
3. Enter item details
4. Optionally set preferred store
5. Items auto-group by store

### Shopping Workflow

1. Check off items as you shop
2. Tap "Move to Inventory" when done
3. Items automatically transfer to inventory
4. Shopping list clears checked items

### Low Stock Alerts

When inventory quantity drops below 20% of max:
- Notification appears
- Option to add to shopping list
- Auto-suggests needed quantity

## Development

### Run Tests

```bash
npm test
```

### Type Check

```bash
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production
```

## Deployment

### App Stores

```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android
```

### OTA Updates

```bash
# Push instant updates (JS-only changes)
eas update --branch production
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ JWT-based authentication
- ✅ Automatic token refresh
- ✅ Secure password hashing
- ✅ HTTPS/WSS encryption
- ✅ Environment variables for secrets

## Cost Breakdown

### Free Tier (0-100 users)
- Supabase: $0/month (500MB DB, 2GB bandwidth)
- Expo: $0/month (30 builds/month)
- **Total: $0/month**

### Production (100-1000 users)
- Supabase Pro: $25/month
- Expo EAS: $29/month (optional, unlimited builds)
- **Total: ~$54/month**

### App Store Fees
- Apple Developer: $99/year
- Google Play: $25 one-time

## Roadmap

### Phase 1 (Current)
- ✅ Inventory management
- ✅ Shopping lists
- ✅ Family sharing
- ✅ Store tracking
- ✅ Real-time sync

### Phase 2 (Next)
- [ ] Barcode scanning
- [ ] Camera integration
- [ ] Product database lookup
- [ ] Receipt OCR

### Phase 3 (Future)
- [ ] Push notifications
- [ ] Expiration alerts
- [ ] Price tracking
- [ ] Analytics dashboard
- [ ] Budget tracking
- [ ] Recipe integration

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Troubleshooting

### "Supabase connection failed"
- Verify `.env` file exists with correct credentials
- Check Supabase project is active
- Restart Expo dev server

### "No family found"
- Run family setup SQL in Supabase
- Verify user is linked in `users` table
- Check Row Level Security policies

### Build Errors
- Run `npx expo install --check`
- Clear cache: `npx expo start --clear`
- Update dependencies: `npm update`

## Support

- 📧 Email: support@familypantry.app
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/family-pantry/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/family-pantry/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- [Expo](https://expo.dev) - React Native framework
- [Supabase](https://supabase.com) - Backend platform
- [React Native](https://reactnative.dev) - Mobile framework

---

**Built with ❤️ for families who want to stay organized**