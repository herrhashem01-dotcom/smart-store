# Smart Store Assistant — Setup Guide

A complete walkthrough to get this app live on the internet and installed on your phone.
No coding experience needed — just follow each step in order.

---

## What You Need (all free except one)

| Service | Purpose | Cost |
|---|---|---|
| GitHub | Stores your code | Free |
| Vercel | Hosts your app online | Free |
| Supabase | Database, login, file storage | Free |
| Anthropic | Powers the AI assistant | ~$5/month usage |

---

## STEP 1 — Upload this code to GitHub

1. Go to **github.com** → sign up if you haven't already (free)
2. Click the **"+"** icon top-right → **"New repository"**
3. Name it `smart-store` → set it to **Private** → click **"Create repository"**
4. On the new (empty) repo page, click **"uploading an existing file"** (a blue link in the middle of the page)
5. On your computer, **unzip** the file I gave you — you'll get a folder called `smart-store` full of files and subfolders
6. **Drag the entire contents of that unzipped folder** (not the zip itself — open it first, then select everything inside) into the GitHub upload box
7. Wait for the upload to finish, then scroll down and click **"Commit changes"**

Your code is now on GitHub. ✅

---

## STEP 2 — Set up Supabase (your database)

1. Go to **supabase.com** → sign up → click **"New Project"**
2. Name it `smart-store`, set a database password (save it somewhere), pick a region near Jordan
3. Wait ~2 minutes for setup to finish

### Run the database schema
4. In the left sidebar, click **SQL Editor** → click **"New query"**
5. Open the file `supabase/migrations/001_schema.sql` from your unzipped folder, copy all its content
6. Paste it into the Supabase query box → click **"Run"**
7. You should see **"Success. No rows returned"**

### Create storage buckets (for product/invoice photos — used in future updates)
8. In the left sidebar, click **Storage** → click **"New bucket"**
9. Create one named `product-images`, toggle **Public bucket** ON
10. Create a second named `invoice-scans`, leave it **Private**

### Get your API keys
11. In the left sidebar, click **Settings → API**
12. Copy the **Project URL** and the **anon public key** — paste them somewhere temporary, you'll need them in Step 4

### Turn off email confirmation (recommended for fastest setup)
13. Go to **Authentication → Providers → Email**
14. Turn **OFF** "Confirm email" — this means new accounts work instantly without checking inbox
   *(You can turn this back on later if you want extra security)*

---

## STEP 3 — Get your Anthropic API key

1. Go to **console.anthropic.com** → sign up
2. Click **API Keys** → **"Create Key"** → copy it immediately (you won't see it again)
3. Go to **Plans & Billing** → add a small amount of credit (e.g. $5) — this covers months of AI chat usage for a small store

---

## STEP 4 — Deploy to Vercel

1. Go to **vercel.com** → sign up using **"Continue with GitHub"**
2. Click **"Add New" → "Project"**
3. Find your `smart-store` repo → click **"Import"**
4. Before clicking Deploy, expand **"Environment Variables"** and add these three, one at a time:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | (from Step 2.12) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Step 2.12) |
| `ANTHROPIC_API_KEY` | (from Step 3.2) |

5. Click **"Deploy"**
6. Wait 2–3 minutes — when it's done, click **"Visit"**

Your app is now live at a URL like `smart-store-yourname.vercel.app`. 🎉

---

## STEP 5 — Create your store account

1. Open your Vercel URL
2. Click **"إنشاء حساب" / "Create Account"**
3. Enter your store name, email, and a password
4. You're in — the dashboard, products, and AI assistant are ready to use

---

## STEP 6 — Install it on your phone like a real app

**iPhone (Safari only):**
Open your app URL in Safari → tap the **Share** icon → **"Add to Home Screen"** → **Add**

**Android (Chrome):**
Open your app URL in Chrome → tap the **⋮** menu → **"Add to Home Screen"**

It now opens full-screen from your home screen, exactly like a downloaded app.

---

## Making Future Changes

Whenever you want a new feature or a fix:
1. Tell me what you need
2. I give you the updated file(s)
3. In GitHub, open that exact file → click the pencil (✏️) icon → replace the content → **"Commit changes"**
4. Vercel automatically redeploys within ~2 minutes — no other steps needed

---

## What's Included in This Version (Core Loop)

- Email/password login with secure per-store data isolation (Row Level Security)
- Add products manually or by barcode scan
- Batch-based inventory (FIFO) — tracks multiple expiry dates per product as Batch A, B, C...
- Low stock & expiry alerts on the dashboard and in the alerts panel
- Record a sale → automatically updates stock (oldest batch first) and daily profit
- Daily/weekly profit dashboard
- AI assistant with real-time knowledge of your inventory, sales, and alerts
- Full Arabic/English with RTL support
- Dark mode
- Installable as a phone app (PWA)

**Not included yet** (intentionally, for a focused first version): supplier management, invoice photo scanning, POS integration, detailed analytics. These can be added in future updates.
