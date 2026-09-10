// Comprehensive realistic mock data mirroring PiHound Backend API responses

export const MOCK_PRICE = {
  price_usd: 0.8542,
  change_24h: 3.42,
  high_24h: 0.8845,
  low_24h: 0.8190,
  volume_24h: 18452090,
};

export function generatePriceHistory(tf = 'D') {
  const now = Date.now();
  const days = tf === 'M' ? 30 : tf === 'W' ? 7 : 1;
  const step = (days * 86400 * 1000) / 30;
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const t = now - (30 - i) * step;
    const base = tf === 'M' ? 0.76 : tf === 'W' ? 0.81 : 0.83;
    const noise = Math.sin(i * 0.45) * 0.03 + (i * 0.0018);
    const c = Number((base + noise).toFixed(4));
    pts.push({ t, c });
  }
  return pts;
}

export const MOCK_NETWORK_STATS = {
  accounts: '15482910',
  locked: '6855210940.12',
  circulating: '313840120.45',
  pioneer_transfers: '302290.80',
  pending_failed: '3580',
  last_ledger: '14829104',
};

export const MOCK_PCT_AND_CEXS = {
  total_pct_balance: 6855210940.12,
  total_cex_balance: 42890520.55,
  grand_total_balance: 6898101460.67,
  pct_wallets: [
    {
      address: 'GDV4N6WV27NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7M7',
      name: 'Pi Core Team Reserve Alpha',
      category: 'PCT',
      image: 'icon.webp',
      balance: 2450000000.0,
      created: '2022-06-28',
    },
    {
      address: 'GBB4GZ3Y45C545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Pi Ecosystem Foundation',
      category: 'PCT',
      image: 'icon.webp',
      balance: 1850000000.0,
      created: '2022-06-28',
    },
    {
      address: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Pioneer Migration Pool 1',
      category: 'PCT',
      image: 'icon.webp',
      balance: 1250210940.12,
      created: '2022-08-14',
    },
    {
      address: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Pioneer Migration Pool 2',
      category: 'PCT',
      image: 'icon.webp',
      balance: 855000000.0,
      created: '2023-01-10',
    },
    {
      address: 'GAZ9Q3M2R8Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Pi Community Liquidity Reserve',
      category: 'PCT',
      image: 'icon.webp',
      balance: 250000000.0,
      created: '2023-05-22',
    },
    {
      address: 'GCK3J8W5N9Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Node Incentive Distribution Pool',
      category: 'PCT',
      image: 'icon.webp',
      balance: 150000000.0,
      created: '2023-11-04',
    },
    {
      address: 'GBL5D2K9P4Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Developer Grants Program',
      category: 'PCT',
      image: 'icon.webp',
      balance: 45000000.0,
      created: '2024-02-18',
    },
    {
      address: 'GDH7F1X3M5Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      name: 'Core Protocol Security Reserve',
      category: 'PCT',
      image: 'icon.webp',
      balance: 5000000.0,
      created: '2024-06-01',
    },
  ],
  cex_wallets: [
    {
      address: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1',
      name: 'OKX Main Hot Wallet',
      category: 'CEX',
      image: 'okx.webp',
      balance: 14250000.0,
      created: '2023-04-12',
    },
    {
      address: 'GCGATE7Z5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7GATE',
      name: 'Gate.io Custody Reserve',
      category: 'CEX',
      image: 'gate.webp',
      balance: 9840210.0,
      created: '2023-06-08',
    },
    {
      address: 'GCBITGET5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7BGET',
      name: 'Bitget Settlement Hot Wallet',
      category: 'CEX',
      image: 'bitget.webp',
      balance: 6520300.0,
      created: '2023-09-19',
    },
    {
      address: 'GCKRAKEN5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7KRAK',
      name: 'Kraken Exchange Vault',
      category: 'CEX',
      image: 'kraken.webp',
      balance: 5120000.0,
      created: '2023-11-25',
    },
    {
      address: 'GCMEXC8Z5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7MEXC',
      name: 'MEXC Global Hot Wallet',
      category: 'CEX',
      image: 'mexc.webp',
      balance: 3410010.55,
      created: '2024-01-14',
    },
    {
      address: 'GCPIONEX5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PION',
      name: 'Pionex Bot Trading Reserve',
      category: 'CEX',
      image: 'pionex.webp',
      balance: 1980000.0,
      created: '2024-03-02',
    },
    {
      address: 'GCLBANK7Z5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7LBNK',
      name: 'LBank Exchange Liquidity',
      category: 'CEX',
      image: 'lbank.webp',
      balance: 1140000.0,
      created: '2024-04-20',
    },
    {
      address: 'GCCOINEX5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7CEX8',
      name: 'Secondary Exchange Aggregator',
      category: 'CEX',
      image: 'icon.webp',
      balance: 630000.0,
      created: '2024-07-11',
    },
  ],
};

export function getMockWalletTransactions(address) {
  return [
    {
      id: '992a5b8f7c1d3e4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80',
      hash: '992a5b8f7c1d3e4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80',
      amount: '450.0000000',
      date: '2026-09-08 18:42:15',
      created_at: '2026-09-08T18:42:15Z',
      is_outgoing: true,
      destination: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
      target_account: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
      source_account: address,
      successful: true,
      fee_charged: '0.0000100',
      max_fee: '0.0001000',
      operation_count: 1,
      op_types: 'Payment',
      memo: 'Pi Ecosystem Swap',
      envelope_xdr: 'AAAAAgAAAABl5u5g58...MDU5MDFkMGQyOTc3MGJhNDM3YjgyZjM0ZTdmMmIw',
    },
    {
      id: '881b4a7e6b0c2d3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d71',
      hash: '881b4a7e6b0c2d3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d71',
      amount: '1250.5000000',
      date: '2026-09-07 14:10:02',
      created_at: '2026-09-07T14:10:02Z',
      is_outgoing: false,
      destination: address,
      target_account: address,
      source_account: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      from: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      successful: true,
      fee_charged: '0.0000100',
      max_fee: '0.0001000',
      operation_count: 2,
      op_types: 'Claim, Send',
      memo: 'Unlocked Mainnet Rewards',
      envelope_xdr: 'AAAAAgAAAABk4v4f37...NTA5MDFkMGQyOTc3MGJhNDM3YjgyZjM0ZTdmMmIx',
    },
    {
      id: '770c3d6d5a9b1c2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d72',
      hash: '770c3d6d5a9b1c2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d72',
      amount: '85.2500000',
      date: '2026-09-06 09:22:45',
      created_at: '2026-09-06T09:22:45Z',
      is_outgoing: true,
      destination: 'GCBITGET5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7BGET',
      target_account: 'GCBITGET5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7BGET',
      source_account: address,
      successful: false,
      fee_charged: '0.0000100',
      max_fee: '0.0001000',
      operation_count: 1,
      op_types: 'Payment',
      memo: 'Deposit test',
      envelope_xdr: 'AAAAAgAAAABj3u2e16...NDA5MDFkMGQyOTc3MGJhNDM3YjgyZjM0ZTdmMmIy',
    },
    {
      id: '669d2c5c4a8a0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c73',
      hash: '669d2c5c4a8a0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c73',
      amount: '320.0000000',
      date: '2026-09-04 21:05:11',
      created_at: '2026-09-04T21:05:11Z',
      is_outgoing: true,
      destination: 'GBB4GZ3Y45C545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      target_account: 'GBB4GZ3Y45C545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      source_account: address,
      successful: true,
      fee_charged: '0.0000100',
      max_fee: '0.0001000',
      operation_count: 1,
      op_types: 'Payment',
      memo: 'P2P Pioneer Transfer',
      envelope_xdr: 'AAAAAgAAAABi2t1d05...MzA5MDFkMGQyOTc3MGJhNDM3YjgyZjM0ZTdmMmIz',
    },
    {
      id: '558e1b4b3a799a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b74',
      hash: '558e1b4b3a799a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b74',
      amount: '1500.0000000',
      date: '2026-09-01 11:15:30',
      created_at: '2026-09-01T11:15:30Z',
      is_outgoing: false,
      destination: address,
      target_account: address,
      source_account: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      from: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
      successful: true,
      fee_charged: '0.0000100',
      max_fee: '0.0001000',
      operation_count: 1,
      op_types: 'Payment',
      memo: 'Lockup initial migration',
      envelope_xdr: 'AAAAAgAAAABh1s0c94...MjA5MDFkMGQyOTc3MGJhNDM3YjgyZjM0ZTdmMmI0',
    },
  ];
}

export function getMockWalletInfo(address) {
  return {
    address,
    balance: 3420.75,
    wallet_days: 742,
    created: '2024-08-25',
  };
}

export function getMockLockups() {
  return {
    available: 3420.75,
    lock: {
      amount: 1500.0,
      days: 42,
      unlock_ts: Math.floor(Date.now() / 1000) + 42 * 86400,
    },
  };
}

export function getMockTrace(txHash) {
  return {
    tx_hash: txHash,
    endpoint_type: 'exchange',
    endpoint_name: 'OKX Main Hot Wallet',
    endpoint_address: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1',
    total_hops: 3,
    total_nodes: 6,
    total_links: 5,
    nodes: [
      {
        id: 'Origin TX: ' + txHash.slice(0, 8),
        name: txHash.slice(0, 8) + '...',
        type: 'root',
        val: 18,
        address: txHash,
        amount: '1,500 π',
        depth: 0,
      },
      {
        id: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
        name: 'GBQW...LPHA',
        type: 'wallet',
        val: 14,
        address: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
        amount: '1,500 π',
        depth: 1,
      },
      {
        id: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        name: 'GDT8...7PCT',
        type: 'wallet',
        val: 12,
        address: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        amount: '950 π',
        depth: 2,
      },
      {
        id: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        name: 'GCL7...7PCT',
        type: 'wallet',
        val: 10,
        address: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        amount: '550 π',
        depth: 2,
      },
      {
        id: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1',
        name: 'OKX Deposit Hot Wallet',
        type: 'exchange',
        val: 16,
        address: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1',
        amount: '950 π',
        depth: 3,
        exchange_image: 'okx.webp',
      },
      {
        id: 'MBBITGET9923847192837461928374619283746192837461928374619283',
        name: 'Bitget Muxed Deposit',
        type: 'muxed',
        val: 13,
        address: 'MBBITGET9923847192837461928374619283746192837461928374619283',
        amount: '550 π',
        depth: 3,
        exchange_image: 'bitget.webp',
      },
    ],
    links: [
      {
        source: 'Origin TX: ' + txHash.slice(0, 8),
        target: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
        amount: '1,500 π',
        amount_num: 1500,
        hop: 1,
      },
      {
        source: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
        target: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        amount: '950 π',
        amount_num: 950,
        hop: 2,
      },
      {
        source: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA',
        target: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        amount: '550 π',
        amount_num: 550,
        hop: 2,
      },
      {
        source: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        target: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1',
        amount: '950 π',
        amount_num: 950,
        hop: 3,
      },
      {
        source: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT',
        target: 'MBBITGET9923847192837461928374619283746192837461928374619283',
        amount: '550 π',
        amount_num: 550,
        hop: 3,
      },
    ],
  };
}

export function getMockSweeps() {
  return {
    total_swept: '842910.45',
    bad_actor_count: 184,
    victims_drained: 1420,
    time_window: 'All Time Recorded',
    sweep_type: '2 in 1 Bundled',
    events: [
      {
        id: 'sw-001',
        operation_id: '9920192837401928',
        tx_hash: '3f8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e90',
        amount: '1850.0000000',
        fee_charged: '0.0000200',
        max_fee: '0.0002000',
        from_address: 'GBVICTIM7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7VIC1',
        to_address: 'GBADACTOR8B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD1',
        timestamp: '2026-09-08T21:14:02Z',
        successful: true,
        operation_count: 2,
        op_types: 'Claim, Send',
        is_muxed: false,
      },
      {
        id: 'sw-002',
        operation_id: '9920192837401929',
        tx_hash: '2e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e71',
        amount: '920.5000000',
        fee_charged: '0.0000200',
        max_fee: '0.0002000',
        from_address: 'GBVICTIM2NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7VIC2',
        to_address: 'MBADACTOR9938472918273645192837461928374619283746192837461928',
        timestamp: '2026-09-08T19:48:29Z',
        successful: true,
        operation_count: 2,
        op_types: 'Claim, Send',
        is_muxed: true,
      },
      {
        id: 'sw-003',
        operation_id: '9920192837401930',
        tx_hash: '1d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d72',
        amount: '3410.2500000',
        fee_charged: '0.0000200',
        max_fee: '0.0002000',
        from_address: 'GBVICTIM3NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7VIC3',
        to_address: 'GBADACTOR8B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD1',
        timestamp: '2026-09-08T17:02:11Z',
        successful: true,
        operation_count: 2,
        op_types: 'Claim, Send',
        is_muxed: false,
      },
      {
        id: 'sw-004',
        operation_id: '9920192837401931',
        tx_hash: '0c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c73',
        amount: '450.0000000',
        fee_charged: '0.0000200',
        max_fee: '0.0002000',
        from_address: 'GBVICTIM4NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7VIC4',
        to_address: 'GBADACTOR2B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD2',
        timestamp: '2026-09-08T12:33:40Z',
        successful: true,
        operation_count: 2,
        op_types: 'Claim, Send',
        is_muxed: false,
      },
    ],
    bad_actors: [
      {
        address: 'GBADACTOR8B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD1',
        total_pi: 248910.75,
        victims_count: 428,
        last_active: '2026-09-08T21:14:02Z',
      },
      {
        address: 'MBADACTOR9938472918273645192837461928374619283746192837461928',
        total_pi: 184500.20,
        victims_count: 312,
        last_active: '2026-09-08T19:48:29Z',
      },
      {
        address: 'GBADACTOR2B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD2',
        total_pi: 98420.00,
        victims_count: 164,
        last_active: '2026-09-08T12:33:40Z',
      },
      {
        address: 'GBADACTOR3B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD3',
        total_pi: 74210.50,
        victims_count: 129,
        last_active: '2026-09-07T22:10:15Z',
      },
      {
        address: 'GBADACTOR4B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7BAD4',
        total_pi: 51200.00,
        victims_count: 88,
        last_active: '2026-09-07T15:04:33Z',
      },
    ],
  };
}

export function getMockBubbleMap(centerAddress) {
  const target = centerAddress || 'GDV4N6WV27NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7M7';
  return {
    target,
    nodes: [
      { id: target, label: 'Target Wallet', group: 'target', radius: 26, val: 50, exchange_image: null },
      { id: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1', label: 'OKX CEX', group: 'exchange', radius: 22, val: 40, exchange_image: 'okx.webp' },
      { id: 'GCBITGET5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7BGET', label: 'Bitget CEX', group: 'exchange', radius: 22, val: 35, exchange_image: 'bitget.webp' },
      { id: 'GBC6NRTTQLRCABQHIR5J4R4YDJWFWRAO4ZRQIM2SVI5GSIZ2HZ42RINW', label: 'Gate.io CEX', group: 'exchange', radius: 20, val: 32, exchange_image: 'gate.webp' },
      { id: 'GD5HGPHVL73EBDUD2Z4K2VDRLUBC4FFN7GOBLKPK6OPPXH6TED4TRK73', label: 'MEXC CEX', group: 'exchange', radius: 20, val: 28, exchange_image: 'mexc.webp' },
      { id: 'GBB4GZ3Y45C545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', label: 'Ecosystem Foundation', group: 'incoming', radius: 18, val: 30 },
      { id: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', label: 'Pioneer Pool', group: 'incoming', radius: 16, val: 28 },
      { id: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA', label: 'Pioneer Alpha', group: 'outgoing', radius: 15, val: 24 },
      { id: 'GCK3J8W5N9Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', label: 'Node Incentive Pool', group: 'incoming', radius: 15, val: 20 },
      { id: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', label: 'Migration Pool', group: 'outgoing', radius: 14, val: 18 },
    ],
    links: [
      { source: target, target: 'GCOKXBZ5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7OKX1', value: 950, is_incoming: false, is_exchange: true },
      { source: target, target: 'GCBITGET5W5YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7BGET', value: 550, is_incoming: false, is_exchange: true },
      { source: 'GBC6NRTTQLRCABQHIR5J4R4YDJWFWRAO4ZRQIM2SVI5GSIZ2HZ42RINW', target, value: 720, is_incoming: true, is_exchange: true },
      { source: target, target: 'GD5HGPHVL73EBDUD2Z4K2VDRLUBC4FFN7GOBLKPK6OPPXH6TED4TRK73', value: 380, is_incoming: false, is_exchange: true },
      { source: 'GBB4GZ3Y45C545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', target, value: 1250, is_incoming: true, is_exchange: false },
      { source: 'GDT8X4P6V7Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', target, value: 800, is_incoming: true, is_exchange: false },
      { source: target, target: 'GBQW7M7NYR6B5RUGQ3X2K4N5FGE524Z23L27525WGFBOHWQQXW7ALPHA', value: 320, is_incoming: false, is_exchange: false },
      { source: 'GCK3J8W5N9Y545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', target, value: 450, is_incoming: true, is_exchange: false },
      { source: target, target: 'GCL7W2Y6X5A545YWR6HQ245K32LGE524Z23L27525WGFBOHWQQXW7PCT', value: 210, is_incoming: false, is_exchange: false },
    ],
  };
}
