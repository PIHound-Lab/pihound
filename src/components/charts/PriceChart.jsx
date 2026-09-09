import { useEffect, useRef, useState } from 'react';

export default function PriceChart({ points = [] }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const containerRef = useRef(null);

  if (!points || points.length === 0) {
    return (
      <div className="chart-container-enhanced" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="muted" style={{ fontSize: '0.85rem' }}>Loading price chart data...</span>
      </div>
    );
  }

  const ys = points.map((p) => p.c);
  let ymin = Math.min(...ys);
  let ymax = Math.max(...ys);
  const pad = (ymax - ymin) * 0.1 || 0.005;
  ymin -= pad;
  ymax += pad;

  const yLabels = [];
  for (let i = 0; i <= 3; i++) {
    const v = ymin + (i * (ymax - ymin)) / 3;
    yLabels.push(v.toFixed(4));
  }

  const xp = (i) => 60 + (720 * i) / (points.length - 1 || 1);
  const yp = (v) => 220 - (190 * (v - ymin)) / (ymax - ymin || 1);

  let linePath = '';
  let areaPath = '';

  points.forEach((p, i) => {
    const x = xp(i).toFixed(1);
    const y = yp(p.c).toFixed(1);
    if (i === 0) {
      linePath += `M ${x} ${y}`;
      areaPath += `M ${x} 220 L ${x} ${y}`;
    } else {
      linePath += ` L ${x} ${y}`;
      areaPath += ` L ${x} ${y}`;
    }
  });

  const lastX = xp(points.length - 1).toFixed(1);
  areaPath += ` L ${lastX} 220 Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - 60) / 720));
    const idx = Math.round(ratio * (points.length - 1));
    const pt = points[idx];
    if (pt) {
      const dateStr = new Date(pt.t).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTooltip({
        visible: true,
        x: mouseX,
        y: Math.max(10, yp(pt.c) - 30),
        text: `$${pt.c.toFixed(4)} (${dateStr})`,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  return (
    <div
      className="chart-container-enhanced"
      id="chart-wrap"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        id="price-svg"
        width="100%"
        height="100%"
        viewBox="0 0 800 240"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="price-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <line x1="60" y1="30" x2="780" y2="30" stroke="var(--border)" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="60" y1="85" x2="780" y2="85" stroke="var(--border)" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="60" y1="140" x2="780" y2="140" stroke="var(--border)" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="60" y1="195" x2="780" y2="195" stroke="var(--border)" strokeOpacity="0.4" strokeWidth="1" />

        {/* Y-axis Labels */}
        <text id="y-lbl-4" x="52" y="34" fill="var(--text-dim)" fontSize="11" fontFamily="monospace" textAnchor="end">
          ${yLabels[3] || '0.8800'}
        </text>
        <text id="y-lbl-3" x="52" y="89" fill="var(--text-dim)" fontSize="11" fontFamily="monospace" textAnchor="end">
          ${yLabels[2] || '0.8600'}
        </text>
        <text id="y-lbl-2" x="52" y="144" fill="var(--text-dim)" fontSize="11" fontFamily="monospace" textAnchor="end">
          ${yLabels[1] || '0.8400'}
        </text>
        <text id="y-lbl-1" x="52" y="199" fill="var(--text-dim)" fontSize="11" fontFamily="monospace" textAnchor="end">
          ${yLabels[0] || '0.8200'}
        </text>

        {/* Paths */}
        <path id="svg-area" fill="url(#price-grad)" d={areaPath} />
        <path
          id="svg-line"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="3"
          d={linePath}
          style={{ filter: 'drop-shadow(0 0 6px rgba(167, 139, 250, 0.6))' }}
        />
      </svg>

      {tooltip.visible && (
        <div
          id="chart-tt"
          className="chart-tooltip"
          style={{
            display: 'block',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
