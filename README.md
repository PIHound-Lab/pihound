# PiHound Frontend

Web3 analytics interface and blockchain explorer for the Pi Network.

## About the Project

PiHound Frontend is a responsive analytics dashboard and explorer tailored for the Pi Network ecosystem. It enables users to look up wallet balances, trace multi-hop payment chains, monitor live automated wallet sweeps, explore wallet clustering with interactive D3 graphs, and track Pi Core Team (PCT) and exchange reserves.

### Core Stack
- **Framework**: React 19, Vite 5
- **Routing**: React Router 7
- **Visualizations**: D3.js (BubbleMap and Transaction Trace graphs)
- **Styling**: Vanilla CSS (Tailored dark theme, glassmorphism, responsive mobile drawer)
- **SEO**: Dynamic route metadata manager, Open Graph cards, Twitter cards, and Schema.org JSON-LD

## Setup (Local Development)

### Prerequisites
- Node.js 18.x or 20.x+
- npm or yarn

### Steps

1. **Clone the repository and enter directory**:
   ```bash
   cd PiHound_Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   By default, local development uses `/api` with Vite's proxy targeting the local Django backend at `http://localhost:8000`.

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```
   Build output will be generated in `dist/`.

## How It Works

1. **Routing & Dynamic SEO (`src/App.jsx`, `src/components/common/RouteSEO.jsx`)**:
   Provides client-side routing across key explorer modules (`/wallet_explorer`, `/track_and_trace`, `/wallet_sweeps`, `/bubblemap`, `/pct_and_cexs`). The `RouteSEO` component updates document titles, canonical URLs, and Open Graph tags on route transitions.

2. **Data Fetching Layer (`src/services/api.js`)**:
   Sends requests through Vite's dev proxy or Nginx reverse proxy to the backend API. If the backend is unreachable during local UI prototyping, it gracefully falls back to structured mock data.

3. **Visualizations**:
   - **BubbleMap (`src/pages/BubbleMap.jsx`)**: Uses D3 force simulations to cluster wallets by transaction volume, category, and exchange associations.
   - **Track & Trace (`src/pages/TrackAndTrace.jsx`)**: Renders multi-branch transaction trees to visualize payment propagation from sender to terminal destination.

4. **Search Discovery**:
   Static discovery files in `public/` (`robots.txt`, `sitemap.xml`, and `site.webmanifest`) guide search engine crawlers and PWA installations.

## Upcoming Updates

- **Live WebSocket Feeds**: Instant UI updates for incoming wallet sweeps without page refreshing.
- **Address Book & Watchlists**: Client-side saved wallets with quick status monitoring.
- **Export Capabilities**: CSV and JSON transaction export for wallet explorer and audit reports.
- **DEX Liquidity Tracking**: Automated monitoring of automated market maker (AMM) pools as the ecosystem expands.
