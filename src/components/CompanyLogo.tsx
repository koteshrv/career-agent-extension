import React, { useState, useEffect } from "react";
import { companyInitials, monogramHue, guessCompanyDomains } from "../utils/company";

interface CompanyLogoProps {
  name: string;
  size?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function CompanyLogo({ name, size = 28, className = "", fallbackIcon }: CompanyLogoProps) {
  const [error, setError] = useState(false);
  const [domainIndex, setDomainIndex] = useState(0);

  useEffect(() => {
    setError(false);
    setDomainIndex(0);
  }, [name]);

  const domains = guessCompanyDomains(name);
  const currentDomain = domains[domainIndex];
  
  // Use Google Favicons matching career-agent-web
  const src = currentDomain ? `https://www.google.com/s2/favicons?domain=${currentDomain}&sz=128` : "";

  const initials = companyInitials(name);
  const hue = monogramHue(name);

  const hasWidth = className.includes('w-') || className.includes('w:');
  const hasHeight = className.includes('h-') || className.includes('h:');
  const inlineStyle: React.CSSProperties = {
    backgroundColor: (error || !currentDomain) ? `hsl(${hue}, 65%, 20%)` : 'transparent',
    minWidth: !hasWidth ? size : undefined,
    width: !hasWidth ? size : undefined,
    height: !hasHeight ? size : undefined,
  };

  return (
    <div 
      className={`relative flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md ${className}`}
      style={inlineStyle}
      title={name}
    >
      {(!error && currentDomain) ? (
        <img
          src={src}
          alt={`${name} logo`}
          className="w-full h-full object-cover"
          onError={() => {
            if (domainIndex < domains.length - 1) {
              setDomainIndex(prev => prev + 1);
            } else {
              setError(true);
            }
          }}
        />
      ) : (
        <span 
          className="font-bold text-white leading-none select-none flex items-center justify-center w-full h-full"
          style={{ fontSize: hasWidth ? '0.6em' : size * 0.45 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
