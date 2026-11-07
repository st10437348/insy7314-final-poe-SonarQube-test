# HustleHub+ Development Setup

This guide explains how to set up HustleHub+ for local development using React (Vite), Express, MongoDB, migrations, seed data, and HTTPS with OpenSSL.

---

## Prerequisites

Install the following before starting:

* Node.js (LTS)
* Git
* OpenSSL (Windows)
* MongoDB Community Server running locally, or a MongoDB Atlas connection string
* Visual Studio Code or Visual Studio 2022

---

## Project Structure

```text
HustleHubPlus/
│
├── client/                  # React (Vite) frontend
├── server/                  # Express API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── scripts/
│
├── migrations/              # MongoDB migrations
├── .env                     # Local secrets/configuration
├── .env.example             # Example environment configuration
├── package.json
├── README.md
└── SETUP.md
```

---

## Clone the Repository

```bash
git clone <repository-url>

cd HustleHubPlus
```

---

# Frontend Setup

Navigate to the React project:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside `client/`.

```env
VITE_API_URL=https://localhost:5000
VITE_APP_NAME=HustleHub+
```

> Do not put passwords, JWT secrets, MongoDB credentials, or other server-side secrets in the Vite `.env` file. `VITE_` variables are exposed to the browser.

Start the frontend:

```bash
npm run dev
```

The frontend will run on:

```text
https://localhost:5173
```

---

# Backend Setup

From the project root, navigate to the server:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create the backend `.env` file in the **project root**, not inside `server/`.

The structure should be:

```text
HustleHubPlus/
├── .env
├── client/
└── server/
```

Example `.env`:

```env
PORT=5000

USE_HTTPS=true

CLIENT_ORIGIN=https://localhost:5173

SSL_KEY_PATH=./server/certificates/localhost-key.pem
SSL_CERT_PATH=./server/certificates/localhost-cert.pem

MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=HustleHubPart2Local

JWT_SECRET=<your long random JWT secret>
JWT_EXPIRES_IN=1h
```

Never commit real secrets to Git.

---

# Environment Variables

The repository should contain an `.env.example` file containing placeholders only.

Example:

```env
PORT=5000
USE_HTTPS=true

CLIENT_ORIGIN=https://localhost:5173

SSL_KEY_PATH=./server/certificates/localhost-key.pem
SSL_CERT_PATH=./server/certificates/localhost-cert.pem

MONGO_URI=
MONGO_DB_NAME=HustleHubPart2Local

JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=1h
```

The real `.env` file must be included in `.gitignore`:

```text
.env
.env.*
!.env.example
```

---

# Generate Local HTTPS Certificates

From the `Project` directory, generate a local certificate for both Vite and Express:

```bash
npm run generate-cert
```

The script saves the key and certificate in `server/certificates/` (ignored by Git).
Start both applications from the `Project` directory:

```bash
npm run dev
```

The frontend runs at `https://localhost:5173` and the API at `https://localhost:5000`.

---

# Trust the Certificate (Optional)

To remove browser certificate warnings:

1. Double-click `localhost-cert.pem`.
2. Select **Install Certificate**.
3. Choose **Current User** or **Local Machine**.
4. Select **Trusted Root Certification Authorities**.
5. Complete the certificate installation.
6. Restart the browser if necessary.

---

# MongoDB

This machine is configured to use a separate local database named `HustleHubPart2Local`. If you later obtain an Atlas URI, replace `MONGO_URI` in the ignored `Project/.env` and choose a development database name in `MONGO_DB_NAME`.

The main collections are:

```text
users
gigs
bookings
transactions
```

Additional collections such as categories and reviews can be added as the application develops.

The MongoDB connection string is stored in:

```text
MONGO_URI
```

Do not commit the connection string to Git.

---

# Database Migrations

Database changes are managed using `migrate-mongo`.

From the project root:

```bash
npx migrate-mongo status
```

To apply pending migrations:

```bash
npx migrate-mongo up
```

Current migrations create database indexes for:

```text
users
gigs
bookings
transactions
```

Do not manually create these indexes when an equivalent migration already exists.

---

# Development Seed Data

Development data is created using the seed script.

From the server directory:

```bash
npm run seed
```

The seed script creates development users, gigs, bookings, and transactions.

The development seed includes accounts for:

```text
Client
Freelancer
Freelancer
Admin
```

The seed script clears the existing development users, gigs, bookings, and transactions before recreating them. It refuses to run in production or against a database whose name does not contain `local`, `dev`, or `test`.

> Only run the seed script against the development database. Do not run it against a production database.

---

# Authentication and Security

The backend is responsible for authentication and authorization.

The project should use:

* HTTPS
* Helmet security headers
* CORS restricted to the frontend origin
* JWT authentication
* HttpOnly cookies for JWT sessions
* Secure cookies in production
* Appropriate `SameSite` cookie configuration
* bcrypt password hashing
* Rate limiting on authentication endpoints
* Request validation
* Role-based authorization
* MongoDB/ObjectId validation
* Protected API routes

## JWT Security

The JWT should **not** be returned to the React application for storage in:

```text
localStorage
sessionStorage
```

Instead, the API should set the JWT in an HttpOnly cookie.

The browser automatically sends the cookie with appropriate API requests.

The frontend should restore the session through:

```text
GET /api/auth/me
```

Logout should be handled through:

```text
POST /api/auth/logout
```

The frontend must not be responsible for deciding whether a user is authorized to perform an API operation.

---

# Authentication Roles

HustleHub+ supports:

```text
Client
Freelancer
Admin
```

Public registration must only allow:

```text
Client
Freelancer
```

Users must not be able to select `Admin` during public registration.

Admin authorization must be enforced by the backend.

Hiding an admin link in React is not sufficient security.

---

# API Authorization

The backend must enforce authorization for protected resources.

For example:

```text
Client
 └── Can access their own bookings

Freelancer
 └── Can manage their own gigs
 └── Can access their own bookings
 └── Can access their own transactions

Admin
 └── Can access administrative functionality
```

The API must verify resource ownership.

For example, a freelancer should not be able to modify another freelancer's gig simply by changing the gig ID in the URL.

---

# CORS

CORS should be restricted to the configured frontend origin.

Example:

```text
CLIENT_ORIGIN=https://localhost:5173
```

Avoid allowing unrestricted origins such as:

```text
*
```

when credentials/cookies are being used.

---

# Gig locations

Freelancers enter a plain address when creating or editing a gig. Bookings keep a snapshot of that address so later gig edits do not change historical bookings.

If you already have data from the earlier form with Google Place IDs and coordinates, run `npm run upgrade-local-data` from `Project/server`. This updates transaction statuses to match bookings and removes the obsolete location fields from the local development database.

---

# Running the Application

## Option 1 — Run everything from the project root

```bash
npm run dev
```

This starts the frontend and backend according to the root project's configured scripts.

## Option 2 — Run the backend separately

```bash
cd server
npm run dev
```

## Option 3 — Run the frontend separately

```bash
cd client
npm run dev
```

---

# Development Workflow

1. Pull the latest changes.

2. Install dependencies if required:

```bash
npm install
```

3. Make sure the local `.env` exists.

4. Make sure your local MongoDB service is running, or configure an Atlas URI in `Project/.env`.

5. Check migrations:

```bash
npx migrate-mongo status
```

6. Apply pending migrations:

```bash
npx migrate-mongo up
```

7. Seed the development database when required:

```bash
cd server
npm run seed
```

8. Start the API:

```bash
npm run dev
```

9. Start the React frontend:

```bash
cd client
npm run dev
```

10. Develop using HTTPS locally.

---

# Important Security Rules

Never commit:

```text
.env
MongoDB credentials
JWT secrets
Firebase private credentials
API secrets
SSL private keys
```

Never store passwords as plaintext.

Never store JWTs in `localStorage`.

Never allow users to self-register as Admin.

Never rely on React to enforce authorization.

Always validate and authorize requests on the API.

Use HTTPS when testing authentication and cookies locally.
