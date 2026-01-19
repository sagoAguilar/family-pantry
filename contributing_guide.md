# Contributing to FamilyPantry

Thank you for considering contributing to FamilyPantry! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/family-pantry/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, app version, etc.)

### Suggesting Features

1. Check [Discussions](https://github.com/yourusername/family-pantry/discussions) for similar ideas
2. Create a new discussion with:
   - Problem you're trying to solve
   - Proposed solution
   - Alternative solutions considered
   - Impact on existing features

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/family-pantry.git
   cd family-pantry
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test your changes**
   ```bash
   npm test
   npx tsc --noEmit
   npm run lint
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add barcode scanning support"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Describe what changed and why
   - Reference related issues
   - Include screenshots for UI changes

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Git

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npx expo start
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- InventoryScreen.test.tsx
```

### Code Style

- Use TypeScript for type safety
- Follow existing patterns in codebase
- Use functional components with hooks
- Keep components under 300 lines
- Extract reusable logic into hooks

### File Organization

```
app/
  (auth)/       # Authentication screens
  (tabs)/       # Tab navigation screens
  _layout.tsx   # Layout components

components/     # Reusable UI components
lib/           # Utility functions, API clients
store/         # State management
```

## Database Changes

If your change requires database schema updates:

1. Create a migration file in `supabase/migrations/`
2. Name it: `YYYYMMDD_description.sql`
3. Include both UP and DOWN migrations
4. Test locally before submitting
5. Document changes in PR description

Example migration:
```sql
-- Up Migration
ALTER TABLE inventory_items ADD COLUMN notes TEXT;

-- Down Migration
ALTER TABLE inventory_items DROP COLUMN notes;
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public functions
- Update inline comments for complex logic
- Include examples in documentation

## Review Process

1. Maintainers review within 48 hours
2. Address feedback or questions
3. Once approved, PR will be merged
4. Changes deployed in next release

## Release Process

Releases follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Questions?

- Open a [Discussion](https://github.com/yourusername/family-pantry/discussions)
- Join our community chat
- Email: dev@familypantry.app

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- About screen in app

Thank you for contributing! 🎉