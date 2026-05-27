# Bismilla Fruit Juice Shop - Web Application

A premium, responsive, full-stack web application for **Bismilla Fruit Juice**, designed for seamless natural juice ordering, secure online/offline checkout validation, and interactive admin control metrics.

---

## 🌟 Features

- **Vibrant Premium UI:** Interactive cards, responsive layout, glassmorphic controls, and smooth animations using Framer Motion.
- **Cart System:** Persistent cart sidebar drawer with active unit controls.
- **Distance Checker:** Automatic verification of user coordinates against shop coordinates (limitations set to a 10KM delivery radius). Fits dual mechanisms (real Google Maps distance matrix & mathematically secure Haversine fallback).
- **Dual Checkout:** Support for secure Cash on Delivery (COD) and Razorpay checkout script overlays.
- **Order Tracking:** Visual timeline of order status updates (Pending ➔ Preparing ➔ Out for Delivery ➔ Delivered).
- **Admin Dashboard Console:** Secure access interface. Features summary metrics cards, SVG/Recharts sales curves, database inventory tables (CRUD with image uploads), and status dropdowns for deliveries.
- **WhatsApp Order Integration:** Clicking "WhatsApp Confirmation" automatically formats purchase information and targets Imran's WhatsApp business line (`+91 79896 46180`).

---

## 📂 Tech Stack

- **Frontend:** React.js (Vite template), Tailwind CSS (v3), Framer Motion, Recharts.
- **Backend:** Node.js, Express.js (MVC pattern).
- **Database / Auth / Storage:** Supabase (PostgreSQL, Auth endpoints, and Image storage).
- **Payments:** Razorpay Web SDK and Node SDK signatures.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Supabase Setup

1. Create a free account on [Supabase](https://supabase.com/).
2. Create a new project named `Bismilla Fruit Juice`.
3. Go to the **SQL Editor** tab in your Supabase dashboard and click **New Query**.
4. Copy the entire contents of [schema.sql](file:///c:/Users/Sampath/Desktop/bisfruitjuice/backend/schema.sql) and paste it into the editor. Click **Run**.
   - This creates all required tables: `profiles`, `products`, `orders`, `order_items`, `addresses`, and `payments`.
   - It configures triggers to sync your user profiles and inputs initial seed inventory data for all 10 fruit juices.
5. Go to the **Storage** tab, create a new bucket named **`juice-images`**, and set its access level to **Public** (so anyone can view uploaded images). Make sure to check the public access checkbox.
6. Go to **Project Settings** ➔ **API** to copy your **Project URL**, **Anon Public Key**, and **Service Role Secret Key** (service role is required for the Express backend, while anon key is for the React frontend).

### 2. Razorpay Setup

1. Create a free test account on [Razorpay](https://razorpay.com/).
2. Go to **Account & Settings** ➔ **API Keys** and click **Generate Key**.
3. Copy the **Key ID** (`rzp_test_...`) and **Key Secret**.
4. Keep the credentials ready to write into your `.env` configuration.

---

## 🚀 Local Run Guide

### Backend Configuration

1. In the `backend` directory, create a `.env` file (copied from `.env.example`):
   ```bash
   PORT=5000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   SHOP_LATITUDE=17.385044
   SHOP_LONGITUDE=78.486671
   DELIVERY_RADIUS_KM=10.0
   ```
2. Start the Express server:
   ```bash
   cd backend
   npm run start
   # or for hot-reloading development:
   # npm run dev
   ```

### Frontend Configuration

1. In the `frontend` directory, create a `.env` file:
   ```bash
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   # Google Maps API key (optional - if omitted, automatic coordinates simulator is used)
   VITE_GOOGLE_MAPS_API_KEY=
   ```
2. Run the Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser to the local URL (usually `http://localhost:5173/`).

---

## 💡 Mock & Test Guidelines (Bypass Keys)

- **Mock Credentials Mode:** If you do not configure your Supabase `.env` variables, the app will automatically fall back to **Mock Authentication Mode**. You can sign up with any mock account or instantly log in as Imran the admin by using email `imran@juice.com` (any password will bypass verification).
- **Mock Payment Mode:** If Razorpay keys are omitted or set to placeholders, the payment gateway runs in test/mock mode. Triggering checking will run through a simulated transaction capturing flow that records transaction success in your DB without charging real funds.
- **Distance Checker Simulator:** On the checkout screen, click the **Locate Me (GPS)** button to automatically fetch your current location. To simulate delivery limits, use the quick simulation buttons:
  - Click **Within 10KM (Demo)** to simulate coordinates near the shop (checkout and online payments enabled).
  - Click **Outside 10KM (Demo)** to simulate coordinates far from the shop (checkout disabled, error banner displayed).
