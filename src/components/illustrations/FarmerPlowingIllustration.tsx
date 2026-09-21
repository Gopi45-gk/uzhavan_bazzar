import React from 'react';

export const FarmerPlowingIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-[370px] mx-auto flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 360 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="ox1Body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8B289" />
            <stop offset="50%" stopColor="#C69E72" />
            <stop offset="100%" stopColor="#A87A4F" />
          </linearGradient>
          <linearGradient id="ox2Body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="soilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#543820" />
            <stop offset="50%" stopColor="#402814" />
            <stop offset="100%" stopColor="#543820" />
          </linearGradient>
          <linearGradient id="farmerSkin3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C47A46" />
            <stop offset="100%" stopColor="#8C491A" />
          </linearGradient>
        </defs>

        {/* 1. Plowed Muddy Field Base */}
        <path
          d="M 16 160 C 24 148, 60 148, 120 152 C 180 150, 260 146, 310 155 C 340 160, 345 174, 320 182 C 260 195, 140 196, 50 188 C 15 184, 8 170, 16 160 Z"
          fill="url(#soilGrad)"
        />
        {/* Furrows / tilled mud clods */}
        <path d="M 40 172 Q 80 166 140 174" stroke="#2B1808" strokeWidth="2.5" fill="none" />
        <path d="M 160 170 Q 230 164 300 172" stroke="#2B1808" strokeWidth="2.5" fill="none" />
        <path d="M 80 180 Q 150 178 220 182" stroke="#2B1808" strokeWidth="2" fill="none" />

        {/* Fresh green grass / crop sprouts in field */}
        <g id="field-sprouts">
          <path d="M 30 162 L 32 150 M 32 156 L 36 152" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
          <path d="M 60 166 L 62 154 M 62 160 L 67 156" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 110 168 L 112 156 M 112 162 L 107 158" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
          <path d="M 190 166 L 192 155 M 192 160 L 196 156" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
          <path d="M 270 165 L 272 154 M 272 160 L 276 156" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 315 168 L 317 157 M 317 162 L 313 158" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 2. Wooden Plow (ஏர் / கலப்பை) */}
        {/* Plow Share (Metal point in soil) */}
        <polygon points="98,168 116,168 110,180" fill="#475569" stroke="#1E293B" strokeWidth="1" />
        {/* Main curved wooden plow beam */}
        <path
          d="M 98 168 Q 112 120 180 115 L 285 110"
          stroke="#78350F"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Plow handle held by farmer */}
        <line x1="88" y1="168" x2="68" y2="124" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
        <line x1="64" y1="126" x2="72" y2="122" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />

        {/* Reins / Rope leading from farmer's hand to bullocks */}
        <path d="M 80 120 Q 140 105 280 108" stroke="#FEF08A" strokeWidth="1.8" strokeDasharray="3 2" fill="none" />

        {/* 3. The Farmer */}
        <g id="plowing-farmer" transform="translate(42, 68)">
          {/* Bare legs & feet in mud */}
          <rect x="18" y="74" width="7" height="30" rx="3" fill="url(#farmerSkin3)" />
          <rect x="36" y="72" width="7" height="32" rx="3" fill="url(#farmerSkin3)" />

          {/* Brown Dhoti / Lungi tucked up to knees */}
          <path d="M 12 55 L 48 55 L 46 80 L 14 80 Z" fill="#78350F" />
          <path d="M 28 55 L 28 80" stroke="#542609" strokeWidth="1.5" />

          {/* Torso: Ochre / Orange Kurta Shirt */}
          <path
            d="M 10 20 L 48 20 L 48 58 L 8 58 Z"
            fill="#EA580C"
          />
          {/* Fold in shirt */}
          <path d="M 28 20 L 28 42" stroke="#C2410C" strokeWidth="2" />

          {/* Left Arm holding plow handle */}
          <path d="M 12 24 Q 22 42 30 54" stroke="url(#farmerSkin3)" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Right Arm extended holding reins */}
          <path d="M 38 24 Q 48 38 42 50" stroke="url(#farmerSkin3)" strokeWidth="8" strokeLinecap="round" fill="none" />

          {/* Neck & Head */}
          <rect x="23" y="14" width="8" height="8" fill="url(#farmerSkin3)" rx="2" />
          <ellipse cx="27" cy="10" rx="8" ry="9" fill="url(#farmerSkin3)" />

          {/* Headband / Pagri (Bright Orange) */}
          <ellipse cx="27" cy="5" rx="9" ry="5.5" fill="#F97316" />
          <path d="M 18 6 Q 27 2 36 6" stroke="#FDE047" strokeWidth="1.5" fill="none" />
          {/* Facial features */}
          <circle cx="24" cy="9" r="1.2" fill="#1E293B" />
          <path d="M 22 14 Q 26 17 30 14" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* 4. Bull 2 (Greyish-blue bull behind Bull 1) */}
        <g id="bull-grey" transform="translate(195, 66)">
          {/* Legs behind */}
          <rect x="24" y="60" width="7" height="38" rx="3" fill="#64748B" />
          <rect x="34" y="60" width="7" height="38" rx="3" fill="#94A3B8" />
          <rect x="74" y="60" width="7" height="38" rx="3" fill="#64748B" />
          <rect x="88" y="60" width="7" height="38" rx="3" fill="#94A3B8" />

          {/* Body */}
          <ellipse cx="60" cy="46" rx="46" ry="24" fill="url(#ox2Body)" />
          {/* Hump on shoulder */}
          <ellipse cx="80" cy="22" rx="14" ry="12" fill="url(#ox2Body)" />

          {/* Neck & Head */}
          <path d="M 86 28 Q 106 20 120 38 L 98 52 Z" fill="url(#ox2Body)" />
          <ellipse cx="120" cy="40" rx="14" ry="11" fill="url(#ox2Body)" />
          {/* Horns */}
          <path d="M 112 32 Q 108 14 116 10" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 118 30 Q 120 12 126 8" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Ears */}
          <ellipse cx="110" cy="38" rx="5" ry="3" fill="#94A3B8" transform="rotate(-20 110 38)" />
          {/* Eye */}
          <circle cx="122" cy="38" r="1.8" fill="#1E293B" />
          {/* Muzzle */}
          <ellipse cx="132" cy="45" rx="5" ry="4" fill="#64748B" />
        </g>

        {/* 5. Bull 1 (Tan / Golden Brown bull in front) */}
        <g id="bull-tan" transform="translate(155, 75)">
          {/* Tail */}
          <path d="M 12 42 Q -2 60 4 78" stroke="#A87A4F" strokeWidth="3" fill="none" />
          <ellipse cx="4" cy="79" rx="3" ry="5" fill="#78350F" />

          {/* Back legs */}
          <rect x="18" y="58" width="8" height="42" rx="3" fill="#8C5C35" />
          <polygon points="18,96 26,96 28,103 18,103" fill="#3B2314" />
          <rect x="30" y="58" width="8" height="42" rx="3" fill="url(#ox1Body)" />
          <polygon points="30,96 38,96 40,103 30,103" fill="#3B2314" />

          {/* Front legs */}
          <rect x="88" y="56" width="8" height="44" rx="3" fill="#8C5C35" />
          <polygon points="88,96 96,96 98,103 88,103" fill="#3B2314" />
          <rect x="100" y="56" width="8" height="44" rx="3" fill="url(#ox1Body)" />
          <polygon points="100,96 108,96 110,103 100,103" fill="#3B2314" />

          {/* Main Bull Body */}
          <ellipse cx="66" cy="42" rx="52" ry="26" fill="url(#ox1Body)" />
          {/* Big Bull Hump (திமில்) */}
          <ellipse cx="94" cy="16" rx="16" ry="14" fill="url(#ox1Body)" />

          {/* Neck & Dewlap folds */}
          <path d="M 94 24 Q 118 16 134 36 L 112 56 Q 96 46 94 24 Z" fill="url(#ox1Body)" />
          <path d="M 104 46 Q 114 62 120 54" stroke="#8C5C35" strokeWidth="2" fill="none" />

          {/* Head */}
          <ellipse cx="134" cy="38" rx="16" ry="12" fill="url(#ox1Body)" />
          {/* Horns curving up */}
          <path d="M 126 28 Q 120 8 132 4" stroke="#543820" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 134 26 Q 134 6 142 2" stroke="#543820" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Drooping Ear */}
          <ellipse cx="122" cy="38" rx="7" ry="4" fill="#8C5C35" transform="rotate(25 122 38)" />
          {/* Eye */}
          <circle cx="136" cy="35" r="2.2" fill="#1E293B" />
          <circle cx="137" cy="34" r="0.7" fill="#FFFFFF" />
          {/* Muzzle & Nose */}
          <ellipse cx="148" cy="44" rx="6" ry="5" fill="#6B4226" />
          <circle cx="147" cy="43" r="1.2" fill="#1E293B" />

          {/* Wooden Yoke (நுகத்தடி) across neck */}
          <rect x="85" y="16" width="48" height="6" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1" transform="rotate(-10 85 16)" />
          {/* Harness straps */}
          <path d="M 94 20 Q 94 40 102 38" stroke="#D97706" strokeWidth="2" fill="none" />
        </g>
      </svg>
    </div>
  );
};
