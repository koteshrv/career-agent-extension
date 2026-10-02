import React from 'react';

/** The CareerAgent mark: three rising steps in the accent. Theme-aware via tokens. */
export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
    <rect x="2" y="14" width="5.5" height="8" rx="1.5" fill="hsl(var(--primary))" />
    <rect x="9.25" y="8" width="5.5" height="14" rx="1.5" fill="hsl(var(--primary))" />
    <rect x="16.5" y="2" width="5.5" height="20" rx="1.5" fill="hsl(var(--primary))" />
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
