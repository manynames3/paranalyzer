🏠 Paranalyzer
Advanced Real Estate Investment Analysis & Market Intelligence

Paranalyzer is a high-performance web application designed for real estate investors and salespersons to analyze property deals and track market trends with precision. It moves beyond simple spreadsheets by integrating AI-driven deal analysis and real-time market data.

🚀 Key Features
DealCheck AI: Leverage AI to instantly evaluate the viability of a flip or rental property based on current market metrics.

Zillow Market Heat Index: Visual representation of market competitiveness and inventory levels directly integrated via Zillow data.

Professional Financial Modeling: Calculate ROI, IRR, and cash-on-cash returns for complex residential developments.

Market Data Caching: High-speed data retrieval with a built-in Supabase cache management system for seamless performance.

🛠️ Tech Stack
This project is built with a modern, type-safe frontend architecture:

Framework: React + Vite

Language: TypeScript

Styling: Tailwind CSS + shadcn/ui

Backend/Database: Supabase (PostgreSQL)

Package Manager: Bun

🛠️ Local Development
1. Clone & Install
Bash
git clone https://github.com/manynames3/paranalyzer.git
cd paranalyzer
bun install
2. Environment Setup
Create a .env file in the root directory and add your credentials:

Code snippet
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
# Add other API keys for Zillow/DealCheck AI here
3. Start Developing
Bash
bun run dev
🌐 Deployment
This project is optimized for deployment on Netlify or Vercel.

Build Command: npm run build

Publish Directory: dist

📈 Project Roadmap
[x] Integrate Zillow Market Heat Index

[x] Implement DealCheck AI Analysis

[ ] Add Luxury Single-Family Development templates (Somerville/Boston area)

[ ] Exportable PDF reports for clients/brokers

Note: This project is part of a professional real estate toolkit. For inquiries regarding licensing or custom development, please contact the repository owner.
