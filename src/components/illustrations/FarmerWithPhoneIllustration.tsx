import React from 'react';

export const FarmerWithPhoneIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 160 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="farmerSkin2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C97F4E" />
            <stop offset="100%" stopColor="#9C592C" />
          </linearGradient>
          <linearGradient id="phoneScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
        </defs>

        {/* Soft shadow on ground */}
        <ellipse cx="78" cy="205" rx="55" ry="10" fill="#000000" opacity="0.12" />

        {/* Headwear - White Turban Cloth folded around head */}
        <path
          d="M 64 28 C 50 14, 86 6, 94 20 C 102 14, 108 30, 98 42 L 58 40 Z"
          fill="#E2E8F0"
        />
        <path
          d="M 52 38 C 48 54, 52 70, 56 74 L 62 70 L 60 40 Z"
          fill="#CBD5E1"
        />

        {/* Face */}
        <ellipse cx="80" cy="46" rx="15" ry="18" fill="url(#farmerSkin2)" />
        {/* Ears */}
        <ellipse cx="64" cy="48" rx="3.5" ry="5.5" fill="url(#farmerSkin2)" />
        <ellipse cx="96" cy="48" rx="3.5" ry="5.5" fill="url(#farmerSkin2)" />

        {/* Eyebrows */}
        <path d="M 70 38 Q 74 35 78 38" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 82 38 Q 86 35 90 38" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Eyes */}
        <circle cx="74" cy="42" r="2.2" fill="#0F172A" />
        <circle cx="86" cy="42" r="2.2" fill="#0F172A" />
        {/* Nose */}
        <path d="M 80 43 Q 82 48 78 50" stroke="#7C2D12" strokeWidth="1.8" fill="none" />
        {/* Prominent Mustache */}
        <path
          d="M 68 53 C 74 50, 80 52, 80 53 C 80 52, 86 50, 92 53 C 96 58, 88 59, 80 56 C 72 59, 64 58, 68 53 Z"
          fill="#1E293B"
        />
        {/* Smile */}
        <path d="M 74 57 Q 80 62 86 57" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Neck */}
        <rect x="73" y="62" width="14" height="10" fill="url(#farmerSkin2)" rx="2" />

        {/* Torso: Sleeveless Undershirt / Banyan */}
        <path
          d="M 66 70 C 60 70, 60 90, 62 120 L 98 120 C 100 90, 100 70, 94 70 C 88 78, 72 78, 66 70 Z"
          fill="#F1F5F9"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* Left Arm (holding phone up towards viewer) */}
        {/* Upper arm */}
        <path d="M 94 74 Q 106 88 108 102" stroke="url(#farmerSkin2)" strokeWidth="11" strokeLinecap="round" fill="none" />
        {/* Forearm angled up to hold the phone */}
        <path d="M 108 102 Q 112 85 106 68" stroke="url(#farmerSkin2)" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Hand fingers wrapping around phone */}
        <circle cx="106" cy="66" r="6" fill="url(#farmerSkin2)" />
        <ellipse cx="100" cy="62" rx="4" ry="7" fill="url(#farmerSkin2)" transform="rotate(-20 100 62)" />

        {/* Smartphone */}
        <rect
          x="96"
          y="32"
          width="34"
          height="54"
          rx="6"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="2"
        />
        {/* Screen */}
        <rect
          x="98.5"
          y="35"
          width="29"
          height="48"
          rx="4"
          fill="url(#phoneScreenGrad)"
        />
        {/* App items UI on screen */}
        <rect x="102" y="38" width="22" height="4" rx="2" fill="#0284C7" />
        <rect x="102" y="45" width="22" height="3" rx="1.5" fill="#38BDF8" />
        <rect x="102" y="51" width="16" height="3" rx="1.5" fill="#38BDF8" />
        <rect x="102" y="58" width="22" height="8" rx="2" fill="#22C55E" opacity="0.8" />
        <rect x="102" y="69" width="22" height="8" rx="2" fill="#F59E0B" opacity="0.8" />

        {/* Right Arm (resting at side) */}
        <path d="M 64 74 Q 52 92 50 114" stroke="url(#farmerSkin2)" strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="116" r="5.5" fill="url(#farmerSkin2)" />

        {/* Traditional White Dhoti / Lungi with folds */}
        <path
          d="M 60 118 L 100 118 L 98 168 C 88 174, 72 174, 62 168 Z"
          fill="#F8FAFC"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        {/* Fold lines */}
        <path d="M 72 118 L 74 168" stroke="#CBD5E1" strokeWidth="1.5" />
        <path d="M 84 118 L 82 168" stroke="#CBD5E1" strokeWidth="1.5" />
        <path d="M 63 158 Q 78 168 97 158" stroke="#94A3B8" strokeWidth="1.2" fill="none" />

        {/* Legs */}
        <rect x="68" y="166" width="8" height="32" rx="3" fill="url(#farmerSkin2)" />
        <rect x="84" y="166" width="8" height="32" rx="3" fill="url(#farmerSkin2)" />

        {/* Sandals / Slippers */}
        <ellipse cx="72" cy="198" rx="8" ry="4" fill="#334155" />
        <path d="M 68 196 L 76 196" stroke="#0F172A" strokeWidth="2" />
        <ellipse cx="88" cy="198" rx="8" ry="4" fill="#334155" />
        <path d="M 84 196 L 92 196" stroke="#0F172A" strokeWidth="2" />
      </svg>
    </div>
  );
};
