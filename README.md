# Destny

Destny is a full-stack web app for MVP development and 3D printing services. It includes a public marketing site, authenticated 3D printing quote and order flows, user order/quote tracking, admin dashboards, file uploads to Google Drive, real-time chat, and Razorpay payment support.

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI / shadcn-style components
- React Router
- TanStack React Query
- Axios
- Socket.IO client
- Framer Motion

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication with cookies
- Socket.IO
- Google Drive API uploads
- Razorpay payments

## Project Structure

```text
Destny-main/
  frontend/        React + Vite client app
  backend/         Express + MongoDB API server
  README.md        Project documentation
```

## Features

- Landing page for Destny services
- Protected 3D printing page with file upload and instant quote flow
- User authentication and protected routes
- Customer order and quote history
- Admin dashboard for orders, quotes, customers, file handling, payments, and status updates
- Order and quote chat flows
- Google Drive-backed file uploads
- Razorpay payment order creation and verification

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Google Drive OAuth credentials for uploads
- Razorpay keys if payment features are enabled

## Environment Variables

Create a `.env` file in `backend/`:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017
CLIENT_URL=http://localhost:5173

ACCESS_TOKEN_SECRET=replace_with_access_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace_with_refresh_secret
REFRESH_TOKEN_EXPIRY=10d

GDRIVE_CLIENT_ID=replace_with_google_client_id
GDRIVE_CLIENT_SECRET=replace_with_google_client_secret
GDRIVE_REFRESH_TOKEN=replace_with_google_refresh_token
GDRIVE_FOLDER_ID=replace_with_drive_folder_id

RAZORPAY_KEY_ID=replace_with_razorpay_key_id
RAZORPAY_KEY_SECRET=replace_with_razorpay_key_secret
```

Create a `.env` file in `frontend/`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

## Getting Started

Install dependencies for both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```

The backend runs at:

```text
http://localhost:4000
```

## Scripts

### Backend

```bash
npm run dev      # Start API with nodemon
npm start        # Start API with node
```

### Frontend

```bash
npm run dev        # Start Vite dev server
npm run build      # Build production frontend
npm run preview    # Preview production build
npm run typecheck  # Run TypeScript checks
```

## Main Routes

### Frontend

- `/` - Landing page
- `/3d-printing` - Protected 3D printing service page
- `/auth` - Login and registration
- `/orders` - User orders
- `/quotes` - User quotes
- `/dashboard` - Admin dashboard
- `/dashboard/customers/:mode/:customerKey/orders` - Admin customer orders view

### Backend

- `GET /` - Backend health message
- `/api/v1/users` - Authentication and user routes
- `/api/v1/upload` - File upload routes
- `/api/v1/orders` - Order, payment, dashboard, and chat routes
- `/api/v1/quotes` - Quote and quote chat routes
- `/api/v1/customers` - Customer management routes

## Build

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend in production mode:

```bash
cd backend
npm start
```

## Notes

- The backend appends the database name `destny` to `MONGODB_URI`, so use a base MongoDB URI such as `mongodb://127.0.0.1:27017`.
- Cookies are used for authentication. Keep `CLIENT_URL` and `VITE_BACKEND_URL` aligned with the frontend and backend origins.
- Google Drive upload and Razorpay payment flows require valid external service credentials.
