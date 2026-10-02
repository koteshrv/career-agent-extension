import React from 'react';

/** The CareerAgent mark: a line from one point to a higher one. Theme-aware via tokens. */
export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
    <path d="M5.5 18.5 16 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
    <circle cx="5.5" cy="18.5" r="2.4" fill="hsl(var(--foreground))" />
    <circle cx="17.5" cy="6.5" r="4" fill="hsl(var(--primary))" />
  </svg>
);

export const Logo: React.FC = () => (
  <span className="inline-flex items-center gap-2 text-foreground">
    <Mark />
    <span className="text-[15px] font-medium tracking-[-0.02em] leading-none">
      careeragent<span className="text-muted-foreground">.fyi</span>
    </span>
  </span>
);
