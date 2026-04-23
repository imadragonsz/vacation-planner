# 🏖️ Vacation Planner Pro

Vacation Planner Pro is a high-performance, professional travel orchestration suite designed for modern adventurers. It features a sophisticated **Glassmorphic UI**, real-time multi-user synchronization, and a mobile-first architecture that ensures your travel plans are accessible everywhere.

---

## 🚀 Main Functions

- **Professional Dashboard**: Ultra-modern Glassmorphic interface with a persistent sidebar for lightning-fast trip switching and live countdowns.
- **Interactive Trip Planning**: Visualize your journey with custom map markers, chronological itineraries, and integrated live weather forecasts (using OpenWeatherMap API).
- **Inline Editing & Management**: Destinations and itinerary items can be edited directly in-view with responsive character limits and instant Supabase synchronization.
- **Improved UX Stability**: Optimized React rendering cycles to eliminate flickering during destination switching and large text overflow handling.
- **Smart Budgeting & Expenses**: Comprehensive financial tracking with multi-currency support and automated real-time conversion to Euro.
- **Real-time Collaboration**: Multi-user synchronization featuring shared packing lists, activity voting, and participant management.
- **Embedded Document Storage**: Centralized management for travel documents, hotel confirmations, and shared trip galleries.
- **Mobile-First Experience**: Fully responsive design with adaptive tab navigation and touch-optimized interactions for on-the-go planning.

---

## 🎨 UI/UX Features

- **Glassmorphic Aesthetic**: Deep transparency with `backdrop-blur` and `rgba(255,255,255,0.03)` surfaces.
- **Brand Palette**: High-contrast **Primary Red** (`#e31b4d`) for actions and **Secondary Violet** (`#8B5CF6`) for navigation and selection states.
- **Contextual Management**: Management buttons (Edit/Delete) are discreetly placed and activated on hover to maintain a clean aesthetic.
- **Skeleton Loading**: Intelligently applied loading states that provide visual feedback without disrupting the application flow.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Material UI (MUI 6+)
- **Storage**: Supabase (PostgreSQL, Realtime, Auth)
- **Mapping**: Leaflet & OpenStreetMap
- **Logic**: Day.js for scheduling & @dnd-kit for interactive reordering.

---

## 💻 Getting Started

1. **Install Dependencies**: `npm install`
2. **Environment Setup**: Create a `.env` file with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`.
3. **Database**: Enable Realtime on `vacation_comments`, `trip_expenses`, and `packing_items` in your Supabase project.
4. **Launch Application**:
   - Frontend: `npm start`
   - Backend: `npm run server`
