import React from 'react';

/** The CareerAgent mark: an index of rows with the agent's cursor on the active one. Theme-aware via tokens. */
export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
    <rect width="24" height="24" rx="6" fill="hsl(var(--foreground))" />
    <rect x="6" y="6.5" width="12" height="2.6" rx="1.3" fill="hsl(var(--background))" />
    <rect x="6" y="10.7" width="7" height="2.6" rx="1.3" fill="hsl(var(--background))" />
    <rect x="14.6" y="10.2" width="3.6" height="3.6" rx="1" fill="hsl(var(--primary))" />
    <rect x="6" y="14.9" width="12" height="2.6" rx="1.3" fill="hsl(var(--background))" />
  </svg>
);

export const Logo: React.FC = () => (
  <span className="inline-flex items-center gap-2 text-foreground">
    <Mark />
    <span className="text-[15px] font-semibold tracking-[-0.02em] leading-none">CareerAgent</span>
  </span>
);
