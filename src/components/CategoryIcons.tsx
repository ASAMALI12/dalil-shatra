import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. Doctor Icon (Matching the doctor with stethoscope and blue shirt)
export const DoctorIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background Glow / Circle */}
    <circle cx="32" cy="32" r="30" fill="#E0F2FE" />
    {/* Body / Coat */}
    <path d="M18 54C18 43 24 38 32 38C40 38 46 43 46 54V56H18V54Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Shirt */}
    <path d="M28 38L32 46L36 38H28Z" fill="#0284C7" />
    {/* Neck */}
    <rect x="29" y="32" width="6" height="8" fill="#FBCFE8" />
    {/* Head */}
    <circle cx="32" cy="22" r="10" fill="#FED7AA" />
    {/* Hair */}
    <path d="M22 20C22 14 26 10 32 10C38 10 42 14 42 20C42 20 40 18 36 18C32 18 30 19 28 19C25 19 23 20 22 20Z" fill="#1E293B" />
    {/* Stethoscope */}
    <path d="M25 39V44C25 47 28 50 32 50C36 50 39 47 39 44V39" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="51" r="2.5" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.5" />
    {/* Eyes & Smile */}
    <circle cx="29" cy="21" r="1" fill="#1E293B" />
    <circle cx="35" cy="21" r="1" fill="#1E293B" />
    <path d="M30 25C31 26 33 26 34 25" stroke="#9A3412" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 2. Clothing & Shopping Icon (Cyan T-Shirt + Pink Shopping Bag)
export const ClothingIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cyan T-shirt on left */}
    <path d="M12 20L19 14L25 18C27 15 33 15 35 18L41 14L48 20L44 26L39 23V46H21V23L16 26L12 20Z" fill="#06B6D4" stroke="#0891B2" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Pink Shopping Bag on right */}
    <rect x="32" y="24" width="22" height="24" rx="4" fill="#F43F5E" stroke="#E11D48" strokeWidth="1.5" />
    {/* Shopping Bag Handle */}
    <path d="M38 24V18C38 15.5 40 13.5 43 13.5C46 13.5 48 15.5 48 18V24" stroke="#FFE4E6" strokeWidth="2.5" strokeLinecap="round" />
    {/* Bag Highlight line */}
    <line x1="36" y1="32" x2="50" y2="32" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 3. Restaurant Icon (Golden Cloche Food Serving Dish)
export const RestaurantIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Serving Tray Base */}
    <rect x="10" y="44" width="44" height="5" rx="2.5" fill="#EA580C" />
    {/* Cloche Dome */}
    <path d="M14 42C14 26 22 18 32 18C42 18 50 26 50 42H14Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
    {/* Cloche Highlight */}
    <path d="M20 38C20 28 26 23 32 23" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" />
    {/* Top Handle Knob */}
    <circle cx="32" cy="15" r="3.5" fill="#D97706" />
    {/* Subtle Steam lines */}
    <path d="M26 10C27 8 28 8 29 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M35 10C36 8 37 8 38 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 4. Beauty Salon Icon (Pink Silhouette with Sparkles)
export const BeautyIcon: React.FC<IconProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 12C14 18 13 24 16 32C19 40 28 42 34 38C30 36 29 32 30 28C31 24 33 22 34 18C35 14 31 8 24 8C20 8 17 9 16 12Z" fill="#FB7185" stroke="#E11D48" strokeWidth="1.5" />
    {/* Sparkles */}
    <path d="M10 14L11 11L14 10L11 9L10 6L9 9L6 10L9 11L10 14Z" fill="#F43F5E" />
    <path d="M12 28L13 26L15 25L13 24L12 22L11 24L9 25L11 26L12 28Z" fill="#FB7185" />
    <circle cx="38" cy="12" r="2" fill="#FDA4AF" />
  </svg>
);

// 5. Pharmacy Icon (Green Mortar and Pestle with Leaf)
export const PharmacyIcon: React.FC<IconProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Mortar Bowl */}
    <path d="M12 22C12 32 17 38 24 38C31 38 36 32 36 22H12Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
    {/* Base Stand */}
    <rect x="18" y="38" width="12" height="3" rx="1.5" fill="#047857" />
    {/* Pestle Stick */}
    <path d="M34 10L22 26" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
    {/* Herbal Leaf */}
    <path d="M26 12C28 10 32 10 34 12C34 15 31 18 28 17" fill="#34D399" />
  </svg>
);

// 6. Electronics Icon (Blue Smartphone with Water / Circuit Drop)
export const ElectronicsIcon: React.FC<IconProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Phone Body */}
    <rect x="14" y="6" width="20" height="36" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
    {/* Screen */}
    <rect x="17" y="10" width="14" height="24" rx="2" fill="#38BDF8" />
    {/* Tech Drop / Water Logo on Screen */}
    <path d="M24 16C24 16 20 21 20 23C20 25.2 21.8 27 24 27C26.2 27 28 25.2 28 23C28 21 24 16 24 16Z" fill="#FFFFFF" />
    {/* Home Button / Speaker */}
    <circle cx="24" cy="38" r="1.5" fill="#BAE6FD" />
    <line x1="22" y1="8" x2="26" y2="8" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 7. Services Icon (Purple Cog Gear)
export const ServicesIcon: React.FC<IconProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M24 16C19.6 16 16 19.6 16 24C16 28.4 19.6 32 24 32C28.4 32 32 28.4 32 24C32 19.6 28.4 16 24 16Z" fill="#7C3AED" />
    <circle cx="24" cy="24" r="4.5" fill="#EDE9FE" />
    {/* Gear Teeth */}
    <path d="M24 8V12M24 36V40M8 24H12M36 24H40M12.7 12.7L15.5 15.5M32.5 32.5L35.3 35.3M12.7 35.3L15.5 32.5M32.5 15.5L35.3 12.7" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// 8. Other / More Icon (3 Dots inside Circle)
export const OtherIcon: React.FC<IconProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="18" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
    <circle cx="16" cy="24" r="2.5" fill="#475569" />
    <circle cx="24" cy="24" r="2.5" fill="#475569" />
    <circle cx="32" cy="24" r="2.5" fill="#475569" />
  </svg>
);
