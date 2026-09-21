import React from 'react';

export const LanguageIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-[370px] mx-auto flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 380 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="bubbleRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
          <linearGradient id="bubbleBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="bubbleGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="bubbleAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="bubbleTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
          <linearGradient id="bubbleOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="bubbleDarkRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9F1239" />
          </linearGradient>

          {/* Skin tones */}
          <linearGradient id="skinTone1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0A96D" />
            <stop offset="100%" stopColor="#C48043" />
          </linearGradient>
          <linearGradient id="skinTone2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B2713F" />
            <stop offset="100%" stopColor="#8C4B1B" />
          </linearGradient>
          <linearGradient id="skinTone3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F2BA88" />
            <stop offset="100%" stopColor="#D9945B" />
          </linearGradient>
        </defs>

        {/* 1. Speech Bubbles Row */}
        {/* नमस्ते (Hindi/Gujarati/Marathi) */}
        <g id="bubble-namaste" transform="translate(18, 22)">
          <path
            d="M 28 0 C 44 0, 56 8, 56 20 C 56 32, 44 40, 28 40 C 23 40, 18 39, 14 37 L 4 43 L 8 33 C 3 30, 0 25, 0 20 C 0 8, 12 0, 28 0 Z"
            fill="url(#bubbleRed)"
          />
          <text x="28" y="24" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            नमस्ते
          </text>
        </g>

        {/* ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ (Punjabi) */}
        <g id="bubble-punjabi" transform="translate(64, 10)">
          <path
            d="M 26 0 C 40 0, 52 7, 52 18 C 52 28, 40 36, 26 36 C 22 36, 17 35, 13 33 L 4 38 L 7 29 C 3 26, 0 22, 0 18 C 0 7, 12 0, 26 0 Z"
            fill="url(#bubbleBlue)"
          />
          <text x="26" y="21" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            ਸਤਿ ਸ਼੍ਰੀ
          </text>
        </g>

        {/* नमस्कार (Marathi) */}
        <g id="bubble-marathi" transform="translate(116, 18)">
          <path
            d="M 30 0 C 46 0, 60 8, 60 20 C 60 32, 46 40, 30 40 C 25 40, 19 39, 15 37 L 5 43 L 9 33 C 3 30, 0 25, 0 20 C 0 8, 14 0, 30 0 Z"
            fill="url(#bubbleGreen)"
          />
          <text x="30" y="24" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            नमस्कार
          </text>
        </g>

        {/* নমস্কার (Bengali) */}
        <g id="bubble-bengali" transform="translate(190, 20)">
          <path
            d="M 26 0 C 40 0, 52 7, 52 18 C 52 28, 40 36, 26 36 C 22 36, 17 35, 13 33 L 5 38 L 8 29 C 3 26, 0 22, 0 18 C 0 7, 12 0, 26 0 Z"
            fill="url(#bubbleAmber)"
          />
          <text x="26" y="21" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            নমস্কার
          </text>
        </g>

        {/* வணக்கம் (Tamil) */}
        <g id="bubble-tamil" transform="translate(236, 15)">
          <path
            d="M 25 0 C 38 0, 50 7, 50 17 C 50 27, 38 34, 25 34 C 21 34, 16 33, 13 31 L 4 36 L 7 28 C 2 25, 0 21, 0 17 C 0 7, 11 0, 25 0 Z"
            fill="url(#bubbleTeal)"
          />
          <text x="25" y="20" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            வணக்கம்
          </text>
        </g>

        {/* నమస్కారం (Telugu) */}
        <g id="bubble-telugu" transform="translate(280, 22)">
          <path
            d="M 26 0 C 40 0, 52 7, 52 18 C 52 28, 40 36, 26 36 C 22 36, 17 35, 13 33 L 4 38 L 7 29 C 3 26, 0 22, 0 18 C 0 7, 12 0, 26 0 Z"
            fill="url(#bubbleOrange)"
          />
          <text x="26" y="21" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            నమస్కారం
          </text>
        </g>

        {/* നമസ്കാരം (Malayalam) */}
        <g id="bubble-malayalam" transform="translate(322, 26)">
          <path
            d="M 25 0 C 38 0, 50 7, 50 17 C 50 27, 38 34, 25 34 C 21 34, 16 33, 13 31 L 4 36 L 7 28 C 2 25, 0 21, 0 17 C 0 7, 11 0, 25 0 Z"
            fill="url(#bubbleDarkRed)"
          />
          <text x="25" y="20" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            നമസ്കാരം
          </text>
        </g>

        {/* 2. Group of 7 Diverse Indian People standing together */}
        {/* Person 1 (Far Left): Rajasthani / Gujarati Woman in colorful red & green lehenga with chunari */}
        <g id="person-1-woman-left" transform="translate(20, 85)">
          {/* Dupatta/Chunari over head */}
          <path d="M12 18 C8 0, 38 0, 36 18 L44 80 L6 80 Z" fill="#DC2626" />
          <path d="M10 24 C14 10, 34 10, 38 24" stroke="#FDE047" strokeWidth="2.5" fill="none" />
          {/* Face */}
          <ellipse cx="24" cy="22" rx="9" ry="10" fill="url(#skinTone3)" />
          {/* Hair */}
          <path d="M15 20 C17 14, 31 14, 33 20 Z" fill="#1E293B" />
          {/* Red Bindi */}
          <circle cx="24" cy="18" r="1.5" fill="#DC2626" />
          {/* Eyes & smile */}
          <circle cx="21" cy="22" r="1" fill="#0F172A" />
          <circle cx="27" cy="22" r="1" fill="#0F172A" />
          <path d="M22 26 Q24 28 26 26" stroke="#0F172A" strokeWidth="0.8" fill="none" />
          {/* Choli (Blouse) */}
          <path d="M16 34 L32 34 L34 50 L14 50 Z" fill="#15803D" />
          {/* Gold Necklace */}
          <path d="M19 35 Q24 40 29 35" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
          {/* Lehenga Skirt (Deep blue/green with gold border) */}
          <path d="M12 50 L36 50 L46 115 L4 115 Z" fill="#1E40AF" />
          <path d="M4 108 L46 108" stroke="#FACC15" strokeWidth="4" />
          <path d="M5 113 L45 113" stroke="#DC2626" strokeWidth="2" />
        </g>

        {/* Person 2: North Indian / Punjabi Man in Yellow Kurta & Red Turban */}
        <g id="person-2-man-punjabi" transform="translate(68, 70)">
          {/* Red Turban */}
          <ellipse cx="28" cy="18" rx="14" ry="12" fill="#DC2626" />
          <path d="M16 18 Q28 10 40 18" stroke="#FDE047" strokeWidth="2" fill="none" />
          {/* Face */}
          <ellipse cx="28" cy="28" rx="9" ry="10" fill="url(#skinTone1)" />
          {/* Beard & Mustache */}
          <path d="M21 30 C21 38, 35 38, 35 30 C35 33, 21 33, 21 30 Z" fill="#1E293B" />
          <path d="M23 29 Q28 32 33 29" stroke="#1E293B" strokeWidth="1.5" fill="none" />
          {/* Eyes */}
          <circle cx="25" cy="26" r="1" fill="#0F172A" />
          <circle cx="31" cy="26" r="1" fill="#0F172A" />
          {/* Yellow Kurta */}
          <path d="M16 40 L40 40 L46 110 L10 110 Z" fill="#EAB308" />
          <path d="M28 40 L28 65" stroke="#CA8A04" strokeWidth="2" />
          {/* White Pajama */}
          <path d="M14 110 L25 110 L24 135 L12 135 Z" fill="#F8FAFC" />
          <path d="M31 110 L42 110 L44 135 L32 135 Z" fill="#F8FAFC" />
        </g>

        {/* Person 3: Woman in Traditional Saree (Off-white / Kasavu / Bengali style) */}
        <g id="person-3-woman-saree" transform="translate(118, 76)">
          {/* Hair Bun */}
          <circle cx="22" cy="18" r="10" fill="#1E293B" />
          {/* Face */}
          <ellipse cx="22" cy="24" rx="8" ry="9" fill="url(#skinTone3)" />
          <circle cx="22" cy="20" r="1.5" fill="#DC2626" />
          <circle cx="19" cy="23" r="1" fill="#0F172A" />
          <circle cx="25" cy="23" r="1" fill="#0F172A" />
          <path d="M20 27 Q22 29 24 27" stroke="#0F172A" strokeWidth="0.8" fill="none" />
          {/* Blouse (Red) */}
          <path d="M14 35 L30 35 L32 48 L12 48 Z" fill="#991B1B" />
          {/* Saree Pallu & Pleats (Cream/off-white with maroon border) */}
          <path d="M12 48 L32 48 L38 125 L8 125 Z" fill="#FEF3C7" />
          {/* Diagonal Saree Drape */}
          <path d="M13 36 L30 65 L26 125 L16 125 Z" fill="#DC2626" opacity="0.9" />
          <path d="M13 36 L30 65" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
        </g>

        {/* Person 4 (CENTER FIGURE - PROMINENT): Farmer with Wooden Hoe / Pickaxe on Shoulder */}
        <g id="person-4-central-farmer" transform="translate(155, 62)">
          {/* Wooden Plow / Hoe Held Across Shoulder */}
          <line x1="-8" y1="28" x2="65" y2="8" stroke="#78350F" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="62" y1="6" x2="72" y2="24" stroke="#78350F" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M68 20 L76 28 L72 32 L64 24 Z" fill="#475569" />

          {/* Farmer Face */}
          <ellipse cx="36" cy="30" rx="12" ry="13" fill="url(#skinTone2)" />
          {/* Hair & Mustache */}
          <path d="M24 24 C26 16, 46 16, 48 24 Z" fill="#1E293B" />
          <circle cx="31" cy="28" r="1.5" fill="#0F172A" />
          <circle cx="41" cy="28" r="1.5" fill="#0F172A" />
          {/* Big friendly mustache */}
          <path d="M28 35 C32 33, 36 34, 36 35 C36 34, 40 33, 44 35 C46 38, 42 39, 36 37 C30 39, 26 38, 28 35 Z" fill="#0F172A" />
          <path d="M33 39 Q36 41 39 39" stroke="#FFFFFF" strokeWidth="1" fill="none" />

          {/* Red Scarf / Angavastram on Neck */}
          <path d="M25 44 C28 42, 44 42, 47 44 L48 65 L44 68 L28 68 L24 65 Z" fill="#DC2626" />

          {/* White Shirt / Kurta */}
          <path d="M20 48 L52 48 L58 100 L14 100 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          {/* Arm holding the wooden hoe */}
          <path d="M50 52 Q62 48 58 35 Q52 35 48 48" fill="url(#skinTone2)" />
          <circle cx="58" cy="34" r="5" fill="url(#skinTone2)" />

          {/* Green Border Cotton Dhoti / Veshti */}
          <path d="M18 100 L54 100 L50 148 L22 148 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
          <path d="M34 100 L34 148" stroke="#16A34A" strokeWidth="4" />
          <path d="M22 144 L50 144" stroke="#16A34A" strokeWidth="3" />

          {/* Bare legs & Brown Sandals */}
          <rect x="25" y="148" width="6" height="16" fill="url(#skinTone2)" rx="2" />
          <rect x="41" y="148" width="6" height="16" fill="url(#skinTone2)" rx="2" />
          <path d="M23 162 L33 162 L32 166 L23 166 Z" fill="#78350F" />
          <path d="M39 162 L49 162 L48 166 L39 166 Z" fill="#78350F" />
        </g>

        {/* Person 5: South Indian Farmer / Man in Veshti and White Shirt */}
        <g id="person-5-south-farmer" transform="translate(225, 70)">
          {/* Hair & Mustache */}
          <ellipse cx="24" cy="22" rx="10" ry="11" fill="url(#skinTone2)" />
          <path d="M14 17 C16 10, 32 10, 34 17 Z" fill="#1E293B" />
          <circle cx="20" cy="21" r="1.2" fill="#0F172A" />
          <circle cx="28" cy="21" r="1.2" fill="#0F172A" />
          <path d="M18 27 Q24 30 30 27" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Vibhuti / Tilak */}
          <line x1="20" y1="14" x2="28" y2="14" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="24" cy="14" r="1" fill="#DC2626" />

          {/* White Shirt & Angavastram with Gold border */}
          <path d="M12 35 L36 35 L40 88 L8 88 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          {/* Shawl across shoulder */}
          <path d="M14 36 L24 88 L18 88 L8 36 Z" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />

          {/* Traditional Mundu / Veshti */}
          <path d="M12 88 L36 88 L34 135 L14 135 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
          <path d="M32 88 L30 135" stroke="#EAB308" strokeWidth="3" />
        </g>

        {/* Person 6: Man in Rust / Ochre Kurta */}
        <g id="person-6-man-orange" transform="translate(268, 72)">
          <ellipse cx="20" cy="20" rx="9" ry="10" fill="url(#skinTone1)" />
          <path d="M11 15 C13 9, 27 9, 29 15 Z" fill="#1E293B" />
          <circle cx="17" cy="19" r="1" fill="#0F172A" />
          <circle cx="23" cy="19" r="1" fill="#0F172A" />
          <path d="M17 25 Q20 27 23 25" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Orange/Brown Kurta */}
          <path d="M10 32 L30 32 L34 100 L6 100 Z" fill="#EA580C" />
          {/* White Pyjama */}
          <path d="M10 100 L28 100 L26 130 L12 130 Z" fill="#F8FAFC" />
        </g>

        {/* Person 7 (Far Right): Woman in Green & Red Saree */}
        <g id="person-7-woman-right" transform="translate(300, 80)">
          {/* Saree Pallu over shoulder */}
          <path d="M14 18 C10 0, 36 0, 36 18 L42 80 L8 80 Z" fill="#DC2626" />
          <ellipse cx="24" cy="22" rx="8" ry="9" fill="url(#skinTone3)" />
          <circle cx="24" cy="18" r="1.5" fill="#DC2626" />
          <circle cx="21" cy="22" r="1" fill="#0F172A" />
          <circle cx="27" cy="22" r="1" fill="#0F172A" />
          <path d="M22 26 Q24 28 26 26" stroke="#0F172A" strokeWidth="0.8" fill="none" />
          {/* Saree (Teal green and gold) */}
          <path d="M12 40 L36 40 L42 120 L8 120 Z" fill="#0F766E" />
          <path d="M8 112 L42 112" stroke="#FACC15" strokeWidth="3.5" />
          <path d="M14 40 L34 120" stroke="#DC2626" strokeWidth="4" />
        </g>
      </svg>
    </div>
  );
};
