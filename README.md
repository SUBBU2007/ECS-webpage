# Queue Management System

This project is a multi-counter Queue Management System designed to handle customer queues efficiently. It features a React frontend, a Node.js/Express backend, and a Supabase database for real-time data synchronization.

## Features

- **Multi-Counter Support**: Manage queues for several different service counters simultaneously.
- **Real-Time Updates**: UI updates instantly across all pages (Customer, Admin, Display) using Supabase real-time features.
- **Customer Portal**: Customers can select a service and get a queue token.
- **Admin Portal**: Admins can monitor and manage all counters from a tabbed interface, serving the next customer in line.
- **Camera Integration**: An endpoint is available for an external camera system to feed live data about queue length and estimated wait times.

If you want to work locally using your own IDE, you can clone this repo and push changes.

- **Frontend**: Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)

## Getting Started

### Prerequisites

- [Node.js and npm](https://nodejs.org/en/) (use of `nvm` is recommended)
- A Supabase account and a new project created.

### 1. Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Set up Supabase

1.  In your Supabase project, navigate to the **SQL Editor** and create a "New query".
2.  Copy the entire content of `supabase/migrations/20251013061053_create_queue_management_schema.sql` and run it to set up your database tables.
3.  Navigate to **Settings** > **API**. Find your Project URL and your `anon` public key.

### 3. Configure Environment Variables

You'll need to set up environment variables for both the frontend and the backend.

**For the Backend:**

1.  In the `server/` directory, create a `.env` file by copying the example:
    ```sh
    cp server/.env.example server/.env
    ```
2.  Edit `server/.env` and add your Supabase credentials:
    ```
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

**For the Frontend:**

1.  In the root directory, create a `.env` file.
2.  Add your Supabase credentials so the client-side app can connect to the real-time service:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

### 4. Install Dependencies

```sh
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 5. Run the Application

You need to run both the frontend and backend servers concurrently.

**To run the backend server:**

```sh
cd server
npm start  # Or npm run dev if you set that up
# The backend will run on http://localhost:3001
```

**To run the frontend dev server:**

```sh
# In the root directory
npm run dev
# The frontend will be available at http://localhost:5173
```

Now you can open your browser to `http://localhost:5173` to use the application.
