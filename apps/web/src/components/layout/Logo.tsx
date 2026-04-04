import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

const SIZES = {
  sm: { width: 110, height: 28 },
  md: { width: 150, height: 38 },
  lg: { width: 190, height: 48 },
  xl: { width: 240, height: 60 },
};

export function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const { width, height } = SIZES[size];

  const gradients = (id: string) => (
    <defs>
      <linearGradient id={`cloudGrad-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#FF8C00"/>
        <stop offset="45%"  stopColor="#FF5C35"/>
        <stop offset="100%" stopColor="#00C8D4"/>
      </linearGradient>
      <linearGradient id={`daxGrad-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#FF8C00"/>
        <stop offset="100%" stopColor="#FF6A1A"/>
      </linearGradient>
      <linearGradient id={`cloudTextGrad-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#FF5C35"/>
        <stop offset="100%" stopColor="#00C8D4"/>
      </linearGradient>
    </defs>
  );

  // Path de la nube — forma orgánica, outline puro
  const cloudPath = (gradId: string, sw = 3.2) => (
    <path
      d="M 10 36
         Q 2 36 2 27
         Q 2 19 10 18
         Q 11 10 19 9
         Q 24 3 32 4
         Q 42 2 45 11
         Q 52 11 55 19
         Q 61 20 60 28
         Q 60 37 52 37
         L 10 37 Z"
      fill="none"
      stroke={`url(#cloudGrad-${gradId})`}
      strokeWidth={sw}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );

  if (variant === 'icon') {
    return (
      <svg width={height} height={height} viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {gradients('icon')}
        <g transform="translate(1, 2)">
          {cloudPath('icon', 3.5)}
        </g>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox="0 0 210 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {gradients('full')}

      {/* Nube */}
      <g transform="translate(1, 3)">
        {cloudPath('full', 3.2)}
      </g>

      {/* "Dax" — naranja cálido */}
      <text
        x="72" y="36"
        fontFamily="Outfit, system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="url(#daxGrad-full)"
        letterSpacing="-0.5"
      >
        Dax
      </text>

      {/* "cloud" — coral a cyan */}
      <text
        x="122" y="36"
        fontFamily="Outfit, system-ui, sans-serif"
        fontSize="28"
        fontWeight="300"
        fill="url(#cloudTextGrad-full)"
        letterSpacing="-0.5"
      >
        cloud
      </text>
    </svg>
  );
}