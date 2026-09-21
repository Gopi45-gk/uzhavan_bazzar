import React from 'react';

export const BuyerWithGroceriesIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 170 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="buyerSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F6C492" />
            <stop offset="100%" stopColor="#D98A5B" />
          </linearGradient>
          <linearGradient id="groceryBag" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="buyerShirt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="cartBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
        </defs>

        {/* Head & Hair */}
        <g id="buyer-head">
          {/* Hair style */}
          <path
            d="M 64 24 C 64 12, 88 8, 98 16 C 104 12, 114 20, 108 34 C 102 36, 98 34, 98 36 Z"
            fill="#1E1B4B"
          />
          {/* Face */}
          <ellipse cx="86" cy="38" rx="14" ry="16" fill="url(#buyerSkin)" />
          {/* Ears */}
          <ellipse cx="72" cy="40" rx="3.5" ry="5" fill="url(#buyerSkin)" />
          <ellipse cx="100" cy="40" rx="3.5" ry="5" fill="url(#buyerSkin)" />
          {/* Eyes with cheerful spark */}
          <circle cx="81" cy="36" r="2.2" fill="#0F172A" />
          <circle cx="82" cy="35" r="0.7" fill="#FFFFFF" />
          <circle cx="93" cy="36" r="2.2" fill="#0F172A" />
          <circle cx="94" cy="35" r="0.7" fill="#FFFFFF" />
          {/* Eyebrows */}
          <path d="M 77 32 Q 81 29 85 32" stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 89 32 Q 93 29 97 32" stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Cheerful big smile */}
          <path
            d="M 80 44 Q 87 52 94 44"
            stroke="#991B1B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="#DC2626"
          />
          <path d="M 82 44 Q 87 47 92 44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Rosy cheeks */}
          <circle cx="76" cy="42" r="3" fill="#FB7185" opacity="0.6" />
          <circle cx="98" cy="42" r="3" fill="#FB7185" opacity="0.6" />
        </g>

        {/* Neck */}
        <rect x="80" y="52" width="12" height="10" fill="url(#buyerSkin)" rx="2" />

        {/* Buyer Green Polo / Shirt */}
        <path
          d="M 62 62 C 54 64, 48 85, 48 115 L 70 125 L 86 64 Z"
          fill="url(#buyerShirt)"
        />
        <path
          d="M 86 64 L 110 64 C 118 64, 126 80, 128 100 L 110 115 Z"
          fill="url(#buyerShirt)"
        />
        {/* Collar */}
        <path d="M 80 62 L 86 74 L 92 62" stroke="#DCFCE7" strokeWidth="2" fill="none" />

        {/* Thumbs-Up Hand on Left */}
        <g id="thumbs-up-hand" transform="translate(108, 62)">
          {/* Arm */}
          <path d="M 10 32 Q 18 20 18 12" stroke="url(#buyerSkin)" strokeWidth="11" strokeLinecap="round" fill="none" />
          {/* Fist */}
          <circle cx="18" cy="12" r="7" fill="url(#buyerSkin)" />
          {/* Thumbs up thumb */}
          <path d="M 18 10 Q 18 -4 21 -4 Q 24 -4 23 8" stroke="url(#buyerSkin)" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>

        {/* Fresh Produce Overflowing the Bag */}
        <g id="fresh-produce-bag-top">
          {/* Golden Wheat & Greens */}
          <path d="M 40 76 Q 30 52 38 42" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" fill="none" />
          <ellipse cx="36" cy="46" rx="3.5" ry="2" fill="#FACC15" transform="rotate(-30 36 46)" />
          <ellipse cx="40" cy="52" rx="3.5" ry="2" fill="#FACC15" transform="rotate(20 40 52)" />

          {/* Leafy greens */}
          <path d="M 52 64 C 42 45, 62 40, 68 55 Z" fill="#22C55E" />
          <path d="M 58 50 Q 64 62 70 54" stroke="#15803D" strokeWidth="1.5" fill="none" />
          <path d="M 66 60 C 58 40, 78 35, 82 52 Z" fill="#4ADE80" />

          {/* Carrots & Bell Pepper */}
          <polygon points="76,52 86,38 90,44 80,56" fill="#EA580C" />
          <path d="M 88 38 L 92 34" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />

          {/* Red Tomatoes in Bag */}
          <circle cx="58" cy="74" r="10" fill="#EF4444" />
          <circle cx="56" cy="71" r="2" fill="#FFFFFF" opacity="0.6" />
          <polygon points="58,64 60,60 58,62 56,60" fill="#22C55E" />

          <circle cx="74" cy="74" r="11" fill="#DC2626" />
          <circle cx="72" cy="70" r="2" fill="#FFFFFF" opacity="0.6" />
          <polygon points="74,63 76,59 74,61 72,59" fill="#22C55E" />
        </g>

        {/* Brown Kraft Paper Grocery Bag */}
        <g id="grocery-bag-body">
          <polygon
            points="46,80 88,80 82,142 50,140"
            fill="url(#groceryBag)"
          />
          {/* Bag crease folds */}
          <path d="M 46 80 L 52 86 L 82 86 L 88 80" fill="#B45309" opacity="0.6" />
          <line x1="66" y1="86" x2="65" y2="140" stroke="#78350F" strokeWidth="1.5" opacity="0.5" />
          {/* Arm hugging bag */}
          <path d="M 38 95 Q 44 116 70 122" stroke="url(#buyerSkin)" strokeWidth="9" strokeLinecap="round" fill="none" />
        </g>

        {/* Green Circular Badge with Shopping Cart Icon & Leaf */}
        <g id="cart-badge" transform="translate(86, 92)">
          {/* Badge Drop Shadow */}
          <circle cx="22" cy="22" r="22" fill="#000000" opacity="0.16" />
          {/* Circular Badge */}
          <circle cx="20" cy="20" r="20" fill="url(#cartBadgeGrad)" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* Leaf Accents on Badge Right */}
          <path d="M 38 18 C 48 10, 52 24, 42 28 C 38 28, 38 22, 38 18 Z" fill="#22C55E" />
          <path d="M 38 26 C 45 28, 46 38, 38 40 C 35 40, 36 32, 38 26 Z" fill="#4ADE80" />

          {/* White Shopping Cart Icon */}
          <g transform="translate(10, 11) scale(0.9)">
            {/* Handle & basket frame */}
            <path
              d="M 2 4 L 5 4 L 8 16 L 19 16 L 22 7 L 7 7"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Basket wire grid */}
            <line x1="10" y1="10" x2="10" y2="13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="10" x2="14" y2="13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="10" x2="18" y2="13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Wheels */}
            <circle cx="9" cy="19.5" r="2" fill="#FFFFFF" />
            <circle cx="17.5" cy="19.5" r="2" fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    </div>
  );
};
