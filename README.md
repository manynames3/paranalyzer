# 🏠 Paranalyzer

**Advanced real estate investment analysis and market intelligence**

Paranalyzer is a high-performance web app built for real estate investors and sales professionals who need fast, reliable property analysis and market insight. It goes beyond spreadsheets by combining AI-powered deal analysis with real-time market data in a modern, responsive interface.

## 🚀 Features

### DealCheck AI
Instantly evaluate flip and rental opportunities using AI-driven analysis based on current market conditions and property metrics.

### Zillow Market Heat Index
Track market competitiveness and inventory trends with a visual heat index powered by Zillow data.

### Professional Financial Modeling
Run advanced investment calculations including:

- ROI
- IRR
- Cash-on-cash return

Built to support more complex residential deal structures and development scenarios.

### Market Data Caching
Improve speed and reliability with integrated Supabase caching for fast market data retrieval and smoother user experience.

## 🛠 Tech Stack

Paranalyzer is built with a modern, type-safe frontend stack:

- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend / Database:** Supabase (PostgreSQL)
- **Package Manager:** Bun

## 🧑‍💻 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/manynames3/paranalyzer.git
cd paranalyzer
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file in the project root and add your credentials:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
# Add other API keys for Zillow / DealCheck AI here
```

### 4. Start the development server

```bash
bun run dev
```

## 🌐 Deployment

This project is optimized for deployment on **Netlify** or **Vercel**.

- **Build command:** `npm run build`
- **Publish directory:** `dist`

## 📌 Notes

Paranalyzer is part of a professional real estate analysis toolkit. For licensing, partnerships, or custom development inquiries, please contact the repository owner.
