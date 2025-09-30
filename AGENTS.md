# AGENTS.md

This file provides guidance to AI/LLM agents when working with code in this repository.

## Project Overview

This is a **Hogwarts Legacy Collectibles Checklist** - a React 19 + Vite + TypeScript web application that helps players track collectibles from the Hogwarts Legacy video game (set in the Harry Potter/Wizarding World universe).

### Core Features

- **Collectible Tracking**: Track various collectible types from Hogwarts Legacy
- **Structured Data**: Collectibles defined as JSON data (sourced from Google Sheets)
- **Hierarchical Organization**: Collectible types with optional subtypes
- **Page-based Navigation**: Separate pages per collectible type with side navigation
- **Local Storage**: All progress persisted in browser LocalStorage
- **Import/Export**: Versioned JSON import/export for progress backup/sharing
- **Player Profile**: Store player name, Hogwarts house, and profile picture
- **Mobile-First Design**: Responsive design prioritizing mobile experience

### Future Enhancements

- **Savegame Import**: Import progress directly from Hogwarts Legacy save files

## Development Commands

- `npm run dev` - Start the SvelteKit development server with hot module reloading
- `npm run build` - Build the application for production (SvelteKit + Vite build)
- `npm run preview` - Preview the production build locally
- `npm run check` - Run Svelte type checking and validation
- `npm run check:watch` - Run Svelte type checking in watch mode
- `npm run lint` - Run ESLint and Prettier to check code quality and formatting
- `npm run format` - Format code with Prettier

## Architecture Overview

### Tech Stack

- **Frontend**: SvelteKit (Svelte 5) with TypeScript
- **Build Tool**: Vite 6 with SvelteKit integration and hot module reloading
- **Styling**: Tailwind CSS v4 + DaisyUI v5 component library with custom Hogwarts theme
- **Linting**: ESLint 9 with TypeScript and Svelte-specific rules + Prettier
- **Data Storage**: Browser LocalStorage for persistence
- **Data Format**: JSON for collectibles data and progress export/import

### Key Configuration Files

- `svelte.config.js` - SvelteKit configuration with adapter and preprocessor settings
- `vite.config.ts` - Vite configuration with SvelteKit and Tailwind plugins
- `eslint.config.js` - ESLint configuration with TypeScript and Svelte rules
- `tailwind.config.js` - Tailwind CSS configuration with DaisyUI and custom Hogwarts theme
- `tsconfig.json` - TypeScript configuration for SvelteKit projects
- `.prettierrc` - Prettier configuration for code formatting

## Data Structure Guidelines

### Collectibles Data Structure

```typescript
interface CollectibleType {
  id: string;
  name: string;
  description?: string;
  subtypes?: CollectibleSubtype[];
  items: CollectibleItem[];
}

interface CollectibleSubtype {
  id: string;
  name: string;
  description?: string;
}

interface Location {
  id: string;
  name: string;
  sublocations?: Sublocation[];
}

interface Sublocation {
  id: string;
  name: string;
}

interface CollectibleItem {
  id: string;
  subtypeId?: string; // Optional link to subtype
  locationId?: string; // Optional link to location
  sublocationId?: string; // Optional link to sublocation
  name: string;
  description?: string;
  internalGameId?: string; // For future savegame import feature
}
```

### Player Progress Structure

```typescript
interface PlayerProgress {
  version: string; // For import/export versioning
  player: {
    name: string;
    house: 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin';
    profilePicture?: string; // Base64 or URL
  };
  completedItems: Set<string>; // Collectible item IDs
  lastUpdated: string; // ISO 8601 timestamp
}
```

## Application Structure

### Page Organization

- **Dashboard/Home**: Overview of progress across all collectible types
- **Collectible Type Pages**: One page per major collectible type
- **Player Profile**: Manage player details and settings
- **Import/Export**: Progress management features

### Navigation Structure

- **Side Navigation**: Persistent navigation showing all collectible types
- **Mobile Navigation**: Collapsible/drawer navigation for mobile devices
- **Breadcrumbs**: Clear navigation context within pages

## Development Notes

### Key Principles

- **Mobile-First**: Always design and implement mobile experience first
- **Performance**: Efficient LocalStorage usage and data structures
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Data Integrity**: Versioned import/export with validation
- **User Experience**: Clear progress indicators and intuitive organization

### Technical Considerations

- Use Svelte stores for global state management (player progress, settings)
- Implement proper TypeScript interfaces for all data structures
- Leverage DaisyUI components for consistent UI patterns
- Use LocalStorage API with proper error handling and data validation
- Implement debouncing for progress saves to optimize performance
- Follow SvelteKit's file-based routing conventions in `src/routes/`
- Use Svelte's reactive statements (`$:`) for computed values and side effects
- Leverage SvelteKit's load functions for data fetching and page initialization
