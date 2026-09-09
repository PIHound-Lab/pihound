import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { fetchBubblemap } from '../services/api';
import { sanitizeAddress, validateStandardAddress } from '../utils/address';

export default function BubbleMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useModal();
  const [addressInput, setAddressInput] = useState(searchParams.get('a') || '');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [graphData, setGraphData] = useState(null);

  // Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [minAmount, setMinAmount] = useState(0);
  const [showIncoming, setShowIncoming] = useState(true);
  const [showOutgoing, setShowOutgoing] = useState(true);
  const [showExIn, setShowExIn] = useState(true);
  const [showExOut, setShowExOut] = useState(true);
  const [highlightNode, setHighlightNode] = useState('');

  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const tooltipRef = useRef(null);
  const simulationRef = useRef(null);

  const loadBubbleMap = async (addr) => {
    const cleanAddr = sanitizeAddress(addr);
    const err = validateStandardAddress(cleanAddr);
    if (err) {
      setStatusMsg(err);
      showToast(err, { type: 'error', duration: 4000 });
      setGraphData(null);
      return;
    }

    setLoading(true);
    setStatusMsg('Scanning blockchain history and clustering wallet nodes...');
    setSearchParams({ a: cleanAddr });

    try {
      const data = await fetchBubblemap(cleanAddr);
      if (data.error) {
        setStatusMsg(data.error);
        showToast(data.error, { type: 'error', duration: 4000 });
        setGraphData(null);
        return;
      }
      setGraphData(data);
      setStatusMsg('');
    } catch (e) {
      const msg = 'Error: ' + e.message;
      setStatusMsg(msg);
      showToast(msg, { type: 'error', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const a = searchParams.get('a');
    if (a) {
      setAddressInput(a);
      loadBubbleMap(a);
    }
  }, []);

  const handleResetFilters = () => {
    setMinAmount(0);
    setShowIncoming(true);
    setShowOutgoing(true);
    setShowExIn(true);
    setShowExOut(true);
    setHighlightNode('');
  };

  const isFiltered =
    minAmount > 0 ||
    !showIncoming ||
    !showOutgoing ||
    !showExIn ||
    !showExOut ||
    highlightNode.trim() !== '';

  const getExchangeImageUrl = (d) => {
    if (!d) return null;
    if (d.exchange_image) {
      const cleanName = d.exchange_image.replace(/^.*[/\\]/, '');
      return `/images/${cleanName}`;
    }
    const label = (d.label || '').toLowerCase();
    const id = (d.id || '').toLowerCase();
    if (label.includes('okx') || id.includes('okx')) return '/images/okx.webp';
    if (label.includes('bitget') || id.includes('bitget')) return '/images/bitget.webp';
    if (label.includes('gate') || id.includes('gate')) return '/images/gate.webp';
    if (label.includes('mexc') || id.includes('mexc')) return '/images/mexc.webp';
    if (label.includes('kraken') || id.includes('kraken')) return '/images/kraken.webp';
    if (label.includes('lbank') || id.includes('lbank')) return '/images/lbank.webp';
    if (label.includes('pionex') || id.includes('pionex')) return '/images/pionex.webp';
    return null;
  };

  // Filter nodes & links with exact direction and exchange classification
  const getFilteredData = () => {
    if (!graphData || !graphData.nodes || !graphData.links) {
      return { nodes: [], links: [] };
    }

    const targetAddr = graphData.target;
    const nodeMap = new Map();
    graphData.nodes.forEach((n) => nodeMap.set(n.id, n));

    let filteredLinks = graphData.links.filter((l) => {
      const val = l.value || 0;
      if (minAmount > 0 && val < minAmount) return false;

      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

      const isTargetSource = srcId === targetAddr;
      const isTargetDest = tgtId === targetAddr;

      // In bubblemap.py, if total_received >= total_sent, edge is counterparty -> target (incoming to target)
      // If total_sent > total_received, edge is target -> counterparty (outgoing from target)
      const isIncoming = isTargetDest || (l.net_received || 0) >= (l.net_sent || 0);

      const counterpartyId = isTargetSource ? tgtId : srcId;
      const cpNode = nodeMap.get(counterpartyId);

      const isExchange = cpNode
        ? (cpNode.group === 'exchange' || !!getExchangeImageUrl(cpNode))
        : false;

      if (isExchange) {
        if (isIncoming && !showExIn) return false;
        if (!isIncoming && !showExOut) return false;
      } else {
        if (isIncoming && !showIncoming) return false;
        if (!isIncoming && !showOutgoing) return false;
      }

      return true;
    });

    const connectedNodeIds = new Set();
    filteredLinks.forEach((l) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      connectedNodeIds.add(s);
      connectedNodeIds.add(t);
    });

    let filteredNodes = graphData.nodes
      .filter((n) => n.id === targetAddr || connectedNodeIds.has(n.id))
      .map((n) => ({ ...n }));

    return {
      nodes: filteredNodes,
      links: filteredLinks.map((l) => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        const isIncoming = tgtId === targetAddr || (l.net_received || 0) >= (l.net_sent || 0);
        return {
          ...l,
          source: srcId,
          target: tgtId,
          is_incoming: isIncoming,
        };
      }),
    };
  };

  // D3 Rendering
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const { nodes, links } = getFilteredData();
    const container = svgRef.current.parentElement;
    const width = container.clientWidth || 800;
    const height = 560;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Direction-colored arrow markers: Green for incoming, Red for outgoing
    defs.append('marker')
      .attr('id', 'bm-arrow-in')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L6,0L0,3')
      .attr('fill', '#22c55e');

    defs.append('marker')
      .attr('id', 'bm-arrow-out')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L6,0L0,3')
      .attr('fill', '#ef4444');

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = { zoom, svg };

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-550))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => (d.radius || d.size || 18) + 24));

    simulationRef.current = simulation;

    const hasHighlight = !!highlightNode.trim();
    const hLower = highlightNode.trim().toLowerCase();

    // Draw links - Green for incoming to target, Red for outgoing from target
    const link = g.append('g')
      .attr('class', 'bubble-links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => {
        const isInc = d.is_incoming;
        if (hasHighlight) {
          const srcId = (d.source.id || d.source || '').toLowerCase();
          const tgtId = (d.target.id || d.target || '').toLowerCase();
          const isMatch = srcId.includes(hLower) || tgtId.includes(hLower);
          return isMatch ? (isInc ? '#4ade80' : '#f87171') : (isInc ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)');
        }
        return isInc ? 'rgba(34, 197, 94, 0.38)' : 'rgba(239, 68, 68, 0.38)';
      })
      .attr('stroke-width', (d) => {
        if (hasHighlight) {
          const srcId = (d.source.id || d.source || '').toLowerCase();
          const tgtId = (d.target.id || d.target || '').toLowerCase();
          const isMatch = srcId.includes(hLower) || tgtId.includes(hLower);
          return isMatch ? 2.2 : 0.8;
        }
        return Math.min(2.2, Math.max(0.85, 0.6 + Math.log10((d.value || 10) + 1) * 0.3));
      })
      .attr('marker-end', (d) => (d.is_incoming ? 'url(#bm-arrow-in)' : 'url(#bm-arrow-out)'))
      .attr('stroke-opacity', hasHighlight ? 1 : 0.8);

    // Draw nodes container
    const node = g.append('g')
      .attr('class', 'bubble-nodes')
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

    // 1. TARGET NODE (Center Scanned Wallet)
    const targetNodes = node.filter((d) => d.id === graphData.target || d.group === 'target');
    targetNodes.append('circle')
      .attr('r', (d) => (d.radius || d.size || 24))
      .attr('fill', '#ffffff')
      .attr('stroke', '#a78bfa')
      .attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0 0 14px rgba(167, 139, 250, 0.85))')
      .style('cursor', 'pointer');

    targetNodes.append('circle')
      .attr('r', (d) => (d.radius || d.size || 24) + 6)
      .attr('fill', 'none')
      .attr('stroke', '#c084fc')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.7);

    // 2. EXCHANGE NODES WITH LOGOS
    // Outline around the image: green for incoming, red for outgoing
    const exNodes = node.filter((d) => d.id !== graphData.target && d.group !== 'target' && !!getExchangeImageUrl(d));

    exNodes.each(function (d, i) {
      const r = d.radius || d.size || 20;
      const safeId = `bm-clip-${i}-${(d.id || '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const isInc = (d.received || 0) >= (d.sent || 0) || d.group === 'incoming';
      const outlineColor = isInc ? '#22c55e' : '#ef4444';
      const isMatch = hasHighlight && d.id.toLowerCase().includes(hLower);
      const strokeColor = isMatch ? '#ffffff' : outlineColor;
      const strokeW = isMatch ? 3.5 : 2.5;

      defs.append('clipPath')
        .attr('id', safeId)
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r - 1);

      const gNode = d3.select(this);

      // Base circular plate
      gNode.append('circle')
        .attr('r', r)
        .attr('fill', '#ffffff')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 1.5)
        .style('filter', isMatch ? 'drop-shadow(0 0 10px #ffffff)' : `drop-shadow(0 2px 8px ${outlineColor}66)`)
        .style('cursor', 'pointer');

      // Exchange image tucked flush into circular frame
      gNode.append('image')
        .attr('href', getExchangeImageUrl(d))
        .attr('x', -r)
        .attr('y', -r)
        .attr('width', r * 2)
        .attr('height', r * 2)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('clip-path', `url(#${safeId})`)
        .style('pointer-events', 'none');

      // Outer bezel ring on top with green (incoming) or red (outgoing) outline
      gNode.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeW)
        .style('pointer-events', 'none');
    });

    // 3. ORDINARY MUXED NODES
    // Ordinary muxed: put the 'M' symbol on the bubble and green or red for incoming / outgoing
    const muxNodes = node.filter(
      (d) =>
        d.id !== graphData.target &&
        d.group !== 'target' &&
        !getExchangeImageUrl(d) &&
        (d.id.startsWith('M') || (d.label && d.label.toLowerCase().includes('muxed')))
    );

    muxNodes.each(function (d) {
      const r = d.radius || d.size || 19;
      const isInc = (d.received || 0) >= (d.sent || 0) || d.group === 'incoming';
      const color = isInc ? '#16a34a' : '#dc2626';
      const strokeColor = isInc ? '#4ade80' : '#f87171';
      const isMatch = hasHighlight && d.id.toLowerCase().includes(hLower);
      const gNode = d3.select(this);

      gNode.append('circle')
        .attr('r', r)
        .attr('fill', color)
        .attr('stroke', isMatch ? '#ffffff' : strokeColor)
        .attr('stroke-width', isMatch ? 3.5 : 2)
        .style('filter', isMatch ? 'drop-shadow(0 0 10px #ffffff)' : `drop-shadow(0 2px 8px ${isInc ? '#22c55e' : '#ef4444'}77)`)
        .style('cursor', 'pointer');

      // Centered bold "M" symbol on the bubble
      gNode.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.36em')
        .attr('font-size', `${Math.max(11, Math.round(r * 0.95))}px`)
        .attr('font-weight', '900')
        .attr('font-family', 'var(--font-sans)')
        .attr('fill', '#ffffff')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .text('M');
    });

    // 4. REGULAR NODES (starts with G, non-exchange, non-muxed)
    // Incoming: green (#16a34a / #22c55e), Outgoing: red (#dc2626 / #ef4444)
    const regNodes = node.filter(
      (d) =>
        d.id !== graphData.target &&
        d.group !== 'target' &&
        !getExchangeImageUrl(d) &&
        !d.id.startsWith('M') &&
        !(d.label && d.label.toLowerCase().includes('muxed'))
    );

    regNodes.each(function (d) {
      const r = d.radius || d.size || 18;
      const isInc = (d.received || 0) >= (d.sent || 0) || d.group === 'incoming';
      const color = isInc ? '#16a34a' : '#dc2626';
      const strokeColor = isInc ? '#4ade80' : '#f87171';
      const isMatch = hasHighlight && d.id.toLowerCase().includes(hLower);
      const gNode = d3.select(this);

      gNode.append('circle')
        .attr('r', r)
        .attr('fill', color)
        .attr('stroke', isMatch ? '#ffffff' : strokeColor)
        .attr('stroke-width', isMatch ? 3.5 : 1.8)
        .style('filter', isMatch ? 'drop-shadow(0 0 10px #ffffff)' : `drop-shadow(0 2px 8px ${isInc ? '#22c55e' : '#ef4444'}66)`)
        .style('cursor', 'pointer');
    });

    // Node text labels
    node.append('text')
      .attr('dy', (d) => (d.radius || d.size || 18) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--text-main)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--bg-surface, #0f0e17)')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .text((d) => d.label || d.id.slice(0, 8) + '...');

    const tooltipEl = tooltipRef.current;
    node
      .on('mouseover', (event, d) => {
        if (!tooltipEl) return;
        const img = getExchangeImageUrl(d);
        const isTarget = d.id === graphData.target || d.group === 'target';
        const isInc = (d.received || 0) >= (d.sent || 0) || d.group === 'incoming';
        const isMux = !img && (d.id?.startsWith('M') || d.label?.toLowerCase().includes('muxed'));
        const isEx = !!img || d.group === 'exchange';

        let typeLabel = 'Regular Wallet';
        if (isTarget) typeLabel = 'Target Scanned Wallet';
        else if (isEx) typeLabel = 'Exchange Hot Wallet';
        else if (isMux) typeLabel = 'Muxed Account (M...)';

        const flowBadge = isTarget
          ? ''
          : `<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${
              isInc ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'
            }; color: ${isInc ? '#4ade80' : '#f87171'}; border: 1px solid ${
              isInc ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            };">${isInc ? '↓ INCOMING' : '↑ OUTGOING'}</span>`;

        tooltipEl.style.display = 'block';
        tooltipEl.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              ${img ? `<img src="${img}" style="width: 18px; height: 18px; border-radius: 50%; background: #fff; padding: 1px;" alt="" />` : ''}
              <div style="font-weight: 700; color: #ffffff; font-size: 0.88rem;">${d.label || 'Node'}</div>
            </div>
            ${flowBadge}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); word-break: break-all; margin-bottom: 0.4rem;">
            ${d.id}
          </div>
          <div style="display: flex; gap: 0.75rem; font-size: 0.74rem; border-top: 1px solid var(--border); padding-top: 0.35rem; color: var(--text-muted);">
            <div>Type: <span style="color: var(--text-main); font-weight: 600;">${typeLabel}</span></div>
          </div>
          ${
            d.received !== undefined && d.sent !== undefined
              ? `<div style="display: flex; justify-content: space-between; gap: 0.6rem; font-size: 0.72rem; margin-top: 0.3rem; font-family: var(--font-mono);">
                  <span style="color: #4ade80;">Recv: ${d.received.toLocaleString()} π</span>
                  <span style="color: #f87171;">Sent: ${d.sent.toLocaleString()} π</span>
                </div>`
              : ''
          }
        `;
      })
      .on('mousemove', (event) => {
        if (!tooltipEl) return;
        const rect = container.getBoundingClientRect();
        tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
        tooltipEl.style.top = `${event.clientY - rect.top + 15}px`;
      })
      .on('mouseout', () => {
        if (tooltipEl) tooltipEl.style.display = 'none';
      })
      .on('click', (event) => {
        // Stop event propagation — do not navigate to a new bubble map
        event.stopPropagation();
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData, minAmount, showIncoming, showOutgoing, showExIn, showExOut, highlightNode]);

  const handleZoom = (factor) => {
    if (!zoomRef.current) return;
    const { zoom, svg } = zoomRef.current;
    svg.transition().duration(250).call(zoom.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!zoomRef.current) return;
    const { zoom, svg } = zoomRef.current;
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  };

  return (
    <>
      <div className="card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-title">Interactive Wallet Network BubbleMap</div>
        <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          Visualize transaction flows and wallet ecosystems in real time. Scroll to zoom, drag nodes to reposition, or hover for wallet details.
        </p>

        <div className="search-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <input
            id="bubble-input"
            className="form-control"
            type="text"
            placeholder="Enter Standard Public Key (G...)"
            maxLength={56}
            spellCheck="false"
            autoComplete="off"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadBubbleMap(addressInput);
            }}
            style={{ flex: 1, minWidth: '250px' }}
          />
          <button
            id="btn-render-bubble"
            type="button"
            className="btn btn-primary"
            onClick={() => loadBubbleMap(addressInput)}
          >
            Generate Graph
          </button>
          <button
            id="btn-open-filter-modal"
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsFilterModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.9rem',
              fontSize: '0.88rem',
              borderRadius: '8px',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {isFiltered && (
              <span
                id="filter-active-badge"
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
        </div>

        {loading && (
          <div className="progress-container" style={{ display: 'block' }}>
            <div className="progress-bar" style={{ width: '80%' }} />
          </div>
        )}

        {statusMsg && (
          <div id="bubble-msg" className="muted" style={{ marginTop: '0.35rem', fontSize: '0.82rem' }}>
            {statusMsg}
          </div>
        )}

        {/* Graph Legend & Canvas Header */}
        {graphData && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.75rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Graph Canvas
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="bm-legend-pill">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff', border: '1px solid #a78bfa' }} />
                  Target
                </span>
                <span className="bm-legend-pill">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  Incoming (Green)
                </span>
                <span className="bm-legend-pill">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  Outgoing (Red)
                </span>
                <span className="bm-legend-pill">
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #22c55e', display: 'inline-block' }} />
                  Exchange Outline
                </span>
                <span className="bm-legend-pill">
                  <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#16a34a', color: '#fff', fontSize: '9px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>M</span>
                  Muxed Bubble
                </span>
              </div>
            </div>

            {/* Bubble Canvas Container */}
            <div id="bubble-container" style={{ position: 'relative' }}>
              <div id="bubble-graph" style={{ position: 'relative' }}>
                <svg ref={svgRef} style={{ width: '100%', height: '560px', background: 'var(--bg-surface)', borderRadius: '10px' }} />

                {/* Tooltip */}
                <div
                  ref={tooltipRef}
                  id="graph-tooltip"
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

                {/* Zoom Controls */}
                <div className="zoom-controls">
                  <button type="button" className="zoom-btn" onClick={() => handleZoom(1.3)} title="Zoom In">+</button>
                  <button type="button" className="zoom-btn" onClick={() => handleZoom(0.7)} title="Zoom Out">−</button>
                  <button type="button" className="zoom-btn" onClick={handleResetZoom} title="Reset View">⟲</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State / Search Guide shown before address is scanned */}
        {!graphData && !loading && (
          <div
            id="bubble-empty-state"
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border)',
              borderRadius: '10px',
              marginTop: '1rem',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>🕸️</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Multi-Party Wallet Cluster Visualizer
            </div>
            <div style={{ fontSize: '0.84rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Enter any Pi Network public key (G...) above and click <strong>Generate Graph</strong> to cluster transaction networks.
            </div>
          </div>
        )}
      </div>

      {/* Modern Filter Modal */}
      {isFilterModalOpen && (
        <div
          id="filter-modal-backdrop"
          className="modal-backdrop-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target.id === 'filter-modal-backdrop') setIsFilterModalOpen(false);
          }}
        >
          <div id="filter-modal-dialog" className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <svg width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Graph Filter Controls
                </div>
                <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                  Live interactive graph filters —{' '}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}
                  >
                    reset all
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Directional Transfers */}
              <div className="bm-filter-group">
                <div className="bm-filter-group-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span>Directional Transfers</span>
                </div>
                <div className="bm-filter-grid">
                  <div
                    className={`bm-filter-card incoming ${showIncoming ? 'active' : 'inactive'}`}
                    onClick={() => setShowIncoming(!showIncoming)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setShowIncoming(!showIncoming);
                      }
                    }}
                  >
                    <div className="bm-filter-card-left">
                      <div className="bm-filter-dot in" />
                      <span className="bm-filter-name">Incoming</span>
                    </div>
                    <div className="bm-filter-check">✓</div>
                  </div>

                  <div
                    className={`bm-filter-card outgoing ${showOutgoing ? 'active' : 'inactive'}`}
                    onClick={() => setShowOutgoing(!showOutgoing)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setShowOutgoing(!showOutgoing);
                      }
                    }}
                  >
                    <div className="bm-filter-card-left">
                      <div className="bm-filter-dot out" />
                      <span className="bm-filter-name">Outgoing</span>
                    </div>
                    <div className="bm-filter-check">✓</div>
                  </div>
                </div>
              </div>

              {/* Exchange Transfers */}
              <div className="bm-filter-group">
                <div className="bm-filter-group-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
                  </svg>
                  <span>Exchange Transfers</span>
                </div>
                <div className="bm-filter-grid">
                  <div
                    className={`bm-filter-card incoming ${showExIn ? 'active' : 'inactive'}`}
                    onClick={() => setShowExIn(!showExIn)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setShowExIn(!showExIn);
                      }
                    }}
                  >
                    <div className="bm-filter-card-left">
                      <div className="bm-filter-dot in" />
                      <span className="bm-filter-name">From Exchange</span>
                    </div>
                    <div className="bm-filter-check">✓</div>
                  </div>

                  <div
                    className={`bm-filter-card outgoing ${showExOut ? 'active' : 'inactive'}`}
                    onClick={() => setShowExOut(!showExOut)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setShowExOut(!showExOut);
                      }
                    }}
                  >
                    <div className="bm-filter-card-left">
                      <div className="bm-filter-dot out" />
                      <span className="bm-filter-name">To Exchange</span>
                    </div>
                    <div className="bm-filter-check">✓</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="muted" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Minimum Transaction Amount (π):
                </label>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
                  value={minAmount}
                  min={0}
                  step="0.1"
                  onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="muted" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Highlight Wallet Node:
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
                  placeholder="Paste wallet address (G...)"
                  value={highlightNode}
                  onChange={(e) => setHighlightNode(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ padding: '0.45rem 1rem' }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsFilterModalOpen(false)}
                  style={{ padding: '0.45rem 1.25rem' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
