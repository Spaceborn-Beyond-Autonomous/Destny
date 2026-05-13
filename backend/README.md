# Destiny Backend Boilerplate

Production-ready backend boilerplate built with Node.js, Express.js, and MongoDB (Mongoose) using JavaScript ES Modules and scalable MVC architecture.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- MVC + Service Layer

## Project Structure

```text
backend/
  src/
    app.js
    server.js
    config/
      database.js
      env.js
    controllers/
      authController.js
      userController.js
    middlewares/
      auth.js
      errorHandler.js
      notFound.js
    models/
      User.js
    routes/
      authRoutes.js
      index.js
      userRoutes.js
    services/
      authService.js
      userService.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
  .env.example
  .gitignore
  package.json
  README.md
```

## Setup

```bash
cd backend
npm install
npm run dev
```

## Install Command (direct)

```bash
npm install express mongoose dotenv cors helmet morgan bcryptjs jsonwebtoken && npm install -D nodemon
```

## Scripts

- start: `node src/server.js`
- dev: `nodemon src/server.js`

## Environment Variables

Copy `.env.example` to `.env` and update values.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/destiny
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

