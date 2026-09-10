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

## Architecture & Data Flow

PiHound Frontend connects to the PiHound backend API for all blockchain metrics and explorer data. Blockchain ingestion, ledger crawling, and transaction indexing are handled server-side, keeping the client fast, lightweight, and decoupled from node infrastructure.

## How It Works

1. **Routing & Dynamic SEO (`src/App.jsx`, `src/components/common/RouteSEO.jsx`)**:
   Provides client-side routing across key explorer modules (`/wallet_explorer`, `/track_and_trace`, `/wallet_sweeps`, `/bubblemap`, `/pct_and_cexs`). The `RouteSEO` component updates document titles, canonical URLs, and Open Graph tags on route transitions.

2. **Data Fetching Layer (`src/services/api.js`)**:
   Queries the backend REST API (routed via Vite's `/api` dev proxy locally or Nginx in production):
   - `GET /api/price/` — Live market price, 24h change, high/low, and trading volume.
   - `GET /api/price/history/?tf={D|W|M}` — Historical price chart candle points.
   - `GET /api/network_stats/` — Global network ledger metrics, circulating supply, and lockups.
   - `GET /api/wallet/{address}/` — Account balance, creation timestamp, and sequence status.
   - `GET /api/lockups/{address}/` — Pioneer locked mining balances and unlock schedules.
   - `GET /api/wallet/{address}/transactions/` — Paginated transaction history with cursor navigation.
   - `GET /api/trace/{tx_hash}/` — Multi-hop payment path graph and terminal exchange identification.
   - `GET /api/sweeps/` — Live automated 2-in-1 sweeper bot detections and bad actor intelligence.
   - `GET /api/bubblemap/{address}/` — D3 graph cluster data for counterparty wallet relationships.
   - `GET /api/pct_and_cexs/` — Monitored Pi Core Team reserve pools and exchange balances.

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
