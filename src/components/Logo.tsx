import React from 'react';

/** The CareerAgent mark: two chevrons climbing, cut from an ink tile. */
export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
    <rect width="24" height="24" rx="6.5" fill="hsl(var(--foreground))" />
    <path d="M7.5 12.5 12 8l4.5 4.5M7.5 17.5 12 13l4.5 4.5" fill="none" stroke="hsl(var(--background))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
