# Budget Mate Frontend

Frontend application for Budget Mate built with React, Vite, and Tailwind CSS.

## Tech Stack

- **React 18+** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **React i18next** for bilingual support (Arabic/English)
- **Tailwind CSS** for styling
- **Recharts** for data visualization

## Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` file if needed:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Budget Mate
```

### Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

Application will run on `http://localhost:5173`

## Features

- ✅ User authentication (Login/Register)
- ✅ Protected routes
- ✅ Bilingual support (Arabic/English)
- ✅ Responsive design with Tailwind CSS
- 🔄 Dashboard (Phase 2)
- 🔄 Transaction management (Phase 2)
- 🔄 Budget management (Phase 2)
- 🔄 Reports and charts (Phase 3)

## Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── components/        # React components
│   │   └── common/        # Common components
│   ├── contexts/          # React contexts
│   ├── i18n/              # Internationalization
│   │   └── locales/       # Translation files
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── styles/            # CSS files
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── index.html
└── package.json
```

## Internationalization

The app supports Arabic and English. Language preference is stored in localStorage and persists across sessions.

To add new translations, edit:
- `src/i18n/locales/ar.json` for Arabic
- `src/i18n/locales/en.json` for English

