# 🎆 CHENG-BOOM — Premium Fireworks E-Commerce & Admin Platform

Welcome to **Cheng-BOOM**, a modern, state-of-the-art e-commerce platform and administrative suite designed specifically for premium pyrotechnics and fireworks retailers. 

This system features a high-end storefront, a localized customer experience (supporting **English, Chinese, and Malay**), a comprehensive order management pipeline, dynamic catalog control, and a customizable dark-mode-first Administrator Portal.

---

## 🛠️ Tech Stack at a Glance

*   **Frontend & Core Framework**: [Next.js](https://nextjs.org/) (React 19)
*   **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) (smooth micro-animations & layout transitions)
*   **Database ORM**: [Prisma](https://www.prisma.io/)
*   **Database hosting**: [Neon Serverless PostgreSQL](https://neon.tech/)
*   **Media Hosting**: [Cloudinary](https://cloudinary.com/) (handles catalog image uploads)
*   **Emails & Notifications**: [Nodemailer](https://nodemailer.com/) (SMTP delivery for automated order receipt notifications)
*   **Authentication**: [Jose](https://github.com/panva/jose) (Stateless JWT token authentication for routes and API middleware protection)

---

## 📋 Prerequisites

Before running this system, ensure you have the following installed and configured:

1.  **Node.js**: `v18.x` or `v20.x` or higher (recommended).
2.  **PostgreSQL Database**: Either a local PostgreSQL instance or a serverless cloud instance (like [Neon.tech](https://neon.tech/)).
3.  **Cloudinary Account**: A free account is sufficient to handle image uploads for products and categories.
4.  **Gmail Account** (or other SMTP service): Required to send out instant email receipts and order notifications.

---

## 🚀 Quick Start Guide

Follow these steps to set up the system and run it locally.

### Step 1: Clone or Open the Project
Open your workspace terminal inside the `firework-project` directory.

### Step 2: Install Dependencies
Run the package installer to download all dependencies:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the template configuration file and name it `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials. (See the [Environment Variables](#-environment-variables-guide) section below for detailed setup details.)

### Step 4: Verify Database Connection
Run the pre-configured database connection tester to ensure your `.env` connection string is correct and can connect successfully:
```bash
node scripts/test-db.js
```

### Step 5: Synchronize Database Schema
Push the Prisma schema definition directly to your database. This will create all the necessary tables (Admin, Product, Category, Customer, Order, OrderItem):
```bash
npx prisma db push
```

Generate the Prisma Client types:
```bash
npx prisma generate
```

### Step 6: Initialize Admin User (Choose One)

To log in to the admin panel (`/admin/dashboard`), you must initialize an administrative user. You can do this in one of two ways:

#### Option A: Seed via HTTP Setup Endpoint (Recommended)
1. Start the development server (Step 7 below).
2. Open your web browser or an API tester (like Postman) and navigate to:
   `http://localhost:3000/api/admin/setup`
3. If successful, you will see a JSON response: `{"message": "Admin seeded successfully", "username": "admin"}`.
4. This creates a default administrator:
   * **Username**: `admin`
   * **Password**: `Password123!`

#### Option B: Raw SQL Seeding (Via Database Console)
Run the queries inside [prisma/seed.sql](file:///c:/Users/Bryan/firework-project/prisma/seed.sql) using your database editor, Neon SQL Console, or `psql` to upsert the default admin user with a pre-hashed bcrypt password.

### Step 7: Run the Development Server
Start the Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience the front-end client, or navigate to [http://localhost:3000/login](http://localhost:3000/login) to login as a Customer or Admin.

---

## 🔑 Environment Variables Guide

Your `.env` file should contain the following variables:

| Variable Name | Description | Example / Instructions |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@ep-host.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key used to sign Auth tokens | Any strong random string, e.g., `super-secret-key-123-replace-me` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Product identifier | Retrieve from your Cloudinary Dashboard under *Product Environment Settings* |
| `CLOUDINARY_API_KEY` | Cloudinary credentials identifier | Retrieve from your Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary secure secret key | Retrieve from your Cloudinary Dashboard |
| `SMTP_USER` | Email address sending receipts | `bryancheng3396@gmail.com` (Your SMTP sender email) |
| `SMTP_PASS` | Secure App Password for sending emails | E.g. `rntx xxpi kdqf dovd` (**Important**: For Gmail, this must be a 16-character **App Password**, *not* your standard email account login password) |

### 💡 Detailed Provider Guides

#### 1. Database (PostgreSQL / Neon)
If using [Neon](https://neon.tech):
1. Sign up/Log in and create a new project.
2. Under "Connection String", choose **Node.js** or **Prisma**.
3. Select the `Pooled connection` if utilizing Prisma serverless connections, copy the URL, and paste it into `DATABASE_URL` inside `.env`.

#### 2. Media hosting (Cloudinary)
1. Register for a free account at [Cloudinary](https://cloudinary.com/).
2. On your main Console home page, look for the section **Product Environment Credentials**.
3. Copy the **Cloud Name**, **API Key**, and **API Secret** into your `.env` variables accordingly.
4. Images uploaded via the Admin Products Panel will automatically save to this account.

#### 3. Transactional Emails (Gmail SMTP Setup)
If using Gmail to send automatic order receipt notifications:
1. Log in to your Google Account.
2. Go to **Security** -> **2-Step Verification** (make sure it is turned ON).
3. Search or scroll to the bottom to find **App passwords**.
4. Create a new App Password (e.g. name it `Cheng-BOOM SMTP`), then copy the generated 16-character code (format: `xxxx xxxx xxxx xxxx`).
5. Use this code as your `SMTP_PASS` in your `.env` file. Do not include spaces.

---

## 📂 Project Directory Structure

```text
firework-project/
├── prisma/
│   ├── schema.prisma       # Database models (Admin, Products, Orders, Customers)
│   ├── seed.sql            # Core seed SQL query (Admin upsert)
│   └── seed.ts             # Custom tsx-based Prisma seed controller
├── scripts/
│   └── test-db.js          # Direct PostgreSQL Connection testing script
├── src/
│   ├── components/         # Reusable layouts, cards, inputs, and UI components
│   │   ├── admin/          # Admin-specific panels & widgets
│   │   └── layout/         # General wrappers like Navigation bar & Footer
│   ├── context/            # Global React states (e.g., LanguageContext)
│   ├── lib/
│   │   ├── cloudinary.ts   # Configured Cloudinary media storage client
│   │   ├── email.ts        # Nodemailer template engine and dispatcher
│   │   └── prisma.ts       # Singleton instance of Prisma Client
│   ├── middleware.ts       # Route guard middleware (prevents unauthenticated admin access)
│   ├── pages/              # Routing pages
│   │   ├── admin/          # Back-office administration screens (Dashboard, Category, Customer)
│   │   ├── api/            # API Route endpoints
│   │   │   ├── admin/      # Setup, logins, profile configs, and media uploads
│   │   │   ├── auth/       # Member and Guest authentication controllers
│   │   │   └── categories/ # Category listings
│   │   └── index.tsx       # Landing Storefront
│   └── utils/
│       ├── adminAuth.ts    # JWT token signing & verifying utils
│       └── locales/        # JSON Translations: en.json, zh.json, ms.json
├── .env.example            # Empty configuration template for setup
├── package.json            # Available dependencies and npm scripts
└── tsconfig.json           # TypeScript compilation config
```

---

## 🚀 Available CLI Scripts

*   `npm run dev`: Starts the Next.js development server in hot-reload mode.
*   `npm run build`: Compiles the React + Next.js frontend code for optimal production execution.
*   `npm run start`: Runs the built production server locally.
*   `npm run lint`: Verifies ESLint syntax compliance.
*   `node scripts/test-db.js`: Tests database network routing and credentials connectivity.
*   `npx prisma db push`: Synchronizes state from schema definition directly to database.
*   `npx prisma studio`: Spawns a database viewer GUI on your local host (usually `localhost:5555`) to view and modify raw table entries directly.
