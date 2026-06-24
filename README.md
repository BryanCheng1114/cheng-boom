# Cheng-BOOM

A full-stack e-commerce and business management platform built for a Malaysian retail/wholesale business. The system provides a public-facing customer storefront and a private admin dashboard, running from a single Next.js codebase.

---

## Features

### Customer Storefront
- Product catalog browsing by category
- Multi-variant product pricing: Single, Box, and Bundle
- Add to cart with real-time stock enforcement
- Guest checkout (no account required)
- Member registration with email OTP verification
- Google OAuth login
- Customer profile with order history
- Payment receipt photo upload at checkout
- Automated order receipt via email

### Admin Dashboard
- Overview dashboard with live KPIs (revenue, orders, inventory, customers)
- Revenue analytics with period filtering and charts
- Product inventory management (add, edit, bulk delete)
- Bulk product upload via Excel + image folder
- Category management with banners
- Order management with status updates
- Customer management and Member-to-Seller promotion
- Seller tier system with configurable discount percentages
- Business settings panel (logo, colors, social links, payment QR codes)
- Export to CSV, Excel, and PDF
- Dark/Light theme and multilingual admin UI (English / Chinese)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Pages Router) |
| Language | TypeScript 5 |
| Frontend | React 19, Tailwind CSS v4, Framer Motion |
| Charts | Recharts |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon serverless) |
| Auth (Admin) | JWT via jose, HttpOnly cookie |
| Auth (Customer) | localStorage session + Google OAuth |
| Image Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| File Uploads | Multer |
| Deployment | Vercel |

---

## System Architecture

`
User (Browser)
     |
     | HTTP JSON requests
     v
Next.js Pages Router
     |
     |-- /pages/*.tsx         React UI (client-rendered)
     |
     +-- /pages/api/**/*.ts  Serverless API handlers
              |
              |-- Input validation + Auth check
              |-- Prisma ORM -> PostgreSQL (Neon)
              |-- Cloudinary (image uploads)
              |-- Nodemailer (email receipts/OTPs)
              +-- JSON response to client
`

---

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Cloudinary account
- Gmail App Password
- Google Cloud OAuth 2.0 credentials

### Clone & Install

`ash
git clone https://github.com/your-username/firework-project.git
cd firework-project
npm install
`

---

## Environment Setup

`ash
cp .env.example .env
`

Fill in your .env:

`env
DATABASE_URL=postgresql://username:password@hostname:port/dbname?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_gmail_app_password
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
`

---

## Database Setup

`ash
npx prisma migrate dev --name init
npx prisma db seed
`

---

## Running Locally

`ash
npm run dev
`

- Storefront: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

---

## API Reference

### Admin Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/admin/login | Admin login (HttpOnly JWT cookie) |
| POST | /api/admin/logout | Clear session |
| GET | /api/admin/profile | Get admin profile |
| PATCH | /api/admin/profile | Update theme or language |

### Customer Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/send-otp | Send OTP to email |
| POST | /api/auth/register | Register with OTP |
| POST | /api/auth/login | Login with phone/email + password |
| POST | /api/auth/google | Login/register via Google OAuth |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/products | List all products |
| POST | /api/products | Create product |
| DELETE | /api/products | Bulk delete by IDs |
| GET | /api/products/[id] | Get product |
| PATCH | /api/products/[id] | Update product |
| DELETE | /api/products/[id] | Delete product |
| POST | /api/products/bulk | Bulk upload from Excel + images |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PATCH | /api/categories/[id] | Update category |
| DELETE | /api/categories/[id] | Delete category |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/orders | List all orders |
| POST | /api/orders | Place order (atomic stock deduction) |
| GET | /api/orders/[id] | Get order |
| PATCH | /api/orders/[id] | Update order status |

### Customers & Sellers
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/customers | List all customers |
| GET | /api/customers/[id] | Get customer with orders |
| PATCH | /api/customers/[id] | Update customer |
| GET | /api/sellers | List sellers with purchase totals |
| PATCH | /api/sellers/[id] | Update seller level or status |

### Seller Levels
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/seller-levels | List tiers |
| POST | /api/seller-levels | Create tier |
| PATCH | /api/seller-levels/[id] | Update tier |
| DELETE | /api/seller-levels/[id] | Delete tier |

### Utilities
| Method | Endpoint | Description |
|---|---|---|
| GET/PATCH | /api/business-settings | Business identity config |
| POST | /api/upload | Upload image to Cloudinary |
| POST | /api/contact | Submit contact form |

---

## Folder Structure

`
firework-project/
|-- prisma/                  Schema, migrations, seed
|-- public/                  Static assets
|-- src/
|   |-- assets/              Global CSS
|   |-- components/          UI components (admin, cart, checkout, layout)
|   |-- context/             React Context (Business, Language)
|   |-- hooks/               Custom hooks
|   |-- lib/                 Prisma client, Cloudinary, email
|   |-- pages/               Next.js pages and API routes
|   |   |-- admin/           Admin panel pages
|   |   |-- api/             Serverless endpoints
|   |   +-- shop/            Product detail pages
|   |-- services/            External service utilities
|   +-- utils/               Helper functions
+-- .env.example             Environment variable template
`

---

## Future Improvements

- Add Next.js middleware.ts to enforce JWT on all /admin/* routes server-side
- Implement rate limiting on login and OTP endpoints
- Complete Malay language translations
- Refactor SharedCheckoutModal.tsx into smaller components
- Add HttpOnly cookie sessions for customers
- Add pagination to admin product and order lists
- Add unit and integration tests for API routes

---

## Author

**Bryan Cheng**
GitHub: https://github.com/BryanCheng1114
