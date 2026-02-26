# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sales Copilot - Proposal Assistant**: An intelligent workspace for crafting commercial proposals with AI assistance. Built as a Google AI Studio app, featuring structured sections, a markdown editor, and contextual AI insights powered by Gemini.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite)
- **Animation**: Motion (motion/react)
- **AI**: Google Generative AI SDK (@google/genai)
- **Markdown**: react-markdown for rendering

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Type checking (no test suite currently)
npm run lint

# Clean build artifacts
npm run clean
```

## Environment Setup

Required environment variables in [.env.local](.env.local):
- `GEMINI_API_KEY`: Gemini API key for AI features (injected by AI Studio in production)
- `APP_URL`: The hosted URL (injected by AI Studio in production)

See [.env.example](.env.example) for template.

## Architecture

### Application Structure

The app has three main views managed by a single `view` state:
1. **List View**: Grid of proposal cards with search
2. **Wizard View**: 3-step guided proposal creation flow
3. **Editor View**: Split-pane editing interface

### Core Data Model

**Proposal** ([src/types.ts](src/types.ts)):
- Contains metadata (name, client, status, version)
- Has multiple `Section` objects
- Persisted to `localStorage` under key `'proposals'`

**Section**:
- Individual editable content blocks
- Each has title, markdown content, completion status, and quality score

### State Management

All state is managed via React `useState` in [src/App.tsx](src/App.tsx):
- `proposals`: Array of all proposals (synced to localStorage)
- `activeProposalId` / `activeSectionId`: Current editing context
- `view`: Current view mode
- `chatMessages`: AI chat history per proposal

State updates trigger localStorage sync via `useEffect`.

### Layout Components

**Editor View** uses a three-panel layout:
- **Left Panel** (w-64): Section navigation with add/delete
- **Center Panel** (flex-1): Text/WYSIWYG editor with markdown support
- **Right Panel** (w-80): Tabbed interface for Chat AI / References / Analysis

### AI Integration

The [src/services/geminiService.ts](src/services/geminiService.ts) provides:
- `chatWithAI(prompt, context)`: Sends user query + proposal context to Gemini 1.5 Flash
- Context includes: proposal name, client, current section title and content
- API key is injected via Vite's `process.env.GEMINI_API_KEY`

### Initial Data

[src/constants.ts](src/constants.ts) provides:
- `INITIAL_PROPOSALS`: Demo proposals for first-time users
- `DEFAULT_SECTIONS`: Template sections for new proposals
- `APPROACH_OPTIONS`: Service offering types in wizard

## Key Files

- [src/App.tsx](src/App.tsx): Main component with all views and business logic
- [src/types.ts](src/types.ts): TypeScript interfaces for Proposal, Section, etc.
- [src/services/geminiService.ts](src/services/geminiService.ts): Gemini API client
- [src/constants.ts](src/constants.ts): Initial data and defaults
- [vite.config.ts](vite.config.ts): Vite config with path aliases and env injection

## Styling Conventions

- Uses Tailwind utility classes exclusively
- Custom utility function `cn()` combines clsx + tailwind-merge
- Primary brand color: `#fa5d52` (salmon red)
- Custom scrollbar styles defined inline in App component
- Responsive design with mobile breakpoints (md:, lg:)

## Important Notes

- **No backend**: All data stored in browser localStorage
- **No routing**: View switching handled by state, not URLs
- **No tests**: Project uses TypeScript checking only (`npm run lint`)
- **HMR disabled in AI Studio**: Controlled via `DISABLE_HMR` env var
- **Path alias**: `@/*` maps to project root (see tsconfig.json)
- The app is designed to run in Google AI Studio with automatic env var injection
