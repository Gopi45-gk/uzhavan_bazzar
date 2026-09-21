import React from 'react';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const UzhavanBazzarLogo: React.FC<LogoProps> = ({
  className = '',
  width = 352,
  height = 281,
}) => {
  return (
    <div
      id="uzhavan-bazzar-logo-root"
      className={`flex flex-col items-center select-none ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 352 281"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Gradient definitions */}
          <linearGradient id="skyGrad" x1="176" y1="20" x2="176" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="60%" stopColor="#F0FDF4" />
            <stop offset="100%" stopColor="#FEF3C7" />
          </linearGradient>

          <linearGradient id="sunRays" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="hillGreen1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          <linearGradient id="hillGreen2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>

          <linearGradient id="cropRow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#84CC16" />
          </linearGradient>

          <linearGradient id="farmerSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D98A5B" />
            <stop offset="100%" stopColor="#B46337" />
          </linearGradient>

          <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          <linearGradient id="tomatoGrad" x1="30%" y1="20%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="70%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="brinjalGrad" x1="20%" y1="20%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#7E22CE" />
            <stop offset="80%" stopColor="#4A044E" />
            <stop offset="100%" stopColor="#2E1065" />
          </linearGradient>

          <linearGradient id="cabbageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="60%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          <linearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="60%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          {/* Clip path for the circular illustration */}
          <clipPath id="circleClip">
            <circle cx="176" cy="100" r="82" />
          </clipPath>
        </defs>

        {/* Outer Circular Border Outline */}
        <circle
          cx="176"
          cy="100"
          r="83.5"
          stroke="#2E7D32"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Circular Artwork clipped inside */}
        <g clipPath="url(#circleClip)">
          {/* Sky background */}
          <rect x="90" y="15" width="175" height="175" fill="url(#skyGrad)" />

          {/* Sun & Rays */}
          <g id="sun" transform="translate(198, 52)">
            {/* Sun Rays */}
            <line x1="0" y1="-14" x2="0" y2="-19" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="-10" x2="14" y2="-14" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="0" x2="19" y2="0" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="10" x2="14" y2="14" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="-10" y1="-10" x2="-14" y2="-14" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="-14" y1="0" x2="-19" y2="0" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            {/* Sun Core */}
            <circle cx="0" cy="0" r="9" fill="url(#sunRays)" />
          </g>

          {/* Far hills */}
          <path
            d="M100 130 C130 90, 180 85, 230 100 C250 105, 265 115, 270 125 L270 190 L90 190 Z"
            fill="url(#hillGreen1)"
          />

          {/* Small Village Farm House on the Hill */}
          <g id="farm-house" transform="translate(225, 78)">
            {/* House body */}
            <polygon points="0,12 12,12 12,5 0,5" fill="#FFFFFF" />
            <polygon points="0,5 6,0 12,5" fill="#DC2626" />
            <rect x="4" y="7" width="4" height="5" fill="#78350F" />
            {/* Tree beside house */}
            <circle cx="-3" cy="6" r="4" fill="#15803D" />
            <rect x="-3.5" y="8" width="1" height="4" fill="#78350F" />
          </g>

          {/* Near Terraced Green Hills & Crop Contours */}
          <path
            d="M140 145 C175 110, 220 115, 265 130 L270 190 L130 190 Z"
            fill="url(#hillGreen2)"
          />
          {/* Contour Lines of Crop Rows */}
          <path
            d="M152 140 C185 118, 225 125, 260 138"
            stroke="#FEF08A"
            strokeWidth="3.5"
            fill="none"
          />
          <path
            d="M165 148 C195 128, 235 135, 262 148"
            stroke="#FDE047"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M178 158 C205 140, 240 148, 264 160"
            stroke="#A3E635"
            strokeWidth="4.5"
            fill="none"
          />

          {/* The Farmer Illustration */}
          <g id="farmer" transform="translate(136, 68)">
            {/* Hoe Wooden Handle */}
            <line
              x1="-38"
              y1="-15"
              x2="28"
              y2="42"
              stroke="#78350F"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Hoe Metal Blade */}
            <path
              d="M-38 -15 L-48 -8 L-44 -2 L-34 -10 Z"
              fill="#64748B"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Farmer Body & Shirt */}
            <path
              d="M-12 60 C-10 40, 3 36, 12 36 C22 36, 34 40, 36 60 Z"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            {/* Kurta Collar & Placket */}
            <path d="M12 36 L12 50" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M7 38 L12 43 L17 38" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />

            {/* Farmer Arm holding the tool */}
            <path
              d="M-2 42 C-8 44, -14 38, -6 32 C0 28, 8 36, 6 42"
              fill="url(#farmerSkin)"
            />
            {/* Hand grasping handle */}
            <circle cx="2" cy="34" r="5.5" fill="url(#farmerSkin)" />

            {/* Farmer Neck */}
            <rect x="8" y="27" width="8" height="10" fill="url(#farmerSkin)" rx="2" />

            {/* Farmer Face */}
            <ellipse cx="12" cy="18" rx="13" ry="14" fill="url(#farmerSkin)" />

            {/* Ears */}
            <ellipse cx="-1" cy="18" rx="2.5" ry="4" fill="url(#farmerSkin)" />
            <ellipse cx="25" cy="18" rx="2.5" ry="4" fill="url(#farmerSkin)" />

            {/* Farmer Eyes & Smile */}
            <circle cx="8" cy="16" r="1.5" fill="#1E293B" />
            <circle cx="16" cy="16" r="1.5" fill="#1E293B" />
            {/* Eyebrows */}
            <path d="M6 13 Q8 11 11 13" stroke="#1E293B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M14 13 Q16 11 18 13" stroke="#1E293B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Nose */}
            <path d="M12 16 Q13 19 12 20" stroke="#9A3412" strokeWidth="1.2" fill="none" />
            {/* Big friendly Mustache */}
            <path
              d="M6 22 C9 20, 12 21, 12 22 C12 21, 15 20, 18 22 C20 24, 18 25, 14 24 C12 23, 12 23, 10 24 C6 25, 4 24, 6 22 Z"
              fill="#1E293B"
            />
            {/* Cheerful Smile */}
            <path
              d="M8.5 24.5 Q12 27.5 15.5 24.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* White Turban (Thalapaav) */}
            <path
              d="M-3 12 C-4 4, 3 -3, 12 -3 C21 -3, 28 4, 27 12 C26 7, 20 4, 12 4 C4 4, -2 7, -3 12 Z"
              fill="#F8FAFC"
            />
            <path
              d="M-2 11 C2 3, 22 2, 26 11 C23 7, 18 5, 12 5 C6 5, 1 7, -2 11 Z"
              fill="#F1F5F9"
            />
            <path
              d="M2 3 Q12 -5 22 3"
              stroke="#E2E8F0"
              strokeWidth="2"
              fill="none"
            />
            {/* Turban Knot / Wrap folds */}
            <ellipse cx="12" cy="3" rx="14" ry="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <path d="M4 4 Q12 7 20 4" stroke="#CBD5E1" strokeWidth="1" fill="none" />
          </g>

          {/* Golden Wheat Stalks on Left */}
          <g id="wheat-stalks" transform="translate(108, 118)">
            <path d="M12 35 Q10 15 0 0" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Grains */}
            <ellipse cx="-1" cy="4" rx="3.5" ry="2" transform="rotate(-30 -1 4)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="4" cy="7" rx="3.5" ry="2" transform="rotate(30 4 7)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="2" cy="12" rx="3.5" ry="2" transform="rotate(-30 2 12)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="7" cy="15" rx="3.5" ry="2" transform="rotate(30 7 15)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="5" cy="20" rx="3.5" ry="2" transform="rotate(-30 5 20)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="10" cy="23" rx="3.5" ry="2" transform="rotate(30 10 23)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />

            <path d="M22 40 Q24 20 18 5" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="17" cy="8" rx="3" ry="1.8" transform="rotate(-20 17 8)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="22" cy="11" rx="3" ry="1.8" transform="rotate(30 22 11)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="19" cy="16" rx="3" ry="1.8" transform="rotate(-20 19 16)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
            <ellipse cx="24" cy="19" rx="3" ry="1.8" transform="rotate(30 24 19)" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
          </g>

          {/* Fresh Vegetables Bounty in Foreground */}
          <g id="fresh-vegetables">
            {/* Cabbage / Lettuce Base on Left Center */}
            <g transform="translate(150, 125)">
              <circle cx="16" cy="16" r="16" fill="url(#cabbageGrad)" />
              {/* Leaf ribs and folds */}
              <path d="M6 10 C12 6, 20 6, 26 12" stroke="#DCFCE7" strokeWidth="1.5" fill="none" />
              <path d="M16 32 C12 24, 12 16, 16 10" stroke="#DCFCE7" strokeWidth="2" fill="none" />
              <path d="M8 20 C14 18, 22 20, 26 24" stroke="#DCFCE7" strokeWidth="1.5" fill="none" />
            </g>

            {/* Yellow Bell Pepper / Capsicum */}
            <g transform="translate(186, 134)">
              <ellipse cx="10" cy="10" rx="9" ry="10" fill="#FACC15" />
              <ellipse cx="7" cy="10" rx="4" ry="9" fill="#EAB308" />
              <path d="M10 1 L9 -2" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Glossy Purple Eggplant (Brinjal) */}
            <g transform="translate(195, 128) rotate(32)">
              <ellipse cx="16" cy="10" rx="18" ry="9" fill="url(#brinjalGrad)" />
              {/* Green Calyx on Stem */}
              <path d="M30 6 Q32 10 30 14 L34 10 Z" fill="#22C55E" />
              <path d="M34 10 L38 10" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
              {/* Shine highlight */}
              <ellipse cx="12" cy="7" rx="8" ry="2" fill="#C084FC" opacity="0.6" />
            </g>

            {/* Plump Red Ripe Tomatoes */}
            <g transform="translate(128, 142)">
              <circle cx="16" cy="16" r="15" fill="url(#tomatoGrad)" />
              {/* Star-shaped Green Stem/Calyx */}
              <path
                d="M16 6 L18 1 L16 3 L14 1 Z M16 4 L21 5 L18 7 Z M16 4 L11 5 L14 7 Z"
                fill="#22C55E"
              />
              <circle cx="16" cy="4" r="1.5" fill="#15803D" />
              {/* Gloss Highlight */}
              <ellipse cx="12" cy="11" rx="4" ry="2" transform="rotate(-30 12 11)" fill="#FFFFFF" opacity="0.5" />
            </g>

            {/* Second Smaller Tomato */}
            <g transform="translate(162, 148)">
              <circle cx="12" cy="12" r="11" fill="url(#tomatoGrad)" />
              <path
                d="M12 4 L14 1 L12 2 L10 1 Z M12 3 L16 4 L13 5 Z M12 3 L8 4 L11 5 Z"
                fill="#22C55E"
              />
              <circle cx="12" cy="3" r="1" fill="#15803D" />
              <ellipse cx="9" cy="8" rx="3" ry="1.5" transform="rotate(-30 9 8)" fill="#FFFFFF" opacity="0.4" />
            </g>

            {/* Fresh Orange Carrots */}
            <g transform="translate(182, 158) rotate(-15)">
              <polygon points="0,4 34,1 36,7 0,8" fill="url(#carrotGrad)" />
              {/* Carrot lines */}
              <line x1="8" y1="4" x2="8" y2="7" stroke="#C2410C" strokeWidth="1" />
              <line x1="16" y1="3" x2="16" y2="6" stroke="#C2410C" strokeWidth="1" />
              <line x1="24" y1="3" x2="24" y2="6" stroke="#C2410C" strokeWidth="1" />
              {/* Green foliage root tip */}
              <path d="M35 4 L42 2 M35 5 L43 5 M35 6 L42 8" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>

          {/* Green Foliage / Leaves Framing the Bottom Arc */}
          <path
            d="M96 150 C110 178, 140 185, 176 185 C212 185, 242 178, 256 150 C240 172, 210 180, 176 180 C142 180, 112 172, 96 150 Z"
            fill="#16A34A"
          />
        </g>

        {/* Orange Map Pin Badge with Rupee Symbol */}
        <g id="rupee-location-pin" transform="translate(236, 102)">
          {/* Subtle drop shadow */}
          <ellipse cx="16" cy="36" rx="6" ry="2.5" fill="#000000" opacity="0.18" />
          {/* Location Pin Shape */}
          <path
            d="M16 0 C7.16 0, 0 7.16, 0 16 C0 27 16 38 16 38 C16 38, 32 27, 32 16 C32 7.16, 24.84 0, 16 0 Z"
            fill="url(#pinGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {/* Inner Circle */}
          <circle cx="16" cy="14" r="9" fill="#FFFFFF" opacity="0.25" />
          {/* Indian Rupee Symbol (₹) in crisp white */}
          <text
            x="16"
            y="19"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="14"
            fontWeight="bold"
            fill="#FFFFFF"
          >
            ₹
          </text>
        </g>

        {/* Brand Name Typography */}
        <g id="brand-text" transform="translate(176, 222)">
          <text
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="32"
            letterSpacing="-0.5"
          >
            <tspan fill="#1B5E20" fontWeight="800">
              Uzhavan
            </tspan>
            <tspan dx="5" fill="#E65100" fontWeight="800">
              Bazzar
            </tspan>
          </text>
        </g>

        {/* Curved Green Leaf Swirl / Underline below "Uzhavan Bazzar" */}
        <g id="leaf-flourish" transform="translate(118, 230)">
          {/* Leaf swoosh stem */}
          <path
            d="M5 4 C35 20, 85 22, 115 4 C95 14, 55 16, 5 4 Z"
            fill="url(#leafGrad)"
          />
          {/* Leaf Body at the end */}
          <path
            d="M80 8 C95 18, 125 18, 130 5 C122 0, 95 0, 80 8 Z"
            fill="url(#leafGrad)"
          />
          {/* Leaf Center Vein */}
          <path
            d="M88 6 Q106 10 124 5"
            stroke="#86EFAC"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
