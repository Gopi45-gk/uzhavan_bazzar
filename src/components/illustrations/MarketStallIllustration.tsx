import React from 'react';

export const MarketStallIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-[370px] mx-auto flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 350 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="awningGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="awningWhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="woodCrate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="stallCounter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="170" cy="235" rx="140" ry="12" fill="#000000" opacity="0.12" />

        {/* Foliage Plants Behind & Beside Stall */}
        <g id="stall-plants">
          <path d="M 50 170 Q 30 140 50 125 Q 70 140 58 170" fill="#15803D" />
          <path d="M 62 170 Q 45 130 68 115 Q 85 135 70 170" fill="#22C55E" />
          <path d="M 280 180 Q 295 140 280 120 Q 265 140 275 180" fill="#15803D" />
          <path d="M 292 185 Q 312 150 295 130 Q 280 150 288 185" fill="#22C55E" />
        </g>

        {/* 1. Market Stall Structure */}
        {/* Wooden Poles */}
        <rect x="110" y="80" width="8" height="120" rx="2" fill="#78350F" />
        <rect x="250" y="80" width="8" height="120" rx="2" fill="#78350F" />

        {/* Farmer behind counter */}
        <g id="farmer-vendor" transform="translate(156, 75)">
          {/* Orange Turban */}
          <ellipse cx="28" cy="12" rx="14" ry="10" fill="#EA580C" />
          <path d="M 16 12 Q 28 6 40 12" stroke="#FDE047" strokeWidth="2" fill="none" />
          {/* Face & Mustache */}
          <ellipse cx="28" cy="22" rx="10" ry="11" fill="#C97F4E" />
          <circle cx="24" cy="20" r="1.3" fill="#1E293B" />
          <circle cx="32" cy="20" r="1.3" fill="#1E293B" />
          <path d="M 21 26 C 24 24, 28 25, 28 26 C 28 25, 32 24, 35 26 C 37 28, 33 29, 28 27 C 23 29, 19 28, 21 26 Z" fill="#1E293B" />
          {/* White Shirt with Green Scarf */}
          <path d="M 12 34 L 44 34 L 50 75 L 6 75 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <path d="M 14 34 L 24 75 L 20 75 L 10 34 Z" fill="#16A34A" />
          {/* Arm extending forward offering tomato */}
          <path d="M 14 42 Q -8 50 -16 48" stroke="#C97F4E" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="-18" cy="48" r="4.5" fill="#C97F4E" />
          {/* Red tomato in hand */}
          <circle cx="-22" cy="46" r="6" fill="#EF4444" />
          <polygon points="-22,39 -20,37 -22,38 -24,37" fill="#22C55E" />
        </g>

        {/* Wooden Stall Counter Front & Top */}
        <polygon points="100,140 268,140 262,215 106,215" fill="url(#stallCounter)" />
        {/* Wood planks texture */}
        <line x1="102" y1="165" x2="266" y2="165" stroke="#542609" strokeWidth="2" />
        <line x1="104" y1="190" x2="264" y2="190" stroke="#542609" strokeWidth="2" />

        {/* Vegetables displayed on counter & in crates */}
        <g id="counter-vegetables">
          {/* Fresh From Farm Sign hanging */}
          <rect x="254" y="90" width="34" height="42" rx="3" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
          <line x1="264" y1="80" x2="264" y2="90" stroke="#78350F" strokeWidth="1.5" />
          <line x1="278" y1="80" x2="278" y2="90" stroke="#78350F" strokeWidth="1.5" />
          <text x="271" y="104" fill="#FEF3C7" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">FRESH</text>
          <text x="271" y="112" fill="#FEF3C7" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">FROM</text>
          <text x="271" y="120" fill="#FEF3C7" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">FARM</text>

          {/* Crates with Cabbage, Carrots, Tomatoes */}
          {/* Cabbage / Greens stack */}
          <g transform="translate(112, 122)">
            <circle cx="8" cy="8" r="8" fill="#22C55E" />
            <circle cx="20" cy="8" r="8" fill="#16A34A" />
            <circle cx="14" cy="14" r="8" fill="#4ADE80" />
          </g>

          {/* Red Tomatoes pile */}
          <g transform="translate(148, 126)">
            <circle cx="8" cy="8" r="7" fill="#EF4444" />
            <circle cx="18" cy="7" r="7" fill="#DC2626" />
            <circle cx="13" cy="13" r="7" fill="#B91C1C" />
            <circle cx="24" cy="12" r="7" fill="#EF4444" />
          </g>

          {/* Carrots in crate */}
          <g transform="translate(195, 124)">
            <polygon points="4,2 18,14 14,18 0,6" fill="#EA580C" />
            <polygon points="10,0 24,12 20,16 6,4" fill="#F97316" />
            <polygon points="16,0 30,12 26,16 12,4" fill="#EA580C" />
            <line x1="2" y1="4" x2="-4" y2="0" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="2" x2="2" y2="-2" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="2" x2="8" y2="-2" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Wooden crates below counter */}
          {/* Jute sack with potatoes */}
          <g transform="translate(155, 175)">
            <ellipse cx="20" cy="24" rx="18" ry="18" fill="#D97706" />
            <circle cx="12" cy="16" r="4" fill="#CA8A04" />
            <circle cx="20" cy="14" r="4" fill="#EAB308" />
            <circle cx="26" cy="18" r="4" fill="#CA8A04" />
          </g>

          {/* Crate with Red Onions */}
          <g transform="translate(198, 185)">
            <rect x="0" y="0" width="38" height="24" rx="2" fill="url(#woodCrate)" />
            <circle cx="8" cy="8" r="5" fill="#7E22CE" />
            <circle cx="18" cy="6" r="5" fill="#9333EA" />
            <circle cx="28" cy="8" r="5" fill="#6B21A8" />
            <circle cx="14" cy="14" r="5" fill="#581C87" />
            <circle cx="24" cy="14" r="5" fill="#7E22CE" />
          </g>

          {/* Crate with Yellow Pumpkins / Melons */}
          <g transform="translate(242, 185)">
            <rect x="0" y="0" width="38" height="24" rx="2" fill="url(#woodCrate)" />
            <circle cx="10" cy="8" r="6" fill="#F59E0B" />
            <circle cx="22" cy="7" r="6" fill="#D97706" />
            <circle cx="16" cy="14" r="6" fill="#FBBF24" />
          </g>
        </g>

        {/* Green and White Striped Awning / Canopy Roof */}
        <g id="stall-awning">
          {/* Left triangle overhang */}
          <polygon points="90,82 104,82 96,65" fill="#15803D" />

          {/* Stripes */}
          <polygon points="96,65 116,65 112,82 92,82" fill="url(#awningGreen)" />
          <polygon points="116,65 136,65 132,82 112,82" fill="url(#awningWhite)" />
          <polygon points="136,65 156,65 152,82 132,82" fill="url(#awningGreen)" />
          <polygon points="156,65 176,65 172,82 152,82" fill="url(#awningWhite)" />
          <polygon points="176,65 196,65 192,82 172,82" fill="url(#awningGreen)" />
          <polygon points="196,65 216,65 212,82 192,82" fill="url(#awningWhite)" />
          <polygon points="216,65 236,65 232,82 212,82" fill="url(#awningGreen)" />
          <polygon points="236,65 256,65 252,82 232,82" fill="url(#awningWhite)" />
          <polygon points="256,65 274,65 270,82 252,82" fill="url(#awningGreen)" />

          {/* Scalloped Awning Frill / Border */}
          <path
            d="M 92 82 Q 102 90 112 82 Q 122 90 132 82 Q 142 90 152 82 Q 162 90 172 82 Q 182 90 192 82 Q 202 90 212 82 Q 222 90 232 82 Q 242 90 252 82 Q 262 90 270 82"
            stroke="#15803D"
            strokeWidth="3"
            fill="none"
          />
        </g>

        {/* 2. The Customer with Shopping Cart */}
        <g id="customer-with-cart" transform="translate(56, 92)">
          {/* Customer Head & Body */}
          <ellipse cx="26" cy="18" rx="8" ry="9" fill="#F6C492" />
          <path d="M 18 14 C 18 8, 34 6, 34 16 Z" fill="#1E293B" />
          <circle cx="29" cy="17" r="1.2" fill="#0F172A" />
          <path d="M 28 22 Q 31 24 34 22" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Green Shirt */}
          <path d="M 16 28 L 38 28 L 40 76 L 14 76 Z" fill="#16A34A" />

          {/* Arm holding tomato received from vendor */}
          <path d="M 32 34 Q 54 42 62 48" stroke="#F6C492" strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="64" cy="48" r="4.5" fill="#F6C492" />
          {/* Red tomato in customer's hand */}
          <circle cx="68" cy="48" r="6" fill="#EF4444" />
          <polygon points="68,41 70,39 68,40 66,39" fill="#22C55E" />

          {/* Arm holding cart handle */}
          <path d="M 20 38 Q 14 65 30 76" stroke="#F6C492" strokeWidth="6" strokeLinecap="round" fill="none" />

          {/* Dark Trousers */}
          <rect x="18" y="76" width="9" height="48" rx="2" fill="#1E293B" />
          <rect x="29" y="76" width="9" height="48" rx="2" fill="#334155" />
          {/* Brown Shoes */}
          <ellipse cx="22" cy="125" rx="7" ry="4" fill="#78350F" />
          <ellipse cx="34" cy="125" rx="7" ry="4" fill="#78350F" />

          {/* Shopping Trolley / Cart */}
          <g id="trolley" transform="translate(34, 68)">
            {/* Handle */}
            <line x1="-4" y1="8" x2="2" y2="18" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
            {/* Basket Frame */}
            <polygon points="2,18 42,18 36,46 8,46" fill="#F1F5F9" stroke="#64748B" strokeWidth="2" opacity="0.8" />
            {/* Wire grid */}
            <line x1="12" y1="18" x2="14" y2="46" stroke="#94A3B8" strokeWidth="1.2" />
            <line x1="22" y1="18" x2="22" y2="46" stroke="#94A3B8" strokeWidth="1.2" />
            <line x1="32" y1="18" x2="30" y2="46" stroke="#94A3B8" strokeWidth="1.2" />
            <line x1="4" y1="28" x2="40" y2="28" stroke="#94A3B8" strokeWidth="1.2" />
            <line x1="6" y1="38" x2="38" y2="38" stroke="#94A3B8" strokeWidth="1.2" />

            {/* Produce inside cart */}
            <circle cx="16" cy="24" r="5" fill="#EF4444" />
            <circle cx="24" cy="22" r="5" fill="#22C55E" />
            <circle cx="32" cy="24" r="5" fill="#EA580C" />

            {/* Trolley legs & wheels */}
            <line x1="12" y1="46" x2="8" y2="56" stroke="#475569" strokeWidth="2.5" />
            <line x1="34" y1="46" x2="38" y2="56" stroke="#475569" strokeWidth="2.5" />
            <circle cx="8" cy="56" r="3.5" fill="#0F172A" />
            <circle cx="38" cy="56" r="3.5" fill="#0F172A" />
          </g>
        </g>
      </svg>
    </div>
  );
};
