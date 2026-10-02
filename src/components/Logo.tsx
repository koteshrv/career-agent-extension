import React from 'react';

/** The CareerAgent mark: an open C with the agent at its centre, cut from an ink tile. */
export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
    <rect width="24" height="24" rx="6.5" fill="hsl(var(--foreground))" />
    <path d="M15.6 7.4A6 6 0 1 0 15.6 16.6" fill="none" stroke="hsl(var(--background))" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill="hsl(var(--background))" />
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
