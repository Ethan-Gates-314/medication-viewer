# Medication Database Viewer

A read-only viewer for browsing medication data stored in Firebase Firestore. Built with React, TypeScript, MobX, and Tailwind CSS.

![Medication Grid View](public/Screenshot%202025-12-03%20130700.png)

## Features

- **Browse 5,000+ Medications** — Paginated grid view with 100 items per page
- **Search & Filter** — Find medications by name, RxCUI, or ingredient
- **Smart Filters** — Filter by matched/unmatched status, liquid/solid form, or minimum NDC count
- **Sorting** — Sort by name, RxCUI, median price, or NDC count
- **Dual View Modes** — Switch between card grid and table layouts
- **Real-time Stats** — View totals, matched counts, NDC counts, and average pricing
- **Detail Modal** — Click any medication to view full JSON data

## Tech Stack

- **React 19** + **TypeScript**
- **MobX** for state management
- **Firebase/Firestore** for database
- **Tailwind CSS 4** for styling
- **Vite** for development & bundling

## Data Source

The application connects to a Firestore database containing medication records with:
- Drug names and RxCUI identifiers
- Classification data (ingredient name, ATC codes)
- Pricing statistics (min, median, max unit prices)
- NDC (National Drug Code) links
- Conversion values (liquid/solid, dosage units)

![Firestore Database Structure](public/Screenshot%202025-12-03%20130808.png)

## Setup

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ethan-Gates-314/medication-viewer.git
   cd medication-viewer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root with your Firebase credentials:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/       # React UI components
│   ├── Layout.tsx
│   ├── MedicationGrid.tsx
│   ├── MedicationCard.tsx
│   ├── MedicationDetailModal.tsx
│   ├── SearchFilters.tsx
│   ├── StatsPanel.tsx
│   └── ...
├── stores/           # MobX state management
│   └── MedicationViewerStore.ts
├── data/             # Firebase/Firestore access
│   ├── firebase.ts
│   └── firestoreApi.ts
├── types/            # TypeScript type definitions
│   └── medication.ts
└── utils/            # Helper functions
    └── formatters.ts
```

## Architecture

This app follows a **Three-Layer Architecture**:

1. **UI Layer** — React components for display and user interaction
2. **Business Logic Layer** — MobX store for state management and computed values
3. **Data Access Layer** — Firebase modules for database operations

## License

MIT
