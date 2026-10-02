import React from 'react';

/** The CareerAgent mark: three steps with a flag on top. Theme-aware via tokens. */
export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
    <path d="M2 19h6v-5h6v-5h6v13H2z" fill="hsl(var(--primary))" />
    <path d="M17 9V2.5" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M17.8 2.5h5.2l-1.6 2 1.6 2h-5.2z" fill="#f5a524" />
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
