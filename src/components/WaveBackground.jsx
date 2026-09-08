import React from 'react';

export default function WaveBackground() {
  return (
    <div className="wave-background-wrapper" aria-hidden="true">
      {/* Top-Left Corner Red Arc */}
      <svg
        className="svg-wave wave-top-left"
        viewBox="0 0 380 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0 0 L 380 0 C 260 50, 140 120, 0 220 Z"
          fill="url(#topRedGradient)"
        />
        <defs>
          <linearGradient id="topRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8000A" />
            <stop offset="100%" stopColor="#E30613" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom Multi-Layer Flowing Waves */}
      <svg
        className="svg-wave wave-bottom"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0 130 C 340 50, 700 170, 1080 90 C 1260 50, 1370 100, 1440 110 L 1440 220 L 0 220 Z"
          fill="#7E0006"
        />
        <path
          d="M 0 150 C 300 70, 660 180, 1040 110 C 1240 70, 1360 130, 1440 130 L 1440 220 L 0 220 Z"
          fill="#B8000A"
        />
        <path
          d="M 0 170 C 260 100, 620 190, 1000 130 C 1220 90, 1350 160, 1440 150 L 1440 220 L 0 220 Z"
          fill="#E30613"
        />
      </svg>
    </div>
  );
}
