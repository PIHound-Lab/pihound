import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://pihound.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/og-image.jpg`;

const ROUTE_META = {
  '/': {
    title: 'PiHound — Pi Network Analytics & Explorer',
    description:
      'Deep analytics toolkit for the Pi Network — live price charts, wallet explorer, transaction tracing, exchange reserves, and real-time sweep monitoring.',
    canonical: `${BASE_URL}/`,
  },
  '/home': {
    title: 'PiHound — Pi Network Analytics & Explorer',
    description:
      'Deep analytics toolkit for the Pi Network — live price charts, wallet explorer, transaction tracing, exchange reserves, and real-time sweep monitoring.',
    canonical: `${BASE_URL}/`,
  },
  '/wallet_explorer': {
    title: 'Pi Wallet Explorer & Account Lookup — PiHound',
    description:
      'Inspect any Pi Network public key address, verify current balances, locked mining rewards, sequence numbers, and chronological payment history.',
    canonical: `${BASE_URL}/wallet_explorer`,
  },
  '/track_and_trace': {
    title: 'Track & Trace Fund Flows — PiHound',
    description:
      'Trace downstream transaction paths and fund movements across Pi Network accounts with multi-hop tree graphs and hop-by-hop ledger analysis.',
    canonical: `${BASE_URL}/track_and_trace`,
  },
  '/wallet_sweeps': {
    title: 'Live Wallet Sweeps & Sweeper Bot Tracker — PiHound',
    description:
      'Monitor real-time Pi Network sweeper transactions, exchange sweeps, muxed account flows, and automated high-frequency asset aggregations.',
    canonical: `${BASE_URL}/wallet_sweeps`,
  },
  '/bubblemap': {
    title: 'Interactive Pi Network BubbleMap — PiHound',
    description:
      'Visualize wallet clustering, liquidity distributions, exchange nodes, and holder relationships across the Pi Network blockchain.',
    canonical: `${BASE_URL}/bubblemap`,
  },
  '/pct_and_cexs': {
    title: 'Pi Core Team (PCT) & Exchange Reserves — PiHound',
    description:
      'Track official Pi Core Team (PCT) distribution pools and centralized exchange (CEX) cold/hot wallet reserves with real-time balance metrics.',
    canonical: `${BASE_URL}/pct_and_cexs`,
  },
  '/about': {
    title: 'About PiHound — The Pi Network Analytics Engine',
    description:
      'Learn about PiHound, our mission to deliver open-source transparency, transaction tracking, and forensic intelligence to the Pi Network ecosystem.',
    canonical: `${BASE_URL}/about`,
  },
  '/faq': {
    title: 'Frequently Asked Questions (FAQ) — PiHound',
    description:
      'Got questions about PiHound explorer, ledger tracking, wallet sweeps, or exchange metrics? Find comprehensive answers in our FAQ.',
    canonical: `${BASE_URL}/faq`,
  },
  '/terms': {
    title: 'Terms of Service — PiHound',
    description:
      'Review the terms and conditions for utilizing the PiHound analytics platform, ledger data indexing, and explorer services.',
    canonical: `${BASE_URL}/terms`,
  },
  '/privacy': {
    title: 'Privacy Policy — PiHound',
    description:
      'Read PiHound’s privacy policy detailing our zero-collection, non-custodial approach to public blockchain explorer data.',
    canonical: `${BASE_URL}/privacy`,
  },
};

function updateMetaTag(selector, attribute, value) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const isProperty = selector.includes('property=');
    const attrName = isProperty ? 'property' : 'name';
    const match = selector.match(/["'](.*?)["']/);
    if (match) {
      element.setAttribute(attrName, match[1]);
      document.head.appendChild(element);
    }
  }
  element.setAttribute(attribute, value);
}

function updateCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export default function RouteSEO() {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] || ROUTE_META['/'];

    document.title = meta.title;
    updateCanonical(meta.canonical);

    updateMetaTag('meta[name="title"]', 'content', meta.title);
    updateMetaTag('meta[name="description"]', 'content', meta.description);

    updateMetaTag('meta[property="og:title"]', 'content', meta.title);
    updateMetaTag('meta[property="og:description"]', 'content', meta.description);
    updateMetaTag('meta[property="og:url"]', 'content', meta.canonical);
    updateMetaTag('meta[property="og:image"]', 'content', DEFAULT_IMAGE);

    updateMetaTag('meta[name="twitter:title"]', 'content', meta.title);
    updateMetaTag('meta[name="twitter:description"]', 'content', meta.description);
    updateMetaTag('meta[name="twitter:url"]', 'content', meta.canonical);
    updateMetaTag('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE);
  }, [location.pathname]);

  return null;
}
