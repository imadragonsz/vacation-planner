# 🏖️ Vacation Planner Pro

Vacation Planner is a high-performance, professional travel orchestration suite. It features a modern **Glassmorphic UI**, real-time collaboration, and a comprehensive set of tools to ensure your next trip is planned to perfection.

![Vacation Planner Screenshot](https://via.placeholder.com/800x400.png?text=Vacation+Planner+Pro+Dashboard)

---

## 🌟 Key Features

### 📅 Advanced Trip Planning

- **Interactive Dashboard**: A unified view of your itinerary, map, and collaborative widgets.
- **Dynamic Agenda**: Drag-and-drop support for reordering activities.
- **Live Maps**: Visualize your journey with custom markers for every destination.

### 💰 Smart Budgeting & Expenses

- **Multi-Currency Support**: Add expenses in USD, GBP, JPY, CHF, or HUF.
- **Real-time Conversion**: Automatic conversion to **Euro (€)** using live exchange rates.
- **Shared Tracker**: See who paid for what and track the total trip cost.

### 💬 Real-time Collaboration

- **Trip Chat**: Instant messaging for all trip participants.
- **Shared Packing List**: Collaborative checklist with progress tracking and contributor avatars.
- **Role-based Access**: Securely share trips with friends via participant invites.

### 🛠️ Professional Utility

- **Weather Forecast**: Live weather data for every destination.
- **iCal Export**: Sync your trip agenda directly to your Google, Apple, or Outlook calendar.
- **PWA Ready**: Offline support and installable as a mobile/desktop app.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Material UI (MUI)
- **Real-time/Database**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Mapping**: Leaflet & OpenStreetMap
- **State/DND**: `@dnd-kit` for drag-and-drop, React Hooks for state.

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
