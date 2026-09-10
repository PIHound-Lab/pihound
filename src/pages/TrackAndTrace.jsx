import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { fetchTrace } from '../services/api';

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

export default function TrackAndTrace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useModal();

  const [txInput, setTxInput] = useState(searchParams.get('q') || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const [traceData, setTraceData] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filters
  const [maxHops, setMaxHops] = useState(10);
  const [exchangesOnly, setExchangesOnly] = useState(false);
  const [minAmount, setMinAmount] = useState(0);
  const [searchNode, setSearchNode] = useState('');

  // Recent traces
  const [recentTraces, setRecentTraces] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pihound_recent_traces') || '[]');
    } catch {
      return [];
    }
  });

  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const tooltipRef = useRef(null);
  const simulationRef = useRef(null);

  const executeTrace = async (hash) => {
    const trimmed = hash.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a 64-character transaction hash.');
      return;
    }
    if (trimmed.startsWith('G') || trimmed.startsWith('M')) {
      setErrorMsg('Track & Trace accepts 64-character transaction hashes only. Wallet public keys are not accepted.');
      return;
    }
    if (!HEX_64_REGEX.test(trimmed)) {
      setErrorMsg(`Invalid transaction hash. Must be exactly 64 hexadecimal characters (received ${trimmed.length} chars).`);
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setProgress(20);
    setProgressStatus('Validating transaction hash...');
    setSearchParams({ q: trimmed });

    await new Promise((r) => setTimeout(r, 150));
    setProgress(55);
    setProgressStatus('Querying backend transaction trace engine...');

    try {
      const data = await fetchTrace(trimmed);
      setProgress(90);
      setProgressStatus('Constructing spiderweb network...');
      await new Promise((r) => setTimeout(r, 150));

      if (data.error) {
        setErrorMsg(data.error);
        setTraceData(null);
        return;
      }

      setTraceData(data);
      saveRecentTrace(trimmed, data);
    } catch (e) {
      setErrorMsg('Error fetching trace: ' + e.message);
    } finally {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }
  };

  const saveRecentTrace = (hash, data) => {
    try {
      const existing = JSON.parse(localStorage.getItem('pihound_recent_traces') || '[]');
      const item = {
        hash,
        date: new Date().toISOString(),
        endpoint: data.endpoint_name || data.endpoint_type || 'N/A',
        hops: data.total_hops || 0,
      };
      const updated = [item, ...existing.filter((x) => x.hash !== hash)].slice(0, 8);
      localStorage.setItem('pihound_recent_traces', JSON.stringify(updated));
      setRecentTraces(updated);
    } catch {
      // ignore
    }
  };

  const clearRecentTraces = () => {
    localStorage.removeItem('pihound_recent_traces');
    setRecentTraces([]);
    showToast('Recent traces cleared');
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setTxInput(q);
      executeTrace(q);
    }
  }, []);

  // Filter logic for D3 Graph
  // Backend node schema: { id, label, short, type, is_exchange, exchange_name, exchange_image }
  // Links schema: { source, target, amount, tx_hash, timestamp, hop }
  // NOTE: nodes do NOT have a 'depth' field — hop depth comes from links, not nodes.
  const getFilteredGraph = () => {
    if (!traceData || !traceData.nodes || !traceData.links) {
      return { nodes: [], links: [] };
    }

    let nodes = traceData.nodes.map((n) => ({
      ...n,
      // Normalize: backend uses 'label'/'short', mock uses 'name'/'address'
      name: n.name || n.label || n.short || n.id,
      address: n.address || n.id,
    }));
    let links = traceData.links.map((l) => ({ ...l }));

    // Hop depth filter — filter by the 'hop' field on links, then keep only connected nodes
    if (maxHops < 10) {
      links = links.filter((l) => (l.hop || 0) <= maxHops);
      const connectedIds = new Set();
      links.forEach((l) => {
        connectedIds.add(typeof l.source === 'object' ? l.source.id : l.source);
        connectedIds.add(typeof l.target === 'object' ? l.target.id : l.target);
      });
      // Always keep origin/root node
      nodes = nodes.filter((n) => n.type === 'root' || n.type === 'origin' || connectedIds.has(n.id));
    }

    // Min Amount filter
    if (minAmount > 0) {
      links = links.filter((l) => (l.amount_num || parseFloat(l.amount) || 0) >= minAmount);
      const connectedIds = new Set();
      links.forEach((l) => {
        connectedIds.add(typeof l.source === 'object' ? l.source.id : l.source);
        connectedIds.add(typeof l.target === 'object' ? l.target.id : l.target);
      });
      nodes = nodes.filter((n) => n.type === 'root' || n.type === 'origin' || connectedIds.has(n.id));
    }

    // Exchanges only
    if (exchangesOnly) {
      nodes = nodes.filter((n) => n.type === 'root' || n.type === 'origin' || n.type === 'exchange' || n.type === 'muxed');
      const validIds = new Set(nodes.map((n) => n.id));
      links = links.filter((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return validIds.has(s) && validIds.has(t);
      });
    }

    // Search / highlight filter
    if (searchNode.trim()) {
      const term = searchNode.trim().toLowerCase();
      nodes = nodes.map((n) => ({
        ...n,
        isHighlighted:
          (n.name || '').toLowerCase().includes(term) ||
          (n.label || '').toLowerCase().includes(term) ||
          (n.id || '').toLowerCase().includes(term) ||
          (n.exchange_name || '').toLowerCase().includes(term),
      }));
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    links = links.filter((l) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    return { nodes, links };
  };

  const getExchangeImageUrl = (d) => {
    if (d.exchange_image) {
      const cleanName = d.exchange_image.replace(/^.*[\/\\]/, '');
      return `/images/${cleanName}`;
    }
    const text = `${d.name || ''} ${d.label || ''} ${d.id || ''} ${d.endpoint_name || ''}`.toLowerCase();
    if (text.includes('okx')) return '/images/okx.webp';
    if (text.includes('bitget')) return '/images/bitget.webp';
    if (text.includes('gate')) return '/images/gate.webp';
    if (text.includes('mexc')) return '/images/mexc.webp';
    if (text.includes('kraken')) return '/images/kraken.webp';
    if (text.includes('lbank')) return '/images/lbank.webp';
    if (text.includes('pionex')) return '/images/pionex.webp';
    return null;
  };

  // Render D3 Graph
  useEffect(() => {
    if (!traceData || !svgRef.current) return;

    const { nodes, links } = getFilteredGraph();
    const container = svgRef.current.parentElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 720;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    // Defs for arrows and gradients
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L7,0L0,3')
      .attr('fill', 'rgba(167, 139, 250, 0.6)');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = { zoom, svg };

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => (d.type === 'root' ? 26 : getExchangeImageUrl(d) ? 24 : 20)));

    simulationRef.current = simulation;

    // Draw Links - Sleek, thin lines
    const link = g.append('g')
      .attr('class', 'spider-links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(167, 139, 250, 0.4)')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.85)
      .attr('marker-end', 'url(#arrow)');

    // Link Labels (amounts)
    const linkText = g.append('g')
      .attr('class', 'spider-link-labels')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '9.5px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', '#c4b5fd')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text((d) => d.amount || '');

    // Color mapper
    const getNodeColor = (d) => {
      if (d.type === 'root' || d.type === 'origin') return '#3b82f6';
      if (d.type === 'exchange') return '#38bdf8';
      if (d.type === 'muxed') return '#38bdf8';
      return '#a78bfa';
    };

    // Draw Nodes
    const node = g.append('g')
      .attr('class', 'spider-nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // 1. ORIGIN / ROOT NODE (backend returns 'origin', mock uses 'root')
    const rootNodes = node.filter((d) => d.type === 'root' || d.type === 'origin');
    rootNodes.append('circle')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);

    rootNodes.append('circle')
      .attr('r', 16)
      .attr('fill', '#3b82f6')
      .attr('stroke', (d) => (d.isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.4)'))
      .attr('stroke-width', (d) => (d.isHighlighted ? 3 : 2))
      .style('cursor', 'pointer');

    rootNodes.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '800')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text('TX');

    // 2. EXCHANGE NODES (Tucked cleanly inside circular frame with clipPath)
    const exNodes = node.filter((d) => d.type !== 'root' && d.type !== 'origin' && !!getExchangeImageUrl(d));
    exNodes.each(function(d, i) {
      const r = 16;
      const safeId = `trace-clip-${i}-${(d.id || '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      // ClipPath tucked exactly to circle boundary
      defs.append('clipPath')
        .attr('id', safeId)
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r - 1);

      const gNode = d3.select(this);

      // Base plate
      gNode.append('circle')
        .attr('r', r)
        .attr('fill', '#ffffff')
        .attr('stroke', d.isHighlighted ? '#ffffff' : '#38bdf8')
        .attr('stroke-width', d.isHighlighted ? 3 : 2)
        .style('filter', d.isHighlighted ? 'drop-shadow(0 0 8px #ffffff)' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))')
        .style('cursor', 'pointer');

      // Tucked exchange image
      gNode.append('image')
        .attr('href', getExchangeImageUrl(d))
        .attr('x', -r)
        .attr('y', -r)
        .attr('width', r * 2)
        .attr('height', r * 2)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('clip-path', `url(#${safeId})`)
        .style('pointer-events', 'none');

      // Framing bezel ring
      gNode.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', d.isHighlighted ? '#ffffff' : '#38bdf8')
        .attr('stroke-width', d.isHighlighted ? 3 : 2)
        .style('pointer-events', 'none');
    });

    // 3. REGULAR WALLET NODES (type: wallet/muxed without exchange image)
    const regNodes = node.filter((d) => d.type !== 'root' && d.type !== 'origin' && !getExchangeImageUrl(d));
    regNodes.append('circle')
      .attr('r', (d) => d.type === 'muxed' ? 13 : 12)
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', (d) => (d.isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.25)'))
      .attr('stroke-width', (d) => (d.isHighlighted ? 3 : 1.5))
      .style('filter', (d) => (d.isHighlighted ? 'drop-shadow(0 0 8px #ffffff)' : 'none'))
      .style('cursor', 'pointer');

    // Add 'M' text badge for muxed nodes
    regNodes.filter((d) => d.type === 'muxed')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('font-weight', '900')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text('M');

    // Node labels (use label/short from backend, fallback to name/id)
    node.append('text')
      .attr('dy', (d) => (d.type === 'root' || d.type === 'origin' ? 28 : getExchangeImageUrl(d) ? 26 : 22))
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--text-main)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--bg-surface, #0f0e17)')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .text((d) => {
        const displayName = d.exchange_name || d.name || d.label || d.short || d.id;
        if (getExchangeImageUrl(d)) return displayName;
        // Truncate long addresses
        if (displayName && displayName.length > 12) return displayName.slice(0, 6) + '...' + displayName.slice(-4);
        return displayName || d.id;
      });

    // Hover tooltip
    const tooltipEl = tooltipRef.current;
    node.on('mouseover', (event, d) => {
      if (!tooltipEl) return;
      const img = getExchangeImageUrl(d);
      tooltipEl.style.display = 'block';
      tooltipEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.25rem;">
          ${img ? `<img src="${img}" style="width: 18px; height: 18px; border-radius: 50%; background: #fff; padding: 1px;" alt="" />` : ''}
          <div style="font-weight: 700; color: var(--accent);">${d.name || d.id}</div>
        </div>
        <div style="color: var(--text-muted); font-size: 0.75rem;">Type: <span style="text-transform: capitalize; color: #fff;">${d.type}</span></div>
        ${d.amount ? `<div style="color: var(--text-muted); font-size: 0.75rem;">Volume: <span style="color: #34d399;">${d.amount}</span></div>` : ''}
        ${d.address ? `<div style="color: var(--text-dim); font-size: 0.7rem; word-break: break-all; margin-top: 0.3rem;">${d.address}</div>` : ''}
      `;
    }).on('mousemove', (event) => {
      if (!tooltipEl) return;
      const rect = container.getBoundingClientRect();
      tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
      tooltipEl.style.top = `${event.clientY - rect.top + 15}px`;
    }).on('mouseout', () => {
      if (tooltipEl) tooltipEl.style.display = 'none';
    });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      linkText
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [traceData, maxHops, exchangesOnly, minAmount, searchNode]);

  // Zoom controls
  const handleZoom = (scaleFactor) => {
    if (!zoomRef.current) return;
    const { zoom, svg } = zoomRef.current;
    svg.transition().duration(250).call(zoom.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!zoomRef.current) return;
    const { zoom, svg } = zoomRef.current;
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  };

  // Export (CSV only)
  const exportTrace = () => {
    if (!traceData) return;
    const rows = [['Source', 'Target', 'Amount', 'Hop']];
    (traceData.links || []).forEach((l) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      rows.push([s, t, l.amount || '', l.hop || '']);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pihound_trace_${txInput.slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Trace exported as CSV');
  };

  const isFilteredActive = maxHops < 10 || exchangesOnly || minAmount > 0 || searchNode.trim() !== '';

  return (
    <>
      {/* Transaction Search Card */}
      <div className="card">
        <div className="card-title">Track & Trace — Multi-Branch Spiderweb Canvas</div>
        <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          Paste a <strong>64-character transaction hash</strong> to trace outgoing Pi payment splits across a D3 force-directed spiderweb network.
        </p>
        <div className="search-row">
          <input
            id="tx-input"
            className="form-control mono"
            type="text"
            placeholder="Enter 64-character transaction hash (e.g. 5a2f...)"
            maxLength={64}
            spellCheck="false"
            autoComplete="off"
            value={txInput}
            onChange={(e) => setTxInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeTrace(txInput);
            }}
          />
          <button
            id="btn-trace"
            type="button"
            className="btn btn-primary"
            onClick={() => executeTrace(txInput)}
          >
            Fetch Trace
          </button>
        </div>
        {errorMsg && (
          <div id="trace-msg" className="muted" style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#f87171' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Progress Bar Card */}
      {loading && (
        <div id="trace-progress-card" className="card progress-card" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span id="trace-status-text" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
              {progressStatus}
            </span>
            <span id="trace-progress-percent" className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {progress}%
            </span>
          </div>
          <div className="progress-track">
            <div id="trace-progress-bar" className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Trace Result Container */}
      {traceData && (
        <div id="trace-result" className="card">
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              Spiderweb Trace Canvas
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span id="trace-stats-badge" className="mono muted" style={{ fontSize: '0.78rem' }}>
                {traceData.total_nodes || 0} Nodes | {traceData.total_links || 0} Links
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={exportTrace} title="Export trace hops and links as CSV">
                Export CSV
              </button>
            </div>
          </div>

          {/* Graph Decluttering & Control Toolbar */}
          <div
            id="spider-filter-bar"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '0.85rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                id="btn-open-trace-filter"
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFilterModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {isFilteredActive && (
                  <span
                    id="trace-filter-badge"
                    className="badge"
                    style={{
                      background: 'var(--accent, #a78bfa)',
                      color: '#fff',
                      borderRadius: '999px',
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    Filtered
                  </span>
                )}
              </button>

              <div
                id="trace-filter-summary"
                className="mono muted"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>Hops: {maxHops === 10 ? 'All (10)' : maxHops}</span>
                <span>•</span>
                <span>Min: {minAmount} π</span>
                {exchangesOnly && (
                  <>
                    <span>•</span>
                    <span style={{ color: 'var(--accent)' }}>Exchanges &amp; Muxed</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setMaxHops(10);
                setExchangesOnly(false);
                setMinAmount(0);
                setSearchNode('');
              }}
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
            >
              Reset Filters
            </button>
          </div>

          {/* Spiderweb Canvas View */}
          <div id="view-spider-wrapper" style={{ position: 'relative' }}>
            <div id="spiderweb-container">
              <div id="spiderweb-graph" style={{ position: 'relative' }}>
                {/* Spiderweb Legend Overlay */}
                <div className="spider-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#3b82f6' }} />
                    <span>Root TX</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#a78bfa' }} />
                    <span>Wallet Node</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#f87171' }} />
                    <span>Exchange</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#fbbf24' }} />
                    <span>Muxed</span>
                  </div>
                </div>

                {/* Zoom Controls Overlay */}
                <div className="spider-controls">
                  <button type="button" className="spider-btn" onClick={() => handleZoom(1.3)} title="Zoom In">+</button>
                  <button type="button" className="spider-btn" onClick={() => handleZoom(0.7)} title="Zoom Out">−</button>
                  <button type="button" className="spider-btn" onClick={handleResetZoom} title="Reset View">⟲</button>
                </div>

                {/* SVG Graph */}
                <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block', background: 'var(--bg-surface)' }} />

                {/* Hover Tooltip Card */}
                <div
                  ref={tooltipRef}
                  id="spider-tooltip"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    pointerEvents: 'none',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    zIndex: 100,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Terminal Endpoint Summary Card */}
          {traceData.endpoint_type && (
            <div
              id="trace-endpoint"
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.35rem' }}>
                🏁 Terminal Trace Endpoint Detected
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Target: <strong>{traceData.endpoint_name || 'N/A'}</strong> ({traceData.endpoint_type || 'N/A'})
              </div>
              <div className="mono dim" style={{ fontSize: '0.75rem', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                {traceData.endpoint_address}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div
          id="trace-filter-modal"
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.id === 'trace-filter-modal') setIsFilterModalOpen(false);
          }}
        >
          <div className="calendar-modal-card" style={{ maxWidth: '480px' }}>
            <div className="calendar-modal-header">
              <div className="calendar-modal-title">🔍 Filter Spiderweb Graph</div>
              <button type="button" className="calendar-modal-close" onClick={() => setIsFilterModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="calendar-modal-body">
              <div>
                <label className="cal-label">Maximum Hop Depth</label>
                <select
                  id="modal-trace-max-hops"
                  className="cal-input"
                  value={maxHops}
                  onChange={(e) => setMaxHops(Number(e.target.value))}
                >
                  <option value={10}>All Hops (Up to 10)</option>
                  <option value={1}>1 Hop</option>
                  <option value={2}>2 Hops</option>
                  <option value={3}>3 Hops</option>
                  <option value={5}>5 Hops</option>
                </select>
              </div>

              <div>
                <div
                  className={`filter-toggle-card ${exchangesOnly ? 'active' : ''}`}
                  onClick={() => setExchangesOnly(!exchangesOnly)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setExchangesOnly(!exchangesOnly);
                    }
                  }}
                >
                  <div className="filter-toggle-left">
                    <div className="filter-toggle-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
                      </svg>
                    </div>
                    <div>
                      <div className="filter-toggle-label">Exchanges &amp; Muxed Only</div>
                      <div className="filter-toggle-sub">Isolate known CEX hot wallets &amp; multiplexed addresses</div>
                    </div>
                  </div>
                  <div className={`filter-toggle-switch ${exchangesOnly ? 'on' : ''}`}>
                    <div className="toggle-handle" />
                  </div>
                </div>
              </div>

              <div>
                <label className="cal-label" htmlFor="modal-trace-min-amount">
                  Minimum Payment Amount (π)
                </label>
                <input
                  id="modal-trace-min-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="cal-input"
                />
              </div>

              <div>
                <label className="cal-label" htmlFor="modal-trace-search-node">
                  Search Address or Exchange
                </label>
                <input
                  id="modal-trace-search-node"
                  type="text"
                  className="cal-input"
                  placeholder="Search wallet address or exchange name"
                  value={searchNode}
                  onChange={(e) => setSearchNode(e.target.value)}
                />
              </div>

              <div className="cal-footer">
                <button
                  type="button"
                  className="cal-btn-cancel"
                  onClick={() => {
                    setMaxHops(10);
                    setExchangesOnly(false);
                    setMinAmount(0);
                    setSearchNode('');
                    setIsFilterModalOpen(false);
                  }}
                >
                  Reset All
                </button>
                <button
                  type="button"
                  className="cal-btn-apply"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Apply Graph Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Traces */}
      {recentTraces.length > 0 && (
        <div id="recent-traces" className="card" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Recent Traces</div>
            <button
              type="button"
              className="btn-clear-history"
              onClick={clearRecentTraces}
              title="Clear all saved recent traces"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Clear Recent Traces</span>
            </button>
          </div>
          <div id="recent-list">
            {recentTraces.map((r) => (
              <div
                key={r.hash}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.8rem',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
                onClick={() => {
                  setTxInput(r.hash);
                  executeTrace(r.hash);
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="mono" style={{ color: 'var(--accent)' }}>
                    {r.hash.slice(0, 10)}...{r.hash.slice(-6)}
                  </span>
                  <span className="dim">→ {r.endpoint}</span>
                </div>
                <span className="mono dim" style={{ fontSize: '0.75rem' }}>
                  {r.hops} hops
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works Card */}
      <div className="card">
        <div className="card-title">How Multi-Branch Track &amp; Trace Works</div>
        <ul style={{ fontSize: '0.83rem', color: 'var(--text-muted)', paddingLeft: '1.2em', lineHeight: 1.65 }}>
          <li>Accepts exclusively a <strong>64-character transaction hash</strong> (hexadecimal string)</li>
          <li>Recursively traces payment fan-outs across multiple intermediate wallets (e.g. Account B splitting funds to C, D, E)</li>
          <li>Renders accounts and transaction flows as an interactive <strong>D3 Force Spiderweb Canvas</strong> with direction arrows and amounts</li>
          <li>Detects <strong>known exchange wallets</strong> and <strong>multiplexed (Muxed) sub-accounts</strong></li>
          <li>Use the <strong>Decluttering Toolbar</strong> (Min Amount, Max Depth, Exchanges Only, Search) to filter graph complexity</li>
          <li>Export complete forensic trace logs as <strong>CSV files</strong></li>
        </ul>
      </div>
    </>
  );
}
