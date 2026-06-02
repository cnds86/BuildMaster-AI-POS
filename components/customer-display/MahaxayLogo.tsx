/**
 * MAHAXAY Group — Brand Logo (inline SVG)
 * No external image files needed — renders crisp at any resolution.
 *
 * Concept: bold "M" mark inside a hexagonal "construction" badge
 * with subtle blueprint grid background. Colors: gold + navy.
 */

import React from 'react';

export interface MahaxayLogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'mark' | 'horizontal';
}

export const MahaxayLogo: React.FC<MahaxayLogoProps> = ({
  size = 64,
  className = '',
  variant = 'full',
}) => {
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mhx-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <polygon
          points="50,5 92,28 92,72 50,95 8,72 8,28"
          fill="url(#mhx-bg)"
          stroke="#0f172a"
          strokeWidth="2"
        />
        <text
          x="50"
          y="65"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="50"
          fontWeight="900"
          fill="#0f172a"
          letterSpacing="-2"
        >M</text>
      </svg>
    );
  }

  if (variant === 'horizontal') {
    return (
      <svg
        viewBox="0 0 320 80"
        width={size}
        height={(size * 80) / 320}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mhx-h-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        {/* Hexagon mark */}
        <polygon
          points="40,8 73,26 73,54 40,72 7,54 7,26"
          fill="url(#mhx-h-bg)"
          stroke="#0f172a"
          strokeWidth="2"
        />
        <text
          x="40"
          y="50"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="36"
          fontWeight="900"
          fill="#0f172a"
        >M</text>
        {/* Wordmark */}
        <text
          x="90"
          y="42"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="22"
          fontWeight="800"
          fill="#fbbf24"
          letterSpacing="1.5"
        >MAHAXAY</text>
        <text
          x="90"
          y="62"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="500"
          fill="#94a3b8"
          letterSpacing="3"
        >POS · CRM · ERP</text>
      </svg>
    );
  }

  // Full — vertical badge + wordmark
  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mhx-f-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="mhx-f-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer hex */}
      <polygon
        points="110,15 195,65 195,155 110,205 25,155 25,65"
        fill="url(#mhx-f-bg)"
        stroke="#0f172a"
        strokeWidth="3"
      />

      {/* Inner hex with glow */}
      <polygon
        points="110,30 180,70 180,150 110,190 40,150 40,70"
        fill="none"
        stroke="#0f172a"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* M letter */}
      <text
        x="110"
        y="138"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="110"
        fontWeight="900"
        fill="#0f172a"
        letterSpacing="-4"
      >M</text>

      {/* Wordmark under */}
      <text
        x="110"
        y="172"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="#0f172a"
        letterSpacing="2.5"
      >MAHAXAY</text>

      {/* Sub-line */}
      <text
        x="110"
        y="190"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="7"
        fontWeight="500"
        fill="#0f172a"
        opacity="0.7"
        letterSpacing="2"
      >CONSTRUCTION GROUP</text>
    </svg>
  );
};

export default MahaxayLogo;
