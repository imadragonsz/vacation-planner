# Vacation Planner

Vacation Planner is a web application designed to help users plan, organize, and manage their vacations efficiently. The app provides features such as creating vacation agendas, managing locations, and visualizing plans on a map.

## Features

- **User Authentication**: Secure login and registration.
- **Vacation Management**: Create, edit, and delete vacation plans.
- **Interactive Map**: Visualize vacation locations using Leaflet.
- **Agenda Planning**: Organize daily activities and schedules.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Technologies Used

- **Frontend**: React, TypeScript
- **Mapping**: Leaflet, React-Leaflet
- **Backend**: Supabase (for authentication and database)
- **Build Tool**: Create React App with TypeScript template

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/imadragonsz/Vacation-planner.git
   ```
2. Navigate to the `client` directory:
   ```bash
   cd Vacation-planner/client
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

## Setting Up Supabase

This project requires a Supabase database for authentication and data storage. Follow these steps to set it up:

1. **Create a Supabase Account**:

   - Go to [Supabase](https://supabase.com) and sign up for a free account.

2. **Create a New Project**:

   - Once logged in, create a new project and provide the required details (e.g., project name, database password).

3. **Get the API Keys**:

   - Navigate to the "Settings" section of your project and copy the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

4. **Set Up Environment Variables**:

   - Create a `.env` file in the root of the `client` directory and add the following:
     ```env
     REACT_APP_SUPABASE_URL=your-supabase-url
     REACT_APP_SUPABASE_ANON_KEY=your-anon-key
     ```
     Replace `your-supabase-url` and `your-anon-key` with the values from your Supabase project.

5. **Set Up Database Tables**:

   - Use the following SQL commands in the Supabase SQL editor to create the necessary tables:

     ```sql
     -- Users table
     CREATE TABLE users (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         email TEXT UNIQUE NOT NULL,
         password TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT now()
     );

     -- Vacations table
     CREATE TABLE vacations (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         user_id UUID REFERENCES users(id),
         title TEXT NOT NULL,
         start_date DATE NOT NULL,
         end_date DATE NOT NULL,
         created_at TIMESTAMP DEFAULT now()
     );

     -- Locations table
     CREATE TABLE locations (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         vacation_id UUID REFERENCES vacations(id),
         name TEXT NOT NULL,
         latitude FLOAT NOT NULL,
         longitude FLOAT NOT NULL,
         created_at TIMESTAMP DEFAULT now()
     );
     ```

6. **Test the Connection**:
   - Start the development server and ensure the application connects to Supabase successfully.

---

## About This Project

This project was created with the assistance of **GitHub Copilot**, an AI-powered coding assistant. It helped streamline the development process by providing intelligent code suggestions and automating repetitive tasks.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For questions or feedback, please contact the repository owner at [GitHub](https://github.com/imadragonsz).
