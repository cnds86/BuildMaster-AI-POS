
import React from 'react';

interface MhxLogoProps {
  className?: string;
  color?: string;
}

export const MhxLogo: React.FC<MhxLogoProps> = ({ className = "w-10 h-10", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MHX Logo"
    >
      {/* Background shape (Optional based on usage, keeping transparent for versatility) */}
      
      {/* M */}
      <path 
        d="M10 80 V20 L30 50 L50 20 V80 H40 V35 L30 55 L20 35 V80 H10Z" 
        fill={color} 
        strokeWidth="0"
      />
      
      {/* H */}
      <path 
        d="M55 80 V20 H65 V45 H80 V20 H90 V80 H80 V55 H65 V80 H55Z" 
        fill={color}
        strokeWidth="0" 
      />
      
      {/* X - Stylized as a cross-brace */}
      <path 
        d="M60 90 L90 90 L75 60 Z" // Bottom triangle
        fill={color} 
        opacity="0.0" // Hidden in this version, keeping clean text
      />
      
      {/* Underline Bar */}
      <rect x="10" y="85" width="80" height="5" rx="1" fill={color} />
    </svg>
  );
};

// Alternative Icon-only version (The Hexagon Bolt)
export const MhxIcon: React.FC<MhxLogoProps> = ({ className = "w-10 h-10", color = "currentColor" }) => {
    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hexagon Outline */}
        <path 
            d="M25 5 L75 5 L95 50 L75 95 L25 95 L5 50 Z" 
            stroke={color} 
            strokeWidth="8" 
            strokeLinejoin="round"
        />
        {/* M Shape Inside */}
        <path 
            d="M30 70 V35 L50 60 L70 35 V70" 
            stroke={color} 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
      </svg>
    );
};
