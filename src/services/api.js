import { sanitizeAddress, validateStandardAddress } from '../utils/address';

/**
 * PiHound Frontend API Service
 * Handles API communication with the PiHound backend.
 */
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

async function safeFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function fetchPrice() {
  try {
    const res = await safeFetch(`${BASE_URL}/price/`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return { price_usd: null, change_24h: null, high_24h: null, low_24h: null, volume_24h: null };
}

export async function fetchPriceHistory(tf = 'D') {
  try {
    const res = await safeFetch(`${BASE_URL}/price/history/?tf=${tf}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.points) && data.points.length > 0) {
        return data.points;
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export async function fetchNetworkStats() {
  try {
    const res = await safeFetch(`${BASE_URL}/network_stats/`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return { accounts: null, locked: null, circulating: null, pioneer_transfers: null, pending_failed: null, last_ledger: null };
}

export async function fetchWalletInfo(address) {
  const cleanAddr = sanitizeAddress(address);
  const err = validateStandardAddress(cleanAddr);
  if (err) {
    return { error: err };
  }
  try {
    const res = await safeFetch(`${BASE_URL}/wallet/${encodeURIComponent(cleanAddr)}/`, {}, 15000);
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 400 || res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `Request failed with status ${res.status}` };
    }
  } catch {
    // fallback
  }
  return { error: 'Failed to fetch wallet info' };
}

export async function fetchWalletLockups(address) {
  const cleanAddr = sanitizeAddress(address);
  const err = validateStandardAddress(cleanAddr);
  if (err) {
    return { error: err };
  }
  try {
    const res = await safeFetch(`${BASE_URL}/lockups/${encodeURIComponent(cleanAddr)}/`, {}, 20000);
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 400 || res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `Request failed with status ${res.status}` };
    }
  } catch {
    // fallback
  }
  return { available: null, lock: null };
}

export async function fetchWalletTransactions(address, cursor = null, limit = 50) {
  const cleanAddr = sanitizeAddress(address);
  const err = validateStandardAddress(cleanAddr);
  if (err) {
    return { error: err, transactions: [], cursor: null };
  }
  try {
    let url = `${BASE_URL}/wallet/${encodeURIComponent(cleanAddr)}/transactions/?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    const res = await safeFetch(url, {}, 25000);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.transactions)) {
        return data;
      }
    }
    if (res.status === 400 || res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `Request failed with status ${res.status}`, transactions: [], cursor: null };
    }
  } catch {
    // fallback
  }
  return {
    transactions: [],
    cursor: null,
  };
}

export async function fetchTrace(txHash) {
  try {
    const res = await safeFetch(`${BASE_URL}/trace/${encodeURIComponent(txHash)}/`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.nodes || data.links)) {
        return data;
      }
    }
  } catch {
    // fallback
  }
  return { nodes: [], links: [], error: 'Trace unavailable' };
}

export async function fetchSweeps(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${BASE_URL}/sweeps/${query ? `?${query}` : ''}`, {}, 25000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.events) {
        return data;
      }
    }
  } catch {
    // fallback
  }
  return { events: [], total: 0, pi_swept: null, bad_actors_count: 0, top_bad_actors: [], time_window: 'N/A' };
}

export async function fetchBubblemap(address, limit = 2000) {
  const cleanAddr = sanitizeAddress(address);
  const err = validateStandardAddress(cleanAddr);
  if (err) {
    return { error: err, nodes: [], links: [] };
  }
  try {
    const res = await safeFetch(
      `${BASE_URL}/bubblemap/${encodeURIComponent(cleanAddr)}/?limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.nodes) {
        return data;
      }
    }
    if (res.status === 400 || res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `Request failed with status ${res.status}`, nodes: [], links: [] };
    }
  } catch {
    // fallback
  }
  return { nodes: [], links: [], error: 'Bubble map unavailable' };
}

export async function fetchPctAndCexs(params = {}) {
  try {
    let query = '';
    if (typeof params === 'object' && params !== null) {
      const qp = new URLSearchParams();
      if (params.category) qp.set('category', params.category);
      if (params.page) qp.set('page', params.page);
      if (params.pageSize) qp.set('page_size', params.pageSize);
      if (params.search) qp.set('search', params.search);
      const qs = qp.toString();
      query = qs ? `?${qs}` : '';
    }

    const url = `${BASE_URL}/pct_and_cexs/${query}`;
    const res = await safeFetch(url, {}, 30000);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.wallets || data.pct_wallets || data.cex_wallets)) {
        return data;
      }
    }
  } catch {
    // fallback
  }
  return { wallets: [], total_pct_balance: null, total_cex_balance: null, grand_total_balance: null, total_count: 0, total_pages: 1 };
}

