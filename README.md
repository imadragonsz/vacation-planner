# 🏖️ Vacation Planner Pro

Vacation Planner Pro is a high-performance, professional travel orchestration suite designed for modern adventurers. It features a sophisticated **Glassmorphic UI**, real-time multi-user synchronization, and a mobile-first architecture that ensures your travel plans are accessible everywhere.

---

## 🌟 Key Features

### 💻 Professional Dashboard & Navigation

- **Glassmorphic UI**: Ultra-modern aesthetic with backdrop-blur effects and fluid transitions.
- **Smart Sidebar**: Persistent navigation for lightning-fast switching between trips.
- **Universal Search**: Quickly filter your vacation list by name, owner, or status.
- **Session Persistence**: Remembers exactly which trip you were viewing even after a page refresh.

### 📱 Optimized Mobile Experience

- **Adaptive Tab Navigation**: Dedicated mobile tabs for Planning, Agenda, Packing, and Expenses.
- **Dynamic Interactions**: Touch-optimized action buttons and simplified stacked forms.
- **Full-Screen Modals**: Immersive editing and creation experience on small viewports.

### 📅 Advanced Trip Planning

- **Interactive Maps**: Visualize your journey with custom markers for every destination.
- **Chronological Itinerary**: Destinations and activities are automatically sorted by time.
- **Universal Calendar**: A high-level month view overlay to track all your adventures at once.
- **Live Weather**: Real-time forecasts for every stop on your journey.

### ⏱️ Status & Countdowns

- **Live Countdowns**: Real-time "days left" badges in the sidebar.
- **Status Pills**: Instant clarity on whether a trip is Upcoming, Ongoing, or Completed.
- **Archive System**: Keep your dashboard clean by archiving past adventures.

### 💰 Smart Budgeting & Expenses

- **Multi-Currency Support**: Log costs in USD, GBP, JPY, CHF, or HUF.
- **Automated Exchange**: Real-time conversion to **Euro (€)** using live currency APIs.

### 💬 Real-time Collaboration

- **Shared Packing List**: Collaborative checks with contributor avatars and progress bars.
- **Participant Access**: Join shared trips to contribute to the itinerary and expenses.
- **Rich Previews**: Optimized metadata for beautiful link sharing on Discord and social media.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Material UI (MUI 6+)
- **Storage**: Supabase (PostgreSQL, Realtime, Auth)
- **Time/Dates**: Day.js for high-precision countdowns and sorting.
- **Mapping**: Leaflet & OpenStreetMap
- **State/DND**: `@dnd-kit` for interactive reordering.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/imadragonsz/Vacation-planner.git
   ```
2. Navigate to the project directory:
   ```bash
   cd vacation_planner
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`.

### Building for Production

To create a production build, run:

```bash
npm run build
```

---

## 🗄️ Setting Up Supabase

This project requires a Supabase database for authentication and data storage. Follow these steps to set it up:

1. **Create a Supabase Account**:
   - Go to [Supabase](https://supabase.com) and sign up for a free account.

2. **Create a New Project**:
   - Once logged in, create a new project and provide the required details (e.g., project name, database password).

3. **Get the API Keys**:
   - Navigate to the "Settings" section of your project and copy the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

4. **Set Up Environment Variables**:
   - Create a `.env` file in the root of the project directory and add the following:
     ```env
     REACT_APP_SUPABASE_URL=your-supabase-url
     REACT_APP_SUPABASE_ANON_KEY=your-anon-key
     ```
     Replace `your-supabase-url` and `your-anon-key` with the values from your Supabase project.

5. **Set Up Database Schema**:
   - Use the Supabase SQL editor to initialize your database.
   - **Important**: This project uses a `bigint` based primary key system for legacy compatibility in several tables. Ensure you enable **Realtime** for `vacation_comments`, `trip_expenses`, and `packing_items` to enable collaborative features.

   ```sql
   -- Enable Realtime
   ALTER PUBLICATION supabase_realtime ADD TABLE vacation_comments;
   ALTER PUBLICATION supabase_realtime ADD TABLE trip_expenses;
   ALTER PUBLICATION supabase_realtime ADD TABLE packing_items;
   ```

6. **Test the Connection**:
   - Start the development server and ensure the application connects to Supabase successfully.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 📧 Contact

For questions or feedback, please contact the repository owner at [GitHub](https://github.com/imadragonsz).

---

## 🌍 Live Demo

Check out the live demo of the application [here](https://your-live-demo-link.com).
