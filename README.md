# Orbi Shop

Orbi Shop is a modern, full-stack e-commerce marketplace platform tailored for seamless buying, selling, and marketplace administration. It integrates features like Supabase for authentication, Cloudflare R2 for asset storage, Gemini AI for smart capabilities, and the Orbi Talk gateway for real-time customer engagement.

## Features

- **Client App**: Seamless shopping experience for buyers with product browsing, smart search, and checkout.
- **Seller App**: Dedicated portal for merchants to manage their products, orders, and promotional campaigns.
- **Admin App**: Complete operational control over the marketplace, user management, and system configuration.
- **AI-Powered**: Integrates Gemini for dynamic recommendations, smart product descriptions, and automated pilot tools.

## Architecture

This project uses a full-stack architecture running on Node.js:
- **Frontend**: React 18 with Vite, styled with Tailwind CSS.
- **Backend**: Express.js server providing robust API routes.
- **Database / Auth**: Supabase (PostgreSQL) for persistence and authentication.
- **Storage**: Cloudflare R2 (S3-compatible object storage) for product images and assets.
- **AI**: Google Gemini API for intelligent features.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Supabase account and project
- Cloudflare R2 storage bucket
- Google Gemini API key

### 1. Installation

Install the dependencies using npm:

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and populate it based on `.env.example`:

```env
# Gemini AI
GEMINI_API_KEY="your_gemini_api_key"

# App URL
APP_URL="http://localhost:3000"

# Supabase Auth Configuration
VITE_SUPABASE_URL="your_supabase_project_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Database Encryption Key (Must be exactly 32 chars)
ENCRYPTION_KEY="your_32_character_secret_key"

# Orbi Talk Gateway Configuration
ORBI_TALK_GATEWAY_URL="https://talk.orbifinancial.com"
ORBI_SHOP_TALK_API_KEY="your_talk_api_key"
ORBI_SHOP_TALK_OWNER_UID="your_talk_owner_uid"
ORBI_SHOP_TALK_OWNER_EMAIL="shop@orbifinancial.com"

# Cloudflare R2 Storage (S3 Compatible)
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_ACCESS_KEY_ID="your_cloudflare_access_key"
CLOUDFLARE_SECRET_ACCESS_KEY="your_cloudflare_secret_key"
CLOUDFLARE_BUCKET_NAME="orbishop-storage"
CLOUDFLARE_PUBLIC_URL_PREFIX="https://your-public-url.com"
```

### 3. Running Locally

Start the development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`. 
The Express backend handles API requests under `/api/v1/*` and `/api/*`, and Vite serves the React frontend.

## Project Structure

- `/src`: Frontend React application code.
  - `/pages/ClientApp`: Buyer interface.
  - `/pages/SellerApp`: Merchant portal.
  - `/pages/AdminApp`: Marketplace administration.
  - `/components`: Shared UI components.
  - `/lib`: Frontend utilities and helpers.
- `/server.ts`: Main Express application entry point.
- `/server/routes`: Express API route definitions.
  - `auth.ts`: Authentication flows.
  - `products.ts`: Product catalog management.
  - `orders.ts`: Order processing and fulfillment.
  - `search.ts`: Intelligent search and filtering.
  - `promotions.ts`: Ad placements and marketing tools.
  - `storage.ts`: File upload handling to Cloudflare R2.

## Deployment

The application is configured to be deployed as a single, compiled Node.js service (Express serving the Vite SPA build).

### Build for Production

1. Compile the application:
   ```bash
   npm run build
   ```
   This command bundles the React frontend into `dist/` and compiles the Express backend into `dist/server.cjs`.

2. Start the production server:
   ```bash
   npm run start
   ```

### Deploying to Railway

Railway is the active production host for ORBI Shop. The repository includes `railway.json`, which tells Railway to build from the Dockerfile, start with `npm start`, and health-check `/api/health`.

1. Connect the Railway service to this GitHub repository and branch `main`.
2. Add the production environment variables in Railway Variables.
3. Do not set `PORT`; Railway injects it automatically and the server reads `process.env.PORT`.
4. Deploy from Railway after every pushed change and confirm `https://shop.orbifinancial.com/api/health` returns healthy JSON.

Legacy deployment paths are intentionally removed to prevent routing and environment conflicts.

## API Overview

The backend exposes several modular REST API endpoints:
- `GET /api/v1/products`: Retrieve product catalog.
- `GET /api/v1/search/popular`: Get trending search terms.
- `POST /api/v1/storage/upload`: Upload media to R2.
- `POST /api/checkout`: Process a purchase.
- `GET /api/ai/assistant`: Interact with the Orbi shopping assistant.

Detailed route implementations can be found in the `/server/routes/` directory.
