import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light' | 'auto';
}

const SIZES = {
  sm: { width: 110, height: 28 },
  md: { width: 150, height: 38 },
  lg: { width: 190, height: 48 },
  xl: { width: 240, height: 60 },
};

function LogoMark({ id, scale = 1 }: { id: string; scale?: number }) {
  const s = scale;
  return (
    <>
      <defs>
        <linearGradient id={`lg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#3B5FE8"/>
          <stop offset="45%"  stopColor="#8B6EF5"/>
          <stop offset="100%" stopColor="#FF6B47"/>
        </linearGradient>
        <linearGradient id={`lg2-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2B4FD8"/>
          <stop offset="100%" stopColor="#FF5C35"/>
        </linearGradient>
      </defs>

      {/* Nube izquierda — azul */}
      <path
        d={`
          M ${14*s} ${52*s}
          Q ${4*s} ${52*s} ${4*s} ${41*s}
          Q ${4*s} ${31*s} ${13*s} ${29*s}
          Q ${14*s} ${20*s} ${23*s} ${17*s}
          Q ${29*s} ${9*s}  ${39*s} ${11*s}
          Q ${44*s} ${4*s}  ${52*s} ${6*s}
          Q ${42*s} ${12*s} ${40*s} ${26*s}
          Q ${27*s} ${26*s} ${25*s} ${37*s}
          Q ${14*s} ${39*s} ${14*s} ${47*s}
          Q ${14*s} ${52*s} ${14*s} ${52*s} Z
        `}
        fill="none"
        stroke={`url(#lg-${id})`}
        strokeWidth={`${5*s}`}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Nube derecha — coral */}
      <path
        d={`
          M ${56*s} ${66*s}
          Q ${44*s} ${66*s} ${44*s} ${55*s}
          Q ${44*s} ${44*s} ${54*s} ${42*s}
          Q ${54*s} ${32*s} ${63*s} ${29*s}
          Q ${69*s} ${20*s} ${80*s} ${22*s}
          Q ${86*s} ${13*s} ${94*s} ${15*s}
          Q ${106*s} ${16*s} ${106*s} ${28*s}
          Q ${106*s} ${38*s} ${97*s} ${40*s}
          Q ${99*s} ${50*s} ${93*s} ${54*s}
          Q ${90*s} ${66*s} ${78*s} ${66*s}
          Q ${70*s} ${66*s} ${64*s} ${62*s}
          Q ${60*s} ${66*s} ${56*s} ${66*s} Z
        `}
        fill="none"
        stroke={`url(#lg2-${id})`}
        strokeWidth={`${5*s}`}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Flecha/check integrada */}
      <path
        d={`M ${44*s} ${48*s} L ${56*s} ${58*s} L ${76*s} ${36*s}`}
        fill="none"
        stroke={`url(#lg2-${id})`}
        strokeWidth={`${5*s}`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

export function Logo({ size = 'md', variant = 'full', theme = 'auto' }: LogoProps) {
  const { width, height } = SIZES[size];
  const daxColor   = theme === 'light' ? '#1E3A8A' : '#FFFFFF';
  const cloudColor = '#FF6B47';

  if (variant === 'icon') {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 112 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Daxcloud"
      >
        <LogoMark id={`icon-${size}`} scale={0.65} />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Daxcloud"
    >
      <defs>
        <linearGradient id={`lf-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#3B5FE8"/>
          <stop offset="45%"  stopColor="#8B6EF5"/>
          <stop offset="100%" stopColor="#FF6B47"/>
        </linearGradient>
        <linearGradient id={`lf2-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2B4FD8"/>
          <stop offset="100%" stopColor="#FF5C35"/>
        </linearGradient>
      </defs>

      {/* Ícono — escala 0.44 para caber en 52px de alto */}
      <g transform="scale(0.44) translate(0, -6)">
        {/* Nube izquierda */}
        <path d="M14 52Q4 52 4 41Q4 31 13 29Q14 20 23 17Q29 9 39 11Q44 4 52 6Q42 12 40 26Q27 26 25 37Q14 39 14 47Q14 52 14 52Z"
          fill="none" stroke={`url(#lf-${size})`} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Nube derecha */}
        <path d="M56 66Q44 66 44 55Q44 44 54 42Q54 32 63 29Q69 20 80 22Q86 13 94 15Q106 16 106 28Q106 38 97 40Q99 50 93 54Q90 66 78 66Q70 66 64 62Q60 66 56 66Z"
          fill="none" stroke={`url(#lf2-${size})`} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Check */}
        <path d="M44 48L56 58L76 36"
          fill="none" stroke={`url(#lf2-${size})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Texto "Dax" */}
      <text
        x="54" y="37"
        fontFamily="Inter, Outfit, system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill={daxColor}
        letterSpacing="-0.8"
      >Dax</text>

      {/* Texto "cloud" */}
      <text
        x="103" y="37"
        fontFamily="Inter, Outfit, system-ui, sans-serif"
        fontSize="28"
        fontWeight="400"
        fill={cloudColor}
        letterSpacing="-0.5"
      >cloud</text>
    </svg>
  );
}
