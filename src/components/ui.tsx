import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const base = 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none [&_svg]:size-4 [&_svg]:shrink-0';
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:brightness-95',
  secondary: 'bg-card text-foreground border border-input hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'text-destructive hover:bg-destructive/10',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; full?: boolean }> = ({
  variant = 'secondary',
  size = 'md',
  full,
  className = '',
  type = 'button',
  ...props
}) => <button type={type} className={`${base} ${variants[variant]} ${size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-[13px]'} ${full ? 'w-full' : ''} ${className}`} {...props} />;

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }> = ({ label, className = '', type = 'button', ...props }) => (
  <button type={type} aria-label={label} title={label} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer [&_svg]:size-4 ${className}`} {...props} />
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactElement<{ id?: string }> }> = ({ label, hint, children }) => {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {React.cloneElement(children, { id })}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
};

export const inputClass = 'h-9 w-full rounded-lg border border-input bg-card px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export const Toggle: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start justify-between gap-3 cursor-pointer">
    <span>
      <span className="block text-[13px] font-medium text-foreground">{label}</span>
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" />
  </label>
);

export const Chip: React.FC<{ tone?: 'neutral' | 'good' | 'accent'; children: React.ReactNode }> = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium text-foreground ${tone === 'good' ? 'bg-[#dff5e8] dark:bg-[#163526]' : tone === 'accent' ? 'bg-[#e1ecfd] dark:bg-[#1d2a44]' : 'bg-muted'}`}>{children}</span>
);

export const Empty: React.FC<{ title: string; body?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({ title, body, action, icon }) => (
  <div className="flex flex-col items-center px-4 py-8 text-center">
    {icon && <div className="mb-2 text-muted-foreground [&_svg]:size-6">{icon}</div>}
    <p className="text-[13px] font-medium text-foreground">{title}</p>
    {body && <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">{body}</p>}
    {action && <div className="mt-3 flex gap-2">{action}</div>}
  </div>
);
